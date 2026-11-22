import { db, COUNTRIES, PIN_HASH, sha, sfx } from "./common.js";
import { doc, getDoc, updateDoc, writeBatch, arrayUnion, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const YEAR = 2026;
const T = {
  ar: {
    title: "جواز السفر الرقمي", tag: "حول العالم في يوم واحد", begin: "ابدأ الرحلة",
    regTitle: "سجّل بياناتك", name: "الاسم الكامل", year: "السنة الدراسية", major: "التخصص",
    phone: "رقم الموبايل", issue: "أصدر الباسبور", pNo: "رقم الباسبور", stamps: "الأختام",
    ok: "تأكيد", cancel: "إلغاء",
    years: ["الأولى", "الثانية", "الثالثة", "الرابعة", "أخرى"], yr: "السنة",
    eName: "اكتب اسمك بالكامل.", eMajor: "اكتب تخصصك.", ePhone: "رقم الموبايل غير صحيح.",
    eNet: "تعذر الاتصال. تأكد من الإنترنت وجرّب تاني.", wait: "جاري الإصدار...",
    tapHint: "اضغط على الدولة وأدخل رمز الختم من المنظم.",
    ready: "جمعت الأختام الخمسة! ادخل السحب الآن.", inDraw: "أنت داخل السحب النهائي. حظ سعيد!",
    draw: "ادخل السحب النهائي", pinFor: "رمز", badPin: "الرمز غير صحيح.",
    locked: "محاولات كتير. استنى 30 ثانية."
  },
  en: {
    title: "Digital Passport", tag: "Around the World in One Day", begin: "Begin the journey",
    regTitle: "Enter your details", name: "Full name", year: "Year of study", major: "Major",
    phone: "Mobile number", issue: "Issue my passport", pNo: "Passport number", stamps: "Stamps",
    ok: "Confirm", cancel: "Cancel",
    years: ["First", "Second", "Third", "Fourth", "Other"], yr: "Year",
    eName: "Enter your full name.", eMajor: "Enter your major.", ePhone: "Mobile number is not valid.",
    eNet: "Could not connect. Check your internet and try again.", wait: "Issuing...",
    tapHint: "Tap a country and enter the stamp code from the organizer.",
    ready: "All 5 stamps collected! Enter the draw now.", inDraw: "You are in the final draw. Good luck!",
    draw: "Enter the final draw", pinFor: "Code for", badPin: "Wrong code.",
    locked: "Too many tries. Wait 30 seconds."
  }
};

const $ = (s) => document.querySelector(s);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
let lang = store.get("lang") || "ar";
let student = null, pinFor = null, fails = 0, lockUntil = 0, lastPop = null;

const show = (id) => document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));

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
  const t = T[lang], got = student.stamps || [];
  $("#pId").textContent = student.id;
  $("#pName").textContent = student.name;
  $("#pSub").textContent = `${student.major} · ${t.yr} ${t.years[student.year] ?? ""}`;
  $("#pCount").textContent = `${got.length}/5`;
  $("#slots").innerHTML = COUNTRIES.map((c) =>
    `<li data-id="${c.id}" class="${got.includes(c.id) ? "done" : ""}${c.id === lastPop ? " pop" : ""}"><span class="flag">${c.flag}</span><span class="nm">${c[lang]}</span></li>`
  ).join("");
  lastPop = null;
  $("#hint").textContent = student.entered ? t.inDraw : got.length < 5 ? t.tapHint : t.ready;
  const btn = $("#drawBtn");
  btn.textContent = t.draw;
  btn.hidden = student.entered || got.length < 5;
  show("passport");
}

