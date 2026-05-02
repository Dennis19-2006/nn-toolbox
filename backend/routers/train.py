"""
Router: /api/train/sentiment, /api/train/custom, /api/train/stream/{job_id}
"""
import asyncio
import io
import threading
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

import src.sentiment_model as sm
import src.custom_trainer as ct
import src.tf_lstm_model as tf_lstm

router = APIRouter(tags=["Training"])


# ─── Sentiment Training ───────────────────────────────────────────────────────

@router.post("/train/sentiment")
async def train_sentiment(
    file: UploadFile = File(...),
    text_col: str = Form(...),
    label_col: str = Form(...),
    arch: str = Form("lstm"),
    epochs: int = Form(5),
    lr: float = Form(1e-3),
    batch_size: int = Form(32),
    embed_dim: int = Form(64),
    hidden_dim: int = Form(128),
    num_layers: int = Form(2),
    dropout: float = Form(0.3),
    max_vocab: int = Form(10000),
    max_len: int = Form(64),
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, detail=f"CSV parse error: {e}")

    if text_col not in df.columns or label_col not in df.columns:
        raise HTTPException(400, detail="text_col or label_col not found in CSV.")

    texts = df[text_col].fillna("").astype(str).tolist()
    raw_labels = df[label_col].tolist()

    # Encode labels to int
    unique = sorted(set(raw_labels))
    label_map = {v: i for i, v in enumerate(unique)}
    labels = [label_map[l] for l in raw_labels]

    job_id = sm.create_job()
    thread = threading.Thread(
        target=sm.train_sentiment,
        kwargs=dict(
            texts=texts, labels=labels, job_id=job_id,
            arch=arch, num_epochs=epochs, lr=lr, batch_size=batch_size,
            embed_dim=embed_dim, hidden_dim=hidden_dim, num_layers=num_layers,
            dropout=dropout, max_vocab=max_vocab, max_len=max_len,
        ),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id, "total_epochs": epochs, "label_map": label_map}


@router.post("/train/tf_sentiment")
async def train_tf_sentiment(
    file: UploadFile = File(...),
    text_col: str = Form(...),
    label_col: str = Form(...),
    epochs: int = Form(5),
    lr: float = Form(1e-3),
    batch_size: int = Form(32),
    embed_dim: int = Form(64),
    hidden_dim: int = Form(128),
    dropout: float = Form(0.3),
    max_vocab: int = Form(10000),
    max_len: int = Form(64),
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, detail=f"CSV parse error: {e}")

    if text_col not in df.columns or label_col not in df.columns:
        raise HTTPException(400, detail="text_col or label_col not found in CSV.")

    texts = df[text_col].fillna("").astype(str).tolist()
    raw_labels = df[label_col].tolist()

    # Encode labels to int
    unique = sorted(set(raw_labels))
    label_map = {v: i for i, v in enumerate(unique)}
    labels = [label_map[l] for l in raw_labels]

    job_id = tf_lstm.create_job()
    thread = threading.Thread(
        target=tf_lstm.train_sentiment_tf,
        kwargs=dict(
            texts=texts, labels=labels, job_id=job_id,
            epochs=epochs, lr=lr, batch_size=batch_size,
            embed_dim=embed_dim, hidden_dim=hidden_dim, 
            dropout=dropout, max_vocab=max_vocab, max_len=max_len,
        ),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id, "total_epochs": epochs, "label_map": label_map}


# ─── Custom Training ──────────────────────────────────────────────────────────

@router.post("/train/custom")
async def train_custom(
    file: UploadFile = File(...),
    target_col: str = Form(...),
    arch: str = Form("dense"),
    hidden_sizes: str = Form("64,32"),
    activation: str = Form("relu"),
    dropout: float = Form(0.2),
    optimizer_name: str = Form("adam"),
    lr: float = Form(1e-3),
    batch_size: int = Form(32),
    epochs: int = Form(10),
    val_size: float = Form(0.2),
    task_type: str = Form("classification"),
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, detail=f"CSV parse error: {e}")

    if target_col not in df.columns:
        raise HTTPException(400, detail=f"target_col '{target_col}' not found.")

    # Clean numeric only
    df = df.select_dtypes(include="number").dropna()
    if target_col not in df.columns:
        raise HTTPException(400, detail="target_col must be numeric after type filter.")

    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import MinMaxScaler

    X = df.drop(columns=[target_col]).values
    y = df[target_col].values
    scaler = MinMaxScaler()
    X = scaler.fit_transform(X)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=val_size, random_state=42)
    hidden_list = [int(h.strip()) for h in hidden_sizes.split(",") if h.strip()]

    job_id = ct.create_job()
    thread = threading.Thread(
        target=ct.build_and_train,
        kwargs=dict(
            X_train=X_train.tolist(), y_train=y_train.tolist(),
            X_val=X_val.tolist(), y_val=y_val.tolist(),
            job_id=job_id, arch=arch, hidden_sizes=hidden_list,
            activation=activation, dropout=dropout,
            optimizer_name=optimizer_name, lr=lr,
            batch_size=batch_size, epochs=epochs, task_type=task_type,
        ),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id, "total_epochs": epochs}


# ─── SSE Stream ───────────────────────────────────────────────────────────────

def _get_job_any(job_id: str):
    """Check both job stores."""
    job = sm.get_job(job_id)
    if job is None:
        job = ct.get_job(job_id)
    if job is None:
        job = tf_lstm.get_job(job_id)
    return job


@router.get("/train/stream/{job_id}")
async def stream_training(job_id: str):
    """Server-Sent Events stream: yields one epoch JSON per message."""
    job = _get_job_any(job_id)
    if job is None:
        raise HTTPException(404, detail="Job not found.")

    async def event_generator():
        sent = 0
        while True:
            job = _get_job_any(job_id)
            epochs = job.get("epochs", [])
            while sent < len(epochs):
                yield {"data": str(epochs[sent]).replace("'", '"'), "event": "epoch"}
                sent += 1
            status = job.get("status", "")
            if status == "done" or status.startswith("error"):
                yield {"data": f'{{"status": "{status}"}}', "event": "done"}
                break
            await asyncio.sleep(0.3)

    return EventSourceResponse(event_generator())


# ─── Job Status ───────────────────────────────────────────────────────────────

@router.get("/train/status/{job_id}")
async def job_status(job_id: str):
    job = _get_job_any(job_id)
    if job is None:
        raise HTTPException(404, detail="Job not found.")
    return {
        "status": job.get("status"),
        "epochs_completed": len(job.get("epochs", [])),
    }
