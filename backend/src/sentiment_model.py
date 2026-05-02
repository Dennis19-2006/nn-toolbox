"""
Sentiment RNN/LSTM/GRU model with NLTK tokenizer.
Supports binary and multi-class sentiment classification.
"""
import re
import json
import os
import threading
import uuid
import torch
from typing import Dict, List, Optional, Literal

import numpy as np

from src.gradient_utils import register_gradient_hooks, compute_gradient_norms, diagnose_gradients

# ─── Tokenizer ────────────────────────────────────────────────────────────────

class SimpleTokenizer:
    PAD = 0
    UNK = 1

    def __init__(self, max_vocab: int = 10_000, max_len: int = 64):
        self.max_vocab = max_vocab
        self.max_len = max_len
        self.word2idx: Dict[str, int] = {"<PAD>": 0, "<UNK>": 1}
        self.fitted = False

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", "", text)
        return text.split()

    def fit(self, texts: List[str]):
        from collections import Counter
        counter = Counter()
        for t in texts:
            counter.update(self._tokenize(t))
        most_common = counter.most_common(self.max_vocab - 2)
        for word, _ in most_common:
            if word not in self.word2idx:
                self.word2idx[word] = len(self.word2idx)
        self.fitted = True

    def encode(self, texts: List[str]) -> torch.Tensor:
        seqs = []
        for t in texts:
            ids = [self.word2idx.get(w, self.UNK) for w in self._tokenize(t)]
            # pad / truncate
            ids = ids[: self.max_len]
            ids += [self.PAD] * (self.max_len - len(ids))
            seqs.append(ids)
        return torch.tensor(seqs, dtype=torch.long)


# ─── Model ────────────────────────────────────────────────────────────────────

def get_sentiment_rnn_class():
    import torch.nn as nn
    class SentimentRNN(nn.Module):
        def __init__(
            self,
            vocab_size: int,
            embed_dim: int = 64,
            hidden_dim: int = 128,
            num_layers: int = 2,
            num_classes: int = 1,
            arch: Literal["rnn", "lstm", "gru"] = "lstm",
            dropout: float = 0.3,
        ):
            super().__init__()
            self.arch = arch
            self.num_classes = num_classes

            self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
            rnn_cls = {"rnn": nn.RNN, "lstm": nn.LSTM, "gru": nn.GRU}[arch]
            self.rnn = rnn_cls(
                embed_dim,
                hidden_dim,
                num_layers=num_layers,
                dropout=dropout if num_layers > 1 else 0.0,
                batch_first=True,
            )
            self.dropout = nn.Dropout(dropout)
            out_dim = 1 if num_classes <= 2 else num_classes
            self.fc = nn.Linear(hidden_dim, out_dim)

        def forward(self, x):
            import torch
            embedded = self.dropout(self.embedding(x))
            if self.arch == "lstm":
                out, (hidden, _) = self.rnn(embedded)
            else:
                out, hidden = self.rnn(embedded)
            last_hidden = hidden[-1]
            last_hidden = self.dropout(last_hidden)
            logits = self.fc(last_hidden)
            return logits
    return SentimentRNN


# ─── Job Store ────────────────────────────────────────────────────────────────

# job_id -> {"status": str, "epochs": [...], "gradients": {...}}
_jobs: Dict[str, Dict] = {}
_jobs_lock = threading.Lock()


def get_job(job_id: str) -> Optional[Dict]:
    with _jobs_lock:
        return _jobs.get(job_id)


def create_job() -> str:
    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {"status": "pending", "epochs": [], "gradients": {}}
    return job_id


# ─── Training ────────────────────────────────────────────────────────────────

