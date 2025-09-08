import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const alertRoutes = require('./routes/alerts.routes');
const incidentRoutes = require('./routes/incidents.routes');
const assetRoutes = require('./routes/assets.routes');
const iocRoutes = require('./routes/ioc.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const userRoutes = require('./routes/users.routes');
const aiAgentRoutes = require('./routes/ai-agents.routes');
const playbookRoutes = require('./routes/playbooks.routes');
const settingsRoutes = require('./routes/settings.routes');
const testDataRoutes = require('./routes/test-data.routes');
const embeddingsRoutes = require('./routes/embeddings.routes');
const chatRoutes = require('./routes/chat.routes');
const aiGenerationLogsRoutes = require('./routes/ai-generation-logs.routes');
const aiAgentLogsRoutes = require('./routes/ai-agent-logs.routes');
const aiProviderRoutes = require('./routes/ai-providers.routes');
const notificationRoutes = require('./routes/notifications.routes');
const threatIntelRoutes = require('./routes/threat-intel.routes');
const externalRoutes = require('./routes/external.routes');
const searchRoutes = require('./routes/search.routes');
const aiAgentProfilesRoutes = require('./routes/aiAgentProfiles.routes');
const logAnalyzerRoutes = require('./routes/logAnalyzer.routes');
const aiLlmLogsRoutes = require('./routes/aiLlmLogs.routes');
const threatHuntingRoutes = require('./routes/threatHunting.routes');
const ttpRoutes = require('./routes/ttp.routes');
const mitreRoutes = require('./routes/mitre.routes');
const attackRoutes = require('./routes/attack.routes');
const orchestrationRoutes = require('./routes/orchestration.routes');
const fineTuningRoutes = require('./routes/fineTuning.routes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Import database
const { initializeDatabase } = require('./database/models/index');

// Import WebSocket service
const webSocketService = require('./services/websocketService');
const notificationService = require('./services/notificationService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));

// CORS must be configured BEFORE rate limiting to allow preflight OPTIONS requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-HTTP-Method-Override'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Rate limiting AFTER CORS to avoid blocking preflight requests
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to attach WebSocket instance to requests
app.use((req: any, res: any, next: any) => {
  req.io = webSocketService.getIO();
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/threat-intel/iocs', iocRoutes);
app.use('/api/threat-intel', threatIntelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-agents', aiAgentRoutes);
app.use('/api/playbooks', playbookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/test-data', testDataRoutes);
app.use('/api/embeddings', embeddingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-generation-logs', aiGenerationLogsRoutes);
app.use('/api/ai-agent-logs', aiAgentLogsRoutes);
app.use('/api/ai-providers', aiProviderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai-agent-profiles', aiAgentProfilesRoutes);
app.use('/api/log-analyzer', logAnalyzerRoutes);
app.use('/api/ai-llm-logs', aiLlmLogsRoutes);
app.use('/api/threat-hunting', threatHuntingRoutes);
app.use('/api/ttp', ttpRoutes);
app.use('/api/mitre', mitreRoutes);
app.use('/api/attack', attackRoutes);
app.use('/api/orchestration', orchestrationRoutes);
app.use('/api/ai-tools/fine-tuning', fineTuningRoutes);

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'OpenSOC Backend API is running!',
    timestamp: new Date().toISOString()
  });
});


// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Initialize services and start server
let server: any;

async function startServer() {
  try {
    console.log('🚀 Starting OpenSOC Backend Server...');
    
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connected');
    
    // Recover any stale AI analysis jobs
    const aiAnalysisJobService = require('./services/aiAnalysisJobService');
    await aiAnalysisJobService.recoverStaleJobs();
    
    server = app.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
    });

    // Initialize WebSocket server
    webSocketService.initialize(server);
    
    // Connect notification service to WebSocket events
    setupNotificationWebSocketEvents();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Setup WebSocket event listeners for notifications
function setupNotificationWebSocketEvents() {
  const emitter = notificationService.getEmitter();

  // Listen for notification creation events
  emitter.on('notification:created', async (data: any) => {
    await webSocketService.emitNewNotification(data.notification);
  });

  // Listen for email notification events
  emitter.on('notification:email', (data: any) => {
    // TODO: Implement email sending logic
    console.log(`📧 Email notification would be sent to: ${data.userEmail}`);
  });

  // Listen for webhook notification events
  emitter.on('notification:webhook', (data: any) => {
    // TODO: Implement webhook sending logic
    console.log(`🪝 Webhook notification would be sent to: ${data.webhookUrl}`);
  });

  // Listen for critical notification events
  emitter.on('notification:critical', (data: any) => {
    // TODO: Implement additional critical notification handling (SMS, Slack, etc.)
    console.log(`🚨 Critical notification: ${data.notification.title}`);
  });

  // Listen for bulk notification events
  emitter.on('notifications:bulk_read', (data: any) => {
    webSocketService.emitBulkNotificationUpdate(data.userId, 'bulk_read', data);
  });

  console.log('✅ Notification WebSocket events configured');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;