"""
Quick end-to-end test of the Gmail + OpenAI pipeline.
Run from the backend directory with the venv active:
    python test_sync.py [batch_size]
"""
import os
import sys
import django

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import UserProfile  # noqa: E402
from services.gmail_service import fetch_messages  # noqa: E402
from services.openai_service import classify_batch  # noqa: E402

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 5


def main() -> None:
    profile = UserProfile.objects.select_related("user").first()
    if not profile:
        print("No UserProfile found. Log in via OAuth first.")
        return

    print(f"User : {profile.user.email}")
    print(f"Batch: {BATCH} emails\n")

    # ── Step 1: Gmail fetch ────────────────────────────────────────────────────
    print("--- Gmail fetch -------------------------------------------")
    messages, new_history_id = fetch_messages(profile, batch_size=BATCH)
    print(f"Fetched {len(messages)} message(s). New historyId: {new_history_id}\n")

    for i, m in enumerate(messages, 1):
        print(f"  [{i}] {m['subject'][:70]}")
        print(f"       From   : {m['sender']}")
        print(f"       Date   : {m['received_at'].strftime('%Y-%m-%d %H:%M')}")
        print(f"       Snippet: {m['body_snippet'][:80]}")
        print(f"       Body   : {len(m['body'])} chars")
        print()

    if not messages:
        print("No messages fetched — nothing to classify.")
        return

    # ── Step 2: OpenAI two-pass classification ─────────────────────────────────
    print("--- OpenAI classification ---------------------------------")
    results = classify_batch(messages)
    result_map = {r["gmail_message_id"]: r for r in results}

    relevant = [r for r in results if r["relevant"]]
    skipped  = [r for r in results if not r["relevant"]]

    print(f"Relevant (classified): {len(relevant)}")
    print(f"Skipped (not job-related): {len(skipped)}\n")

    for m in messages:
        r = result_map.get(m["gmail_message_id"], {})
        label = r.get("label") or "—"
        conf  = f"{r.get('confidence', 0):.0%}" if r.get("label") else "—"
        flag  = "Y" if r.get("relevant") else "N"
        print(f"  {flag} [{label:<22}] {conf:>4}  {m['subject'][:55]}")

    print("\nDone.")


if __name__ == "__main__":
    main()
