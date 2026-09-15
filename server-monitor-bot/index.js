/**
 * 🛡️ MOVIELEGEND SERVER WATCHDOG & TELEGRAM MONITOR BOT
 * Standalone process that monitors VPS health, auto-heals backend on crash,
 * and allows full control from Telegram on your phone.
 * 
 * Zero external dependencies (Pure Node.js built-in modules).
 */

const https = require('https');
const http = require('http');
const os = require('os');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load config
const CONFIG_FILE = path.join(__dirname, 'config.json');
let config = {
  BOT_TOKEN: '8874742463:AAFnH3gqb_X2yWzA_QkxgfryQKBhe4TICTM',
  ADMIN_CHAT_ID: '8444081519',
  BACKEND_PORT: 3000,
  BACKEND_PROCESS_NAME: 'movielegend-backend',
  BACKEND_PROCESS_ID: 0,
  CHECK_INTERVAL_SECONDS: 15,
  ALERT_COOLDOWN_MINUTES: 15,
  CPU_ALERT_THRESHOLD: 90,
  RAM_ALERT_THRESHOLD: 92,
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config = { ...config, ...raw };
  } catch (e) {
    console.error('[Config] Error reading config.json:', e.message);
  }
}

const { BOT_TOKEN, ADMIN_CHAT_ID, BACKEND_PORT } = config;

// State tracking
let consecutiveFailures = 0;
let lastResourceAlertTime = 0;
let isRestarting = false;
let pollingOffset = 0;

// Persistent 1-tap keyboard buttons for phone
const QUICK_KEYBOARD = {
  keyboard: [
    [{ text: '📊 Trạng thái máy chủ (/status)' }, { text: '⚡ Khởi động lại Backend (/restart)' }],
    [{ text: '📄 Xem Log lỗi (/logs)' }, { text: '🔄 Cập nhật code Git (/gitpull)' }],
    [{ text: '❓ Trợ giúp & Hướng dẫn (/help)' }]
  ],
  resize_keyboard: true,
  is_persistent: true,
};

// ─── TELEGRAM HTTP CLIENT ───────────────────────────────────────────────────

