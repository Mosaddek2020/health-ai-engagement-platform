# Hospital Workflow & Business Logic

**Date**: November 9, 2025  
**Purpose**: Document the real-world hospital workflow and how the AI platform supports it

---

## 🏥 Core Business Problem

### The No-Show Crisis
- **Average no-show rate**: 15-30% across healthcare
- **Cost per no-show**: $150-$300 (lost doctor time)
- **Annual impact**: Millions in lost revenue for medium hospitals
- **Hidden cost**: Other patients who could have been scheduled

### The Opportunity Cost
When a patient doesn't show:
1. ✅ Doctor's time is wasted (paid regardless)
2. ✅ Exam room sits empty
3. ✅ **Another patient could have been seen** ← Key insight
4. ✅ Waitlist patients remain waiting

**Platform Goal**: Predict high-risk no-shows early → Confirm or replace them → Maximize utilization

---

## 📊 Current Appointment Lifecycle

### Stage 1: Scheduling
**Trigger**: Patient calls/books online  
**Action**: Appointment created with status = `Scheduled`  
**System Records**:
- Patient information
- Appointment time & type
- Provider assigned
- Lead time calculated

### Stage 2: AI Risk Assessment
**Trigger**: Staff clicks "Run AI Processing"  
**Action**: AI agent analyzes each appointment  
**Output**:
- Risk score (0-100%)
- Risk reasons (explainable)
- Recommendation (call/SMS/ignore)

**System Updates**:
- `no_show_risk` set
- `status` → `Confirmation Sent` (for normal risk)
- High-risk appointments → Action Queue

### Stage 3: Manual Review (High-Risk)
**Trigger**: High-risk appointment appears in Action Queue  
**Staff Actions**:

#### Option A: Confirm Appointment ✅
- Staff calls patient
- Patient confirms: "Yes, I'll be there"
- System: `status` → `Confirmed`
- **Outcome**: Appointment secured, keep slot

#### Option B: Skip/Cancel ⏭️
- Staff calls patient: Can't reach / Patient cancels
- System: `status` → `Skipped`
- **Outcome**: **Slot now available for waitlist**

#### Option C: Ignore (Take Risk)
- Staff decides not to call
- System: Remains in Action Queue
- **Outcome**: Hope patient shows up

### Stage 4: Appointment Day
**Actual Outcomes**:
- Patient shows up → `status` = `Completed`
- Patient no-shows → `status` = `No-Show`, increment `past_no_show_count`
- Patient cancels → `status` = `Cancelled`

### Stage 5: Learning Loop (Future)
**System learns from outcomes**:
- Did high-risk patients actually no-show?
- Did low-risk predictions hold?
- Retrain model quarterly with real data

---

## 🎯 Workflow States & Transitions

```
[New Appointment]
       ↓
   Scheduled
       ↓
   [AI Processing]
       ↓
   ┌───────────────┬───────────────┐
   ↓               ↓               ↓
Low Risk      Medium Risk     High Risk (>70%)
   ↓               ↓               ↓
Confirmation   Confirmation    Action Queue
  Sent            Sent         (Manual Review)
                                   ↓
                    ┌──────────────┼──────────────┐
                    ↓              ↓              ↓
                Confirmed      Skipped       (Ignored)
                    ↓              ↓              ↓
              [Keep Slot]  [Fill from      [Take Risk]
                           Waitlist]
```

---

## 📋 KPI Dashboard Logic

### Current Implementation (4 Cards)

#### 1. Total Appointments
**Definition**: All scheduled appointments  
**Query**: `COUNT(*) FROM appointments`  
**Business Meaning**: Total capacity utilized

#### 2. Confirmed
**Definition**: Appointments confirmed by staff or patient  
**Query**: `WHERE status = 'Confirmed'`  
**Business Meaning**: Secured slots (high confidence)

#### 3. Pending
**Definition**: Awaiting confirmation (normal risk)  
**Query**: `WHERE status IN ('Scheduled', 'Confirmation Sent')`  
**Business Meaning**: Normal workflow, no urgent action needed

