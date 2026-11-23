import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBKM0_Av7zJJ8ReoSwhItCtv6xHYMGM94k",
  authDomain: "around-the-world-71b40.firebaseapp.com",
  projectId: "around-the-world-71b40",
  storageBucket: "around-the-world-71b40.firebasestorage.app",
  messagingSenderId: "245159497612",
  appId: "1:245159497612:web:24d1c5ddfeb7f2420050a9"
});
export const db = getFirestore(app);
export const auth = getAuth(app);

export const COUNTRIES = [
  { id: "korea",   flag: "🇰🇷", ar: "كوريا",   en: "Korea" },
  { id: "italy",   flag: "🇮🇹", ar: "إيطاليا", en: "Italy" },
  { id: "france",  flag: "🇫🇷", ar: "فرنسا",   en: "France" },
  { id: "turkey",  flag: "🇹🇷", ar: "تركيا",   en: "Türkiye" },
  { id: "spain",   flag: "🇪🇸", ar: "إسبانيا", en: "Spain" },
  { id: "germany", flag: "🇩🇪", ar: "ألمانيا", en: "Germany" }
];

export const PIN_HASH = { korea: "1746543e87553b36a617fe9532b5ef425288f06459efec27c3379e7e73bf324a", italy: "12d60fa12cddcae3aa273ab61c422bf1f1cc75ff70ca53aa8873067d7b83a1d2", france: "fab1d73fc9741cdcad5c780210bd4312313254866c60a01599e3596ea70bf95c", turkey: "df4d536166bca198c9f22faa104a6d59912b461ed82acf307cb7b7fdad4b9391", spain: "aa8e78f9c1199da57d08b181641b1ae4cf689f50c94e440147a4cb47ded4339f", germany: "4f93b25f5909fd7552151fda02f1023c7710aef35b755b07fcde53072d7d9e5d" }
export const ADMIN_EMAIL = "admin@around-the-world.app";
export const isAdmin = (u) => !!u && u.email === ADMIN_EMAIL;

export const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
  .map((b) => b.toString(16).padStart(2, "0")).join("");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let ac;
export function audioCtx() {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === "suspended") ac.resume();
  return ac;
}
export function sfx(kind) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    const t0 = ac.currentTime;
    const tone = (f, s, d, type = "sine", v = 0.3, f2) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0 + s);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + s + d);
      g.gain.setValueAtTime(v, t0 + s); g.gain.exponentialRampToValueAtTime(0.001, t0 + s + d);
      o.connect(g).connect(ac.destination); o.start(t0 + s); o.stop(t0 + s + d);
    };
    if (kind === "stamp") { tone(180, 0, 0.18, "square", 0.3, 45); tone(90, 0, 0.28, "sine", 0.6, 40); }
    else if (kind === "chime") { [659, 523, 784].forEach((f, i) => tone(f, i * 0.28, 1, "sine", 0.3)); }
    else if (kind === "tick") { tone(900, 0, 0.05, "square", 0.06); }
    else if (kind === "bad") { tone(160, 0, 0.25, "sawtooth", 0.18); }
  } catch (_) {}
}

const authReady = new Promise((r) => { const un = onAuthStateChanged(auth, (u) => { un(); r(u); }); });

export async function logout() {
  try { await signOut(auth); } catch (_) {}
  try { localStorage.removeItem("passportId"); } catch (_) {}
  location.href = location.pathname.replace(/[^/]*$/, "");
}

export async function gate() {
  if (isAdmin(await authReady)) return;
  await new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "modal";
    ov.innerHTML = `<form class="sheet"><h2>Organizer · المنظم</h2>
      <input class="pin" type="password" inputmode="numeric" maxlength="16" autocomplete="off" aria-label="code">
      <p class="err" role="alert"></p><button class="gold" type="submit">Log in · دخول</button></form>`;
    document.body.append(ov);
    const inp = ov.querySelector("input"), err = ov.querySelector(".err");
    ov.querySelector("form").onsubmit = async (e) => {
      e.preventDefault(); err.textContent = "";
      try { await signInWithEmailAndPassword(auth, ADMIN_EMAIL, inp.value.trim()); ov.remove(); resolve(); }
      catch (x) { inp.value = ""; err.textContent = `Wrong code · الرقم غلط (${x.code || "error"})`; }
    };
    inp.focus();
  });
}

