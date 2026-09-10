// Minimal static server for local development and the smoke suite.
// IndexedDB and the /api routes need a real origin; file:// won't do.
const http=require("http"), fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const types={".html":"text/html",".js":"text/javascript",".json":"application/json",
             ".md":"text/markdown",".css":"text/css"};
const port=process.env.PORT||8099;
http.createServer(async (req,res)=>{
  let u=decodeURIComponent(req.url.split("?")[0]);
  if(u==="/api/classify"){                       // stand in for the Vercel function
    try{ const fn=require(path.join(root,"api","classify.js"));
      res.status=(c)=>{res.statusCode=c;return res;};
      res.json=(o)=>{res.setHeader("content-type","application/json");res.end(JSON.stringify(o));};
      return fn(req,res);
    }catch(e){ res.writeHead(500); return res.end(String(e)); }
  }
  if(u==="/")u="/index.html";
  if(!path.extname(u)&&fs.existsSync(path.join(root,u+".html")))u+=".html";
  const f=path.join(root,u);
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404);res.end("not found");return;}
    res.writeHead(200,{"content-type":types[path.extname(f)]||"application/octet-stream"});
    res.end(d);
  });
}).listen(port,()=>console.log("autofile on http://127.0.0.1:"+port));
