"""
Generic model trainer supporting Dense, RNN, LSTM, GRU architectures.
Runs in a background thread, writes per-epoch metrics + gradient diagnosis to the job store.
"""
import threading
import uuid
from typing import Dict, List, Literal, Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from src.gradient_utils import register_gradient_hooks, compute_gradient_norms, diagnose_gradients

# ─── Job Store (shared with sentiment_model via independent dict) ─────────────
_jobs: Dict[str, Dict] = {}
_lock = threading.Lock()


def get_job(job_id: str) -> Optional[Dict]:
    with _lock:
        return _jobs.get(job_id)


def create_job() -> str:
    job_id = str(uuid.uuid4())
    with _lock:
        _jobs[job_id] = {"status": "pending", "epochs": [], "gradients": {}}
    return job_id


# ─── Model Builder ───────────────────────────────────────────────────────────

ACTIVATIONS = {
    "relu": nn.ReLU,
    "tanh": nn.Tanh,
    "sigmoid": nn.Sigmoid,
    "gelu": nn.GELU,
    "leaky_relu": nn.LeakyReLU,
}

OPTIMIZERS = {
    "adam": torch.optim.Adam,
    "sgd": torch.optim.SGD,
    "rmsprop": torch.optim.RMSprop,
    "adamw": torch.optim.AdamW,
}


class DenseBlock(nn.Module):
    def __init__(self, in_dim: int, out_dim: int, activation: str, dropout: float):
        super().__init__()
        act_cls = ACTIVATIONS.get(activation, nn.ReLU)
        self.block = nn.Sequential(
            nn.Linear(in_dim, out_dim),
            nn.BatchNorm1d(out_dim),
            act_cls(),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.block(x)


class CustomModel(nn.Module):
    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        hidden_sizes: List[int],
        arch: Literal["dense", "rnn", "lstm", "gru"],
        activation: str = "relu",
        dropout: float = 0.2,
    ):
        super().__init__()
        self.arch = arch
        self.hidden_sizes = hidden_sizes

        if arch == "dense":
            layers = []
            prev = input_dim
            for h in hidden_sizes:
                layers.append(DenseBlock(prev, h, activation, dropout))
                prev = h
            self.network = nn.Sequential(*layers)
            self.output = nn.Linear(prev, output_dim)
        else:
            rnn_cls = {"rnn": nn.RNN, "lstm": nn.LSTM, "gru": nn.GRU}[arch]
            self.rnn = rnn_cls(
                input_size=input_dim,
                hidden_size=hidden_sizes[-1],
                num_layers=len(hidden_sizes),
                batch_first=True,
                dropout=dropout if len(hidden_sizes) > 1 else 0.0,
            )
            self.dropout = nn.Dropout(dropout)
            self.output = nn.Linear(hidden_sizes[-1], output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.arch == "dense":
            out = self.network(x)
        else:
            # x: (B, seq_len, features) — for tabular data we treat each row as seq_len=1
            if x.dim() == 2:
                x = x.unsqueeze(1)
            if self.arch == "lstm":
                out, (hidden, _) = self.rnn(x)
            else:
                out, hidden = self.rnn(x)
            out = self.dropout(hidden[-1])
        return self.output(out)


# ─── Training Loop ───────────────────────────────────────────────────────────

def build_and_train(
    X_train: List[List[float]],
    y_train: List[float],
    X_val: List[List[float]],
    y_val: List[float],
    job_id: str,
    arch: str = "dense",
    hidden_sizes: Optional[List[int]] = None,
    activation: str = "relu",
    dropout: float = 0.2,
    optimizer_name: str = "adam",
    lr: float = 1e-3,
    batch_size: int = 32,
    epochs: int = 10,
    task_type: Literal["regression", "classification"] = "classification",
):
    """Background training thread — writes epoch metrics into _jobs[job_id]."""
    if hidden_sizes is None:
        hidden_sizes = [64, 32]

    try:
        with _lock:
            _jobs[job_id]["status"] = "running"

        Xtr = torch.tensor(X_train, dtype=torch.float32)
        ytr = torch.tensor(y_train, dtype=torch.float32)
        Xvl = torch.tensor(X_val, dtype=torch.float32)
        yvl = torch.tensor(y_val, dtype=torch.float32)

        input_dim = Xtr.shape[1]
        is_binary = task_type == "classification" and len(set(y_train)) <= 2
        output_dim = 1

        model = CustomModel(
            input_dim=input_dim,
            output_dim=output_dim,
            hidden_sizes=hidden_sizes,
            arch=arch,
            activation=activation,
            dropout=dropout,
        )

        grad_store = register_gradient_hooks(model)

        opt_cls = OPTIMIZERS.get(optimizer_name, torch.optim.Adam)
        optimizer = opt_cls(model.parameters(), lr=lr)
        loss_fn = nn.BCEWithLogitsLoss() if is_binary else nn.MSELoss()

        train_ds = TensorDataset(Xtr, ytr)
        val_ds = TensorDataset(Xvl, yvl)
        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=batch_size)

        for epoch in range(1, epochs + 1):
            model.train()
            t_loss, t_correct = 0.0, 0
            for xb, yb in train_loader:
                optimizer.zero_grad()
                logits = model(xb).squeeze(-1)
                loss = loss_fn(logits, yb)
                loss.backward()
                # Gradient clipping to prevent explosion
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
                optimizer.step()
                t_loss += loss.item() * len(xb)
                if is_binary:
                    preds = (torch.sigmoid(logits) > 0.5).float()
                    t_correct += (preds == yb).sum().item()

            model.eval()
            v_loss, v_correct = 0.0, 0
            with torch.no_grad():
                for xb, yb in val_loader:
                    logits = model(xb).squeeze(-1)
                    loss = loss_fn(logits, yb)
                    v_loss += loss.item() * len(xb)
                    if is_binary:
                        preds = (torch.sigmoid(logits) > 0.5).float()
                        v_correct += (preds == yb).sum().item()

            n_tr, n_vl = len(Xtr), len(Xvl)
            epoch_data = {
                "epoch": epoch,
                "train_loss": round(t_loss / n_tr, 6),
                "val_loss": round(v_loss / n_vl, 6),
                "train_acc": round(t_correct / n_tr, 6) if is_binary else None,
                "val_acc": round(v_correct / n_vl, 6) if is_binary else None,
            }
            with _lock:
                _jobs[job_id]["epochs"].append(epoch_data)

        # Gradient diagnosis
        norms = compute_gradient_norms(grad_store)
        diag = diagnose_gradients(norms)
        with _lock:
            _jobs[job_id]["gradients"] = {
                k: {"norm": v["norm"], "status": v["status"], "description": v["description"]}
                for k, v in diag.items()
            }
            _jobs[job_id]["status"] = "done"

    except Exception as e:
        with _lock:
            _jobs[job_id]["status"] = f"error: {str(e)}"
