"""
Professional-level TensorFlow/Keras LSTM model for Sentiment Analysis.
"""
import threading
import uuid
from typing import Dict, List, Optional
import numpy as np

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

# ─── Keras Callback ───────────────────────────────────────────────────────────
def get_epoch_callback_class():
    import tensorflow as tf
    class EpochCallback(tf.keras.callbacks.Callback):
        def __init__(self, job_id: str):
            super().__init__()
            self.job_id = job_id
    
        def on_epoch_end(self, epoch, logs=None):
            logs = logs or {}
            train_loss = logs.get("loss", 0.0)
            val_loss = logs.get("val_loss", 0.0)
            train_acc = logs.get("accuracy", 0.0)
            val_acc = logs.get("val_accuracy", 0.0)
            
            epoch_data = {
                "epoch": epoch + 1,
                "train_loss": round(float(train_loss), 6),
                "val_loss": round(float(val_loss), 6),
                "train_acc": round(float(train_acc), 6),
                "val_acc": round(float(val_acc), 6),
            }
            with _jobs_lock:
                _jobs[self.job_id]["epochs"].append(epoch_data)
    return EpochCallback

# ─── Training Function ────────────────────────────────────────────────────────
def train_sentiment_tf(
    texts: List[str],
    labels: List[int],
    job_id: str,
    epochs: int = 5,
    lr: float = 1e-3,
    batch_size: int = 32,
    embed_dim: int = 64,
    hidden_dim: int = 128,
    dropout: float = 0.3,
    max_vocab: int = 10000,
    max_len: int = 64,
    val_split: float = 0.2,
):
    """Runs in a background thread, writing metrics via EpochCallback."""
    try:
        import tensorflow as tf
    except ImportError:
        with _jobs_lock:
            _jobs[job_id]["status"] = "error: TensorFlow is not installed."
        return

    try:
        with _jobs_lock:
            _jobs[job_id]["status"] = "running"
            
        X = np.array(texts, dtype=object)
        y = np.array(labels)
        
        num_classes = len(set(labels))
        is_binary = num_classes <= 2
        
        # Professional tokenization using TextVectorization
        vectorize_layer = tf.keras.layers.TextVectorization(
            max_tokens=max_vocab,
            output_mode='int',
            output_sequence_length=max_len
        )
        vectorize_layer.adapt(X)
        
        # Build Keras Sequential Model
        model = tf.keras.Sequential([
            tf.keras.Input(shape=(1,), dtype=tf.string),
            vectorize_layer,
            tf.keras.layers.Embedding(input_dim=max_vocab, output_dim=embed_dim),
            tf.keras.layers.Bidirectional(
                tf.keras.layers.LSTM(hidden_dim, return_sequences=False, dropout=dropout)
            ),
            tf.keras.layers.Dense(
                num_classes if not is_binary else 1, 
                activation='softmax' if not is_binary else 'sigmoid'
            )
        ])
        
        # Compile Model
        opt = tf.keras.optimizers.Adam(learning_rate=lr)
        loss = tf.keras.losses.SparseCategoricalCrossentropy() if not is_binary else tf.keras.losses.BinaryCrossentropy()
        model.compile(optimizer=opt, loss=loss, metrics=["accuracy"])
        
        # Train with early stopping and custom callback
        EpochCallback = get_epoch_callback_class()
        epoch_cb = EpochCallback(job_id)
        early_stop = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', 
            patience=3, 
            restore_best_weights=True
        )
        
        model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=val_split,
            callbacks=[epoch_cb, early_stop],
            verbose=0
        )
        
        with _jobs_lock:
            _jobs[job_id]["status"] = "done"
            
    except Exception as e:
        with _jobs_lock:
            _jobs[job_id]["status"] = f"error: {str(e)}"
