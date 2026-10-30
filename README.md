# Scribble

A note-taking app for online video lessons, built for people who find it hard to listen and write at the same time.

Instead of typing while the video talks, Scribble helps you **watch a chunk, pause, then write one line**. Every note is stamped with the video time, so you can always find your way back. Afterward, your notes turn into a summary and a flashcard quiz to use before the test.

▶ **[Watch the 90-second walkthrough](media/walkthrough.mp4)**

## How to use it

1. **Make one lesson per video.** Give it a title and a course.
2. **Press Start when you press play.** The lesson clock stamps each note with the video time. Tap the time to match your video if you skip around.
3. **Pause when the reminder shows.** By default it appears every 5 minutes (you can change or turn it off). Stop the video and write the main point in one line.
4. **Lost the thread? Tap "Missed that."** It marks the moment to rewatch so you can keep going instead of falling behind.
5. **After the video, open Organize.** Tap any note to move it, indent it, change its type, or edit it.
6. **Write a summary from memory** in the Summary tab, then check it against your notes.
7. **Before the test, do a brain dump.** In Quiz me, write everything you remember for 2 minutes without looking, then mark each section "I had this" or "Missed" and quiz yourself on the ones you missed.

### Note types and shortcuts

| Type | How to add it |
| --- | --- |
| Section heading | Start a note with `#` |
| Question | Start a note with `?` |
| ★ On the test (highlighted) | Start a note with `!` |
| Definition | Start a note with `=`, or write it as `term: meaning` to get a flashcard |
| Key idea, Example | Tap the chip above the note box |
| Rewatch | Tap **Missed that** |

Press **Enter** to add a note and **Shift+Enter** for a new line.

## Features

- **Take notes:** lesson clock, pause reminder with a chime, quick note types, "Missed that" button
- **Organize:** reorder, indent, retype and edit notes; filter by type; edit the lesson title and course
- **Summary:** automatic key points grouped by section, a space for your own summary, a list of moments to rewatch, and an optional summary from Claude with key terms, gaps and practice questions
- **Quiz me:** a 2-minute brain dump checked section by section, and flashcards from your sections, questions, definitions and Claude's practice questions, with a second round for the ones you missed
- **What's new:** the sparkle button at the top lists each update
- **Export:** copy your notes as Markdown

## Where it runs

- **In Claude:** the full version runs as a Claude artifact. Lessons save to your Claude account and sync across devices, and the Claude summary is available.
- **From this repository:** open `index.html` in any browser, or turn on GitHub Pages for this repo. In this version, lessons save in that browser only, and the Claude summary button is hidden.

## Why it works this way

- **Splitting attention is costly.** Listening while doing another task takes significantly more mental effort than focusing on one thing ([Flinders University study](https://researchnow.flinders.edu.au/en/publications/the-task-evoked-pupil-response-in-divided-auditory-attention-task/)).
- **Pauses help.** In a randomized study of 195 medical students, adding pauses to a video lecture improved learning gains ([HAL](https://hal.archives-ouvertes.fr/hal-03623529)).
- **Pausing and taking notes beat a live lecture.** Students who watched a recorded lecture and could pause scored 71% vs. 62% for the live class ([eSchool News](https://www.eschoolnews.com/innovative-teaching/2009/03/06/podcast-trumps-lecture-in-one-college-study/)).
- **Testing yourself beats rereading.** Retrieval practice led to at least 30% better scores on tests taken days later ([Edu Praxis](https://ei.study/edu-praxis)).
- **Cornell-style structure.** The cue column and summary build self-testing into note-taking ([CASRAI](https://casrai.org/study-skills/cornell-notes)). Scribble puts timestamps in the margin and adds a summary and quiz.

## Weekly updates

Every Friday at 3:20am (Jamaica time) Claude researches a new way to make Scribble better, builds one focused improvement, runs every check, and publishes it. The plan and rules are in [ROADMAP.md](ROADMAP.md); what changed and the sources used are in [CHANGELOG.md](CHANGELOG.md). Updates pause whenever the owner's weekly Claude usage is over 75%.

## Working on it

- Edit `src/app.html` (the whole app: styles, screens and logic in one file).
- `python3 scripts/build.py` rebuilds `index.html` (this site) and `dist/artifact.html` (the claude.ai version).
- `npm test` (or `bash tests/run.sh`) runs every check: script syntax and a full phone-sized walk-through in light and dark.
- GitHub runs the checks on every push to `main` and checks the live site every morning at 5:47am Jamaica time. A failure emails the repo owner.
- `media/walkthrough.mp4` is a screen recording of one lesson from start to quiz. The Claude summary step uses sample text.
