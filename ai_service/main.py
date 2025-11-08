from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Health AI Agent Service",
    description="AI microservice for predicting patient no-show risk scores",
    version="1.0.0"
)

# Simple model for demonstration (in production, load a trained model)
# This is a mock model that will be trained on synthetic data
model = RandomForestClassifier(n_estimators=10, random_state=42)

# Train with dummy data for demonstration
# Features: [age, previous_no_shows, days_until_appointment, appointment_hour]
X_train = np.array([
    [25, 0, 7, 10],
    [45, 1, 3, 14],
    [65, 0, 14, 9],
    [35, 2, 1, 16],
    [55, 0, 5, 11],
    [40, 1, 2, 15],
    [30, 0, 10, 8],
    [50, 3, 1, 17],
])
y_train = np.array([0, 1, 0, 1, 0, 1, 0, 1])  # 0=show, 1=no-show
model.fit(X_train, y_train)

logger.info("AI Agent Service initialized and model trained")


class PatientData(BaseModel):
    """Input data model for risk prediction"""
    age: int
    previous_no_shows: int = 0
    days_until_appointment: int
    appointment_hour: int
    patient_id: Optional[str] = None


class RiskPrediction(BaseModel):
    """Output model for risk prediction"""
    risk_score: float
    risk_level: str
    patient_id: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AI Agent Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/predict", response_model=RiskPrediction)
async def predict_risk(patient_data: PatientData):
    """
    Predict patient no-show risk score
    
    Args:
        patient_data: Patient information including age, previous no-shows, etc.
    
    Returns:
        RiskPrediction with risk_score (0-1) and risk_level (low/medium/high)
    """
    try:
        # Prepare features for prediction
        features = np.array([[
            patient_data.age,
            patient_data.previous_no_shows,
            patient_data.days_until_appointment,
            patient_data.appointment_hour
        ]])
        
        # Get prediction probability
        risk_probability = model.predict_proba(features)[0][1]  # Probability of no-show
        
        # Determine risk level
        if risk_probability < 0.3:
            risk_level = "low"
        elif risk_probability < 0.7:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        logger.info(f"Prediction made: risk_probability={risk_probability:.2f}, risk_level={risk_level}")
        
        return RiskPrediction(
            risk_score=round(risk_probability, 4),
            risk_level=risk_level,
            patient_id=patient_data.patient_id
        )
    
    except Exception as e:
        logger.error(f"Error making prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/model/info")
async def model_info():
    """Get information about the current model"""
    return {
        "model_type": "RandomForestClassifier",
        "n_estimators": 10,
        "features": [
            "age",
            "previous_no_shows",
            "days_until_appointment",
            "appointment_hour"
        ],
        "trained": True
    }
