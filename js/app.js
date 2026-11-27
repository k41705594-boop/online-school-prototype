/* Логика прототипа. Тексты и цены — в js/config.js */
(function () {
'use strict';

/* ================= хранилище ================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem('school:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('school:' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('school:' + k); } catch (e) {} }
};

/* ================= настройки + правки из панели ================= */
const BASE = window.SCHOOL_CONFIG;
let OV = store.get('overrides', {});
let C, LESSONS;
function buildConfig() {
  C = JSON.parse(JSON.stringify(BASE));
  if (OV.school) Object.keys(OV.school).forEach(k => { if (OV.school[k] !== '' && OV.school[k] != null) C.school[k] = OV.school[k]; });
  if (OV.dirs) OV.dirs.forEach((n, i) => { if (n && C.directions[i]) C.directions[i].name = n; });
  if (OV.pricing) Object.keys(OV.pricing).forEach(k => { C.pricing[k] = OV.pricing[k]; });
  if (OV.palette) C.palette = OV.palette;
  C.directions.forEach((d, i) => { d.cls = ['d-a', 'd-b', 'd-c', 'd-d'][i % 4]; d.idx = i; d.g = ((d.name.replace(/[\[\]]/g, '').trim().split(/\s+/).pop() || '?')[0] || '?').toUpperCase(); });
  LESSONS = [];
  C.modules.forEach((m, i) => m.ls.forEach((l, j) => LESSONS.push({ m: i + 1, l: j + 1, key: (i + 1) + '-' + (j + 1), t: l[0], type: l[1] })));
}
buildConfig();

const PALETTES = {
  forest: { name: 'Лес',     light: ['#1E5B4A', '#174A3C', '#FFD84D', '#E7EFEA'], dark: ['#6FC3A6', '#8AD3B9', '#F2C94C', '#1B2A24'] },
  sea:    { name: 'Море',    light: ['#1F4FA8', '#183E86', '#FFC24B', '#E6EDF8'], dark: ['#86AEF0', '#A4C3F5', '#F5B942', '#18233A'] },
  berry:  { name: 'Ягода',   light: ['#A3214F', '#861A41', '#FFD84D', '#F7E6EC'], dark: ['#F08AAE', '#F5A6C2', '#F2C94C', '#331A24'] },
  clay:   { name: 'Глина',   light: ['#B4441C', '#963816', '#9ED8C8', '#F6E9E2'], dark: ['#F2946B', '#F5AC8A', '#7FCBB6', '#35211A'] },
  ink:    { name: 'Чернила', light: ['#2B2D5B', '#1E2046', '#C9F27B', '#E9E9F2'], dark: ['#B4B7F2', '#CDCFF7', '#C9F27B', '#20213A'] }
};
let theme = store.get('theme', 'auto');
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => theme === 'dark' || (theme === 'auto' && mq.matches);
function applyTheme() {
  const r = document.documentElement;
  if (theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', theme);
  const p = (PALETTES[C.palette] || PALETTES.forest)[isDark() ? 'dark' : 'light'];
  r.style.setProperty('--brand', p[0]); r.style.setProperty('--brand-2', p[1]);
  r.style.setProperty('--mark', p[2]); r.style.setProperty('--soft', p[3]);
  r.style.setProperty('--on-brand', isDark() ? '#0E1512' : '#FFFFFF');
  const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = isDark() ? '#16201C' : '#FFFFFF';
  document.body.classList.toggle('no-ph', OV.hidePh === true);
}
if (mq.addEventListener) mq.addEventListener('change', applyTheme);

/* ================= утилиты ================= */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const T = s => esc(s).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
const plain = s => String(s).replace(/[\[\]]/g, '');
const plural = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return f[a > 10 && a < 20 ? 2 : b > 1 && b < 5 ? 1 : b === 1 ? 0 : 2]; };
const fmtN = n => Math.round(n).toLocaleString('ru-RU');
const mon = m => m + ' ' + plural(m, ['месяц', 'месяца', 'месяцев']);
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONF = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WDF = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const addD = (n, d) => { const x = new Date(d || TODAY); x.setDate(x.getDate() + n); return x; };
const wd = d => (d.getDay() + 6) % 7;
const dShort = d => d.getDate() + ' ' + MON[d.getMonth()];
const dLong = d => d.getDate() + ' ' + MONF[d.getMonth()];
const sameDay = (a, b) => a.getTime() === b.getTime();
const MONDAY = addD(-wd(TODAY));
const START = addD(7, MONDAY);
const dirOf = c => C.directions.find(d => d.id === c.dir) || C.directions[0];
const courseById = id => C.courses.find(c => c.id === +id) || C.courses[0];
const tariffById = id => C.tariffs.find(t => t.id === id) || C.tariffs[1];
const initials = n => /^\[/.test(n) ? 'ИФ' : n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* цены */
const TNUM = { base: 1, mentor: 2, pro: 3 };
const monthly = tid => { const v = C.pricing[tid]; return typeof v === 'number' && v > 0 ? v : null; };
const priceM = tid => monthly(tid) == null ? '[цена ' + TNUM[tid] + ']' : fmtN(monthly(tid));
const total = (c, tid) => monthly(tid) == null ? null : monthly(tid) * c.months;
const disc = () => +C.pricing.fullDiscount || 0;
const fullPay = (c, tid) => total(c, tid) == null ? null : total(c, tid) * (1 - disc() / 100);
const rub = (n, ph) => n == null ? (ph || '[сумма]') + ' ₽' : fmtN(n) + ' ₽';

/* иконки */
const I = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5zM20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5z"/>',
  doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 12h5M10 16h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>', home: '<path d="M4 11l8-6.5 8 6.5V20h-5v-5h-6v5H4z"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" fill="currentColor" stroke="none"/>',
  video: '<rect x="3.5" y="6" width="12" height="12" rx="2"/><path d="M15.5 10l5-3v10l-5-3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  fire: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 1.6 1 2.5 2 3 0-3 0-5.5 1-8.5z"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18M7 15h4"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M3.5 9h17M12 9c-1.5-3-5-3.5-5-1.2C7 9 12 9 12 9zm0 0c1.5-3 5-3.5 5-1.2C17 9 12 9 12 9z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  heartf: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0012 3.5z" fill="currentColor"/>',
  brush: '<path d="M14.5 4.5l5 5L11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s4 .5 6-1.5c1-1 1-2.5 0-3.5"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  out: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>', users: '<circle cx="9" cy="9" r="3.2"/><path d="M3 19c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5M16 6.5a3 3 0 010 5.6M18 14.8c1.4.6 2.4 2 2.9 4.2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>', phone: '<path d="M6 3.5h3l1.5 4-2 1.5a11 11 0 006.5 6.5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014 5.5a2 2 0 012-2z"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'
};
const ic = (n, s) => `<svg class="ic" width="${s || 20}" height="${s || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* узоры для обложек: у каждого направления свой мотив */
function cover(seed, kind) {
  let s = (seed * 7919 + 13) % 233280;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const W = 320, H = 140; let o = '';
  if (kind === 0) {
    for (let i = 0; i < 5; i++) { const cx = W * (.45 + r() * .6), cy = H * r(), rr = 18 + r() * 60; o += `<circle cx="${cx | 0}" cy="${cy | 0}" r="${rr | 0}" fill="currentColor" fill-opacity="${i % 2 ? .1 : 0}" stroke="currentColor" stroke-opacity=".28" stroke-width="2"/>`; }
  } else if (kind === 1) {
    const off = r() * 40;
    for (let i = -6; i < 16; i++) { const x = i * 26 + off; o += `<path d="M${x | 0} ${H + 10}L${(x + 80) | 0} -10" stroke="currentColor" stroke-opacity=".13" stroke-width="10"/>`; }
    o += `<circle cx="${(W * .82) | 0}" cy="${(H * .9) | 0}" r="${(60 + r() * 20) | 0}" fill="currentColor" fill-opacity=".14"/>`;
  } else if (kind === 2) {
    for (let x = 0; x < W; x += 18) for (let y = 0; y < H; y += 18) o += `<circle cx="${x + 9}" cy="${y + 9}" r="1.8" fill="currentColor" fill-opacity=".22"/>`;
    const cx = W * (.6 + r() * .25), cy = H * (.3 + r() * .4);
    o += `<rect x="${(cx - 40) | 0}" y="${(cy - 40) | 0}" width="80" height="80" rx="14" transform="rotate(${(r() * 40 + 10) | 0} ${cx | 0} ${cy | 0})" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/>`;
  } else {
    for (let k = 0; k < 5; k++) { const y = 26 + k * 22, a = 8 + r() * 10, ph = r() * 6; let d = 'M0 ' + y; for (let x = 10; x <= W; x += 10) d += ' L' + x + ' ' + (y + Math.sin(x / 28 + ph) * a).toFixed(1); o += `<path d="${d}" fill="none" stroke="currentColor" stroke-opacity="${(.12 + k * .04).toFixed(2)}" stroke-width="3"/>`; }
  }
  return `<svg class="cv" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${o}</svg>`;
}

let toastT;
function toast(msg, icon) {
  const t = document.getElementById('toast');
  t.innerHTML = (icon ? ic(icon, 18) : '') + '<span>' + esc(msg) + '</span>';
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['var(--brand)', 'var(--mark)', 'var(--bad)', 'var(--info)', 'var(--ok)'];
  for (let i = 0; i < 70; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5]; p.style.animationDelay = Math.random() * .6 + 's'; p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's'; box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3800);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
  }
}

/* ================= демо-данные ученика ================= */
const DEMO_DONE = ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2'];
const DEMO_HW = [
  { id: 1, t: 'Практика: первое задание', m: 1, les: '1-4', st: 'ok', due: -16, grade: '5 из 5', fb: 'Отличное начало! Всё выполнено по заданию, оформление аккуратное.' },
  { id: 2, t: 'Практика: [задание модуля 2]', m: 2, les: '2-4', st: 'fix', due: -1, grade: null, fb: 'Хорошая структура, но во второй части не хватает примеров. Добавьте 2–3 примера и пришлите снова.' },
  { id: 3, t: 'Мини-тест по модулю 2', m: 2, les: '2-3', st: 'review', due: 1, grade: null, fb: '' },
  { id: 4, t: 'Практика: [задание модуля 3]', m: 3, les: '3-4', st: 'todo', due: 6, grade: null, fb: '' },
  { id: 5, t: 'Практика: [задание модуля 4]', m: 4, les: '4-4', st: 'todo', due: 20, grade: null, fb: '' },
  { id: 6, t: 'Итоговый проект', m: 5, les: '5-3', st: 'todo', due: 40, grade: null, fb: '' }
];
const DEMO_CHAT = [
  { me: 0, t: 'Привет! Я [Имя наставника], буду вести вас по курсу. Пишите сюда любые вопросы, отвечаю в течение дня.', d: -6, tm: '10:12' },
  { me: 1, t: 'Здравствуйте! А можно сдавать задания чуть позже дедлайна?', d: -5, tm: '19:40' },
  { me: 0, t: 'Да, дедлайны мягкие. Главное, предупредите заранее, и мы вместе подберём срок.', d: -5, tm: '20:02' },
  { me: 0, t: 'Посмотрела ваше задание по модулю 2 и оставила комментарий. Нужно немного доработать, у вас хорошо получается!', d: -1, tm: '16:25' }
];
const REPLIES = [
  'Спасибо за вопрос! Посмотрю и отвечу подробно сегодня вечером.',
  'Хороший вопрос. Мы как раз разберём это на ближайшем вебинаре, приходите!',
  'Понял(а) вас. Пришлите, пожалуйста, скриншот или файл, так будет проще помочь.',
  'Отлично, что разобрались! Если будут сложности с заданием, пишите.'
];
const HW_ST = { ok: ['Принято', 'p-ok'], fix: ['Доработать', 'p-bad'], review: ['На проверке', 'p-info'], todo: ['Нужно сдать', 'p-warn'] };
const PATTERN = {
  0: [{ c: 'ev-self', tm: 'весь день', t: 'Открыт новый урок' }],
  1: [{ c: 'ev-dl', tm: 'до 23:59', t: 'Дедлайн домашнего задания' }],
  2: [{ c: 'ev-live', tm: '19:00 · 90 мин', t: 'Вебинар: [тема урока]' }],
  3: [{ c: 'ev-cons', tm: '18:30 · 30 мин', t: 'Консультация с наставником' }],
  5: [{ c: 'ev-live', tm: '12:00 · 60 мин', t: 'Разбор частых ошибок' }]
};
const EV_NAME = { 'ev-live': 'Вебинар', 'ev-cons': 'Консультация', 'ev-dl': 'Дедлайн', 'ev-self': 'Новый урок' };

/* ================= состояние ================= */
const S = {
  course: store.get('course', 1), tariff: store.get('tariff', 'mentor'), user: store.get('user', null), enrolled: store.get('enrolled', null),
  done: new Set(store.get('done', DEMO_DONE)), hw: store.get('hw', JSON.parse(JSON.stringify(DEMO_HW))), chat: store.get('chat', DEMO_CHAT.slice()),
  fav: new Set(store.get('fav', [])), read: store.get('read', false),
  step: 1, plan: 'split', pay: 'card', who: 'me', dir: 'all', level: 'all', dur: 'all', sort: 'pop', q: '', quiz: [],
  hwFilter: 'all', lessonTab: 'notes', weekOff: 0, priceMode: 'split', promo: 0, form: { name: '', email: '', phone: '' },
  modal: null, notifOpen: false, authStep: 'email', authEmail: '', czOpen: false, typing: false, resetArm: false
};
function saveAll() {
  store.set('course', S.course); store.set('tariff', S.tariff); store.set('user', S.user); store.set('enrolled', S.enrolled);
  store.set('done', [...S.done]); store.set('hw', S.hw); store.set('chat', S.chat.slice(-60)); store.set('fav', [...S.fav]); store.set('read', S.read);
}
const myCourse = () => courseById(S.enrolled || S.course);
const curIdx = () => { const i = LESSONS.findIndex(l => !S.done.has(l.key)); return i < 0 ? LESSONS.length : i; };
const curLesson = () => LESSONS[Math.min(curIdx(), LESSONS.length - 1)];
const pct = () => Math.round(S.done.size / LESSONS.length * 100);
function lessonState(key) {
  if (S.done.has(key)) return 'done';
  const i = LESSONS.findIndex(l => l.key === key);
  return i === curIdx() ? 'cur' : 'lock';
}
const hwOpenCount = () => S.hw.filter(h => h.st === 'todo' || h.st === 'fix').length;

/* ================= общие блоки ================= */
function route() { return decodeURIComponent((location.hash || '#home').slice(1)) || 'home'; }

function header(r) {
  const on = p => r.startsWith(p) ? 'on' : '';
  const sc = C.school;
  const unread = S.read ? 0 : notifications().length;
  const themeIc = theme === 'auto' ? 'auto' : theme === 'dark' ? 'moon' : 'sun';
  return `<div class="wrap">
    <a class="logo" href="#home" aria-label="${esc(plain(sc.name))}, на главную"><span class="logo-mark">${esc(sc.letter)}</span><span>${esc(sc.name)}</span></a>
    <nav class="nav" aria-label="Главное меню">
      <a href="#catalog" class="${on('catalog')}">Каталог курсов</a>
      <button data-scroll="path" data-route="home">Как учимся</button>
      <button data-scroll="reviews" data-route="home">Отзывы</button>
      <a href="#about" class="${on('about')}">О школе</a>
    </nav>
    <div class="hdr-right">
      <button class="icon-btn only-d" data-act="theme" aria-label="Тема: ${theme === 'auto' ? 'как в системе' : theme === 'dark' ? 'тёмная' : 'светлая'}" title="Сменить тему">${ic(themeIc)}</button>
      <a class="icon-btn only-d" href="#favorites" aria-label="Избранное" title="Избранное">${ic('heart')}${S.fav.size ? `<span class="dot">${S.fav.size}</span>` : ''}</a>
      ${S.user ? `<div style="position:relative"><button class="icon-btn" data-act="notif" aria-label="Уведомления" aria-expanded="${S.notifOpen}">${ic('bell')}${unread ? `<span class="dot">${unread}</span>` : ''}</button>${S.notifOpen ? notifPop() : ''}</div>
        <a class="user-chip only-d" href="#cabinet"><span class="ava-s d-c" style="width:30px;height:30px;font-size:13px">${esc(initials(S.user.name))}</span><span>Мой кабинет</span></a>`
        : `<a class="btn btn-ghost btn-sm only-d" href="#login">${ic('user', 18)} Войти</a>`}
      <button class="btn btn-primary btn-sm" data-act="trial">Пробный урок</button>
      <a class="icon-btn only-m" href="${S.user ? '#cabinet' : '#login'}" aria-label="Личный кабинет">${ic('user')}</a>
      <button class="icon-btn only-m" data-act="menu" aria-label="Открыть меню">${ic('menu')}</button>
    </div></div>
    <div class="drawer" id="drawer" hidden data-act="menu-bg"><div class="drawer-panel">
      <div class="drawer-top"><span class="logo"><span class="logo-mark">${esc(sc.letter)}</span></span><button class="icon-btn" data-act="menu" aria-label="Закрыть меню">${ic('x')}</button></div>
      <a href="#home">${ic('home')}Главная</a><a href="#catalog">${ic('book')}Каталог курсов</a>
      <button class="dlink" data-scroll="path" data-route="home">${ic('target')}Как учимся</button>
      <a href="#about">${ic('users')}О школе</a>
      <a href="#favorites">${ic('heart')}Избранное${S.fav.size ? ' · ' + S.fav.size : ''}</a>
      <a href="${S.user ? '#cabinet' : '#login'}">${ic('user')}${S.user ? 'Мой кабинет' : 'Войти в кабинет'}</a>
      <button class="dlink" data-act="theme">${ic(themeIc)}Тема: ${theme === 'auto' ? 'как в системе' : theme === 'dark' ? 'тёмная' : 'светлая'}</button>
      <button class="dlink" data-act="cz">${ic('brush')}Настроить сайт</button>
      <button class="btn btn-primary" style="margin-top:16px" data-act="trial">Записаться на пробный урок</button>
    </div></div>`;
}
function notifications() {
  const fix = S.hw.find(h => h.st === 'fix');
  const n = [{ i: 'chat', c: 'd-a', t: 'Новое сообщение от наставника', s: 'вчера, 16:25', h: '#cabinet-chat' }];
  if (fix) n.push({ i: 'doc', c: 'd-b', t: 'Задание «' + plain(fix.t) + '» нужно доработать', s: 'вчера', h: '#cabinet-homework' });
  n.push({ i: 'cal', c: 'd-c', t: 'В среду в 19:00 вебинар', s: 'напоминание', h: '#cabinet-schedule' });
  n.push({ i: 'award', c: 'd-d', t: 'Новое достижение: 5 дней подряд', s: '2 дня назад', h: '#cabinet-progress' });
  return n;
}
function notifPop() {
  return `<div class="pop" role="dialog" aria-label="Уведомления"><div class="pop-h"><b>Уведомления</b><button class="link" data-act="read-all" style="font-size:13px">Прочитать все</button></div>
    ${notifications().map(n => `<a class="notif ${S.read ? '' : 'unread'}" href="${n.h}"><span class="ni ${n.c}" style="color:var(--d-ink)">${ic(n.i, 18)}</span><span><b style="font-size:14px">${esc(n.t)}</b><small>${n.s}</small></span></a>`).join('')}</div>`;
}
function footer() {
  const sc = C.school;
  return `<div class="wrap ftr-grid">
    <div><a class="logo" href="#home"><span class="logo-mark">${esc(sc.letter)}</span><span>${esc(sc.name)}</span></a>
      <p class="muted" style="margin-top:12px;font-size:14px;max-width:36ch">${T(sc.about)}</p>
      <p class="muted" style="margin-top:12px;font-size:14px">${T(sc.phone)} · ${T(sc.email)} · ${T(sc.telegram)}</p></div>
    <div><h4>Учиться</h4><a href="#catalog">Каталог курсов</a>${C.directions.map(d => `<a href="#catalog" data-dir="${d.id}">${esc(d.name)}</a>`).join('')}</div>
    <div><h4>Ученикам</h4><a href="#cabinet">Личный кабинет</a><a href="#cabinet-schedule">Расписание</a><a href="#cabinet-homework">Домашние задания</a><a href="#favorites">Избранное</a></div>
    <div><h4>О школе</h4><a href="#about">О нас и контакты</a><a href="#about" data-scroll="requisites">[Реквизиты]</a><a href="#about" data-scroll="requisites">[Договор-оферта]</a><a href="#about" data-scroll="requisites">[Политика конфиденциальности]</a><button class="fl" data-act="cz">Настроить сайт</button></div>
  </div>
  <div class="wrap"><div class="ftr-bottom"><span>© ${esc(sc.year)} ${esc(sc.name)}</span><span>Прототип: названия, цены и данные пока заглушки</span></div></div>`;
}
function courseCard(c) {
  const d = dirOf(c), f = S.fav.has(c.id);
  return `<a class="ccard" href="#course-${c.id}">
    <div class="ccard-top ${d.cls}">${cover(c.id, d.idx)}<span class="chip">${esc(d.name)}</span>${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ''}
      <button class="fav ${f ? 'on' : ''}" data-act="fav" data-v="${c.id}" aria-pressed="${f}" aria-label="${f ? 'Убрать из избранного' : 'В избранное'}">${ic(f ? 'heartf' : 'heart', 18)}</button></div>
    <div class="ccard-body"><h3>${T(c.title)}</h3><p>${T(c.sub)}</p>
      <div class="meta"><span>${ic('clock', 15)} ${mon(c.months)}</span><span>${ic('video', 15)} ${c.lessons} ${plural(c.lessons, ['урок', 'урока', 'уроков'])}</span><span>${ic('target', 15)} ${esc(c.level)}</span></div>
      <div class="price-line"><span>от <b>${T(priceM('base'))} ₽</b>/мес</span>${ic('arrow', 18)}</div>
    </div></a>`;
}
function faqBlock() {
  return `<div class="faq">${C.faq.map(([q, a], i) => `<details class="qa"${i === 0 ? ' open' : ''}><summary>${T(q)}</summary><div class="ans">${T(a)}</div></details>`).join('')}</div>`;
}
function reviewsBlock(n) {
  return `<div class="rgrid">${C.reviews.slice(0, n || 99).map((r, i) => `<figure class="review"><div class="stars">${ic('star', 16).repeat(5)}</div>
    <blockquote>${T(r.text)}</blockquote>
    <figcaption class="who"><span class="ava-s ${['d-a', 'd-b', 'd-c', 'd-d'][i % 4]}">${esc(initials(r.name))}</span><span><b>${T(r.name)}</b><small>Курс ${T(r.course)}</small></span></figcaption></figure>`).join('')}</div>`;
}
function teachersBlock() {
  return `<div class="tgrid">${C.teachers.map((t, i) => `<button class="teacher" data-act="teacher" data-v="${i}"><span class="avatar ${['d-a', 'd-b', 'd-c', 'd-d'][i % 4]}">${cover(i + 40, i % 4)}<span>${esc(initials(t.name))}</span><small>${T(t.exp)}</small><span class="play-s">${ic('play', 14)}</span></span><h4>${T(t.name)}</h4><p>${T(t.role)}</p></button>`).join('')}</div>`;
}
function ring(p, size) {
  size = size || 132; const r = (size - 16) / 2, L = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--soft)" stroke-width="12"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--brand)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(L * p / 100).toFixed(1)} ${L.toFixed(1)}"/></svg><b>${p}%</b></div>`;
}
const head = (eye, h, p) => `<div class="sec-head"><div><span class="eyebrow">${eye}</span><h2>${h}</h2>${p ? `<p>${p}</p>` : ''}</div></div>`;

/* ================= страницы ================= */
const QZ = [
  ['Зачем вы хотите учиться?', ['Освоить новую профессию', 'Прокачать навыки для работы или учёбы', 'Для себя, как хобби', 'Подготовиться к экзамену']],
  ['Сколько времени готовы уделять?', ['2–3 часа в неделю', '5–7 часов в неделю', '10 часов и больше']],
  ['Какой у вас уровень сейчас?', ['Совсем с нуля', 'Есть небольшая база', 'Уверенный уровень']]
];
function quizInner() {
  const q = S.quiz;
  if (q.length < QZ.length) {
    const [qq, opts] = QZ[q.length];
    return `<div><div class="eyebrow">Вопрос ${q.length + 1} из ${QZ.length}</div>
      <div class="quiz-prog">${QZ.map((_, i) => `<i class="${i <= q.length ? 'on' : ''}"></i>`).join('')}</div>
      <h3 style="font-size:20px;margin-bottom:16px">${qq}</h3>
      <div class="quiz-opts">${opts.map((o, i) => `<button class="opt" data-act="quiz" data-v="${i}">${o}${ic('arrow', 18)}</button>`).join('')}</div>
      ${q.length ? `<button class="btn btn-ghost btn-sm" style="margin-top:14px" data-act="quiz-back">${ic('left', 16)} Назад</button>` : ''}</div>`;
  }
  let id = q[0] === 3 ? 7 : [q[1] === 0 ? 3 : 1, 4, 5][q[2]];
  if (q[0] === 0 && q[2] > 0) id = 5;
  const c = courseById(id);
  return `<div><div class="eyebrow">${ic('check', 14)} Вам подойдёт</div><div style="margin:14px 0 16px">${courseCard(c)}</div>
    <div class="btns"><a class="btn btn-primary" href="#course-${c.id}">Смотреть программу</a><button class="btn btn-ghost" data-act="quiz-reset">Пройти заново</button></div></div>`;
}

function pHome() {
  const sc = C.school;
  const tick = [...C.directions.map(d => d.name), 'Живые вебинары', 'Проверка домашних заданий', 'Сертификат', 'Рассрочка без переплаты', 'Пробный урок бесплатно'];
  const pop = C.courses.filter(c => c.popular).sort((a, b) => a.popular - b.popular).slice(0, 3);
  return `
  <section class="hero grid-paper"><div class="wrap hero-grid">
    <div>
      <span class="eyebrow">${esc(sc.name)} · онлайн-школа</span>
      <h1>Освойте ${T(sc.topic)} с нуля и <span class="hl">дойдите до результата</span></h1>
      <p class="hero-lead">Короткие видеоуроки, живые занятия с преподавателем и проверка каждого домашнего задания. Учитесь в своём темпе, а наставник поможет не бросить.</p>
      <div class="btns"><button class="btn btn-primary" data-scroll="quiz">Подобрать курс за 1 минуту ${ic('arrow', 18)}</button><a class="btn btn-ghost" href="#catalog">Смотреть все курсы</a></div>
      <div class="trust"><div><b>${T(sc.students)}</b><span>учеников</span></div><div><b>${T(sc.rating)}</b><span>средняя оценка курсов</span></div><div><b>${C.courses.length}</b><span>${plural(C.courses.length, ['курс', 'курса', 'курсов'])} в каталоге</span></div></div>
    </div>
    <div class="hero-visual" aria-label="Пример того, как выглядит обучение">
      <div class="sticker">Первый урок бесплатно</div>
      <div class="mock mock-tilt float1"><div class="mock-row"><span class="live-dot"></span><span class="tag">Сегодня · 19:00 · в эфире</span></div>
        <h3 style="margin:10px 0 4px;font-size:16px">Живой вебинар: ${T('[тема урока]')}</h3><p class="muted" style="font-size:14px">Преподаватель ${T('[Имя]')} · 24 ученика онлайн</p></div>
      <div class="mock float2"><div class="mock-row" style="justify-content:space-between"><span class="tag">Мой прогресс</span><b style="font-family:var(--f-display)">38%</b></div>
        <div class="bar" style="margin:12px 0 10px"><i style="width:38%"></i></div>
        <div class="mock-row muted" style="font-size:14px;gap:8px">${ic('check', 16)} 6 из 19 уроков · модуль 2</div></div>
      <div class="mock mock-tilt2 float3"><div class="mock-row"><span class="check-stamp">${ic('check')}</span><div><b style="font-size:15px">Домашнее задание принято</b><p class="muted" style="font-size:14px">«Отличное начало, оформление аккуратное»</p></div></div></div>
    </div>
  </div></section>
  <div class="ticker" aria-hidden="true"><div class="ticker-track">${[0, 1].map(() => tick.map(t => `<span>${esc(t)}</span>`).join('')).join('')}</div></div>

  <section class="sec"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Направления</span><h2>Чему можно научиться</h2></div><a class="btn btn-ghost btn-sm" href="#catalog">Все курсы ${ic('arrow', 16)}</a></div>
    <div class="dirs">${C.directions.map(d => { const n = C.courses.filter(c => c.dir === d.id).length; return `<a class="dir ${d.cls}" href="#catalog" data-dir="${d.id}">${cover(d.idx + 90, d.idx)}<b>${T(d.name)}</b><span class="dir-foot"><span>${n} ${plural(n, ['курс', 'курса', 'курсов'])}</span>${ic('arrow', 18)}</span></a>`; }).join('')}</div>
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    ${head('Популярное', 'С чего начинают чаще всего')}
    <div class="cgrid">${pop.map(courseCard).join('')}</div>
  </div></section>

  <section class="sec grid-paper band" id="path"><div class="wrap">
    ${head('Путь ученика', 'Как проходит обучение', 'Пять шагов от первого урока до сертификата. На каждом шаге рядом наставник.')}
    <div class="path">${[
      ['Бесплатный пробный урок', 'Знакомитесь с форматом и преподавателем. Это ни к чему не обязывает.'],
      ['Выбор тарифа', 'Учитесь сами, с наставником или индивидуально. Можно в рассрочку.'],
      ['Уроки и практика', 'Видео по 10–15 минут, живые вебинары раз в неделю, всё в личном кабинете.'],
      ['Проверка заданий', 'Наставник проверяет каждую работу и подробно объясняет ошибки.'],
      ['Проект и сертификат', 'Делаете итоговую работу для портфолио и получаете сертификат.']
    ].map((s, i) => `<div class="step"><span class="step-num">${i + 1}</span><div><h3>${s[0]}</h3><p>${s[1]}</p></div></div>`).join('')}</div>
  </div></section>

  <section class="sec"><div class="wrap">
    ${head('Формат', 'Что входит в каждый курс')}
    <div class="bento">
      <div class="tile dark t-4"><span class="ti">${ic('video')}</span><h3>Короткие уроки, которые удобно смотреть с телефона</h3><p>Каждый урок длится 10–15 минут, к нему есть конспект и задание. Можно учиться в автобусе или на перемене.</p></div>
      <div class="tile t-2"><span class="ti">${ic('chat')}</span><h3>Чат с наставником</h3><p>Задавайте вопросы прямо в кабинете, ответ в течение дня.</p></div>
      <div class="tile t-2"><span class="ti">${ic('check')}</span><h3>Проверка ДЗ</h3><p>Подробный разбор каждой работы за ${T('[24 часа]')}.</p></div>
      <div class="tile t-2"><span class="ti">${ic('cal')}</span><h3>Расписание</h3><p>Вебинары и дедлайны в одном календаре, с напоминаниями.</p></div>
      <div class="tile t-2"><span class="ti">${ic('users')}</span><h3>Отчёты родителям</h3><p>Если учится ребёнок, родители раз в неделю получают короткий отчёт.</p>
        <div class="report"><div><span class="muted">Уроков за неделю</span><b>3 из 3</b></div><div><span class="muted">Оценка за ДЗ</span><b>5 из 5</b></div></div></div>
    </div>
  </div></section>

  <section class="sec" id="quiz" style="padding-top:0"><div class="wrap"><div class="quiz">
    <div><span class="eyebrow">Подбор курса</span><h2 style="margin:10px 0 12px">Не знаете, с чего начать?</h2><p class="muted">Ответьте на три вопроса, и мы покажем курс, который подойдёт под ваши цели и уровень.</p></div>
    <div id="quiz-box">${quizInner()}</div>
  </div></div></section>

  <section class="sec" style="padding-top:0"><div class="wrap">
    ${head('Преподаватели', 'Учат практики', 'Каждый преподаватель работает по специальности и сам ведёт живые занятия. Нажмите на карточку, чтобы посмотреть видео-знакомство.')}
    ${teachersBlock()}
  </div></section>

  <section class="sec grid-paper band" id="reviews"><div class="wrap">
    ${head('Отзывы', 'Что говорят ученики', 'Это примеры. Перед запуском замените их настоящими отзывами.')}
    ${reviewsBlock()}
  </div></section>

  <section class="sec"><div class="wrap">
    ${head('Стоимость', 'Сколько стоит учиться')}
    <div class="bento">
      <div class="tile t-2"><span class="ti">${ic('card')}</span><h3>от ${T(priceM('base'))} ₽ в месяц</h3><p>Цена зависит от курса и тарифа. Все тарифы есть на странице курса.</p></div>
      <div class="tile t-2"><span class="ti">${ic('clock')}</span><h3>Рассрочка без переплаты</h3><p>Платите помесячно весь срок обучения. Скидка ${disc()}%, если оплатить сразу.</p></div>
      <div class="tile t-2"><span class="ti">${ic('gift')}</span><h3>Возврат денег</h3><p>Если курс не подошёл, вернём деньги за непройденные уроки.</p></div>
    </div>
  </div></section>

  <section class="sec" id="faq" style="padding-top:0"><div class="wrap">
    ${head('FAQ', 'Частые вопросы')}
    ${faqBlock()}
  </div></section>

  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta">
    <div><span class="eyebrow" style="color:inherit;opacity:.85">Первый урок бесплатно</span><h2 style="margin-top:10px">Попробуйте, прежде чем платить</h2><p>Оставьте контакты: пришлём ссылку на пробный урок и поможем выбрать курс.</p></div>
    <form data-form="lead" novalidate>
      <div class="field"><label for="lead-name">Имя</label><input id="lead-name" name="name" placeholder="Как к вам обращаться" autocomplete="name"></div>
      <div class="field"><label for="lead-phone">Телефон или Telegram</label><input id="lead-phone" name="phone" placeholder="+7 ... или @ник"></div>
      <button class="btn btn-mark" type="submit">Получить пробный урок</button>
      <span class="small-note">Это макет: заявка никуда не отправляется.</span>
    </form>
  </div></div></section>`;
}

function filteredCourses() {
  const list = C.courses.filter(c =>
    (S.dir === 'all' || c.dir === S.dir) && (S.level === 'all' || c.level === S.level) &&
    (S.dur === 'all' || (S.dur === 'short' ? c.months <= 3 : c.months > 3)) &&
    (!S.q || (plain(c.title + ' ' + c.sub + ' ' + dirOf(c).name)).toLowerCase().includes(S.q.toLowerCase().trim())));
  const by = { pop: (a, b) => (a.popular || 99) - (b.popular || 99), short: (a, b) => a.months - b.months, long: (a, b) => b.months - a.months, price: (a, b) => a.months - b.months };
  return list.sort(by[S.sort] || by.pop);
}
function catList() {
  const list = filteredCourses();
  return `<p class="muted" style="margin-bottom:16px;font-size:14px">Найдено: ${list.length} ${plural(list.length, ['курс', 'курса', 'курсов'])}</p>` + (list.length ? `<div class="cgrid">${list.map(courseCard).join('')}</div>` : `<div class="empty">${ic('search', 28)}<h3>Ничего не нашлось</h3><p>Попробуйте убрать часть фильтров или изменить запрос.</p><button class="btn btn-ghost btn-sm" data-act="reset-filters">Сбросить фильтры</button></div>`);
}
function pCatalog() {
  return `<section class="page-head grid-paper" style="border-bottom:1px solid var(--line)"><div class="wrap">
    <div class="crumbs"><a href="#home">Главная</a><span>/</span><span>Каталог</span></div>
    <h1>Каталог курсов</h1><p class="muted" style="margin-top:10px;max-width:56ch">${C.courses.length} ${plural(C.courses.length, ['курс', 'курса', 'курсов'])} по ${C.directions.length} направлениям. Фильтруйте по уровню и длительности, чтобы найти свой.</p>
  </div></section>
  <section class="wrap" style="padding-block:24px 72px">
    <div class="filters">
      <label class="search">${ic('search', 18)}<input id="cat-q" type="search" placeholder="Найти курс" value="${esc(S.q)}" aria-label="Поиск по курсам"></label>
      <select class="sel" id="cat-level" aria-label="Уровень">${['all', 'С нуля', 'Есть база', 'Уверенный'].map(v => `<option value="${v}"${S.level === v ? ' selected' : ''}>${v === 'all' ? 'Любой уровень' : v}</option>`).join('')}</select>
      <select class="sel" id="cat-dur" aria-label="Длительность">${[['all', 'Любая длительность'], ['short', 'До 3 месяцев'], ['long', 'Больше 3 месяцев']].map(([v, t]) => `<option value="${v}"${S.dur === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <select class="sel" id="cat-sort" aria-label="Сортировка">${[['pop', 'Сначала популярные'], ['short', 'Сначала короткие'], ['long', 'Сначала длинные']].map(([v, t]) => `<option value="${v}"${S.sort === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
    </div>
    <div class="chips" role="group" aria-label="Направление">${[{ id: 'all', name: 'Все направления' }].concat(C.directions).map(d => `<button class="${S.dir === d.id ? 'on' : ''}" data-act="dir" data-v="${d.id}">${esc(d.name)}</button>`).join('')}</div>
    <div id="cat-list">${catList()}</div>
  </section>`;
}

function pFav() {
  const list = C.courses.filter(c => S.fav.has(c.id));
  return `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#home">Главная</a><span>/</span><span>Избранное</span></div><h1>Избранное</h1>
    <p class="muted" style="margin-top:10px">Курсы, которые вы отметили сердечком.</p></div></section>
    <section class="wrap" style="padding-bottom:72px">${list.length ? `<div class="cgrid">${list.map(courseCard).join('')}</div>` : `<div class="empty">${ic('heart', 28)}<h3>Пока пусто</h3><p>Нажмите на сердечко на карточке курса, и он появится здесь.</p><a class="btn btn-primary btn-sm" href="#catalog">Открыть каталог</a></div>`}</section>`;
}

function tariffAmount(c, t) {
  if (S.priceMode === 'split') return `<div class="amt">${T(priceM(t.id))} ₽<small>в месяц · ${mon(c.months)} без переплаты</small></div>`;
  const tot = total(c, t.id);
  return `<div class="amt">${T(rub(fullPay(c, t.id), '[сумма]'))}<small>сразу за весь курс · скидка ${disc()}%${tot != null ? ' · вместо ' + fmtN(tot) + ' ₽' : ''}</small></div>`;
}
function pCourse(id) {
  const c = courseById(id), d = dirOf(c), f = S.fav.has(c.id); S.course = c.id; store.set('course', c.id);
  const nLessons = LESSONS.length;
  return `<section class="c-hero ${d.cls}">${cover(c.id + 7, d.idx)}<div class="wrap">
    <div class="crumbs" style="color:inherit;opacity:.8"><a href="#home">Главная</a><span>/</span><a href="#catalog">Каталог</a><span>/</span><span>${esc(d.name)}</span></div>
    <div class="c-hero-grid">
      <div><span class="chip">${esc(d.name)}</span>${c.badge ? ` <span class="badge">${esc(c.badge)}</span>` : ''}
        <h1>${T(c.title)}</h1><p class="lead">${T(c.sub)}. ${c.level === 'С нуля' ? 'Подходит, даже если вы никогда раньше этим не занимались.' : 'Поможет выйти на новый уровень.'}</p>
        <div class="btns" style="margin-top:24px"><button class="btn btn-primary" data-scroll="tariffs">Выбрать тариф</button><button class="btn btn-ghost" data-act="video" data-v="Как проходит урок">${ic('play', 16)} Как проходит урок</button></div></div>
      <div class="buycard">
        <div><small class="muted">Стоимость</small><div class="amt">от ${T(priceM('base'))} ₽<span class="muted" style="font:500 15px var(--f-body)">/мес</span></div></div>
        <div class="facts">
          <div class="fact"><small>Старт потока</small><b>${dLong(START)}</b></div>
          <div class="fact"><small>Длительность</small><b>${mon(c.months)}</b></div>
          <div class="fact"><small>Уроков</small><b>${c.lessons}</b></div>
          <div class="fact"><small>Уровень</small><b>${esc(c.level)}</b></div>
        </div>
        <div class="seats"><span class="muted">Свободно ${T('[N]')} мест</span><span class="bar"><i style="width:72%;background:var(--warn)"></i></span></div>
        <button class="btn btn-primary btn-block" data-scroll="tariffs">Записаться</button>
        <div class="btns"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="trial" data-v="${c.id}">Пробный урок</button><button class="btn btn-ghost btn-sm" data-act="fav" data-v="${c.id}" aria-pressed="${f}" style="${f ? 'color:var(--bad)' : ''}">${ic(f ? 'heartf' : 'heart', 18)}<span>${f ? 'В избранном' : 'В избранное'}</span></button></div>
      </div>
    </div></div></section>
  <div class="subnav"><div class="wrap">${[['learn', 'Чему научитесь'], ['program', 'Программа'], ['result', 'Результат'], ['tariffs', 'Тарифы'], ['c-reviews', 'Отзывы'], ['c-faq', 'Вопросы']].map(([k, t]) => `<button data-scroll="${k}">${t}</button>`).join('')}</div></div>

  <section class="sec" id="learn"><div class="wrap">
    ${head('Навыки', 'Чему вы научитесь')}
    <ul class="learn">${C.skills.map(t => `<li><span class="tick">${ic('check', 16)}</span><span>${T(t)}</span></li>`).join('')}</ul>
    <h3 style="margin:48px 0 16px;font-size:20px">Кому подойдёт курс</h3>
    <div class="persona">
      <div class="tile"><b>01</b><h3>Новичкам</h3><p>Начнёте с самых основ, без сложных терминов. Опыт не нужен.</p></div>
      <div class="tile"><b>02</b><h3>Школьникам и студентам</h3><p>Уроки короткие, их удобно совмещать с учёбой.</p></div>
      <div class="tile"><b>03</b><h3>Тем, кто хочет сменить сферу</h3><p>Соберёте портфолио и поймёте, нравится ли вам это дело.</p></div>
    </div>
  </div></section>

  <section class="sec grid-paper band" id="program"><div class="wrap">
    ${head('Программа', C.modules.length + ' ' + plural(C.modules.length, ['модуль', 'модуля', 'модулей']) + ', ' + nLessons + ' ' + plural(nLessons, ['урок', 'урока', 'уроков']), 'Нажмите на модуль, чтобы увидеть темы уроков. Первый урок можно посмотреть бесплатно.')}
    ${C.modules.map((m, i) => `<details class="mod"${i === 0 ? ' open' : ''}><summary><span class="mod-n">М${i + 1}</span><h4>${T(m.t)}</h4><small>${m.ls.length} ${plural(m.ls.length, ['урок', 'урока', 'уроков'])}</small></summary>
      <ol>${m.ls.map((l, j) => `<li><span class="k">${i + 1}.${j + 1}</span><span class="t">${T(l[0])}</span>${i === 0 && j === 0 ? `<button class="link" data-act="video" data-v="${esc(l[0])}" style="font-size:13px">Смотреть</button>` : ''}<span class="type">${l[1]}</span></li>`).join('')}</ol></details>`).join('')}
  </div></section>

  <section class="sec" id="result"><div class="wrap result">
    <div><span class="eyebrow">Результат</span><h2 style="margin:10px 0 18px">После курса у вас будет</h2>
      <ul class="plain" style="display:grid;gap:12px">
        ${['Итоговый проект, который можно показать в портфолио', 'Сертификат школы с перечнем навыков', 'Записи всех занятий, доступ остаётся на [срок]', 'Контакты одногруппников и преподавателей'].map(t => `<li style="display:flex;gap:12px"><span class="tick">${ic('check', 16)}</span><span>${T(t)}</span></li>`).join('')}
      </ul>
      <h3 style="margin:32px 0 12px;font-size:18px">Ведёт курс</h3>
      <button class="me" style="max-width:440px;width:100%;cursor:pointer;text-align:left" data-act="teacher" data-v="0"><span class="ava-s ${d.cls}" style="width:56px;height:56px">${esc(initials(C.teachers[0].name))}</span><span><b>${T(C.teachers[0].name)}</b><small>${T(C.teachers[0].role)}, ${T(C.teachers[0].exp)}</small></span></button>
    </div>
    ${certHtml(c)}
  </div></section>

  <section class="sec grid-paper band" id="tariffs"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Стоимость</span><h2>Выберите тариф</h2><p>Первый урок в любом тарифе бесплатный. Тариф можно сменить в первую неделю.</p></div>
      <div class="switch" role="group" aria-label="Способ оплаты"><button class="${S.priceMode === 'split' ? 'on' : ''}" data-act="pmode" data-v="split">В рассрочку</button><button class="${S.priceMode === 'full' ? 'on' : ''}" data-act="pmode" data-v="full">Сразу −${disc()}%</button></div></div>
    <div class="tariffs">${C.tariffs.map(t => `<div class="tariff ${t.popular ? 'pop' : ''}"><div><h3>${esc(t.name)}</h3><p class="muted" style="font-size:14px;margin-top:4px">${esc(t.note)}</p></div>
      ${tariffAmount(c, t)}
      <ul>${t.feats.map(([y, f]) => `<li class="${y ? '' : 'no'}"><span style="color:${y ? 'var(--ok)' : 'var(--muted)'}">${ic(y ? 'check' : 'x', 18)}</span><span>${T(f)}</span></li>`).join('')}</ul>
      <button class="btn ${t.popular ? 'btn-primary' : 'btn-ghost'} btn-block" data-act="buy" data-v="${t.id}">Выбрать «${esc(t.name)}»</button></div>`).join('')}</div>
  </div></section>

  <section class="sec" id="c-reviews"><div class="wrap">${head('Отзывы', 'Выпускники курса')}${reviewsBlock(2)}</div></section>
  <section class="sec" id="c-faq" style="padding-top:0"><div class="wrap">${head('FAQ', 'Вопросы о курсе')}${faqBlock()}</div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta"><div><h2>Начните с бесплатного урока</h2><p>Посмотрите, как устроены занятия, и решите, подходит ли вам курс.</p></div><div class="btns"><button class="btn btn-mark" data-act="trial" data-v="${c.id}">Получить пробный урок</button><button class="btn btn-line" data-scroll="tariffs">К тарифам</button></div></div></div></section>
  <div class="buybar"><div><small>${esc(plain(c.title))}</small><b>от ${T(priceM('base'))} ₽/мес</b></div><button class="btn btn-primary btn-sm" data-scroll="tariffs">Записаться</button></div>`;
}
function certHtml(c, name) {
  return `<div class="cert" aria-label="Пример сертификата"><div><span class="eyebrow">Сертификат · ${esc(plain(C.school.name))}</span><h3 style="margin-top:12px;font-size:clamp(18px,3vw,24px)">${T(name || '[Имя ученика]')}</h3><p class="muted" style="font-size:14px;margin-top:6px">успешно окончил(а) курс «${T(c.title)}» и защитил(а) итоговый проект</p></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px"><span class="muted" style="font:500 12px var(--f-mono)">№ ${T('[0000]')} · ${dShort(addD(c.months * 30, START))}</span><span class="seal">${ic('award', 30)}</span></div></div>`;
}

/* оформление */
function sums(c, t) {
  const tot = total(c, t.id), m = monthly(t.id), p = S.promo / 100;
  if (S.plan === 'full') {
    const f = fullPay(c, t.id);
    return { tot, discount: tot == null ? null : tot - f, promo: f == null ? null : f * p, pay: f == null ? null : f * (1 - p), per: '' };
  }
  return { tot, discount: 0, promo: m == null ? null : m * p, pay: m == null ? null : m * (1 - p), per: '/мес' };
}
function pCheckout() {
  const c = courseById(S.course), t = tariffById(S.tariff);
  if (S.step === 4) return pSuccess(c, t);
  const s = sums(c, t);
  const payTxt = S.plan === 'full' ? rub(s.pay, '[итог]') : rub(s.pay, '[цена ' + TNUM[t.id] + ']') + '/мес';
  let body = '';
  if (S.step === 1) {
    body = `<div class="panel"><h2>Выберите тариф</h2><p class="muted">Тариф можно сменить в течение первой недели обучения.</p>
      <div class="radios">${C.tariffs.map(x => `<label class="radio"><input type="radio" name="tariff" value="${x.id}"${x.id === S.tariff ? ' checked' : ''} data-act="tariff"><span class="rt"><b>${esc(x.name)}</b>${x.popular ? ' <span class="badge" style="margin-left:6px">Популярный</span>' : ''}<small>${esc(x.note)}</small></span><span class="rp">${T(priceM(x.id))} ₽/мес</span></label>`).join('')}</div>
      <div class="co-actions"><a class="btn btn-ghost" href="#course-${c.id}">${ic('left', 18)} К курсу</a><button class="btn btn-primary" data-act="step" data-v="2">Дальше ${ic('arrow', 18)}</button></div></div>`;
  } else if (S.step === 2) {
    body = `<div class="panel"><h2>Ваши данные</h2><p class="muted">Нужны, чтобы создать личный кабинет и прислать чек.</p>
      <form data-form="contacts" novalidate><div class="form-grid">
        <div class="field full"><label>Кто будет учиться?</label><div class="seg" style="margin:0">${[['me', 'Я сам(а)'], ['child', 'Мой ребёнок']].map(([v, l]) => `<button type="button" class="${S.who === v ? 'on' : ''}" data-act="who" data-v="${v}">${l}</button>`).join('')}</div></div>
        <div class="field full"><label for="f-name">Имя и фамилия${S.who === 'child' ? ' ученика' : ''}</label><input id="f-name" name="name" value="${esc(S.form.name)}" placeholder="Например, Анна Иванова" autocomplete="name"><span class="err" hidden>Введите имя</span></div>
        <div class="field"><label for="f-email">Почта</label><input id="f-email" name="email" type="email" value="${esc(S.form.email)}" placeholder="name@example.com" autocomplete="email"><span class="err" hidden>Проверьте адрес почты</span></div>
        <div class="field"><label for="f-phone">Телефон</label><input id="f-phone" name="phone" type="tel" value="${esc(S.form.phone)}" placeholder="+7 (___) ___-__-__" autocomplete="tel"></div>
        ${S.who === 'child' ? `<div class="field full"><label for="f-parent">Почта родителя для отчётов</label><input id="f-parent" type="email" placeholder="parent@example.com"></div>` : ''}
      </div>
      <div class="co-actions"><button type="button" class="btn btn-ghost" data-act="step" data-v="1">${ic('left', 18)} Назад</button><button class="btn btn-primary" type="submit">К оплате ${ic('arrow', 18)}</button></div></form></div>`;
  } else {
    body = `<div class="panel"><h2>Как удобнее оплатить?</h2><p class="muted">Это макет: деньги не списываются, данные никуда не отправляются.</p>
      <div class="radios">${[['split', 'Рассрочка без переплаты', c.months + ' ' + plural(c.months, ['платёж', 'платежа', 'платежей']) + ', первый сегодня', priceM(t.id) + ' ₽/мес'], ['full', 'Сразу всю сумму', 'Скидка ' + disc() + '% при полной оплате', rub(fullPay(c, t.id), '[сумма]')]].map(([v, a, b, p]) => `<label class="radio"><input type="radio" name="plan" value="${v}"${S.plan === v ? ' checked' : ''} data-act="plan"><span class="rt"><b>${a}</b><small>${b}</small></span><span class="rp">${T(p)}</span></label>`).join('')}</div>
      <h3 style="margin:24px 0 0;font-size:16px">Способ оплаты</h3>
      <div class="radios">${[['card', 'Банковская карта', 'card'], ['sbp', 'СБП, по QR-коду', 'target'], ['gift', 'Подарочный сертификат', 'gift']].map(([v, l, i]) => `<label class="radio"><input type="radio" name="pay" value="${v}"${S.pay === v ? ' checked' : ''} data-act="pay"><span style="color:var(--brand)">${ic(i)}</span><span class="rt"><b>${l}</b></span></label>`).join('')}</div>
      <div class="pay-box">${ic('lock', 22)}<span>Здесь откроется защищённая форма ${T('[платёжного сервиса]')}. Школа не хранит данные карт.</span></div>
      <div class="co-actions"><button class="btn btn-ghost" data-act="step" data-v="2">${ic('left', 18)} Назад</button><button class="btn btn-primary" data-act="pay-now">Оплатить ${T(payTxt)}</button></div></div>`;
  }
  return `<div class="wrap" style="padding-top:28px"><div class="crumbs"><a href="#home">Главная</a><span>/</span><a href="#course-${c.id}">${T(c.title)}</a><span>/</span><span>Оформление</span></div><h1 style="font-size:clamp(24px,3vw,34px)">Запись на курс</h1></div>
  <div class="wrap co"><div>
    <div class="stepper">${['Тариф', 'Ваши данные', 'Оплата'].map((x, i) => `<div class="${S.step === i + 1 ? 'on' : ''} ${S.step > i + 1 ? 'done' : ''}"><i>${S.step > i + 1 ? ic('check', 14) : i + 1}</i>${x}</div>`).join('')}</div>
    ${body}
  </div>
  <aside class="summary"><div class="panel">
    <span class="eyebrow">Ваш заказ</span>
    <div style="display:flex;gap:12px;align-items:center;margin:14px 0 18px"><span class="ava-s ${dirOf(c).cls}" style="border-radius:10px">${esc(dirOf(c).g)}</span><div style="min-width:0"><b>${T(c.title)}</b><small class="muted" style="display:block;font-size:13px">${mon(c.months)} · старт ${dLong(START)}</small></div></div>
    <div style="display:grid;gap:10px">
      <div class="sum-row"><span class="muted">Тариф</span><span>${esc(t.name)}</span></div>
      <div class="sum-row"><span class="muted">Стоимость курса</span><span>${T(rub(s.tot, '[полная цена]'))}</span></div>
      ${S.plan === 'full' ? `<div class="sum-row" style="color:var(--ok)"><span>Скидка ${disc()}%</span><span>−${T(rub(s.discount, '[скидка]'))}</span></div>` : ''}
      ${S.promo ? `<div class="sum-row" style="color:var(--ok)"><span>Промокод −${S.promo}%</span><span>−${T(rub(s.promo, '[скидка]'))}</span></div>` : ''}
      <div class="sum-row total"><span>${S.plan === 'full' ? 'Итого' : 'Платёж в месяц'}</span><span>${T(payTxt)}</span></div>
    </div>
    <div class="promo" style="margin-top:16px"><input id="promo" placeholder="Промокод" aria-label="Промокод" value="${S.promo ? esc(C.pricing.promo.code) : ''}"><button class="btn btn-ghost btn-sm" data-act="promo">Применить</button></div>
    <p class="hint" style="margin-top:8px">Для проверки введите ${esc(C.pricing.promo.code)}</p>
  </div>
  <div class="card" style="display:flex;gap:12px;font-size:14px"><span style="color:var(--ok)">${ic('check')}</span><span>Если курс не подойдёт, вернём деньги за непройденные уроки. ${T('[условия]')}</span></div>
  </aside></div>`;
}
function pSuccess(c, t) {
  return `<div class="wrap"><div class="success">
    <div class="big">${ic('check', 44)}</div>
    <h1 style="font-size:clamp(26px,4vw,40px)">Вы записаны на курс!</h1>
    <p class="muted" style="font-size:17px">«${T(c.title)}», тариф «${esc(t.name)}». Чек и доступы отправили на почту <span class="ph">${esc(S.form.email || '[почта]')}</span>.</p>
    <div class="next-list">
      <div><span class="date-box"><b>${TODAY.getDate()}</b><small>${MON[TODAY.getMonth()]}</small></span><span><b>Сегодня</b><br><span class="muted">Откройте первый урок в личном кабинете</span></span></div>
      <div><span class="date-box"><b>${addD(1).getDate()}</b><small>${MON[addD(1).getMonth()]}</small></span><span><b>Завтра</b><br><span class="muted">Наставник напишет вам в чат и познакомится</span></span></div>
      <div><span class="date-box"><b>${START.getDate()}</b><small>${MON[START.getMonth()]}</small></span><span><b>Старт потока</b><br><span class="muted">Первый вебинар, ссылка появится в расписании</span></span></div>
    </div>
    <a class="btn btn-primary" href="#cabinet">Перейти в личный кабинет ${ic('arrow', 18)}</a>
  </div></div>`;
}

/* вход */
function pLogin(back) {
  const code = S.authStep === 'code';
  return `<div class="wrap"><div class="auth">
    <div style="text-align:center;margin-bottom:22px"><span class="logo-mark" style="margin:0 auto 16px;width:52px;height:52px;font-size:22px">${esc(C.school.letter)}</span><h1 style="font-size:28px">${code ? 'Введите код' : 'Вход в личный кабинет'}</h1>
      <p class="muted" style="margin-top:8px">${code ? 'Отправили 4-значный код на ' + esc(S.authEmail) + '. В макете подойдёт любой.' : back && back !== 'login' ? 'Войдите, чтобы открыть кабинет ученика.' : 'Без пароля: пришлём код на почту.'}</p></div>
    <div class="panel">
    ${code ? `<form data-form="code" novalidate style="display:grid;gap:16px;justify-items:center"><div class="code">${[0, 1, 2, 3].map(i => `<input id="code-${i}" inputmode="numeric" maxlength="1" aria-label="Цифра ${i + 1}" autocomplete="one-time-code">`).join('')}</div>
        <button class="btn btn-primary btn-block" type="submit">Войти</button><button type="button" class="link" data-act="auth-back">Изменить почту</button></form>`
      : `<form data-form="email" novalidate style="display:grid;gap:14px"><div class="field"><label for="auth-email">Почта</label><input id="auth-email" type="email" placeholder="name@example.com" autocomplete="email" value="${esc(S.authEmail)}"><span class="err" hidden>Проверьте адрес почты</span></div>
        <button class="btn btn-primary btn-block" type="submit">Получить код</button></form>
        <div class="or">или</div>
        <button class="btn btn-ghost btn-block" data-act="demo-login">${ic('user', 18)} Войти как демо-ученик</button>`}
    </div>
    <p class="hint" style="text-align:center;margin-top:14px">Ещё не учитесь? <a class="link" href="#catalog">Выберите курс</a></p>
  </div></div>`;
}

/* ================= кабинет ================= */
const CAB_TABS = [['cabinet', 'Главная', 'home'], ['cabinet-schedule', 'Расписание', 'cal'], ['cabinet-lessons', 'Уроки', 'book'], ['cabinet-homework', 'Задания', 'doc'], ['cabinet-chat', 'Чат', 'chat'], ['cabinet-progress', 'Прогресс', 'chart']];
function cabShell(r, inner) {
  const c = myCourse(), n = hwOpenCount();
  return `<div class="wrap cab">
    <aside class="side">
      <div class="me"><span class="ava-s d-c">${esc(initials(S.user.name))}</span><span><b>${T(S.user.name)}</b><small>${T(c.title)}</small></span></div>
      <nav aria-label="Личный кабинет">${CAB_TABS.map(([h, l, i]) => `<a href="#${h}" class="${r === h ? 'on' : ''}">${ic(i)}${l}${h === 'cabinet-homework' && n ? `<span class="cnt">${n}</span>` : ''}</a>`).join('')}</nav>
      <a class="btn btn-ghost btn-sm" href="#catalog">Другие курсы</a>
      <button class="link" style="justify-self:start;padding:6px 12px;color:var(--muted)" data-act="logout"><span style="display:inline-flex;gap:8px;align-items:center">${ic('out', 16)} Выйти</span></button>
    </aside>
    <div style="min-width:0">${inner}</div>
  </div>
  <nav class="tabbar" aria-label="Личный кабинет">${CAB_TABS.map(([h, l, i]) => `<a href="#${h}" class="${r === h ? 'on' : ''}">${ic(i, 22)}${l}${h === 'cabinet-homework' && n ? `<span class="cnt">${n}</span>` : ''}</a>`).join('')}</nav>`;
}
function weekDays(off) { return [0, 1, 2, 3, 4, 5, 6].map(i => { const d = addD(i + off * 7, MONDAY); return { d, i, ev: (PATTERN[i] || []).map(e => Object.assign({}, e)) }; }); }
function nextEvent() {
  for (let k = 0; k < 14; k++) { const d = addD(k); const ev = (PATTERN[wd(d)] || []).find(e => e.c === 'ev-live' || e.c === 'ev-cons'); if (ev) return { d, ev, k }; }
  return null;
}
const dayWord = k => k === 0 ? 'Сегодня' : k === 1 ? 'Завтра' : WDF[wd(addD(k))].replace(/^./, s => s.toUpperCase()) + ', ' + dShort(addD(k));
function pCabinet() {
  const c = myCourse(), ne = nextEvent(), cur = curLesson(), p = pct();
  const dl = S.hw.filter(h => h.st !== 'ok').sort((a, b) => a.due - b.due).slice(0, 3);
  const fix = S.hw.find(h => h.st === 'fix');
  const first = S.user.name.split(' ')[0];
  return `<span class="eyebrow">${WDF[wd(TODAY)]}, ${dLong(TODAY)}</span><h1 style="margin-top:8px">Привет, ${T(first)}!</h1>
  <p class="muted" style="margin-top:6px">Вы на ${cur.m}-м модуле курса «${T(c.title)}». ${p >= 100 ? 'Курс пройден, поздравляем!' : 'Так держать: 5 дней подряд без пропусков.'}</p>
  <div class="cab-grid">
    <div class="card next-lesson c-8"><span class="eyebrow">${ic('clock', 14)} ${ne ? dayWord(ne.k) + ' · ' + ne.ev.tm.split(' · ')[0] : 'Скоро'}</span><h2>${ne ? T(ne.ev.t) : 'Ближайших занятий нет'}</h2><p style="opacity:.85">Ссылка станет активной за 10 минут до начала. Запись появится в разделе «Уроки».</p>
      <div class="btns"><button class="btn btn-mark" data-act="join">Подключиться</button><a class="btn btn-line" href="#lesson-${cur.key}">${p >= 100 ? 'Повторить уроки' : 'Продолжить урок ' + cur.m + '.' + cur.l}</a></div></div>
    <div class="card c-4" style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center">${ring(p)}<div><b>${S.done.size} из ${LESSONS.length} уроков</b><p class="muted" style="font-size:14px">По плану закончите ${dLong(addD(c.months * 30, START))}</p></div><a class="btn btn-ghost btn-sm" href="#cabinet-progress">Подробнее</a></div>
    <div class="card c-6"><div class="card-h"><h3>Ближайшие дедлайны</h3><a class="link" href="#cabinet-homework">Все задания</a></div>
      <div class="list">${dl.length ? dl.map(h => { const d = addD(h.due); return `<button class="li" data-act="open-hw" data-v="${h.id}"><span class="date-box"><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small></span><span class="grow"><b>${T(h.t)}</b><small>Модуль ${h.m}${h.due < 0 && h.st !== 'review' ? ' · <span style="color:var(--bad)">срок прошёл</span>' : ''}</small></span><span class="pill ${HW_ST[h.st][1]}">${HW_ST[h.st][0]}</span></button>`; }).join('') : '<p class="muted">Все задания сданы!</p>'}</div></div>
    <div class="card c-6">${fix ? `<div class="card-h"><h3>Комментарий наставника</h3><span class="pill p-bad">Доработать</span></div>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><span class="ava-s d-a">НС</span><span><b style="font-size:15px">${T('[Имя наставника]')}</b><small class="muted" style="display:block;font-size:13px">к заданию «${T(fix.t)}»</small></span></div>
      <div class="feedback">${esc(fix.fb)}</div>
      <div class="btns" style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-act="open-hw" data-v="${fix.id}">Открыть задание</button><a class="btn btn-ghost btn-sm" href="#cabinet-chat">${ic('chat', 16)} Написать</a></div>`
      : `<div class="card-h"><h3>Серия занятий</h3><span class="pill p-warn">${ic('fire', 14)} 5 дней</span></div><p class="muted" style="font-size:14px">Занимайтесь хотя бы 15 минут в день, чтобы не прерывать серию.</p>
      <div class="streak">${[6, 5, 4, 3, 2, 1, 0].map(k => `<i class="${k < 5 ? 'on' : ''}">${WD[wd(addD(-k))]}</i>`).join('')}</div>`}</div>
    <div class="card c-12"><div class="card-h"><h3>Эта неделя</h3><a class="link" href="#cabinet-schedule">Полное расписание</a></div>
      <div class="list">${weekDays(0).flatMap(d => d.ev.filter(e => e.c !== 'ev-self').map(e => `<div class="li" style="${d.d < TODAY ? 'opacity:.55' : ''}"><span class="date-box"><b>${d.d.getDate()}</b><small>${WD[d.i]}</small></span><span class="grow"><b>${T(e.t)}</b><small>${e.tm}</small></span>${sameDay(d.d, TODAY) ? '<span class="pill p-warn">Сегодня</span>' : d.d < TODAY ? '<span class="pill p-mute">Прошло</span>' : ''}</div>`)).join('')}</div></div>
  </div>`;
}
function pSchedule() {
  const days = weekDays(S.weekOff);
  const a = days[0].d, b = days[6].d;
  return `<h1>Расписание</h1>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px">
    <div><b style="font-family:var(--f-display)">${a.getDate()} ${a.getMonth() !== b.getMonth() ? MONF[a.getMonth()] : ''} — ${dLong(b)}</b>${S.weekOff === 0 ? ' <span class="pill p-info">эта неделя</span>' : ''}</div>
    <div class="btns"><button class="btn btn-ghost btn-sm" data-act="week" data-v="-1" aria-label="Прошлая неделя">${ic('left', 16)}</button><button class="btn btn-ghost btn-sm" data-act="week" data-v="0">Сегодня</button><button class="btn btn-ghost btn-sm" data-act="week" data-v="1" aria-label="Следующая неделя">${ic('arrow', 16)}</button></div>
  </div>
  <div class="legend" style="margin-top:12px"><span><i style="background:var(--d-a)"></i>Вебинар</span><span><i style="background:var(--d-c)"></i>Консультация</span><span><i style="background:var(--bad-bg)"></i>Дедлайн</span><span><i style="background:var(--soft)"></i>Новый урок</span></div>
  <div class="week">${days.map(d => `<div class="day ${sameDay(d.d, TODAY) ? 'today' : ''} ${d.d < TODAY ? 'past' : ''}"><div class="day-h"><span>${WD[d.i]}${sameDay(d.d, TODAY) ? ' · сегодня' : ''}</span><b>${d.d.getDate()}</b></div>
    ${d.ev.length ? d.ev.map(e => `<button class="ev ${e.c}" data-act="event" data-v="${d.i}|${S.weekOff}"><time>${e.tm}</time>${T(e.t)}</button>`).join('') : '<span class="muted empty-day" style="font-size:13px">Свободный день</span>'}</div>`).join('')}</div>
  <div class="card" style="margin-top:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span style="color:var(--brand)">${ic('cal', 24)}</span><span style="flex:1;min-width:200px">Добавьте расписание в свой календарь, чтобы получать напоминания о вебинарах.</span><button class="btn btn-ghost btn-sm" data-act="cal">Подключить календарь</button></div>`;
}
function lessonRow(l, active) {
  const st = lessonState(l.key), cls = st === 'done' ? 'st-done' : st === 'cur' ? 'st-cur' : 'st-lock', icon = st === 'done' ? 'check' : st === 'cur' ? 'play' : 'lock';
  const inner = `<span class="st ${cls}">${ic(icon, 15)}</span><span style="flex:1;min-width:0;font-size:${active === undefined ? 15 : 14}px;font-weight:${st === 'cur' || active ? 700 : 500}">${l.m}.${l.l} ${T(l.t)}</span>${active === undefined ? `<span class="type">${l.type}</span>` : ''}`;
  return st === 'lock' ? `<button class="lesson-row locked" data-act="locked" style="width:100%;background:none;border:0;text-align:left">${inner}</button>` : `<a class="lesson-row" href="#lesson-${l.key}" style="${active ? 'background:var(--soft)' : ''}">${inner}</a>`;
}
function pLessons() {
  const cm = curLesson().m;
  return `<h1>Уроки</h1><p class="muted" style="margin-top:6px">Уроки открываются по порядку: следующий станет доступен, когда вы отметите текущий пройденным.</p>
  <div style="display:grid;gap:12px;margin-top:20px">${C.modules.map((m, i) => { const mi = i + 1, ls = LESSONS.filter(l => l.m === mi), d = ls.filter(l => S.done.has(l.key)).length;
    return `<details class="mod"${mi === cm ? ' open' : ''}><summary><span class="mod-n">М${mi}</span><span style="min-width:0"><h4>${T(m.t)}</h4><span class="bar" style="display:block;margin-top:8px;max-width:260px"><i style="width:${d / ls.length * 100}%"></i></span></span><small>${d === ls.length ? '<span class="pill p-ok">Пройден</span>' : d + '/' + ls.length}</small></summary>
      <div style="padding:0 8px 10px">${ls.map(l => lessonRow(l)).join('')}</div></details>`; }).join('')}</div>`;
}
function pHomework() {
  const f = S.hwFilter, list = S.hw.filter(h => f === 'all' || h.st === f);
  return `<h1>Домашние задания</h1><p class="muted" style="margin-top:6px">Наставник проверяет работы в течение ${T('[24 часов]')}. Нажмите на задание, чтобы сдать его или посмотреть отзыв.</p>
  <div class="seg">${[['all', 'Все'], ['todo', 'Нужно сдать'], ['fix', 'Доработать'], ['review', 'На проверке'], ['ok', 'Принято']].map(([v, l]) => `<button class="${f === v ? 'on' : ''}" data-act="hwf" data-v="${v}">${l} <span class="muted">${v === 'all' ? S.hw.length : S.hw.filter(h => h.st === v).length}</span></button>`).join('')}</div>
  <div class="hw-list">${list.length ? list.map(h => `<button class="hw" data-act="open-hw" data-v="${h.id}"><span style="min-width:0"><b>${T(h.t)}</b><br><small>Модуль ${h.m} · срок ${dShort(addD(h.due))}${h.grade ? ' · оценка ' + h.grade : ''}</small></span><span class="pill ${HW_ST[h.st][1]}">${HW_ST[h.st][0]}</span></button>`).join('') : '<div class="empty">Здесь пока пусто.</div>'}</div>`;
}
function pChat() {
  let lastD = null;
  const msgs = S.chat.map(m => { let sep = ''; if (m.d !== lastD) { lastD = m.d; sep = `<span class="msg-day">${m.d === 0 ? 'Сегодня' : m.d === -1 ? 'Вчера' : dLong(addD(m.d))}</span>`; } return sep + `<div class="msg ${m.me ? 'me' : 'them'}">${T(m.t)}<time>${m.tm}</time></div>`; }).join('');
  return `<h1>Чат с наставником</h1>
  <div class="chat"><div class="chat-h"><span class="ava-s d-a">НС</span><span><b>${T('[Имя наставника]')}</b><small>● онлайн, отвечает в течение дня</small></span></div>
    <div class="msgs" id="msgs">${msgs}${S.typing ? '<div class="typing" aria-label="Наставник печатает"><i></i><i></i><i></i></div>' : ''}</div>
    <div><div class="quick">${['Не понимаю задание', 'Можно перенести дедлайн?', 'Спасибо за проверку!'].map(q => `<button data-act="quick" data-v="${q}">${q}</button>`).join('')}</div>
    <form class="chat-in" data-form="chat" novalidate><input id="chat-text" placeholder="Напишите сообщение" autocomplete="off" aria-label="Сообщение"><button class="btn btn-primary" type="submit" aria-label="Отправить" style="padding:10px 14px">${ic('send', 20)}</button></form></div>
  </div>`;
}
function achievements() {
  const okHw = S.hw.filter(h => h.st === 'ok').length, m1 = LESSONS.filter(l => l.m === 1).every(l => S.done.has(l.key));
  return [['Первый урок', 'play', S.done.size > 0], ['Первое ДЗ на «5»', 'star', okHw > 0], ['5 дней подряд', 'fire', true], ['Модуль без долгов', 'check', m1 && okHw > 0], ['Половина курса', 'target', pct() >= 50], ['Итоговый проект', 'award', pct() >= 100]];
}
function pProgress() {
  const p = pct(), ach = achievements(), got = ach.filter(a => a[2]).length;
  return `<h1>Мой прогресс</h1>
  <div class="cab-grid">
    <div class="card c-4" style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">${ring(p, 150)}<b>Курс пройден на ${p}%</b><p class="muted" style="font-size:14px">${p >= 100 ? 'Всё пройдено!' : 'Вы идёте по плану'}</p></div>
    <div class="card c-8"><div class="stats">
      <div class="stat"><b>${S.done.size}</b><small>${plural(S.done.size, ['урок пройден', 'урока пройдено', 'уроков пройдено'])}</small></div>
      <div class="stat"><b>${S.hw.filter(h => h.st === 'ok').length}/${S.hw.length}</b><small>заданий принято</small></div>
      <div class="stat"><b>4,8</b><small>средняя оценка</small></div>
      <div class="stat"><b style="display:flex;align-items:center;gap:6px">5 <span style="color:var(--warn)">${ic('fire', 22)}</span></b><small>дней подряд</small></div>
    </div>
    <h3 style="margin:22px 0 14px;font-size:16px">По модулям</h3>
    <div class="modbars">${C.modules.map((m, i) => { const ls = LESSONS.filter(l => l.m === i + 1), pp = Math.round(ls.filter(l => S.done.has(l.key)).length / ls.length * 100); return `<div class="modbar"><span>М${i + 1}. ${esc(plain(m.t))}</span><span class="bar"><i style="width:${pp}%"></i></span><span>${pp}%</span></div>`; }).join('')}</div></div>
    <div class="card c-12"><div class="card-h"><h3>Достижения</h3><span class="muted" style="font-size:14px">${got} из ${ach.length}</span></div>
      <div class="ach">${ach.map(([t, i, g]) => `<div class="${g ? 'got' : ''}"><span class="medal">${ic(g ? i : 'lock', 22)}</span>${t}</div>`).join('')}</div></div>
    <div class="card c-12" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><span style="width:56px;height:56px;border-radius:50%;background:${p >= 100 ? 'var(--mark)' : 'var(--soft)'};color:${p >= 100 ? 'var(--on-mark)' : 'var(--muted)'};display:grid;place-items:center;flex:none">${ic(p >= 100 ? 'award' : 'lock', 24)}</span>
      <div style="flex:1;min-width:220px"><b>Сертификат</b><p class="muted" style="font-size:14px">${p >= 100 ? 'Готов! Его можно открыть и показать.' : 'Откроется после защиты итогового проекта в модуле ' + C.modules.length + '.'}</p></div>
      <button class="btn ${p >= 100 ? 'btn-primary' : 'btn-ghost'} btn-sm" data-act="cert">${p >= 100 ? 'Открыть сертификат' : 'Посмотреть пример'}</button></div>
    <div class="card c-12" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="hint" style="flex:1;min-width:220px">Это демо-прогресс. Его можно вернуть к исходному состоянию.</span><button class="btn btn-ghost btn-sm" data-act="reset-demo">Сбросить демо-прогресс</button></div>
  </div>`;
}
function pLesson(key) {
  let l = LESSONS.find(x => x.key === key) || curLesson();
  if (lessonState(l.key) === 'lock') l = curLesson();
  const idx = LESSONS.indexOf(l), prev = LESSONS[idx - 1], next = LESSONS[idx + 1], mod = C.modules[l.m - 1], st = lessonState(l.key);
  const tab = S.lessonTab;
  let content;
  if (tab === 'notes') content = `<div class="prose"><p>${T('[Краткий конспект урока: основные мысли, определения и примеры. Ученик может вернуться к нему в любой момент.]')}</p><ul><li>${T('[Главная мысль 1]')}</li><li>${T('[Главная мысль 2]')}</li><li>${T('[Главная мысль 3]')}</li></ul><div class="note"><b>Совет наставника.</b> Посмотрите урок целиком, а потом попробуйте повторить пример сами, не подглядывая.</div></div>`;
  else if (tab === 'files') content = `<div class="list" style="max-width:560px">${['Презентация урока (PDF)', 'Шаблон для практики', 'Дополнительное чтение'].map(f => `<div class="li"><span style="color:var(--brand)">${ic('doc')}</span><span class="grow"><b>${f}</b><small>${T('[описание материала]')}</small></span><button class="btn btn-ghost btn-sm" data-act="file">Открыть</button></div>`).join('')}</div>`;
  else { const h = S.hw.find(x => x.les === l.key) || S.hw.find(x => x.m === l.m && x.st !== 'ok') || S.hw[0]; content = `<div class="prose"><p><b>Задание к уроку.</b> ${T('[Что нужно сделать после урока и как сдать работу.]')}</p></div><button class="btn btn-primary" style="margin-top:16px" data-act="open-hw" data-v="${h.id}">Открыть задание</button>`; }
  return `<div class="wrap" style="padding-top:20px"><div class="crumbs"><a href="#cabinet">Кабинет</a><span>/</span><a href="#cabinet-lessons">Уроки</a><span>/</span><span>Модуль ${l.m}</span></div></div>
  <div class="wrap lesson-grid"><div style="min-width:0">
    <div class="player" id="player"><span class="pl-title">${l.m}.${l.l} · ${esc(plain(l.t))}</span><div class="wave">${Array.from({ length: 14 }, (_, i) => `<i style="height:${16 + (i * 37 % 40)}px;animation-delay:${(i * .07).toFixed(2)}s"></i>`).join('')}</div><button class="big-play" data-act="play" aria-label="Смотреть урок">${ic('play', 34)}</button><div class="pbar"><span>00:00</span><span class="bar"><i style="width:${st === 'done' ? 100 : 4}%"></i></span><span>13:05</span></div></div>
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-top:20px"><div style="min-width:0"><span class="eyebrow">Урок ${l.m}.${l.l} · ${l.type}</span><h1 style="font-size:clamp(22px,3vw,30px);margin-top:8px">${T(l.t)}</h1></div>
      ${st === 'done' ? `<span class="pill p-ok" style="padding:8px 14px">${ic('check', 16)} Пройден</span>` : `<button class="btn btn-primary btn-sm" data-act="done-lesson" data-v="${l.key}">${ic('check', 16)} Отметить пройденным</button>`}</div>
    <div class="tabs" role="tablist">${[['notes', 'Конспект'], ['files', 'Материалы'], ['task', 'Задание']].map(([k, t]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="ltab" data-v="${k}">${t}</button>`).join('')}</div>
    ${content}
    <div class="co-actions" style="border-top:1px solid var(--line);padding-top:20px;margin-top:32px">${prev ? `<a class="btn btn-ghost" href="#lesson-${prev.key}">${ic('left', 18)} Предыдущий</a>` : '<span></span>'}${next ? (lessonState(next.key) === 'lock' ? `<button class="btn btn-ghost" data-act="locked">${ic('lock', 16)} Следующий урок</button>` : `<a class="btn btn-primary" href="#lesson-${next.key}">Следующий урок ${ic('arrow', 18)}</a>`) : ''}</div>
  </div>
  <aside class="card"><div class="card-h"><h3>Модуль ${l.m}</h3><small class="muted">${LESSONS.filter(x => x.m === l.m && S.done.has(x.key)).length}/${mod.ls.length}</small></div><p class="muted" style="font-size:14px;margin:-6px 0 10px">${T(mod.t)}</p>
    ${LESSONS.filter(x => x.m === l.m).map(x => lessonRow(x, x.key === l.key)).join('')}
    <a class="btn btn-ghost btn-sm btn-block" style="margin-top:12px" href="#cabinet-chat">${ic('chat', 16)} Задать вопрос наставнику</a>
  </aside></div>`;
}

/* о школе, 404 */
function pAbout() {
  const sc = C.school;
  return `<section class="sec grid-paper" style="padding-block:56px"><div class="wrap about-hero">
    <div><div class="crumbs"><a href="#home">Главная</a><span>/</span><span>О школе</span></div><span class="eyebrow">О нас</span><h1 style="margin:14px 0 16px">Учим так, чтобы ученики доходили до конца</h1>
      <p class="hero-lead">${T('[История школы: кто её основал, зачем и чем она отличается от других. 2–3 предложения.]')}</p>
      <div class="btns"><a class="btn btn-primary" href="#catalog">Выбрать курс</a><button class="btn btn-ghost" data-scroll="contacts">Контакты</button></div></div>
    <div class="numbers"><div><b>${T(sc.students)}</b><span>учеников</span></div><div><b>${T(sc.rating)}</b><span>средняя оценка</span></div><div><b>${C.courses.length}</b><span>${plural(C.courses.length, ['курс', 'курса', 'курсов'])}</span></div><div><b>${C.teachers.length}</b><span>преподавателя</span></div></div>
  </div></section>
  <section class="sec"><div class="wrap">${head('Принципы', 'Во что мы верим')}
    <div class="values">${[['target', 'Практика важнее теории', 'В каждом уроке есть задание, которое можно сделать сразу.'], ['users', 'Наставник рядом', 'Живой человек проверяет работы и отвечает на вопросы.'], ['clock', 'Учёба в своём темпе', 'Записи, мягкие дедлайны и короткие уроки по 10–15 минут.']].map(([i, t, p]) => `<div class="tile"><span class="ti">${ic(i)}</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div></div></section>
  <section class="sec grid-paper band"><div class="wrap">${head('Команда', 'Преподаватели')}${teachersBlock()}</div></section>
  <section class="sec" id="contacts"><div class="wrap">${head('Контакты', 'Как с нами связаться', 'Нажмите, чтобы скопировать.')}
    <div class="contacts">${[['phone', 'Телефон', sc.phone], ['mail', 'Почта', sc.email], ['chat', 'Telegram', sc.telegram]].map(([i, l, v]) => `<div class="tile"><span class="ti">${ic(i)}</span><h3>${l}</h3><div class="copy-row"><span style="min-width:0;overflow-wrap:anywhere">${T(v)}</span><button class="icon-btn" style="width:34px;height:34px" data-act="copy" data-v="${esc(v)}" aria-label="Скопировать">${ic('copy', 16)}</button></div></div>`).join('')}</div>
    <div class="card" id="requisites" style="margin-top:16px"><h3 style="font-size:16px;margin-bottom:10px">Реквизиты и документы</h3><p class="muted" style="font-size:14px">${T('[ИП или ООО, ИНН, ОГРН]')} · ${T('[Ссылка на договор-оферту]')} · ${T('[Политика конфиденциальности]')} · ${T('[Лицензия на образовательную деятельность, если есть]')}</p></div>
  </div></section>`;
}
function p404() {
  return `<div class="wrap nf"><b>404</b><h1 style="font-size:28px">Такой страницы нет</h1><p class="muted">Возможно, ссылка устарела. Начните с главной или каталога.</p><div class="btns"><a class="btn btn-primary" href="#home">На главную</a><a class="btn btn-ghost" href="#catalog">Каталог</a></div></div>`;
}

/* ================= окна ================= */
function modalHtml() {
  const m = S.modal; if (!m) return '';
  let inner = '', wide = false;
  const x = `<button class="icon-btn" data-act="close" aria-label="Закрыть">${ic('x')}</button>`;
  if (m.type === 'trial') {
    inner = m.sent ? `<div class="modal-x"><span></span>${x}</div><div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:8px 0 12px"><div class="success" style="margin:0"><div class="big">${ic('check', 40)}</div></div><h2 style="font-size:24px">Заявка принята!</h2><p class="muted">Пришлём ссылку на пробный урок в течение ${T('[15 минут]')}. Это макет, поэтому заявка никуда не ушла.</p><button class="btn btn-primary" data-act="close">Хорошо</button></div>`
      : `<div class="modal-x"><div><span class="eyebrow">Бесплатно</span><h2 style="font-size:24px;margin-top:8px">Пробный урок</h2><p class="muted" style="margin-top:6px">Посмотрите урок, познакомьтесь с преподавателем и решите, подходит ли формат.</p></div>${x}</div>
        <form data-form="trial" novalidate style="display:grid;gap:12px">
          <div class="field"><label for="tr-name">Имя</label><input id="tr-name" placeholder="Как к вам обращаться" autocomplete="name"><span class="err" hidden>Введите имя</span></div>
          <div class="field"><label for="tr-contact">Телефон, почта или Telegram</label><input id="tr-contact" placeholder="Куда прислать ссылку"><span class="err" hidden>Укажите, куда написать</span></div>
          <div class="field"><label for="tr-course">Курс</label><select id="tr-course">${C.courses.map(c => `<option value="${c.id}"${c.id === (m.course || S.course) ? ' selected' : ''}>${esc(plain(c.title))}</option>`).join('')}</select></div>
          <button class="btn btn-primary" type="submit">Записаться на пробный урок</button><span class="hint">Нажимая кнопку, вы соглашаетесь с ${T('[политикой конфиденциальности]')}.</span></form>`;
  } else if (m.type === 'video') {
    wide = true;
    inner = `<div class="modal-x"><h3>${T(m.title)}</h3>${x}</div><div class="player playing"><span class="pl-title">Превью · ${esc(plain(m.title))}</span><div class="wave">${Array.from({ length: 14 }, (_, i) => `<i style="height:${16 + (i * 37 % 40)}px;animation-delay:${(i * .07).toFixed(2)}s"></i>`).join('')}</div><div class="pbar"><span>00:12</span><span class="bar"><i style="width:8%"></i></span><span>02:30</span></div></div><p class="muted">${T('[Здесь будет короткое видео: как проходит урок или знакомство с преподавателем. Видео можно загрузить на YouTube, VK Видео или Rutube и вставить сюда.]')}</p>`;
  } else if (m.type === 'teacher') {
    const t = C.teachers[m.i] || C.teachers[0]; wide = true;
    inner = `<div class="modal-x"><div style="display:flex;gap:14px;align-items:center"><span class="ava-s ${['d-a', 'd-b', 'd-c', 'd-d'][m.i % 4]}" style="width:56px;height:56px">${esc(initials(t.name))}</span><div><h3>${T(t.name)}</h3><p class="muted" style="font-size:14px">${T(t.role)} · ${T(t.exp)}</p></div></div>${x}</div>
      <div class="player"><span class="pl-title">Видео-знакомство</span><button class="big-play" data-act="toast" data-v="Здесь будет видео преподавателя" aria-label="Смотреть">${ic('play', 34)}</button></div><p>${T(t.about)}</p>
      <div class="btns"><button class="btn btn-primary" data-act="trial">Пробный урок с преподавателем</button></div>`;
  } else if (m.type === 'hw') {
    const h = S.hw.find(z => z.id === m.id); if (!h) return '';
    const canSend = h.st === 'todo' || h.st === 'fix';
    inner = `<div class="modal-x"><div><span class="pill ${HW_ST[h.st][1]}">${HW_ST[h.st][0]}</span><h3 style="margin-top:10px">${T(h.t)}</h3><small class="muted">Модуль ${h.m} · срок сдачи ${dLong(addD(h.due))}${h.grade ? ' · оценка ' + h.grade : ''}</small></div>${x}</div>
      <div class="prose"><p><b>Задание.</b> ${T('[Описание задания: что нужно сделать, в каком виде сдать и по каким критериям будет оценка.]')}</p></div>
      ${h.fb ? `<div class="feedback"><b style="display:block;margin-bottom:4px">Комментарий наставника</b>${esc(h.fb)}</div>` : ''}
      ${h.st === 'review' ? `<div class="note">Работа у наставника на проверке. Обычно это занимает до ${T('[24 часов]')}.</div>` : ''}
      ${canSend ? `<form data-form="hw" novalidate style="display:grid;gap:12px">
        <div class="field"><label for="hw-text">Ваш ответ</label><textarea id="hw-text" placeholder="Напишите ответ или вставьте ссылку на работу"></textarea><span class="err" hidden>Напишите ответ или прикрепите файл</span></div>
        <label class="drop">${ic('upload', 22)}<span id="hw-file-name">Прикрепить файл <small style="display:block">до 20 МБ</small></span><input type="file" id="hw-file"></label>
        <button class="btn btn-primary" type="submit">Отправить на проверку</button></form>` : `<button class="btn btn-ghost" data-act="close">Закрыть</button>`}`;
  } else if (m.type === 'cert') {
    wide = true;
    inner = `<div class="modal-x"><h3>${pct() >= 100 ? 'Ваш сертификат' : 'Пример сертификата'}</h3>${x}</div>${certHtml(myCourse(), S.user ? S.user.name : null)}<div class="btns"><button class="btn btn-primary" data-act="toast" data-v="В настоящей версии сертификат скачивается в PDF">Скачать PDF</button><button class="btn btn-ghost" data-act="toast" data-v="Ссылка на сертификат скопирована (макет)">Поделиться ссылкой</button></div>`;
  } else if (m.type === 'event') {
    const [di, off] = m.v.split('|').map(Number); const d = addD(di + off * 7, MONDAY); const e = (PATTERN[di] || [])[0];
    inner = `<div class="modal-x"><div><span class="pill ${e.c === 'ev-dl' ? 'p-bad' : e.c === 'ev-cons' ? 'p-ok' : e.c === 'ev-live' ? 'p-info' : 'p-mute'}">${EV_NAME[e.c]}</span><h3 style="margin-top:10px">${T(e.t)}</h3><p class="muted" style="font-size:14px;margin-top:4px">${WDF[di]}, ${dLong(d)} · ${e.tm}</p></div>${x}</div>
      <p>${e.c === 'ev-live' ? 'Живое занятие с преподавателем. Можно задавать вопросы в чате трансляции, запись появится в кабинете.' : e.c === 'ev-cons' ? 'Личная встреча с наставником по видеосвязи: разберёте вопросы по текущему модулю.' : e.c === 'ev-dl' ? 'Последний день, чтобы сдать домашнее задание текущего модуля.' : 'Открывается доступ к новому уроку модуля.'}</p>
      <div class="btns">${e.c === 'ev-dl' ? '<a class="btn btn-primary" href="#cabinet-homework">К заданиям</a>' : e.c === 'ev-self' ? '<a class="btn btn-primary" href="#cabinet-lessons">К урокам</a>' : '<button class="btn btn-primary" data-act="join">Подключиться</button>'}<button class="btn btn-ghost" data-act="cal">Добавить в календарь</button></div>`;
  }
  return `<div class="modal" data-act="modal-bg"><div class="modal-in ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${inner}</div></div>`;
}

/* ================= панель «Настроить сайт» ================= */
function czHtml() {
  const sc = C.school, pr = C.pricing;
  const num = v => typeof v === 'number' ? v : '';
  return `<aside class="cz" role="dialog" aria-label="Настроить сайт">
    <div class="cz-h"><div><b style="font-family:var(--f-display)">Настроить сайт</b><p class="hint">Изменения сразу видны на сайте</p></div><button class="icon-btn" data-act="cz" aria-label="Закрыть">${ic('x')}</button></div>
    <div class="cz-b">
      <fieldset><legend>Школа</legend>
        <div class="field"><label for="cz-name">Название</label><input id="cz-name" data-cz="school.name" value="${esc(sc.name)}"></div>
        <div class="two"><div class="field"><label for="cz-letter">Буква в логотипе</label><input id="cz-letter" data-cz="school.letter" maxlength="2" value="${esc(sc.letter)}"></div>
        <div class="field"><label for="cz-topic">Чему учим</label><input id="cz-topic" data-cz="school.topic" value="${esc(sc.topic)}"></div></div>
      </fieldset>
      <fieldset><legend>Направления</legend>${C.directions.map((d, i) => `<div class="field"><input id="cz-dir-${i}" data-cz="dir.${i}" value="${esc(d.name)}" aria-label="Направление ${i + 1}"></div>`).join('')}</fieldset>
      <fieldset><legend>Цены за месяц, ₽</legend>
        ${C.tariffs.map(t => `<div class="field"><label for="cz-p-${t.id}">${esc(t.name)}</label><input id="cz-p-${t.id}" data-cz="price.${t.id}" type="number" min="0" step="100" inputmode="numeric" placeholder="например, ${{ base: 2900, mentor: 4900, pro: 9900 }[t.id]}" value="${num(pr[t.id])}"></div>`).join('')}
        <div class="field"><label for="cz-disc">Скидка за оплату сразу, %</label><input id="cz-disc" data-cz="price.fullDiscount" type="number" min="0" max="90" value="${num(pr.fullDiscount)}"></div>
      </fieldset>
      <fieldset><legend>Цвета</legend><div class="swatches">${Object.keys(PALETTES).map(k => { const p = PALETTES[k][isDark() ? 'dark' : 'light']; return `<button class="sw ${C.palette === k ? 'on' : ''}" data-act="palette" data-v="${k}" aria-pressed="${C.palette === k}"><span style="background:${p[0]}"><i style="background:${p[2]}"></i></span>${PALETTES[k].name}</button>`; }).join('')}</div></fieldset>
      <fieldset><legend>Тема</legend><div class="switch" style="justify-self:start">${[['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']].map(([v, l]) => `<button class="${theme === v ? 'on' : ''}" data-act="set-theme" data-v="${v}">${l}</button>`).join('')}</div></fieldset>
      <fieldset><legend>Заглушки</legend><label class="radio" style="align-items:center"><input type="checkbox" id="cz-ph" ${OV.hidePh ? '' : 'checked'}><span class="rt"><b>Подсвечивать [заглушки]</b><small>Чтобы было видно, что ещё нужно заполнить</small></span></label></fieldset>
      <p class="hint">Настройки сохраняются только в этом браузере. Чтобы они появились у всех, скопируйте их и перенесите в файл js/config.js.</p>
    </div>
    <div class="cz-f"><button class="btn btn-primary" data-act="cz-copy">${ic('copy', 18)} Скопировать настройки</button><button class="btn btn-ghost" data-act="cz-reset">${S.resetArm ? 'Точно сбросить? Нажмите ещё раз' : 'Сбросить всё'}</button></div>
  </aside>`;
}
function renderCz() {
  const root = document.getElementById('cz-root');
  root.innerHTML = S.czOpen ? czHtml() : '';
  document.getElementById('cz-btn').hidden = S.czOpen;
}

/* ================= роутер ================= */
const TITLES = { home: 'Онлайн-школа', catalog: 'Каталог курсов', checkout: 'Запись на курс', login: 'Вход', favorites: 'Избранное', about: 'О школе', cabinet: 'Личный кабинет', 'cabinet-schedule': 'Расписание', 'cabinet-lessons': 'Уроки', 'cabinet-homework': 'Домашние задания', 'cabinet-chat': 'Чат с наставником', 'cabinet-progress': 'Прогресс' };
let pendingScroll = null;
function renderHeader() { document.getElementById('hdr').innerHTML = header(route()); }
function renderModal() { document.getElementById('modal-root').innerHTML = modalHtml(); document.body.style.overflow = S.modal ? 'hidden' : ''; }
function render() {
  const r = route(); let html, bar = false, noFtr = false, title = TITLES[r];
  if (r === 'home') html = pHome();
  else if (r === 'catalog') html = pCatalog();
  else if (/^course-\d+$/.test(r)) { html = pCourse(r.split('-')[1]); bar = true; title = plain(courseById(r.split('-')[1]).title); }
  else if (r === 'checkout') { html = pCheckout(); noFtr = true; }
  else if (r === 'favorites') html = pFav();
  else if (r === 'about') html = pAbout();
  else if (r === 'login') { html = pLogin(); noFtr = true; }
  else if (/^lesson-\d+-\d+$/.test(r)) { if (!S.user) { html = pLogin(r); noFtr = true; } else { html = pLesson(r.slice(7)); noFtr = true; title = 'Урок ' + r.slice(7).replace('-', '.'); } }
  else if (r === 'cabinet' || r.startsWith('cabinet-')) {
    noFtr = true;
    if (!S.user) html = pLogin(r);
    else {
      bar = true;
      const map = { 'cabinet-schedule': pSchedule, 'cabinet-lessons': pLessons, 'cabinet-homework': pHomework, 'cabinet-chat': pChat, 'cabinet-progress': pProgress };
      const tab = map[r] ? r : 'cabinet';
      html = cabShell(tab, (map[r] || pCabinet)());
    }
  } else { html = p404(); title = 'Страница не найдена'; }
  document.getElementById('app').innerHTML = html;
  renderHeader(); renderModal();
  document.body.classList.toggle('has-bar', bar);
  document.getElementById('ftr').hidden = noFtr;
  document.title = (title || 'Онлайн-школа') + ' · ' + plain(C.school.name);
  const msgs = document.getElementById('msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
}
function go(r) { if (route() === r) { render(); window.scrollTo(0, 0); } else location.hash = r; }
window.addEventListener('hashchange', () => {
  S.modal = null; S.notifOpen = false;
  const app = document.getElementById('app'); app.style.animation = 'none'; void app.offsetWidth; app.style.animation = '';
  render();
  if (pendingScroll) { const id = pendingScroll; pendingScroll = null; requestAnimationFrame(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: 'start' }); }); }
  else window.scrollTo(0, 0);
});

/* ================= действия ================= */
function keepForm() { ['name', 'email', 'phone'].forEach(k => { const el = document.getElementById('f-' + k); if (el) S.form[k] = el.value; }); }
function login(user) { S.user = user; S.authStep = 'email'; saveAll(); }
function toggleFav(id) {
  if (S.fav.has(id)) { S.fav.delete(id); toast('Убрали из избранного', 'heart'); } else { S.fav.add(id); toast('Добавили в избранное', 'heartf'); }
  saveAll();
}
function setOV(path, val) {
  const [a, b] = path.split('.');
  if (a === 'school') { OV.school = OV.school || {}; OV.school[b] = val; }
  else if (a === 'dir') { OV.dirs = OV.dirs || []; OV.dirs[+b] = val; }
  else if (a === 'price') { OV.pricing = OV.pricing || {}; OV.pricing[b] = val === '' ? null : Math.max(0, +val); }
  store.set('overrides', OV); buildConfig(); applyTheme(); render();
  document.getElementById('ftr').innerHTML = footer();
}
function mentorReview(id) {
  setTimeout(() => {
    const h = S.hw.find(x => x.id === id); if (!h || h.st !== 'review') return;
    h.st = 'ok'; h.grade = '5 из 5'; h.fb = 'Отличная работа, всё учтено! Принято.'; S.read = false; saveAll();
    toast('Наставник проверил задание: принято!', 'check');
    if (!S.modal && !document.querySelector('input:focus,textarea:focus')) render(); else renderHeader();
  }, 6000);
}
let replyN = 0;
function sendChat(text) {
  text = text.trim(); if (!text) return;
  const now = new Date(), tm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  S.chat.push({ me: 1, t: text, d: 0, tm }); S.typing = true; saveAll(); render();
  setTimeout(() => {
    S.chat.push({ me: 0, t: REPLIES[replyN++ % REPLIES.length], d: 0, tm }); S.typing = false; saveAll();
    if (route() === 'cabinet-chat') { const v = (document.getElementById('chat-text') || {}).value || ''; render(); const i = document.getElementById('chat-text'); if (i) { i.value = v; i.focus(); } }
  }, 1600);
}

document.addEventListener('click', e => {
  const t = e.target;
  // закрыть уведомления при клике мимо
  if (S.notifOpen && !t.closest('.pop') && !t.closest('[data-act="notif"]')) { S.notifOpen = false; renderHeader(); }
  const sc = t.closest('[data-scroll]');
  if (sc) {
    e.preventDefault(); const id = sc.dataset.scroll, want = sc.dataset.route || (sc.getAttribute('href') || '').slice(1);
    const dr = document.getElementById('drawer'); if (dr) dr.hidden = true;
    if (want && route() !== want) { pendingScroll = id; location.hash = want; } else { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: 'start' }); }
    return;
  }
  const dl = t.closest('[data-dir]'); if (dl) { S.dir = dl.dataset.dir; S.level = 'all'; S.dur = 'all'; S.q = ''; if (route() === 'catalog') render(); }
  const a = t.closest('[data-act]'); if (!a) return;
  const v = a.dataset.v, act = a.dataset.act;
  switch (act) {
    case 'menu': { const d = document.getElementById('drawer'); d.hidden = !d.hidden; break; }
    case 'menu-bg': if (t === a) a.hidden = true; break;
    case 'theme': theme = { auto: 'light', light: 'dark', dark: 'auto' }[theme]; store.set('theme', theme); applyTheme(); renderHeader(); renderCz(); toast('Тема: ' + { auto: 'как в системе', light: 'светлая', dark: 'тёмная' }[theme], { auto: 'auto', light: 'sun', dark: 'moon' }[theme]); break;
    case 'set-theme': theme = v; store.set('theme', theme); applyTheme(); renderHeader(); renderCz(); break;
    case 'notif': S.notifOpen = !S.notifOpen; renderHeader(); break;
    case 'read-all': S.read = true; saveAll(); S.notifOpen = false; renderHeader(); break;
    case 'fav': e.preventDefault(); e.stopPropagation(); toggleFav(+v); render(); break;
    case 'quiz': S.quiz.push(+v); document.getElementById('quiz-box').innerHTML = quizInner(); break;
    case 'quiz-back': S.quiz.pop(); document.getElementById('quiz-box').innerHTML = quizInner(); break;
    case 'quiz-reset': S.quiz = []; document.getElementById('quiz-box').innerHTML = quizInner(); break;
    case 'dir': S.dir = v; render(); break;
    case 'reset-filters': S.dir = 'all'; S.level = 'all'; S.dur = 'all'; S.q = ''; render(); break;
    case 'pmode': S.priceMode = v; render(); break;
    case 'buy': S.tariff = v; S.step = 1; S.promo = 0; S.plan = S.priceMode; saveAll(); go('checkout'); break;
    case 'trial': S.modal = { type: 'trial', course: v ? +v : null }; { const d = document.getElementById('drawer'); if (d) d.hidden = true; } renderModal(); setTimeout(() => { const i = document.getElementById('tr-name'); if (i) i.focus(); }, 50); break;
    case 'video': S.modal = { type: 'video', title: v || 'Как проходит урок' }; renderModal(); break;
    case 'teacher': S.modal = { type: 'teacher', i: +v || 0 }; renderModal(); break;
    case 'cert': S.modal = { type: 'cert' }; renderModal(); break;
    case 'event': S.modal = { type: 'event', v }; renderModal(); break;
    case 'open-hw': S.modal = { type: 'hw', id: +v }; renderModal(); break;
    case 'close': S.modal = null; renderModal(); break;
    case 'modal-bg': if (t === a) { S.modal = null; renderModal(); } break;
    case 'toast': toast(v); break;
    case 'tariff': S.tariff = a.value; saveAll(); render(); break;
    case 'plan': S.plan = a.value; render(); break;
    case 'pay': S.pay = a.value; break;
    case 'who': keepForm(); S.who = v; render(); break;
    case 'step': keepForm(); S.step = +v; render(); window.scrollTo(0, 0); break;
    case 'promo': { const p = document.getElementById('promo'), val = (p && p.value || '').trim().toUpperCase();
      if (!val) toast('Введите промокод'); else if (val === String(C.pricing.promo.code).toUpperCase()) { S.promo = C.pricing.promo.percent; render(); toast('Промокод применён: −' + S.promo + '%', 'check'); } else toast('Такого промокода нет'); break; }
    case 'pay-now': S.enrolled = S.course; if (!S.user) S.user = { name: S.form.name || '[Имя ученика]', email: S.form.email }; S.step = 4; saveAll(); render(); window.scrollTo(0, 0); confetti(); break;
    case 'demo-login': login({ name: '[Имя ученика]', email: 'demo@example.com' }); toast('Вы вошли как демо-ученик', 'user'); { const r = route(); if (r === 'login') go('cabinet'); else render(); } break;
    case 'auth-back': S.authStep = 'email'; render(); break;
    case 'logout': S.user = null; saveAll(); go('home'); toast('Вы вышли из кабинета'); break;
    case 'join': toast('В настоящем кабинете здесь откроется видеосвязь', 'video'); break;
    case 'hwf': S.hwFilter = v; render(); break;
    case 'ltab': S.lessonTab = v; render(); break;
    case 'play': { const p = document.getElementById('player'); if (p) { p.classList.add('playing'); const b = p.querySelector('.pbar .bar i'); if (b) { b.style.transition = 'width 40s linear'; requestAnimationFrame(() => { b.style.width = '100%'; }); } } break; }
    case 'done-lesson': { S.done.add(v); saveAll(); const i = LESSONS.findIndex(l => l.key === v), n = LESSONS[i + 1];
      if (pct() >= 100) { toast('Курс пройден! Сертификат открыт', 'award'); confetti(); go('cabinet-progress'); }
      else { toast('Урок пройден! Открыт следующий', 'check'); S.lessonTab = 'notes'; if (n) go('lesson-' + n.key); else render(); } break; }
    case 'locked': toast('Сначала пройдите предыдущие уроки', 'lock'); break;
    case 'file': toast('Материал откроется в новой вкладке', 'doc'); break;
    case 'week': S.weekOff = v === '0' ? 0 : S.weekOff + +v; render(); break;
    case 'cal': toast('Здесь будет ссылка для Google или Яндекс Календаря', 'cal'); break;
    case 'quick': sendChat(v); break;
    case 'copy': copyText(v).then(ok => toast(ok ? 'Скопировано' : 'Не получилось скопировать, выделите текст вручную', ok ? 'check' : null)); break;
    case 'reset-demo': S.done = new Set(DEMO_DONE); S.hw = JSON.parse(JSON.stringify(DEMO_HW)); S.chat = DEMO_CHAT.slice(); S.read = false; saveAll(); render(); toast('Демо-прогресс сброшен'); break;
    case 'cz': S.czOpen = !S.czOpen; S.resetArm = false; { const d = document.getElementById('drawer'); if (d) d.hidden = true; } renderCz(); break;
    case 'palette': OV.palette = v; store.set('overrides', OV); buildConfig(); applyTheme(); renderCz(); break;
    case 'cz-copy': { const out = { school: OV.school || {}, directions: OV.dirs || [], pricing: OV.pricing || {}, palette: C.palette };
      copyText('// Перенесите эти значения в js/config.js\n' + JSON.stringify(out, null, 2)).then(ok => toast(ok ? 'Настройки скопированы' : 'Не получилось скопировать', ok ? 'check' : null)); break; }
    case 'cz-reset': if (!S.resetArm) { S.resetArm = true; renderCz(); } else { OV = {}; store.del('overrides'); S.resetArm = false; buildConfig(); applyTheme(); render(); document.getElementById('ftr').innerHTML = footer(); renderCz(); toast('Настройки сброшены'); } break;
  }
});

