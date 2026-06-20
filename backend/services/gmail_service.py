import base64
import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

from django.conf import settings
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def _get_credentials(profile) -> Credentials:
    """Return valid credentials, refreshing the access token if it has expired."""
    creds = Credentials(
        token=profile.google_access_token,
        refresh_token=profile.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        profile.google_access_token = creds.token
        profile.token_expiry = creds.expiry
        profile.save(update_fields=["google_access_token", "token_expiry"])
    return creds


def _header(headers: list[dict], name: str) -> str:
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""


def _decode(data: str) -> str:
    try:
        # Gmail uses URL-safe base64; pad to multiple of 4
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    except Exception:
        return ""


def _extract_text(payload: dict) -> str:
    """Recursively walk a Gmail message payload and return the best plain-text body."""
    mime = payload.get("mimeType", "")

    if mime == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return _decode(data) if data else ""

    if mime.startswith("multipart/"):
        parts = payload.get("parts", [])
        # For multipart/alternative prefer text/plain over text/html
        plain = next((p for p in parts if p.get("mimeType") == "text/plain"), None)
        if plain:
            return _extract_text(plain)
        for part in parts:
            text = _extract_text(part)
            if text:
                return text

    if mime == "text/html":
        data = payload.get("body", {}).get("data", "")
        if data:
            html = _decode(data)
            # Strip HTML tags; collapse whitespace
            text = re.sub(r"<[^>]+>", " ", html)
            return re.sub(r"\s{2,}", " ", text).strip()

    return ""


def _parse_date(date_str: str) -> datetime:
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def _parse_message(msg: dict) -> dict:
    headers = msg.get("payload", {}).get("headers", [])
    body = _extract_text(msg.get("payload", {}))
    return {
        "gmail_message_id": msg["id"],
        "subject": _header(headers, "subject") or "(no subject)",
        "sender": _header(headers, "from"),
        "body_snippet": msg.get("snippet", ""),
        # Cap at 4000 chars — enough for accurate classification, avoids huge token bills
        "body": body[:4000].strip(),
        "received_at": _parse_date(_header(headers, "date")),
    }


def fetch_messages(profile, batch_size: int) -> tuple[list[dict], str | None]:
    """
    Fetch up to batch_size inbox messages for the given user profile.

    Uses incremental history sync when profile.gmail_history_id is set;
    falls back to a full list fetch on first run or if history has expired.

    Returns (list_of_parsed_message_dicts, new_history_id).
    """
    creds = _get_credentials(profile)
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)

    stubs: list[dict] = []
    new_history_id: str | None = None

    if profile.gmail_history_id:
        try:
            result = service.users().history().list(
                userId="me",
                startHistoryId=profile.gmail_history_id,
                historyTypes=["messageAdded"],
                maxResults=batch_size,
            ).execute()
            new_history_id = result.get("historyId")
            for record in result.get("history", []):
                for added in record.get("messagesAdded", []):
                    msg = added.get("message", {})
                    if "INBOX" in msg.get("labelIds", []):
                        stubs.append({"id": msg["id"]})
        except HttpError as exc:
            if exc.resp.status == 404:
                logger.info("History ID expired or too old; falling back to full list fetch.")
            else:
                raise

    # First sync or history expired: list most recent inbox messages
    if not stubs and not new_history_id:
        result = service.users().messages().list(
            userId="me",
            labelIds=["INBOX"],
            maxResults=batch_size,
        ).execute()
        stubs = result.get("messages", [])
        profile_info = service.users().getProfile(userId="me").execute()
        new_history_id = profile_info.get("historyId")

    if not stubs:
        return [], new_history_id

    # Each thread builds its own service to avoid httplib2 thread-safety issues
    def _fetch_one(stub: dict) -> dict | None:
        try:
            svc = build("gmail", "v1", credentials=creds, cache_discovery=False)
            return svc.users().messages().get(
                userId="me", id=stub["id"], format="full"
            ).execute()
        except Exception as exc:
            logger.warning(f"Skipping message {stub['id']}: {exc}")
            return None

    full_messages: list[dict] = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(_fetch_one, s): s for s in stubs}
        for fut in as_completed(futures):
            msg = fut.result()
            if msg:
                full_messages.append(msg)

    return [_parse_message(m) for m in full_messages], new_history_id
