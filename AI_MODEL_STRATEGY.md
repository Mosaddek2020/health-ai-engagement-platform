# AI Model Strategy & Roadmap

**Date**: November 9, 2025  
**Purpose**: Strategy for transforming mock AI into a real, trusted predictive system

---

## 🎯 Business Goal

**Minimize no-show rates → Maximize doctor utilization → Reduce revenue loss**

The AI must be:
1. **Accurate** - Predict actual no-show risk
2. **Explainable** - Staff must understand WHY a patient is flagged
3. **Actionable** - Provide clear next steps
4. **Trustworthy** - Build confidence through transparency

---

## 📊 Current State (MVP)

### What Exists:
- ✅ FastAPI service running on port 8000
- ✅ Mock endpoint `/predict/no-show` - returns random scores (0.1-0.95)
- ✅ Real ML endpoint `/predict` - RandomForest with 4 features (not used yet)
- ✅ Laravel integration via HTTP
- ✅ React dashboard displaying risk scores

### Problems:
- ❌ Using random numbers (no real predictions)
- ❌ No patient features being passed to AI
- ❌ No explanation for risk scores (black box)
- ❌ Staff can't trust or act on recommendations

---

## 🧠 Phase 1: Real Predictive Model

### Model Architecture

**Selected Approach**: Random Forest Classifier
- ✅ Handles non-linear relationships
- ✅ Built-in feature importance
- ✅ Robust to overfitting with proper tuning
- ✅ Fast inference (< 50ms per prediction)
- ⚠️ Requires feature engineering

**Alternative Considered**: Logistic Regression
- More interpretable coefficients
- Faster training
- Better for linear relationships
- **Decision**: Start with Random Forest, can switch if interpretability is critical

### Training Data Strategy

#### Option 1: Synthetic Realistic Data (Phase 1 - MVP)
**Approach**: Generate 5,000-10,000 appointments with realistic correlations

**Benefits**:
- Fast to implement
- Control data quality
- No privacy concerns
- Good for initial deployment

**Synthetic Data Generation Logic**:
```python
# High-risk profile
if age < 25 and past_no_shows >= 2 and lead_time < 2:
    no_show_probability = 0.85

# Low-risk profile  
if age > 50 and past_no_shows == 0 and lead_time > 7:
    no_show_probability = 0.15

# Add realistic noise and edge cases
```

#### Option 2: Historical Hospital Data (Phase 2 - Production)
**Approach**: Train on real anonymized appointment data

**Requirements**:
- 12+ months of appointment history
- Minimum 10,000 records
- De-identified patient data
- Show/no-show outcome labels

**Data Fields Needed**:
```
- appointment_id (hash)
- patient_id (hash)
- appointment_datetime
- showed_up (boolean)
- patient_age
- appointment_type
- provider_type
- booking_datetime (to calculate lead_time)
- past_no_shows (derived)
- past_appointments (derived)
```

---

## 📈 Features Engineering

### Core Features (Priority 1 - Must Have)

#### 1. **past_no_show_count** 🚨 (Most Important)
- **Definition**: Number of previous missed appointments
- **Why**: #1 predictor of future no-shows
- **Implementation**: Query appointment history per patient
- **Weight**: ~40-50% of prediction

#### 2. **lead_time_days** ⏰
- **Definition**: Days between booking and appointment
- **Why**: Last-minute bookings = higher cancellation
- **Thresholds**: 
  - < 1 day = Very High Risk
  - 1-3 days = High Risk
  - 4-7 days = Medium Risk
  - 8+ days = Low Risk
- **Weight**: ~20-25% of prediction

#### 3. **appointment_hour** 🕐
- **Definition**: Hour of day (0-23)
- **Why**: Early morning (before 9am) and late afternoon (after 4pm) have higher no-shows
- **Risk Patterns**:
  - 7-8am: High risk (inconvenient time)
  - 9am-3pm: Lower risk
  - 4-6pm: Medium-high risk (end of day fatigue)
