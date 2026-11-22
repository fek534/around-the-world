import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, runTransaction, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKM0_Av7zJJ8ReoSwhItCtv6xHYMGM94k",
  authDomain: "around-the-world-71b40.firebaseapp.com",
  projectId: "around-the-world-71b40",
  storageBucket: "around-the-world-71b40.firebasestorage.app",
  messagingSenderId: "245159497612",
  appId: "1:245159497612:web:24d1c5ddfeb7f2420050a9"
};
const db = getFirestore(initializeApp(firebaseConfig));

const YEAR = 2026;
const COUNTRIES = [
  { id: "korea",   flag: "🇰🇷", ar: "كوريا",   en: "Korea" },
  { id: "lebanon", flag: "🇱🇧", ar: "لبنان",   en: "Lebanon" },
  { id: "france",  flag: "🇫🇷", ar: "فرنسا",   en: "France" },
  { id: "turkey",  flag: "🇹🇷", ar: "تركيا",   en: "Türkiye" },
  { id: "spain",   flag: "🇪🇸", ar: "إسبانيا", en: "Spain" }
];

const T = {
  ar: {
    title: "جواز السفر الرقمي", tag: "حول العالم في يوم واحد", begin: "ابدأ الرحلة",
    regTitle: "سجّل بياناتك", name: "الاسم الكامل", year: "السنة الدراسية", major: "التخصص",
    phone: "رقم الموبايل", issue: "أصدر الباسبور", pNo: "رقم الباسبور", stamps: "الأختام",
    hint: "الختم يتفعّل من كشك كل دولة مع المنظم.",
    years: ["الأولى", "الثانية", "الثالثة", "الرابعة", "أخرى"],
    eName: "اكتب اسمك بالكامل.", eMajor: "اكتب تخصصك.", ePhone: "رقم الموبايل غير صحيح.",
    eNet: "تعذر الاتصال. تأكد من الإنترنت وجرّب تاني.", wait: "جاري الإصدار...",
    yr: "السنة"
  },
  en: {
    title: "Digital Passport", tag: "Around the World in One Day", begin: "Begin the journey",
    regTitle: "Enter your details", name: "Full name", year: "Year of study", major: "Major",
    phone: "Mobile number", issue: "Issue my passport", pNo: "Passport number", stamps: "Stamps",
    hint: "Each stamp is activated at the country booth by an organizer.",
    years: ["First", "Second", "Third", "Fourth", "Other"],
    eName: "Enter your full name.", eMajor: "Enter your major.", ePhone: "Mobile number is not valid.",
    eNet: "Could not connect. Check your internet and try again.", wait: "Issuing...",
    yr: "Year"
  }
};

const $ = (s) => document.querySelector(s);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
let lang = store.get("lang") || "ar";
let student = null;

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t[el.dataset.i]; });
  $("#langBtn").textContent = lang === "ar" ? "EN" : "عربي";
  const sel = $("#fYear"), keep = sel.value || "0";
  sel.innerHTML = t.years.map((y, i) => `<option value="${i}">${y}</option>`).join("");
  sel.value = keep;
  if (student) renderPassport();
}

function renderPassport() {
  const t = T[lang];
  $("#pId").textContent = student.id;
  $("#pName").textContent = student.name;
  $("#pSub").textContent = `${student.major} · ${t.yr} ${t.years[student.year]}`;
  const got = student.stamps || [];
  $("#pCount").textContent = `${got.length}/5`;
  $("#slots").innerHTML = COUNTRIES.map((c) =>
    `<li class="${got.includes(c.id) ? "done" : ""}"><span class="flag">${c.flag}</span><span class="nm">${c[lang]}</span></li>`
  ).join("");
  show("passport");
}

function validate() {
  const t = T[lang];
  const name = $("#fName").value.trim();
  const major = $("#fMajor").value.trim();
  const phone = $("#fPhone").value.replace(/[\s-]/g, "");
  if (name.length < 3) return { error: t.eName };
  if (!major) return { error: t.eMajor };
  if (!/^\+?\d{10,15}$/.test(phone)) return { error: t.ePhone };
  return { name, major, phone, year: Number($("#fYear").value) };
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = validate();
  const err = $("#err"), btn = $("#regBtn");
  if (v.error) { err.textContent = v.error; return; }
  err.textContent = "";
  btn.disabled = true; btn.textContent = T[lang].wait;
  try {
    const counter = doc(db, "meta", "counter");
    const id = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counter);
      const n = (snap.exists() ? snap.data().n : 0) + 1;
      const pid = `PASS-${YEAR}-${String(n).padStart(3, "0")}`;
      tx.set(counter, { n });
      tx.set(doc(db, "students", pid), { ...v, stamps: [], lang, createdAt: serverTimestamp() });
      return pid;
    });
    student = { id, name: v.name, major: v.major, year: v.year, stamps: [] };
    store.set("passportId", id);
    renderPassport();
  } catch (_) {
    err.textContent = T[lang].eNet;
  } finally {
    btn.disabled = false; btn.textContent = T[lang].issue;
  }
});

$("#beginBtn").addEventListener("click", () => show("register"));
$("#langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  store.set("lang", lang);
  applyLang();
});

async function restore() {
  const id = store.get("passportId");
  if (!id) return;
  try {
    const snap = await getDoc(doc(db, "students", id));
    if (snap.exists()) {
      const d = snap.data();
      student = { id, name: d.name, major: d.major, year: d.year, stamps: d.stamps || [] };
      renderPassport();
    }
  } catch (_) { /* stay on splash if offline */ }
}

applyLang();
restore();
