// Full walk-through in a headless phone-sized browser.
// Local: checks index.html. With SITE=https://876lab.github.io/Scribble/ it checks the live site.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL_ = process.env.SITE || 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  let pass = 0, fail = 0; const errors = [];
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::/.test(m.text())) errors.push(m.text()); });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const lessons = () => page.evaluate(() => JSON.parse(localStorage.getItem('scribble.v1.lessons') || '[]'));

  await page.goto(URL_);
  await page.waitForSelector('.hero');

  if (process.env.SITE) {
    for (const f of ['media/walkthrough.mp4', 'media/walkthrough-poster.jpg']) {
      const r = await page.request.get(new URL(f, URL_).href); ok(r.ok(), 'live file reachable: ' + f);
    }
  }

  // ---- Home screen ----
  ok(await page.isVisible('text=Watch first.'), 'home screen shows the headline');
  ok(await page.isVisible('#demoVideo'), 'walkthrough video on the home screen');
  ok(await page.isVisible('text=Open an example lesson'), 'example lesson button');
  ok(!(await overflow()), 'home: no sideways scrolling');

  // ---- What's new ----
  const CH = await page.evaluate(() => window.SCRIBBLE.CHANGES.map(c => ({ id: c.id, t: c.t, d: c.d, n: c.b.length })));
  ok(CH.length >= 1 && CH.every(c => /^\d{4}-\d\d-\d\d$/.test(c.d) && c.n >= 1 && c.n <= 4), 'CHANGES entries are dated with 1-4 bullets');
  ok(new Set(CH.map(c => c.id)).size === CH.length, 'CHANGES ids are unique');
  ok(CH.every((c, i) => i === 0 || CH[i - 1].d >= c.d), 'CHANGES newest first');
  ok(await page.isVisible('#newsbtn') && await page.isVisible('#newdot'), "what's new dot shows on first visit");
  ok(new RegExp(CH.length + ' new update').test(await page.getAttribute('#newsbtn', 'aria-label')), "what's new button says how many are new");
  await page.click('#newsbtn');
  ok(await page.isVisible('#news'), "what's new panel opens");
  ok((await page.locator('#news .newsitem strong').first().innerText()) === CH[0].t, 'panel lists the newest entry first');
  ok(await page.locator('#news .newsitem').count() === CH.length, 'panel lists every entry');
  ok(await page.locator('#news .pill.new').count() === CH.length, 'every entry marked New on first visit');
  ok(await page.isHidden('#newdot'), 'dot clears after opening');
  await page.screenshot({ path: OUT + '/news.png' });
  await page.keyboard.press('Escape');
  ok(await page.isHidden('#news'), 'Escape closes the panel');
  await page.reload(); await page.waitForSelector('.hero');
  ok(await page.isHidden('#newdot'), 'dot stays cleared after reload');
  await page.screenshot({ path: OUT + '/home.png', fullPage: true });

  // ---- Logic: sections and cards ----
  const logic = await page.evaluate(() => {
    const { normalize, sectionGroups, buildDeck, toMarkdown } = window.SCRIBBLE;
    const N = (id, tag, text, t, level = 0) => ({ id, tag, text, t, level });
    const a = normalize({ id: 'a', title: 'Cells', notes: [N('x', '', 'Intro idea', 5), N('s1', 'section', 'Parts', 10), N('n1', 'key', 'Nucleus holds DNA', 20, 1), N('r', 'rewatch', 'Missed something here', 25, 1), N('n2', 'def', 'Ribosome: makes protein', 30, 1), N('s2', 'section', 'Empty part', 40), N('s3', 'section', 'Energy', 50), N('n3', 'test', 'Mitochondria make ATP', 60, 1)] });
    const g = sectionGroups(a), d = buildDeck(a);
    const b = normalize({ id: 'b', title: 'No sections', notes: [N('m1', '', 'one', 1), N('m2', 'rewatch', 'Missed something here', 2), N('m3', 'q', 'why?', 3)] });
    const gb = sectionGroups(b), db = buildDeck(b);
    const old = normalize({ id: 'o', title: 'Old', notes: [] });
    const md = toMarkdown(normalize({ ...a, dump: 'Nucleus and DNA', dumpAt: Date.parse('2026-10-30T12:00:00') }));
    return {
      groups: g.map(x => [x.id, x.title, x.notes.length, x.real]),
      secCards: d.filter(c => c.sec).map(c => [c.sec, c.front, c.back]),
      defCard: d.some(c => c.front === 'Define: Ribosome'),
      noRewatch: !g.some(x => x.notes.some(n => n.tag === 'rewatch')),
      gb: gb.map(x => [x.id, x.title, x.notes.length, x.real]), dbSec: db.filter(c => c.sec).length, dbQ: db.filter(c => c.src === 'Your question').length,
      oldOk: old.dump === '' && old.dumpAt === 0 && JSON.stringify(old.dumpMarks) === '{}',
      badMarks: JSON.stringify(normalize({ id: 'z', dumpMarks: ['x'] }).dumpMarks),
      md: /## Brain dump/.test(md) && /Nucleus and DNA/.test(md)
    };
  });
  ok(JSON.stringify(logic.groups) === JSON.stringify([['_start', 'Start of the lesson', 1, false], ['s1', 'Parts', 2, true], ['s3', 'Energy', 1, true]]), 'sections group notes, skip empty sections: ' + JSON.stringify(logic.groups));
  ok(logic.noRewatch, 'rewatch markers are not part of any section');
  ok(logic.secCards.length === 2 && logic.secCards[0][0] === 's1' && logic.secCards[0][1] === 'What do you remember about “Parts”?' && logic.secCards[0][2] === '• Nucleus holds DNA\n• Ribosome: makes protein', 'one recall card per real section with its notes as the answer');
  ok(logic.defCard, 'definition cards still made');
  ok(JSON.stringify(logic.gb) === JSON.stringify([['_start', 'No sections', 2, false]]) && logic.dbSec === 0 && logic.dbQ === 1, 'lesson without sections: one group named after the lesson, no section cards, question card kept');
  ok(logic.oldOk && logic.badMarks === '{}', 'older saved lessons load with empty brain-dump fields');
  ok(logic.md, 'export includes the brain dump');

  // ---- Example lesson ----
  await page.click('text=Open an example lesson');
  await page.waitForSelector('.tabs');
  ok(await page.isVisible('#newsbtn'), "what's new button in the lesson header");
  ok(!(await overflow()), 'lesson header: no sideways scrolling');
  for (const t of ['capture', 'organize', 'summary', 'quiz']) {
    await page.click(`[data-tab=${t}]`);
    ok((await page.locator('#main').innerText()).length > 80, 'tab renders ' + t);
    ok(!(await overflow()), 'no sideways scrolling on ' + t);
  }

  // ---- Take notes ----
  await page.click('[data-tab=capture]');
  await page.fill('#draft', '# Wrap-up'); await page.press('#draft', 'Enter');
  await page.fill('#draft', '! Know the overall equation'); await page.press('#draft', 'Enter');
  await page.click('[data-act=missed]');
  let L = (await lessons())[0];
  const last3 = L.notes.slice(-3).map(n => [n.tag, n.text]);
  ok(JSON.stringify(last3) === JSON.stringify([['section', 'Wrap-up'], ['test', 'Know the overall equation'], ['rewatch', 'Missed something here']]), 'shortcuts and Missed that save the right note types: ' + JSON.stringify(last3));

  // ---- Brain dump ----
  await page.click('[data-tab=quiz]');
  ok(await page.isVisible('#dumpCard >> text=Before your test: brain dump'), 'quiz tab offers the brain dump');
  ok(await page.isVisible('.flash'), 'flashcards still shown under it');
  const deckSize = await page.evaluate(() => window.SCRIBBLE.buildDeck(JSON.parse(localStorage.getItem('scribble.v1.lessons'))[0]).length);
  ok(new RegExp(deckSize + ' cards').test(await page.locator('[data-tab=quiz] small').innerText()), 'tab shows the card count including section cards');
  await page.click('text=Start 2-minute brain dump');
  ok(await page.isVisible('#dumpText'), 'brain dump writing box opens');
  ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'dumpText'), 'writing box has the cursor');
  ok(/^(2:00|1:5\d) left$/.test((await page.innerText('#dumpLeft')).replace(/^0/, '')), 'two-minute countdown shows: ' + await page.innerText('#dumpLeft'));
  ok(await page.isHidden('.flash'), 'flashcards hidden while writing (no peeking)');
  ok(!(await page.isVisible('text=Mitochondria')), 'notes hidden while writing');
  await page.screenshot({ path: OUT + '/dump-write.png' });
  await page.fill('#dumpText', 'Glycolysis splits glucose. Most ATP from the electron transport chain.');
  await page.click('text=Check against my notes');
  const secs = await page.locator('.sec').count();
  const expectSecs = await page.evaluate(() => window.SCRIBBLE.sectionGroups(JSON.parse(localStorage.getItem('scribble.v1.lessons'))[0]).length);
  ok(secs === expectSecs && secs >= 2, `compare view lists every section (${secs})`);
  ok(await page.isVisible('.dump-mine >> text=Glycolysis splits glucose'), 'compare view shows what was written');
  L = (await lessons())[0];
  ok(L.dump.startsWith('Glycolysis') && L.dumpAt > 0, 'brain dump saved with the lesson');
  await page.locator('.sec').nth(0).locator('[data-m=missed]').click();
  await page.locator('.sec').nth(1).locator('[data-m=had]').click();
  ok(await page.locator('.sec.missed').count() === 1 && await page.locator('.sec.had').count() === 1, 'sections can be marked missed or had');
  ok(await page.isVisible('text=2 of ' + secs + ' checked'), 'progress line counts checked sections');
  await page.locator('.sec').nth(1).locator('[data-m=had]').click();
  ok(await page.locator('.sec.had').count() === 0, 'tapping again clears a mark');
  await page.locator('.sec').nth(1).locator('[data-m=had]').click();
  ok(!(await overflow()), 'compare view: no sideways scrolling');
  await page.screenshot({ path: OUT + '/dump-compare.png', fullPage: true });
  L = (await lessons())[0];
  ok(Object.values(L.dumpMarks).sort().join() === 'had,missed', 'marks saved with the lesson');
  await page.click('text=Quiz me on the 1 I missed');
  ok(await page.isVisible('.flash >> text=What do you remember about'), 'missed-section quiz shows a section card');
  ok(/Card 1 of 1/.test(await page.innerText('.progress')), 'missed-section quiz has just the missed one');
  await page.click('text=Show answer'); await page.click('[data-act=grade][data-g="1"]');
  ok(await page.isVisible('text=Round finished'), 'missed-section round finishes');
  await page.click('[data-tab=summary]'); await page.click('[data-tab=quiz]');
  ok(await page.isVisible('text=Last one') && await page.isVisible('text=See last check'), 'quiz tab remembers the last brain dump');
  await page.click('text=See last check');
  ok(await page.locator('.sec.missed').count() === 1, 'last check reopens with its marks');
  await page.click('[data-act=dumpClose]');
  // Leaving mid-dump keeps what was typed
  await page.click('text=Start 2-minute brain dump'); await page.fill('#dumpText', 'Draft that should survive');
  await page.click('[data-tab=organize]');
  ok((await lessons())[0].dump === 'Draft that should survive', 'switching tabs mid-dump keeps the text');
  await page.click('[data-tab=quiz]'); await page.click('text=Start 2-minute brain dump');
  ok((await page.inputValue('#dumpText')) === 'Draft that should survive', 'next brain dump starts from the saved text');
  await page.click('text=Cancel');

  // ---- Dark theme and reload ----
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('text=Start 2-minute brain dump'); await page.click('text=Check against my notes');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bg !== 'rgb(237, 241, 247)' && bg !== 'rgba(0, 0, 0, 0)', 'dark theme repaints the page: ' + bg);
  ok(!(await overflow()), 'dark theme: no sideways scrolling');
  await page.screenshot({ path: OUT + '/dump-compare-dark.png', fullPage: true });
  await page.click('[data-act=home]');
  await page.screenshot({ path: OUT + '/home-dark.png' });
  await page.reload(); await page.waitForSelector('.hero');
  ok(await page.locator('.lesson').count() === 1, 'lesson survives a reload');

  ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
  await browser.close();
  console.log(`browser: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
