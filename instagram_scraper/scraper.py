"""
Instagram profile scraper using Playwright.
Searches accounts by keyword, extracts public contact info from bios,
posts results to the Railway backend.
"""

import asyncio
import json
import logging
import random
import re
from pathlib import Path
from typing import Callable

import httpx
from playwright.async_api import async_playwright, BrowserContext, Page

import config

logger = logging.getLogger("scraper")

# ── Regex patterns for bio contact extraction ──────────────────────────────────

EMAIL_RE    = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE    = re.compile(r"(?:\+?\d[\d\s\-().]{7,}\d)")
WHATSAPP_RE = re.compile(r"(?:wa\.me|api\.whatsapp\.com/send)[^\s\"'<>]+", re.I)


def _extract_email(text: str) -> str:
    m = EMAIL_RE.search(text or "")
    return m.group(0).lower() if m else ""


def _extract_phone(text: str) -> str:
    m = PHONE_RE.search(text or "")
    if not m:
        return ""
    raw = re.sub(r"[\s\-()]", "", m.group(0))
    # Ignore strings that look more like years/IDs than phones
    if len(raw.replace("+", "")) < 7:
        return ""
    return raw


def _extract_whatsapp(text: str) -> str:
    m = WHATSAPP_RE.search(text or "")
    return f"https://{m.group(0)}" if m else ""


def _score(profile: dict) -> int:
    score = 0
    if profile.get("email"):    score += 3
    if profile.get("phone"):    score += 3
    if profile.get("whatsapp"): score += 2
    fc = profile.get("follower_count") or 0
    if 1_000 <= fc <= 50_000:   score += 1
    if profile.get("is_business_account"): score += 1
    return min(score, 10)


# ── IG API helpers (called from within the browser context) ────────────────────

_HEADERS_JS = f"""
    {{
        'X-IG-App-ID': '{config.IG_APP_ID}',
        'X-Requested-With': 'XMLHttpRequest',
    }}
"""

SEARCH_JS = """
    async (keyword) => {
        const csrf = (document.cookie.split(';').find(c => c.trim().startsWith('csrftoken=')) || '').split('=')[1] || '';
        const url = `/api/v1/web/search/topsearch/?query=${encodeURIComponent(keyword)}&context=blended`;
        const r = await fetch(url, {
            headers: {
                'X-IG-App-ID': '936619743392459',
                'X-CSRFToken': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        if (!r.ok) return null;
        return await r.json();
    }
"""

PROFILE_JS = """
    async (username) => {
        const csrf = (document.cookie.split(';').find(c => c.trim().startsWith('csrftoken=')) || '').split('=')[1] || '';
        const url = `/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
        const r = await fetch(url, {
            headers: {
                'X-IG-App-ID': '936619743392459',
                'X-CSRFToken': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        if (!r.ok) return null;
        return await r.json();
    }
"""


# ── Main scraper class ─────────────────────────────────────────────────────────

