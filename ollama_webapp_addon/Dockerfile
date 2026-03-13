ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache python3 py3-pip bash

WORKDIR /app

COPY app.py /app/app.py
COPY run.sh /app/run.sh

RUN chmod +x /app/run.sh && \
    pip3 install --no-cache-dir \
      fastapi==0.116.1 \
      uvicorn[standard]==0.35.0 \
      httpx==0.28.1 \
      pydantic==2.11.7

CMD [ "/app/run.sh" ]
