// 更新時はこの日付を必ず変更すること（なに飲む？と同じ運用ルール）
const CACHE = "planner-2026-09-02d";

// このSWが面倒を見るファイル。同じリポジトリにある「なに飲む？」には一切触らない
const ASSETS = [
  "./planner.html",
  "./planner.webmanifest",
  "./planner-icon-192.png",
  "./planner-icon-512.png",
  "./planner-icon-512-maskable.png"
];

// 自分の管轄かどうかの判定（planner から始まるファイルのみ）
function isMine(url){
  const u = new URL(url, self.location.href);
  if(u.origin !== self.location.origin) return false;
  const name = u.pathname.split("/").pop();
  return name.startsWith("planner");
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      // planner- で始まる自分の古いキャッシュだけを削除する
      keys.filter(k => k.startsWith("planner-") && k !== CACHE)
          .map(k => caches.delete(k))
    ))
  );
});

self.addEventListener("fetch", (e) => {
  if(e.request.method !== "GET") return;
  // 自分の管轄外（＝なに飲む？のファイル等）は一切横取りしない
  if(!isMine(e.request.url)) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if(hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
    })
  );
});
