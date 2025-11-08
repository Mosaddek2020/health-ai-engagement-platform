# Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Health AI Engagement Platform                    │
│                        Docker Compose Setup                          │
└─────────────────────────────────────────────────────────────────────┘

External Access Points:
├─ http://localhost:80    → Laravel API (via Nginx)
├─ http://localhost:5173  → React Frontend
├─ http://localhost:8000  → AI Agent API
└─ localhost:5432         → PostgreSQL (optional direct access)


┌──────────────────────────────────────────────────────────────────────┐
│                         Docker Network                                │
│                      health-ai-network                                │
│                                                                       │
│  ┌─────────────┐                                                     │
│  │   React     │  Port: 5173                                         │
│  │   (Vite)    │  - React 18                                         │
│  │             │  - Hot reload enabled                               │
│  └──────┬──────┘                                                     │
│         │                                                             │
│         │ HTTP                                                        │
│         ↓                                                             │
│  ┌─────────────┐                                                     │
│  │    Nginx    │  Port: 80                                           │
│  │             │  - Serves Laravel                                   │
│  └──────┬──────┘  - PHP-FPM proxy                                    │
│         │                                                             │
│         │ FastCGI                                                     │
│         ↓                                                             │
│  ┌─────────────┐         ┌──────────────┐                           │
│  │   Laravel   │────────→│  PostgreSQL  │  Port: 5432               │
│  │   (PHP)     │         │              │  - Database: health_ai_db  │
│  │             │         │              │  - Volume: postgres_data   │
│  └──────┬──────┘         └──────────────┘                           │
│         │                                                             │
│         │ HTTP POST                                                   │
│         │ /predict                                                    │
│         ↓                                                             │
│  ┌─────────────┐                                                     │
│  │  AI Agent   │  Port: 8000                                         │
│  │  (FastAPI)  │  - Python 3.11                                      │
│  │             │  - scikit-learn ML model                            │
│  │             │  - Endpoints:                                        │
│  │             │    • POST /predict                                   │
│  │             │    • GET /health                                     │
│  │             │    • GET /model/info                                │
│  │             │    • GET /docs (Swagger)                            │
│  └─────────────┘                                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘


Data Flow for Risk Prediction:
════════════════════════════════

1. User Request
   ↓
2. React Frontend (localhost:5173)
   ↓
3. Nginx (localhost:80)
   ↓
4. Laravel Backend
   │
   ├─→ PostgreSQL (get patient history)
   │   └─→ Returns: previous_no_shows, age
   │
   └─→ AI Agent Service (localhost:8000/predict)
       Request: {
         "age": 35,
         "previous_no_shows": 1,
         "days_until_appointment": 5,
         "appointment_hour": 14
       }
       ↓
       ML Model (RandomForestClassifier)
       ↓
       Response: {
         "risk_score": 0.6543,
         "risk_level": "medium"
       }
       ↓
5. Laravel processes response
   ↓
6. Return to React Frontend
   ↓
7. Display to User


File Structure:
═══════════════

health-ai-engagement-platform/
│
├── docker-compose.yml              # Main orchestration file
│
├── ai_service/                     # AI Agent Microservice
│   ├── Dockerfile                  # Python 3.11 image
│   ├── requirements.txt            # Python dependencies
│   └── main.py                     # FastAPI application
│
├── laravel_app/                    # Laravel Backend
│   ├── Dockerfile                  # PHP 8.2 image
│   ├── public/index.php           # Entry point
│   └── AIAgentService.php         # Example integration
│
├── react_app/                      # React Frontend
│   ├── Dockerfile                  # Node 18 image
│   ├── package.json               # NPM dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── index.html                 # HTML template
│   └── src/
│       ├── main.jsx               # React entry
│       └── App.jsx                # Main component
│
├── nginx/                          # Web Server Config
│   └── default.conf               # Nginx configuration
│
├── test_ai_agent.sh               # Test script
├── .gitignore                     # Git ignore rules
│
└── Documentation/
    ├── README.md                  # Main documentation
    ├── DOCKER_SETUP.md           # Setup guide
    └── IMPLEMENTATION_SUMMARY.md  # Implementation details


Service Dependencies:
═════════════════════

postgres (no dependencies)
    ↓
ai-agent (no dependencies)
    ↓
laravel (depends on: postgres, ai-agent)
    ↓
nginx (depends on: laravel)
    ↓
react (depends on: nginx)


Health Checks:
═════════════

✓ postgres: pg_isready command (every 10s)
✓ ai-agent: HTTP GET /health (every 30s, 40s startup)


Environment Variables:
═════════════════════

Laravel (.env):
- DB_CONNECTION=pgsql
- DB_HOST=postgres
- DB_PORT=5432
- DB_DATABASE=health_ai_db
- DB_USERNAME=health_ai_user
- DB_PASSWORD=health_ai_pass
- AI_AGENT_URL=http://ai-agent:8000

React (.env):
- VITE_API_URL=http://localhost:80
- VITE_AI_AGENT_URL=http://localhost:8000
