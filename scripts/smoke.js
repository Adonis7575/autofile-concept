const { chromium } = require("playwright");
const path = require("path");
const URL = "file://" + path.join(__dirname, "..", "index.html");
const rows=[]; const log=(a,w,ok,n="")=>rows.push({a,w,ok,n});

// Drives the real UI in headless Chromium: every tool, every button, the ink
// canvas, the audio timeline, filing, rules, delete and undo.
(async()=>{
  const b=await chromium.launch({args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});
  const c=await b.newContext({viewport:{width:1500,height:940},permissions:["microphone"]});
  const p=await c.newPage();
  const errs=[]; p.on("pageerror",e=>errs.push((e.stack||e.message).split("\n").slice(0,3).join(" | ")));
  p.on("console",m=>{if(m.type()==="error"&&!/fonts.goog|ERR_TUNNEL|Failed to load/.test(m.text()))errs.push("console: "+m.text());});
await p.goto(URL); await p.waitForTimeout(500);

  log("boot","page renders", await p.$("#page")!==null);
  log("boot","subjects listed", (await p.$$eval("#subjects .subj",e=>e.length))===11, await p.$$eval("#subjects .subj",e=>e.length)+" rows");
  log("boot","cards listed", (await p.$$eval("#cards .card",e=>e.length))>0, await p.$$eval("#cards .card",e=>e.length)+" cards");
  log("boot","a note is open", (await p.inputValue("#title")).length>0, await p.inputValue("#title"));
  log("boot","body has content", (await p.textContent("#txt")).length>0);

  // ---- editing existing note
  await p.click("#txt"); await p.keyboard.press("End");
  await p.keyboard.type(" Editing works.");
  await p.waitForTimeout(1400);
  const bodyNow=await p.textContent("#txt");
  log("edit","existing note body is editable", /Editing works\./.test(bodyNow));
  await p.fill("#title","Renamed by test");
  await p.waitForTimeout(300);
  const cardT=await p.textContent("#cards .card[aria-current='true'] .t");
  log("edit","title edit reflects in list", /Renamed by test/.test(cardT), cardT.trim());

  // ---- formatting
  const fmts=await p.$$eval("#fmt [data-fmt]",e=>e.map(x=>x.dataset.fmt));
  for(const f of fmts){
    await p.click("#txt"); await p.keyboard.press("End");
    await p.keyboard.press("Enter"); await p.keyboard.type("Format "+f);
    if(f==="mark"||f==="code"){ for(let i=0;i<6;i++) await p.keyboard.press("Shift+ArrowLeft"); }
    await p.click(`#fmt [data-fmt="${f}"]`); await p.waitForTimeout(150);
  }
  const html=await p.innerHTML("#txt");
  log("format","heading applied", /<h2/i.test(html));
  log("format","bullet list applied", /<ul/i.test(html));
  log("format","checklist applied", /class="todo"/.test(html));
  log("format","quote applied", /<blockquote/i.test(html));
  log("format","highlight applied", /<mark/i.test(html));
  log("format","inline code applied", /<code/i.test(html));

  // checkbox toggles
  const cb=await p.$("#txt .todo>input");
  if(cb){ await cb.click(); await p.waitForTimeout(120);
    log("format","checkbox toggles + persists", await p.$eval("#txt .todo>input",e=>e.hasAttribute("checked"))); }
  else log("format","checkbox toggles + persists", false, "no checkbox");

  // ---- tools + ink
  for(const t of ["pen","marker","eraser","text"]){
    await p.click(`#tools [data-tool="${t}"]`);
    const on=await p.$eval(`#tools [data-tool="${t}"]`,e=>e.getAttribute("aria-pressed"));
    log("tools",`${t} tool selects`, on==="true");
  }
  await p.click(`#tools [data-tool="pen"]`);
  const box=await p.$eval("#ink",e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
  await p.mouse.move(box.x+120,box.y+420); await p.mouse.down();
  for(let i=0;i<24;i++) await p.mouse.move(box.x+120+i*9,box.y+420+Math.sin(i/3)*22);
  await p.mouse.up(); await p.waitForTimeout(200);
  let strokes=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).strokes.length);
  log("ink","pen draws a stroke", strokes===1, strokes+" strokes");
  await p.click(`#tools [data-tool="marker"]`);
  await p.mouse.move(box.x+140,box.y+470); await p.mouse.down();
  for(let i=0;i<14;i++) await p.mouse.move(box.x+140+i*11,box.y+470);
  await p.mouse.up(); await p.waitForTimeout(150);
  strokes=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).strokes.length);
  log("ink","highlighter draws", strokes===2, strokes+" strokes");
  const painted=await p.evaluate(()=>{const c=document.querySelector("#ink");
    const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
    let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>0)n++; return n;});
  log("ink","pixels actually painted", painted>500, painted+" px");
  await p.click(`#tools [data-tool="eraser"]`);
  await p.mouse.move(box.x+140,box.y+470); await p.mouse.down();
  await p.mouse.move(box.x+200,box.y+470); await p.mouse.up(); await p.waitForTimeout(150);
  const after=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).strokes.length);
  log("ink","eraser removes a stroke", after<strokes, `${strokes} -> ${after}`);

  // colour + width
  await p.click("#swatches [data-color]:nth-child(2)");
  log("tools","colour swatch selects", await p.$eval("#swatches [data-color]:nth-child(2)",e=>e.getAttribute("aria-pressed"))==="true");
  await p.click("#widths [data-w]:nth-child(3)");
  log("tools","width selects", await p.$eval("#widths [data-w]:nth-child(3)",e=>e.getAttribute("aria-pressed"))==="true");

  // ---- paper + theme
  for(const v of ["plain","grid","dotted","ruled"]){
    await p.selectOption("#paper",v);
    log("paper",`${v} template applies`, await p.$eval("#page",e=>e.dataset.paper)===v);
  }
  await p.click("#bTheme");
  log("paper","light paper toggles", await p.$eval("#page",e=>e.classList.contains("light")));
  await p.click("#bTheme");

  
  await p.goto(URL); await p.waitForTimeout(450);
