import { db, auth, isAdmin, logout, COUNTRIES, PIN_HASH, PRIZES, drawWheel, spinTo, sleep, sha, sfx, confetti, esc, shrink } from "./common.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, setDoc, updateDoc, writeBatch, arrayUnion, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const YEAR = 2026;
const TOTAL = COUNTRIES.length;
const T = {
  ar: {
    title: "جواز السفر الرقمي", tag: "حول العالم في يوم واحد", begin: "ابدأ الرحلة",
    regTitle: "سجّل بياناتك", name: "الاسم الكامل", year: "السنة الدراسية", major: "التخصص",
    phone: "رقم الموبايل", issue: "أصدر الباسبور", pNo: "رقم الباسبور", stamps: "الأختام",
    ok: "تأكيد", cancel: "إلغاء", years: ["الأولى", "الثانية", "الثالثة", "الرابعة", "أخرى"], yr: "السنة",
    eName: "اكتب اسمك بالكامل.", eMajor: "اكتب تخصصك.", ePhone: "رقم الموبايل غير صحيح.",
    eNet: "تعذر الاتصال. تأكد من الإنترنت وجرّب تاني.", wait: "جاري الإصدار...",
    tapHint: "اضغط على الدولة وأدخل رمز الختم من المنظم.",
    ready: "جمعت كل الأختام! ادخل السحب الآن.", inDraw: "أنت داخل السحب النهائي. حظ سعيد!",
    draw: "ادخل السحب النهائي", pinFor: "رمز", badPin: "الرمز غير صحيح.", locked: "محاولات كتير. استنى 30 ثانية.",
    logout: "تسجيل الخروج", have: "عندي باسبور", staff: "دخول المنظمين", loginTitle: "ادخل برقم موبايلك",
    login: "دخول", back: "رجوع", eLogin: "الرقم ده مش مسجل عندنا.", exists: "الرقم ده مسجل قبل كده، فتحنالك باسبورك.",
    spin: "لف العجلة", selected: "تم اختيارك! 🎉 لف عجلة الحظ", wheelBtn: "🎡 لف عجلة الحظ",
    drawDone: "انتهى السحب. شكراً لمشاركتك!", wTitle: "عجلة الحظ", vipTitle: "عجلة الـ VIP",
    vipMsg: "كسبت VIP! لفة إضافية ✨", won: "كسبت:", sorry: "سوري، حظ أوفر المرة الجاية",
    thanks: "مبروك! 🎉 حضرت الـ event معانا، شكراً لوجودك ونورتنا.",
    rateTitle: "قيّم الـ event", ratePh: "اكتب رأيك (اختياري)", rateSend: "ارسل التقييم",
    rated: "شكراً على تقييمك! ⭐", ePick: "اختار عدد النجوم.",
    special: "يا {n} 💛 العجلة مختارتكش المرة دي، بس إنت كسبت رحلة حوالين العالم في يوم واحد! حضورك وحماسك هما الجايزة الحقيقية. نشوفك في الإيفنت الجاي 🌍✨",
    memTitle: "📸 ذكرياتي", memHint: "الصور دي يشوفها إنت والمنظمين بس.", memCam: "📷 التقط صورة", memPick: "🖼 اختر من المعرض",
    memShared: "من المنظمين", memFull: "وصلت للحد الأقصى (12 صورة).", memWait: "جاري الحفظ..."
  },
  en: {
    title: "Digital Passport", tag: "Around the World in One Day", begin: "Begin the journey",
    regTitle: "Enter your details", name: "Full name", year: "Year of study", major: "Major",
    phone: "Mobile number", issue: "Issue my passport", pNo: "Passport number", stamps: "Stamps",
    ok: "Confirm", cancel: "Cancel", years: ["First", "Second", "Third", "Fourth", "Other"], yr: "Year",
    eName: "Enter your full name.", eMajor: "Enter your major.", ePhone: "Mobile number is not valid.",
    eNet: "Could not connect. Check your internet and try again.", wait: "Issuing...",
    tapHint: "Tap a country and enter the stamp code from the organizer.",
    ready: "All stamps collected! Enter the draw now.", inDraw: "You are in the final draw. Good luck!",
    draw: "Enter the final draw", pinFor: "Code for", badPin: "Wrong code.", locked: "Too many tries. Wait 30 seconds.",
    logout: "Log out", have: "I have a passport", staff: "Organizers", loginTitle: "Log in with your mobile",
    login: "Log in", back: "Back", eLogin: "This number is not registered.", exists: "This number is already registered, so we opened your passport.",
    spin: "Spin the wheel", selected: "You were selected! 🎉 Spin the lucky wheel", wheelBtn: "🎡 Spin the lucky wheel",
    drawDone: "The draw is complete. Thanks for joining!", wTitle: "Lucky wheel", vipTitle: "VIP wheel",
    vipMsg: "You got VIP! One more spin ✨", won: "You won:", sorry: "Sorry, better luck next time",
    thanks: "Congratulations! 🎉 You attended the event. Thank you for joining us.",
    rateTitle: "Rate the event", ratePh: "Write your feedback (optional)", rateSend: "Send rating",
    rated: "Thanks for your rating! ⭐", ePick: "Pick a star rating.",
    special: "Dear {n} 💛 the wheel did not pick you this time, but you won a trip around the world in one day! Your energy was the real prize. See you at the next event 🌍✨",
    memTitle: "📸 My memories", memHint: "Only you and the organizers can see these photos.", memCam: "📷 Take a photo", memPick: "🖼 Choose from gallery",
    memShared: "From the organizers", memFull: "You reached the limit (12 photos).", memWait: "Saving..."
  }
};

