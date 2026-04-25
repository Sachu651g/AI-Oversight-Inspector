# Climate Guardian Backend

AI-Powered Disaster Simulation & Decision Support System - Backend Service

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, redis, logger)
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic services
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/                # Compiled TypeScript output
├── logs/                # Application logs
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PORT`: Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `CLAUDE_API_KEY`: Anthropic Claude API key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`: Twilio SMS configuration

## 📊 Database Setup

### PostgreSQL + PostGIS

```bash
# Create database
createdb climate_guardian

# Enable PostGIS extension
psql climate_guardian -c "CREATE EXTENSION postgis;"

# Run migrations (TODO: implement migrations)
npm run migrate
```

### Redis

```bash
# Start Redis server
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 📝 API Endpoints

### Health Check
```
GET /health
```

### Risk Classification
```
POST /api/risk/classify
POST /api/risk/update
```

### Disaster Simulation
```
POST /api/simulate/generate
GET /api/simulate/frames/:simulationId
GET /api/simulate/history
```

### Decision Briefs & Alerts
```
POST /api/alert/generate
POST /api/alert/dispatch
GET /api/alert/status/:dispatchId
```

### Evacuation Routes
```
POST /api/evacuation-routes/calculate
GET /api/evacuation-routes/:zoneId
POST /api/evacuation-routes/optimize
```

### Audit Trail
```
GET /api/audit-trail
POST /api/audit-trail/verify
GET /api/transparency
```

## 🔐 Security

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- JWT authentication
- AES-256 encryption for sensitive data
- TLS 1.3 for data in transit

## 📈 Performance

- Redis caching (80%+ hit rate target)
- Database connection pooling
- Response compression
- Async/await for non-blocking operations

## 🐛 Debugging

```bash
# View logs
tail -f logs/combined.log
tail -f logs/error.log

# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 🚢 Deployment

### Docker

```bash
# Build Docker image
docker build -t climate-guardian-backend .

# Run container
docker run -p 5000:5000 --env-file .env climate-guardian-backend
```

### Docker Compose

```bash
# Start all services (app, PostgreSQL, Redis)
docker-compose up -d

# Stop all services
docker-compose down
```

## 📚 Documentation

- [Requirements](../.kiro/specs/climate-simulation-model/requirements.md)
- [Design](../.kiro/specs/climate-simulation-model/design.md)
- [Tasks](../.kiro/specs/climate-simulation-model/tasks.md)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow commit message conventions

## 📄 License

MIT License - See LICENSE file for details

---

**Climate Guardian** - Because every second counts 🌊
