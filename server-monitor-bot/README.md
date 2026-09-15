# 🤖 MovieLegend VPS Server Watchdog & Telegram Bot

Standalone, 0-dependency Node.js monitor & watchdog bot for VPS backend management via Telegram.

## 🌟 Features
1. **24/7 Watchdog Auto-Healing**: Pings the backend every 15s. If backend dies or fails to respond, automatically runs `pm2 restart 0` and alerts you via Telegram with the last 20 log lines.
2. **Resource Monitor**: Alerts via Telegram if CPU/RAM exceeds 90%.
3. **1-Tap Phone Keyboard**: Control the VPS server directly with simple on-screen Telegram buttons:
   - 📊 **Status** (`/status`): CPU, RAM, Uptime, PM2 process status, HTTP health.
   - 🔄 **Restart Backend** (`/restart`): Restarts the backend service immediately.
   - 📜 **Logs** (`/logs`): Fetches the latest 35 lines of PM2 logs.
   - 🚀 **Git Pull & Rebuild** (`/gitpull`): Runs `git pull`, builds the NestJS backend, and restarts PM2.
   - ❓ **Help** (`/help`): Shows help instructions.
4. **Zero External Dependencies**: Uses only standard Node.js libraries (`https`, `http`, `os`, `child_process`, `fs`, `path`).
5. **Security**: Ignores any unauthorized Telegram user (only responds to configured `ADMIN_CHAT_ID`).

## 🚀 How to Run on VPS

1. **Pull latest code on VPS**:
   ```bash
   cd /path/to/movielegend-hrm
   git pull
   ```

2. **Start the Bot with PM2**:
   ```bash
   pm2 start server-monitor-bot/index.js --name "server-watchdog"
   pm2 save
   ```

3. **Check status in PM2**:
   ```bash
   pm2 list
   ```

4. **Test on Phone**:
   - Open Telegram, search for your Bot (`@your_bot_name`).
   - Send `/start`.
   - The interactive button menu will appear. Tap any button to test!
