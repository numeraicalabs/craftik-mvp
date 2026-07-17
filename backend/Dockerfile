FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

# Local default. Render/Railway/etc. override with $PORT.
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

# Bind to $PORT so PaaS providers work out of the box.
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
