"""
citizen_digest.py
市民相談案件を日次・週次で集計し、秘書向け digest を生成する。

保存先:
  reports/daily-briefing/citizen-digest-daily-latest.md
  reports/daily-briefing/citizen-digest-daily-latest.json
  reports/daily-briefing/citizen-digest-weekly-latest.md
  reports/daily-briefing/citizen-digest-weekly-latest.json
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timedelta

from openclaw_core import (
    DAILY_BRIEF_DIR,
    JST,
    load_case_records,
    now_jst,
    summarize_text,
    write_json,
    write_markdown,
)
from tomo_profile import load_profile


def parse_args():
    parser = argparse.ArgumentParser(description="市民相談 digest を生成する")
    parser.add_argument(
        "--period",
        choices=["daily", "weekly", "all"],
        default="all",
        help="生成する period",
    )
    parser.add_argument("--json", action="store_true", help="標準出力を JSON にする")
    return parser.parse_args()


def parse_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(JST)
    except ValueError:
        return None


def day_start(dt: datetime) -> datetime:
    return dt.astimezone(JST).replace(hour=0, minute=0, second=0, microsecond=0)


def urgency_rank(value: str) -> int:
    return {"high": 3, "medium": 2, "low": 1}.get((value or "").lower(), 0)


def score_case(case: dict, profile: dict | None = None) -> int:
    profile = profile or {}
    score = urgency_rank(case.get("urgency", "")) * 10
    score += min(len(case.get("related_public_info_ids", [])), 3) * 4
    score += min(len(case.get("related_case_ids", [])), 3) * 2
    score += 2 if case.get("requires_user_input") else 0
    score += 1 if case.get("location") else 0
    preferred_topics = set(profile.get("preferred_topics", []))
    preferred_regions = set(profile.get("preferred_regions", []))
    score += len(preferred_topics & set(case.get("tags", []))) * 3
    score += 3 if case.get("location") in preferred_regions else 0
    for tag in case.get("tags", []):
        score += int(profile.get("priority_bias", {}).get(tag, 0))
    return score


def summarize_case(case: dict) -> dict:
    return {
        "id": case.get("id", ""),
        "title": case.get("title", ""),
        "summary": summarize_text(case.get("summary", ""), limit=80),
        "location": case.get("location", ""),
        "urgency": case.get("urgency", "medium"),
        "status_public": case.get("status_public", ""),
        "requires_user_input": bool(case.get("requires_user_input")),
        "related_public_count": len(case.get("related_public_info_ids", [])),
        "route": case.get("route", ""),
        "policy_signal": case.get("policy_signal", "none"),
    }


def build_period_digest(cases: list[dict], *, period: str, now: datetime | None = None) -> dict:
    now = (now or now_jst()).astimezone(JST)
    profile = load_profile()
    start = day_start(now)
    if period == "weekly":
        start = start - timedelta(days=6)
    end = now + timedelta(seconds=1)

    selected_cases = []
    for case in cases:
        created_at = parse_iso_datetime(case.get("created_at", ""))
        if created_at is None:
            continue
        if start <= created_at < end:
            selected_cases.append(case)

    unresolved_cases = [
        case
        for case in cases
        if (case.get("status_internal") or case.get("status") or "open").lower() not in {"answered", "closed"}
    ]
    follow_up_cases = [
        case
        for case in selected_cases
        if case.get("requires_user_input") or case.get("open_questions")
    ]
    public_linked_cases = [case for case in selected_cases if case.get("related_public_info_ids")]
    policy_candidates = [
        case
        for case in selected_cases
        if case.get("policy_signal") in {"possible", "strong"} or case.get("route") == "principal_decision"
    ]

    topic_counter = Counter()
    location_counter = Counter()
    urgency_counter = Counter()
    for case in selected_cases:
        topic_counter.update(case.get("tags", []))
        if case.get("location"):
            location_counter.update([case["location"]])
        urgency_counter.update([(case.get("urgency") or "medium").lower()])

    priority_cases = sorted(selected_cases, key=lambda case: score_case(case, profile), reverse=True)[:5]
    summary_bits = [
        f"{period} 新規案件 {len(selected_cases)}件",
        f"未解決 {len(unresolved_cases)}件",
    ]
    if topic_counter:
        topic, count = topic_counter.most_common(1)[0]
        summary_bits.append(f"最多テーマ {topic} ({count}件)")
    if public_linked_cases:
        summary_bits.append(f"公開情報連動 {len(public_linked_cases)}件")
    if policy_candidates:
        summary_bits.append(f"政策化候補 {len(policy_candidates)}件")

    return {
        "period": period,
        "generated_at": now.isoformat(),
        "range_start": start.isoformat(),
        "range_end": end.isoformat(),
        "new_case_count": len(selected_cases),
        "unresolved_case_count": len(unresolved_cases),
        "public_linked_case_count": len(public_linked_cases),
        "follow_up_count": len(follow_up_cases),
        "policy_candidate_count": len(policy_candidates),
        "top_topics": [{"name": name, "count": count} for name, count in topic_counter.most_common(5)],
        "top_locations": [{"name": name, "count": count} for name, count in location_counter.most_common(5)],
        "urgency_breakdown": {key: urgency_counter.get(key, 0) for key in ["high", "medium", "low"]},
        "follow_up_cases": [summarize_case(case) for case in follow_up_cases[:5]],
        "priority_cases": [summarize_case(case) for case in priority_cases],
        "policy_candidates": [summarize_case(case) for case in policy_candidates[:5]],
        "region_clusters": [{"name": name, "count": count} for name, count in location_counter.most_common(5)],
        "summary": " / ".join(summary_bits),
        "profile_applied": {
            "preferred_topics": profile.get("preferred_topics", []),
            "preferred_regions": profile.get("preferred_regions", []),
        },
    }


def digest_to_markdown(digest: dict) -> str:
    period_label = "日次" if digest["period"] == "daily" else "週次"
    lines = [
        f"# 市民相談 {period_label}ダイジェスト",
        "",
        f"- 生成日時: {digest['generated_at']}",
        f"- 対象期間開始: {digest['range_start']}",
        f"- 新規案件: {digest['new_case_count']}件",
        f"- 未解決案件: {digest['unresolved_case_count']}件",
        f"- 公開情報とひもづいた案件: {digest['public_linked_case_count']}件",
        f"- 追加確認待ち: {digest['follow_up_count']}件",
        f"- 政策化候補: {digest['policy_candidate_count']}件",
        "",
        "## 要点",
        f"- {digest['summary']}",
        "",
        "## 多いテーマ",
    ]

    lines.extend([f"- {item['name']} ({item['count']}件)" for item in digest["top_topics"]] or ["- 該当なし"])
    lines.extend(["", "## 多い地域"])
    lines.extend([f"- {item['name']} ({item['count']}件)" for item in digest["top_locations"]] or ["- 該当なし"])
    lines.extend(["", "## 緊急度"])
    for key, label in [("high", "高"), ("medium", "中"), ("low", "低")]:
        lines.append(f"- {label}: {digest['urgency_breakdown'][key]}件")

    lines.extend(["", "## 追加確認したい案件"])
    if digest["follow_up_cases"]:
        for case in digest["follow_up_cases"]:
            lines.append(f"- {case['title']} ({case['id']})")
            lines.append(f"  - 要約: {case['summary']}")
            lines.append(f"  - 場所: {case['location'] or '未設定'}")
            lines.append(f"  - 公開ステータス: {case['status_public'] or '未設定'}")
    else:
        lines.append("- 該当なし")

    lines.extend(["", "## 面会や会議に持っていきたい案件"])
    if digest["priority_cases"]:
        for case in digest["priority_cases"]:
            lines.append(f"- {case['title']} ({case['id']})")
            lines.append(f"  - 要約: {case['summary']}")
            lines.append(f"  - 緊急度: {case['urgency']}")
            lines.append(f"  - 関連公開情報: {case['related_public_count']}件")
    else:
        lines.append("- 該当なし")

    lines.extend(["", "## 政策化候補"])
    if digest["policy_candidates"]:
        for case in digest["policy_candidates"]:
            lines.append(f"- {case['title']} ({case['id']})")
            lines.append(f"  - シグナル: {case['policy_signal']}")
            lines.append(f"  - ルート: {case['route'] or '未分類'}")
            lines.append(f"  - 場所: {case['location'] or '未設定'}")
    else:
        lines.append("- 該当なし")

    return "\n".join(lines).strip() + "\n"


def write_digest_files(digest: dict) -> dict[str, str]:
    DAILY_BRIEF_DIR.mkdir(parents=True, exist_ok=True)
    date_prefix = digest["generated_at"][:10]
    stem = f"citizen-digest-{digest['period']}"
    latest_md = DAILY_BRIEF_DIR / f"{stem}-latest.md"
    latest_json = DAILY_BRIEF_DIR / f"{stem}-latest.json"
    dated_md = DAILY_BRIEF_DIR / f"{stem}-{date_prefix}.md"
    dated_json = DAILY_BRIEF_DIR / f"{stem}-{date_prefix}.json"

    markdown = digest_to_markdown(digest)
    write_markdown(latest_md, markdown)
    write_markdown(dated_md, markdown)
    write_json(latest_json, digest)
    write_json(dated_json, digest)
    return {
        "latest_markdown": str(latest_md),
        "latest_json": str(latest_json),
        "dated_markdown": str(dated_md),
        "dated_json": str(dated_json),
    }


def main():
    args = parse_args()
    cases = load_case_records()
    periods = ["daily", "weekly"] if args.period == "all" else [args.period]

    payload = {}
    for period in periods:
        digest = build_period_digest(cases, period=period)
        files = write_digest_files(digest)
        payload[period] = {"digest": digest, "files": files}

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    for period in periods:
        print(f"[ok] {period} digest を出力しました: {payload[period]['files']['latest_markdown']}")
        print(f"要点: {payload[period]['digest']['summary']}")


if __name__ == "__main__":
    main()
