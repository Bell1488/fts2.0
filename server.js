const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { SocksProxyAgent } = require('socks-proxy-agent');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MAX_BODY = 16 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function clean(value, max = 200) {
  return String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}

async function sendTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram integration is not configured');
  const proxyUrl = process.env.SOCKS5H_PROXY;
  if (!proxyUrl || !/^socks5h:\/\//i.test(proxyUrl)) throw new Error('SOCKS5H_PROXY must be configured with socks5h://');
  const agent = new SocksProxyAgent(proxyUrl);
  const { default: fetch } = await import('node-fetch');
  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: 'POST',
    agent,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, disable_web_page_preview: true, text: [
      'Новая заявка с FTS-Pay Китай',
      `Телефон: ${lead.phone}`,
      `Сумма: ${lead.cny.toLocaleString('ru-RU')} CNY`,
      `Назначение: ${lead.direction}`,
      `Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
    ].join('\n') })
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
}

async function handleLead(req, res) {
  try {
    const data = JSON.parse(await readBody(req));
    const phone = clean(data.phone, 40);
    const direction = clean(data.direction, 80);
    const cny = Number(data.cny);
    if (!phone || !/[0-9]{5,}/.test(phone.replace(/\D/g, '')) || !Number.isFinite(cny) || cny <= 0 || !direction) {
      return json(res, 400, { ok: false, error: 'Некорректные данные заявки' });
    }
    await sendTelegram({ phone, cny, direction });
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('[lead]', error.message);
    const status = /not configured|must be configured/.test(error.message) ? 503 : 502;
    return json(res, status, { ok: false, error: 'Заявка временно недоступна' });
  }
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT + path.sep)) return json(res, 403, { error: 'Forbidden' });
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) return json(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'POST' && requestUrl.pathname === '/api/leads') return handleLead(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
  return serveStatic(req, res, requestUrl.pathname);
});

server.listen(PORT, () => console.log(`FTS-Pay Китай listening on http://localhost:${PORT}`));

