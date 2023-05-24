# Use the official Python image as the base image
FROM python:3.9-slim

# Set the environment variables
ENV DB_USER=root
ENV DB_PASSWORD=password
ENV DB_HOST=host
ENV DB_NAME=database
ENV URL=url

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

# Copy the Python script to the container
COPY db_script.py .

# Install the required dependencies
RUN pip install mysql-connector-python && \
	pip install opencv-python && \
	pip install pytz

# Run the Python script when the container starts
CMD ["python", "db_script.py"]
