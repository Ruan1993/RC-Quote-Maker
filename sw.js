const CACHE_NAME="rc-quote-maker-v3";
const ASSETS=["/","/index.html","/invoice.html","/css/styles.css","/js/app.js","/js/firebase.js","/js/firebase.config.js","/favicon-v2.svg","/manifest.webmanifest"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));});
self.addEventListener("activate",e=>{self.clients.claim();e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(req).catch(()=>caches.match("/index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy));return res;})));
});