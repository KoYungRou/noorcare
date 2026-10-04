const CACHE_NAME =
  "noorcare-app-v11";

const APP_SHELL = [
  "/",
  "/index.html",
  "/css/app.css",
  "/js/app.js",
  "/js/local-ai.js",
  "/js/extraction.js",
  "/js/extractor-ai.js",
  "/js/storage.js",
  "/manifest.json",
  "/icons/favicon.ico",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/vendor/onnx/ort-wasm-simd-threaded.jsep.wasm"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(APP_SHELL);
        })
    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys => {

          return Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )

          );

        })

    );

    self.clients.claim();

  }
);


self.addEventListener(
  "fetch",
  event => {

    // 只處理 GET
    if (
      event.request.method !== "GET"
    ) {
      return;
    }


    event.respondWith(

      caches
        .match(event.request)
        .then(async cachedResponse => {

          // 已經有 cache → 直接使用
          if (cachedResponse) {
            return cachedResponse;
          }


          // 沒有 cache → 從本機 server / network 取得
          const networkResponse =
            await fetch(event.request);


          // 只 cache 成功的 same-origin response
          if (
            networkResponse.ok &&
            event.request.url.startsWith(
              self.location.origin
            )
          ) {

            const cache =
              await caches.open(
                CACHE_NAME
              );


            await cache.put(
              event.request,
              networkResponse.clone()
            );

          }


          return networkResponse;

        })

    );

  }
);