# Stage 1: Build Frontend
FROM node:20-slim AS frontend-build
ARG VITE_GOOGLE_MAPS_API_KEY
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# We set VITE_API_URL to empty so it uses relative paths in production
RUN VITE_API_URL= VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY npm run build

# Stage 2: Backend & Final Image
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (if needed for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./
# Copy root .env file so the backend can read GITHUB_TOKEN
COPY .env ./

# Copy built frontend from Stage 1 to 'static' directory in the backend
# This 'static' directory is what FastAPI serves
COPY --from=frontend-build /app/frontend/dist ./static

# Cloud Run expects the service to listen on PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start the app using the shell form so that $PORT is correctly resolved
# Cloud Run will tell the app which port to listen on dynamically
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --log-level debug
