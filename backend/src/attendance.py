"""
OpenCV-based face attendance system.
- Face detection: Haar cascade
- Face recognition: Local Binary Patterns Histogram (LBPH)
- Attendance log: CSV file

Flow:
  1. `register_face(image_bytes, name, faces_dir)` — save a labelled face crop
  2. `train_recognizer(faces_dir)` — build LBPH model from registered images
  3. `start_camera_stream()` — generator yielding MJPEG frames
  4. `mark_attendance(recognizer, attendance_csv)` — grab one frame, recognise, append row
"""
import csv
import glob
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Generator, Optional, Tuple

import cv2
import numpy as np

_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
_face_cascade = cv2.CascadeClassifier(_CASCADE_PATH)


# ─── Registration ─────────────────────────────────────────────────────────────

def register_face(image_bytes: bytes, name: str, faces_dir: str) -> str:
    """
    Decode image, detect the largest face, save it as a grayscale crop.
    Returns the saved file path.
    """
    faces_dir = Path(faces_dir)
    person_dir = faces_dir / name
    person_dir.mkdir(parents=True, exist_ok=True)

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    if len(faces) == 0:
        raise ValueError("No face detected in the uploaded image.")

    # Use the largest detected face
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    face_crop = gray[y : y + h, x : x + w]
    face_crop = cv2.resize(face_crop, (100, 100))

    idx = len(list(person_dir.glob("*.png")))
    save_path = person_dir / f"{idx}.png"
    cv2.imwrite(str(save_path), face_crop)
    return str(save_path)


# ─── Recogniser Training ──────────────────────────────────────────────────────

def train_recognizer(faces_dir: str) -> Tuple[cv2.face.LBPHFaceRecognizer, dict]:
    """
    Build and train an LBPH recogniser from registered face images.
    Returns (recogniser, label_map {int: name}).
    """
    faces_dir = Path(faces_dir)
    images, labels, label_map = [], [], {}
    label_id = 0

    for person_dir in sorted(faces_dir.iterdir()):
        if not person_dir.is_dir():
            continue
        name = person_dir.name
        label_map[label_id] = name
        for img_path in person_dir.glob("*.png"):
            img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
            if img is not None:
                images.append(img)
                labels.append(label_id)
        label_id += 1

    if not images:
        raise ValueError("No registered faces found. Please register faces first.")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(images, np.array(labels))
    return recognizer, label_map


# ─── Camera Stream ───────────────────────────────────────────────────────────

# Global camera handle for streaming
_cap: Optional[cv2.VideoCapture] = None
_latest_frame: Optional[np.ndarray] = None


def _get_cap() -> cv2.VideoCapture:
    global _cap
    if _cap is None or not _cap.isOpened():
        _cap = cv2.VideoCapture(0)
    return _cap


def release_camera():
    global _cap
    if _cap is not None and _cap.isOpened():
        _cap.release()
    _cap = None


def _annotate_frame(
    frame: np.ndarray,
    recognizer: Optional[cv2.face.LBPHFaceRecognizer],
    label_map: Optional[dict],
    confidence_threshold: float = 80.0,
) -> np.ndarray:
    """Draw bounding boxes + name labels on detected faces."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    for x, y, w, h in faces:
        face_roi = gray[y : y + h, x : x + w]
        face_roi = cv2.resize(face_roi, (100, 100))

        label = "Unknown"
        color = (0, 0, 255)  # red for unknown

        if recognizer is not None and label_map:
            try:
                pred_label, confidence = recognizer.predict(face_roi)
                if confidence < confidence_threshold:
                    label = label_map.get(pred_label, "Unknown")
                    color = (0, 255, 0)  # green for known
            except Exception:
                pass

        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        cv2.putText(
            frame, label,
            (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX,
            0.7, color, 2,
        )

    # HUD overlay
    ts = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
    cv2.putText(frame, ts, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
    cv2.putText(
        frame, f"Faces: {len(faces)}", (10, 50),
        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1,
    )
    return frame


def camera_mjpeg_generator(
    recognizer: Optional[cv2.face.LBPHFaceRecognizer] = None,
    label_map: Optional[dict] = None,
) -> Generator[bytes, None, None]:
    """Yield MJPEG frame bytes for the FastAPI streaming response."""
    global _latest_frame
    cap = _get_cap()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue
            annotated = _annotate_frame(frame.copy(), recognizer, label_map)
            _latest_frame = annotated.copy()
            _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
            )
            time.sleep(1 / 20)  # ~20 FPS
    except GeneratorExit:
        pass


# ─── Mark Attendance ─────────────────────────────────────────────────────────

def mark_attendance(
    recognizer: cv2.face.LBPHFaceRecognizer,
    label_map: dict,
    attendance_csv: str,
    confidence_threshold: float = 80.0,
) -> dict:
    """
    Grab the latest camera frame, run recognition, append CSV row.
    Returns result dict.
    """
    global _latest_frame

    cap = _get_cap()
    ret, frame = cap.read()
    if not ret:
        raise RuntimeError("Cannot read from camera.")

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    results = []
    for x, y, w, h in faces:
        face_roi = cv2.resize(gray[y : y + h, x : x + w], (100, 100))
        try:
            pred_label, confidence = recognizer.predict(face_roi)
        except Exception:
            continue
        if confidence < confidence_threshold:
            name = label_map.get(pred_label, "Unknown")
            ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            results.append({"name": name, "timestamp": ts, "confidence": round(float(confidence), 2)})

    # Write to CSV
    csv_path = Path(attendance_csv)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = csv_path.exists()
    with open(csv_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "timestamp", "confidence"])
        if not file_exists:
            writer.writeheader()
        writer.writerows(results)

    return {"marked": results, "total_faces": len(faces)}
