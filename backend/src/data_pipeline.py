"""
Data pipeline: CSV upload, cleaning, EDA stats, train/val split.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any


def load_and_profile(df: pd.DataFrame) -> Dict[str, Any]:
    """Return profiling stats for the raw DataFrame."""
    profile = {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_types": {col: str(df[col].dtype) for col in df.columns},
        "missing_values": df.isnull().sum().to_dict(),
        "missing_pct": (df.isnull().mean() * 100).round(2).to_dict(),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_stats": {},
        "categorical_stats": {},
    }

    for col in df.select_dtypes(include="number").columns:
        profile["numeric_stats"][col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "median": float(df[col].median()),
        }

    for col in df.select_dtypes(include=["object", "category"]).columns:
        vc = df[col].value_counts()
        profile["categorical_stats"][col] = {
            "unique_count": int(df[col].nunique()),
            "top_values": vc.head(5).to_dict(),
        }

    return profile


def clean_csv(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Auto-clean strategy:
    1. Drop fully-empty columns
    2. Drop duplicate rows
    3. Fill numeric nulls with column median
    4. Fill categorical nulls with mode
    5. Label-encode categoricals
    6. MinMax-scale numerics
    Returns (cleaned_df, cleaning_report)
    """
    report: Dict[str, Any] = {}

    # Drop fully-empty cols
    before_cols = list(df.columns)
    df = df.dropna(axis=1, how="all")
    dropped_cols = [c for c in before_cols if c not in df.columns]
    report["dropped_empty_columns"] = dropped_cols

    # Drop duplicates
    before_rows = len(df)
    df = df.drop_duplicates()
    report["dropped_duplicates"] = before_rows - len(df)

    # Fill missing
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    for col in numeric_cols:
        median_val = df[col].median()
        filled = df[col].isnull().sum()
        df[col] = df[col].fillna(median_val)
        if filled > 0:
            report[f"filled_{col}"] = f"filled {filled} NaN with median={median_val:.4f}"

    for col in cat_cols:
        if df[col].isnull().any():
            mode_val = df[col].mode()[0] if not df[col].mode().empty else "unknown"
            df[col] = df[col].fillna(mode_val)

    # Label encode categoricals
    encoders: Dict[str, LabelEncoder] = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    report["label_encoded_columns"] = cat_cols

    # MinMax scale numerics
    if numeric_cols:
        scaler = MinMaxScaler()
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
    report["scaled_columns"] = numeric_cols

    report["final_rows"] = len(df)
    report["final_columns"] = len(df.columns)

    return df, report


def get_train_val_split(
    df: pd.DataFrame, target_col: str, val_size: float = 0.2
) -> Dict[str, Any]:
    """Split cleaned DataFrame into train/val, return shapes."""
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found.")

    X = df.drop(columns=[target_col]).values
    y = df[target_col].values

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=val_size, random_state=42
    )
    return {
        "X_train_shape": list(X_train.shape),
        "X_val_shape": list(X_val.shape),
        "y_train_shape": list(y_train.shape),
        "y_val_shape": list(y_val.shape),
        "X_train": X_train.tolist(),
        "X_val": X_val.tolist(),
        "y_train": y_train.tolist(),
        "y_val": y_val.tolist(),
    }