/* animated landmarks (line art) */
const arches = [88, 70, 52].flatMap((y) => [16, 30, 44, 58, 72].map((x) => `M${x} ${y}v-9a5 5 0 0 1 10 0v9`));
const LM = {
  korea: ["M8 44Q18 44 30 36H70Q82 44 92 44", "M36 36Q50 22 64 36", "M18 64Q26 64 34 56H66Q74 64 82 64", "M30 64V92M50 64V92M70 64V92", "M14 92H86"],
  italy: ["M8 96V50Q8 30 50 30Q92 30 92 50V96Z", ...arches, "M8 96H92"],
  france: ["M50 6V22", "M46 22H54L58 44H42Z", "M42 44L33 98M58 44L67 98", "M40 62H60M36 80H64M46 32H54", "M38 98Q50 74 62 98"],
  turkey: ["M28 72Q50 22 72 72", "M24 72H76V96H24Z", "M12 96V44L15 34L18 44V96", "M82 96V44L85 34L88 44V96", "M36 72V96M64 72V96"],
  spain: ["M16 98V50L20 22L24 50V98", "M34 98V40L38 10L42 40V98", "M46 98V56L50 30L54 56V98", "M58 98V40L62 10L66 40V98", "M76 98V50L80 22L84 50V98", "M10 98H90"],
  germany: ["M8 36H92", "M8 46H92", "M30 36V26H70V36", "M40 26Q50 12 60 26", "M50 26V8M46 12L50 6L54 12", "M14 46V92M28 46V92M42 46V92M58 46V92M72 46V92M86 46V92", "M8 92H92", "M8 98H92"]
};
const ART = { spain: "art-spain.png", france: "art-france.png", korea: "art-korea.png", turkey: "art-turkey.png" };
const svgOf = (id) => `<svg viewBox="0 0 100 104">${LM[id].map((d) => `<path pathLength="1" d="${d}"/>`).join("")}</svg>`;
$lm();
function $lm() {
  document.querySelector("#lmBox").innerHTML = COUNTRIES.map((c, i) =>
    `<figure class="lm" style="--d:${i * 5}s">${ART[c.id] ? `<div class="lmimg" style="--art:url(${ART[c.id]})"></div>` : svgOf(c.id)}<figcaption data-c="${c.id}"></figcaption></figure>`
  ).join("");
}

const $ = (s) => document.querySelector(s);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
const normPhone = (p) => { let d = String(p).replace(/\D/g, ""); if (d.startsWith("20") && d.length === 12) d = "0" + d.slice(2); return d; };
let lang = store.get("lang") || "ar";
let student = null, pinFor = null, fails = 0, lockUntil = 0, lastPop = null;
let wheelDoc = null, drawDone = false, unsubs = [], spinning = false;

const show = (id) => document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));

function finalLabel(w) {
  return `${T[lang].won} ${PRIZES.find((p) => p.id === w.main)[lang]}`;
}

