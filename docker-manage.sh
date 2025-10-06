#!/bin/bash

# Energy Consumption App - Docker Management Script
# Usage: ./docker-manage.sh [command]

set -e

# Configuration
IMAGE_NAME="manzolo/energy-consumption"
CONTAINER_NAME="energy-consumption"
PORT="8000"
DB_PATH="./consumption.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}  Energy Consumption - Docker Manager${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
}

get_container_status() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "running"
        else
            echo "stopped"
        fi
    else
        echo "not_found"
    fi
}

build_image() {
    print_info "Building Docker image..."
    
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found!"
        exit 1
    fi
    
    # Get version from setup.py if exists
    VERSION=$(grep "version=" setup.py 2>/dev/null | cut -d"'" -f2 || echo "latest")
    
    docker build -t ${IMAGE_NAME}:${VERSION} -t ${IMAGE_NAME}:latest .
    
    if [ $? -eq 0 ]; then
        print_success "Image built successfully: ${IMAGE_NAME}:${VERSION}"
    else
        print_error "Build failed!"
        exit 1
    fi
}

start_container() {
    STATUS=$(get_container_status)
    
    if [ "$STATUS" == "running" ]; then
        print_warning "Container is already running!"
        print_info "Use 'restart' to restart the container"
        return
    fi
    
    print_info "Starting container..."
    
    # Create database file if it doesn't exist
    if [ ! -f "$DB_PATH" ]; then
        print_info "Creating database file..."
        touch "$DB_PATH"
    fi
    
    if [ "$STATUS" == "stopped" ]; then
        docker start ${CONTAINER_NAME}
    else
        docker run -d \
            --name ${CONTAINER_NAME} \
            --restart always \
            -p ${PORT}:${PORT} \
            -v $(pwd)/consumption.db:/app/consumption_app/data/consumption.db \
            ${IMAGE_NAME}:latest
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Container started successfully"
        print_info "Access the app at: http://localhost:${PORT}"
    else
        print_error "Failed to start container!"
        exit 1
    fi
}

stop_container() {
    STATUS=$(get_container_status)
    
    if [ "$STATUS" != "running" ]; then
        print_warning "Container is not running!"
        return
    fi
    
    print_info "Stopping container..."
    docker stop ${CONTAINER_NAME}
    
    if [ $? -eq 0 ]; then
        print_success "Container stopped successfully"
    else
        print_error "Failed to stop container!"
        exit 1
    fi
}

restart_container() {
    print_info "Restarting container..."
    stop_container
    sleep 2
    start_container
}

remove_container() {
    STATUS=$(get_container_status)
    
    if [ "$STATUS" == "not_found" ]; then
        print_warning "Container does not exist!"
        return
    fi
    
    if [ "$STATUS" == "running" ]; then
        print_info "Stopping container first..."
        stop_container
        sleep 2
    fi
    
    print_info "Removing container..."
    docker rm ${CONTAINER_NAME}
    
    if [ $? -eq 0 ]; then
        print_success "Container removed successfully"
    else
        print_error "Failed to remove container!"
        exit 1
    fi
}

show_logs() {
    STATUS=$(get_container_status)
    
    if [ "$STATUS" != "running" ]; then
        print_error "Container is not running!"
        exit 1
    fi
    
    print_info "Showing logs (Ctrl+C to exit)..."
    docker logs -f ${CONTAINER_NAME}
}

show_status() {
    STATUS=$(get_container_status)
    
    echo ""
    echo "Container Status:"
    echo "----------------"
    echo "Name: ${CONTAINER_NAME}"
    echo "Image: ${IMAGE_NAME}:latest"
    echo "Status: ${STATUS}"
    
    if [ "$STATUS" == "running" ]; then
        echo "Port: ${PORT}"
        echo "URL: http://localhost:${PORT}"
        echo ""
        echo "Container Info:"
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.ID}}\t{{.Status}}\t{{.Ports}}"
    fi
    echo ""
}

push_image() {
    print_info "Pushing image to Docker Hub..."
    
    # Check if logged in
    if ! docker info 2>/dev/null | grep -q "Username"; then
        print_warning "Not logged in to Docker Hub"
        print_info "Please login first with: docker login"
        exit 1
    fi
    
    VERSION=$(grep "version=" setup.py 2>/dev/null | cut -d"'" -f2 || echo "latest")
    
    print_info "Pushing ${IMAGE_NAME}:${VERSION}..."
    docker push ${IMAGE_NAME}:${VERSION}
    
    print_info "Pushing ${IMAGE_NAME}:latest..."
    docker push ${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        print_success "Images pushed successfully!"
    else
        print_error "Push failed!"
        exit 1
    fi
}

pull_image() {
    print_info "Pulling latest image from Docker Hub..."
    docker pull ${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        print_success "Image pulled successfully!"
    else
        print_error "Pull failed!"
        exit 1
    fi
}

clean_all() {
    print_warning "This will remove the container and all unused images!"
    read -p "Are you sure? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Cancelled"
        return
    fi
    
    remove_container
    
    print_info "Cleaning up unused images..."
    docker image prune -f
    
    print_success "Cleanup completed"
}

backup_db() {
    if [ ! -f "$DB_PATH" ]; then
        print_error "Database file not found!"
        exit 1
    fi
    
    BACKUP_NAME="consumption_backup_$(date +%Y%m%d_%H%M%S).db"
    
    print_info "Creating backup: ${BACKUP_NAME}..."
    cp "$DB_PATH" "$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        print_success "Backup created: ${BACKUP_NAME}"
    else
        print_error "Backup failed!"
        exit 1
    fi
}

show_help() {
    echo "Usage: ./docker-manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build      - Build Docker image"
    echo "  start      - Start container"
    echo "  stop       - Stop container"
    echo "  restart    - Restart container"
    echo "  remove     - Remove container"
    echo "  logs       - Show container logs"
    echo "  status     - Show container status"
    echo "  push       - Push image to Docker Hub"
    echo "  pull       - Pull latest image from Docker Hub"
    echo "  clean      - Remove container and unused images"
    echo "  backup-db  - Backup database"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-manage.sh build       # Build the image"
    echo "  ./docker-manage.sh start       # Start the container"
    echo "  ./docker-manage.sh logs        # View logs"
    echo "  ./docker-manage.sh backup-db   # Backup database"
    echo ""
}

# Main script
main() {
    print_header
    check_docker
    
    COMMAND=${1:-help}
    
    case $COMMAND in
        build)
            build_image
            ;;
        start)
            start_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        remove)
            remove_container
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        push)
            push_image
            ;;
        pull)
            pull_image
            ;;
        clean)
            clean_all
            ;;
        backup-db)
            backup_db
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"