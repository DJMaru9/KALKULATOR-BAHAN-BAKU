/* Pekerja layanan — Bahan Baku SPPG Bantaeng Gantarangkeke */
var VERSI = "sppg-bahan-v2";
var ISI = ["./", "./index.html", "./manifest.json",
           "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSI).then(function(c){
      return Promise.all(ISI.map(function(u){
        return c.add(new Request(u, {cache:"reload"})).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(k){
      return Promise.all(k.map(function(n){ if(n !== VERSI) return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var halaman = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;

  if(halaman){
    /* utamakan versi terbaru, pakai simpanan bila tidak ada sinyal */
    e.respondWith(
      fetch(req).then(function(res){
        var salin = res.clone();
        caches.open(VERSI).then(function(c){ c.put(req, salin); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  /* aset lain: pakai simpanan dulu agar cepat dibuka */
  e.respondWith(
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(res){
        if(res && (res.status === 200 || res.type === "opaque")){
          var salin = res.clone();
          caches.open(VERSI).then(function(c){ c.put(req, salin); });
        }
        return res;
      }).catch(function(){ return r; });
    })
  );
});
