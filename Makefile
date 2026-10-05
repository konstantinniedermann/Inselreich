.DEFAULT_GOAL := help
.PHONY: help install dev test lint format build check studio-test studio-lint studio studio-stop studio-archive studio-metrics pages-limit zeittests

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Dev-Abhängigkeiten installieren (npm ci)
	npm ci

dev: ## Vite-Dev-Server starten
	npm run dev

zeittests: ## Prüfen, dass jeder Wandzeit-Test in ZEITTESTS (vite.config.ts) steht
	@fail=0; for f in $$(grep -rlE 'performance\.now\(|Date\.now\(' tests --include='*.ts' | sort); do \
	  grep -qF "'$$f'" vite.config.ts || { echo "Zeittest nicht in ZEITTESTS (vite.config.ts): $$f"; fail=1; }; \
	done; exit $$fail

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

studio-lint: ## Ruff über tools/studio (via uvx; vor Commits an tools/studio, nicht Teil von check)
	uvx ruff check tools/studio && uvx ruff format --check tools/studio

studio: ## Studio-Dashboard starten (gibt die URL aus)
	@bash tools/studio/start.sh

studio-stop: ## Studio-Dashboard stoppen
	@bash tools/studio/start.sh stop

studio-archive: ## Studio-Events archivieren (Dashboard startet leer)
	@python3 tools/studio/log.py archive

studio-metrics: ## Studio-Metriken der letzten Session verdichten
	@python3 tools/studio/metrics.py --session latest

pages-limit: ## Plattformgrenze GitHub Pages prüfen (dist/ nach build, Schwelle 50 %)
	node tools/pages/check.ts dist

check: lint zeittests test studio-test build pages-limit ## Gleich wie CI: lint, test, studio-test, build, pages-limit