function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t[el.dataset.i]; });
  document.querySelectorAll("[data-ph]").forEach((el) => { el.placeholder = t[el.dataset.ph]; });
  document.querySelectorAll("#lmBox figcaption").forEach((el) => {
    const c = COUNTRIES.find((x) => x.id === el.dataset.c); el.textContent = `${c.flag} ${c[lang]}`;
  });
  $("#langBtn").textContent = lang === "ar" ? "EN" : "عربي";
  const sel = $("#fYear"), keep = sel.value || "0";
  sel.innerHTML = t.years.map((y, i) => `<option value="${i}">${y}</option>`).join("");
  sel.value = keep;
  if (student) renderPassport();
}

let slotSig = "";
function renderPassport() {
  const t = T[lang], got = student.stamps || [], w = wheelDoc;
  $("#pId").textContent = student.id;
  $("#pName").textContent = student.name;
  $("#pSub").textContent = `${student.major} · ${t.yr} ${t.years[student.year] ?? ""}`;
  $("#pCount").textContent = `${got.length}/${TOTAL}`;
  const sig = [got.join(), lang, lastPop].join("|");
  if (sig !== slotSig) {
    slotSig = sig;
    $("#slots").innerHTML = COUNTRIES.map((c, i) =>
      `<li data-id="${c.id}" style="--art:${ART[c.id] ? `url(${ART[c.id]})` : "none"};animation-delay:${i * 0.09}s" class="${got.includes(c.id) ? "done" : ""}${c.id === lastPop ? " pop" : ""}"><div class="art">${ART[c.id] ? "" : svgOf(c.id)}</div><div class="meta"><span class="flag">${c.flag}</span><span class="nm">${c[lang]}</span></div></li>`
    ).join("");
  }
  lastPop = null;
  const finished = w ? w.spun : drawDone;
  $("#hint").textContent = w ? (w.spun ? "" : t.selected)
    : drawDone ? "" : student.entered ? t.inDraw : got.length < TOTAL ? t.tapHint : t.ready;
  $("#drawBtn").textContent = t.draw;
  $("#drawBtn").hidden = student.entered || drawDone || got.length < TOTAL;
  $("#wheelBtn").textContent = t.wheelBtn;
  $("#wheelBtn").hidden = !(w && !w.spun);
  $("#prize").hidden = !(w && w.spun);
  if (w && w.spun) $("#prize").textContent = finalLabel(w);
  const lost = drawDone && !w;
  $("#special").hidden = !lost;
  if (lost) {
    $("#spText").textContent = t.special.replace("{n}", student.name.split(" ")[0]);
    if (!store.get(`sp:${student.id}`)) { store.set(`sp:${student.id}`, "1"); confetti(); sfx("chime"); }
  }
  const canRate = finished && !store.get(`rated:${student.id}`);
  $("#rate").hidden = !canRate;
  $("#rated").hidden = !(finished && !canRate);
  $("#mem").hidden = !store.get("ak");
  if (!$("#wheelScreen").classList.contains("active")) show("passport");
  refreshOut();
}

let watching = null;
function watch() {
  if (!student || watching === student.id) return;
  watching = student.id; unsubs.forEach((u) => u()); unsubs = [];
  unsubs.push(onSnapshot(doc(db, "wheel", student.id), (s) => { wheelDoc = s.exists() ? s.data() : null; renderPassport(); }, () => {}));
  unsubs.push(onSnapshot(doc(db, "meta", "draw"), (s) => { drawDone = s.exists(); renderPassport(); }, () => {}));
  unsubs.push(albumSnap("ALL", "all"));
  if (store.get("ak")) unsubs.push(albumSnap(store.get("ak"), "mine"));
}

async function loadStudent(id) {
  const snap = await getDoc(doc(db, "students", id));
  if (!snap.exists()) return false;
  const d = snap.data();
  student = { id, name: d.name, major: d.major, year: d.year, stamps: d.stamps || [], entered: !!d.entered };
  store.set("passportId", id);
  renderPassport(); watch();
  return true;
}

