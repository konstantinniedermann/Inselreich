import { writeFileSync, mkdirSync } from 'node:fs';
const root = '/Users/KN/CAS/projekte/anno-clone/.worktrees/h-r12';
const out = `${root}/.studio/qa/H-R12/nachher`;
mkdirSync(out, { recursive: true });
const { sleep, withBrowser } = await import(`${root}/tools/render-qa/lib.mjs`);
const [W = '1920', H = '1080', dpr = '2', only = '07,08'] = process.argv.slice(2);
await withBrowser({ root, width: +W, height: +H, dpr: +dpr, vitePort: 5291, chromePort: 9391 }, async (c) => {
  const info = await c.ev(`(async () => {
    const { createWorld, tileAt } = await import('/src/sim/world.ts');
    const { serialize } = await import('/src/sim/save.ts');
    const { placeRoad, placeBuilding } = await import('/src/sim/build.ts');
    const { BUILDING_DEFS } = await import('/src/sim/defs/buildings.ts');
    const { canPlace } = await import('/src/sim/placement.ts');
    const tm = await import('/src/render/terrain.ts');
    const w = createWorld(1, { unlockAll: true });
    w.money = 1e9; for (const k of Object.keys(w.stock)) w.stock[k] = 500;
    const log = [];
    w.won = true; w.wonMerchants = true;
    const { LEVELS } = await import('/src/sim/defs/levels.ts');
    for (let x = 12; x <= 29; x++) placeRoad(w, x, 24);
    for (let x = 21; x <= 29; x++) placeRoad(w, x, 20);
    for (let y = 20; y <= 28; y++) placeRoad(w, 25, y);
    for (let y = 24; y <= 30; y++) placeRoad(w, 16, y);
    for (let x = 16; x <= 28; x++) placeRoad(w, x, 28);
    const adjRoad = (d, x, y) => { for (let dy = -1; dy <= d.h; dy++) for (let dx = -1; dx <= d.w; dx++) { if ((dx >= 0 && dx < d.w) && (dy >= 0 && dy < d.h)) continue; if ((dx === -1 || dx === d.w) && (dy === -1 || dy === d.h)) continue; const t = tileAt(w, x + dx, y + dy); if (t && t.road) return true; } return false; };
    const put = (id, tx, ty, tier, lvl) => { const d = BUILDING_DEFS[id]; let best = null, bd = 1e9;
      for (let y = 2; y < 62; y++) for (let x = 2; x < 62; x++) { if (!adjRoad(d, x, y)) continue; const dd = Math.hypot(x - tx, y - ty); if (dd >= bd) continue; if (!canPlace(w, id, x, y).ok) continue; bd = dd; best = [x, y]; }
      if (!best) { log.push(id + ' FEHLT'); return; }
      const r = placeBuilding(w, id, best[0], best[1]); if (!r.ok) { log.push(id + ' ' + r.reason); return; }
      if (tier) w.buildings[r.id].house.tier = tier; if (lvl && LEVELS[id]) w.buildings[r.id].level = lvl; log.push(id + (tier ? 't' + tier : '') + (lvl ? 'L' + lvl : '') + '@' + best); };
    const tx = 24, ty = 23;
    for (let i = 0; i < 16; i++) put('house', tx, ty, [1,2,3,4][i % 4]);
    const order = ['market','chapel','school','bathhouse','firestation','townhall','weaver','sheepfarm','cattlefarm','canefarm','distillery','toolmaker','glassworks','hunter','weaver','sheepfarm','cattlefarm','canefarm'];
    order.forEach((id, i) => put(id, tx, ty, 0, [0, 2, 3][i % 3]));
    // standortgebunden: nahe Wald/Gebirge/Küste
    const near = (id, cx, cy) => { const d = BUILDING_DEFS[id]; let best=null, bd=1e9; for (let y=2;y<62;y++) for (let x=2;x<62;x++){ if (!canPlace(w,id,x,y).ok) continue; const dd=Math.hypot(x-cx,y-cy); if(dd<bd){bd=dd;best=[x,y];} } if(best){ const r=placeBuilding(w,id,best[0],best[1]); log.push(id+'@'+best+' '+r.ok);} else log.push(id+' FEHLT'); };
    near('lumberjack', 28, 26); near('lumberjack', 27, 27); near('quarry', 29, 21); near('quarry', 29, 22); near('fisher', 21, 18); near('fisher', 18, 20);
    // Feste Dünen-Koordinate (main, Seed 1, unlockAll, duneMask-Suche wie ART-STIL-01): Kachel (7, 32)
    const best = [7, 32], bn = 13;
    localStorage.removeItem('inselreich.save.v1');
    localStorage.setItem('inselreich.save.auto', serialize(w));
    return { log, dune: best, duneN: bn, kontor: [w.buildings[1].x, w.buildings[1].y] };
  })()`);
  console.log(JSON.stringify(info));
  await c.send('Page.navigate', { url: 'http://127.0.0.1:5291/' });
  await sleep(3500);
  const click = (t) => c.ev(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`);
  console.log('fortsetzen', await click('Fortsetzen'));
  await sleep(1500);
  console.log('pause', await click('⏸'));
  const wheel = (dy) => c.ev(`(()=>{const cv=document.querySelector('canvas'); const r=cv.getBoundingClientRect(); cv.dispatchEvent(new WheelEvent('wheel',{deltaY:${dy},clientX:r.left+r.width/2,clientY:r.top+r.height/2,bubbles:true,cancelable:true})); return 1;})()`);
  const setZoom = async (z) => { for (let i = 0; i < 20; i++) await wheel(-100); if (z === 2) return; if (z === 0.5) { for (let i = 0; i < 20; i++) await wheel(100); return; } for (let i = 0; i < 7; i++) await wheel(100); };
  const d = info.dune;
  const shots = [
    ['01-gebirge-z1', 1, 38, 25], ['02-gebirge-nah', 2, 38, 25],
    ['03-wiese-z1', 1, 12, 27], ['04-wiese-nah', 2, 12, 27],
    ['05-wald-z1', 1, 30, 36], ['06-wald-nah', 2, 30, 36],
    ['07-strand-duenen-z1', 1, d[0], d[1]], ['08-strand-duenen-nah', 2, d[0], d[1]],
    ['09-wasserkante-z1', 1, 6, 28], ['10-wasserkante-nah', 2, 6, 28],
    ['11-siedlung-z1', 1, 21, 24], ['12-siedlung-nah', 2, 20, 25],
    ['13-uebergang-gebirge-wiese-haeuser-z1', 1, 28, 24],
    ['14-gesamt-z0.5', 0.5, 32, 32],
  ];
  for (const [name, z, x, y] of shots) {
    if (only && !only.split(',').some((o) => name.startsWith(o))) continue;
    await setZoom(z);
    await c.ev(`window.__inselDev.centerOn(${x}, ${y}); 1`);
    await sleep(3500);
    const shot = await c.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${out}/${name}.png`, Buffer.from(shot.data, 'base64'));
    console.log('ok', name, z, x, y);
  }
});