class InstagramScraper:
    def __init__(self):
        self._playwright = None
        self._browser    = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None
        self._running   = False
        self._stop_flag = False

    # ── Session management ─────────────────────────────────────────────────────

    async def start(self):
        """Launch browser and load saved session if available."""
        Path(config.SESSION_DIR).mkdir(exist_ok=True)
        Path(config.LOG_DIR).mkdir(exist_ok=True)

        self._playwright = await async_playwright().start()

        storage_file = Path(config.SESSION_DIR) / "state.json"
        viewport = random.choice([
            {"width": 1366, "height": 768},
            {"width": 1920, "height": 1080},
            {"width": 1440, "height": 900},
        ])

        self._context = await self._playwright.chromium.launch_persistent_context(
            user_data_dir=str(Path(config.SESSION_DIR) / "profile"),
            channel="chrome",               # use real Chrome, not Chromium
            headless=False,                 # visible browser — required for login
            viewport=viewport,
            args=["--disable-blink-features=AutomationControlled"],
        )

        # Apply stealth patches
        try:
            from playwright_stealth import stealth_async
            self._page = self._context.pages[0] if self._context.pages else await self._context.new_page()
            await stealth_async(self._page)
        except ImportError:
            logger.warning("playwright-stealth not installed — running without stealth")
            self._page = self._context.pages[0] if self._context.pages else await self._context.new_page()

        logger.info("Browser launched")

    async def stop(self):
        self._stop_flag = True
        if self._context:
            await self._context.close()
        if self._playwright:
            await self._playwright.stop()
        logger.info("Browser closed")

    async def is_logged_in(self) -> bool:
        try:
            await self._page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(2)
            # If the login button is present, we're NOT logged in
            return await self._page.locator('a[href="/accounts/login/"]').count() == 0
        except Exception:
            return False

    async def login(self, progress_cb: Callable | None = None) -> bool:
        """Log in to Instagram. Pauses for 2FA if needed."""
        if progress_cb:
            progress_cb("Navigating to Instagram login...")

        await self._page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded")
        await asyncio.sleep(random.uniform(2, 4))

        try:
            await self._page.fill('input[name="username"]', config.INSTAGRAM_USERNAME)
            await asyncio.sleep(random.uniform(0.5, 1.5))
            await self._page.fill('input[name="password"]', config.INSTAGRAM_PASSWORD)
            await asyncio.sleep(random.uniform(0.5, 1.0))
            await self._page.click('button[type="submit"]')
        except Exception as e:
            logger.error(f"Login form error: {e}")
            return False

        # Wait up to 30s for either the home feed or a 2FA prompt
        if progress_cb:
            progress_cb("Waiting for login... (handle 2FA in the browser if prompted)")

        for _ in range(30):
            await asyncio.sleep(1)
            url = self._page.url
            if "instagram.com/" in url and "/accounts/login" not in url and "/challenge" not in url:
                logger.info("Login successful")
                if progress_cb:
                    progress_cb("Logged in successfully ✓")
                return True
            if "/challenge" in url or "/two_factor" in url:
                if progress_cb:
                    progress_cb("2FA detected — please complete it in the browser, then wait...")

        logger.warning("Login timed out — may need manual action")
        return False

    # ── Search ─────────────────────────────────────────────────────────────────

    async def search_accounts(self, keyword: str, max_results: int) -> list[str]:
        """Return a list of usernames matching the keyword."""
        logger.info(f"Searching for: {keyword}")

        # Must be on Instagram domain for session cookies to be sent
        if "instagram.com" not in self._page.url:
            await self._page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
            await asyncio.sleep(2)

        try:
            result = await self._page.evaluate(SEARCH_JS, keyword)
        except Exception as e:
            logger.error(f"Search API call failed: {e}")
            return []

        if not result or "users" not in result:
            logger.warning(f"No users found for '{keyword}'")
            return []

        usernames = [u["user"]["username"] for u in result["users"] if "user" in u]
        logger.info(f"Found {len(usernames)} accounts for '{keyword}'")
        return usernames[:max_results]

    # ── Profile extraction ─────────────────────────────────────────────────────

    async def get_profile(self, username: str) -> dict | None:
        """Fetch profile data via Instagram's internal API."""
        try:
            data = await self._page.evaluate(PROFILE_JS, username)
        except Exception as e:
            logger.error(f"Profile API call failed for @{username}: {e}")
            return None

        if not data:
            return None

        try:
            user = data["data"]["user"]
        except (KeyError, TypeError):
            logger.warning(f"Unexpected profile response for @{username}")
            return None

        bio = user.get("biography", "")
        email   = user.get("business_email", "") or _extract_email(bio)
        phone   = user.get("business_phone_number", "") or _extract_phone(bio)
        whatsapp = _extract_whatsapp(bio)
        website = user.get("external_url", "")

        profile = {
            "username":             username,
            "display_name":         user.get("full_name", ""),
            "bio":                  bio,
            "email":                email,
            "phone":                phone,
            "whatsapp":             whatsapp,
            "website":              website,
            "follower_count":       (user.get("edge_followed_by") or {}).get("count"),
            "following_count":      (user.get("edge_follow") or {}).get("count"),
            "post_count":           (user.get("edge_owner_to_timeline_media") or {}).get("count"),
            "is_verified":          bool(user.get("is_verified")),
            "is_business_account":  bool(user.get("is_business_account")),
            "profile_picture_url":  user.get("profile_pic_url_hd") or user.get("profile_pic_url", ""),
        }
        profile["lead_score"] = _score(profile)
        return profile

    # ── Human-like behaviour ───────────────────────────────────────────────────

    async def _human_pause(self, profile_index: int):
        """Random delay + longer break every N profiles."""
        delay = random.uniform(config.MIN_DELAY, config.MAX_DELAY)
        await asyncio.sleep(delay)

        if profile_index > 0 and profile_index % config.BREAK_EVERY == 0:
            logger.info(f"Taking a {config.BREAK_SECONDS}s break after {profile_index} profiles")
            await asyncio.sleep(config.BREAK_SECONDS)

    async def _simulate_browse(self):
        """Occasionally scroll or click a post to look human."""
        if random.random() < 0.3:
            await self._page.evaluate("window.scrollBy(0, Math.random() * 400 + 100)")
            await asyncio.sleep(random.uniform(0.5, 1.5))
            if random.random() < 0.3:
                await self._page.evaluate("window.scrollBy(0, -(Math.random() * 200 + 50))")

    # ── Post results to Railway ────────────────────────────────────────────────

    async def _save_profile(self, profile: dict, keyword: str) -> bool:
        profile["search_keyword"] = keyword
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(
                    f"{config.RAILWAY_API_URL}/api/instagram/leads/upsert",
                    json=profile,
                    headers={"X-Scraper-Key": config.SCRAPER_API_KEY},
                )
                if r.status_code == 200:
                    return True
                logger.warning(f"Upsert failed for @{profile['username']}: {r.status_code} {r.text}")
                return False
        except Exception as e:
            logger.error(f"Network error saving @{profile['username']}: {e}")
            return False

    # ── Main run loop ──────────────────────────────────────────────────────────

    async def run(
        self,
        keyword: str,
        max_results: int,
        progress_cb: Callable | None = None,
    ) -> dict:
        """
        Search Instagram for `keyword`, visit each account, extract data,
        post to Railway. Returns summary stats.
        """
        self._running   = True
        self._stop_flag = False
        saved = 0
        errors = 0

        def _emit(msg: str):
            logger.info(msg)
            if progress_cb:
                progress_cb(msg)

        try:
            usernames = await self.search_accounts(keyword, max_results)
            if not usernames:
                _emit("No accounts found for that keyword.")
                return {"scraped": 0, "saved": 0, "errors": 0}

            _emit(f"Found {len(usernames)} accounts — starting profile visits...")

            for i, username in enumerate(usernames):
                if self._stop_flag:
                    _emit("Stopped by user.")
                    break

                _emit(f"[{i+1}/{len(usernames)}] Visiting @{username}...")

                profile = await self.get_profile(username)
                if not profile:
                    errors += 1
                    _emit(f"  ✗ Could not fetch @{username}")
                else:
                    await self._simulate_browse()
                    ok = await self._save_profile(profile, keyword)
                    if ok:
                        saved += 1
                        _emit(f"  ✓ Saved @{username} (score {profile['lead_score']})")
                    else:
                        errors += 1

                await self._human_pause(i + 1)

            _emit(f"Done — {saved} saved, {errors} errors out of {len(usernames)} accounts.")
            return {"scraped": len(usernames), "saved": saved, "errors": errors}

        finally:
            self._running = False

    def stop_scrape(self):
        self._stop_flag = True

    @property
    def is_running(self):
        return self._running
