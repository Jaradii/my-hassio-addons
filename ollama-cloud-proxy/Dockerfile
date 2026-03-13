ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV PYTHONUNBUFFERED=1
ENV VENV_PATH=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-venv \
      python3-pip \
      bash && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY app.py /app/app.py
COPY run.sh /app/run.sh

RUN chmod +x /app/run.sh && \
    python3 -m venv ${VENV_PATH} && \
    ${VENV_PATH}/bin/pip install --no-cache-dir --upgrade pip && \
    ${VENV_PATH}/bin/pip install --no-cache-dir \
      fastapi==0.116.1 \
      uvicorn[standard]==0.35.0 \
      httpx==0.28.1

CMD ["/app/run.sh"]
