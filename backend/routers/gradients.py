"""
Router: /api/gradients/{job_id}
"""
from fastapi import APIRouter, HTTPException

import src.sentiment_model as sm
import src.custom_trainer as ct

router = APIRouter(tags=["Gradients"])


def _get_job_any(job_id: str):
    job = sm.get_job(job_id)
    if job is None:
        job = ct.get_job(job_id)
    return job


@router.get("/gradients/{job_id}")
async def get_gradients(job_id: str):
    """Return per-layer gradient norms and health diagnosis."""
    job = _get_job_any(job_id)
    if job is None:
        raise HTTPException(404, detail="Job not found.")
    if job.get("status") not in ("done",):
        return {"message": "Training still in progress.", "status": job.get("status")}

    gradients = job.get("gradients", {})
    # Summary counts
    summary = {"vanishing": 0, "exploding": 0, "healthy": 0}
    for v in gradients.values():
        s = v.get("status", "healthy")
        summary[s] = summary.get(s, 0) + 1

    return {
        "job_id": job_id,
        "summary": summary,
        "layers": gradients,
    }
