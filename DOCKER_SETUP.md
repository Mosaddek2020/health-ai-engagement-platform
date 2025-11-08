# Docker Compose Setup Guide

This guide explains how to set up and run the Health AI Engagement Platform using Docker Compose.

## Services Overview

The platform consists of 5 main services:

1. **postgres** - PostgreSQL 15 database
2. **ai-agent** - Python FastAPI microservice for AI predictions
3. **laravel** - PHP Laravel backend application
4. **nginx** - Web server for Laravel
5. **react** - React frontend with Vite

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose V2 installed
- At least 4GB of available RAM
- Ports 80, 5173, 5432, and 8000 available

## Quick Start

### 1. Start All Services

```bash
docker compose up -d
```

This command will:
- Build all custom Docker images
- Create the health-ai-network
- Start all services in the background
- Set up health checks

### 2. Check Service Status

```bash
docker compose ps
```

Expected output:
```
NAME                  SERVICE    STATUS      PORTS
health-ai-agent       ai-agent   running     0.0.0.0:8000->8000/tcp
health-ai-laravel     laravel    running     9000/tcp
health-ai-nginx       nginx      running     0.0.0.0:80->80/tcp
health-ai-postgres    postgres   running     0.0.0.0:5432->5432/tcp
health-ai-react       react      running     0.0.0.0:5173->5173/tcp
```

### 3. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f ai-agent
```

## Testing the AI Agent

### Using curl

```bash
# Test health endpoint
curl http://localhost:8000/health

# Make a prediction
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

### Using the test script

```bash
./test_ai_agent.sh
```

### API Documentation

Visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

## Service Communication

Services communicate via Docker network:

- **Laravel to AI Agent**: `http://ai-agent:8000`
- **Laravel to Postgres**: `postgres:5432`
- **React to Laravel**: `http://nginx:80`

## Managing Services

### Stop All Services

```bash
docker compose down
```

### Stop and Remove Volumes

```bash
docker compose down -v
```

⚠️ Warning: This will delete all database data!

### Rebuild Services

```bash
# Rebuild all
docker compose build

# Rebuild specific service
docker compose build ai-agent

# Rebuild and restart
docker compose up -d --build
```

### Restart a Service

```bash
docker compose restart ai-agent
```

### View Resource Usage

```bash
docker compose stats
```

## Development Workflow

### Making Changes to AI Agent

1. Edit files in `ai_service/`
2. Rebuild the service:
   ```bash
   docker compose build ai-agent
   docker compose up -d ai-agent
   ```

### Making Changes to React App

The React service uses volume mounting, so changes are reflected immediately:
1. Edit files in `react_app/src/`
2. Vite will auto-reload in the browser

### Making Changes to Laravel

1. Edit files in `laravel_app/`
2. Changes to most files are reflected immediately
3. For changes to dependencies:
   ```bash
   docker compose build laravel
   docker compose up -d laravel
   ```

## Troubleshooting

### Port Already in Use

If you get "port already allocated" errors:

1. Check what's using the port:
   ```bash
   lsof -i :8000  # or :80, :5173, :5432
   ```

2. Stop the conflicting service or modify ports in `docker-compose.yml`

### Service Won't Start

1. Check logs:
   ```bash
   docker compose logs <service-name>
   ```

2. Check if image built successfully:
   ```bash
   docker images | grep health-ai
   ```

3. Remove and rebuild:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

### AI Agent Health Check Failing

1. Check if the service is running:
   ```bash
   docker compose ps ai-agent
   ```

2. View logs:
   ```bash
   docker compose logs ai-agent
   ```

3. Test endpoint manually:
   ```bash
   curl http://localhost:8000/health
   ```

### Database Connection Issues

1. Ensure Postgres is healthy:
   ```bash
   docker compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker compose logs postgres
   ```

3. Test connection:
   ```bash
   docker compose exec postgres psql -U health_ai_user -d health_ai_db
   ```

## Environment Variables

### Laravel Environment

Create `laravel_app/.env` file:

```env
APP_NAME="Health AI Platform"
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=health_ai_db
DB_USERNAME=health_ai_user
DB_PASSWORD=health_ai_pass

AI_AGENT_URL=http://ai-agent:8000
```

### React Environment

Create `react_app/.env` file:

```env
VITE_API_URL=http://localhost:80
VITE_AI_AGENT_URL=http://localhost:8000
```

## Production Considerations

For production deployment:

1. **Use environment-specific configs**
   - Separate `docker-compose.prod.yml`
   - Use secrets management

2. **Security**
   - Change default passwords
   - Use HTTPS/TLS
   - Implement authentication

3. **Scaling**
   - Use multiple replicas
   - Add load balancer
   - Separate database server

4. **Monitoring**
   - Add logging aggregation
   - Implement health monitoring
   - Set up alerts

5. **Backups**
   - Regular database backups
   - Model versioning
   - Configuration backups

## Next Steps

1. Set up Laravel application (run migrations, seeders)
2. Configure AI model with real training data
3. Implement frontend features
4. Add authentication
5. Set up CI/CD pipeline
