from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid

from src.hopfield_model import HopfieldNetwork

router = APIRouter(prefix="/hopfield", tags=["Hopfield Network"])

# In-memory store for sessions
# session_id -> HopfieldNetwork instance
_sessions: Dict[str, HopfieldNetwork] = {}

class TrainRequest(BaseModel):
    size: int
    patterns: List[List[int]]

class PredictRequest(BaseModel):
    session_id: str
    pattern: List[int]
    async_update: bool = True
    max_steps: int = 50

@router.post("/train")
async def train_hopfield(req: TrainRequest):
    if req.size <= 0:
        raise HTTPException(status_code=400, detail="Grid size must be positive.")
    if any(len(p) != req.size for p in req.patterns):
        raise HTTPException(status_code=400, detail="All patterns must match the specified size.")
        
    model = HopfieldNetwork(size=req.size)
    model.fit(req.patterns)
    
    session_id = str(uuid.uuid4())
    _sessions[session_id] = model
    
    return {"session_id": session_id, "message": f"Trained on {len(req.patterns)} patterns."}

@router.post("/predict")
async def predict_hopfield(req: PredictRequest):
    if req.session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    model = _sessions[req.session_id]
    
    if len(req.pattern) != model.size:
        raise HTTPException(status_code=400, detail=f"Pattern length ({len(req.pattern)}) must match model size ({model.size}).")
        
    history = model.predict_sequence(
        initial_state=req.pattern,
        max_steps=req.max_steps,
        async_update=req.async_update
    )
    
    return {
        "history": history,
        "converged": len(history) <= req.max_steps or history[-1] == history[-2]
    }
