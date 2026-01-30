# ============================================
# Makefile - BEM Planning FC (Frontend)
# Commandes utiles pour Docker et le projet
# ============================================

.PHONY: help dev prod build up down logs shell clean

# Couleurs
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

# ============================================
# Aide
# ============================================
help: ## Affiche cette aide
	@echo ''
	@echo '${GREEN}BEM Planning FC - Commandes disponibles${RESET}'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-15s${RESET} %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''

# ============================================
# Developpement
# ============================================
dev: ## Lance l'environnement de developpement
	docker-compose -f docker-compose.dev.yml up --build

dev-d: ## Lance l'environnement de developpement en arriere-plan
	docker-compose -f docker-compose.dev.yml up -d --build

# ============================================
# Production
# ============================================
prod: ## Lance l'environnement de production
	docker-compose up --build

prod-d: ## Lance l'environnement de production en arriere-plan
	docker-compose up -d --build

# ============================================
# Commandes Docker
# ============================================
build: ## Build les images Docker
	docker-compose build --no-cache

up: ## Demarre les containers
	docker-compose up -d

down: ## Arrete les containers
	docker-compose down

restart: ## Redemarre les containers
	docker-compose restart

logs: ## Affiche les logs
	docker-compose logs -f

# ============================================
# Shell
# ============================================
shell: ## Ouvre un shell dans le container app
	docker-compose exec app sh

# ============================================
# Tests & Qualite
# ============================================
lint: ## Execute le linter
	npm run lint

# ============================================
# Nettoyage
# ============================================
clean: ## Nettoie les containers et images
	docker-compose down --rmi all --remove-orphans
	docker system prune -f

clean-all: ## Nettoie tout (attention: supprime toutes les donnees)
	docker-compose down --rmi all --remove-orphans
	docker system prune -af
	rm -rf node_modules .next

# ============================================
# Installation locale (sans Docker)
# ============================================
install: ## Installe les dependances
	npm ci --legacy-peer-deps
	npx prisma generate

start: ## Demarre l'application en local
	npm run dev