function validate() {
  const t = T[lang];
  const name = $("#fName").value.trim(), major = $("#fMajor").value.trim(), phone = normPhone($("#fPhone").value);
  if (name.length < 3) return { error: t.eName };
  if (!major) return { error: t.eMajor };
  if (!/^\d{10,15}$/.test(phone)) return { error: t.ePhone };
  return { name, major, phone, year: Number($("#fYear").value) };
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = validate(), err = $("#err"), btn = $("#regBtn");
  if (v.error) { err.textContent = v.error; return; }
  err.textContent = ""; btn.disabled = true; btn.textContent = T[lang].wait;
  try {
    const ph = await sha(v.phone);
    store.set("ak", await sha("album:" + v.phone));
    const ex = await getDoc(doc(db, "phones", ph));
    if (ex.exists() && (await loadStudent(ex.data().id))) return;
    let id, tries = 0;
    for (;;) {
      id = `PASS-${YEAR}-${1000 + Math.floor(Math.random() * 9000)}`;
      try {
        const b = writeBatch(db);
        b.set(doc(db, "students", id), { name: v.name, major: v.major, year: v.year, stamps: [], entered: false, lang, ph, createdAt: serverTimestamp() });
        b.set(doc(db, "contacts", id), { id, phone: v.phone });
        b.set(doc(db, "phones", ph), { id });
        await b.commit();
        break;
      } catch (e2) { if (++tries >= 8) throw e2; }
    }
    student = { id, name: v.name, major: v.major, year: v.year, stamps: [], entered: false };
    store.set("passportId", id);
    renderPassport(); watch();
  } catch (e3) {
    console.error(e3);
    err.textContent = `${T[lang].eNet} (${e3.code || e3.message})`;
  } finally { btn.disabled = false; btn.textContent = T[lang].issue; }
});

/* login with mobile number only */
$("#haveBtn").addEventListener("click", () => { $("#lErr").textContent = ""; show("login"); });
$("#lBack").addEventListener("click", () => show("splash"));
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#lErr"), phone = normPhone($("#lPhone").value);
  try {
    const p = await getDoc(doc(db, "phones", await sha(phone)));
    if (p.exists()) store.set("ak", await sha("album:" + phone));
    if (!p.exists() || !(await loadStudent(p.data().id))) err.textContent = T[lang].eLogin;
  } catch (e2) { err.textContent = `${T[lang].eNet} (${e2.code || e2.message})`; }
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
  if ((await sha(`${pinFor}:${$("#pinIn").value.trim()}`)) !== PIN_HASH[pinFor]) {
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

/* enter the final draw */
$("#drawBtn").addEventListener("click", async () => {
  const btn = $("#drawBtn"); btn.disabled = true;
  try {
    await updateDoc(doc(db, "students", student.id), { entered: true, enteredAt: serverTimestamp() });
    student.entered = true; sfx("chime"); confetti(); navigator.vibrate?.([80, 60, 80]);
    renderPassport(); watch();
  } catch (e) { console.error(e); $("#hint").textContent = `${T[lang].eNet} (${e.code || e.message})`; }
  finally { btn.disabled = false; }
});

/* lucky wheel (result is set by the organizer; the wheel only reveals it) */
$("#wheelBtn").addEventListener("click", () => {
  drawWheel($("#wheel"), PRIZES.map((p) => p[lang]));
  $("#wTitle").textContent = T[lang].wTitle; $("#wRes").textContent = "";
  $("#spinBtn").hidden = false; $("#spinBtn").disabled = false;
  show("wheelScreen");
});
$("#wBack").addEventListener("click", () => { if (!spinning) show("passport"); });
$("#spinBtn").addEventListener("click", async () => {
  if (spinning || !wheelDoc || wheelDoc.spun) return;
  spinning = true; $("#spinBtn").disabled = true;
  const cv = $("#wheel"), t = T[lang], w = { ...wheelDoc };
  await spinTo(cv, PRIZES.findIndex((p) => p.id === w.main), PRIZES.length);
  sfx("stamp");
  $("#wRes").textContent = finalLabel(w);
  sfx("chime"); confetti(); navigator.vibrate?.([80, 60, 80]);
  try { await updateDoc(doc(db, "wheel", student.id), { spun: true, spunAt: serverTimestamp() }); } catch (e) { console.error(e); }
  spinning = false; $("#spinBtn").hidden = true;
});

/* event rating */
let stars = 0;
$("#stars").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  stars = +b.dataset.v;
  [...$("#stars").children].forEach((x, i) => x.classList.toggle("on", i < stars));
});
$("#rateBtn").addEventListener("click", async () => {
  const err = $("#rateErr"), btn = $("#rateBtn");
  if (!stars) { err.textContent = T[lang].ePick; return; }
  err.textContent = ""; btn.disabled = true;
  try {
    await setDoc(doc(db, "ratings", student.id), { id: student.id, name: student.name, stars, comment: $("#rateTxt").value.trim().slice(0, 300), createdAt: serverTimestamp() });
  } catch (e) {
    if (e.code !== "permission-denied") { console.error(e); err.textContent = `${T[lang].eNet} (${e.code || e.message})`; btn.disabled = false; return; }
  }
  store.set(`rated:${student.id}`, "1"); sfx("chime"); btn.disabled = false; renderPassport();
});

