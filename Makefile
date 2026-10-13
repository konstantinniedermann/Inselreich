.DEFAULT_GOAL := help
TESTLOCK := tools/testlock/testlock.ts
.PHONY: help merge-driver install hooks dev test docs-check lint format build check studio-test studio-lint stampcheck studio studio-stop studio-archive studio-metrics pages-limit zeittests zeitreserve zeitreserve-push zeitreserve-gate gate-ensemble conflicts check-ci-perf messfenster check-run check-push push-check

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

test: ## Tests ausführen (Vitest; schreibt .studio/zeitreserve.json); studioweite Sperre + Load <= 8 (R375); rot → Event test_failed (R450 V1)
	@python3 tools/studio/testrun.py --suite vitest --skip-exit 3 -- node $(TESTLOCK) npm test

zeitreserve: ## CI-Reserve prüfen (lokal × 4, R270; und geschätzte Runner-Zeit lokal × 3, E-043); nach make test
	node tools/zeitreserve/check.ts

zeitreserve-push: ## Streng vor dem Push (R338): Messung mit Commit = HEAD und Last vor dem Lauf <= 4 (R394), sonst Exit 2 "nicht belastbar"; aktuelle Last zählt nicht (R438 V3); nach make test; ohne Testsperre (liest nur die Messung)
	@node tools/zeitreserve/check.ts --push

gate-ensemble: ## Gate-Messung: 5 Controller-Phasen, Median/Min/Max (nicht Teil von check)
	VITE_ENSEMBLE=1 npx vitest run tests/sim/ensemble.test.ts --silent=false

check-ci-perf: ## Nur die Perf-Budget-Tests mit CI=true (ersetzt den zweiten vollen Lauf CI=true make check, R353); schreibt kein zeitreserve.json
	CI=true npx vitest run $$(grep -rl perfBudget tests --include='*.test.ts')

docs-check: ## Prettier-Check über alles inkl. docs/ plus zerrissene Tabellen (schnell, vor Doku-Commits)
	npx prettier --check . ; a=$$?; python3 tools/studio/tablecheck.py ; b=$$?; exit $$((a>b?a:b))

lint: ## ESLint + Prettier-Check
	npm run lint

format: ## Code formatieren (Prettier)
	npm run format

build: ## Typprüfung + Produktions-Build
	npm run build

studio-test: ## Tests der Studio-Werkzeuge (Python unittest); rot → Event test_failed (R450 V1)
	python3 tools/studio/testrun.py --suite studio -- python3 -m unittest discover -s tools/studio/tests -t tools/studio

stampcheck: ## Warnung (kein Fehler), wenn state.md-Stand >5 Rulings hinter rulings.md liegt (E-065); Teil von check
	@python3 tools/studio/stampcheck.py

RUFF = uvx ruff@0.17.0

studio-lint: ## Ruff über tools/studio (gepinnt, via uvx; vor Commits an tools/studio, nicht Teil von check) und Warnung bei direktem Uhraufruf (R450 V2)
	$(RUFF) check tools/studio && $(RUFF) format --check tools/studio && python3 tools/studio/clock.py --check tools/studio

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
	@python3 tools/studio/stampcheck.py
	@node $(TESTLOCK) $(MAKE) check-run

CHECK_PUSH_STEPS := conflicts lint zeittests test studio-test build pages-limit

check-run: $(CHECK_PUSH_STEPS) zeitreserve

check-push: ## make check ohne lockeres zeitreserve, nur für push-check (R503 B3); mit Testsperre
	@node $(TESTLOCK) $(MAKE) $(CHECK_PUSH_STEPS)

zeitreserve-gate: ## Gate Merge (R598 V1): strenge Zeitreserve nur für die markierten Dateien (.studio/zeitreserve-marked.json), wie push-check: Load-Warten, Testsperre, Nachmessung; Exit 1 Substanz, 2 nicht belastbar, 3 Testsperre
	@python3 tools/studio/pushcheck.py --gate

push-check: ## Push-Gate in einem Schritt (R488 V1, R503): Vorprüfungen, Load-Warten, ein check-push, strenge Zeitreserve, höchstens eine Nachmessung, check-ci-perf
	@python3 tools/studio/pushcheck.py

merge-driver: ## Merge-Treiber für docs/beobachtungen.md in .git/config setzen (E-059, einmal je Klon)
	git config merge.beob-append.name "Beobachtungen: reine Anhänge selbst auflösen (E-059)"
	git config merge.beob-append.driver "python3 tools/studio/merge_append.py %O %A %B %L %P"