- **Weight**: ~10-15% of prediction

#### 4. **patient_age** 👤
- **Definition**: Patient age in years
- **Why**: Young adults (18-30) have highest no-show rates
- **Risk Curve**:
  - 18-25: Highest risk
  - 26-35: High risk
  - 36-50: Medium risk
  - 51-65: Low risk
  - 65+: Lowest risk (more invested in health)
- **Weight**: ~10-15% of prediction

#### 5. **day_of_week** 📅
- **Definition**: Monday=0, Sunday=6
- **Why**: Monday and Friday have higher no-shows
- **Risk Pattern**:
  - Monday: High (weekend recovery)
  - Friday: High (weekend plans)
  - Tuesday-Thursday: Lower
  - Weekend: Variable
- **Weight**: ~5-10% of prediction

#### 6. **appointment_type** 📋
- **Definition**: Follow-up, New Patient, Urgent, Routine
- **Why**: Different engagement levels
- **Risk Levels**:
  - New Patient: High risk (no relationship)
  - Routine Check-up: Medium-high risk (can defer)
  - Follow-up: Low risk (continuity of care)
  - Urgent/Pain: Very low risk (immediate need)
- **Weight**: ~5-10% of prediction

#### 7. **past_appointment_count** 📊
- **Definition**: Total previous appointments (regardless of outcome)
- **Why**: Engagement indicator
- **Pattern**: More history = more commitment
- **Weight**: ~5% of prediction

#### 8. **past_cancellation_count** ⚠️
- **Definition**: Previous cancelled (but not no-show) appointments
- **Why**: Flakiness indicator
- **Weight**: ~5% of prediction

### Secondary Features (Priority 2 - Nice to Have)

#### 9. **distance_from_clinic_km**
- Travel time as barrier
- Requires geocoding patient address

#### 10. **insurance_type**
- Medicaid vs Private vs Self-Pay
- Socioeconomic proxy
- Compliance considerations required

#### 11. **provider_name**
- Some providers have better patient relationships
- Can encode as categorical

#### 12. **season** / **month**
- Summer vs Winter patterns
- Holiday season effects

### Advanced Features (Priority 3 - Future)

#### 13. **weather_forecast**
- Rain/Snow = higher no-shows
- Requires weather API integration

#### 14. **local_holiday**
- Week before/after holidays
- Requires holiday calendar

#### 15. **patient_contact_attempts**
- How many reminders sent
- Engagement level

---

## 🔍 Explainable AI (XAI) Strategy

### Why XAI is Critical

**Problem**: "The computer says 85% risk"
- Staff won't trust it
- Can't explain to supervisor
- No actionable insight
- Potential bias concerns

**Solution**: "85% risk because: 3 previous no-shows, booked yesterday, young adult"
- Staff understands reasoning
- Can justify calling patient
- Actionable ("mention their past no-shows on call")
- Transparent decision-making

### Implementation Approaches

#### Approach 1: Rule-Based Reasons (Phase 1 - Smart Fake)

**Concept**: Map feature values to pre-written human explanations

**Example Logic**:
```python
reasons = []

# Check each feature threshold
if patient_data['past_no_show_count'] >= 3:
    reasons.append({
        "reason": f"{patient_data['past_no_show_count']} previous no-shows in last 6 months",
        "weight": "high",
        "icon": "🚨",
        "action": "Mention past no-shows on confirmation call"
    })

if patient_data['lead_time_days'] < 2:
    reasons.append({
        "reason": f"Appointment booked only {patient_data['lead_time_days']} day(s) in advance",
        "weight": "medium",
        "icon": "⏰",
        "action": "Call immediately - last-minute bookings are risky"
    })

if patient_data['age'] < 26:
    reasons.append({
        "reason": f"Patient age {patient_data['age']} (high-risk demographic)",
        "weight": "medium",
        "icon": "👤",
        "action": "Send SMS reminder in addition to call"
    })

if patient_data['appointment_hour'] >= 16:
    reasons.append({
        "reason": "Late afternoon appointment (4+ PM)",
        "weight": "low",
        "icon": "🕐",
        "action": "Consider offering earlier time slot"
    })
```