function validate() {
  const t = T[lang];
  const name = $("#fName").value.trim(), major = $("#fMajor").value.trim();
  const phone = $("#fPhone").value.replace(/[\s-]/g, "");
  if (name.length < 3) return { error: t.eName };
  if (!major) return { error: t.eMajor };
  if (!/^\+?\d{10,15}$/.test(phone)) return { error: t.ePhone };
  return { name, major, phone, year: Number($("#fYear").value) };
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = validate(), err = $("#err"), btn = $("#regBtn");
  if (v.error) { err.textContent = v.error; return; }
  err.textContent = ""; btn.disabled = true; btn.textContent = T[lang].wait;
  try {
    let id, tries = 0;
    for (;;) {
      id = `PASS-${YEAR}-${1000 + Math.floor(Math.random() * 9000)}`;
      try {
        const b = writeBatch(db);
        b.set(doc(db, "students", id), { name: v.name, major: v.major, year: v.year, stamps: [], entered: false, lang, createdAt: serverTimestamp() });
        b.set(doc(db, "contacts", id), { id, phone: v.phone });
        await b.commit();
        break;
      } catch (e2) { if (++tries >= 8) throw e2; }
    }
    student = { id, name: v.name, major: v.major, year: v.year, stamps: [], entered: false };
    store.set("passportId", id);
    renderPassport();
  } catch (e3) {
    console.error(e3);
    err.textContent = `${T[lang].eNet} (${e3.code || e3.message})`;
  } finally { btn.disabled = false; btn.textContent = T[lang].issue; }
});

/* stamps */
$("#slots").addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li || !student || li.classList.contains("done") || student.entered) return;
  pinFor = li.dataset.id;
  const c = COUNTRIES.find((x) => x.id === pinFor);
  $("#pinTitle").textContent = `${c.flag} ${T[lang].pinFor} ${c[lang]}`;
  $("#pinIn").value = ""; $("#pinErr").textContent = "";
  $("#modal").hidden = false; $("#pinIn").focus();
});
$("#pinCancel").addEventListener("click", () => { $("#modal").hidden = true; });

$("#pinForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#pinErr"), t = T[lang], now = Date.now();
  if (now < lockUntil) { err.textContent = t.locked; return; }
  const pin = $("#pinIn").value.trim();
  if ((await sha(`${pinFor}:${pin}`)) !== PIN_HASH[pinFor]) {
    sfx("bad");
    if (++fails >= 5) { lockUntil = now + 30000; fails = 0; }
    err.textContent = t.badPin;
    const f = $("#pinForm"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
    return;
  }
  try {
    await updateDoc(doc(db, "students", student.id), { stamps: arrayUnion(pinFor) });
    if (!student.stamps.includes(pinFor)) student.stamps.push(pinFor);
    fails = 0; lastPop = pinFor; $("#modal").hidden = true;
    sfx("stamp"); navigator.vibrate?.(80);
    renderPassport();
  } catch (e2) { console.error(e2); err.textContent = `${t.eNet} (${e2.code || e2.message})`; }
});

/* final draw entry */
$("#drawBtn").addEventListener("click", async () => {
  const btn = $("#drawBtn"); btn.disabled = true;
  try {
    await updateDoc(doc(db, "students", student.id), { entered: true, enteredAt: serverTimestamp() });
    student.entered = true; sfx("chime"); navigator.vibrate?.([80, 60, 80]);
    renderPassport();
  } catch (e) { console.error(e); $("#hint").textContent = `${T[lang].eNet} (${e.code || e.message})`; }
  finally { btn.disabled = false; }
});

$("#beginBtn").addEventListener("click", () => { sfx("tick"); show("register"); });
$("#langBtn").addEventListener("click", () => { lang = lang === "ar" ? "en" : "ar"; store.set("lang", lang); applyLang(); });

async function restore() {
  const id = store.get("passportId");
  if (!id) return;
  try {
    const snap = await getDoc(doc(db, "students", id));
    if (snap.exists()) {
      const d = snap.data();
      student = { id, name: d.name, major: d.major, year: d.year, stamps: d.stamps || [], entered: !!d.entered };
      renderPassport();
    }
  } catch (_) {}
}

applyLang();
restore();
