FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt

RUN pip install --no-cache-dir \
    -r /tmp/requirements.txt

COPY app /app

EXPOSE 8080

CMD ["gunicorn","--bind","0.0.0.0:8080","main:app"]
