#!/bin/bash

# Test script for AI Agent Service
echo "Testing AI Agent Service API..."
echo ""

# Wait for service to be ready (if running in Docker)
echo "Waiting for AI Agent service to be ready..."
sleep 2

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:8000/health | python3 -m json.tool
echo ""
echo ""

# Test root endpoint
echo "2. Testing root endpoint..."
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""
echo ""

# Test model info endpoint
echo "3. Testing model info endpoint..."
curl -s http://localhost:8000/model/info | python3 -m json.tool
echo ""
echo ""

# Test prediction endpoint with sample data
echo "4. Testing prediction endpoint with sample patient data..."
curl -s -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "previous_no_shows": 1,
    "days_until_appointment": 5,
    "appointment_hour": 14,
    "patient_id": "P12345"
  }' | python3 -m json.tool
echo ""
echo ""

# Test with high risk patient
echo "5. Testing with high risk patient (multiple no-shows)..."
curl -s -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "previous_no_shows": 3,
    "days_until_appointment": 1,
    "appointment_hour": 17,
    "patient_id": "P67890"
  }' | python3 -m json.tool
echo ""
echo ""

# Test with low risk patient
echo "6. Testing with low risk patient (no previous no-shows)..."
curl -s -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "previous_no_shows": 0,
    "days_until_appointment": 14,
    "appointment_hour": 10,
    "patient_id": "P11111"
  }' | python3 -m json.tool

echo ""
echo "Testing complete!"