/* memories: photos private to the owner and the organizers */
const album = { mine: [], all: [] }, cache = new Map();
const albumSnap = (key, k) => onSnapshot(doc(db, "albums", key), (s) => { album[k] = s.exists() ? s.data().ids || [] : []; syncPhotos(); }, () => {});
async function syncPhotos() {
  const want = [...album.all.map((i) => [i, 1]), ...album.mine.map((i) => [i, 0])];
  await Promise.all(want.filter(([i]) => !cache.has(i)).map(async ([i]) => {
    try { const d = await getDoc(doc(db, "photos", i)); cache.set(i, d.exists() ? d.data().data : null); } catch { cache.set(i, null); }
  }));
  $("#gallery").innerHTML = want.filter(([i]) => String(cache.get(i)).startsWith("data:image/"))
    .map(([i, sh], k) => `<figure class="pic" style="animation-delay:${k * 0.05}s"><img src="${esc(cache.get(i))}" alt="">${sh ? `<figcaption>${T[lang].memShared}</figcaption>` : ""}</figure>`).join("");
}
async function onPick(e) {
  const f = e.target.files[0]; e.target.value = "";
  const ak = store.get("ak"), err = $("#memErr");
  if (!f || !ak) return;
  if (album.mine.length >= 12) { err.textContent = T[lang].memFull; return; }
  err.textContent = T[lang].memWait;
  try {
    const data = await shrink(f), ref = doc(collection(db, "photos"));
    await setDoc(ref, { data, by: "student", owner: student.id, createdAt: serverTimestamp() });
    await setDoc(doc(db, "albums", ak), { ids: arrayUnion(ref.id) }, { merge: true });
    cache.set(ref.id, data); err.textContent = ""; sfx("stamp");
  } catch (x) { console.error(x); err.textContent = `${T[lang].eNet} (${x.code || x.message})`; }
}
$("#camIn").addEventListener("change", onPick);
$("#galIn").addEventListener("change", onPick);
$("#camBtn").addEventListener("click", () => $("#camIn").click());
$("#galBtn").addEventListener("click", () => $("#galIn").click());
$("#gallery").addEventListener("click", (e) => { const im = e.target.closest("img"); if (im) { $("#lbImg").src = im.src; $("#lb").hidden = false; } });
$("#lb").addEventListener("click", () => { $("#lb").hidden = true; });

/* background music + ambient motion */
const bgm = $("#bgm"); bgm.volume = 0.3;
let muted = store.get("muted") === "1", started = false;
const syncMute = () => { $("#muteBtn").textContent = muted ? "🔇" : "🔊"; if (muted) bgm.pause(); else if (started) bgm.play().catch(() => {}); };
addEventListener("pointerdown", () => { if (started) return; started = true; if (!muted) bgm.play().catch(() => {}); }, { once: true });
$("#muteBtn").addEventListener("click", () => { muted = !muted; store.set("muted", muted ? "1" : "0"); started = true; syncMute(); });
syncMute();
(function fx() {
  const f = document.createElement("div"); f.id = "fx"; f.setAttribute("aria-hidden", "true");
  const plane = '<svg class="flyby" viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
  let h = "";
  for (let i = 0; i < 24; i++) h += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;--s:${2 + Math.random() * 4}px;--t:${6 + Math.random() * 9}s;--dl:${-Math.random() * 9}s"></i>`;
  f.innerHTML = h + plane + plane.replace('class="flyby"', 'class="flyby f2"');
  document.body.prepend(f);
})();

$("#beginBtn").addEventListener("click", () => { sfx("tick"); show("register"); });
$("#langBtn").addEventListener("click", () => { lang = lang === "ar" ? "en" : "ar"; store.set("lang", lang); applyLang(); });
$("#outBtn").addEventListener("click", logout);
function refreshOut() { $("#outBtn").hidden = !(student || isAdmin(auth.currentUser)); }
onAuthStateChanged(auth, refreshOut);

applyLang();
(async () => { const id = store.get("passportId"); if (id) { try { await loadStudent(id); } catch (_) {} } })();