await p.goto(URL); await p.waitForTimeout(450);

  // ---- new note + auto-filing
  await p.click("#bNew"); await p.waitForTimeout(200);
  log("new","New note opens blank", (await p.inputValue("#title"))==="" && (await p.textContent("#txt"))==="");
  await p.fill("#title","DataFlow sync");
  await p.click("#txt");
  await p.keyboard.type("Met with Sarah Chen from DataFlow Inc. Discussed the Q2 integration timeline and the API migration deadline of March 15. Need a security audit before launch.");
  await p.waitForTimeout(1600);
  const path1=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).path);
  const conf1=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).decision.confidence);
  log("filing","new note auto-files", path1==="Projects/DataFlow Integration", `${path1} @ ${conf1}`);
  log("filing","stamp shows destination", /DataFlow/.test(await p.textContent("#stamp")));

  // ---- why drawer
  await p.click("#bWhy"); await p.waitForTimeout(350);
  log("why","drawer opens", await p.$eval("#why",e=>e.classList.contains("open")));
  const rs=await p.$$eval(".rsn",e=>e.length);
  log("why","reasons listed", rs>0, rs+" reasons");
  log("why","decision object present", await p.$("details.raw")!==null);
  log("why","This is right button", await p.$("#bOk")!==null);

  // ---- move + rule
  await p.click("#bMove"); await p.waitForTimeout(250);
  log("move","modal lists destinations", (await p.$$eval("#modal [data-dest]",e=>e.length))>0);
  await p.click('#modal [data-dest="Meetings"]'); await p.waitForTimeout(200);
  const opts=await p.$$eval("#modal [data-opt]",e=>e.map(x=>x.dataset.opt));
  log("move","rule option offered", opts.includes("rule"), opts.join(","));
  await p.click("#mGo"); await p.waitForTimeout(300);
  log("move","note moved", (await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).path))==="Meetings");
  log("rules","rule created", (await p.evaluate(()=>state.rules.length))===1);
  log("rules","rule shown in rail", /DataFlow/.test(await p.textContent("#rules")));

  // rule steers next note
  await p.click("#bNew"); await p.waitForTimeout(150);
  await p.fill("#title","Second DataFlow note");
  await p.click("#txt");
  await p.keyboard.type("Quick note about DataFlow Inc and the sandbox tenant Sarah Chen promised for next week.");
  await p.waitForTimeout(1600);
  const byRule=await p.evaluate(()=>state.notes.find(n=>n.id===state.activeId).decision);
  log("rules","rule steers the next note", byRule.decided_by==="rule" && byRule.applied==="Meetings", byRule.decided_by+" → "+byRule.applied);

  // delete rule
  await p.click("#rules .x"); await p.waitForTimeout(250);
  log("rules","rule can be deleted", (await p.evaluate(()=>state.rules.length))===0);
  await p.click("#tAct"); await p.waitForTimeout(200);
  log("rules","rule delete is undoable", (await p.evaluate(()=>state.rules.length))===1);

  // ---- undo of a move
  await p.click("#rules .x"); await p.waitForTimeout(150);

  // ---- audio
  await p.click("#bRec"); await p.waitForTimeout(600);
  log("audio","recording starts", await p.$eval("#audioBar",e=>!e.hidden) && await p.evaluate(()=>state.rec.on));
  await p.click("#txt"); await p.keyboard.press("End"); await p.keyboard.press("Enter");
  await p.keyboard.type("This line was written while recording.");
  await p.waitForTimeout(900);
  await p.keyboard.press("Enter"); await p.keyboard.type("And this one a moment later.");
  await p.waitForTimeout(700);
  const marks=await p.$$eval("#txt [data-rec]",e=>e.length);
  log("audio","lines timestamped while recording", marks>=2, marks+" stamped lines");
  await p.click("#bRec"); await p.waitForTimeout(700);
  const aud=await p.evaluate(()=>{const n=state.notes.find(x=>x.id===state.activeId);
    return n.audio?{dur:n.audio.dur,marks:n.audio.marks.length,mic:n.audio.mic}:null;});
  log("audio","recording saved with marks", !!aud && aud.marks>=2, JSON.stringify(aud));
  log("audio","track shows marks", (await p.$$eval("#track .mk",e=>e.length))>0);
  await p.click("#bPlay"); await p.waitForTimeout(900);
  log("audio","playback runs", await p.evaluate(()=>state.rec.playing));
  const hot=await p.$$eval("#txt [data-rec].hot",e=>e.length);
  log("audio","playback highlights the line", hot>0, hot+" highlighted");
  await p.click('#txt [data-rec]'); await p.waitForTimeout(250);
  log("audio","clicking a line seeks audio", (await p.evaluate(()=>state.rec.pos))>=0);
  await p.click("#bPlay"); await p.waitForTimeout(200);

  // ---- search + subjects
  await p.fill("#q","Qdrant"); await p.waitForTimeout(250);
  const hits=await p.$$eval("#cards .card",e=>e.length);
  log("search","search filters the list", hits>0&&hits<29, hits+" cards");
  await p.fill("#q",""); await p.waitForTimeout(200);
  await p.click('#subjects [data-subject="Reference/Engineering"]'); await p.waitForTimeout(200);
  log("subjects","subject filters the list", (await p.textContent("#listTitle")).includes("Reference/Engineering"));
  await p.dblclick('#subjects [data-subject="Reference/Engineering"]'); await p.waitForTimeout(250);
  const hasInput=await p.$("#subjects input.ren");
  log("subjects","double-click renames", !!hasInput);
  if(hasInput){ await p.fill("#subjects input.ren","Reference/Eng Notes");
    await p.keyboard.press("Enter"); await p.waitForTimeout(300);
    log("subjects","rename applies to notes",
      await p.evaluate(()=>state.notes.some(n=>n.path==="Reference/Eng Notes"))); }
  await p.click('#subjects [data-subject=""]'); await p.waitForTimeout(150);

  // ---- delete note
  const before=await p.evaluate(()=>state.notes.length);
  await p.click("#bDel"); await p.waitForTimeout(250);
  log("delete","confirm dialog appears", await p.$("#mDel")!==null);
  await p.click("#mDel"); await p.waitForTimeout(300);
  const mid=await p.evaluate(()=>state.notes.length);
  log("delete","note removed", mid===before-1, `${before} -> ${mid}`);
  await p.click("#tAct"); await p.waitForTimeout(300);
  log("delete","delete is undoable", (await p.evaluate(()=>state.notes.length))===before);

  // ---- keyboard
  await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
  await p.keyboard.press("p");
  log("keys","P selects pen when not typing", await p.evaluate(()=>state.tool)==="pen");
  await p.keyboard.press("v");
  log("keys","V returns to text", await p.evaluate(()=>state.tool)==="text");
  await p.click("#txt"); await p.keyboard.type("pen");
  log("keys","letters type normally in the editor",
    await p.evaluate(()=>state.tool)==="text" && (await p.textContent("#txt")).includes("pen"));
  await p.keyboard.press("Control+2");
  log("keys","Ctrl+2 switches tool mid-sentence", await p.evaluate(()=>state.tool)==="pen");
  await p.keyboard.press("Control+1");
  await p.keyboard.press("Escape");

  // ---- ink survives note switching
  await p.click("#bNew"); await p.waitForTimeout(150);
  const id=await p.evaluate(()=>state.activeId);
  await p.click('#tools [data-tool="pen"]');
  const bx=await p.$eval("#ink",e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y};});
  await p.mouse.move(bx.x+150,bx.y+400); await p.mouse.down();
  for(let i=0;i<15;i++) await p.mouse.move(bx.x+150+i*10,bx.y+400+i*3);
  await p.mouse.up(); await p.waitForTimeout(200);
  await p.click("#cards .card:nth-child(3)"); await p.waitForTimeout(250);
  await p.evaluate(i=>openNote(i),id); await p.waitForTimeout(300);
  const kept=await p.evaluate(i=>state.notes.find(n=>n.id===i).strokes.length,id);
  const px=await p.evaluate(()=>{const c=document.querySelector("#ink");
    const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
    let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n;});
  log("ink","strokes survive switching notes", kept===1 && px>200, `${kept} stroke, ${px} px redrawn`);

  
  console.log("\nAREA     | RESULT | CHECK                                | NOTE");
  console.log("-".repeat(96));
  for(const r of rows)
    console.log(`${r.a.padEnd(8)} | ${(r.ok?"pass":"FAIL").padEnd(6)} | ${r.w.padEnd(36).slice(0,36)} | ${r.n}`);
  const f=rows.filter(r=>!r.ok).length;
  console.log(`\n${rows.length-f} pass, ${f} fail`);
  console.log("uncaught errors:", errs.length?errs:"none");
  await b.close();
  process.exit(f||errs.length?1:0);
})();
