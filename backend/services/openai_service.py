import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable

from openai import OpenAI

logger = logging.getLogger(__name__)

VALID_LABELS = frozenset({
    "auto_acknowledgement",
    "rejection",
    "interview_invite",
    "follow_up_required",
    "recruiter_outreach",
    "offer",
})

_RELEVANCE_SYSTEM = """You are an email relevance filter for a job-search tracker.

Decide if this email is related to job searching or employment:
YES: job applications, rejection emails, interview invitations, recruiter messages,
     job offers, application acknowledgements, hiring assessments, background checks,
     reference requests, offer letters, compensation discussions
NO:  newsletters, promotions, order confirmations, LinkedIn content digests,
     social notifications, billing, password resets, spam

Respond ONLY with valid JSON: {"relevant": true} or {"relevant": false}"""

_CLASSIFY_SYSTEM = """You are a precise email classifier for job seekers.
Assign exactly one label. Read the FULL body before deciding — do not rely on the subject alone.

LABELS and their distinguishing signals:

auto_acknowledgement
  - Application was RECEIVED; no hiring decision has been made yet
  - Signals: "your application has been received", "we'll be in touch", "the team will review",
    "thank you for applying", "application submitted", LinkedIn "Your application to X at Y" emails
  - The body confirms receipt only — no acceptance or rejection language

rejection
  - Candidacy explicitly DECLINED; the door is closed
  - Signals: "we've decided to move forward with other candidates", "not selected",
    "unfortunately", "we regret to inform you", "position has been filled",
    "we will not be moving forward", "after careful consideration"
  - Must contain a clear final decision — NOT just an acknowledgement of receipt

interview_invite
  - Recruiter or hiring manager asks to SCHEDULE or CONFIRM an interview
  - Signals: "schedule a call", "availability", "we'd like to speak with you",
    "phone screen", "technical interview", "onsite", "Calendly link", "video interview"

follow_up_required
  - Applicant must take an ACTION to continue the process
  - Signals: complete an assessment, coding challenge, provide references,
    fill out forms, background check authorization, submit work sample

recruiter_outreach
  - Unsolicited message presenting a NEW job opportunity
  - Signals: "I came across your profile", "we have a role that might interest you",
    "are you open to opportunities", job description in the body from a recruiter

offer
  - Formal job offer or clear indication one is coming
  - Signals: salary/compensation details, start date, offer letter, "we'd like to offer you"

Respond ONLY with valid JSON: {"label": "<one label>", "confidence": <0.0–1.0>}"""


def _chat(client: OpenAI, system: str, user_text: str, max_tokens: int = 60) -> str:
    """Single chat completion with 3-attempt exponential backoff."""
    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_text},
                ],
                max_tokens=max_tokens,
                temperature=0,
            )
            return resp.choices[0].message.content or ""
        except Exception as exc:
            if attempt == 2:
                raise
            wait = 2 ** attempt
            logger.warning(f"OpenAI attempt {attempt + 1} failed ({exc}); retrying in {wait}s")
            time.sleep(wait)
    return ""


def _is_relevant(client: OpenAI, subject: str, snippet: str) -> bool:
    """Pass 1 — cheap relevance check using subject + snippet only."""
    user_text = f"Subject: {subject}\nSnippet: {snippet[:300]}"
    try:
        raw = _chat(client, _RELEVANCE_SYSTEM, user_text, max_tokens=20)
        data = json.loads(raw)
        return bool(data.get("relevant", False))
    except Exception as exc:
        logger.warning(f"Relevance check failed for '{subject}': {exc}")
        return False


def _classify(client: OpenAI, subject: str, body: str) -> dict | None:
    """Pass 2 — full classification using subject + body."""
    user_text = f"Subject: {subject}\n\nBody:\n{body[:3500]}"
    try:
        raw = _chat(client, _CLASSIFY_SYSTEM, user_text, max_tokens=60)
        data = json.loads(raw)
        label = data.get("label", "").strip()
        confidence = float(data.get("confidence", 0.0))
        if label not in VALID_LABELS:
            logger.warning(f"Invalid label '{label}' returned for subject '{subject}'")
            return {"label": None, "confidence": 0.0, "raw": raw}
        return {"label": label, "confidence": confidence, "raw": raw}
    except Exception as exc:
        logger.warning(f"Classification failed for '{subject}': {exc}")
        return None


def classify_batch(
    emails: list[dict],
    on_progress: Callable[[dict], None] | None = None,
    max_workers: int = 5,
) -> list[dict]:
    """
    Two-pass classification for a list of email dicts.

    Each dict must have: gmail_message_id, subject, body_snippet, body.
    Returns a list of result dicts with keys:
      gmail_message_id, relevant, label, confidence, raw

    on_progress(result) is called immediately after each email is processed,
    so the caller can update progress counters in real time.
    """
    client = OpenAI()  # reads OPENAI_API_KEY from environment; thread-safe

    def _process(email: dict) -> dict:
        subject = email.get("subject", "")
        snippet = email.get("body_snippet", "")
        body = email.get("body", "")
        gid = email["gmail_message_id"]

        relevant = _is_relevant(client, subject, snippet)

        if not relevant:
            result = {"gmail_message_id": gid, "relevant": False, "label": None, "confidence": 0.0, "raw": None}
            if on_progress:
                on_progress(result)
            return result

        classification = _classify(client, subject, body)
        result = {
            "gmail_message_id": gid,
            "relevant": True,
            "label": classification["label"] if classification else None,
            "confidence": classification["confidence"] if classification else 0.0,
            "raw": classification["raw"] if classification else None,
        }
        if on_progress:
            on_progress(result)
        return result

    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_process, e): e for e in emails}
        for fut in as_completed(futures):
            try:
                results.append(fut.result())
            except Exception as exc:
                email = futures[fut]
                logger.error(f"Unhandled error for {email.get('gmail_message_id')}: {exc}")

    return results
