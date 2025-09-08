# OpenSOC Frontend

A professional Security Operations Center (SOC) frontend built with React, TypeScript, and Tailwind CSS.

## Features

- **Hardcoded Authentication**: Login with `admin` / `password`
- **Real-time Dashboard**: Security metrics, threat indicators, live event feed
- **Alert Management**: Comprehensive alert filtering, bulk actions, detailed views
- **Incident Response**: Workflow tracking, timeline management, status updates  
- **Asset Inventory**: Network asset monitoring, risk assessment, health tracking
- **Professional UI**: Dark theme optimized for SOC operations

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Login Credentials

- **Username**: admin
- **Password**: password

## Mock Data

The application includes comprehensive mock data:

- **50+ Security Alerts** across all severity levels
- **15+ Incidents** in various workflow stages
- **30+ Network Assets** with realistic properties
- **Real-time Event Simulation** (new events every 30 seconds)
- **Historical Trend Data** for dashboard visualizations

## Key Components

### Dashboard
- Real-time security metrics
- Interactive threat level indicator
- Live security events feed
- Asset status overview
- Alert trend charts

### Alerts Management
- Advanced filtering by severity, status, source system
- Bulk operations (resolve, false positive)
- Detailed alert inspection with AI analysis
- Integration with incident creation workflow

### Incident Response
- Visual workflow tracking (Open → Investigating → Contained → Resolved)
- Timeline reconstruction of security events
- Assignment and collaboration features
- Progress indicators for active investigations

### Asset Inventory
- Grid and table view modes
- Asset health monitoring and risk scoring
- Vulnerability tracking
- Comprehensive asset details with security metrics

## Technology Stack

- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Redux Toolkit**: Predictable state management
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Interactive data visualization
- **Vite**: Fast development and build tooling
- **Lucide React**: Professional iconography

## Architecture

### State Management
- Redux store with dedicated slices for each domain
- Real-time updates simulation
- Optimistic UI updates

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   ├── alerts/         # Alert management components
│   └── layout/         # Navigation and layout
├── pages/              # Route-level page components
├── store/              # Redux state management
├── services/           # API simulation and utilities
├── types/              # TypeScript type definitions
└── data/               # Mock data generators
```

### Authentication Flow
- Hardcoded credential validation
- JWT token simulation (localStorage)
- Protected route wrapper
- Automatic session persistence

### Real-time Features
- Simulated WebSocket updates
- Live metric counters
- Auto-refreshing security events
- Real-time status indicators

## Development

### Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run build  # Includes TypeScript compilation

# Linting
npm run lint
```

### Customization

The application is designed to be easily customizable:

- **Branding**: Update colors in `tailwind.config.js`
- **Mock Data**: Modify files in `src/data/`
- **Components**: Add new components following existing patterns
- **Routing**: Extend routes in `src/App.tsx`

### Mock API Integration

The current implementation uses mock data and services. To integrate with a real backend:

1. Replace mock services in `src/services/`
2. Update Redux async actions
3. Configure API base URLs
4. Implement proper authentication flow

## Demo Features

This demo showcases:

- **Professional SOC Design**: Dark theme, security-focused UI patterns
- **Comprehensive Workflows**: End-to-end security operations
- **Real-time Operations**: Live updates and notifications
- **Scalable Architecture**: Production-ready code structure
- **Accessibility**: Keyboard navigation and screen reader support

## Next Steps

For production deployment:

1. **Backend Integration**: Connect to real security data sources
2. **Authentication**: Implement proper RBAC and SSO
3. **Real-time Updates**: WebSocket or Server-Sent Events
4. **Performance**: Implement pagination, virtualization
5. **Testing**: Add comprehensive test coverage
6. **Deployment**: Docker containerization and CI/CD

## Support

This is a demonstration frontend for the OpenSOC project. For questions or contributions, please refer to the main project documentation.