function telegramApi(method, payload = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 35000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.ok) resolve(json.result);
          else reject(new Error(json.description || 'Telegram API Error'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function sendTelegramMessage(chatId, text, options = {}) {
  try {
    return await telegramApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: options.reply_markup || QUICK_KEYBOARD,
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err.message);
  }
}

// ─── SYSTEM METRICS COLLECTORS ──────────────────────────────────────────────

function getCpuUsage() {
  return new Promise((resolve) => {
    const startMeasure = os.cpus().map((cpu) => {
      let total = 0;
      for (const type in cpu.times) total += cpu.times[type];
      return { idle: cpu.times.idle, total };
    });

    setTimeout(() => {
      const endMeasure = os.cpus().map((cpu) => {
        let total = 0;
        for (const type in cpu.times) total += cpu.times[type];
        return { idle: cpu.times.idle, total };
      });

      let totalDiff = 0;
      let idleDiff = 0;
      for (let i = 0; i < startMeasure.length; i++) {
        totalDiff += endMeasure[i].total - startMeasure[i].total;
        idleDiff += endMeasure[i].idle - startMeasure[i].idle;
      }

      const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
      resolve(Math.round(usage * 10) / 10);
    }, 1000);
  });
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const percent = Math.round((used / total) * 1000) / 10;
  return {
    totalGB: (total / (1024 ** 3)).toFixed(1),
    usedGB: (used / (1024 ** 3)).toFixed(1),
    freeGB: (free / (1024 ** 3)).toFixed(1),
    percent,
  };
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} ngày`);
  if (h > 0) parts.push(`${h} giờ`);
  if (m > 0) parts.push(`${m} phút`);
  if (parts.length === 0) parts.push(`${s} giây`);
  return parts.join(' ');
}

function getPm2ProcessInfo() {
  try {
    const raw = execSync('pm2 jlist', { encoding: 'utf8', timeout: 5000 });
    const list = JSON.parse(raw);
    const proc = list.find((p) =>
      p.name?.toLowerCase().includes('movielegend') ||
      p.pm_id === config.BACKEND_PROCESS_ID ||
      p.name === config.BACKEND_PROCESS_NAME
    ) || list[0];

    if (!proc) return null;

    const memoryMB = proc.monit?.memory ? Math.round(proc.monit.memory / (1024 * 1024)) : 0;
    const cpu = proc.monit?.cpu || 0;
    const status = proc.pm2_env?.status || 'unknown';
    const restarts = proc.pm2_env?.restart_time || 0;
    const uptimeSec = proc.pm2_env?.pm_uptime ? Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0;

    return {
      name: proc.name,
      id: proc.pm_id,
      status,
      memoryMB,
      cpu,
      restarts,
      uptime: formatUptime(uptimeSec),
      isOnline: status === 'online',
    };
  } catch (e) {
    return null;
  }
}

function checkHttpHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, { timeout: 4000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => {
      // Fallback check root /
      const fallbackReq = http.get(`http://127.0.0.1:${BACKEND_PORT}/`, { timeout: 4000 }, (res) => {
        resolve(res.statusCode < 500);
      });
      fallbackReq.on('error', () => resolve(false));
      fallbackReq.on('timeout', () => {
        fallbackReq.destroy();
        resolve(false);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function getRecentLogs(lines = 25) {
  try {
    const id = config.BACKEND_PROCESS_ID;
    const out = execSync(`pm2 logs ${id} --lines ${lines} --nostream`, { encoding: 'utf8', timeout: 6000 });
    return out.trim();
  } catch (e) {
    return 'Không thể trích xuất log từ PM2: ' + e.message;
  }
}

// ─── AUTO-HEALING & WATCHDOG LOOP ───────────────────────────────────────────

async function runWatchdogCheck() {
  if (isRestarting) return;

  const pm2Info = getPm2ProcessInfo();
  const isHttpOk = await checkHttpHealth();

  const isHealthy = pm2Info ? (pm2Info.isOnline && isHttpOk) : isHttpOk;

  if (!isHealthy) {
    consecutiveFailures++;
    console.warn(`[Watchdog] Health check failed (${consecutiveFailures}/2). PM2: ${pm2Info?.status}, HTTP: ${isHttpOk}`);

    if (consecutiveFailures >= 2) {
      isRestarting = true;
      const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const recentLogs = getRecentLogs(20);

      console.error('[Watchdog] Triggering AUTO-HEAL restart...');
      try {
        execSync(`pm2 restart ${config.BACKEND_PROCESS_NAME} || pm2 restart ${config.BACKEND_PROCESS_ID}`, { timeout: 15000 });
      } catch (err) {
        console.error('[Watchdog] PM2 restart error:', err.message);
      }

      const alertMsg = 
`🚨 <b>[CẢNH BÁO KHẨN CẤP: BACKEND SẬP]</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>Thời gian:</b> ${nowStr}
⚠️ <b>Trạng thái:</b> Backend không phản hồi HTTP hoặc bị crash.
⚡ <b>Hành động:</b> <b>Đã tự động Restart tiến trình PM2 thành công!</b>

📄 <b>Log lỗi trước khi sập:</b>
<code>${escapeHtml(recentLogs.slice(-1200))}</code>

👉 Gõ <b>/status</b> để kiểm tra lại hệ thống.`;

      await sendTelegramMessage(ADMIN_CHAT_ID, alertMsg);
      consecutiveFailures = 0;
      setTimeout(() => (isRestarting = false), 10000);
    }
  } else {
    consecutiveFailures = 0;
  }
}

async function runResourceCheck() {
  const cpuPercent = await getCpuUsage();
  const mem = getMemoryUsage();

  const isCpuHigh = cpuPercent >= config.CPU_ALERT_THRESHOLD;
  const isMemHigh = mem.percent >= config.RAM_ALERT_THRESHOLD;

  const now = Date.now();
  const cooldownMs = config.ALERT_COOLDOWN_MINUTES * 60 * 1000;

  if ((isCpuHigh || isMemHigh) && now - lastResourceAlertTime > cooldownMs) {
    lastResourceAlertTime = now;
    const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const warningMsg =
`⚠️ <b>[CẢNH BÁO QUÁ TẢI TÀI NGUYÊN VPS]</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>Thời gian:</b> ${nowStr}
🔥 <b>CPU:</b> ${cpuPercent}% (Ngưỡng cảnh báo: ${config.CPU_ALERT_THRESHOLD}%)
💾 <b>RAM:</b> ${mem.percent}% (${mem.usedGB} GB / ${mem.totalGB} GB)

💡 <i>Hệ thống đang chịu tải cao. Bạn có thể bấm nút 'Khởi động lại Backend' hoặc gõ /logs để kiểm tra.</i>`;

    await sendTelegramMessage(ADMIN_CHAT_ID, warningMsg);
  }
}

// ─── COMMAND HANDLERS ───────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function handleCommand(chatId, text) {
  const cmd = text.trim();

  // 1. HELP / START
  if (cmd.startsWith('/start') || cmd.startsWith('/help') || cmd.includes('Trợ giúp')) {
    const welcomeMsg =
`👋 <b>Chào mừng bạn đến với MovieLegend Server Watchdog!</b>
━━━━━━━━━━━━━━━━━━
🤖 Đây là bot giám sát và cứu hộ tự động 24/7 cho Backend VPS của bạn.

<b>Các chức năng chính:</b>
• 🟢 <b>Tự động cứu hộ:</b> Khi Backend bị sập/crash, Bot sẽ tự động restart và gửi tin nhắn cảnh báo kèm log lỗi.
• ⚠️ <b>Cảnh báo tài nguyên:</b> Tự động báo động khi CPU hoặc RAM vượt quá 90%.
• 📱 <b>Điều khiển từ xa:</b> Dùng các nút bấm bên dưới hoặc gõ lệnh:

👉 <b>/status</b> : Xem CPU, RAM, trạng thái Backend
👉 <b>/restart</b> : Khởi động lại Backend ngay lập tức
👉 <b>/logs</b> : Xem 25 dòng log mới nhất
👉 <b>/gitpull</b> : Tự động git pull & build & restart`;

    return sendTelegramMessage(chatId, welcomeMsg);
  }

  // 2. STATUS
  if (cmd.startsWith('/status') || cmd.includes('Trạng thái')) {
    await sendTelegramMessage(chatId, '⏳ Đang kiểm tra thông số hệ thống...');
    const cpu = await getCpuUsage();
    const mem = getMemoryUsage();
    const pm2 = getPm2ProcessInfo();
    const isHttpOk = await checkHttpHealth();
    const uptimeVps = formatUptime(os.uptime());
    const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const statusMsg =
`📊 <b>BÁO CÁO TRẠNG THÁI MÁY CHỦ & BACKEND</b>
━━━━━━━━━━━━━━━━━━
⏰ <i>${nowStr}</i>

🖥️ <b>Máy chủ VPS:</b>
• CPU Tổng: <b>${cpu}%</b> (${os.cpus().length} Cores)
• RAM: <b>${mem.usedGB} GB / ${mem.totalGB} GB (${mem.percent}%)</b>
• Uptime VPS: <b>${uptimeVps}</b>
• Nền tảng: <b>${os.type()} ${os.arch()}</b>

🚀 <b>Tiến trình Backend (PM2):</b>
• Tên: <code>${pm2?.name || 'movielegend-backend'}</code> (ID: ${pm2?.id ?? 0})
• Trạng thái: ${pm2?.isOnline ? '🟢 <b>ONLINE</b>' : '🔴 <b>OFFLINE / ERRORED</b>'}
• HTTP API (Port ${BACKEND_PORT}): ${isHttpOk ? '🟢 <b>Phản hồi tốt</b>' : '🔴 <b>Mất kết nối</b>'}
• CPU Backend: <b>${pm2?.cpu || 0}%</b> | RAM: <b>${pm2?.memoryMB || 0} MB</b>
• Đã chạy liên tục: <b>${pm2?.uptime || 'N/A'}</b>
• Số lần Restart: <b>${pm2?.restarts || 0}</b>`;

    return sendTelegramMessage(chatId, statusMsg);
  }

  // 3. RESTART
  if (cmd.startsWith('/restart') || cmd.includes('Khởi động lại')) {
    await sendTelegramMessage(chatId, '⚡ Đang thực hiện khởi động lại Backend PM2...');
    const startTime = Date.now();
    try {
      execSync(`pm2 restart ${config.BACKEND_PROCESS_NAME} || pm2 restart ${config.BACKEND_PROCESS_ID}`, { timeout: 20000 });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      return sendTelegramMessage(
        chatId,
        `✅ <b>Khởi động lại Backend thành công!</b>\n⚡ Thời gian xử lý: <b>${elapsed} giây</b>\n🟢 Trạng thái: <b>ONLINE</b>`
      );
    } catch (e) {
      return sendTelegramMessage(chatId, `❌ <b>Khởi động lại thất bại:</b>\n<code>${escapeHtml(e.message)}</code>`);
    }
  }

  // 4. LOGS
  if (cmd.startsWith('/logs') || cmd.includes('Xem Log')) {
    await sendTelegramMessage(chatId, '📄 Đang trích xuất log từ máy chủ...');
    const logs = getRecentLogs(25);
    const msg =
`📄 <b>25 DÒNG LOG GẦN NHẤT:</b>
━━━━━━━━━━━━━━━━━━
<code>${escapeHtml(logs.slice(-3500))}</code>`;

    return sendTelegramMessage(chatId, msg);
  }

  // 5. GIT PULL & BUILD
  if (cmd.startsWith('/gitpull') || cmd.includes('Cập nhật code')) {
    await sendTelegramMessage(chatId, '🔄 Đang thực hiện Git Pull & Build Backend...\n<i>Vui lòng chờ khoảng 15 - 30 giây...</i>');
    const rootDir = path.resolve(__dirname, '..');
    const backendDir = path.join(rootDir, 'movielegend-hrm-backend');

    exec(`git pull && cd /d "${backendDir}" && npm run build && pm2 restart ${config.BACKEND_PROCESS_NAME}`, { cwd: rootDir, timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        return sendTelegramMessage(chatId, `❌ <b>Git Pull / Build Thất bại:</b>\n<code>${escapeHtml(stderr || err.message)}</code>`);
      }
      return sendTelegramMessage(chatId, `🎉 <b>Cập nhật & Build Backend thành công!</b>\n\n📄 <b>Chi tiết:</b>\n<code>${escapeHtml(stdout.slice(-1500))}</code>`);
    });
    return;
  }

  // Fallback
  return sendTelegramMessage(chatId, `❓ Lệnh không nhận diện được. Vui lòng chọn một trong các nút bên dưới hoặc gõ <b>/help</b>.`);
}

