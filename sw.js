// App shell is cached (network-first, offline fallback). ESPN live data (site.api.espn.com) is NEVER cached: those requests are not intercepted at all.
// Team logos (a.espncdn.com) are left to the browser's normal HTTP cache; nothing from ESPN is stored by this worker.
const V='football-live-v1';
const SHELL=['./','index.html','style.css','phone.css','app.js','testgame.js','manifest.json','fonts/InterVariable.woff2','icons/icon-192.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return; // ESPN feeds + logos: straight to network
  e.respondWith(fetch(e.request).then(n=>{if(n.ok)caches.open(V).then(c=>c.put(e.request,n.clone()));return n}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});
