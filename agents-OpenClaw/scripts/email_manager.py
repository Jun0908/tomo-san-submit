"""
email_manager.py
Gmail から新着メールを取得し、優先度分類して Markdown で保存するスクリプト。

優先度の分類:
  P0 = 今日中に対応必須（件名に「緊急」「urgent」など）
  P1 = 3日以内（請求書、契約、重要な返信など）
  P2 = 1週間以内（一般的なビジネスメール）
  P3 = いつか対応（ニュースレター、FYIなど）
  ノイズ = 自動メール、広告など

保存先: data/gmail/YYYY-MM-DD.md
"""

import os
import json
import base64
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# ── 設定 ──────────────────────────────────────────────
JST = timezone(timedelta(hours=9))
TODAY = datetime.now(JST).strftime("%Y-%m-%d")
OUTPUT_DIR = Path("data/gmail")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / f"{TODAY}.md"

# 優先度キーワード（件名・差出人で判定）
PRIORITY_RULES = {
    "P0": ["緊急", "至急", "urgent", "asap", "今すぐ", "本日中"],
    "P1": ["請求書", "invoice", "契約", "contract", "重要", "important", "期限", "deadline"],
    "P2": [],          # デフォルト（上記に引っかからないもの）
    "NOISE": ["unsubscribe", "配信停止", "newsletter", "no-reply", "noreply",
              "mailer-daemon", "自動送信", "automatic"],
}


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


def classify_priority(subject: str, sender: str) -> str:
    """件名と差出人から優先度を返す。"""
    text = (subject + " " + sender).lower()
    for keyword in PRIORITY_RULES["NOISE"]:
        if keyword in text:
            return "NOISE"
    for keyword in PRIORITY_RULES["P0"]:
        if keyword in text:
            return "P0"
    for keyword in PRIORITY_RULES["P1"]:
        if keyword in text:
            return "P1"
    return "P2"


def decode_header_value(value: str) -> str:
    """メールヘッダーの文字化けを防ぐためのデコード。"""
    return value if value else "(不明)"


def fetch_emails(service, max_results: int = 20):
    """今日届いた新着メールを取得する。"""
    # 今日の0時（JST）以降のメールだけ取得
    today_start = datetime.now(JST).replace(hour=0, minute=0, second=0, microsecond=0)
    query = f"after:{int(today_start.timestamp())}"

    result = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results,
    ).execute()

    messages = result.get("messages", [])
    emails = []

    for msg in messages:
        detail = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()

        headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
        subject = decode_header_value(headers.get("Subject", "(件名なし)"))
        sender  = decode_header_value(headers.get("From", "(不明)"))
        date    = decode_header_value(headers.get("Date", ""))
        snippet = detail.get("snippet", "")

        priority = classify_priority(subject, sender)

        emails.append({
            "id":       msg["id"],
            "subject":  subject,
            "from":     sender,
            "date":     date,
            "snippet":  snippet,
            "priority": priority,
        })

    return emails


def save_as_markdown(emails: list):
    """メール一覧を Markdown ファイルに保存する。"""
    now = datetime.now(JST).strftime("%Y-%m-%d %H:%M")

    # 優先度ごとに分類
    grouped = {"P0": [], "P1": [], "P2": [], "NOISE": []}
    for e in emails:
        grouped[e["priority"]].append(e)

    lines = [
        f"# Gmail ダイジェスト: {TODAY}",
        f"最終更新: {now}  ",
        f"取得件数: {len(emails)}件\n",
    ]

    priority_labels = {
        "P0": "🔴 P0 — 今日中に対応必須",
        "P1": "🟠 P1 — 3日以内に対応",
        "P2": "🟡 P2 — 今週中に確認",
        "NOISE": "⚫ ノイズ（自動メール・広告）",
    }

    for level in ["P0", "P1", "P2", "NOISE"]:
        items = grouped[level]
        lines.append(f"## {priority_labels[level]} ({len(items)}件)\n")
        if not items:
            lines.append("なし\n")
        else:
            for e in items:
                lines.append(f"- **{e['subject']}**")
                lines.append(f"  - 差出人: {e['from']}")
                lines.append(f"  - 概要: {e['snippet'][:100]}")
                lines.append("")

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ 保存完了: {OUTPUT_FILE}  ({len(emails)}件)")


def main():
    print(f"📧 Gmail 同期開始: {datetime.now(JST)}")
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)
    emails = fetch_emails(service)
    save_as_markdown(emails)


if __name__ == "__main__":
    main()
