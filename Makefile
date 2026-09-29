.DEFAULT_GOAL := help
.PHONY: help install dev test lint format build check

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Dev-Abhängigkeiten installieren (npm ci)
	npm ci

dev: ## Vite-Dev-Server starten
	npm run dev

test: ## Tests ausführen (Vitest)
	npm test

lint: ## ESLint + Prettier-Check
	npm run lint

format: ## Code formatieren (Prettier)
	npm run format

build: ## Typprüfung + Produktions-Build
	npm run build

check: lint test build ## Gleich wie CI: lint, test, build
