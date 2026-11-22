import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const db = getFirestore(initializeApp({
  apiKey: "AIzaSyBKM0_Av7zJJ8ReoSwhItCtv6xHYMGM94k",
  authDomain: "around-the-world-71b40.firebaseapp.com",
  projectId: "around-the-world-71b40",
  storageBucket: "around-the-world-71b40.firebasestorage.app",
  messagingSenderId: "245159497612",
  appId: "1:245159497612:web:24d1c5ddfeb7f2420050a9"
}));

export const COUNTRIES = [
  { id: "korea",   flag: "🇰🇷", ar: "كوريا",   en: "Korea" },
  { id: "lebanon", flag: "🇱🇧", ar: "لبنان",   en: "Lebanon" },
  { id: "france",  flag: "🇫🇷", ar: "فرنسا",   en: "France" },
  { id: "turkey",  flag: "🇹🇷", ar: "تركيا",   en: "Türkiye" },
  { id: "spain",   flag: "🇪🇸", ar: "إسبانيا", en: "Spain" }
];

export const PIN_HASH = { korea: "1746543e87553b36a617fe9532b5ef425288f06459efec27c3379e7e73bf324a", lebanon: "7a1f84113416c825d90a5dbaae6604d5190fbd70941f6a85bfd9dda237146be1", france: "fab1d73fc9741cdcad5c780210bd4312313254866c60a01599e3596ea70bf95c", turkey: "df4d536166bca198c9f22faa104a6d59912b461ed82acf307cb7b7fdad4b9391", spain: "aa8e78f9c1199da57d08b181641b1ae4cf689f50c94e440147a4cb47ded4339f" };
const ADMIN_HASH = "67c66459af786bd2ac9932f6a85e8813c1c056d41f05b43c9a4dbfaa775aff20";

export const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
  .map((b) => b.toString(16).padStart(2, "0")).join("");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let ac;
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

export async function gate() {
  try { if (sessionStorage.getItem("adm") === "1") return; } catch (_) {}
  for (;;) {
    const c = prompt("Organizer code / كود المنظم");
    if (c === null) { document.body.innerHTML = ""; throw new Error("cancelled"); }
    if ((await sha("admin:" + c.trim())) === ADMIN_HASH) { try { sessionStorage.setItem("adm", "1"); } catch (_) {} return; }
  }
}
