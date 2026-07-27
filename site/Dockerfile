FROM python:3.12-slim

WORKDIR /app

COPY app /app

RUN pip install --no-cache-dir \
    flask \
    requests \
    gunicorn \
    networkx \
    matplotlib \
    pillow

EXPOSE 8080

CMD ["gunicorn","--bind","0.0.0.0:8080","main:app"]