**Benefits**:
- ✅ Fast to implement
- ✅ Full control over messaging
- ✅ Clear, actionable language
- ✅ No ML complexity
- ⚠️ Not based on actual feature contribution

#### Approach 2: Feature Importance from Model (Phase 2)

**Concept**: Extract which features mattered most for THIS prediction

**Using Random Forest**:
```python
# Get feature importance
importance = model.feature_importances_

# Map to features
feature_importance_dict = {
    'past_no_shows': importance[0],
    'lead_time': importance[1],
    'age': importance[2],
    # ... etc
}

# Sort and take top 3
top_features = sorted(feature_importance_dict.items(), 
                      key=lambda x: x[1], 
                      reverse=True)[:3]
```

**Benefits**:
- ✅ Based on model's actual decision
- ✅ More accurate
- ⚠️ Generic (same for all predictions)

#### Approach 3: SHAP Values (Phase 3 - Production)

**Concept**: Calculate exact contribution of each feature to THIS specific prediction

**Using SHAP Library**:
```python
import shap

# Create explainer
explainer = shap.TreeExplainer(model)

# Get SHAP values for this prediction
shap_values = explainer.shap_values(patient_features)

# Example output:
# past_no_shows contributed: +0.35 to risk
# lead_time contributed: +0.18 to risk
# age contributed: +0.12 to risk
```

**Benefits**:
- ✅ Mathematically rigorous
- ✅ Per-prediction accuracy
- ✅ Industry standard
- ⚠️ Requires `shap` library (~50MB)
- ⚠️ Slower computation (~200ms per prediction)

### Recommended XAI Output Format

