// Service worker for the Zürich HB wayfinding page (written by app/_tools/build_site.py; do not edit by hand).
// Keeps the page, the data and three.js on the phone, so the page also opens without a connection.
const VERSION = 'a9ff6fdf7bf6';
const CACHE = 'hb-wayfinding-' + VERSION;
const FONTS = 'hb-fonts';
const PRECACHE = [
  "./",
  "./data/hb_nav.json",
  "./data/hb_scene.json",
  "./data/hb_shops.json",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/three/LICENSE",
  "./vendor/three/build/three.module.min.js",
  "./vendor/three/examples/jsm/controls/OrbitControls.js",
  "./vendor/three/examples/jsm/lines/Line2.js",
  "./vendor/three/examples/jsm/lines/LineGeometry.js",
  "./vendor/three/examples/jsm/lines/LineMaterial.js",
  "./vendor/three/examples/jsm/lines/LineSegments2.js",
  "./vendor/three/examples/jsm/lines/LineSegmentsGeometry.js",
  "./vendor/three/examples/jsm/renderers/CSS2DRenderer.js"
];
const FONT_HOSTS = ["https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hb-wayfinding-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // the page, data and libraries: from the phone first; a new version arrives with a new sw.js
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./index.html') : null);
      return hit || fetch(req);
    }));
  } else if (FONT_HOSTS.some((h) => req.url.startsWith(h))) {
    // web fonts: kept after the first online visit; without them the page uses the phone's own fonts
    e.respondWith(caches.open(FONTS).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }
      catch (err) { return new Response('', { status: 504 }); }
    }));
  }
});
