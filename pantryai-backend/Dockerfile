FROM python:3.11-slim
WORKDIR /app

# system deps for tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr libtesseract-dev && rm -rf /var/lib/apt/lists/*

# install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy code
COPY . .

# run
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:5001", "--workers=4"]