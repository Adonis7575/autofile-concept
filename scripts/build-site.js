// Renders the markdown docs into standalone styled pages. No build step on Vercel:
// this runs locally and the output HTML is committed.
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT = path.join(__dirname, "..");
const NAV = [
  ["/", "Demo"],
  ["/concept", "Concept"],
  ["/spec", "Build spec"],
];

const CSS = `
:root{
  --bg:#0b0b0d;--surface:#131316;--surface2:#191920;--surface3:#20202a;
  --border:#26262e;--border2:#33333d;--text:#e9e7e4;--muted:#9a9aa4;--dim:#6a6a76;
  --brand:#8b8cf0;--ok:#6ee7a8;--warn:#e6b450;
  --display:'Syne',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --serif:'Crimson Pro',Georgia,serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--serif);
  font-size:17px;line-height:1.68;-webkit-font-smoothing:antialiased}
::selection{background:rgba(139,140,240,.3)}
nav{position:sticky;top:0;z-index:10;background:rgba(11,11,13,.88);
  backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
nav .in{max-width:820px;margin:0 auto;padding:13px 28px;display:flex;gap:22px;align-items:center}
nav .brand{font-family:var(--display);font-weight:800;font-size:15px;letter-spacing:-.02em;
  text-decoration:none;color:var(--text);margin-right:auto}
nav .brand span{color:var(--brand)}
nav a.l{font-family:var(--mono);font-size:11.5px;color:var(--dim);text-decoration:none;
  padding:4px 9px;border-radius:5px;letter-spacing:.01em}
nav a.l:hover{color:var(--text);background:var(--surface2)}
nav a.l.on{color:var(--text);background:var(--surface3)}
main{max-width:820px;margin:0 auto;padding:52px 28px 110px}
h1{font-family:var(--display);font-size:38px;font-weight:800;letter-spacing:-.035em;
  line-height:1.12;margin:0 0 6px}
h2{font-family:var(--display);font-size:24px;font-weight:700;letter-spacing:-.025em;
  margin:56px 0 14px;padding-top:26px;border-top:1px solid var(--border)}
h3{font-family:var(--display);font-size:17px;font-weight:700;letter-spacing:-.015em;margin:34px 0 10px}
h4{font-family:var(--display);font-size:14.5px;font-weight:700;margin:24px 0 8px;color:var(--muted)}
p{margin:0 0 17px}
a{color:var(--brand);text-decoration:none;border-bottom:1px solid rgba(139,140,240,.3)}
a:hover{border-bottom-color:var(--brand)}
strong{font-weight:600;color:#fff}
em{font-style:italic}
ul,ol{margin:0 0 18px;padding-left:22px}
li{margin-bottom:7px}
li::marker{color:var(--dim)}
code{font-family:var(--mono);font-size:.82em;background:var(--surface2);
  border:1px solid var(--border);border-radius:4px;padding:1px 5px;color:var(--warn)}
pre{background:var(--surface);border:1px solid var(--border);border-radius:9px;
  padding:17px 19px;overflow-x:auto;margin:0 0 20px}
pre code{background:none;border:0;padding:0;color:var(--muted);font-size:12.5px;line-height:1.62;
  display:block;white-space:pre}
blockquote{margin:0 0 20px;padding:14px 20px;border-left:2px solid var(--brand);
  background:var(--surface);border-radius:0 8px 8px 0;color:var(--muted)}
blockquote p:last-child{margin-bottom:0}
.tw{overflow-x:auto;margin:0 0 22px;border:1px solid var(--border);border-radius:9px}
table{border-collapse:collapse;width:100%;font-family:var(--display);font-size:13.5px}
th{text-align:left;font-weight:600;font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--dim);padding:11px 15px;border-bottom:1px solid var(--border);background:var(--surface)}
td{padding:11px 15px;border-bottom:1px solid var(--border);color:var(--muted);vertical-align:top;
  line-height:1.5}
tr:last-child td{border-bottom:0}
td strong{color:var(--text)}
hr{border:0;border-top:1px solid var(--border);margin:44px 0}
hr+h2{border-top:0;padding-top:0;margin-top:30px}
.sub{font-family:var(--mono);font-size:12px;color:var(--dim);margin:0 0 40px;
  padding-bottom:26px;border-bottom:1px solid var(--border)}
h1+p{font-family:var(--mono);font-size:12px;color:var(--dim)}
footer{max-width:820px;margin:0 auto;padding:0 28px 70px;font-family:var(--mono);
  font-size:11.5px;color:var(--dim)}
footer a{border:0}
@media(max-width:640px){main{padding:36px 20px 80px}h1{font-size:29px}h2{font-size:20px}body{font-size:16px}}
`;

function page(title, bodyHtml, active){
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Autofile — an AI note-taking app that files notes for you, and shows its work.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head><body>
<nav><div class="in">
  <a class="brand" href="/">Autofile<span>.</span></a>
  ${NAV.map(([h, l]) => `<a class="l${h === active ? " on" : ""}" href="${h}">${l}</a>`).join("\n  ")}
  <a class="l" href="https://github.com/Adonis7575/autofile-concept">GitHub</a>
</div></nav>
<main>${bodyHtml}</main>
<footer>Donaghe Enterprises · <a href="/">run the demo</a> · <a href="https://github.com/Adonis7575/autofile-concept">source</a></footer>
</body></html>`;
}

marked.setOptions({ mangle: false, headerIds: false });
const wrapTables = html => html.replace(/<table>[\s\S]*?<\/table>/g, m => `<div class="tw">${m}</div>`);

for (const [src, out, title, active] of [
  ["docs/concept-v2.md", "concept.html", "Autofile — Concept", "/concept"],
  ["docs/build-spec.md", "spec.html",    "Autofile — Build Spec", "/spec"],
]){
  const md = fs.readFileSync(path.join(ROOT, src), "utf8");
  fs.writeFileSync(path.join(ROOT, out), page(title, wrapTables(marked.parse(md)), active));
  console.log("built", out, "from", src);
}