document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.form;
  const need = (id, ok) => { const el = document.getElementById(id), fld = el.closest('.field'), er = fld.querySelector('.err'); fld.classList.toggle('bad', !ok); if (er) er.hidden = ok; return ok; };
  if (kind === 'lead') { const n = f.querySelector('#lead-name').value.trim(), p = f.querySelector('#lead-phone').value.trim(); if (!n || !p) { toast('Заполните имя и контакт'); return; } f.reset(); S.modal = { type: 'trial', sent: true }; renderModal(); }
  if (kind === 'trial') { const a = need('tr-name', !!document.getElementById('tr-name').value.trim()), b = need('tr-contact', !!document.getElementById('tr-contact').value.trim()); if (a && b) { S.modal.sent = true; renderModal(); } }
  if (kind === 'contacts') { keepForm(); const a = need('f-name', !!S.form.name.trim()), b = need('f-email', /^\S+@\S+\.\S+$/.test(S.form.email)); if (a && b) { S.step = 3; render(); window.scrollTo(0, 0); } }
  if (kind === 'email') { const v = document.getElementById('auth-email').value.trim(); if (need('auth-email', /^\S+@\S+\.\S+$/.test(v))) { S.authEmail = v; S.authStep = 'code'; render(); setTimeout(() => { const i = document.getElementById('code-0'); if (i) i.focus(); }, 30); } }
  if (kind === 'code') finishCode();
  if (kind === 'hw') {
    const txt = document.getElementById('hw-text').value.trim(), file = document.getElementById('hw-file').files.length;
    if (!need('hw-text', !!(txt || file))) return;
    const h = S.hw.find(x => x.id === S.modal.id); if (h) { h.st = 'review'; h.fb = ''; saveAll(); mentorReview(h.id); }
    S.modal = null; render(); toast('Задание отправлено. Наставник скоро проверит', 'check');
  }
  if (kind === 'chat') { const i = document.getElementById('chat-text'); const v = i.value; i.value = ''; sendChat(v); setTimeout(() => { const j = document.getElementById('chat-text'); if (j) j.focus(); }, 0); }
});
function finishCode() {
  const code = [0, 1, 2, 3].map(i => (document.getElementById('code-' + i) || {}).value || '').join('');
  if (code.length < 4) { toast('Введите 4 цифры'); return; }
  const name = S.authEmail.split('@')[0]; login({ name: name ? name.charAt(0).toUpperCase() + name.slice(1) : '[Имя ученика]', email: S.authEmail });
  toast('Добро пожаловать!', 'check'); const r = route(); if (r === 'login') go('cabinet'); else render();
}
let qT;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'cat-q') { S.q = t.value; clearTimeout(qT); qT = setTimeout(() => { const box = document.getElementById('cat-list'); if (box) box.innerHTML = catList(); }, 120); }
  if (/^code-\d$/.test(t.id)) { t.value = t.value.replace(/\D/g, '').slice(-1); const i = +t.id.slice(5); if (t.value && i < 3) document.getElementById('code-' + (i + 1)).focus(); if (t.value && i === 3) finishCode(); }
  if (t.dataset && t.dataset.cz) setOV(t.dataset.cz, t.value);
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (/^code-\d$/.test(t.id) && e.key === 'Backspace' && !t.value) { const i = +t.id.slice(5); if (i > 0) document.getElementById('code-' + (i - 1)).focus(); }
  if (e.key === 'Escape') { if (S.modal) { S.modal = null; renderModal(); } else if (S.notifOpen) { S.notifOpen = false; renderHeader(); } else if (S.czOpen) { S.czOpen = false; renderCz(); } else { const d = document.getElementById('drawer'); if (d) d.hidden = true; } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'cat-level') { S.level = t.value; render(); }
  if (t.id === 'cat-dur') { S.dur = t.value; render(); }
  if (t.id === 'cat-sort') { S.sort = t.value; render(); }
  if (t.id === 'hw-file') { const n = document.getElementById('hw-file-name'); if (n && t.files[0]) n.textContent = t.files[0].name; }
  if (t.id === 'cz-ph') { OV.hidePh = !t.checked; store.set('overrides', OV); applyTheme(); }
});
document.addEventListener('paste', e => {
  const t = e.target; if (!/^code-\d$/.test(t.id)) return;
  const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4); if (d.length < 4) return;
  e.preventDefault(); d.split('').forEach((c, i) => { document.getElementById('code-' + i).value = c; }); finishCode();
});

/* ================= старт ================= */
applyTheme();
document.getElementById('ftr').innerHTML = footer();
renderCz();
render();
})();
