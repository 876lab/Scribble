# Scribble roadmap

The working plan for the weekly update runs (Fridays, 3:20am Jamaica time, after Futures Radar at 1:20 and OMGym at 2:20). Each run researches new ways to make Scribble better, builds **one** focused improvement (the first unchecked backlog item that isn't blocked, or one marked "Owner request, do first"), tests it, publishes it, and records what changed here, in `CHANGELOG.md` and in the app's What's new list.

## Owner and app
- Owner: lives in Jamaica (UTC-5). He takes online classes where he watches a video lesson, then takes a test at the end. He is easily distracted and finds it hard to listen and write at the same time, so Scribble's job is to make capturing, arranging, editing and summarising notes easy, and to help him remember the lesson for the test.
- Live app: https://876lab.github.io/Scribble/ (GitHub Pages from `main`, file `index.html`, built from `src/app.html` by `python3 scripts/build.py`). Saves lessons in the browser on that device; the Claude summary is hidden there.
- claude.ai artifact: https://claude.ai/artifact/FpzNcuKJLoKH6zaEoxzto7 (same app; saves lessons to the owner's Claude account and offers "Summarize with Claude"). Republish it from `dist/artifact.html` with the `media/` files after changes, when the session can.
- Repository: https://github.com/876lab/Scribble (public).

## Architecture
- `src/app.html`: the whole app (title, styles, markup, script) in one file, written for the claude.ai artifact host. `scripts/build.py` writes `index.html` (adds the document head for GitHub Pages) and `dist/artifact.html`.
- Inside the script: `CHANGES` (What's new, newest first), `TAGS` (note types), `normalize()` (saved-lesson format), `sectionGroups()` and `buildDeck()` (quiz cards), `dumpHTML()` (brain dump), `toMarkdown()` (export). `window.SCRIBBLE` is a read-only hook for the tests.
- Saved data: lessons in `localStorage['scribble.v1.lessons']`, and in the artifact also in the `db` capability at `data/users/<id>/<lessonId>`. Lesson fields: `id, title, course, createdAt, updatedAt, elapsed, mySummary, notes[{id,text,tag,level,t}], ai, example, dump, dumpAt, dumpMarks`. Per-device settings: `scribble.nudge` (pause reminder minutes), `scribble.news.seen` (last What's new entry seen).
- Artifact capabilities: `db`, `user`, `sample` (Claude summary), `downloads`. Never pass `capabilities` when republishing, so the stored ones carry forward.
- `media/walkthrough.mp4` and `media/walkthrough-poster.jpg`: the home-screen walkthrough. Re-record it when a change makes it clearly out of date.
- Checks: `bash tests/run.sh` (build, staleness check, script syntax, `tests/browser.js`: a full phone-sized walk-through with logic checks, light and dark). With `SITE=https://876lab.github.io/Scribble/` the browser test checks the live site. GitHub runs the tests on every push to `main` (`.github/workflows/tests.yml`) and checks the live site every morning (`.github/workflows/health.yml`); a failure emails the owner.

## Rules for every run (binding)
1. **Weekly usage pause (owner, 30 Oct 2026).** When the owner's weekly Claude usage is over 75%, all update runs (Scribble, OMGym, Futures Radar) pause until his weekly usage resets. A run cannot read the usage meter: the owner pauses and resumes the scheduled tasks (or asks Claude to). If a run hits a usage-limit or rate-limit error, it stops straight away without pushing half-finished work and, if it can, adds a dated line under "Notes from runs".
2. **One focused improvement per run.** Keep the change reviewable. Small and correct beats big.
3. **Research first.** Prefer primary sources (peer-reviewed studies, meta-analyses, university learning centres, official documentation). Say plainly when evidence is mixed, and record sources in `CHANGELOG.md`.
4. **Keep it simple for a distracted learner:** plain language, one obvious next step per screen, mobile-first at 390 px, both light and dark themes, no clutter, no streaks, badges, ads or guilt.
5. **Never remove a feature or break saved lessons.** New lesson fields get defaults in `normalize()`; changing the format needs a migration and tests.
6. **Privacy:** lessons stay on the device or in the owner's own Claude account. No accounts, analytics, trackers, servers, paid services, API keys or secrets. Claude features run only through the artifact's `sample` capability, with the viewer's consent.
7. Never change repository settings or hosting, delete branches, or add Claude connectors.
8. Edit `src/app.html`, then run `python3 scripts/build.py` and `bash tests/run.sh`. Publish only on `ALL CHECKS PASSED`. Look at the screenshots in `tests/out/` once and fix anything visibly broken. If checks can't pass, revert the app change and add a dated note under "Notes from runs" instead.
9. Records: a new entry at the top of `CHANGES` in `src/app.html` (id `YYYY-MM-DD-slug`, date, short title, 1–4 plain-language bullets for the owner), a dated entry at the top of `CHANGELOG.md` with sources, tick the backlog item here and add strong new ideas from the research.
10. End every update summary and notification for the owner with the app's URL on its own line: https://876lab.github.io/Scribble/

## Backlog (top = next)
- [x] (2026-10-30) Weekly update setup: build script, tests, GitHub checks, this roadmap, changelog, and a What's new button with a dot for unseen updates.
- [x] (2026-10-30) Recall check before the test: 2-minute brain dump on Quiz me, compared section by section ("I had this" / "Missed"), a quiz on just the missed sections, and a recall card for every section.
- [ ] **Add to Home Screen and offline use.** A web app manifest, icons (our own drawing of the Scribble pencil mark) and a small service worker so the GitHub Pages version installs on a phone like an app and opens without a connection. Follow OMGym's setup (`manifest.webmanifest`, `icons/`, `sw.js`). Test: manifest valid, icons reachable on the live site, page still loads offline after one visit.
- [ ] **Spaced review across days.** Cards remember when they were last right or wrong (Leitner boxes: again today, 1 day, 3 days, 7 days) and the library shows "N cards due" across lessons. Distributed practice is one of the two "high utility" techniques in Dunlosky et al. 2013. Keep it optional and quiet: no streaks or guilt.
- [ ] **Brain dump, next step:** in the claude.ai version, an optional "Check it for me" button that asks Claude (sample capability, viewer consent) which sections the brain dump covered and pre-marks them; the owner can change any mark. Hidden where Claude isn't available.
- [ ] **Recall at each pause (optional).** When the pause reminder shows, offer "Cover my notes": the notes sheet hides while he writes the main point from memory, then shows again. Evidence is mixed (Szpunar et al. 2013 found less mind-wandering and better scores; Welhaf et al. 2022 found only a small drop in mind-wandering and no learning gain; Boustani & Shanks 2022 found the forward testing effect unreliable after correcting for publication bias), so keep it a setting, off by default.
- [ ] **Parking lot for stray thoughts.** A quick "Not now" button in Take notes that saves an off-topic thought (a to-do, a worry) to a separate list instead of the lesson, so it stops pulling attention. Research the evidence first (worry postponement, distraction lists for ADHD); ship only if it is reasonable.
- [ ] **Move my data.** Copy and paste a backup code to move lessons between the GitHub Pages version (browser storage) and the claude.ai version (Claude account), like OMGym's "Back up / move my data". Validate before replacing; keep an undo.
- [ ] **Search and course filter** in the library once there are many lessons: search note text, filter by course, show "N to rewatch" across a course.
- [ ] **Text size** setting (Normal / Large, saved per device), like OMGym's; check every tab at 390 px.
- [ ] **Desktop keyboard shortcuts** for Take notes (for example Ctrl+M for Missed that, Alt+1–6 for note types) with a small "?" list. Phones are unaffected.
- [ ] Re-record the walkthrough video when the home screen or Quiz me changes enough that it looks out of date (fonts couldn't load in the recording environment on 26 Oct; use them if they can).

## Notes from runs
- 2026-10-30 (setup run, with the owner): The scheduled runs can't see the owner's weekly usage meter (no tool or token exposes it), so the 75% pause is done by pausing the scheduled tasks. GitHub repository settings, Pages settings and topics can't be changed from a Claude session (proxy refuses); the owner did those by hand. The live site (github.io) and the npm registry aren't reachable from the session, so local tests use the global Playwright and the live site is checked by the GitHub health workflow instead.
