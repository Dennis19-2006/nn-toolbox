"""
Router: /api/upload-csv, /api/columns
"""
import io
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from src.data_pipeline import load_and_profile, clean_csv, get_train_val_split

router = APIRouter(tags=["Data"])

# Store last cleaned data in memory (per-process, simple demo)
_last_cleaned: Optional[pd.DataFrame] = None


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Receive a CSV, profile it, clean it, return stats + preview."""
    global _last_cleaned
    try:
        contents = await file.read()
        df_raw = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    profile = load_and_profile(df_raw)
    df_clean, report = clean_csv(df_raw.copy())
    _last_cleaned = df_clean

    return {
        "filename": file.filename,
        "profile": profile,
        "cleaning_report": report,
        "raw_preview": df_raw.head(10).fillna("").to_dict(orient="records"),
        "cleaned_preview": df_clean.head(10).fillna("").to_dict(orient="records"),
        "columns": list(df_clean.columns),
    }


@router.post("/split")
async def split_data(target_col: str = Form(...), val_size: float = Form(0.2)):
    """Split the last uploaded cleaned dataset."""
    global _last_cleaned
    if _last_cleaned is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet.")
    try:
        split = get_train_val_split(_last_cleaned, target_col, val_size)
        return {k: v for k, v in split.items() if "shape" in k}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cleaned-data")
async def get_cleaned_data():
    """Return the full cleaned dataframe as JSON."""
    global _last_cleaned
    if _last_cleaned is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet.")
    return {
        "data": _last_cleaned.fillna(0).to_dict(orient="records"),
        "columns": list(_last_cleaned.columns),
        "shape": list(_last_cleaned.shape),
    }
