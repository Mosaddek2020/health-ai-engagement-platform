from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging
import random

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


@app.post("/predict/no-show")
async def predict_no_show():
    """
    MVP endpoint: Returns a mock no-show risk score with explainable reasons
    This is a simplified endpoint for the MVP phase.
    In V2, this will run a real model with patient data.
    
    Returns:
        dict: Contains no_show_risk (0.1-0.95) and risk_reasons array
    """
    # For MVP, return a random risk score
    mock_risk = round(random.uniform(0.1, 0.95), 2)
    
    # Generate realistic fake reasons based on risk level
    risk_reasons = generate_fake_xai_reasons(mock_risk)
    
    logger.info(f"Mock prediction generated: no_show_risk={mock_risk}, reasons={len(risk_reasons)}")
    
    return {
        "no_show_risk": mock_risk,
        "risk_reasons": risk_reasons
    }


def generate_fake_xai_reasons(risk_score: float) -> list:
    """
    Generate realistic fake XAI reasons based on risk score
    This simulates what a real model would return
    
    Args:
        risk_score: Risk score between 0 and 1
    
    Returns:
        List of reason dictionaries with reason, weight, icon, and action
    """
    reasons = []
    
    # Pool of possible reasons (realistic scenarios)
    high_risk_reasons = [
        {
            "reason": "3 previous no-shows in last 6 months",
            "weight": "high",
            "icon": "🚨",
            "action": "Mention past no-shows during confirmation call"
        },
        {
            "reason": "2 previous no-shows in last 3 months",
            "weight": "high",
            "icon": "🚨",
            "action": "Follow up with multiple reminders"
        },
        {
            "reason": "Patient has missed last 2 consecutive appointments",
            "weight": "high",
            "icon": "🚨",
            "action": "Request deposit or reschedule to more convenient time"
        }
    ]
    
    medium_risk_reasons = [
        {
            "reason": "Appointment booked less than 24 hours in advance",
            "weight": "medium",
            "icon": "⏰",
            "action": "Call patient within 2 hours to confirm"
        },
        {
            "reason": "Appointment scheduled for late afternoon (after 4 PM)",
            "weight": "medium",
            "icon": "🕐",
            "action": "Send reminder SMS morning of appointment"
        },
        {
            "reason": "Patient age 22 (young adult demographic)",
            "weight": "medium",
            "icon": "👤",
            "action": "Use SMS/text reminders in addition to calls"
        },
        {
            "reason": "Appointment on Monday (historically higher no-show day)",
            "weight": "medium",
            "icon": "📅",
            "action": "Send reminder day before appointment"
        },
        {
            "reason": "New patient (no appointment history)",
            "weight": "medium",
            "icon": "🆕",
            "action": "Make welcome call to build relationship"
        },
        {
            "reason": "Patient has cancelled 2 appointments in past",
            "weight": "medium",
            "icon": "⚠️",
            "action": "Confirm appointment flexibility and timing"
        }
    ]
    
    low_risk_reasons = [
        {
            "reason": "Routine check-up appointment (less urgent)",
            "weight": "low",
            "icon": "📋",
            "action": "Standard reminder protocol"
        },
        {
            "reason": "Appointment booked 2 weeks in advance",
            "weight": "low",
            "icon": "📆",
            "action": "Single reminder 24 hours before"
        },
        {
            "reason": "Patient travels 25+ minutes to clinic",
            "weight": "low",
            "icon": "🚗",
            "action": "Confirm transportation arrangements"
        }
    ]
    
    # Select reasons based on risk score
    if risk_score > 0.7:
        # High risk: 1 high + 1-2 medium reasons
        reasons.append(random.choice(high_risk_reasons))
        reasons.extend(random.sample(medium_risk_reasons, random.randint(1, 2)))
    elif risk_score > 0.4:
        # Medium risk: 2-3 medium reasons
        reasons.extend(random.sample(medium_risk_reasons, random.randint(2, 3)))
    else:
        # Low risk: 1-2 low/medium reasons
        pool = medium_risk_reasons + low_risk_reasons
        reasons.extend(random.sample(pool, random.randint(1, 2)))
    
    return reasons

