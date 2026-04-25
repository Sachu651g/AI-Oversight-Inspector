FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source files
COPY . .

# Runtime-injectable environment variables
ENV API_BASE_URL="https://api.openai.com/v1"
ENV MODEL_NAME="gpt-4o-mini"
ENV HF_TOKEN=""
ENV OPENAI_API_KEY=""

# Expose port for HF Space
EXPOSE 7860

# Run the FastAPI server (HF Space endpoint)
CMD ["python", "app.py"]
