#!/usr/bin/env python3
"""Build Scribble from src/app.html.

- index.html          the GitHub Pages site (adds the document head the artifact host normally supplies)
- dist/artifact.html  the claude.ai artifact (src/app.html as is; the host adds the head)

Run from anywhere: python3 scripts/build.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "app.html"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="A note-taking app for video lessons: timestamped notes, pause reminders, easy reordering, summaries and a flashcard quiz.">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="Scribble">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#EDF1F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D1424" media="(prefers-color-scheme: dark)">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font-family:system-ui,sans-serif;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""


def main() -> None:
    app = SRC.read_text(encoding="utf-8")
    if "<script>" not in app or "<title>" not in app[:8192]:
        raise SystemExit("src/app.html looks incomplete (no <script> or no <title> near the top)")
    (ROOT / "index.html").write_text(HEAD + app.rstrip("\n") + "\n</body>\n</html>\n", encoding="utf-8")
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "artifact.html").write_text(app, encoding="utf-8")
    print("built index.html and dist/artifact.html")


if __name__ == "__main__":
    main()
