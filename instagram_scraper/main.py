"""
Local Instagram scraper server.
Run: python main.py
Then open: http://localhost:8001
"""

import asyncio
import logging
import logging.handlers
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

import config
from scraper import InstagramScraper

# ── Logging setup ──────────────────────────────────────────────────────────────

Path(config.LOG_DIR).mkdir(exist_ok=True)
Path(config.SESSION_DIR).mkdir(exist_ok=True)

_log_handler = logging.handlers.RotatingFileHandler(
    f"{config.LOG_DIR}/scraper.log", maxBytes=10_000_000, backupCount=5
)
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(), _log_handler],
)
logger = logging.getLogger("main")

# ── Global state ───────────────────────────────────────────────────────────────

scraper: InstagramScraper = InstagramScraper()
_progress_log: list[str] = []
_status = {
    "logged_in": False,
    "running": False,
    "last_result": None,
}


def _push(msg: str):
    _progress_log.append(msg)
    if len(_progress_log) > 200:
        _progress_log.pop(0)


# ── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(title="Instagram Scraper")

# ── HTML UI ────────────────────────────────────────────────────────────────────

UI = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Penta System — Instagram Scraper</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #F0F2F5; display: flex; min-height: 100vh; }

    /* Sidebar */
    aside {
      width: 240px; background: #0A2342; color: #fff;
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
      padding: 28px 24px 20px;
    }
    aside .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    aside .badge {
      display: inline-block; margin-top: 6px;
      background: rgba(201,168,76,0.2); border: 1px solid rgba(201,168,76,0.4);
      border-radius: 6px; padding: 2px 10px; font-size: 10px; font-weight: 700;
      color: #f0d98a; letter-spacing: 1.5px; text-transform: uppercase;
    }
    aside .sep { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0; }
    aside .info { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
    aside .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

    /* Main */
    main { margin-left: 240px; flex: 1; padding: 28px; }

    .card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07); padding: 24px; margin-bottom: 20px;
    }
    .card-title { font-size: 15px; font-weight: 700; color: #0A2342; margin-bottom: 16px; }

    label { font-size: 13px; font-weight: 600; color: #555; display: block; margin-bottom: 5px; }
    input[type=text], input[type=number] {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
      font-size: 14px; margin-bottom: 14px;
    }
    input:focus { outline: none; border-color: #C9A84C; }

    .row { display: flex; gap: 12px; }
    .row > * { flex: 1; }

    .btn {
      padding: 10px 20px; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: #0A2342; color: #fff; }
    .btn-gold    { background: #C9A84C; color: #fff; }
    .btn-danger  { background: #fee2e2; color: #991b1b; }
    .btn-outline { background: #fff; color: #0A2342; border: 1px solid #0A2342; }

    .progress-box {
      background: #0d1728; border-radius: 8px;
      font-family: 'Courier New', monospace; font-size: 12px;
      color: #7dd3fc; padding: 16px; height: 280px;
      overflow-y: auto; line-height: 1.7;
    }
    .progress-box .line-ok   { color: #6ee7b7; }
    .progress-box .line-warn { color: #fbbf24; }
    .progress-box .line-err  { color: #fca5a5; }

    .stat { text-align: center; }
    .stat .val { font-size: 28px; font-weight: 800; color: #0A2342; }
    .stat .lbl { font-size: 12px; color: #888; margin-top: 2px; }

    .warning-box {
      background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.4);
      border-radius: 8px; padding: 12px 16px;
      font-size: 12px; color: #92400e; line-height: 1.6;
    }
  </style>
</head>
<body>

<aside>
  <div class="logo">Penta System</div>
  <div class="badge">Instagram Scraper</div>
  <hr class="sep">
  <div class="info">
    <div style="margin-bottom:8px">
      <span class="status-dot" id="loginDot" style="background:#888"></span>
      <span id="loginStatus">Checking...</span>
    </div>
    <div>
      <span class="status-dot" id="runDot" style="background:#888"></span>
      <span id="runStatus">Idle</span>
    </div>
  </div>
  <hr class="sep">
  <div class="info">
    Results are saved directly to your Railway database and appear in the main system.
  </div>
</aside>

<main>
  <!-- Warning -->
  <div class="warning-box" style="margin-bottom:20px">
    ⚠️ Use a <strong>secondary Instagram account</strong>, never your main one. Keep the browser visible — do not minimize it during scraping.
  </div>

  <!-- Session -->
  <div class="card">
    <div class="card-title">Session Management</div>
    <div class="row" style="gap:10px">
      <button class="btn btn-gold" onclick="doLogin()">Login to Instagram</button>
      <button class="btn btn-outline" onclick="checkStatus()">Check Login Status</button>
    </div>
    <div id="sessionMsg" style="margin-top:10px;font-size:13px;color:#888"></div>
  </div>

  <!-- Scrape config -->
  <div class="card">
    <div class="card-title">Start Scraping</div>

    <label>Search Keyword</label>
    <input type="text" id="keyword" placeholder="e.g. dubai doctors, uae investors, dubai architects" />

    <div class="row">
      <div>
        <label>Max Accounts</label>
        <input type="number" id="maxResults" value="30" min="5" max="200" />
      </div>
      <div>
        <label>Delay Between (seconds)</label>
        <input type="number" id="minDelay" value="5" min="2" max="30" />
      </div>
    </div>

    <div class="row" style="gap:10px">
      <button class="btn btn-primary" id="startBtn" onclick="startScrape()">▶ Start Scraping</button>
      <button class="btn btn-danger" id="stopBtn" onclick="stopScrape()" disabled>■ Stop</button>
    </div>
  </div>

  <!-- Progress -->
  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
      <span>Live Progress</span>
      <button class="btn btn-outline" style="padding:4px 10px;font-size:12px" onclick="clearLog()">Clear</button>
    </div>
    <div class="progress-box" id="progressBox">
      <span style="color:#555">Waiting to start...</span>
    </div>
  </div>

  <!-- Stats -->
  <div class="card">
    <div class="card-title">Last Session Results</div>
    <div class="row" id="statsRow">
      <div class="stat"><div class="val" id="statScraped">—</div><div class="lbl">Visited</div></div>
      <div class="stat"><div class="val" id="statSaved">—</div><div class="lbl">Saved</div></div>
      <div class="stat"><div class="val" id="statErrors">—</div><div class="lbl">Errors</div></div>
    </div>
  </div>
</main>

<script>
  let pollInterval = null;

  async function checkStatus() {
    try {
      const r = await fetch('/api/status');
      const d = await r.json();
      updateStatus(d);
    } catch(e) { setMsg('sessionMsg', 'Could not reach local server', 'red'); }
  }

  function updateStatus(d) {
    document.getElementById('loginDot').style.background  = d.logged_in ? '#6ee7b7' : '#fca5a5';
    document.getElementById('loginStatus').textContent    = d.logged_in ? 'Logged in' : 'Not logged in';
    document.getElementById('runDot').style.background    = d.running   ? '#6ee7b7' : '#888';
    document.getElementById('runStatus').textContent      = d.running   ? 'Scraping...' : 'Idle';
    document.getElementById('startBtn').disabled          = d.running;
    document.getElementById('stopBtn').disabled           = !d.running;

    if (d.last_result) {
      document.getElementById('statScraped').textContent = d.last_result.scraped;
      document.getElementById('statSaved').textContent   = d.last_result.saved;
      document.getElementById('statErrors').textContent  = d.last_result.errors;
    }
  }

  async function doLogin() {
    setMsg('sessionMsg', 'Opening browser for login — complete it there, including 2FA if asked...');
    try {
      const r  = await fetch('/api/login', { method: 'POST' });
      const d  = await r.json();
      setMsg('sessionMsg', d.ok ? '✓ Logged in successfully' : '✗ Login failed — check browser', d.ok ? 'green' : 'red');
      checkStatus();
    } catch(e) { setMsg('sessionMsg', 'Error contacting local server', 'red'); }
  }

  async function startScrape() {
    const keyword = document.getElementById('keyword').value.trim();
    if (!keyword) { alert('Please enter a keyword'); return; }
    const max = parseInt(document.getElementById('maxResults').value) || 30;

    clearLog();
    appendLog('Starting scrape for: ' + keyword);

    try {
      const r = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, max_results: max }),
      });
      const d = await r.json();
      if (!d.ok) { appendLog('ERROR: ' + (d.detail || 'Failed to start'), 'err'); return; }
    } catch(e) { appendLog('ERROR: ' + e.message, 'err'); return; }

    // Poll progress
    pollInterval = setInterval(async () => {
      const s = await fetch('/api/status').then(r => r.json()).catch(() => null);
      if (!s) return;
      updateStatus(s);

      const logs = await fetch('/api/progress').then(r => r.json()).catch(() => []);
      if (logs.length) {
        const box = document.getElementById('progressBox');
        box.innerHTML = logs.map(l => {
          const cls = l.includes('✓') ? 'line-ok' : l.includes('✗') || l.toLowerCase().includes('error') ? 'line-err' : l.includes('break') || l.includes('warn') ? 'line-warn' : '';
          return `<div class="${cls}">${escHtml(l)}</div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
      }

      if (!s.running) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }, 2000);
  }

  async function stopScrape() {
    await fetch('/api/stop', { method: 'POST' });
    appendLog('Stop signal sent...', 'warn');
  }

  function clearLog() {
    document.getElementById('progressBox').innerHTML = '';
  }

  function appendLog(msg, type = '') {
    const box = document.getElementById('progressBox');
    const div = document.createElement('div');
    div.className = type === 'err' ? 'line-err' : type === 'warn' ? 'line-warn' : type === 'ok' ? 'line-ok' : '';
    div.textContent = msg;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function setMsg(id, msg, color = '#888') {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.color = color === 'green' ? '#065f46' : color === 'red' ? '#991b1b' : color;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Initial status check
  checkStatus();
  setInterval(checkStatus, 10000);
</script>
</body>
</html>"""


# ── API endpoints ──────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def index():
    return UI


@app.get("/api/status")
def get_status():
    return {
        "logged_in":   _status["logged_in"],
        "running":     scraper.is_running,
        "last_result": _status["last_result"],
    }


@app.post("/api/login")
async def do_login():
    try:
        if not scraper._context:
            await scraper.start()
        ok = await scraper.login(progress_cb=_push)
        _status["logged_in"] = ok
        return {"ok": ok}
    except Exception as e:
        logger.error(f"Login error: {e}")
        return JSONResponse({"ok": False, "detail": str(e)}, status_code=500)


class StartBody(BaseModel):
    keyword: str
    max_results: int = 30


@app.post("/api/start")
async def start_scrape(body: StartBody):
    if scraper.is_running:
        return JSONResponse({"ok": False, "detail": "Already running"}, status_code=400)

    if not scraper._context:
        await scraper.start()

    logged_in = await scraper.is_logged_in()
    if not logged_in:
        return JSONResponse({"ok": False, "detail": "Not logged in — click 'Login to Instagram' first"}, status_code=401)

    _status["logged_in"] = True
    _progress_log.clear()

    async def _run():
        result = await scraper.run(
            keyword=body.keyword,
            max_results=body.max_results,
            progress_cb=_push,
        )
        _status["last_result"] = result

    asyncio.create_task(_run())
    return {"ok": True}


@app.post("/api/stop")
def stop_scrape():
    scraper.stop_scrape()
    return {"ok": True}


@app.get("/api/progress")
def get_progress():
    return _progress_log[-100:]  # last 100 log lines


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  Penta System — Instagram Scraper")
    print("  Open in browser: http://localhost:8001")
    print("="*55 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="warning")
