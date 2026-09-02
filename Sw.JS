// Service Worker פשוט ל-Live Stage Pro
// תפקידו: לאפשר "התקנה כאפליקציה" (PWA) ולשמור במטמון את קבצי האפליקציה עצמה
// (index.html, אייקונים, מניפסט, וקובץ הפתיח להופעה) כדי שהאפליקציה תיפתח גם בלי רשת.
// אסטרטגיה: "רשת קודם" (network-first) - כל עוד יש חיבור לרשת, תמיד נטען את הגרסה החדשה ביותר
// מהשרת (לא תקוע על גרסה ישנה מהמטמון); רק כשאין רשת בכלל נופלים חזרה לעותק השמור מהפעם האחרונה.
// שים לב: בקשות ה-API של גוגל (קריאה/שמירה של השירים) לא מטופלות כאן בכלל -
// מצב האופליין של הנתונים עצמו מנוהל ב-localStorage בתוך index.html.
const CACHE_NAME = 'livestage-shell-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  encodeURI('./פתיח למופע סופי.wav')
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // לא נוגעים בבקשות POST (שמירה/עריכה מול Google Apps Script)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // לא נוגעים בבקשות חוץ (API, CDN וכו')
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req)) // אין רשת - נופלים לעותק השמור האחרון
  );
});
