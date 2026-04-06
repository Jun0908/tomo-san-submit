"""
expense_append.py
Gmail から領収書・請求書メールを検索し、経費データとして保存するスクリプト。

検索キーワード: 領収書、請求書、receipt、invoice、payment など
保存先: data/expenses/YYYY-MM.md（月ごとに蓄積）
"""

import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from openclaw_core import BASE_DIR

# ── 設定 ──────────────────────────────────────────────
JST = timezone(timedelta(hours=9))
NOW = datetime.now(JST)
TODAY_STR = NOW.strftime("%Y-%m-%d")
MONTH_STR = NOW.strftime("%Y-%m")

EXPENSES_DIR = BASE_DIR / "data" / "expenses"
EXPENSES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = EXPENSES_DIR / f"{MONTH_STR}.md"

# 経費として検出するキーワード（Gmail 検索クエリ）
EXPENSE_QUERY = (
    "subject:(領収書 OR 請求書 OR receipt OR invoice OR 決済 OR payment OR 購入 OR ご利用)"
    " newer_than:1d"
)

# 金額を抽出する正規表現パターン
AMOUNT_PATTERNS = [
    r"¥\s*([\d,]+)",
    r"(\d[\d,]+)\s*円",
    r"\$\s*([\d,]+\.?\d*)",
    r"JPY\s*([\d,]+)",
    r"合計[：:]\s*([\d,]+)",
]


def get_credentials():
    """環境変数から Google OAuth2 認証情報を作成する。"""
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GMAIL_REFRESH_TOKEN"],
        client_id=os.environ["GMAIL_CLIENT_ID"],
        client_secret=os.environ["GMAIL_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
    )
    return creds


def extract_amount(text: str) -> str:
    """テキストから金額を抽出する。"""
    for pattern in AMOUNT_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group(1).replace(",", "")
    return "不明"


def fetch_expense_emails(service):
    """経費関連メールを取得する。"""
    result = service.users().messages().list(
        userId="me",
        q=EXPENSE_QUERY,
        maxResults=30,
    ).execute()

    messages = result.get("messages", [])
    expenses = []

    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()

        headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
        subject = headers.get("Subject", "(件名なし)")
        sender  = headers.get("From", "(不明)")
        date    = headers.get("Date", "")
        snippet = detail.get("snippet", "")

        amount = extract_amount(subject + " " + snippet)

        expenses.append({
            "id":      msg["id"],
            "date":    TODAY_STR,
            "subject": subject,
            "from":    sender,
            "amount":  amount,
            "snippet": snippet[:150],
        })

    return expenses


def load_existing_ids() -> set:
    """すでに記録済みのメールIDを読み込む（重複防止）。"""
    if not OUTPUT_FILE.exists():
        return set()

    content = OUTPUT_FILE.read_text(encoding="utf-8")
    # コメントとして埋め込んだIDを抽出
    ids = set(re.findall(r"<!--msg:([a-zA-Z0-9_-]+)-->", content))
    return ids


def append_expenses(expenses: list, existing_ids: set):
    """新しい経費データをファイルに追記する。"""
    new_expenses = [e for e in expenses if e["id"] not in existing_ids]

    if not new_expenses:
        print("新しい経費データなし")
        return

    # ファイルが存在しない場合はヘッダーを作成
    if not OUTPUT_FILE.exists():
        header = [
            f"# 💰 経費記録: {MONTH_STR}",
            "",
            "| 日付 | 概要 | 金額 | 差出人 |",
            "|------|------|------|--------|",
        ]
        OUTPUT_FILE.write_text("\n".join(header) + "\n", encoding="utf-8")

    with OUTPUT_FILE.open("a", encoding="utf-8") as f:
        for e in new_expenses:
            # テーブル行として追記
            subject_short = e["subject"][:30]
            sender_short  = e["from"][:25]
            amount_display = f"¥{e['amount']}" if e["amount"] != "不明" else "不明"

            f.write(f"| {e['date']} | {subject_short} | {amount_display} | {sender_short} | <!--msg:{e['id']}-->\n")

    print(f"[ok] 経費 {len(new_expenses)}件を追記しました: {OUTPUT_FILE}")


def main():
    print(f"[info] 経費トラッキング開始: {NOW}")
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)
    expenses = fetch_expense_emails(service)
    existing_ids = load_existing_ids()
    append_expenses(expenses, existing_ids)


if __name__ == "__main__":
    main()
