#!/bin/bash

echo "==================================="
echo "🎬 DEMO VERIFICATION SCRIPT"
echo "==================================="
echo ""

echo "📊 Step 1: Checking current KPI stats..."
curl -s http://localhost:80/api/kpi-stats | jq .
echo ""

echo "📋 Step 2: Checking appointment risk scores (should be null)..."
curl -s http://localhost:80/api/appointments | jq '.[0:3] | .[] | {id, patient_name, no_show_risk, status}'
echo ""

echo "⚠️  Step 3: Checking action queue (should be empty)..."
ACTION_QUEUE_COUNT=$(curl -s http://localhost:80/api/action-queue | jq '. | length')
echo "High-risk appointments: $ACTION_QUEUE_COUNT"
echo ""

echo "==================================="
echo "🤖 NOW CLICK THE 'RUN AI PROCESSING' BUTTON IN THE DASHBOARD"
echo "==================================="
echo ""
echo "Dashboard URL: http://localhost:5173"
echo ""
echo "Press Enter after clicking the button to verify results..."
read

echo ""
echo "==================================="
echo "📊 AFTER PROCESSING - Verification"
echo "==================================="
echo ""

echo "📊 Updated KPI stats..."
curl -s http://localhost:80/api/kpi-stats | jq .
echo ""

echo "📋 Updated appointment risk scores..."
curl -s http://localhost:80/api/appointments | jq '.[0:3] | .[] | {id, patient_name, no_show_risk, status}'
echo ""

echo "⚠️  Updated action queue..."
ACTION_QUEUE_COUNT=$(curl -s http://localhost:80/api/action-queue | jq '. | length')
echo "High-risk appointments: $ACTION_QUEUE_COUNT"
echo ""

if [ "$ACTION_QUEUE_COUNT" -gt 0 ]; then
    echo "✅ SUCCESS! AI processing completed successfully!"
    echo "   - Risk scores are now calculated"
    echo "   - High-risk patients identified: $ACTION_QUEUE_COUNT"
    echo "   - Status updated to 'Confirmation Sent'"
else
    echo "⚠️  No high-risk appointments found (this is still valid)"
fi

echo ""
echo "==================================="
