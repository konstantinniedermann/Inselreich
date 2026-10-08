/* global process, Buffer, console, URL */
// smoke.mjs — fester Release-Smoke (R365, Retro-Vorschlag P3): Schritte a–f des REL-08-Release-Checks plus Menü-Schritt,
// je Fenstergrösse, mit echten CDP-Tastatur-/Maus-Ereignissen. Der Playtester ruft dieses Skript auf und ergänzt nur
// paketspezifische Schritte; die Bilder beurteilt er selbst (das Skript prüft nur Zahlen und Texte).
//
// Aufruf: node tools/render-qa/smoke.mjs --paket <id> [--seed 7] [--size 1280x720,1920x1080] [--root <wurzel>]
//   [--out <ordner>] [--vite-port 5281] [--chrome-port 9381] [--help]
// Schritte: a Laden/Schwenken/Zoomen · b Haus bauen, Panel, Pipette, Umschalt+U · c Leertaste (antippen/halten) ·
//   d Wald-Bau · e Speichern/Laden (Save-Stand vorher/nachher) · m Menü (scrollTop 0, Speichern sichtbar) ·
//   f Konsole (error/warning/Ausnahmen aus allen Schritten).
// Ausgabe: Screenshots in `<Hauptrepo>/.studio/qa/<paket>/smoke/<GxH>-<schritt>.png`, Textbericht auf stdout.
// Exit 0 = alle Schritte bestanden, 1 = mindestens ein Schritt fehlgeschlagen oder Konsolenfehler, 2 = Aufruffehler.
// Vite und Chrome startet/beendet `lib.mjs` (eigene Prozessgruppen, auch bei Fehler/Signal). Nur Entwicklungswerkzeug.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { currentLoad, LOAD_MAX } from './lastgate.mjs';

const USAGE =
  'Aufruf: smoke.mjs --paket <id> [--seed 7] [--size 1280x720,1920x1080] [--root <wurzel>] [--out <ordner>]\n' +
  '        [--vite-port 5281] [--chrome-port 9381] [--help]\n' +
  'Release-Smoke a–f + Menü; Bilder unter <Hauptrepo>/.studio/qa/<paket>/smoke/, Exit 1 bei Fehlschlag.';
let values;
try {
  ({ values } = parseArgs({
    options: {
      help: { type: 'boolean' },
      paket: { type: 'string' },
      seed: { type: 'string', default: '7' },
      size: { type: 'string', default: '1280x720,1920x1080' },
      root: { type: 'string' },
      out: { type: 'string' },
      'vite-port': { type: 'string', default: '5281' },
      'chrome-port': { type: 'string', default: '9381' },
    },
    strict: true,
  }));
} catch (e) {
  console.error(`${e.message}\n\n${USAGE}`);
  process.exit(2);
}
if (values.help) {
  console.log(USAGE);
  process.exit(0);
}
const sizes = values.size.split(',').map((s) => s.trim().split('x').map(Number));
const seed = Number(values.seed);
if (
  !values.paket ||
  !/^[\w.-]+$/.test(values.paket) ||
  !Number.isInteger(seed) ||
  sizes.some((s) => s.length !== 2 || s.some((n) => !Number.isInteger(n) || n < 320))
) {
  console.error(`Ungültige oder fehlende Argumente.\n${USAGE}`);
  process.exit(2);
}
// Kein Messlauf: hohe Last bricht nicht ab (R329 gilt für Messungen), wird aber im Bericht vermerkt.
const loadAtStart = currentLoad();

const root = resolve(values.root ?? new URL('../..', import.meta.url).pathname);
const mainRepo = dirname(
  execFileSync('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'], {
    encoding: 'utf8',
  }).trim(),
);
const out = resolve(values.out ?? `${mainRepo}/.studio/qa/${values.paket}/smoke`);
mkdirSync(out, { recursive: true });
const { withBrowser, sleep } = await import(pathToFileURL(`${root}/tools/render-qa/lib.mjs`).href);

const SHIFT = 8;
const CTRL = 2;
const META = 4;
const KEYS = { ' ': ['Space', 32], Escape: ['Escape', 27] };

