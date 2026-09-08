from pathlib import Path
from os import getenv

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent

load_dotenv(ROOT_DIR / ".env")

DEFAULT_IDLE_SECONDS = 300
MAX_IDLE_SECONDS = int(getenv("MAX_IDLE_SECONDS", DEFAULT_IDLE_SECONDS))
