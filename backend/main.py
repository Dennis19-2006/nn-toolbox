"""
FastAPI main entry point for Neural Network Toolbox backend.
CORS enabled for localhost:5173 (Vite dev server).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routers import data, train, gradients, attendance, hopfield, predictor

app = FastAPI(title="Neural Network Toolbox API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api")
app.include_router(train.router, prefix="/api")
app.include_router(gradients.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(hopfield.router, prefix="/api")
app.include_router(predictor.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Neural Network Toolbox API Running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