/** Ein Fenstergrössen-Lauf: gibt `{ size, steps, console }` zurück. */
async function runSize(w, h) {
  const label = `${w}x${h}`;
  const steps = [];
  const msgs = [];
  let stepMsgs = 0;
  await withBrowser(
    {
      root,
      width: w,
      height: h,
      dpr: 1,
      vitePort: Number(values['vite-port']),
      chromePort: Number(values['chrome-port']),
    },
    async (c) => {
      c.on('Runtime.consoleAPICalled', (p) => {
        if (['error', 'warning', 'assert'].includes(p.type))
          msgs.push(
            `console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? '').join(' ')}`,
          );
      });
      c.on('Runtime.exceptionThrown', (p) =>
        msgs.push(
          `exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`,
        ),
      );
      c.on('Log.entryAdded', (p) => {
        if (['error', 'warning'].includes(p.entry.level))
          msgs.push(`log.${p.entry.level}: ${p.entry.text} ${p.entry.url ?? ''}`);
      });
      await c.send('Log.enable');

      const shot = async (name) => {
        const s = await c.send('Page.captureScreenshot', { format: 'png' });
        const file = `${out}/${label}-${name}.png`;
        writeFileSync(file, Buffer.from(s.data, 'base64'));
        return file;
      };
      const key = async (k, mods = 0, hold = 30) => {
        const [code, vk] = KEYS[k] ?? [`Key${k.toUpperCase()}`, k.toUpperCase().charCodeAt(0)];
        const base = { key: k, code, windowsVirtualKeyCode: vk, modifiers: mods };
        await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
        await sleep(hold);
        await c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
      };
      const keyDown = (k, mods = 0) => {
        const [code, vk] = KEYS[k];
        return c.send('Input.dispatchKeyEvent', {
          type: 'rawKeyDown',
          key: k,
          code,
          windowsVirtualKeyCode: vk,
          modifiers: mods,
        });
      };
      const keyUp = (k, mods = 0) => {
        const [code, vk] = KEYS[k];
        return c.send('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: k,
          code,
          windowsVirtualKeyCode: vk,
          modifiers: mods,
        });
      };
      const mouse = (type, x, y, o = {}) =>
        c.send('Input.dispatchMouseEvent', {
          type,
          x,
          y,
          button: o.button ?? 'left',
          buttons: o.buttons ?? 1,
          clickCount: o.clickCount ?? 1,
          modifiers: o.mods ?? 0,
        });
      const click = async (x, y, mods = 0) => {
        await mouse('mouseMoved', x, y, { buttons: 0, mods });
        await mouse('mousePressed', x, y, { mods });
        await mouse('mouseReleased', x, y, { buttons: 0, mods });
        await sleep(150);
      };
      const clickText = (t) =>
        c.ev(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)}));if(!b)return false;b.click();return true;})()`,
        );
      // Seitenhelfer: Weltzustand, Platzsuche, Bildschirmposition einer Kachel
      const snap = () =>
        c
          .ev(
            `(()=>{const w=window.__inselDev.world();const i=w.islands[0];
          return JSON.stringify({n:Object.keys(w.buildings).length,money:w.money,stock:i.stock,tick:w.tick});})()`,
          )
          .then(JSON.parse);
      const speedNow = () =>
        c.ev(`document.querySelector('.hud-speed .btn.active')?.dataset.speed ?? null`);
      const pos = async (x, y) =>
        JSON.parse(await c.ev(`JSON.stringify(window.__inselDev.tileCenter(${x},${y}))`));
      // Freie Bauplätze (nach Abstand zu (cx, cy)); `skip` = bereits benutzte Kacheln
      const spots = (id, cx, cy, extra = '0', n = 6, minD = 0) =>
        c
          .ev(
            `(async()=>{const {canPlace}=await import('/src/sim/placement.ts');
          const w=window.__inselDev.world();const i=w.islands[0];const W=i.width,H=i.height;const r=[];
          for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(!canPlace(w,'${id}',x,y).ok)continue;if(${minD}&&Math.hypot(x-${cx},y-${cy})<${minD})continue;
            let f=0;if(${extra}){for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const t=i.tiles[(y+dy)*W+x+dx];if(t&&t.terrain==='forest')f++;}}
            r.push([x,y,${extra}?-f:Math.hypot(x-${cx},y-${cy})]);}
          r.sort((a,b)=>a[2]-b[2]);return JSON.stringify(r.slice(0,${n}));})()`,
          )
          .then(JSON.parse);
      const panelInfo = () =>
        c
          .ev(
            `(()=>{const p=document.querySelector('#panel');const r=p.getBoundingClientRect();
          return JSON.stringify({text:p.innerText.replace(/\\s+/g,' ').trim(),
            buttons:[...p.querySelectorAll('button')].map(b=>b.textContent.trim()),
            overflowX:p.scrollWidth>p.clientWidth+1,hint:/Umschalt\\s*\\+\\s*U/i.test(p.innerHTML),
            inView:r.width>0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1});})()`,
          )
          .then(JSON.parse);
      const bodyText = () => c.ev(`document.body.innerText`);

      /** Führt einen Schritt aus; Ausnahmen werden zum Fehlschlag mit Meldung, nie zum Abbruch. */
      const step = async (id, name, fn) => {
        const before = msgs.length;
        const rec = { id, name, ok: false, notes: [], shots: [] };
        try {
          const r = await fn(rec);
          rec.ok = r !== false && rec.ok !== 'fail';
        } catch (e) {
          rec.notes.push(`Ausnahme: ${String(e.message ?? e).slice(0, 200)}`);
        }
        rec.console = msgs.slice(before);
        stepMsgs += rec.console.length;
        steps.push(rec);
      };
      const expect = (rec, cond, text) => {
        rec.notes.push(`${cond ? 'ok  ' : 'FEHL'} ${text}`);
        if (!cond) rec.ok = 'fail';
        return cond;
      };

      // Spielstand wie ein neues Spiel mit Seed: Autosave schreiben, dann „Fortsetzen".
      await c.ev(`(async()=>{const {createWorld}=await import('/src/sim/world.ts');
        const {serialize}=await import('/src/sim/save.ts');
        localStorage.removeItem('inselreich.save.v1');localStorage.removeItem('inselreich.save.manual');
        localStorage.setItem('inselreich.save.auto',serialize(createWorld(${seed})));})()`);
      await c.send('Page.navigate', { url: `http://127.0.0.1:${values['vite-port']}/` });
      await sleep(3500);

      const home = { x: 0, y: 0 };
      let used = []; // belegte Bauplatz-Kacheln dieses Laufs

      await step('a', 'Laden, Schwenken, Zoomen', async (rec) => {
        expect(rec, await clickText('Fortsetzen'), 'Start: «Fortsetzen» geklickt');
        await sleep(2500);
        const dev = await c.ev(`!!window.__inselDev`);
        if (!expect(rec, dev, 'Dev-Sonde __inselDev vorhanden')) return false;
        const k = await c
          .ev(`JSON.stringify(window.__inselDev.world().buildings[1])`)
          .then(JSON.parse);
        home.x = k.x;
        home.y = k.y;
        const seedNow = await c.ev(`window.__inselDev.world().seed`);
        expect(rec, seedNow === seed, `Karte ${seedNow} (erwartet ${seed})`);
        const colors = await c.ev(
          `(()=>{const cv=document.querySelector('#canvas');const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;const s=new Set();for(let i=0;i<d.length;i+=4*997)s.add((d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4));return s.size;})()`,
        );
        expect(rec, colors >= 12, `Canvas nicht leer (${colors} Farbstufen)`);
        await c.ev(
          `window.__inselDev.setZoom(1);window.__inselDev.centerOn(${home.x},${home.y});1`,
        );
        await sleep(1500);
        rec.shots.push(await shot('a-zoom1'));
        const p0 = await pos(home.x, home.y);
        await mouse('mousePressed', p0.x, p0.y, { button: 'middle', buttons: 4 });
        await mouse('mouseMoved', p0.x + 120, p0.y + 60, { button: 'middle', buttons: 4 });
        await mouse('mouseReleased', p0.x + 120, p0.y + 60, { button: 'middle', buttons: 0 });
        await sleep(300);
        const p1 = await pos(home.x, home.y);
        expect(
          rec,
          Math.abs(p1.x - p0.x - 120) < 4 && Math.abs(p1.y - p0.y - 60) < 4,
          `Schwenken mit Mittelmaus (${Math.round(p1.x - p0.x)}, ${Math.round(p1.y - p0.y)} px)`,
        );
        rec.shots.push(await shot('a-geschwenkt'));
        await c.ev(`window.__inselDev.centerOn(${home.x},${home.y});1`);
        await sleep(300);
        const pc = await pos(home.x, home.y);
        await c.send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: pc.x,
          y: pc.y,
          deltaX: 0,
          deltaY: -240,
        });
        await sleep(800);
        const a = await pos(home.x + 3, home.y);
        const b = await pos(home.x, home.y);
        expect(rec, Math.hypot(a.x - b.x, a.y - b.y) > 0, 'Mausrad-Zoom ändert die Ansicht');
        rec.shots.push(await shot('a-zoom-rad'));
        for (const z of [0.5, 2]) {
          await c.ev(
            `window.__inselDev.setZoom(${z});window.__inselDev.centerOn(${home.x},${home.y});1`,
          );
          await sleep(1800);
          rec.shots.push(await shot(`a-zoom${z}`));
        }
        await c.ev(
          `window.__inselDev.setZoom(1);window.__inselDev.centerOn(${home.x},${home.y});1`,
        );
        await sleep(800);
      });

      await step('b', 'Bauen, Panel, Pipette, Umschalt+U', async (rec) => {
        await clickText('1×').catch(() => {});
        const sp = await spots('house', home.x, home.y, '0', 8, 5);
        if (!expect(rec, sp.length >= 3, `freie Bauplätze für Häuser gefunden (${sp.length})`))
          return false;
        const [s1, s2] = [sp[0], sp[4]];
        const n0 = (await snap()).n;
        await key('Escape');
        await key('h');
        let p = await pos(s1[0], s1[1]);
        await click(p.x, p.y);
        const n1 = (await snap()).n;
        expect(rec, n1 === n0 + 1, `Haus gebaut (Gebäude ${n0} → ${n1})`);
        used.push(s1);
        await key('Escape');
        await click(p.x, p.y); // Auswahl
        await sleep(300);
        const pn = await panelInfo();
        rec.notes.push(`Panel: ${pn.text.slice(0, 160)}`);
        expect(rec, pn.text.length > 20, 'Gebäude-Panel hat Inhalt');
        expect(
          rec,
          pn.inView && !pn.overflowX,
          'Panel vollständig sichtbar, nichts seitlich abgeschnitten',
        );
        expect(
          rec,
          pn.buttons.some((t) => t.startsWith('Gleiches bauen')),
          'Knopf «Gleiches bauen» vorhanden',
        );
        rec.notes.push(
          `Umschalt+U-Hinweis im Panel (Text/Titel): ${pn.hint ? 'ja' : 'nein (nur bei verfügbarem Ausbau erwartet; Bild prüfen)'}`,
        );
        rec.shots.push(await shot('b-panel'));
        // Pipette: Cmd+Klick (und Strg+Klick) auf das Haus baut/wählt nichts, Werkzeug wird «Haus»
        for (const [name, mod] of [
          ['Cmd', META],
          ['Strg', CTRL],
        ]) {
          const nb = (await snap()).n;
          await key('Escape');
          await click(p.x, p.y, mod);
          expect(rec, (await snap()).n === nb, `${name}+Klick auf Gebäude baut nichts`);
        }
        const q = await pos(s2[0], s2[1]);
        const nb = (await snap()).n;
        await click(q.x, q.y);
        expect(
          rec,
          (await snap()).n === nb + 1,
          'nach Pipette baut ein Klick das gleiche Gebäude (Haus)',
        );
        used.push(s2);
        await key('Escape');
        // Umschalt+U auf ausgewähltem Haus
        await click(p.x, p.y);
        const m0 = await snap();
        const t0 = (await panelInfo()).text;
        await key('U', SHIFT, 60);
        await sleep(400);
        const m1 = await snap();
        const t1 = (await panelInfo()).text;
        rec.notes.push(
          `Umschalt+U: Geld ${m0.money} → ${m1.money}, Panel ${t0 === t1 ? 'unverändert (Sperrgrund prüfen)' : 'geändert'}`,
        );
        rec.shots.push(await shot('b-ausbau'));
        await key('Escape');
      });

      await step('c', 'Leertaste', async (rec) => {
        await clickText('1×').catch(() => {});
        await sleep(200);
        const s0 = await speedNow();
        await key(' ', 0, 60);
        await sleep(300);
        const s1 = await speedNow();
        expect(rec, s1 === '0', `antippen pausiert (Tempo ${s0} → ${s1})`);
        rec.shots.push(await shot('c-pause'));
        await key(' ', 0, 60);
        await sleep(300);
        const s2 = await speedNow();
        expect(rec, s2 === s0, `nochmal antippen setzt fort (Tempo ${s2})`);
        // Halten + ziehen: Karte verschiebt sich, Tempo bleibt
        const p0 = await pos(home.x, home.y);
        await keyDown(' ');
        await sleep(450);
        await mouse('mousePressed', p0.x, p0.y);
        await mouse('mouseMoved', p0.x + 80, p0.y + 40);
        await mouse('mouseMoved', p0.x + 140, p0.y + 70);
        await mouse('mouseReleased', p0.x + 140, p0.y + 70, { buttons: 0 });
        await sleep(300);
        await keyUp(' ');
        await sleep(300);
        const p1 = await pos(home.x, home.y);
        const s3 = await speedNow();
        expect(
          rec,
          Math.abs(p1.x - p0.x - 140) < 6 && Math.abs(p1.y - p0.y - 70) < 6,
          `Halten+Ziehen verschiebt die Karte (${Math.round(p1.x - p0.x)}, ${Math.round(p1.y - p0.y)} px)`,
        );
        expect(rec, s3 === s0, `Halten+Ziehen pausiert nicht (Tempo ${s3})`);
        rec.shots.push(await shot('c-halten'));
        await c.ev(`window.__inselDev.centerOn(${home.x},${home.y});1`);
        await sleep(400);
      });

      await step('d', 'Bauen im Wald', async (rec) => {
        const sp = await spots('lumberjack', 0, 0, '1', 3);
        if (!expect(rec, sp.length > 0, 'Bauplatz im Wald gefunden')) return false;
        const [x, y, f] = sp[0];
        rec.notes.push(`Platz (${x},${y}), ${-f} Waldkacheln im Umkreis`);
        await c.ev(`window.__inselDev.centerOn(${x},${y});1`);
        await sleep(1500);
        const p = await pos(x, y);
        const n0 = (await snap()).n;
        await key('Escape');
        await key('l');
        await mouse('mouseMoved', p.x, p.y, { buttons: 0 });
        await sleep(400);
        rec.shots.push(await shot('d-vorschau'));
        await click(p.x, p.y);
        await sleep(600);
        const n1 = (await snap()).n;
        expect(rec, n1 === n0 + 1, `Holzfäller gebaut (Gebäude ${n0} → ${n1})`);
        await key('Escape');
        rec.shots.push(await shot('d-gebaut'));
        await click(p.x, p.y);
        const pn = await panelInfo();
        expect(
          rec,
          pn.text.length > 20 && pn.inView && !pn.overflowX,
          `Betriebs-Panel sichtbar: ${pn.text.slice(0, 80)}`,
        );
        rec.shots.push(await shot('d-panel'));
        await key('Escape');
        await c.ev(`window.__inselDev.centerOn(${home.x},${home.y});1`);
        await sleep(500);
      });

      const openMenu = async () => {
        await clickText('Menü');
        await sleep(500);
      };
      const menuInfo = () =>
        c
          .ev(
            `(()=>{const m=document.querySelector('.card--menu');if(!m)return JSON.stringify(null);
          const s=[...m.querySelectorAll('button')].find(b=>b.textContent.trim()==='Speichern');
          const r=s?.getBoundingClientRect();
          return JSON.stringify({scrollTop:m.scrollTop,scrollable:m.scrollHeight>m.clientHeight,
            saveVisible:!!r&&r.top>=0&&r.bottom<=innerHeight&&r.width>0,
            saveRect:r?[Math.round(r.top),Math.round(r.bottom)]:null,
            loads:[...m.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Spielzeit/.test(t))});})()`,
          )
          .then(JSON.parse);

      let saved = null;
      await step('m', 'Menü (scrollTop 0, Speichern sichtbar)', async (rec) => {
        await openMenu();
        const mi = await menuInfo();
        if (!expect(rec, mi !== null, 'Menü-Karte geöffnet')) return false;
        expect(rec, mi.scrollTop === 0, `scrollTop ${mi.scrollTop} (erwartet 0)`);
        expect(
          rec,
          mi.saveVisible,
          `«Speichern» sichtbar (oben/unten ${mi.saveRect}, Fensterhöhe ${h})`,
        );
        rec.notes.push(
          `Karte scrollbar: ${mi.scrollable ? 'ja' : 'nein'}; Laden-Einträge: ${mi.loads.length}`,
        );
        rec.shots.push(await shot('m-menue'));
      });

      await step('e', 'Speichern und Laden (Save v9)', async (rec) => {
        // Pausieren, damit Vorher/Nachher nicht durch laufende Ticks abweichen (Wirtschaft läuft sonst weiter)
        await clickText('⏸');
        await sleep(300);
        // Menü ist offen (Schritt m); falls nicht, öffnen
        if (!(await menuInfo())) await openMenu();
        expect(rec, await clickText('Speichern'), '«Speichern» geklickt');
        await sleep(400);
        expect(rec, /Gespeichert/.test(await bodyText()), 'Meldung «Gespeichert»');
        saved = await snap();
        rec.notes.push(
          `gespeichert: Gebäude ${saved.n}, Geld ${saved.money}, Vorrat ${JSON.stringify(saved.stock)}`,
        );
        expect(rec, await clickText('Schliessen'), 'Menü geschlossen');
        await sleep(300);
        // Zustand ändern: weiteres Haus bauen
        const sp = (await spots('house', home.x, home.y, '0', 16, 5)).filter(
          (s) => !used.some((u) => u[0] === s[0] && u[1] === s[1]),
        );
        const q = await pos(sp[10][0], sp[10][1]);
        await key('Escape');
        await key('h');
        await click(q.x, q.y);
        await key('Escape');
        const mid = await snap();
        expect(rec, mid.n === saved.n + 1, `Zustand geändert (Gebäude ${saved.n} → ${mid.n})`);
        await openMenu();
        const clicked = await c.ev(
          `(()=>{const b=[...document.querySelectorAll('.card--menu button')].find(b=>b.textContent.trim().startsWith('Gespeichert'));if(!b)return false;b.click();return true;})()`,
        );
        expect(rec, clicked, 'Laden-Eintrag «Gespeichert» geklickt');
        await sleep(2500);
        const after = await snap();
        const same =
          after.n === saved.n &&
          after.money === saved.money &&
          JSON.stringify(after.stock) === JSON.stringify(saved.stock);
        expect(
          rec,
          same,
          `nach Laden gleich (Gebäude ${after.n}, Geld ${after.money}, Vorrat ${JSON.stringify(after.stock)})`,
        );
        expect(rec, (await speedNow()) === '0', 'Laden pausiert (Tempo 0)');
        rec.shots.push(await shot('e-geladen'));
      });

      await step('f', 'Konsole', async (rec) => {
        rec.notes.push(`${msgs.length} Meldungen (error/warning/Ausnahme) in allen Schritten`);
        for (const m of msgs.slice(0, 10)) rec.notes.push(`  ${m.slice(0, 200)}`);
        if (msgs.length > 0) rec.ok = 'fail';
        return msgs.length === 0;
      });
    },
  );
  return { label, steps, msgs, stepMsgs };
}

