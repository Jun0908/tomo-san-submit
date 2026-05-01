"""
morning_brief.py
既存の同期結果をまとめ、ともさん向けの朝ブリーフを生成する。

保存先:
  reports/daily-briefing/morning-brief-latest.md
  reports/daily-briefing/morning-brief-latest.json
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime

from citizen_digest import build_period_digest, score_case
from openclaw_core import (
    BASE_DIR,
    DAILY_BRIEF_DIR,
    build_followup_queue,
    build_judgment_board,
    load_calendar_events,
    load_case_records,
    now_jst,
    read_json_if_exists,
    read_text_if_exists,
    send_telegram_message,
    summarize_text,
    write_json,
    write_judgment_board_files,
    write_markdown,
)
from tomo_profile import load_profile


CALENDAR_JSON_PATH = BASE_DIR / "data" / "calendar" / "today.json"
TASKS_MD_PATH = BASE_DIR / "data" / "tasks" / "today.md"
GMAIL_DIR = BASE_DIR / "data" / "gmail"


def parse_args():
    parser = argparse.ArgumentParser(description="朝ブリーフを生成して Telegram に送る")
    parser.add_argument("--json", action="store_true", help="標準出力を JSON にする")
    parser.add_argument("--no-telegram", action="store_true", help="Telegram 送信をスキップする")
    return parser.parse_args()


def load_today_events(today_str: str) -> list[dict]:
    payload = read_json_if_exists(CALENDAR_JSON_PATH, default={}) or {}
    events = payload.get("events", []) if isinstance(payload, dict) else []
    return [event for event in events if event.get("start_date") == today_str]


def load_important_emails() -> list[dict]:
    latest_path = None
    for path in sorted(GMAIL_DIR.glob("*.md")):
        latest_path = path
    if latest_path is None:
        return []

    section = ""
    emails: list[dict] = []
    for line in latest_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            section = line
            continue
        match = re.match(r"^- \*\*(.+?)\*\*$", line.strip())
        if not match:
            continue
        priority = "P2"
        if "P0" in section:
            priority = "P0"
        elif "P1" in section:
            priority = "P1"
        elif "NOISE" in section:
            priority = "NOISE"
        emails.append({"subject": match.group(1), "priority": priority})

    important = [item for item in emails if item["priority"] in {"P0", "P1"}]
    return important[:5] if important else emails[:5]


def load_task_items() -> list[str]:
    text = read_text_if_exists(TASKS_MD_PATH)
    if not text:
        return []
    return [line[len("- [ ] ") :].strip() for line in text.splitlines() if line.startswith("- [ ] ")][:5]


def case_sort_key(case: dict, profile: dict) -> tuple[int, str]:
    return (score_case(case, profile), case.get("created_at", ""))


def build_brief_payload(now: datetime | None = None) -> dict:
    now = now or now_jst()
    profile = load_profile()
    today_str = now.strftime("%Y-%m-%d")
    cases = load_case_records()
    events = load_today_events(today_str)
    important_emails = load_important_emails()
    tasks = load_task_items()
    daily_digest = build_period_digest(cases, period="daily", now=now)
    judgment_board = build_judgment_board(cases, events=load_calendar_events(), now=now)
    followup_queue = build_followup_queue(cases, now=now)

    new_cases = [case for case in cases if (case.get("created_at", "") or "").startswith(today_str)]
    unresolved_cases = [
        case
        for case in cases
        if (case.get("status_internal") or case.get("status") or "open").lower() not in {"answered", "closed"}
    ]
    unresolved_cases = sorted(unresolved_cases, key=lambda case: case_sort_key(case, profile), reverse=True)[:5]

    agenda_cases_by_id = {}
    for event in events:
        for case in event.get("related_cases", []):
            agenda_cases_by_id[case.get("id", "")] = case
    agenda_cases = list(agenda_cases_by_id.values())[:5]

    return {
        "generated_at": now.isoformat(),
        "today": today_str,
        "judgment_board": judgment_board,
        "followup_queue": followup_queue,
        "events": events,
        "important_emails": important_emails,
        "tasks": tasks,
        "new_cases": [
            {
                "id": case.get("id", ""),
                "title": case.get("title", ""),
                "summary": summarize_text(case.get("summary", ""), limit=70),
                "urgency": case.get("urgency", "medium"),
                "route": case.get("route", ""),
            }
            for case in new_cases[:5]
        ],
        "unresolved_cases": [
            {
                "id": case.get("id", ""),
                "title": case.get("title", ""),
                "status_public": case.get("status_public", ""),
                "urgency": case.get("urgency", "medium"),
                "route": case.get("route", ""),
            }
            for case in unresolved_cases
        ],
        "agenda_cases": agenda_cases,
        "daily_digest": daily_digest,
        "profile_applied": {
            "preferred_topics": profile.get("preferred_topics", []),
            "preferred_regions": profile.get("preferred_regions", []),
            "brief_style": profile.get("brief_style", "short"),
        },
    }


def payload_to_markdown(payload: dict) -> str:
    board = payload["judgment_board"]
    followup = payload["followup_queue"]
    lines = [
        f"# おはようブリーフ {payload['today']}",
        "",
        f"- 生成日時: {payload['generated_at']}",
        f"- 本人判断待ち: {board['summary']['principal_decision_count']}件",
        f"- 今日中に見たい案件: {board['summary']['due_today_count']}件",
        f"- リスク確認: {board['summary']['risk_count']}件",
        f"- フォローアップ超過: {board['summary']['overdue_followups_count']}件",
        "",
        "## 今日まず決めること",
    ]

    if board["must_decide_today"]:
        for item in board["must_decide_today"][:5]:
            lines.append(f"- {item['title']}")
            lines.append(f"  - 理由: {item['reason']}")
            lines.append(f"  - 選択肢: {' / '.join(item['decision_options'][:3])}")
    else:
        lines.append("- 緊急の本人判断案件はありません")

    lines.extend(["", "## リスクあり案件"])
    if board["risk_alerts"]:
        for item in board["risk_alerts"][:5]:
            flags = " / ".join(item.get("risk_flags", [])[:3]) or item.get("risk_level", "low")
            lines.append(f"- {item['title']}")
            lines.append(f"  - リスク: {flags}")
    else:
        lines.append("- なし")

    lines.extend(["", "## 面会前に見たい案件"])
    if board["meeting_related"]:
        for item in board["meeting_related"][:5]:
            lines.append(f"- {item['title']}")
    else:
        lines.append("- なし")

    lines.extend(["", "## フォローアップ"])
    lines.append(f"- 稼働中: {followup['summary']['active_count']}件")
    lines.append(f"- 緊急: {followup['summary']['urgent_count']}件")
    lines.append(f"- 超過: {followup['summary']['overdue_count']}件")
    for item in followup["urgent"][:5]:
        lines.append(f"- {item['case_title']} ({item['status']})")

    lines.extend(["", "## 今日の予定"])
    if payload["events"]:
        for event in payload["events"][:5]:
            lines.append(f"- {event['title']} ({event.get('start_at', '')[11:16] or '時刻未設定'})")
    else:
        lines.append("- 予定なし")

    lines.extend(["", "## 重要メール"])
    lines.extend([f"- [{item['priority']}] {item['subject']}" for item in payload["important_emails"]] or ["- なし"])

    lines.extend(["", "## 期限が近いタスク"])
    lines.extend([f"- {item}" for item in payload["tasks"]] or ["- なし"])

    lines.extend(["", "## 今日の新規案件"])
    if payload["new_cases"]:
        for case in payload["new_cases"]:
            lines.append(f"- {case['title']} ({case['urgency']} / {case['route'] or '未分類'})")
            lines.append(f"  - {case['summary']}")
    else:
        lines.append("- なし")

    lines.extend(["", "## 市民相談ダイジェスト要点"])
    lines.append(f"- {payload['daily_digest']['summary']}")
    lines.extend([f"- 多いテーマ: {item['name']} ({item['count']}件)" for item in payload["daily_digest"]["top_topics"][:3]] or ["- 該当なし"])
    return "\n".join(lines).strip() + "\n"


def payload_to_telegram_text(payload: dict) -> str:
    style = payload.get("profile_applied", {}).get("brief_style", "short")
    board = payload["judgment_board"]
    followup = payload["followup_queue"]
    lines = [
        f"おはようブリーフ {payload['today']}",
        "",
        f"本人判断待ち: {board['summary']['principal_decision_count']}件",
        f"今日中に見たい案件: {board['summary']['due_today_count']}件",
        f"リスク確認: {board['summary']['risk_count']}件",
        f"フォローアップ超過: {board['summary']['overdue_followups_count']}件",
    ]

    if board["must_decide_today"]:
        lines.extend(["", "今日まず決めること"])
        limit = 2 if style == "short" else 4
        for item in board["must_decide_today"][:limit]:
            options = " / ".join(item["decision_options"][:2])
            lines.append(f"- {item['title']} | {options}")

    if board["risk_alerts"]:
        lines.extend(["", "リスクあり案件"])
        limit = 2 if style == "short" else 3
        for item in board["risk_alerts"][:limit]:
            flags = " / ".join(item.get("risk_flags", [])[:2]) or item.get("risk_level", "low")
            lines.append(f"- {item['title']} | {flags}")

    if payload["events"]:
        lines.extend(["", "今日の予定"])
        limit = 2 if style == "short" else 3
        for event in payload["events"][:limit]:
            lines.append(f"- {event['title']}")

    if followup["summary"]["urgent_count"]:
        lines.extend(["", "急ぎのフォローアップ"])
        limit = 2 if style == "short" else 3
        for item in followup["urgent"][:limit]:
            lines.append(f"- {item['case_title']} ({item['status']})")

    lines.extend(["", "市民相談要点", f"- {payload['daily_digest']['summary']}"])
    message = "\n".join(lines).strip()
    if len(message) > 3500:
        return message[:3497] + "..."
    return message


def write_brief_files(payload: dict) -> dict[str, str]:
    DAILY_BRIEF_DIR.mkdir(parents=True, exist_ok=True)
    date_prefix = payload["today"]
    latest_md = DAILY_BRIEF_DIR / "morning-brief-latest.md"
    latest_json = DAILY_BRIEF_DIR / "morning-brief-latest.json"
    dated_md = DAILY_BRIEF_DIR / f"morning-brief-{date_prefix}.md"
    dated_json = DAILY_BRIEF_DIR / f"morning-brief-{date_prefix}.json"

    markdown = payload_to_markdown(payload)
    write_markdown(latest_md, markdown)
    write_markdown(dated_md, markdown)
    write_json(latest_json, payload)
    write_json(dated_json, payload)
    return {
        "latest_markdown": str(latest_md),
        "latest_json": str(latest_json),
        "dated_markdown": str(dated_md),
        "dated_json": str(dated_json),
    }


def main():
    args = parse_args()
    payload = build_brief_payload()
    files = write_brief_files(payload)
    board_files = write_judgment_board_files(payload["judgment_board"])
    telegram_sent = False

    if not args.no_telegram:
        telegram_sent = send_telegram_message(payload_to_telegram_text(payload))

    result = {"brief": payload, "files": files, "board_files": board_files, "telegram_sent": telegram_sent}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 朝ブリーフを出力しました: {files['latest_markdown']}")
    print(f"Telegram送信: {'ok' if telegram_sent else 'skip'}")
    print(f"本人判断待ち: {payload['judgment_board']['summary']['principal_decision_count']}件")


if __name__ == "__main__":
    main()
