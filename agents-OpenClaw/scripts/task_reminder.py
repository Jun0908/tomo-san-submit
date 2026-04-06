"""
task_reminder.py
Google Tasks からタスクを取得し、期限チェックして Telegram に通知するスクリプト。

通知タイミング:
  - 期限3日前
  - 期限1日前
  - 期限12時間前
  - 期限切れ（💀付きで通知）

保存先: data/tasks/today.md
"""

import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from openclaw_core import BASE_DIR

# ── 設定 ──────────────────────────────────────────────
JST = timezone(timedelta(hours=9))
NOW = datetime.now(JST)
TODAY_STR = NOW.strftime("%Y-%m-%d")

TASKS_DIR = BASE_DIR / "data" / "tasks"
TASKS_DIR.mkdir(parents=True, exist_ok=True)


def get_credentials():
    """環境変数から Google OAuth2 認証情報を作成する。"""
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/tasks.readonly"],
    )
    return creds


def send_telegram(message: str):
    """Telegram に通知を送る。"""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id   = os.environ.get("TELEGRAM_CHAT_ID", "")

    if not bot_token or not chat_id:
        print(f"[warn] Telegram 未設定のため通知スキップ: {message[:50]}")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
    response = requests.post(url, json=payload, timeout=10)
    if response.ok:
        print(f"[ok] Telegram 通知送信: {message[:50]}...")
    else:
        print(f"[error] Telegram 通知失敗: {response.text}")


def fetch_tasks(service):
    """全タスクリストからタスクを取得する。"""
    tasklists = service.tasklists().list().execute().get("items", [])
    all_tasks = []

    for tasklist in tasklists:
        tasks = service.tasks().list(
            tasklist=tasklist["id"],
            showCompleted=False,
            showHidden=False,
        ).execute().get("items", [])

        for task in tasks:
            task["_list_name"] = tasklist["title"]
            all_tasks.append(task)

    return all_tasks


def check_deadline(task):
    """タスクの期限チェックをして、通知が必要な場合はメッセージを返す。"""
    due_str = task.get("due")
    title   = task.get("title", "(タイトルなし)")
    list_name = task.get("_list_name", "")

    if not due_str:
        return None, None

    due = datetime.fromisoformat(due_str.replace("Z", "+00:00")).astimezone(JST)
    diff = due - NOW
    diff_hours = diff.total_seconds() / 3600

    status = None
    message = None

    if diff_hours < 0:
        status = "overdue"
        message = f"💀 <b>期限切れ</b>: {title}\n📋 リスト: {list_name}\n⏰ 期限: {due.strftime('%Y-%m-%d %H:%M')}"
    elif diff_hours <= 12:
        status = "urgent"
        message = f"🔴 <b>12時間以内に期限</b>: {title}\n📋 リスト: {list_name}\n⏰ 期限: {due.strftime('%Y-%m-%d %H:%M')}"
    elif diff_hours <= 24:
        status = "tomorrow"
        message = f"🟠 <b>明日が期限</b>: {title}\n📋 リスト: {list_name}\n⏰ 期限: {due.strftime('%Y-%m-%d %H:%M')}"
    elif diff_hours <= 72:
        status = "soon"
        message = f"🟡 <b>3日以内が期限</b>: {title}\n📋 リスト: {list_name}\n⏰ 期限: {due.strftime('%Y-%m-%d %H:%M')}"

    return status, message


def save_tasks_markdown(tasks):
    """タスク一覧を Markdown ファイルに保存する。"""
    now_str = NOW.strftime("%Y-%m-%d %H:%M")
    lines = [
        f"# ✅ タスク一覧: {TODAY_STR}",
        f"最終更新: {now_str}\n",
    ]

    for task in tasks:
        due_str = task.get("due", "")
        due_display = ""
        if due_str:
            due = datetime.fromisoformat(due_str.replace("Z", "+00:00")).astimezone(JST)
            due_display = f" (期限: {due.strftime('%Y-%m-%d')})"

        title     = task.get("title", "(タイトルなし)")
        list_name = task.get("_list_name", "")
        lines.append(f"- [ ] {title}{due_display}  ← {list_name}")

    output_file = TASKS_DIR / "today.md"
    output_file.write_text("\n".join(lines), encoding="utf-8")
    print(f"[ok] タスク保存完了: {output_file} ({len(tasks)}件)")


def main():
    print(f"[info] タスクチェック開始: {NOW}")
    creds = get_credentials()
    service = build("tasks", "v1", credentials=creds)
    tasks = fetch_tasks(service)
    save_tasks_markdown(tasks)

    # 期限が近いタスクを通知
    notified = 0
    for task in tasks:
        status, message = check_deadline(task)
        if message:
            send_telegram(message)
            notified += 1

    print(f"[info] 通知送信数: {notified}件")


if __name__ == "__main__":
    main()