#### 4. ⚠️ High Risk
**Definition**: High no-show risk, needs immediate action  
**Query**: `WHERE no_show_risk > 0.7 AND status NOT IN ('Confirmed', 'Skipped')`  
**Business Meaning**: **ACTION REQUIRED** - Call these patients NOW

### Proposed Enhancement (Future)

#### 5. 🔄 Available Slots
**Definition**: High-risk appointments that were cancelled/skipped  
**Query**: `WHERE no_show_risk > 0.7 AND status = 'Skipped'`  
**Business Meaning**: **OPPORTUNITY** - Fill from waitlist  
**Action**: Send SMS to waitlist patients: "Slot available tomorrow 2pm"

#### 6. Success Rate
**Definition**: Confirmed appointments / Total processed  
**Formula**: `(Confirmed) / (Confirmed + Skipped + High Risk) * 100%`  
**Business Meaning**: Staff efficiency metric

---

## 🔔 Action Queue Behavior

### Purpose
**Focused attention on high-risk appointments requiring immediate intervention**

### Display Rules

**Show in Action Queue if**:
- `no_show_risk > 0.7` (70%+ risk)
- `status NOT IN ('Confirmed', 'Skipped')`

**Remove from Action Queue when**:
- Staff clicks "✓ Mark as Confirmed" → `status = 'Confirmed'`
- Staff clicks "⏭️ Skip" → `status = 'Skipped'`

### Why Remove Skipped?
**User Question**: "Should skipped appointments stay in action queue?"

**Answer**: **NO** - Staff made a decision:
1. ✅ **Confirmed** → Patient will come, keep slot
2. ⏭️ **Skipped** → Patient won't come (cancelled/unreachable), slot available
3. Both are "resolved" - no further action needed

**If kept in queue**: Staff would see same appointment repeatedly ❌

---

## 👥 User Roles & Permissions (Future)

### Front Desk Staff
- View dashboard
- Run AI processing
- Confirm/skip appointments
- Cannot modify risk scores

### Clinical Staff
- View confirmed appointments
- Cannot modify schedules
- View patient history

### Admin/Manager
- Full access
- View analytics
- Override AI decisions
- Configure model settings

---

## 💬 Staff Communication Scripts

### High-Risk Confirmation Call

**When**: Patient has 70%+ no-show risk  
**Goal**: Confirm attendance or free up slot

**Script**:
```
"Hi [Patient Name], this is [Staff Name] from [Clinic Name].

I'm calling to confirm your appointment on [Date] at [Time] with 
Dr. [Provider].

[If patient has no-show history:]
I noticed you've had to reschedule a few times in the past - 
is everything okay? We want to make sure this time works for you.

Can I confirm you'll be able to make it?

[If yes:] Great! We'll see you then. Please arrive 10 minutes early.

[If no:] No problem, let's find a better time that works for you. 
Or if you'd like to cancel, we can offer this slot to someone on 
our waitlist."
```

### Why This Works
- ✅ Non-judgmental tone
- ✅ Acknowledges past (builds trust)
- ✅ Offers alternatives (reschedule vs cancel)
- ✅ Frames cancellation positively ("help waitlist")

---

## 🔄 Waitlist Integration (Phase 2)

### The Opportunity
When appointment is skipped:
1. Slot becomes available (e.g., "Tomorrow 2 PM with Dr. Smith")
2. Send SMS to waitlist patients
3. First to respond gets the slot
4. Metrics: "Recovered Slots" = Revenue saved

### Implementation Plan

#### Database Schema
```sql
CREATE TABLE waitlist_patients (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255),
  patient_phone VARCHAR(20),
  preferred_provider VARCHAR(255),
  preferred_times JSON,  -- e.g., ["morning", "afternoon"]
  max_lead_time_days INT,  -- e.g., 7 (only next 7 days)
  created_at TIMESTAMP
);
```

#### When Appointment Skipped
```php
// Triggered in skipAppointment()
if ($appointment->no_show_risk > 0.7 && $status == 'Skipped') {
    // Find matching waitlist patients
    $waitlistMatches = WaitlistPatient::where('preferred_provider', $appointment->provider_name)
        ->orWhereNull('preferred_provider')  // Any provider OK
        ->get();
    
    // Send SMS to all matches
    foreach ($waitlistMatches as $patient) {
        SMS::send($patient->phone, 
            "🏥 Appointment available: {$appointment->appointment_time} with {$appointment->provider_name}. Reply YES to claim."
        );
    }
}
```