def train_sentiment(
    texts: List[str],
    labels: List[int],
    job_id: str,
    arch: str = "lstm",
    num_epochs: int = 5,
    lr: float = 1e-3,
    batch_size: int = 32,
    embed_dim: int = 64,
    hidden_dim: int = 128,
    num_layers: int = 2,
    dropout: float = 0.3,
    max_vocab: int = 10_000,
    max_len: int = 64,
    val_split: float = 0.2,
):
    """Runs in a background thread, writes metrics into _jobs[job_id]."""
    try:
        import torch
        from torch.utils.data import DataLoader, TensorDataset
        import torch.nn as nn
        
        with _jobs_lock:
            _jobs[job_id]["status"] = "running"

        tokenizer = SimpleTokenizer(max_vocab=max_vocab, max_len=max_len)
        tokenizer.fit(texts)
        
        seqs = []
        for t in texts:
            ids = [tokenizer.word2idx.get(w, tokenizer.UNK) for w in tokenizer._tokenize(t)]
            ids = ids[: tokenizer.max_len]
            ids += [tokenizer.PAD] * (tokenizer.max_len - len(ids))
            seqs.append(ids)
        X = torch.tensor(seqs, dtype=torch.long)
        y = torch.tensor(labels, dtype=torch.float32)

        # Train/val split
        n = len(X)
        val_n = max(1, int(n * val_split))
        indices = torch.randperm(n)
        val_idx, train_idx = indices[:val_n], indices[val_n:]
        X_train, y_train = X[train_idx], y[train_idx]
        X_val, y_val = X[val_idx], y[val_idx]

        num_classes = len(set(labels))
        SentimentRNN = get_sentiment_rnn_class()
        model = SentimentRNN(
            vocab_size=len(tokenizer.word2idx),
            embed_dim=embed_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            num_classes=num_classes,
            arch=arch,
            dropout=dropout,
        )

        # Gradient hooks
        grad_store = register_gradient_hooks(model)

        loss_fn = nn.BCEWithLogitsLoss() if num_classes <= 2 else nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=lr)

        train_ds = TensorDataset(X_train, y_train)
        val_ds = TensorDataset(X_val, y_val)
        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=batch_size)

        for epoch in range(1, num_epochs + 1):
            model.train()
            train_loss, train_correct = 0.0, 0
            for xb, yb in train_loader:
                optimizer.zero_grad()
                logits = model(xb).squeeze(-1)
                loss = loss_fn(logits, yb)
                loss.backward()
                optimizer.step()
                train_loss += loss.item() * len(xb)
                preds = (torch.sigmoid(logits) > 0.5).float() if num_classes <= 2 else logits.argmax(-1).float()
                train_correct += (preds == yb).sum().item()

            train_loss /= len(X_train)
            train_acc = train_correct / len(X_train)

            model.eval()
            val_loss, val_correct = 0.0, 0
            with torch.no_grad():
                for xb, yb in val_loader:
                    logits = model(xb).squeeze(-1)
                    loss = loss_fn(logits, yb)
                    val_loss += loss.item() * len(xb)
                    preds = (torch.sigmoid(logits) > 0.5).float() if num_classes <= 2 else logits.argmax(-1).float()
                    val_correct += (preds == yb).sum().item()

            val_loss /= len(X_val)
            val_acc = val_correct / len(X_val)

            epoch_data = {
                "epoch": epoch,
                "train_loss": round(train_loss, 6),
                "val_loss": round(val_loss, 6),
                "train_acc": round(train_acc, 6),
                "val_acc": round(val_acc, 6),
            }
            with _jobs_lock:
                _jobs[job_id]["epochs"].append(epoch_data)

        # Store gradient diagnosis
        norms = compute_gradient_norms(grad_store)
        diagnosis = diagnose_gradients(norms)
        with _jobs_lock:
            _jobs[job_id]["gradients"] = {
                k: {"norm": v["norm"], "status": v["status"], "description": v["description"]}
                for k, v in diagnosis.items()
            }
            _jobs[job_id]["status"] = "done"

    except Exception as e:
        with _jobs_lock:
            _jobs[job_id]["status"] = f"error: {str(e)}"
