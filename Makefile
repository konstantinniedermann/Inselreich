.DEFAULT_GOAL := help
.PHONY: help install dev test lint format build check studio-test studio studio-stop studio-archive

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

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

studio-test: ## Tests der Studio-Werkzeuge (Python unittest)
	python3 -m unittest discover -s tools/studio/tests -t tools/studio

studio: ## Studio-Dashboard starten (gibt die URL aus)
	@bash tools/studio/start.sh

studio-stop: ## Studio-Dashboard stoppen
	@bash tools/studio/start.sh stop

studio-archive: ## Studio-Events archivieren (Dashboard startet leer)
	@python3 tools/studio/log.py archive

check: lint test studio-test build ## Gleich wie CI: lint, test, studio-test, build
