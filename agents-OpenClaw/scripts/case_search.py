"""
case_search.py
案件テキストや案件 ID をもとに、関連案件を検索する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import build_query_record, find_related_cases, load_case_records


def parse_args():
    parser = argparse.ArgumentParser(description="OpenClaw の案件を検索する")
    parser.add_argument("--query", default="", help="自由文クエリ")
    parser.add_argument("--case-id", default="", help="既存案件 ID")
    parser.add_argument("--location", default="", help="検索対象の場所")
    parser.add_argument("--limit", type=int, default=5, help="返す件数")
    parser.add_argument("--json", action="store_true", help="JSON 出力")
    return parser.parse_args()


def main():
    args = parse_args()
    cases = load_case_records()
    query_record = None

    if args.case_id:
        query_record = next((case for case in cases if case.get("id") == args.case_id), None)
        if query_record is None:
            raise SystemExit(f"案件が見つかりません: {args.case_id}")
    elif args.query:
        query_record = build_query_record(args.query, location=args.location)
    else:
        raise SystemExit("--query または --case-id を指定してください。")

    results = find_related_cases(
        query_record,
        cases,
        limit=args.limit,
        exclude_ids=[query_record.get("id", "")],
    )

    payload = {
        "query": {
            "id": query_record.get("id"),
            "title": query_record.get("title"),
            "location": query_record.get("location", ""),
        },
        "results": results,
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"検索対象: {payload['query']['title']}")
    if not results:
        print("関連案件は見つかりませんでした。")
        return

    for index, item in enumerate(results, start=1):
        print(f"{index}. {item['title']} | score={item['score']} | id={item['id']}")
        if item.get("status_public"):
            print(f"   公開ステータス: {item['status_public']}")
        if item.get("location"):
            print(f"   場所: {item['location']}")
        if item.get("tags"):
            print(f"   タグ: {', '.join(item['tags'])}")


if __name__ == "__main__":
    main()