/* ---------- lucky wheel ---------- */
export const PRIZES = [
  { id: "card",     ar: "كرت شحن",       en: "Recharge card",  w: 19 },
  { id: "vip",      ar: "VIP",           en: "VIP",            w: 5 },
  { id: "hohos",    ar: "كيكة هوهوز",    en: "Hohos cake",     w: 19 },
  { id: "choco",    ar: "ميكس شكولاتة",  en: "Chocolate mix",  w: 19 },
  { id: "gameover", ar: "Game Over",     en: "Game Over",      w: 19 },
  { id: "twist",    ar: "Twist",         en: "Twist",          w: 19 }
];
const rnd = () => crypto.getRandomValues(new Uint32Array(1))[0];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function pickWeighted(list) {
  let r = (rnd() / 2 ** 32) * list.reduce((a, x) => a + x.w, 0);
  for (const x of list) { if (x.w > 0 && r < x.w) return x; r -= x.w; }
  return list.find((x) => x.w > 0);
}
export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd() % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function drawWheel(cv, labels, showText = true) {
  const n = labels.length, S = (cv.width = cv.height = 320), c = S / 2, a = (2 * Math.PI) / n, x = cv.getContext("2d");
  const cols = ["#c9a24b", "#12285a", "#ecd28b", "#1d3a7a"];
  x.clearRect(0, 0, S, S);
  labels.forEach((t, i) => {
    x.beginPath(); x.moveTo(c, c);
    x.arc(c, c, c - 4, -Math.PI / 2 + i * a, -Math.PI / 2 + (i + 1) * a); x.closePath();
    x.fillStyle = cols[i % 4]; x.fill(); x.strokeStyle = "#0a1a3d"; x.lineWidth = 2; x.stroke();
    if (showText) {
      x.save(); x.translate(c, c); x.rotate(-Math.PI / 2 + (i + 0.5) * a);
      x.textAlign = "right"; x.fillStyle = i % 4 % 2 ? "#f4ecd6" : "#0a1a3d";
      x.font = "700 15px Cairo, sans-serif"; x.fillText(t, c - 18, 5); x.restore();
    }
  });
  cv.style.transition = "none"; cv.style.transform = "rotate(0deg)"; cv.dataset.rot = "0";
}
export async function spinTo(cv, index, n, ms = 5200) {
  const seg = 360 / n, prev = +cv.dataset.rot || 0;
  const need = ((((-(index + 0.5) * seg + (Math.random() - 0.5) * seg * 0.5) - prev) % 360) + 360) % 360;
  const R = prev + 360 * 6 + need;
  void cv.offsetWidth;
  cv.style.transition = `transform ${ms}ms cubic-bezier(.12,.7,.1,1)`;
  cv.style.transform = `rotate(${R}deg)`; cv.dataset.rot = String(R);
  await sleep(ms + 150);
}

/* ---------- confetti + photo shrink ---------- */
export function confetti(n = 130) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60";
  c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext("2d"), cols = ["#ecd28b", "#c9a24b", "#f4ecd6", "#7aa2ff", "#ff8a8a"];
  const p = Array.from({ length: n }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, r: Math.random() * 6, c: cols[(Math.random() * 5) | 0] }));
  let t = 0;
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    p.forEach((q) => { q.x += q.vx; q.y += q.vy; q.r += 0.15; x.save(); x.translate(q.x, q.y); x.rotate(q.r); x.fillStyle = q.c; x.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); x.restore(); });
    if (++t < 180) requestAnimationFrame(f); else c.remove();
  })();
}
export async function shrink(file, max = 900) {
  const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
  let d = cv.toDataURL("image/jpeg", 0.72);
  if (d.length > 420000) d = cv.toDataURL("image/jpeg", 0.5);
  return d;
}

/* ---------- calm generated tune (no audio file) ---------- */
let master, tuneTimer;
export function tune(on) {
  try {
    const a = audioCtx();
    if (!master) {
      master = a.createGain(); master.gain.value = 0;
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700;
      const d = a.createDelay(); d.delayTime.value = 0.45;
      const fb = a.createGain(); fb.gain.value = 0.4;
      master.connect(lp); lp.connect(a.destination); lp.connect(d); d.connect(fb); fb.connect(d); d.connect(a.destination);
    }
    const note = (f, t, dur, v) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.1);
    };
    const scale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33], pad = [130.81, 196, 261.63];
    master.gain.cancelScheduledValues(a.currentTime);
    if (on) {
      master.gain.linearRampToValueAtTime(1, a.currentTime + 2);
      if (!tuneTimer) {
        let i = 0;
        const tick = () => {
          const t = a.currentTime + 0.05;
          note(scale[(Math.random() * scale.length) | 0], t, 2.6, 0.05);
          if (i++ % 8 === 0) pad.forEach((f) => note(f, t, 8, 0.022));
        };
        tick(); tuneTimer = setInterval(tick, 1000);
      }
    } else {
      master.gain.linearRampToValueAtTime(0, a.currentTime + 0.6);
      clearInterval(tuneTimer); tuneTimer = null;
    }
  } catch (_) {}
}
