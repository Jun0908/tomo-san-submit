"""
activity_draft.py
案件・公開情報・準備メモをもとに、Note / Instagram / ボランティア向けの活動記録ドラフトを生成する。

保存先:
  reports/activity-drafts/
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timedelta

from openclaw_core import (
    ACTIVITY_DRAFT_DIR,
    JST,
    build_query_record,
    dedupe_keep_order,
    find_related_cases,
    find_related_public_info,
    load_case_records,
    load_public_records,
    now_jst,
    slugify,
    summarize_text,
    write_json,
    write_markdown,
)


def parse_args():
    parser = argparse.ArgumentParser(description="活動記録ドラフトを生成する")
    parser.add_argument("--case-id", action="append", default=[], help="含めたい案件 ID")
    parser.add_argument("--query", default="", help="テーマや論点")
    parser.add_argument("--title", default="", help="ドラフトの主題タイトル")
    parser.add_argument("--days", type=int, default=14, help="最近案件を拾う日数")
    parser.add_argument("--json", action="store_true", help="標準出力を JSON にする")
    return parser.parse_args()


def parse_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(JST)
    except ValueError:
        return None


def resolve_cases(case_ids: list[str], query: str, days: int) -> list[dict]:
    all_cases = load_case_records()
    if case_ids:
        selected = []
        for case_id in case_ids:
            matched = next(
                (case for case in all_cases if case.get("id") == case_id or case.get("id", "").startswith(case_id)),
                None,
            )
            if matched:
                selected.append(matched)
        deduped = {}
        for case in selected:
            deduped[case.get("id", "")] = case
        return list(deduped.values())

    if query.strip():
        query_record = build_query_record(query)
        related = find_related_cases(query_record, all_cases, limit=8)
        selected = [
            case
            for case in all_cases
            if any(item["id"] == case.get("id") for item in related)
        ]
        return selected

    threshold = now_jst() - timedelta(days=max(days, 1))
    selected = []
    for case in all_cases:
        created_at = parse_iso_datetime(case.get("created_at", ""))
        if created_at is None:
            continue
        if created_at >= threshold:
            selected.append(case)
    return selected[:8]


def resolve_public_info(cases: list[dict], query: str) -> list[dict]:
    public_records = load_public_records()
    public_by_id = {item["id"]: item for item in public_records}
    selected: list[dict] = []

    for case in cases:
        for item_id in case.get("related_public_info_ids", []):
            if item_id in public_by_id:
                selected.append(public_by_id[item_id])

    search_text = query.strip() or " ".join(
        dedupe_keep_order(
            [
                case.get("title", "")
                for case in cases
            ] + [
                tag
                for case in cases
                for tag in case.get("tags", [])
            ]
        )
    )
    if search_text:
        matches = find_related_public_info(search_text, public_records, limit=8)
        for match in matches:
            item_id = match.get("id")
            if item_id in public_by_id:
                selected.append(public_by_id[item_id])

    deduped = {}
    for item in selected:
        deduped[item["id"]] = item
    return list(deduped.values())[:8]


def infer_theme(cases: list[dict], query: str, explicit_title: str) -> str:
    if explicit_title.strip():
        return explicit_title.strip()
    if query.strip():
        return query.strip()

    tag_counter = Counter(tag for case in cases for tag in case.get("tags", []))
    if tag_counter:
        return tag_counter.most_common(1)[0][0]
    if cases:
        return summarize_text(cases[0].get("title", ""), limit=24)
    return "活動報告"


def build_context(cases: list[dict], public_info: list[dict], theme: str) -> dict:
    tag_counter = Counter(tag for case in cases for tag in case.get("tags", []))
    location_counter = Counter(case.get("location", "") for case in cases if case.get("location"))
    people = dedupe_keep_order(person for case in cases for person in case.get("people", []))
    open_questions = dedupe_keep_order(item for case in cases for item in case.get("open_questions", []))
    next_actions = dedupe_keep_order(item for case in cases for item in case.get("next_actions", []))
    urgency_counter = Counter((case.get("urgency") or "medium").lower() for case in cases)

    top_cases = sorted(
        cases,
        key=lambda case: (
            {"high": 3, "medium": 2, "low": 1}.get((case.get("urgency") or "").lower(), 0),
            len(case.get("related_public_info_ids", [])),
            case.get("created_at", ""),
        ),
        reverse=True,
    )[:5]

    headline_points = []
    for case in top_cases[:3]:
        location = f"（{case['location']}）" if case.get("location") else ""
        headline_points.append(f"{case['title']}{location}")

    return {
        "theme": theme,
        "case_count": len(cases),
        "public_info_count": len(public_info),
        "top_tags": [name for name, _count in tag_counter.most_common(5)],
        "top_locations": [name for name, _count in location_counter.most_common(5)],
        "people": people[:8],
        "open_questions": open_questions[:5],
        "next_actions": next_actions[:5],
        "urgency_breakdown": {key: urgency_counter.get(key, 0) for key in ["high", "medium", "low"]},
        "top_cases": top_cases,
        "top_public_info": public_info[:5],
        "headline_points": headline_points,
    }


def build_note_titles(theme: str, context: dict) -> list[str]:
    location = context["top_locations"][0] if context["top_locations"] else ""
    area_suffix = f" {location}" if location else ""
    return [
        f"{theme}{area_suffix}について、最近いただいている声を整理しました",
        f"{theme}に関する相談から見えてきたこと",
        f"市民相談と公開情報から考える{theme}",
    ]


def build_note_draft(theme: str, context: dict) -> dict:
    titles = build_note_titles(theme, context)
    lead = (
        f"最近、{theme}に関するご相談を複数いただいています。"
        "いただいた声をその場限りにせず、過去の相談や公開情報とつなぎながら整理しておくことが大切だと感じています。"
    )
    if context["top_locations"]:
        lead += f" 特に {context['top_locations'][0]} を含む地域で気になる声が重なっています。"

    facts = []
    if context["case_count"]:
        facts.append(f"最近扱った関連相談は {context['case_count']}件")
    if context["top_tags"]:
        facts.append(f"多かったテーマは {' / '.join(context['top_tags'][:3])}")
    if context["public_info_count"]:
        facts.append(f"関連しそうな公開情報は {context['public_info_count']}件")
    if context["urgency_breakdown"]["high"]:
        facts.append(f"緊急度 high の相談は {context['urgency_breakdown']['high']}件")

    body_lines = [
        lead,
        "",
        "今回、秘書メモとして整理した要点は次の通りです。",
    ]
    body_lines.extend([f"- {item}" for item in context["headline_points"]] or [f"- {theme}に関する相談を整理中です"])

    body_lines.extend(
        [
            "",
            "見えてきたこと",
        ]
    )
    body_lines.extend([f"- {item}" for item in facts] or ["- いただいた相談を継続的に見ていく必要があります"])

    if context["top_public_info"]:
        body_lines.extend(["", "公開情報とのつながり"])
        for item in context["top_public_info"][:3]:
            body_lines.append(f"- {item['title']} ({item['published_at']})")

    if context["open_questions"]:
        body_lines.extend(["", "今後さらに確認したい点"])
        body_lines.extend([f"- {item}" for item in context["open_questions"][:3]])

    if context["next_actions"]:
        body_lines.extend(["", "今後の動き"])
        body_lines.extend([f"- {item}" for item in context["next_actions"][:3]])
    else:
        body_lines.extend(
            [
                "",
                "今後も現場の声と公開情報を見ながら、必要な確認を進めていきます。",
            ]
        )

    return {
        "title_candidates": titles,
        "outline": [
            "導入: 最近の相談状況",
            "本論: 相談から見えてきたこと",
            "関連情報: 公開情報や議会情報との接点",
            "締め: 今後の確認ポイント",
        ],
        "lead": lead,
        "body": "\n".join(body_lines).strip(),
    }


def build_instagram_draft(theme: str, context: dict) -> dict:
    caption_short = (
        f"{theme}について、最近いただいている声を整理しました。"
        "現場の相談と公開情報をつなぎながら、今後の確認に活かしていきます。"
    )
    if context["top_locations"]:
        caption_short += f" 特に {context['top_locations'][0]} 周辺の声も気になっています。"

    slides = [
        f"1枚目: {theme}で最近いただいている声",
        f"2枚目: 相談件数 {context['case_count']}件 / 多いテーマ {'・'.join(context['top_tags'][:2]) or '整理中'}",
        f"3枚目: 気になっている論点 {'・'.join(context['headline_points'][:2]) or '継続確認'}",
        f"4枚目: 公開情報との接点 {context['top_public_info'][0]['title'] if context['top_public_info'] else '該当情報を確認中'}",
        "5枚目: 今後も声を整理しながら必要な確認を進めます",
    ]
    hashtags = dedupe_keep_order(
        [
            "#気仙沼",
            "#市民相談",
            "#議会活動",
        ]
        + [f"#{tag}" for tag in context["top_tags"][:3]]
    )
    return {
        "caption_short": caption_short,
        "caption_long": (
            caption_short
            + "\n\n"
            + "相談を受けて終わりではなく、過去の案件や公開情報とつなぎながら整理していくことで、次の行動につながる準備を続けていきます。"
        ),
        "carousel_slides": slides,
        "hashtags": hashtags[:8],
    }


def build_handoff_draft(theme: str, context: dict) -> dict:
    return {
        "summary_for_volunteers": f"{theme}に関する活動記録の下書き。まずは事実関係を崩さず、相談ベースの温度感を残す。",
        "facts_to_keep": dedupe_keep_order(
            context["headline_points"]
            + [f"相談件数: {context['case_count']}件", f"関連公開情報: {context['public_info_count']}件"]
        )[:6],
        "angles_to_emphasize": dedupe_keep_order(
            [
                "市民の声を整理して次の行動につなげていること",
                "決めつけではなく確認を重ねていること",
            ]
            + ([f"{context['top_locations'][0]} など地域の声を見ていること"] if context["top_locations"] else [])
            + ([f"{context['top_tags'][0]} を継続的に追っていること"] if context["top_tags"] else [])
        )[:5],
        "caution_points": [
            "未確認事項は断定表現にしない",
            "個人が特定される情報は出さない",
            "政策判断を確定したような書き方は避ける",
        ],
        "reference_links": [
            {"title": item["title"], "url": item.get("url", "")}
            for item in context["top_public_info"][:5]
            if item.get("url")
        ],
    }


def build_activity_draft_payload(
    *,
    case_ids: list[str] | None = None,
    query: str = "",
    title: str = "",
    days: int = 14,
) -> dict:
    case_ids = case_ids or []
    cases = resolve_cases(case_ids, query, days)
    public_info = resolve_public_info(cases, query)
    theme = infer_theme(cases, query, title)
    context = build_context(cases, public_info, theme)

    return {
        "generated_at": now_jst().isoformat(),
        "theme": theme,
        "query": query,
        "source_case_ids": [case.get("id", "") for case in cases],
        "source_public_info_ids": [item.get("id", "") for item in public_info],
        "context": {
            "case_count": context["case_count"],
            "public_info_count": context["public_info_count"],
            "top_tags": context["top_tags"],
            "top_locations": context["top_locations"],
            "people": context["people"],
            "open_questions": context["open_questions"],
            "next_actions": context["next_actions"],
            "urgency_breakdown": context["urgency_breakdown"],
            "headline_points": context["headline_points"],
        },
        "note_draft": build_note_draft(theme, context),
        "instagram_draft": build_instagram_draft(theme, context),
        "volunteer_handoff": build_handoff_draft(theme, context),
        "source_cases": [
            {
                "id": case.get("id", ""),
                "title": case.get("title", ""),
                "summary": summarize_text(case.get("summary", ""), limit=100),
                "location": case.get("location", ""),
                "tags": case.get("tags", []),
                "urgency": case.get("urgency", "medium"),
            }
            for case in context["top_cases"]
        ],
        "source_public_info": [
            {
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "published_at": item.get("published_at", ""),
                "url": item.get("url", ""),
            }
            for item in context["top_public_info"]
        ],
    }


def activity_draft_to_markdown(payload: dict) -> str:
    note = payload["note_draft"]
    insta = payload["instagram_draft"]
    handoff = payload["volunteer_handoff"]
    lines = [
        f"# 活動記録ドラフト: {payload['theme']}",
        "",
        f"- 生成日時: {payload['generated_at']}",
        f"- 元案件数: {payload['context']['case_count']}件",
        f"- 参照公開情報: {payload['context']['public_info_count']}件",
        "",
        "## Note タイトル案",
    ]
    lines.extend([f"- {item}" for item in note["title_candidates"]])
    lines.extend(["", "## Note 下書き", note["body"]])
    lines.extend(["", "## Note 構成案"])
    lines.extend([f"- {item}" for item in note["outline"]])
    lines.extend(["", "## Instagram キャプション案", insta["caption_short"], "", insta["caption_long"]])
    lines.extend(["", "## Instagram カルーセル案"])
    lines.extend([f"- {item}" for item in insta["carousel_slides"]])
    lines.extend(["", "## ハッシュタグ案"])
    lines.extend([f"- {item}" for item in insta["hashtags"]])
    lines.extend(["", "## ボランティア向け引き継ぎメモ"])
    lines.append(f"- 要約: {handoff['summary_for_volunteers']}")
    lines.append("- 残したい事実:")
    lines.extend([f"  - {item}" for item in handoff["facts_to_keep"]] or ["  - なし"])
    lines.append("- 強調したい角度:")
    lines.extend([f"  - {item}" for item in handoff["angles_to_emphasize"]] or ["  - なし"])
    lines.append("- 注意点:")
    lines.extend([f"  - {item}" for item in handoff["caution_points"]] or ["  - なし"])
    lines.append("- 参照リンク:")
    if handoff["reference_links"]:
        for item in handoff["reference_links"]:
            lines.append(f"  - {item['title']}: {item['url']}")
    else:
        lines.append("  - なし")

    lines.extend(["", "## 元にした案件"])
    if payload["source_cases"]:
        for case in payload["source_cases"]:
            lines.append(f"- {case['title']} ({case['id']})")
            lines.append(f"  - 要約: {case['summary']}")
            lines.append(f"  - 場所: {case['location'] or '未設定'}")
    else:
        lines.append("- 該当なし")

    lines.extend(["", "## 元にした公開情報"])
    if payload["source_public_info"]:
        for item in payload["source_public_info"]:
            lines.append(f"- {item['title']} ({item['published_at']})")
            if item.get("url"):
                lines.append(f"  - URL: {item['url']}")
    else:
        lines.append("- 該当なし")

    return "\n".join(lines).strip() + "\n"


def activity_draft_to_telegram_text(payload: dict) -> str:
    note = payload["note_draft"]
    insta = payload["instagram_draft"]
    lines = [
        f"活動記録ドラフト: {payload['theme']}",
        "",
        f"案件: {payload['context']['case_count']}件 / 公開情報: {payload['context']['public_info_count']}件",
        "Note タイトル案",
        f"- {note['title_candidates'][0]}",
        "",
        "Instagram キャプション案",
        f"- {insta['caption_short']}",
    ]
    if payload["context"]["headline_points"]:
        lines.extend(["", "要点"])
        lines.extend([f"- {item}" for item in payload["context"]["headline_points"][:3]])
    message = "\n".join(lines).strip()
    return message[:3500] + ("..." if len(message) > 3500 else "")


def write_activity_draft_files(payload: dict) -> dict[str, str]:
    ACTIVITY_DRAFT_DIR.mkdir(parents=True, exist_ok=True)
    date_prefix = payload["generated_at"][:10]
    stem = f"{date_prefix}-{slugify(payload['theme'], fallback='activity-draft')}"
    md_path = ACTIVITY_DRAFT_DIR / f"{stem}.md"
    json_path = ACTIVITY_DRAFT_DIR / f"{stem}.json"
    markdown = activity_draft_to_markdown(payload)
    write_markdown(md_path, markdown)
    write_json(json_path, payload)
    return {"markdown": str(md_path), "json": str(json_path)}


def main():
    args = parse_args()
    payload = build_activity_draft_payload(
        case_ids=args.case_id,
        query=args.query,
        title=args.title,
        days=args.days,
    )
    files = write_activity_draft_files(payload)
    result = {"draft": payload, "files": files}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 活動記録ドラフトを出力しました: {files['markdown']}")
    print(f"主題: {payload['theme']}")
    if payload["note_draft"]["title_candidates"]:
        print(f"Note タイトル案: {payload['note_draft']['title_candidates'][0]}")


if __name__ == "__main__":
    main()