#### SMS Response Handling
```php
// Webhook from SMS provider
Route::post('/sms/response', function(Request $request) {
    if (strtoupper($request->body) == 'YES') {
        // Assign appointment to this waitlist patient
        // Remove from waitlist
        // Notify other waitlist patients (slot taken)
    }
});
```

### Metrics to Track
- **Slots recovered**: How many skipped slots were filled
- **Response time**: How fast waitlist patients claim slots
- **Revenue recovered**: Slots filled × average appointment value

---

## 📊 Analytics & Reporting (Future Phase)

### Daily Dashboard
- No-show rate today vs yesterday
- High-risk appointments resolved
- Slots recovered from waitlist
- Staff efficiency (calls per confirmed appointment)

### Weekly Report
- Trending no-show patterns (day of week, provider, type)
- Model accuracy (predicted vs actual)
- Staff performance metrics

### Monthly Business Review
- Revenue impact: Saved vs lost
- Model improvements (retraining results)
- Patient satisfaction scores

---

## 🎓 Training Materials for Staff

### Onboarding Checklist
- [ ] Platform overview video (5 min)
- [ ] How to read risk scores
- [ ] When to call vs SMS vs ignore
- [ ] How to use Action Queue
- [ ] Communication scripts
- [ ] Override procedures

### Key Messages
1. **AI is a tool, not a replacement**: You make final decisions
2. **Trust the reasons**: If AI says "3 past no-shows", it's accurate
3. **Focus on high-risk**: Don't waste time on low-risk confirmations
4. **Your input matters**: Report false positives/negatives

---

## ⚠️ Edge Cases & Handling

### Case 1: Patient Disputes No-Show History
**Scenario**: "I've never missed an appointment!"  
**Action**: 
1. Verify in system
2. If system error: Update record, retrain model
3. If accurate: Apologize for confusion, focus on future

### Case 2: VIP Patient Flagged as High-Risk
**Scenario**: Hospital board member flagged with 80% risk  
**Action**:
1. Staff can override (mark as Confirmed without call)
2. System tracks override reason
3. Learn: Add "VIP" feature to model?

### Case 3: Emergency/Urgent Appointments
**Scenario**: Patient with acute pain (very low no-show risk)  
**Action**:
1. Model should detect `appointment_type = 'urgent'` → Low risk
2. If flagged incorrectly: Override
3. Emergency appointments skip AI processing

### Case 4: Mass Cancellations (Weather, Emergency)
**Scenario**: Snowstorm, clinic closes  
**Action**:
1. Bulk cancel all appointments for the day
2. Don't count as "no-shows" in training data
3. System flag: `force_majeure_cancellation = true`

---

## 🚀 Future Enhancements

### Phase 2: Patient Self-Service
- SMS link: "Confirm your appointment" → Button click → Auto-confirm
- Reduce staff workload
- Faster response time

### Phase 3: Dynamic Scheduling
- AI suggests optimal appointment times per patient
- "This patient prefers 10am Tuesday, avoid Friday afternoons"

### Phase 4: Predictive Overbooking
- Like airlines: Schedule 105 appointments for 100 slots
- Based on predicted no-shows
- Maximize utilization without double-booking

### Phase 5: Multi-Clinic Optimization
- Share waitlist across multiple clinic locations
- Route patients to nearest available slot

---

## 📝 Lessons Learned

| Issue | What We Learned | Action Taken |
|-------|-----------------|--------------|
| Skipped appointments stayed in Action Queue | Staff saw same appointments repeatedly | Exclude `status = 'Skipped'` from queue |
| Notifications not visible when scrolled | Messages missed in header | Fixed position toast notifications |
| Dashboard not auto-refreshing | Manual reload required after actions | Implemented React Query refetch + WebSockets |
| No explanation for risk scores | Staff didn't trust AI | Adding XAI with reasons |

---

**Next Review**: After Phase 1 deployment (2 weeks from now)  
**Owner**: Product Team  
**Stakeholders**: Front desk staff, clinical operations, IT
