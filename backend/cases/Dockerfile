FROM python:3.13-slim AS builder
WORKDIR /build
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY pyproject.toml README.md ./
COPY auth/ ./auth/
COPY user/ ./user/
COPY cases/ ./cases/
COPY admin/ ./admin/
COPY aml/ ./aml/
RUN pip install --no-cache-dir .

FROM python:3.13-slim
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
ENV PYTHONPATH=/app
WORKDIR /app
COPY admin/ ./admin/
COPY auth/ ./auth/
COPY user/ ./user/
COPY cases/ ./cases/
COPY aml/ ./aml/
WORKDIR /app/cases
CMD ["python", "main.py"]
