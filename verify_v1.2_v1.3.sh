#!/bin/bash

echo "🔍 V1.2 & V1.3 Feature Verification"
echo "===================================="
echo ""

# Check Reverb server
echo "1️⃣ Checking Reverb WebSocket server..."
REVERB_STATUS=$(docker compose ps reverb | grep -c "Up")
if [ $REVERB_STATUS -eq 1 ]; then
    echo "   ✅ Reverb server is running"
else
    echo "   ❌ Reverb server is NOT running"
    echo "   Run: docker compose up -d reverb"
fi
echo ""

# Check Reverb logs
echo "2️⃣ Checking Reverb initialization..."
REVERB_INIT=$(docker compose logs reverb 2>/dev/null | grep -c "Starting server")
if [ $REVERB_INIT -gt 0 ]; then
    echo "   ✅ Reverb initialized successfully"
else
    echo "   ⚠️  Reverb may not be initialized properly"
fi
echo ""

# Test API endpoints
echo "3️⃣ Testing API endpoints..."

# Get action queue
QUEUE_COUNT=$(curl -s http://localhost:80/api/action-queue | jq '. | length')
echo "   📋 Action Queue: $QUEUE_COUNT high-risk appointments"

if [ $QUEUE_COUNT -gt 0 ]; then
    # Get first appointment ID
    FIRST_ID=$(curl -s http://localhost:80/api/action-queue | jq -r '.[0].id')
    FIRST_NAME=$(curl -s http://localhost:80/api/action-queue | jq -r '.[0].patient_name')
    
    echo "   🧪 Testing confirm endpoint with appointment #$FIRST_ID ($FIRST_NAME)..."
    CONFIRM_RESULT=$(curl -s -X POST http://localhost:80/api/appointments/$FIRST_ID/confirm | jq -r '.success')
    
    if [ "$CONFIRM_RESULT" = "true" ]; then
        echo "   ✅ Confirm endpoint working"
    else
        echo "   ❌ Confirm endpoint failed"
    fi
    
    # Get next appointment for skip test
    NEXT_ID=$(curl -s http://localhost:80/api/action-queue | jq -r '.[0].id')
    NEXT_NAME=$(curl -s http://localhost:80/api/action-queue | jq -r '.[0].patient_name')
    
    if [ ! -z "$NEXT_ID" ] && [ "$NEXT_ID" != "null" ]; then
        echo "   🧪 Testing skip endpoint with appointment #$NEXT_ID ($NEXT_NAME)..."
        SKIP_RESULT=$(curl -s -X POST http://localhost:80/api/appointments/$NEXT_ID/skip | jq -r '.success')
        
        if [ "$SKIP_RESULT" = "true" ]; then
            echo "   ✅ Skip endpoint working"
        else
            echo "   ❌ Skip endpoint failed"
        fi
    fi
else
    echo "   ⚠️  No high-risk appointments in queue. Run processing first."
fi
echo ""

# Check KPI stats after actions
echo "4️⃣ Checking KPI statistics..."
STATS=$(curl -s http://localhost:80/api/kpi-stats)
TOTAL=$(echo $STATS | jq -r '.total')
CONFIRMED=$(echo $STATS | jq -r '.confirmed')
HIGH_RISK=$(echo $STATS | jq -r '.high_risk')
echo "   📊 Total: $TOTAL | Confirmed: $CONFIRMED | High Risk: $HIGH_RISK"
echo ""

# Check React dependencies
echo "5️⃣ Checking React WebSocket dependencies..."
ECHO_INSTALLED=$(docker compose exec -T react npm list laravel-echo 2>/dev/null | grep -c "laravel-echo@")
PUSHER_INSTALLED=$(docker compose exec -T react npm list pusher-js 2>/dev/null | grep -c "pusher-js@")

if [ $ECHO_INSTALLED -gt 0 ]; then
    echo "   ✅ Laravel Echo installed"
else
    echo "   ❌ Laravel Echo NOT installed"
fi

if [ $PUSHER_INSTALLED -gt 0 ]; then
    echo "   ✅ Pusher JS installed"
else
    echo "   ❌ Pusher JS NOT installed"
fi
echo ""

# Summary
echo "📝 Summary"
echo "=========="
echo "V1.2 Real-time WebSockets:"
echo "  - Reverb server: $([ $REVERB_STATUS -eq 1 ] && echo '✅' || echo '❌')"
echo "  - React dependencies: $([ $ECHO_INSTALLED -gt 0 ] && [ $PUSHER_INSTALLED -gt 0 ] && echo '✅' || echo '❌')"
echo ""
echo "V1.3 Manual Controls:"
echo "  - Confirm endpoint: $([ ! -z "$CONFIRM_RESULT" ] && [ "$CONFIRM_RESULT" = "true" ] && echo '✅' || echo '⏭️')"
echo "  - Skip endpoint: $([ ! -z "$SKIP_RESULT" ] && [ "$SKIP_RESULT" = "true" ] && echo '✅' || echo '⏭️')"
echo ""

# Reset for next demo
echo "🔄 Resetting for next demo..."
RESET_RESULT=$(curl -s -X POST http://localhost:80/api/reset-appointments | jq -r '.success')
if [ "$RESET_RESULT" = "true" ]; then
    echo "   ✅ Appointments reset successfully"
else
    echo "   ❌ Reset failed"
fi
echo ""

echo "🎉 Verification Complete!"
echo ""
echo "📱 Next Steps:"
echo "1. Open dashboard: http://localhost:5173"
echo "2. Open DevTools → Console"
echo "3. Check WebSocket connection: echo.connector.pusher.connection.state"
echo "4. Open multiple tabs to see real-time sync"
echo "5. Click 'Process' and watch all tabs update instantly!"
