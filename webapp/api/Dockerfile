# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Flask
RUN pip install -r requirements.txt

# Copy app code
COPY app.py .
COPY auth.py .
COPY config.py .
COPY schemas.py .
COPY error_handlers.py .
COPY utils.py .
COPY routes/ ./routes/
COPY storage/ ./storage

# Expose port
EXPOSE 5000

# Run app with Gunicorn in production, fallback to Flask dev server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
