.DEFAULT_GOAL := help
TESTLOCK := tools/testlock/testlock.ts
.PHONY: help install hooks dev test docs-check lint format build check studio-test studio-lint studio studio-stop studio-archive studio-metrics pages-limit zeittests zeitreserve zeitreserve-push conflicts check-ci-perf messfenster check-run

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Dev-Abhängigkeiten installieren (npm ci)
	npm ci

hooks: ## Git-Hooks aktivieren (core.hooksPath=tools/githooks: Prettier-Check beim Commit, R417)
	git config core.hooksPath tools/githooks

dev: ## Vite-Dev-Server starten
	npm run dev

zeittests: ## ZEITTESTS (vite.config.ts) = genau die Tests mit Wandzeit-Aufruf (beide Richtungen)
	@fail=0; for f in $$(grep -rlE 'performance\.now\(|Date\.now\(' tests --include='*.ts' | sort); do \
	  grep -qF "'$$f'" vite.config.ts || { echo "Zeittest nicht in ZEITTESTS (vite.config.ts): $$f"; fail=1; }; \
	done; \
	for f in $$(sed -n '/^export const ZEITTESTS/,/^];/p' vite.config.ts | grep -oE "'tests/[^']+\.test\.ts'" | tr -d "'"); do \
	  test -f "$$f" || { echo "ZEITTESTS-Eintrag ohne Datei (vite.config.ts): $$f"; fail=1; }; \
	  grep -qE 'performance\.now\(|Date\.now\(' "$$f" || { echo "ZEITTESTS-Eintrag ohne Wandzeit-Aufruf (vite.config.ts): $$f"; fail=1; }; \
	done; exit $$fail

test: ## Tests ausführen (Vitest; schreibt .studio/zeitreserve.json); studioweite Sperre + Load <= 8 (R375)
	@node $(TESTLOCK) npm test

zeitreserve: ## CI-Reserve prüfen (lokal × 4, R270; und geschätzte Runner-Zeit lokal × 3, E-043); nach make test
	node tools/zeitreserve/check.ts

zeitreserve-push: ## Streng vor dem Push (R338): Messung mit Commit = HEAD und Last vor dem Lauf <= 4 (R394), sonst Exit 2 "nicht belastbar"; aktuelle Last zählt nicht (R438 V3); nach make test; mit Testsperre
	@node $(TESTLOCK) node tools/zeitreserve/check.ts --push

check-ci-perf: ## Nur die Perf-Budget-Tests mit CI=true (ersetzt den zweiten vollen Lauf CI=true make check, R353); schreibt kein zeitreserve.json
	CI=true npx vitest run $$(grep -rl perfBudget tests --include='*.test.ts')

docs-check: ## Prettier-Check über alles inkl. docs/ (schnell, vor Doku-Commits; Teil von lint)
	npx prettier --check .

lint: ## ESLint + Prettier-Check
	npm run lint

format: ## Code formatieren (Prettier)
	npm run format

build: ## Typprüfung + Produktions-Build
	npm run build

studio-test: ## Tests der Studio-Werkzeuge (Python unittest)
	python3 -m unittest discover -s tools/studio/tests -t tools/studio

RUFF = uvx ruff@0.17.0

studio-lint: ## Ruff über tools/studio (gepinnt, via uvx; vor Commits an tools/studio, nicht Teil von check)
	$(RUFF) check tools/studio && $(RUFF) format --check tools/studio

studio: ## Studio-Dashboard starten (gibt die URL aus)
	@bash tools/studio/start.sh

studio-stop: ## Studio-Dashboard stoppen
	@bash tools/studio/start.sh stop

studio-archive: ## Studio-Events archivieren (Dashboard startet leer)
	@python3 tools/studio/log.py archive

studio-metrics: ## Studio-Metriken der letzten Session verdichten
	@python3 tools/studio/metrics.py --session latest

conflicts: ## Git-Konfliktmarker (<<<<<<< / >>>>>>>) in versionierten Dateien suchen; erster Schritt von check
	node tools/conflicts/check.ts

pages-limit: ## Plattformgrenze GitHub Pages prüfen (dist/ nach build, Schwelle 50 %)
	node tools/pages/check.ts dist

messfenster: ## Messfenster prüfen (Last, fremde vitest/vite/Chrome); Serie: ARGS="--run -- node tools/render-qa/perf.mjs ..."
	node tools/render-qa/messfenster.mjs $(ARGS)

check: ## Gleich wie CI: conflicts, lint, zeittests, test, zeitreserve, studio-test, build, pages-limit; mit Testsperre (R375)
	@node $(TESTLOCK) $(MAKE) check-run

check-run: conflicts lint zeittests test zeitreserve studio-test build pages-limit
