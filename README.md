# OpenSOC - Open Source AI-Powered Security Operations Center

> **OpenSOC was created for the [OpenAI Open Model Hackathon 2025](https://openai.devpost.com/) (September 11, 2025 • $30,000+ Prize Pool) - demonstrating how gpt-oss models can democratize cybersecurity for organizations worldwide.**

## 🛡️ The Story Behind OpenSOC

**The Problem**: Small and medium businesses face an impossible choice - pay $500,000+ annually for enterprise SOC services, hire expensive security teams they can't afford, or operate without proper cybersecurity protection, leaving them vulnerable to devastating attacks.

**The Solution**: OpenSOC leverages the power of gpt-oss models to create an intelligent, automated Security Operations Center that provides enterprise-grade protection at a fraction of the cost. By automating 70%+ of routine security operations through AI agents, we're making advanced cybersecurity accessible to organizations of all sizes.

**For Humanity**: In an era where cyberattacks can destroy businesses overnight, OpenSOC serves as a digital guardian - protecting the economic backbone of communities worldwide while contributing to global cybersecurity resilience.

## 🎯 OpenAI Hackathon Categories

- **Most Useful**: Real-world impact for underserved SMB market
- **For Humanity**: Democratizing cybersecurity protection globally
- **Best Local Agent**: Complete AI agent ecosystem with gpt-oss models

## 🌐 Official Website & Resources

**🔗 Official Website**: [https://c6web.com/opensoc/](https://c6web.com/opensoc/)

**📺 Demo YouTube Video**: [OpenSOC Demo](https://www.youtube.com/watch?v=81_H2NIq5Ag)

Visit our official website for comprehensive resources:
- **📚 Detailed Documentation** - Complete guides and tutorials  
- **⚙️ Setup Information** - Advanced configuration options
- **🎯 Use Cases** - Real-world implementation examples
- **📞 Support** - Community and technical support

## 🌟 Overview

OpenSOC provides enterprise-grade security monitoring and incident response capabilities through intelligent automation and AI agents, making advanced cybersecurity accessible to organizations of all sizes.

### Key Features

- **🤖 AI-Powered Automation** - 70%+ automation of routine security operations
- **⚡ Quick Start** - Get basic SOC capabilities running in under 30 minutes
- **📊 Real-time Monitoring** - Live dashboards with WebSocket-based updates
- **🔍 Advanced Analytics** - ML-powered threat detection and correlation
- **🎯 Threat Hunting** - Proactive threat detection with AI assistance
- **📋 Incident Response** - Complete workflow management and automation
- **🌐 Multi-Integration** - NVIDIA NAT, MCP, and external tool support

## 🚀 Quick Start

> **⚡ Recommended**: For the easiest setup experience, follow our comprehensive quick-start guide at [https://c6web.com/opensoc/quick-start](https://c6web.com/opensoc/quick-start) which contains a developer POC Docker image link for easier setup.

### GitHub Repository Setup (Advanced Users)

> **Note**: This GitHub repository setup requires additional technical skills and troubleshooting knowledge for database migration and seeding. For easier POC setup with pre-configured Docker image, we recommend using the quick-start guide above.

### Prerequisites

- Docker & Docker Compose
- Git
- 32GB+ RAM recommended
- 200GB+ available disk space

### Installation

```bash
# Clone the repository
git clone https://github.com/victortong-git/opensoc
cd opensoc

# Start the platform
./start.sh

# Initialize database (first-time setup)
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

### Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Default Login**: `admin` / `password`

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** with TypeScript for type safety
- **Redux Toolkit** for state management
- **Vite** with HMR for fast development
- **Tailwind CSS** for responsive UI design
- **WebSocket** for real-time updates

#### Backend
- **Node.js** with Express.js REST API
- **Sequelize ORM** with PostgreSQL
- **Socket.io** for real-time communication
- **JWT** authentication
- **Docker Compose** orchestration

#### AI Stack
- **NVIDIA NeMo Agent Toolkit (NAT)** - AI agent framework
- **Model Control Protocol (MCP)** - AI service orchestration
- **Hugging Face Transformers** - Text embeddings and NLP
- **pgvector** - Vector similarity search
- **Multiple AI Providers** - OpenAI, Anthropic, Local models

#### Database
- **PostgreSQL 17** with pgvector extension
- **Vector embeddings** for semantic search
- **Multi-tenant architecture** with organization isolation
- **Time-series optimization** for security events

### Container Architecture

```yaml
Services:
├── frontend (React)     - Port 3000
├── backend (Node.js)    - Port 3001  
├── db (PostgreSQL)      - Port 5432
├── nvidia-nat (NAT)     - Port 8000
└── nvidia-nat-mcp (MCP) - Port 9901
```

## 📋 Features

### 🛡️ Core SOC Operations

#### Dashboard & Monitoring
- **Real-time Security Metrics** - Alert trends, incident tracking, AI triage rates
- **Live Data Visualization** - Interactive charts with severity breakdowns
- **Asset Status Monitoring** - Network inventory with health tracking
- **Threat Level Assessment** - Dynamic threat level indicators
- **WebSocket Updates** - Live data feeds with fallback polling

#### Alert Management
- **AI-Powered Triage** - One-click analysis with confidence scoring
- **Multi-Status Workflow** - new → incident_likely/review_required/analysis_uncertain → resolved
- **Advanced Filtering** - Real-time search across multiple dimensions
- **Bulk Operations** - Batch processing and status updates
- **False Positive Learning** - AI feedback loops for accuracy improvement

#### Incident Response
- **Complete Lifecycle Management** - Investigation → Containment → Recovery
- **Timeline Tracking** - Chronological event reconstruction
- **Automated Workflows** - AI-driven response recommendations
- **SLA Compliance** - Response time tracking and metrics
- **Collaborative Features** - Multi-user investigation support

#### Asset Management
- **Comprehensive Inventory** - Multi-type asset support (servers, workstations, network devices, cloud services)
- **Security Posture Monitoring** - Risk scoring and vulnerability tracking
- **Real-time Status** - Online/offline/maintenance/compromised states
- **Criticality Assessment** - Business impact and risk analysis

### 🤖 AI-Powered Features

#### AI Agents System
- **SOC Analyst Agent** - Alert triage and prioritization
- **Incident Response Agent** - Automated response workflows
- **Threat Intelligence Agent** - IOC enrichment and attribution
- **Report Agent** - Automated documentation generation

#### Chat System (AI SOC Consultant)
- **RAG-Enhanced Intelligence** - Context-aware responses with source attribution
- **Tool Integration** - Embedded security tool execution
- **Conversation Management** - History, search, and analytics
- **Real-time Processing** - Step-by-step tool execution tracking

#### Text Embeddings & Search
- **Semantic Search** - Vector-based similarity search across all data
- **Hybrid Search** - Combined text and semantic matching
- **NovaSearch/stella_en_400M_v5** - Advanced embedding models
- **Query Classification** - Intelligent search optimization

### 🔍 Intelligence & Analytics

#### Threat Intelligence
- **IOC Management** - Multi-type support (IP, domain, hash, email, etc.)
- **Threat Actor Profiling** - Sophistication levels and attribution
- **Campaign Tracking** - Victim impact and timeline analysis
- **Automated Enrichment** - Context from multiple intelligence sources

#### MITRE ATT&CK Integration
- **Complete Framework Access** - Enterprise/Mobile/ICS platforms
- **AI-Enhanced Analysis** - Automated TTP mapping and recommendations
- **Technique Correlation** - Alert-to-technique mapping
- **Detection Strategy** - Mitigation and detection recommendations

#### Advanced Analytics
- **Multi-Domain Analytics** - Alerts, incidents, assets, threats
- **Trend Analysis** - Historical patterns and forecasting
- **Performance Metrics** - SOC team effectiveness tracking
- **Custom Dashboards** - Configurable analytics views

### 🔧 Orchestration & Integration

#### NVIDIA NAT Server
- **Workflow Orchestration** - NAT function execution and management
- **Health Monitoring** - Service availability and performance tracking
- **Test Execution** - Automated workflow validation
- **Container Management** - Lifecycle control and monitoring

#### MCP Integration
- **Protocol Management** - Model Control Protocol communication
- **Service Integration** - Multi-model orchestration
- **Error Handling** - Recovery mechanisms and fallback
- **Performance Optimization** - Latency tracking and optimization

#### AI Provider Management
- **Multi-Provider Support** - OpenAI, Anthropic, LM Studio, vLLM
- **Provider Testing** - Real-time connectivity and response validation
- **Cost Tracking** - Usage monitoring and optimization
- **Failover Management** - Redundancy and reliability

### 🔍 Advanced Tools

#### Log Analyzer
- **Multi-Format Support** - Various log file formats and sources
- **AI-Powered Analysis** - Pattern recognition and anomaly detection
- **Batch Processing** - Large-scale log analysis with progress tracking
- **Real-time Processing** - Live log analysis and alerting

#### Threat Hunting
- **Guided Hunt Creation** - AI-assisted hypothesis generation
- **Investigation Workflows** - Multi-stage evidence collection
- **IOC Correlation** - Cross-reference with intelligence feeds
- **Collaborative Hunting** - Team-based investigation features

#### Fine-Tuning Support
- **Dataset Management** - Training data export and curation
- **Quality Assessment** - Confidence-based filtering
- **Multiple Formats** - JSONL, CSV, JSON export options
- **Training Guides** - Platform-specific integration examples

### 📱 System Administration

#### User & Organization Management
- **Multi-Tenant Architecture** - Organization-based data isolation
- **JWT Authentication** - Secure token-based access control
- **Activity Tracking** - Comprehensive audit logging
- **API Key Management** - Service account authentication

#### Test Data Generation
- **AI-Powered Generation** - Realistic security scenarios
- **Multi-Type Support** - Alerts, incidents, assets, IOCs, playbooks
- **Quality Validation** - Completeness checking and validation
- **Batch Operations** - Large-scale data generation with progress tracking

#### Settings & Configuration
- **Theme Management** - Light/dark mode support
- **Integration Settings** - External system configuration
- **Performance Tuning** - Optimization and caching controls
- **Notification Management** - Multi-channel alert delivery

## 📂 Project Structure

```
opensoc/
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── alerts/        # Alert management components
│   │   │   ├── dashboard/     # Dashboard widgets
│   │   │   ├── chat/          # AI chat interface
│   │   │   ├── analytics/     # Analytics charts
│   │   │   └── ...
│   │   ├── pages/             # Route-level page components
│   │   ├── services/          # API clients and utilities
│   │   ├── store/             # Redux state management
│   │   ├── types/             # TypeScript type definitions
│   │   └── hooks/             # Custom React hooks
│   └── package.json
├── backend/                     # Node.js Express API
│   ├── src/
│   │   ├── controllers/       # API endpoint handlers
│   │   ├── services/          # Business logic and AI services
│   │   ├── database/          # Sequelize models and migrations
│   │   │   ├── models/       # Database models
│   │   │   ├── migrations/   # Schema migrations
│   │   │   └── seeders/      # Sample data
│   │   ├── middleware/        # Authentication and validation
│   │   ├── routes/           # Express route definitions
│   │   ├── tools/            # AI tools and utilities
│   │   └── utils/            # Helper functions
│   └── package.json
├── my-agents/                   # NVIDIA NAT agent configurations
├── ollama_provider/            # Local AI model integration
├── attack-stix-data/           # MITRE ATT&CK data
├── docker-compose.yml          # Container orchestration
├── start.sh                    # Quick start script
└── stop.sh                     # Shutdown script
```

## 🔧 Development

### Development Environment Setup

```bash
# Frontend development
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000

# Backend development
cd backend  
npm install
npm run dev  # Starts on http://localhost:3001

# Database operations
npm run db:migrate     # Run migrations
npm run db:seed        # Add sample data
npm run db:reset       # Reset database
npm run db:fresh       # Reset + migrate + seed
```

### Code Quality

```bash
# Frontend
npm run lint           # ESLint checking
npm run build          # TypeScript compilation

# Backend
npm run lint           # ESLint checking
npm run lint:fix       # Auto-fix issues
npm test              # Jest testing
```

### Docker Development

```bash
# Start development environment
./start.sh

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Execute commands in containers
docker compose exec backend npm run db:migrate
docker compose exec backend bash

# Stop all services
./stop.sh
```

### Database Management

```bash
# Connect to database
PGPASSWORD=secure_password_123 psql -h localhost -U agentic -d agentic_soc

# View tables
\dt

# Check migrations
SELECT * FROM "SequelizeMeta" ORDER BY name;

# Monitor vector embeddings
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'embedding' AND table_schema = 'public';
```


### Environment Variables

```bash
# Backend Configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com

# AI Integration
NVIDIA_API_KEY=your_nvidia_api_key (This is not required as this docker included Ollama provider for NVIDIA NAT)
OLLAMA_HOST=http://ollama:11434
LLM_BASE_URL=http://localhost:1234/v1

# External Services
VIRUSTOTAL_API_KEY=your_virustotal_key
THREATFOX_API_KEY=your_threatfox_key
```


### Code Standards

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Jest** for testing (>90% coverage target)
- **Docker** for development environment
- **Conventional Commits** for changelog generation
- **TDD approach** with comprehensive testing

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check for port usage
   lsof -i :3000  # Frontend
   lsof -i :3001  # Backend
   lsof -i :5432  # Database
   ```

2. **Database Connection**
   ```bash
   # Test database connection
   docker compose exec backend npm run db:create
   ```

3. **AI Service Issues**
   ```bash
   # Check NAT server status
   curl http://localhost:8000/generate -X POST -H "Content-Type: application/json" -d '{"input_message":"health"}'
   ```

4. **Memory Issues**
   ```bash
   # Monitor container resources
   docker stats
   ```

### Logs and Debugging

```bash
# Application logs
docker compose logs -f backend frontend

# Database logs
docker compose logs -f db

# AI service logs
docker compose logs -f nvidia-nat nvidia-nat-mcp

# Access container shells
docker compose exec backend bash
docker compose exec frontend sh
```

## 👨‍💻 Developer & Contributions

**Developer**: This app created and developed by Victor Tong

**Contribution Policy**: Open Source community contribution is not available until the OpenAI Hackathon competition result announced.

## 🙏 Acknowledgments

- **NVIDIA** for the NeMo Agent Toolkit
- **Hugging Face** for transformer models
- **OpenAI** for LLM model GPT-OSS
- **MITRE** for the ATT&CK framework
- **Open Source Community** for countless libraries and tools

---

**🛡️ Protecting organizations worldwide through open-source security operations.**

*Built with ❤️ by Victor Tong*