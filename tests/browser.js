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
  await page.waitForSelector('.home');

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
  await page.reload(); await page.waitForSelector('.home');
  ok(await page.isHidden('#newdot'), 'dot stays cleared after reload');
  await page.screenshot({ path: OUT + '/home.png', fullPage: true });

  // ---- Logic: sections and cards ----
  const logic = await page.evaluate(() => {
    const { normalize, sectionGroups, buildDeck, toMarkdown } = window.SCRIBBLE;
    const N = (id, tag, text, t, level = 0) => ({ id, tag, text, t, level });
    const a = normalize({ id: 'a', title: 'Cells', notes: [N('x', '', 'Intro idea', 5), N('s1', 'section', 'Parts', 10), N('n1', 'key', 'Nucleus holds DNA', 20, 1), N('r', 'rewatch', 'Missed something here', 25, 1), N('n2', 'def', 'Ribosome: makes protein', 30, 1), N('s2', 'section', 'Empty part', 40), N('s3', 'section', 'Energy', 50), N('n3', 'test', 'Mitochondria make ATP', 60, 1)] });
    const g = sectionGroups(a), d = buildDeck(a);
    const c2 = buildDeck(normalize({ id: 'c', title: 'Colon', notes: [N('s', 'section', 'Data Sources:', 0), N('k', '', 'Surveys', 0, 1)] })).find(x => x.sec);
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
      colon: c2.front === 'What do you remember about “Data Sources”?' && c2.src === 'Section recall',
      oldOk: old.dump === '' && old.dumpAt === 0 && JSON.stringify(old.dumpMarks) === '{}',
      badMarks: JSON.stringify(normalize({ id: 'z', dumpMarks: ['x'] }).dumpMarks),
      md: /## Brain dump/.test(md) && /Nucleus and DNA/.test(md)
    };
  });
  ok(JSON.stringify(logic.groups) === JSON.stringify([['_start', 'Start of the lesson', 1, false], ['s1', 'Parts', 2, true], ['s3', 'Energy', 1, true]]), 'sections group notes, skip empty sections: ' + JSON.stringify(logic.groups));
  ok(logic.noRewatch, 'rewatch markers are not part of any section');
  ok(logic.secCards.length === 2 && logic.secCards[0][0] === 's1' && logic.secCards[0][1] === 'What do you remember about “Parts”?' && logic.secCards[0][2] === '• Nucleus holds DNA\n• Ribosome: makes protein', 'one recall card per real section with its notes as the answer');
  ok(logic.defCard, 'definition cards still made');
  ok(logic.colon, 'section card drops a trailing colon and hides an unset 00:00 time');
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
  // Answer box on quiz cards
  await page.click('text=Start over');
  ok(await page.isVisible('#quizAns'), 'quiz card has a box to type the answer');
  await page.fill('#quizAns', 'My typed answer\nsecond line');
  await page.click('.btn[data-act=flip]');
  ok(await page.isVisible('.flash .mine >> text=My typed answer') && await page.isVisible('.flash .mine-lbl >> text=From your notes'), 'Show answer puts the typed answer above the real one');
  ok(await page.isHidden('#quizAns'), 'answer box hides once the answer shows');
  await page.click('[data-act=grade][data-g="0"]');
  ok((await page.inputValue('#quizAns')) === '', 'next card starts with an empty answer box');
  await page.fill('#quizAns', 'quick'); await page.press('#quizAns', 'Control+Enter');
  ok(await page.isVisible('.flash .mine >> text=quick'), 'Ctrl+Enter in the answer box shows the answer');
  await page.screenshot({ path: OUT + '/quiz-answer.png' });
  await page.reload(); await page.waitForSelector('.home'); await page.click('.lesson');
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

  // ---- Search ----
  { const L = await page.evaluate(() => { const { searchTerms, hl, matchesAll } = window.SCRIBBLE; return [searchTerms('"Electron transport"  ATP  '), hl('Café au lait', ['cafe']), hl('<b>x</b>', ['b']), matchesAll('The Krebs cycle', ['cycle', 'krebs']), matchesAll('The Krebs cycle', ['krebs', 'atp']), hl('Résumé résumé', ['resume'])]; });
    ok(JSON.stringify(L[0]) === '["electron transport","atp"]', 'search words and "quoted phrases" are read correctly');
    ok(L[1] === '<mark class="hl">Café</mark> au lait', 'accents ignored and the original text highlighted');
    ok(L[2] === '&lt;<mark class="hl">b</mark>&gt;x&lt;/<mark class="hl">b</mark>&gt;', 'highlighting never lets note text become page code');
    ok(L[3] === true && L[4] === false, 'every word must appear');
    ok(L[5] === '<mark class="hl">Résumé</mark> <mark class="hl">résumé</mark>', 'every occurrence highlighted'); }
  await page.click('[data-act=home]');
  await page.click('text=+ New lesson'); await page.fill('#nfTitle', 'Photosynthesis'); await page.fill('#nfCourse', 'BIO 101'); await page.click('text=Start taking notes');
  for (const x of ['# Light reactions', 'Chlorophyll absorbs light in the thylakoid', 'Café-au-lait colour example', 'Plant cells have mitochondria too', '<img src=x onerror="window.__xss=1">']) { await page.fill('#draft', x); await page.press('#draft', 'Enter'); }
  await page.click('[data-act=home]');
  ok(await page.isVisible('#libSearch'), 'search box on the home screen');
  const libSearch = async q => { await page.fill('#libSearch', q); await page.waitForTimeout(250); };
  await libSearch('mitochondria');
  ok(/in 2 lessons/.test(await page.textContent('#searchCount')), 'search finds matches across lessons: ' + await page.textContent('#searchCount'));
  ok((await page.locator('#libBody mark.hl').allInnerTexts()).every(x => x.toLowerCase() === 'mitochondria') && await page.locator('#libBody mark.hl').count() >= 2, 'matches highlighted');
  ok(await page.locator('.lesson-list').count() === 0, 'lesson list replaced by results while searching');
  ok(await page.$eval('#libBody mark.hl', el => getComputedStyle(el).display) === 'inline', 'highlights stay inside the sentence');
  ok(await page.isVisible('[data-act=clearSearch][data-for=libSearch]'), 'clear button shows while searching');
  ok(!(await overflow()), 'search results: no sideways scrolling');
  await page.screenshot({ path: OUT + '/search.png', fullPage: true });
  await libSearch('CAFE');
  ok(/^1 match in 1 lesson/.test(await page.textContent('#searchCount')) && (await page.locator('#libBody mark.hl').first().innerText()) === 'Café', 'capitals and accents ignored');
  await libSearch('glucose oxygen');
  ok(await page.isVisible('#libBody >> text=Overall: glucose'), 'two words find the note containing both');
  await libSearch('"electron transport"');
  ok(await page.locator('.hit').count() >= 1, 'quoted phrase matches');
  await libSearch('"transport electron"');
  ok(await page.isVisible('text=No matches for'), 'quoted words must appear together');
  await libSearch('onerror');
  ok(await page.isVisible('#libBody >> text=<img src=x'), 'unsafe-looking note text shows as plain text');
  ok(await page.locator('#libBody img').count() === 0 && !(await page.evaluate(() => window.__xss)), 'unsafe-looking note text never runs');
  await libSearch('three stages');
  ok(await page.isVisible('#libBody .hit b >> text=The three stages'), 'section headings are searched too');
  await libSearch('krebs');
  await page.locator('.hit').first().click();
  ok(await page.isVisible('#noteSearch') && await page.getAttribute('[data-tab=organize]', 'aria-selected') === 'true', 'tapping a match opens the lesson in Organize');
  { const j = page.locator('.note.jump'); ok(await j.count() === 1 && /Krebs/i.test(await j.innerText()), 'the matching note is marked');
    ok(await j.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'the matching note is scrolled into view'); }
  await page.click('[data-act=home]');
  ok((await page.inputValue('#libSearch')) === 'krebs' && await page.locator('.res').count() >= 1, 'home search stays until cleared');
  await page.locator('.res-head').first().click();
  ok((await page.inputValue('#noteSearch')) === 'krebs' && /<b>2<\/b> notes match/.test(await page.innerHTML('#orgHint')) && await page.locator('#orgList mark.hl').count() === 2, 'opening a result carries the search into the lesson');
  // Search within a lesson
  const noteSearch = async q => { await page.fill('#noteSearch', q); await page.waitForTimeout(250); };
  await noteSearch('glycolysis');
  { const rows = await page.locator('#orgList .note').allInnerTexts();
    ok(rows.length === 3 && /The three stages/.test(rows[0]) && rows.slice(1).every(r => /glycolysis/i.test(r)), 'lesson search shows matching notes with their section: ' + rows.length);
    ok(/2<\/b> notes match/.test(await page.innerHTML('#orgHint')), 'lesson search counts the matches'); }
  await page.locator('#orgList .note:not(.section)').first().click();
  ok(await page.isDisabled('.actionbar [data-act=mv][data-d="-1"]') && await page.isDisabled('.actionbar [data-act=mv][data-d="1"]'), 'moving notes is off while searching');
  await page.locator('#orgList .note:not(.section)').first().click();
  await page.click('[data-act=filter][data-f=key]');
  ok((await page.locator('#orgList .note:not(.section)').allInnerTexts()).every(r => /Key idea/i.test(r) && /glycolysis/i.test(r)) && await page.locator('#orgList .note:not(.section)').count() === 1, 'search and type filter work together');
  await page.click('[data-act=filter][data-f=all]');
  await noteSearch('zzzz');
  ok(await page.isVisible('#orgList >> text=No notes match'), 'lesson search says when nothing matches');
  await page.click('[data-act=clearSearch][data-for=noteSearch]'); await page.waitForTimeout(250);
  { const total = await page.evaluate(() => JSON.parse(localStorage.getItem('scribble.v1.lessons')).find(x => x.example).notes.length);
    ok(await page.locator('#orgList .note').count() === total && await page.isHidden('[data-act=clearSearch][data-for=noteSearch]'), 'clearing the search shows every note again'); }
  await noteSearch('atp'); await page.press('#noteSearch', 'Escape'); await page.waitForTimeout(250);
  ok((await page.inputValue('#noteSearch')) === '', 'Escape clears the search');
  await page.click('[data-act=home]'); await page.click('[data-act=clearSearch][data-for=libSearch]'); await page.waitForTimeout(250);
  ok(await page.locator('.lesson').count() === 2, 'clearing the home search brings back the lesson list');
  await page.keyboard.press('/');
  ok(await page.evaluate(() => document.activeElement.id) === 'libSearch', 'the / key jumps to search');
  await page.locator('.lesson', { hasText: 'Cellular respiration' }).click();

  // ---- Export: PDF and Word ----
  await page.click('[data-tab=summary]');
  ok(await page.isVisible('.gloss >> text=Cellular respiration'), 'Summary shows a Key terms table built from definitions');
  await page.click('[data-act=export]');
  ok(await page.isVisible('#exportPanel'), 'export panel opens');
  ok(await page.isVisible('[data-fmt=pdf]') && await page.isVisible('[data-fmt=docx]'), 'PDF and Word buttons shown');
  ok(!(await overflow()), 'export panel: no sideways scrolling');
  await page.screenshot({ path: OUT + '/export.png' });
  const grab = async fmtx => { const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-fmt=${fmtx}]`)]); const f = path.join(OUT, 'export-' + fmtx + path.extname(dl.suggestedFilename())); await dl.saveAs(f); return { name: dl.suggestedFilename(), buf: fs.readFileSync(f) }; };
  const pdf = await grab('pdf');
  ok(pdf.name === 'Cellular respiration.pdf', 'PDF file name from the lesson title: ' + pdf.name);
  { const s = pdf.buf.toString('latin1');
    ok(s.startsWith('%PDF-1.4') && s.trimEnd().endsWith('%%EOF'), 'PDF has a header and end marker');
    const xref = +s.match(/startxref\n(\d+)/)[1], rows = s.slice(xref).split('\n').slice(3).filter(r => / 00000 n $/.test(r)).map(r => +r.slice(0, 10));
    ok(rows.length > 6 && rows.every((o, i) => s.startsWith(`${i + 1} 0 obj`, o)), 'every PDF object is where the index says');
    const lens = [...s.matchAll(/<< \/Length (\d+) >>\nstream\n/g)];
    ok(lens.length >= 1 && lens.every(m => s.substr(m.index + m[0].length + +m[1], 10) === '\nendstream'), 'PDF page streams have the right lengths');
    ok(/\(Cellular respiration\)/.test(s) && /Most of it happens in the mitochondria/.test(s), 'PDF contains the notes');
    ok(/Key terms/.test(s) && /Rewatch before the test/.test(s), 'PDF has the Key terms table and rewatch list'); }
  const doc = await grab('docx');
  ok(doc.name === 'Cellular respiration.docx', 'Word file name: ' + doc.name);
  { const b = doc.buf, zlib = require('zlib'), files = {};
    const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])); let p = b.readUInt32LE(eocd + 16);
    for (let i = 0; i < b.readUInt16LE(eocd + 10); i++) { const crc = b.readUInt32LE(p + 16), size = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), off = b.readUInt32LE(p + 42), name = b.toString('utf8', p + 46, p + 46 + nl); const ln = b.readUInt16LE(off + 26), data = b.subarray(off + 30 + ln, off + 30 + ln + size); files[name] = { ok: !zlib.crc32 || zlib.crc32(data) === crc, text: data.toString('utf8') }; p += 46 + nl; }
    ok(['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'docProps/core.xml'].every(n => files[n]), 'Word file has its parts: ' + Object.keys(files).join(','));
    ok(Object.values(files).every(f => f.ok), 'Word file checksums match');
    const bad = await page.evaluate(parts => parts.filter(x => new DOMParser().parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length).length, Object.values(files).map(f => f.text));
    ok(bad === 0, 'every Word part is well-formed XML');
    const d = files['word/document.xml'].text;
    ok(/<w:pStyle w:val="Title"\/>/.test(d) && /Heading2/.test(d) && /<w:tbl>/.test(d) && /w:highlight w:val="yellow"/.test(d), 'Word file has title, section headings, Key terms table and highlighted test notes'); }
  await page.uncheck('#exportExtras');
  const pdf2 = await grab('pdf');
  ok(!/My summary|Rewatch before the test/.test(pdf2.buf.toString('latin1')) && /Key terms/.test(pdf2.buf.toString('latin1')), 'unticking extras leaves out summaries but keeps notes and key terms');
  await page.click('#exportPanel summary');
  ok((await page.inputValue('#exportText')).startsWith('# Cellular respiration'), 'plain text still available');
  await page.keyboard.press('Escape');
  ok(await page.isHidden('#exportPanel'), 'Escape closes the export panel');
  const enc = await page.evaluate(() => [window.SCRIBBLE.toWin('“Café” — ★ → μ 🧠'), window.SCRIBBLE.crc32(new TextEncoder().encode('123456789'))]);
  ok(enc[0] === '\x93Café\x94 \x97 * -> \xB5 ?' && enc[1] === 0xCBF43926, 'PDF text encoding and zip checksum are correct: ' + JSON.stringify(enc[0]));

  // ---- Select several notes, move/delete together, undo ----
  { const mm = await page.evaluate(() => { const { moveMany, canMoveMany } = window.SCRIBBLE; const mk = ids => ({ notes: [...ids].map(id => ({ id })) }); const ord = l => l.notes.map(n => n.id).join('');
      const a = mk('abcdef'); moveMany(a, new Set(['c', 'd']), -1); const r1 = ord(a);
      const b = mk('abcdef'); moveMany(b, new Set(['a', 'b', 'e']), -1); const r2 = ord(b);
      const c = mk('abcdef'); moveMany(c, new Set(['b', 'd']), 1); const r3 = ord(c);
      return [r1, r2, r3, canMoveMany(mk('abc'), new Set(['a', 'b']), -1), canMoveMany(mk('abc'), new Set(['b', 'c']), 1), canMoveMany(mk('abc'), new Set(['b', 'c']), -1)]; });
    ok(mm[0] === 'acdbef', 'a block of selected notes moves up together: ' + mm[0]);
    ok(mm[1] === 'abcedf', 'notes already at the top stay, the others move: ' + mm[1]);
    ok(mm[2] === 'acbedf', 'separate selected notes each move down: ' + mm[2]);
    ok(mm[3] === false && mm[4] === false && mm[5] === true, 'up/down know when a selection cannot move'); }
  await page.click('[data-tab=organize]');
  const exNotes = async () => (await lessons()).find(x => x.example).notes;
  const before = await exNotes();
  ok(await page.isVisible('#multiBtn'), 'Select several button in Organize');
  await page.click('#multiBtn');
  ok(await page.isVisible('.actionbar.multi') && /Tap notes to select/.test(await page.innerText('#selCount')), 'select mode shows its toolbar');
  ok(await page.locator('#orgList .note.pick[role=checkbox]').count() === before.length, 'every note gets a tick box');
  const pickIdx = [3, 4, 5];
  for (const i of pickIdx) await page.locator(`#orgList .note[data-id="${before[i].id}"]`).click();
  ok(/3 notes selected/.test(await page.innerText('#selCount')), 'counts selected notes');
  ok(await page.locator('#orgList .note[aria-checked=true]').count() === 3, 'selected notes are ticked');
  await page.click('[data-act=mvMany][data-d="-1"]');
  { const n = (await exNotes()).map(x => x.id); ok(n.slice(2, 5).join() === pickIdx.map(i => before[i].id).join() && n[5] === before[2].id, 'Up moves the 3 notes together'); }
  await page.click('[data-act=mvMany][data-d="1"]'); await page.click('[data-act=mvMany][data-d="1"]');
  { const n = (await exNotes()).map(x => x.id); ok(n.slice(4, 7).join() === pickIdx.map(i => before[i].id).join(), 'Down moves them together, twice'); }
  await page.click('[data-act=mvMany][data-d="-1"]');
  ok(JSON.stringify((await exNotes()).map(x => x.id)) === JSON.stringify(before.map(x => x.id)), 'back where they started');
  await page.click('[data-act=retagMany][data-tag=key]');
  ok((await exNotes()).filter(x => pickIdx.map(i => before[i].id).includes(x.id)).every(x => x.tag === 'key'), 'one tap retypes all selected notes');
  const tagged = await exNotes();
  await page.click('[data-act=delMany]');
  ok((await exNotes()).length === before.length - 3, 'Delete removes all selected notes');
  ok(await page.isVisible('.toast >> text=3 notes deleted') && await page.isVisible('.toast [data-act=undo]'), 'message says how many were deleted, with Undo');
  ok(await page.isVisible('#undoBtn'), 'Undo delete button stays in Organize');
  ok(await page.evaluate(() => { const a = document.querySelector('.toast').getBoundingClientRect(), b = document.querySelector('.actionbar').getBoundingClientRect(); return a.bottom <= b.top; }), 'the message sits above the toolbar, not on it');
  await page.click('.toast [data-act=undo]');
  ok(JSON.stringify(await exNotes()) === JSON.stringify(tagged), 'Undo puts the notes back exactly where they were');
  ok(await page.isHidden('#undoBtn'), 'nothing left to undo');
  // two deletes in a row, undone one at a time with the Organize button
  const ids = (await exNotes()).map(x => x.id);
  await page.locator(`#orgList .note[data-id="${ids[1]}"]`).click(); await page.click('[data-act=delMany]');
  await page.locator(`#orgList .note[data-id="${ids[7]}"]`).click(); await page.locator(`#orgList .note[data-id="${ids[8]}"]`).click(); await page.click('[data-act=delMany]');
  ok((await exNotes()).length === ids.length - 3 && /Undo delete \(2\)/.test(await page.innerText('#undoBtn')), 'two deletes can be undone: ' + await page.innerText('#undoBtn'));
  await page.waitForTimeout(8200);
  ok(await page.isVisible('#undoBtn'), 'Undo delete is still there after the message goes away');
  await page.click('#undoBtn'); ok((await exNotes()).length === ids.length - 1, 'first undo brings back the latest delete');
  await page.click('#undoBtn'); ok(JSON.stringify((await exNotes()).map(x => x.id)) === JSON.stringify(ids), 'second undo brings back the earlier one, in order');
  await page.locator(`#orgList .note[data-id="${ids[0]}"]`).click();
  ok(await page.isDisabled('[data-act=mvMany][data-d="-1"]'), 'Up is off when the selection is already at the top');
  await page.screenshot({ path: OUT + '/multi-select.png' });
  ok(!(await overflow()), 'select mode: no sideways scrolling');
  await page.click('.actionbar [data-act=multiToggle]');
  ok(await page.isHidden('.actionbar') && await page.locator('#orgList .note.pick').count() === 0, 'Done leaves select mode');
  // From a single note: Select, then edit-to-empty is undoable
  await page.locator(`#orgList .note[data-id="${ids[2]}"]`).click();
  await page.click('.actionbar [data-act=multiFrom]');
  ok(/1 note selected/.test(await page.innerText('#selCount')), 'Select on a note starts select mode with that note ticked');
  await page.click('.actionbar [data-act=multiToggle]');
  await page.locator(`#orgList .note[data-id="${ids[2]}"]`).click(); await page.click('.actionbar [data-act=edit]');
  await page.fill('#editText', ''); await page.click('[data-act=editSave]');
  ok((await exNotes()).length === ids.length - 1 && await page.isVisible('#undoBtn'), 'emptying a note deletes it, and that can be undone too');
  await page.click('#undoBtn'); ok((await exNotes()).length === ids.length, 'restored');

  // ---- Take notes: add notes in between ----
  await page.click('[data-tab=capture]');
  ok(await page.isVisible('text=Tip: tap any note'), 'Take notes explains how to add in between');
  if (await page.isVisible('[data-act=showAll]')) await page.click('[data-act=showAll]');
  const cap0 = await exNotes(), anchor = cap0.find(x => x.tag !== 'section' && x.level === 2) || cap0[3], ai = cap0.indexOf(cap0.find(x => x.id === anchor.id));
  await page.locator(`#recent .note[data-id="${anchor.id}"]`).click();
  ok(await page.isVisible('#insBanner') && (await page.innerText('#insBanner')).includes(anchor.text.slice(0, 20)), 'banner shows where new notes will go');
  ok(await page.locator(`#recent .note.anchor[data-id="${anchor.id}"]`).count() === 1, 'the chosen note is marked');
  ok(await page.evaluate(() => document.activeElement.id) === 'draft', 'cursor jumps to the note box');
  await page.fill('#draft', 'Inserted one'); await page.press('#draft', 'Enter');
  await page.fill('#draft', 'Inserted two'); await page.press('#draft', 'Enter');
  { const n = await exNotes(); ok(n[ai + 1].text === 'Inserted one' && n[ai + 2].text === 'Inserted two', 'new notes go right below the chosen note, in order');
    ok(n[ai + 1].t === anchor.t && n[ai + 1].level === anchor.level, 'they take its video time and indent');
    ok(n.length === cap0.length + 2, 'nothing else changed'); }
  ok(await page.locator('#recent .note.anchor', { hasText: 'Inserted two' }).count() === 1, 'the insert point follows the newest note');
  { const sec = cap0.find(x => x.tag === 'section'); await page.locator(`#recent .note[data-id="${sec.id}"]`).click();
    await page.fill('#draft', 'Right under the heading'); await page.press('#draft', 'Enter');
    const n = await exNotes(), si = n.findIndex(x => x.id === sec.id); ok(n[si + 1].text === 'Right under the heading' && n[si + 1].level === 1, 'adding below a section heading makes a point under it'); }
  await page.click('[data-act=insertCancel]');
  ok(await page.isHidden('#insBanner'), '"Add at the end instead" turns it off');
  await page.fill('#draft', 'Back at the end'); await page.press('#draft', 'Enter');
  ok((await exNotes()).slice(-1)[0].text === 'Back at the end', 'new notes go at the end again');
  await page.screenshot({ path: OUT + '/insert.png' });

  // ---- Dark theme and reload ----
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('[data-tab=quiz]');
  await page.click('text=Start 2-minute brain dump'); await page.click('text=Check against my notes');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bg !== 'rgb(237, 241, 247)' && bg !== 'rgba(0, 0, 0, 0)', 'dark theme repaints the page: ' + bg);
  ok(!(await overflow()), 'dark theme: no sideways scrolling');
  await page.screenshot({ path: OUT + '/dump-compare-dark.png', fullPage: true });
  await page.click('[data-act=home]');
  await page.screenshot({ path: OUT + '/home-dark.png' });
  await page.reload(); await page.waitForSelector('.home');
  ok(await page.locator('.lesson').count() === 2, 'lessons survive a reload');

  // ---- Home screen for returning users ----
  { const ns = await page.evaluate(() => { const { normalize, nextStep, dateGroup } = window.SCRIBBLE; const N = (id, tag, text) => ({ id, tag, text, level: 1, t: 0 });
      const b = { id: 'b', title: 'B', notes: [N('s', 'section', 'S'), N('x', '', 'x')] };
      const steps = [normalize({ id: 'a', title: 'A', notes: [] }), normalize(b), normalize({ ...b, dumpAt: 1, dumpMarks: { s: 'missed' } }), normalize({ ...b, dumpAt: 1 }), normalize({ ...b, dumpAt: 1, quizAt: 1 })].map(x => nextStep(x).tab + ':' + nextStep(x).btn);
      const now = Date.now(); return { steps, groups: [dateGroup(now), dateGroup(now - 864e5), dateGroup(now - 3 * 864e5), dateGroup(now - 40 * 864e5)] }; });
    ok(JSON.stringify(ns.steps) === JSON.stringify(['capture:Take notes', 'quiz:Start brain dump', 'quiz:Review what I missed', 'quiz:Quiz me', 'quiz:Quiz me again']), 'next step follows the study routine: ' + ns.steps.join(', '));
    ok(ns.groups[0] === 'Today' && ns.groups[1] === 'Yesterday' && ns.groups[2] === 'Last 7 days' && /\d{4}$/.test(ns.groups[3]), 'date groups: ' + ns.groups.join(', ')); }
  ok((await lessons()).find(x => x.example).quizAt > 0, 'finishing a quiz round is remembered');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => { const ls = JSON.parse(localStorage.getItem('scribble.v1.lessons')), now = Date.now();
    ls.push({ id: 'old1', title: 'Market research basics', course: 'Business Strategy', createdAt: now - 40 * 864e5, updatedAt: now - 40 * 864e5, notes: [{ id: 'o1', text: 'Surveys and interviews', tag: '', level: 0, t: 0 }] });
    ls.push({ id: 'old2', title: 'Pricing', course: 'Business Strategy', createdAt: now - 3 * 864e5, updatedAt: now - 3 * 864e5, notes: [] });
    localStorage.setItem('scribble.v1.lessons', JSON.stringify(ls)); localStorage.removeItem('scribble.home.view'); });
  await page.reload(); await page.waitForSelector('.home');
  ok(await page.isHidden('.hero'), 'returning users skip the big intro');
  ok(await page.isVisible('#continue'), 'continue card shows');
  { const recent = (await lessons()).sort((a, b) => b.updatedAt - a.updatedAt)[0]; ok((await page.innerText('#contTitle')) === recent.title, 'continue card shows the most recently used lesson: ' + recent.title); }
  ok(await page.locator('#continue .steps li').count() === 4 && await page.locator('#continue .next .btn.primary').count() === 1, 'continue card shows the four steps and one main button');
  { const heads = await page.locator('.grp-h').allTextContents();
    ok(heads[0].startsWith('Today') && heads.some(h => h.startsWith('Last 7 days')) && heads.some(h => /\d{4}/.test(h)), 'lessons grouped by date: ' + heads.join(' | ')); }
  ok(await page.locator('.lesson').count() === 4, 'every lesson listed once');
  ok(!(await page.locator('.lesson').allInnerTexts()).some(x => /\b0 ★/.test(x)), 'zero counts are hidden');
  ok(await page.locator('#howCard').evaluate(d => !d.open) && await page.locator('#howCard #demoVideo').count() === 1, 'video and routine tucked into How Scribble works');
  await page.screenshot({ path: OUT + '/home-returning.png', fullPage: true });
  await page.click('#howCard summary'); ok(await page.isVisible('#demoVideo'), 'How Scribble works opens');
  await page.click('[data-act=homeView][data-v=course]');
  { const h = await page.locator('.grp-h').allTextContents(); ok(h.some(x => x.startsWith('Business Strategy')) && h.some(x => x.startsWith('BIO 101')), 'grouped by course: ' + h.join(' | '));
    const bs = page.locator('.grp', { hasText: 'Business Strategy' }), titles = await bs.locator('.lesson .title').allInnerTexts();
    ok(titles[0] === 'Market research basics' && titles[1] === 'Pricing' && (await bs.locator('.lnum').first().innerText()) === 'Lesson 1', 'course lessons in the order watched, numbered: ' + titles.join(', ')); }
  await page.reload(); await page.waitForSelector('.home');
  ok(await page.getAttribute('[data-act=homeView][data-v=course]', 'aria-selected') === 'true', 'grouping choice remembered on this device');
  ok(!(await overflow()), 'home: no sideways scrolling');
  await page.screenshot({ path: OUT + '/home-course.png', fullPage: true });
  { const recent = (await lessons()).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const tab = await page.evaluate(id => window.SCRIBBLE.nextStep(window.SCRIBBLE.normalize(JSON.parse(localStorage.getItem('scribble.v1.lessons')).find(x => x.id === id))).tab, recent.id);
    await page.click('#continue .next .btn.primary');
    ok(await page.getAttribute(`[data-tab=${tab}]`, 'aria-selected') === 'true', 'next-step button opens the right tab: ' + tab); }
  await page.click('[data-act=home]');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: OUT + '/home-returning-dark.png', fullPage: true });
  ok(!(await overflow()), 'home dark: no sideways scrolling');

  ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
  await browser.close();
  console.log(`browser: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
