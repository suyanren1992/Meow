/* meow 生活 — service worker（v0.9.0）
   极简离线缓存：同站静态资源 cache-first，版本化缓存名。
   发新版时改 CACHE_NAME，activate 会清掉旧缓存，
   所以页脚 / 横幅的版本号不会被旧缓存卡住。
   五个页面和三张插画都在预缓存里，
   页面间导航不会被旧缓存卡住。 */

const CACHE_NAME = 'cat-planet-v0.9.0';
const PRECACHE = [
  '/',
  '/story.html',
  '/stories.html',
  '/cats.html',
  '/season.html',
  '/oneko.gif',
  '/illustrations/hero-cat-house.webp',
  '/illustrations/cat-mother-youhu.webp',
  '/illustrations/kittens-playing.webp',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // 只管同站 GET，其他一律放行。
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // 只缓存成功的同站响应。
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