// ─── TELEGRAM POLLING LOOP ──────────────────────────────────────────────────

async function pollUpdates() {
  try {
    const updates = await telegramApi('getUpdates', {
      offset: pollingOffset,
      timeout: 25,
      allowed_updates: ['message'],
    });

    if (Array.isArray(updates)) {
      for (const u of updates) {
        pollingOffset = u.update_id + 1;
        if (u.message && u.message.text) {
          const fromId = String(u.message.from?.id || u.message.chat?.id);
          
          // Security filter: Only allow ADMIN_CHAT_ID
          if (fromId !== String(ADMIN_CHAT_ID)) {
            console.warn(`[Security] Unauthorized message from ID: ${fromId} (${u.message.from?.username})`);
            await sendTelegramMessage(fromId, '⛔ <b>Từ chối truy cập:</b> Bạn không có quyền điều khiển máy chủ này.');
            continue;
          }

          await handleCommand(fromId, u.message.text);
        }
      }
    }
  } catch (err) {
    // Network / timeout error during polling is normal, retry after delay
    if (!err.message.includes('timeout')) {
      console.error('[Polling] Error:', err.message);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Continue next polling cycle
  setImmediate(pollUpdates);
}

// ─── STARTUP ────────────────────────────────────────────────────────────────

async function start() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🛡️  MOVIELEGEND SERVER WATCHDOG & TELEGRAM MONITOR BOT');
  console.log(`🤖 Bot Token: ${BOT_TOKEN.slice(0, 10)}...`);
  console.log(`👤 Admin ID: ${ADMIN_CHAT_ID}`);
  console.log(`🎯 Target Backend: Port ${BACKEND_PORT}`);
  console.log('═══════════════════════════════════════════════════════');

  // 1. Send Startup Notification to Admin
  const startupMsg =
`🟢 <b>[SERVER WATCHDOG ĐÃ KHỞI ĐỘNG]</b>
━━━━━━━━━━━━━━━━━━
🛡️ Người gác đền cho Backend MovieLegend đã sẵn sàng hoạt động 24/7!
⚡ Cứ mỗi 15 giây Bot sẽ tự động kiểm tra sức khỏe của Backend.

👉 <i>Bấm các nút bên dưới để bắt đầu quản lý.</i>`;

  await sendTelegramMessage(ADMIN_CHAT_ID, startupMsg);

  // 2. Start Watchdog Timers
  setInterval(runWatchdogCheck, config.CHECK_INTERVAL_SECONDS * 1000);
  setInterval(runResourceCheck, 60 * 1000);

  // Initial check
  runWatchdogCheck();

  // 3. Start Telegram Long Polling
  pollUpdates();
}

start().catch((err) => {
  console.error('[Fatal] Error starting watchdog bot:', err);
});
