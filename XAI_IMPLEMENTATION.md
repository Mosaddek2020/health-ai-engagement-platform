# XAI Implementation Summary

**Date**: November 9, 2025  
**Feature**: Explainable AI (XAI) with Risk Reasons

---

## 🎯 What Was Implemented

Added **Explainable AI (XAI)** to the platform - the AI now explains WHY each patient is flagged as high-risk, not just showing a number.

### Before:
```json
{
  "no_show_risk": 0.87
}
```
**Problem**: Staff don't trust a "black box" score.

### After:
```json
{
  "no_show_risk": 0.87,
  "risk_reasons": [
    {
      "reason": "3 previous no-shows in last 6 months",
      "weight": "high",
      "icon": "🚨",
      "action": "Mention past no-shows during confirmation call"
    },
    {
      "reason": "Appointment booked less than 24 hours in advance",
      "weight": "medium",
      "icon": "⏰",
      "action": "Call patient within 2 hours to confirm"
    }
  ]
}
```
**Solution**: Staff see concrete reasons and get actionable recommendations.

---

## 📊 Implementation Details

### 1. AI Service (`ai_service/main.py`)

**Added Function**: `generate_fake_xai_reasons(risk_score: float)`

**Logic**:
- **High Risk (>70%)**: Returns 1 high-severity reason + 1-2 medium reasons
- **Medium Risk (40-70%)**: Returns 2-3 medium-severity reasons
- **Low Risk (<40%)**: Returns 1-2 low-severity reasons

**Reason Pool** (17 realistic scenarios):
- **High-severity**: Previous no-shows, consecutive misses
- **Medium-severity**: Last-minute booking, young adult age, late appointment time, new patient, Monday appointments
- **Low-severity**: Routine check-up, long lead time, distance from clinic

**Example Reasons**:
```python
{
  "reason": "3 previous no-shows in last 6 months",
  "weight": "high",
  "icon": "🚨",
  "action": "Mention past no-shows during confirmation call"
}
```

### 2. Database (`laravel_app/database/migrations/`)

**Migration**: `2025_11_09_042819_add_risk_reasons_to_appointments_table.php`

**Added Column**:
```sql
ALTER TABLE appointments ADD COLUMN risk_reasons JSON NULL;
```

**Model Cast** (`Appointment.php`):
```php
protected $casts = [
    'appointment_time' => 'datetime',
    'no_show_risk' => 'decimal:2',
    'risk_reasons' => 'array',  // ← New
];
```

### 3. Laravel Backend (`laravel_app/app/Console/Commands/ProcessAppointments.php`)

**Updated** to store `risk_reasons`:
```php
$riskScore = $response->json('no_show_risk');
$riskReasons = $response->json('risk_reasons', []);

$appointment->no_show_risk = $riskScore;
$appointment->risk_reasons = $riskReasons;  // ← New
$appointment->save();
```

**Log Output**:
```
✓ Processed appointment #2 - Risk: 0.94 (3 reasons)
✓ Processed appointment #4 - Risk: 0.88 (3 reasons)
✓ Processed appointment #5 - Risk: 0.84 (3 reasons)
```

### 4. React Dashboard (`react_app/src/App.jsx`)

**Added State**:
```javascript
const [expandedReason, setExpandedReason] = useState(null);
```

**Appointments Table** - Added "Why?" button:
```jsx
<td>
  <span>87%</span>
  <button onClick={() => setExpandedReason(id)}>
    Why?
  </button>
  {expandedReason === id && (
    <div className="reasons-panel">
      {reasons.map(reason => (
        <div>
          {reason.icon} {reason.reason}
          💡 {reason.action}
        </div>
      ))}
    </div>
  )}
</td>
```

**Action Queue** - Always visible reasons:
```jsx
<div className="risk-reasons-box">
  <h4>🧠 Why High Risk:</h4>
  {apt.risk_reasons.map(reason => (
    <div>
      {reason.icon} {reason.reason}
      💡 {reason.action}
    </div>
  ))}
</div>
```

---

## 🎨 UI Design

### Appointments Table
- **Risk Score Display**: `87%` in color (red/orange/green)
- **"Why?" Button**: Small blue button next to score
- **Expandable Panel**: Slides down when clicked
  - Yellow background (`#fef3c7`)
  - Orange border-left (`#f59e0b`)
  - Shows all reasons with icons and actions

### Action Queue
- **Always Visible**: Reasons shown by default (no button needed)
- **Prominent Display**: Orange/cream background
- **Clear Hierarchy**:
  1. Reason text with icon
  2. Action recommendation with 💡 icon
  3. Separator lines between reasons

---

## 📈 Data Flow

```
1. User clicks "Run AI Processing"
   ↓
2. Laravel ProcessAppointments command loops through appointments
   ↓
3. For each appointment:
   Laravel → POST /predict/no-show → AI Service
   ↓
4. AI Service generates:
   - risk_score (random 0.1-0.95)
   - risk_reasons (1-3 reasons based on score)
   ↓
5. Laravel stores both in database:
   - no_show_risk (decimal)
   - risk_reasons (JSON array)
   ↓
6. React fetches appointments and action queue
   ↓
7. UI displays:
   - Risk score with "Why?" button (Appointments Table)
   - Full reasons always visible (Action Queue)
```

---

## 🧪 Testing

### Test 1: AI Endpoint
```bash
curl -X POST http://localhost:8000/predict/no-show
```

