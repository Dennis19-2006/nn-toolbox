# -------------------------
# Step 1: Build Frontend
# -------------------------
FROM node:20-slim as frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


# -------------------------
# Step 2: Backend
# -------------------------
FROM python:3.11-slim

WORKDIR /app

# FIXED dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY . .

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./static

# Railway provides PORT dynamically
ENV PORT=8000

# IMPORTANT: use shell form to allow $PORT
CMD uvicorn main:app --host 0.0.0.0 --port $PORT