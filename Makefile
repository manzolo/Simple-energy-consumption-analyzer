# Energy Consumption App - Makefile
# Usage: make [target]

.PHONY: help build start stop restart remove logs status push pull clean backup-db dev install test

# Configuration
IMAGE_NAME := manzolo/energy-consumption
CONTAINER_NAME := energy-consumption
PORT := 8000
DB_PATH := ./consumption.db

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)=====================================$(NC)"
	@echo "$(BLUE)  Energy Consumption - Make targets$(NC)"
	@echo "$(BLUE)=====================================$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
#--no-cache 
build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	@docker build -t $(IMAGE_NAME):latest .
	@echo "$(GREEN)✓ Image built successfully$(NC)"

build-fast: ## Build Docker image with cache
	@echo "$(BLUE)Building Docker image (using cache)...$(NC)"
	@docker build -t $(IMAGE_NAME):latest .
	@echo "$(GREEN)✓ Image built successfully$(NC)"

start: ## Start container
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		echo "$(YELLOW)⚠ Container is already running$(NC)"; \
	else \
		if [ ! -f "$(DB_PATH)" ]; then \
			echo "$(BLUE)Creating database file...$(NC)"; \
			touch $(DB_PATH); \
		fi; \
		echo "$(BLUE)Starting container...$(NC)"; \
		if [ "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then \
			docker start $(CONTAINER_NAME); \
		else \
			docker run -d \
				--name $(CONTAINER_NAME) \
				--restart always \
				-p $(PORT):$(PORT) \
				-v $$(pwd)/consumption.db:/app/consumption_app/data/consumption.db \
				$(IMAGE_NAME):latest; \
		fi; \
		echo "$(GREEN)✓ Container started$(NC)"; \
		echo "$(BLUE)ℹ Access at: http://localhost:$(PORT)$(NC)"; \
	fi

stop: ## Stop container
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		echo "$(BLUE)Stopping container...$(NC)"; \
		docker stop $(CONTAINER_NAME); \
		docker rm -f $(CONTAINER_NAME); \
		echo "$(GREEN)✓ Container stopped$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Container is not running$(NC)"; \
	fi

restart: stop start ## Restart container

remove: ## Remove container
	@if [ "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then \
		if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
			echo "$(BLUE)Stopping container first...$(NC)"; \
			docker stop $(CONTAINER_NAME); \
		fi; \
		echo "$(BLUE)Removing container...$(NC)"; \
		docker rm $(CONTAINER_NAME); \
		echo "$(GREEN)✓ Container removed$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Container does not exist$(NC)"; \
	fi

logs: ## Show container logs
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		docker logs -f $(CONTAINER_NAME); \
	else \
		echo "$(RED)✗ Container is not running$(NC)"; \
	fi

status: ## Show container status
	@echo ""
	@echo "Container Status:"
	@echo "----------------"
	@echo "Name: $(CONTAINER_NAME)"
	@echo "Image: $(IMAGE_NAME):latest"
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		echo "Status: $(GREEN)running$(NC)"; \
		echo "Port: $(PORT)"; \
		echo "URL: http://localhost:$(PORT)"; \
		echo ""; \
		docker ps --filter "name=$(CONTAINER_NAME)" --format "table {{.ID}}\t{{.Status}}\t{{.Ports}}"; \
	elif [ "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then \
		echo "Status: $(YELLOW)stopped$(NC)"; \
	else \
		echo "Status: $(RED)not found$(NC)"; \
	fi
	@echo ""

push: ## Push image to Docker Hub
	@echo "$(BLUE)Pushing image to Docker Hub...$(NC)"
	@docker push $(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image pushed successfully$(NC)"

pull: ## Pull latest image from Docker Hub
	@echo "$(BLUE)Pulling latest image...$(NC)"
	@docker pull $(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image pulled successfully$(NC)"

clean: ## Remove container and unused images
	@echo "$(YELLOW)⚠ This will remove the container and unused images$(NC)"
	@read -p "Are you sure? (yes/no): " CONFIRM; \
	if [ "$$CONFIRM" = "yes" ]; then \
		$(MAKE) remove; \
		echo "$(BLUE)Cleaning unused images...$(NC)"; \
		docker image prune -f; \
		echo "$(GREEN)✓ Cleanup completed$(NC)"; \
	else \
		echo "$(BLUE)ℹ Cancelled$(NC)"; \
	fi

backup-db: ## Backup database
	@if [ ! -f "$(DB_PATH)" ]; then \
		echo "$(RED)✗ Database file not found$(NC)"; \
		exit 1; \
	fi
	@BACKUP_NAME="consumption_backup_$$(date +%Y%m%d_%H%M%S).db"; \
	echo "$(BLUE)Creating backup: $$BACKUP_NAME...$(NC)"; \
	cp $(DB_PATH) $$BACKUP_NAME; \
	echo "$(GREEN)✓ Backup created: $$BACKUP_NAME$(NC)"

dev: ## Run in development mode (local)
	@echo "$(BLUE)Starting development server...$(NC)"
	@export APP_ENV=dev && python consumption_app/__init__.py

install: ## Install Python dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@pip install -e .
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

test: ## Run tests (if available)
	@echo "$(BLUE)Running tests...$(NC)"
	@if [ -d "tests" ]; then \
		python -m pytest tests/; \
	else \
		echo "$(YELLOW)⚠ No tests directory found$(NC)"; \
	fi

rebuild: remove build start ## Rebuild and restart everything

rebuild-fast: remove build-fast start ## Fast rebuild and restart (with cache)

quick-update: build-fast restart ## Quick update without removing container

update: pull restart ## Pull latest image and restart

shell: ## Open shell in running container
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		docker exec -it $(CONTAINER_NAME) /bin/sh; \
	else \
		echo "$(RED)✗ Container is not running$(NC)"; \
	fi

inspect: ## Inspect container
	@if [ "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then \
		docker inspect $(CONTAINER_NAME); \
	else \
		echo "$(RED)✗ Container does not exist$(NC)"; \
	fi

stats: ## Show container resource usage
	@if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
		docker stats --no-stream $(CONTAINER_NAME); \
	else \
		echo "$(RED)✗ Container is not running$(NC)"; \
	fi

deploy: build push ## Build and push image

full-deploy: backup-db build push update ## Full deployment (backup, build, push, update)