const results = [];
let failed = false;
try {
  for (const [w, h] of sizes) results.push(await runSize(w, h));
} catch (e) {
  console.error(`Smoke abgebrochen: ${e.message ?? e}`);
  failed = true;
}

const commit = (() => {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '?';
  }
})();
console.log(`Smoke ${values.paket} | Karte ${seed} | Stand ${commit} | Wurzel ${root}`);
console.log(
  `Last (1 min) bei Start: ${Number(loadAtStart).toFixed(1)}${loadAtStart > LOAD_MAX ? ` (über ${LOAD_MAX}: Zeitüberschreitungen möglich)` : ''}`,
);
console.log(`Bilder: ${out}`);
for (const r of results) {
  console.log(`\n== ${r.label} ==`);
  for (const s of r.steps) {
    const ok = s.ok === true;
    if (!ok) failed = true;
    console.log(`[${ok ? 'OK  ' : 'FEHL'}] ${s.id} ${s.name}`);
    for (const n of s.notes) console.log(`       ${n}`);
    for (const m of s.console) console.log(`       Konsole: ${m.slice(0, 200)}`);
  }
  console.log(`Konsolenmeldungen gesamt: ${r.msgs.length}`);
}
const bad = results.flatMap((r) =>
  r.steps.filter((s) => s.ok !== true).map((s) => `${r.label}:${s.id}`),
);
console.log(
  `\nErgebnis: ${failed ? 'FEHLGESCHLAGEN' : 'BESTANDEN'}${bad.length ? ` (${bad.join(', ')})` : ''}`,
);
process.exit(failed ? 1 : 0);
