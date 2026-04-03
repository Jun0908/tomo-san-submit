"""
case_ingest.py
相談テキストを OpenClaw の案件メモとして保存する。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from openclaw_core import (
    build_case_record,
    find_related_cases,
    find_related_public_info,
    load_case_records,
    load_public_records,
    split_csv_field,
    write_case_files,
)


def parse_args():
    parser = argparse.ArgumentParser(description="相談内容から案件メモを生成する")
    parser.add_argument("--title", default="", help="案件タイトル")
    parser.add_argument("--summary", default="", help="案件要約")
    parser.add_argument("--transcript", default="", help="会話全文")
    parser.add_argument("--input-file", default="", help="会話全文を読むテキストファイル")
    parser.add_argument("--location", default="", help="発生場所や対象地域")
    parser.add_argument("--people", default="", help="関係者のカンマ区切り")
    parser.add_argument("--tags", default="", help="タグのカンマ区切り")
    parser.add_argument("--urgency", default="medium", choices=["low", "medium", "high"], help="緊急度")
    parser.add_argument("--status", default="open", help="案件ステータス")
    parser.add_argument("--open-question", action="append", default=[], help="未確認事項")
    parser.add_argument("--next-action", action="append", default=[], help="次のアクション")
    parser.add_argument("--json", action="store_true", help="結果を JSON で出力する")
    return parser.parse_args()


def load_transcript(args) -> str:
    """引数または標準入力から会話本文を読む。"""
    if args.input_file:
        return Path(args.input_file).read_text(encoding="utf-8")
    if args.transcript:
        return args.transcript
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def main():
    args = parse_args()
    transcript = load_transcript(args)

    if not any([args.title, args.summary, transcript]):
        raise SystemExit("タイトル・要約・会話本文のいずれかを指定してください。")

    existing_cases = load_case_records()
    public_records = load_public_records()

    case_record = build_case_record(
        title=args.title,
        summary=args.summary,
        transcript=transcript,
        location=args.location,
        people=split_csv_field(args.people),
        tags=split_csv_field(args.tags),
        urgency=args.urgency,
        status=args.status,
        open_questions=args.open_question,
        next_actions=args.next_action,
    )

    related_cases = find_related_cases(case_record, existing_cases, exclude_ids=[case_record["id"]])
    related_public = find_related_public_info(case_record, public_records)
    case_record["related_case_ids"] = [item["id"] for item in related_cases]
    case_record["related_public_info_ids"] = [item["id"] for item in related_public]

    md_path, json_path = write_case_files(case_record)

    payload = {
        "case": case_record,
        "related_cases": related_cases,
        "related_public_info": related_public,
        "files": {
            "markdown": str(md_path),
            "json": str(json_path),
        },
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"✅ 案件を保存しました: {md_path}")
    print(f"ID: {case_record['id']}")
    print(f"タイトル: {case_record['title']}")
    if related_cases:
        print("関連案件:")
        for item in related_cases:
            print(f"- {item['title']} ({item['score']})")
    if related_public:
        print("関連公開情報:")
        for item in related_public:
            print(f"- {item['title']} ({item['published_at']})")


if __name__ == "__main__":
    main()
