#!/bin/bash

# ==============================================================================
# Agentic SOC Database Setup Script
# ==============================================================================
# This script sets up the complete database infrastructure for the Agentic SOC
# platform, including Docker containers, PostgreSQL with pgvector, Redis,
# database migrations, and initial data seeding.
#
# Usage: ./setup_database.sh [OPTIONS]
# Options:
#   --reset     Drop and recreate all databases (destructive)
#   --migrate   Run migrations only
#   --seed      Run seeding only
#   --help      Show this help message
#
# Requirements:
#   - Docker and Docker Compose installed
#   - Bash shell environment
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
MIGRATIONS_DIR="$BACKEND_DIR/src/database/migrations"
SEEDERS_DIR="$BACKEND_DIR/src/database/seeders"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
LOG_FILE="$SCRIPT_DIR/database_setup.log"

# Database connection configuration
DATABASE_URL="postgresql://agentic:secure_password_123@localhost:5432/agentic_soc"

# Function definitions
print_header() {
    echo -e "${PURPLE}================================================================================================${NC}"
    echo -e "${PURPLE}🚀 AGENTIC SOC DATABASE SETUP${NC}"
    echo -e "${PURPLE}================================================================================================${NC}"
    echo -e "${CYAN}Setting up PostgreSQL, Redis, migrations, and seed data for the SOC platform${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

show_help() {
    echo "Agentic SOC Database Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --reset     Drop and recreate all databases (destructive operation)"
    echo "  --migrate   Run database migrations only"
    echo "  --seed      Run database seeding only"
    echo "  --help      Show this help message"
    echo ""
    echo "Default behavior (no options): Full setup including containers, migrations, and seeding"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full setup"
    echo "  $0 --reset           # Reset and full setup"
    echo "  $0 --migrate         # Run migrations only"
    echo "  $0 --seed            # Run seeding only"
}

check_requirements() {
    print_step "Checking system requirements..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Determine Docker Compose command
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    # Check if required files and directories exist
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "docker-compose.yml not found at: $COMPOSE_FILE"
        exit 1
    fi
    
    if [[ ! -d "$BACKEND_DIR" ]]; then
        print_error "Backend directory not found at: $BACKEND_DIR"
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

setup_directories() {
    print_step "Setting up data directories..."
    
    # Create local data directories for Docker volumes
    mkdir -p "$SCRIPT_DIR/postgres_data"
    mkdir -p "$SCRIPT_DIR/redis_data"
    
    # Set appropriate permissions (ignore errors if not possible)
    chmod 755 "$SCRIPT_DIR/postgres_data" 2>/dev/null || true
    chmod 755 "$SCRIPT_DIR/redis_data" 2>/dev/null || true
    
    print_success "Data directories created"
}

start_containers() {
    print_step "Starting Docker containers..."
    
    # Stop any existing containers
    $COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Start containers in detached mode
    if $COMPOSE_CMD -f "$COMPOSE_FILE" up -d db redis; then
        print_success "Docker containers started successfully"
    else
        print_error "Failed to start Docker containers"
        exit 1
    fi
    
    # Wait for PostgreSQL to be ready
    print_step "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db pg_isready -U agentic -d agentic_soc >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "PostgreSQL failed to start after $max_attempts attempts"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    # Wait a bit more for full initialization
    sleep 3
}

reset_database() {
    print_step "Resetting database (dropping all tables)..."
    
    # Get list of tables to drop
    local tables_query="SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    local tables
    
    if tables=$($COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -t -c "$tables_query" 2>/dev/null); then
        # Drop each table with CASCADE to handle foreign key dependencies
        while IFS= read -r table; do
            table=$(echo "$table" | xargs)  # Trim whitespace
            if [[ -n "$table" ]]; then
                $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -c "DROP TABLE IF EXISTS \"$table\" CASCADE;" >/dev/null 2>&1 || true
                echo "Dropped table: $table"
            fi
        done <<< "$tables"
        print_success "Database reset completed"
    else
        print_warning "Database reset encountered issues (this may be normal if database is empty)"
    fi
}

run_migrations() {
    print_step "Running database migrations..."
    
    # Ensure backend container is running for migrations
    if ! $COMPOSE_CMD -f "$COMPOSE_FILE" ps backend | grep -q "Up"; then
        print_step "Starting backend container for migrations..."
        $COMPOSE_CMD -f "$COMPOSE_FILE" up -d backend >/dev/null 2>&1
        
        # Wait for backend to be ready
        sleep 5
    fi
    
    # Run migrations using the backend container
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T backend npm run db:migrate 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Database migrations completed successfully"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

run_seeding() {
    print_step "Running database seeding..."
    
    print_step "Seeding organizations..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -c "
        INSERT INTO \"organizations\" (id, name, domain, settings, created_at, updated_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'Demo Corporation',
            'demo.corp',
            '{\"timezone\":\"UTC\",\"alertRetentionDays\":90,\"incidentRetentionDays\":365,\"enableAIAgents\":true,\"enablePlaybooks\":true,\"threatIntelFeeds\":[\"misp\",\"otx\",\"virustotal\"]}',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING;
    " >/dev/null 2>&1
    
    print_step "Seeding users..."
    local password_hash='\$2a\$12\$qKY85pmjXM0jKv7zUeKbUeZ/HLnyFgVuwwGhKKhPTm0lf3.PZaa9S'
    $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -c "
        INSERT INTO \"users\" (id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at, organization_id)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@demo.corp', '$password_hash', 'System', 'Administrator', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '550e8400-e29b-41d4-a716-446655440000'),
            ('550e8400-e29b-41d4-a716-446655440002', 'jsmith', 'j.smith@demo.corp', '$password_hash', 'John', 'Smith', 'analyst', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '550e8400-e29b-41d4-a716-446655440000'),
            ('550e8400-e29b-41d4-a716-446655440003', 'mwilson', 'm.wilson@demo.corp', '$password_hash', 'Maria', 'Wilson', 'analyst', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '550e8400-e29b-41d4-a716-446655440000'),
            ('550e8400-e29b-41d4-a716-446655440004', 'rjohnson', 'r.johnson@demo.corp', '$password_hash', 'Robert', 'Johnson', 'viewer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '550e8400-e29b-41d4-a716-446655440000')
        ON CONFLICT (id) DO NOTHING;
    " >/dev/null 2>&1
    
    print_step "Seeding assets..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -c "
        INSERT INTO \"assets\" (id, name, asset_type, ip_address, hostname, os_type, os_version, criticality, location, owner, status, tags, metadata, last_seen, organization_id, created_at, updated_at)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440010', 'DC-SERVER-01', 'server', '10.0.1.10', 'dc-server-01.demo.corp', 'Windows Server 2022', '21H2', 'critical', 'Data Center A - Rack 1', 'IT Department', 'active', '{}', '{\"department\":\"IT\",\"services\":[\"Active Directory\",\"DNS\",\"DHCP\"],\"domainController\":true}', '2024-01-15 10:30:00+00', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('550e8400-e29b-41d4-a716-446655440011', 'WEB-SERVER-01', 'server', '10.0.1.20', 'web-server-01.demo.corp', 'Ubuntu Server 22.04', '22.04.3', 'high', 'DMZ - Rack 3', 'Web Development Team', 'active', '{}', '{\"department\":\"IT\",\"services\":[\"Apache2\",\"MySQL\",\"PHP\"],\"webApps\":[\"Corporate Website\",\"Employee Portal\"]}', '2024-01-15 10:25:00+00', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('550e8400-e29b-41d4-a716-446655440012', 'FIREWALL-01', 'network_device', '10.0.0.1', 'firewall-01.demo.corp', 'FortiOS', '7.4.1', 'critical', 'Network Closet A', 'Network Security Team', 'active', '{}', '{\"vendor\":\"Fortinet\",\"model\":\"FortiGate 100F\",\"features\":[\"IPS\",\"Web Filtering\",\"VPN\"]}', '2024-01-15 10:35:00+00', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('550e8400-e29b-41d4-a716-446655440013', 'LAPTOP-JSMITH', 'workstation', '10.0.2.15', 'laptop-jsmith.demo.corp', 'Windows 11 Pro', '23H2', 'medium', 'Remote - Home Office', 'John Smith', 'active', '{}', '{\"user\":\"jsmith\",\"department\":\"Finance\",\"model\":\"Dell Latitude 7420\"}', '2024-01-15 09:15:00+00', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('550e8400-e29b-41d4-a716-446655440014', 'CLOUD-WEB-01', 'cloud_service', '52.84.123.45', 'cloud-web-01.amazonaws.com', 'Amazon Linux 2', '2023.3.20231218', 'high', 'AWS US-East-1', 'Cloud Infrastructure Team', 'active', '{}', '{\"provider\":\"AWS\",\"instanceType\":\"t3.medium\",\"region\":\"us-east-1\"}', '2024-01-15 10:15:00+00', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
    " >/dev/null 2>&1
    
    print_success "Database seeding completed successfully"
}

show_status() {
    print_step "Checking database status..."
    
    # Show container status
    echo -e "${CYAN}Container Status:${NC}"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    
    # Test database connection
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -c "\dt" >/dev/null 2>&1; then
        print_success "Database connection successful"
        
        # Show table counts
        echo -e "${CYAN}Database Tables and Record Counts:${NC}"
        $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db psql -U agentic -d agentic_soc -t -c "
        SELECT 
            schemaname,
            relname as tablename,
            n_tup_ins as row_count
        FROM pg_stat_user_tables 
        ORDER BY relname;
        " 2>/dev/null || echo "Could not retrieve table statistics"
    else
        print_error "Database connection failed"
    fi
    
    echo ""
}

show_completion_info() {
    echo -e "${PURPLE}================================================================================================${NC}"
    echo -e "${GREEN}🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${PURPLE}================================================================================================${NC}"
    echo ""
    echo -e "${CYAN}📋 What was set up:${NC}"
    echo -e "   • PostgreSQL 17 with pgvector extension"
    echo -e "   • Redis for caching and session storage"
    echo -e "   • 10 database tables with proper relationships and indexes"
    echo -e "   • Sample data including organizations, users, and assets"
    echo -e "   • Migration tracking system"
    echo ""
    echo -e "${CYAN}🔗 Connection Details:${NC}"
    echo -e "   • PostgreSQL: localhost:5432"
    echo -e "   • Database: agentic_soc"
    echo -e "   • Username: agentic"
    echo -e "   • Password: secure_password_123"
    echo -e "   • Redis: localhost:6379"
    echo ""
    echo -e "${CYAN}🚀 Next Steps:${NC}"
    echo -e "   • Start the backend server: docker compose up backend"
    echo -e "   • Start the frontend: cd frontend && npm start"
    echo -e "   • Access the application at: http://localhost:3000"
    echo ""
    echo -e "${CYAN}🛠️  Management Commands:${NC}"
    echo -e "   • Reset database: ./setup_database.sh --reset"
    echo -e "   • Run migrations only: ./setup_database.sh --migrate"
    echo -e "   • Seed data only: ./setup_database.sh --seed"
    echo -e "   • View logs: tail -f database_setup.log"
    echo ""
    echo -e "${CYAN}📄 Default Login Credentials:${NC}"
    echo -e "   • Username: admin"
    echo -e "   • Password: password"
    echo ""
    echo -e "${PURPLE}================================================================================================${NC}"
}

# Main execution logic
main() {
    # Start logging
    echo "Database setup started at $(date)" >> "$LOG_FILE"
    
    print_header
    
    # Parse command line arguments
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --reset)
            check_requirements
            setup_directories
            start_containers
            reset_database
            run_migrations
            run_seeding
            show_status
            show_completion_info
            ;;
        --migrate)
            check_requirements
            start_containers
            run_migrations
            show_status
            ;;
        --seed)
            check_requirements
            start_containers
            run_seeding
            show_status
            ;;
        "")
            # Default: full setup
            check_requirements
            setup_directories
            start_containers
            run_migrations
            run_seeding
            show_status
            show_completion_info
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo "Database setup completed at $(date)" >> "$LOG_FILE"
}

# Handle script interruption
trap 'print_error "Script interrupted. Check containers with: docker compose ps"' INT TERM

# Run main function
main "$@"