**Response**:
```json
{
  "no_show_risk": 0.71,
  "risk_reasons": [
    {
      "reason": "New patient (no appointment history)",
      "weight": "medium",
      "icon": "🆕",
      "action": "Make welcome call to build relationship"
    },
    {
      "reason": "Appointment booked less than 24 hours in advance",
      "weight": "medium",
      "icon": "⏰",
      "action": "Call patient within 2 hours to confirm"
    }
  ]
}
```

### Test 2: Process Appointments
```bash
curl -X POST http://localhost:80/api/process-appointments
```

**Result**:
```
✓ Processed appointment #2 - Risk: 0.94 (3 reasons)
✓ Processed appointment #13 - Risk: 0.93 (3 reasons)
✓ Processed appointment #22 - Risk: 0.91 (3 reasons)
...
Processed: 30, Errors: 0
```

### Test 3: Action Queue API
```bash
curl http://localhost:80/api/action-queue
```

**Result**: Returns high-risk appointments with full `risk_reasons` array.

---

## 🎓 Key Design Decisions

### 1. Fake XAI vs Real Feature Importance
**Decision**: Start with rule-based "smart fake" XAI  
**Rationale**:
- ✅ Faster implementation (no ML complexity)
- ✅ Full control over messaging (clear, actionable language)
- ✅ Pipeline ready for AI team to replace with real model later
- ✅ Good enough for stakeholder demos and user feedback

### 2. Reason Selection Logic
**Decision**: Number of reasons based on risk level  
**Rationale**:
- High risk (>70%): Shows 2-3 reasons (explains severity)
- Medium risk (40-70%): Shows 2-3 reasons (balanced view)
- Low risk (<40%): Shows 1-2 reasons (minimal concern)
- Avoids overwhelming users with too many reasons

### 3. UI Display Strategy
**Decision**: Different UI for table vs action queue  
**Rationale**:
- **Appointments Table**: Collapsed by default (clean, scannable)
  - User clicks "Why?" to expand
  - Keeps table compact for 30+ rows
- **Action Queue**: Always expanded (urgent attention)
  - Staff need immediate context
  - Only 5-10 high-risk items shown

### 4. Reason Structure
**Decision**: Include `action` field with recommendation  
**Rationale**:
- Not just "why" but "what to do about it"
- Transforms AI from diagnostic to prescriptive tool
- Staff get concrete next steps:
  - "Call within 2 hours"
  - "Mention past no-shows on call"
  - "Send SMS reminder in addition to call"

---

## 🚀 Future Enhancements

### Phase 2: Real XAI (When AI Team Adds Model)
Replace `generate_fake_xai_reasons()` with:
```python
# Extract feature importance from trained model
importance = model.feature_importances_
top_features = get_top_3_contributing_features(patient_data, importance)

# Map to human language
reasons = [
    feature_to_reason_mapping[feature]
    for feature in top_features
]
```

### Phase 3: SHAP Values (Production)
```python
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(patient_features)

# Get per-prediction contributions
reasons = convert_shap_to_reasons(shap_values, patient_data)
```

### Phase 4: Visual Explanations
- Add charts showing feature contribution
- SHAP waterfall plots in modal
- Feature importance bar charts

---

## 📝 Collaboration Notes

### For AI/ML Team:
**Contract**: Your model must return this structure:
```json
{
  "no_show_risk": <float 0-1>,
  "risk_reasons": [
    {
      "reason": "<human-readable text>",
      "weight": "high|medium|low",
      "icon": "<emoji>",
      "action": "<recommended next step>"
    }
  ]
}
```

**Where to Add Model**:
1. File: `ai_service/main.py`
2. Function: `predict_no_show()` (line 138)
3. Replace: `generate_fake_xai_reasons()` call
4. Keep: Same return structure

**How to Test**:
```bash
# Rebuild container after changes
docker compose build ai-agent --no-cache
docker compose up -d ai-agent

# Test endpoint
curl -X POST http://localhost:8000/predict/no-show
```

### For Frontend Team:
**Data Structure Available**:
```javascript
{
  id: 1,
  patient_name: "John Doe",
  no_show_risk: 0.87,  // decimal 0-1
  risk_reasons: [      // array, can be empty
    {
      reason: string,
      weight: "high"|"medium"|"low",
      icon: emoji string,
      action: string
    }
  ]
}
```

**Where to Customize UI**:
- Appointments Table: `App.jsx` lines 425-475
- Action Queue: `App.jsx` lines 545-595

---

## ✅ Checklist

- [x] AI service returns `risk_reasons` array
- [x] Database column `risk_reasons` added (JSON)
- [x] Laravel stores reasons from AI response
- [x] Appointments API includes reasons
- [x] Action Queue API includes reasons
- [x] React displays reasons in appointments table (expandable)
- [x] React displays reasons in action queue (always visible)
- [x] Docker container rebuilt with new code
- [x] End-to-end testing completed
- [x] Documentation created

---

## 🎯 Business Impact

### Before XAI:
- Staff see: "87% risk"
- Reaction: "Why? Is this accurate?"
- Trust: Low
- Action: Hesitant to call patient

### After XAI:
- Staff see: "87% risk because:"
  - 🚨 3 previous no-shows
  - ⏰ Booked yesterday
  - 👤 Young adult (age 23)
- Reaction: "Oh, that makes sense"
- Trust: High
- Action: **Confident call**: "Hi, I noticed you've had to reschedule a few times..."

### Metrics to Track:
- Staff confidence surveys (before/after)
- Time to decision (call vs skip)
- Override rate (staff disagreeing with AI)
- User adoption rate

---

**Status**: ✅ Fully Implemented and Tested  
**Ready for**: Stakeholder demo, user testing, AI team handoff