```json
{
  "risk_score": 0.87,
  "risk_level": "high",
  "confidence": 0.82,
  "risk_reasons": [
    {
      "reason": "3 previous no-shows in last 6 months",
      "weight": "high",
      "icon": "🚨",
      "contribution_percentage": 45,
      "action": "Mention past no-shows during confirmation call"
    },
    {
      "reason": "Appointment booked only 18 hours in advance",
      "weight": "medium",
      "icon": "⏰",
      "contribution_percentage": 25,
      "action": "Call patient within next 2 hours"
    },
    {
      "reason": "Patient age 23 (high-risk demographic)",
      "weight": "medium",
      "icon": "👤",
      "contribution_percentage": 20,
      "action": "Send SMS reminder in addition to phone call"
    }
  ],
  "recommendation": {
    "priority": "urgent",
    "action": "Call patient within 24 hours to confirm attendance",
    "suggested_message": "Hi [Name], we noticed you have an appointment tomorrow at 2 PM. Can you confirm you'll be able to make it?"
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Enhanced Model with Smart XAI (Current Session)
**Timeline**: 1-2 hours

**Tasks**:
1. ✅ Generate 5,000 synthetic training records with realistic correlations
2. ✅ Add 8 core features to synthetic data
3. ✅ Train Random Forest with 100 trees
4. ✅ Implement rule-based XAI with actionable reasons
5. ✅ Update `/predict` endpoint to return reasons
6. ✅ Modify Laravel to extract and send patient features
7. ✅ Update React dashboard to display reasons

**Deliverables**:
- Working AI with explanations
- Trust-building UI
- Actionable insights for staff

### Phase 2: Model Refinement (Week 2)
**Timeline**: 3-5 days

**Tasks**:
1. Add feature importance extraction
2. Implement cross-validation
3. Add model performance metrics endpoint
4. Create `/model/retrain` endpoint
5. Add model versioning
6. Collect real hospital data (if available)

**Deliverables**:
- Model performance dashboard
- Retraining capability
- Better accuracy metrics

### Phase 3: Advanced XAI (Week 3-4)
**Timeline**: 5-7 days

**Tasks**:
1. Integrate SHAP library
2. Generate per-prediction SHAP values
3. Add SHAP visualization API
4. Create "Why this prediction?" modal in UI
5. Add feature contribution charts

**Deliverables**:
- Production-grade explainability
- Visual explanations
- Audit trail

### Phase 4: Production Optimization (Month 2)
**Timeline**: 2 weeks

**Tasks**:
1. Model monitoring (drift detection)
2. A/B testing framework
3. Automated retraining pipeline
4. Performance optimization (caching, async)
5. Add advanced features (weather, holidays)

**Deliverables**:
- Production-ready AI system
- Monitoring dashboards
- Continuous improvement loop

---

## 📊 Success Metrics

### Model Performance
- **Accuracy**: > 75% (baseline)
- **Precision** (high-risk): > 70% (avoid false alarms)
- **Recall** (high-risk): > 80% (catch most no-shows)
- **AUC-ROC**: > 0.80

### Business Impact
- **No-show rate reduction**: 20-30% in 3 months
- **Staff efficiency**: 40% fewer unnecessary calls
- **Revenue recovery**: Track slots saved from filling cancelled appointments

### User Trust
- **Staff confidence**: Survey after 1 month
- **Explanation clarity**: Track "Why?" button clicks
- **Override rate**: < 10% (staff disagreeing with AI)

---

## 🔧 Technical Implementation Notes

### Database Schema Changes

**Add to `appointments` table**:
```sql
ALTER TABLE appointments ADD COLUMN past_no_show_count INT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN past_appointment_count INT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN lead_time_days INT;
ALTER TABLE appointments ADD COLUMN risk_reasons JSON;
ALTER TABLE appointments ADD COLUMN risk_confidence DECIMAL(3,2);
```

### API Contract

**Request to AI Service**:
```json
POST /predict
{
  "patient_id": "hash_12345",
  "age": 23,
  "past_no_show_count": 3,
  "past_appointment_count": 8,
  "lead_time_days": 1,
  "appointment_hour": 16,
  "appointment_type": "routine",
  "day_of_week": 1
}
```

**Response from AI Service**:
```json
{
  "risk_score": 0.87,
  "risk_level": "high",
  "confidence": 0.82,
  "risk_reasons": [...],
  "recommendation": {...}
}
```

---

## 🎓 Key Learning Resources

### Machine Learning
- [Scikit-learn Random Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [Imbalanced Learning Techniques](https://imbalanced-learn.org/)

### Explainable AI
- [SHAP Documentation](https://shap.readthedocs.io/)
- [Interpretable ML Book](https://christophm.github.io/interpretable-ml-book/)

### Healthcare ML
- [NCBI: Predicting No-shows](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6425606/)
- [Machine Learning in Healthcare](https://academic.oup.com/jamia/article/25/5/505/4924858)

---

## ⚠️ Important Considerations

### Privacy & Compliance
- All patient data must be de-identified
- HIPAA compliance if in US (PHI handling)
- GDPR compliance if in EU
- Audit logs for all predictions

### Bias & Fairness
- Monitor performance across age groups
- Check for insurance type bias
- Avoid proxy discrimination
- Regular bias audits

### Clinical Integration
- Never replace clinical judgment
- Staff can always override AI
- Track override patterns
- Continuous feedback loop

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 9, 2025 | Use Random Forest over Logistic Regression | Better accuracy, handles non-linear patterns |
| Nov 9, 2025 | Start with rule-based XAI | Faster to implement, good enough for MVP |
| Nov 9, 2025 | Generate synthetic data first | No real data available yet, faster deployment |
| Nov 9, 2025 | 8 core features for Phase 1 | Balance between accuracy and complexity |

---

**Next Steps**: Proceed with Phase 1 implementation ✅
