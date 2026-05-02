"""
Router: /api/attendance/*
Endpoints:
  POST /api/attendance/register  – save a face image with a name
  GET  /api/attendance/stream    – MJPEG camera stream
  POST /api/attendance/mark      – recognize & log attendance
  GET  /api/attendance/log       – return CSV as JSON
  POST /api/attendance/release   – close the camera
"""
import csv
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from src.attendance import (
    camera_mjpeg_generator,
    mark_attendance as _mark,
    register_face,
    release_camera,
    train_recognizer,
)

router = APIRouter(tags=["Attendance"])

BASE_DIR = Path(__file__).resolve().parent.parent
FACES_DIR = str(BASE_DIR / "data" / "faces")
ATTENDANCE_CSV = str(BASE_DIR / "data" / "attendance.csv")
MODELS_DIR = str(BASE_DIR / "data" / "models")

# Runtime state
_recognizer = None
_label_map: dict = {}


def _reload_recognizer():
    global _recognizer, _label_map
    faces_dir = Path(FACES_DIR)
    if not faces_dir.exists() or not any(faces_dir.iterdir()):
        _recognizer = None
        _label_map = {}
        return
    try:
        _recognizer, _label_map = train_recognizer(FACES_DIR)
    except Exception:
        _recognizer = None
        _label_map = {}


@router.post("/attendance/register")
async def register(
    file: UploadFile = File(...),
    name: str = Form(...),
):
    """Save a face image for a named person and retrain the recognizer."""
    image_bytes = await file.read()
    try:
        saved_path = register_face(image_bytes, name, FACES_DIR)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    _reload_recognizer()
    registered = [d.name for d in Path(FACES_DIR).iterdir() if d.is_dir()]
    return {
        "message": f"Face registered for '{name}'.",
        "saved_path": saved_path,
        "registered_people": registered,
    }


@router.get("/attendance/stream")
async def camera_stream():
    """MJPEG stream from webcam with face detection / recognition overlay."""
    global _recognizer, _label_map
    if not _recognizer:
        _reload_recognizer()

    return StreamingResponse(
        camera_mjpeg_generator(_recognizer, _label_map),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.post("/attendance/mark")
async def mark_attendance():
    """Capture current frame, recognise faces, append to attendance CSV."""
    global _recognizer, _label_map
    if _recognizer is None:
        _reload_recognizer()
    if _recognizer is None:
        raise HTTPException(400, detail="No registered faces found. Please register faces first.")

    try:
        result = _mark(_recognizer, _label_map, ATTENDANCE_CSV)
    except RuntimeError as e:
        raise HTTPException(500, detail=str(e))

    return result


@router.get("/attendance/log")
async def get_log():
    """Return attendance CSV as JSON."""
    csv_path = Path(ATTENDANCE_CSV)
    if not csv_path.exists():
        return {"records": [], "message": "No attendance logged yet."}

    records = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    return {"records": records, "count": len(records)}


@router.post("/attendance/release")
async def release_cam():
    """Release the camera resource."""
    release_camera()
    return {"message": "Camera released."}


@router.get("/attendance/registered")
async def list_registered():
    """Return list of registered people."""
    faces_dir = Path(FACES_DIR)
    if not faces_dir.exists():
        return {"people": []}
    people = [d.name for d in faces_dir.iterdir() if d.is_dir()]
    return {"people": people}
