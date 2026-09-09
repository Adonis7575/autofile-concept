const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 940 } });
  const errs = [];
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  await p.goto("file:///root/notes-app/index.html");
  await p.waitForTimeout(400);

  const folders = await p.$$eval("#folders .fold", els => els.length);
  const recent = await p.$$eval("#listwrap .note", els => els.length);
  console.log("folders rendered:", folders, "| recent rows:", recent);

  // 1 — sample note classifies
  await p.click('[data-s="0"]');
  await p.waitForSelector("#bSave", { timeout: 4000 });
  const filed = (await p.textContent("#filing")).replace(/\s+/g, " ").trim();
  console.log("filing bar:", filed);

  // 2 — why panel
  await p.click("#bWhy");
  const reasons = await p.$$eval(".reason", els => els.map(e => e.innerText.trim()));
  console.log("reasons:", reasons.length, "->", reasons[0]);
  await p.click("details.raw summary");
  await p.screenshot({ path: "shot-1-classified.png" });

  // 3 — save, folder count moves
  const before = await p.textContent('[data-folder="Projects/DataFlow Integration"] .ct');
  await p.click("#bSave");
  await p.waitForTimeout(300);
  const after = await p.textContent('[data-folder="Projects/DataFlow Integration"] .ct');
  console.log("DataFlow folder count:", before, "->", after);

  // 4 — ambiguous note goes to Inbox
  await p.click('[data-s="2"]');
  await p.waitForSelector("#bSave", { timeout: 4000 });
  const amb = (await p.textContent("#filing")).replace(/\s+/g, " ").trim();
  console.log("ambiguous:", amb);
  await p.click("#bSave");
  await p.waitForTimeout(300);
  await p.click('[data-folder="Inbox"]');
  await p.waitForTimeout(200);
  const chips = await p.$$eval(".inbox-card .chip", els => els.map(e => e.innerText.replace(/\s+/g," ")));
  console.log("inbox candidates:", chips.join("  ·  "));
  await p.screenshot({ path: "shot-2-inbox.png" });

  // 5 — correction creates a rule
  await p.click(".inbox-card .chip");
  await p.waitForTimeout(300);
  const toast = (await p.textContent("#toast")).replace(/\s+/g, " ").trim();
  console.log("after accepting a candidate:", toast);

  // 6 — search
  await p.fill("#q", "Acme");
  await p.waitForTimeout(250);
  const hits = await p.textContent("#listwrap h3");
  console.log("search:", hits.trim());
  await p.screenshot({ path: "shot-3-search.png" });

  console.log(errs.length ? "CONSOLE ERRORS:\n" + errs.join("\n") : "no console errors");
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
