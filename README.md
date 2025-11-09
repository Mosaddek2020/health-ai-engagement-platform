# health-ai-engagement-platform
AI-powered platform to predict and reduce patient no-shows. Features smart triage, automated intake, and engagement workflows for healthcare providers using EHRs like Epic.

## 🚀 Current Version: V1.3

### ✨ Latest Features
- **V1.2**: Real-time WebSocket updates via Laravel Reverb (no more polling!)
- **V1.3**: Interactive manual controls - Confirm/Skip appointments directly from dashboard
- **V1.1**: Live dashboard with AI-powered risk predictions

See [QUICK_START_V1.2_V1.3.md](./QUICK_START_V1.2_V1.3.md) for new features guide.

## Architecture

This platform uses a microservices architecture with the following components:

- **Laravel Backend**: PHP-based API and backend logic
- **Laravel Reverb**: WebSocket server for real-time updates
- **PostgreSQL Database**: Persistent data storage
- **React Frontend (Vite)**: Modern frontend application with real-time sync
- **AI Agent Service**: Python FastAPI microservice for ML predictions

## Services

### 1. AI Agent Service (ai-agent)
- **Technology**: Python 3.11, FastAPI, scikit-learn
- **Port**: 8000
- **Endpoint**: `http://ai-agent:8000/predict`
- **Purpose**: Provides ML-based risk score predictions for patient no-shows

### 2. Laravel Application
- **Technology**: PHP 8.2, Laravel
- **Port**: Internal (via nginx)
- **Purpose**: Main backend API and business logic

### 3. Laravel Reverb (NEW in V1.2)
- **Technology**: Laravel Reverb WebSocket Server
- **Port**: 8080
- **Endpoint**: `ws://localhost:8080`
- **Purpose**: Real-time broadcasting for instant dashboard updates

### 4. PostgreSQL Database
- **Technology**: PostgreSQL 15
- **Port**: 5432
- **Database**: health_ai_db

### 5. Nginx Web Server
- **Technology**: Nginx Alpine
- **Port**: 80
- **Purpose**: Serves Laravel application

### 6. React Frontend
- **Technology**: React 18, Vite, Laravel Echo
- **Port**: 5173
- **Purpose**: User interface with real-time WebSocket connections

## Getting Started

### Prerequisites
- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Mosaddek2020/health-ai-engagement-platform.git
cd health-ai-engagement-platform
```

2. Start all services:
```bash
docker-compose up -d
```

3. Check service status:
```bash
docker-compose ps
```

4. View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-agent
```

### Accessing Services

- **React Frontend**: http://localhost:5173
- **Laravel API (via Nginx)**: http://localhost:80
- **AI Agent Service**: http://localhost:8000
- **AI Agent API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### AI Agent API Usage

The AI Agent service provides a `/predict` endpoint for risk score predictions.

**Example Request:**
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "previous_no_shows": 1,
    "days_until_appointment": 5,
    "appointment_hour": 14,
    "patient_id": "P12345"
  }'
```

**Example Response:**
```json
{
  "risk_score": 0.6543,
  "risk_level": "medium",
  "patient_id": "P12345"
}
```

### Calling AI Agent from Laravel

In your Laravel application, you can call the AI agent service using the environment variable `AI_AGENT_URL`:

```php
use Illuminate\Support\Facades\Http;

$response = Http::post(env('AI_AGENT_URL') . '/predict', [
    'age' => 35,
    'previous_no_shows' => 1,
    'days_until_appointment' => 5,
    'appointment_hour' => 14,
    'patient_id' => 'P12345'
]);

$riskData = $response->json();
// $riskData['risk_score'] => 0.6543
// $riskData['risk_level'] => 'medium'
```

## Development

### Stopping Services
```bash
docker-compose down
```

### Stopping and Removing Volumes
```bash
docker-compose down -v
```

### Rebuilding Services
```bash
docker-compose build
docker-compose up -d
```

### Rebuilding Specific Service
```bash
docker-compose build ai-agent
docker-compose up -d ai-agent
```

## Service Communication

Services communicate within the `health-ai-network` Docker network:

- Laravel can access AI Agent at: `http://ai-agent:8000`
- Laravel can access PostgreSQL at: `postgres:5432`
- React can access Laravel API at: `http://nginx:80`

## Project Structure

```
health-ai-engagement-platform/
├── ai_service/                 # AI Agent microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── laravel_app/               # Laravel application
│   └── Dockerfile
├── react_app/                 # React frontend
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── nginx/                     # Nginx configuration
│   └── default.conf
├── docker-compose.yml         # Docker Compose configuration
└── README.md
```

## Environment Variables

### Laravel (.env)
```env
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=health_ai_db
DB_USERNAME=health_ai_user
DB_PASSWORD=health_ai_pass
AI_AGENT_URL=http://ai-agent:8000

# Reverb WebSocket Configuration (V1.2)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=296025
REVERB_APP_KEY=8hlc5bhzgdhjhjwvol15
REVERB_APP_SECRET=xqe78njrewxbsv59dug6
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
```

## Dashboard Features

### V1.3 - Current Version
- **Real-time Updates**: WebSocket connections eliminate polling delays
- **Manual Controls**: Confirm or skip high-risk appointments with one click
- **Multi-user Sync**: All connected dashboards update instantly
- **AI Processing**: Click to analyze all appointments and calculate risk scores
- **Action Queue**: Prioritized list of high-risk patients (>70% no-show risk)
- **KPI Cards**: Live statistics - Total, Confirmed, Pending, High-risk counts
- **Toast Notifications**: Real-time feedback for all actions

### API Endpoints
```
GET  /api/kpi-stats                    - Dashboard statistics
GET  /api/appointments                 - All appointments
GET  /api/action-queue                 - High-risk appointments (>70%)
GET  /api/action-log                   - Recent processing history
POST /api/process-appointments         - Run AI analysis
POST /api/reset-appointments           - Reset all to initial state
POST /api/appointments/{id}/confirm    - Manually confirm appointment
POST /api/appointments/{id}/skip       - Skip/remove from queue
```

### WebSocket Events
The dashboard listens to the `appointments` channel and receives instant updates for:
- AI processing complete
- Appointments reset
- Manual confirmation
- Manual skip

## Troubleshooting

### WebSocket Connection Issues
```bash
# Check Reverb is running
docker compose ps reverb

# Check Reverb logs
docker compose logs reverb

# Restart Reverb
docker compose restart reverb

# Verify port 8080 is available
netstat -an | grep 8080
```

### Services not starting
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs ai-agent
```

### Port conflicts
If ports 80, 5173, 5432, or 8000 are already in use, modify the port mappings in `docker-compose.yml`.

### AI Agent health check failing
```bash
# Check if service is running
docker-compose ps ai-agent

# Check health endpoint
curl http://localhost:8000/health
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.
