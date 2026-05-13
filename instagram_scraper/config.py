import os
from dotenv import load_dotenv

load_dotenv()

INSTAGRAM_USERNAME = os.environ["INSTAGRAM_USERNAME"]
INSTAGRAM_PASSWORD = os.environ["INSTAGRAM_PASSWORD"]

RAILWAY_API_URL = os.environ.get("RAILWAY_API_URL", "https://penta-crm-production.up.railway.app")
SCRAPER_API_KEY  = os.environ.get("SCRAPER_API_KEY", "")

MAX_RESULTS   = int(os.environ.get("SCRAPER_MAX_RESULTS", 50))
MIN_DELAY     = float(os.environ.get("SCRAPER_MIN_DELAY", 5))
MAX_DELAY     = float(os.environ.get("SCRAPER_MAX_DELAY", 15))
BREAK_EVERY   = int(os.environ.get("SCRAPER_BREAK_EVERY", 20))
BREAK_SECONDS = int(os.environ.get("SCRAPER_BREAK_SECONDS", 120))

SESSION_DIR = "session"
LOG_DIR     = "logs"

# Instagram's stable internal web app ID
IG_APP_ID = "936619743392459"
