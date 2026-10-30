// Pulls the inline <script> out of the page and checks that it parses.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.log('FAIL no inline script in ' + file); process.exit(1); }
const tmp = path.join(os.tmpdir(), 'scribble-syntax-' + process.pid + '.js');
fs.writeFileSync(tmp, m[1]);
try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' }); }
catch { console.log('FAIL script does not parse'); process.exit(1); }
finally { fs.rmSync(tmp, { force: true }); }
const t = html.match(/<title>([^<]+)<\/title>/);
if (!t || t[1] !== 'Scribble') { console.log('FAIL page title should be "Scribble"'); process.exit(1); }
console.log('syntax ok');
