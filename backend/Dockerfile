FROM python:3.11-slim

WORKDIR /app/backend

# Install system dependencies (for potential C/C++ compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r requirements.txt

# Copy code and ML resources into image paths
COPY backend /app/backend
COPY ml /app/ml

# Expose backend Port
EXPOSE 5000

# Start Gunicorn server inside working directory
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
