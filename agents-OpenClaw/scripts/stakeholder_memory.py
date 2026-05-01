"""
stakeholder_memory.py
人・団体・地域の関係者メモリを再構築または検索する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import load_case_records, search_stakeholders, write_case_files


def parse_args():
    parser = argparse.ArgumentParser(description="関係者メモリを扱う")
    parser.add_argument("--kind", choices=["person", "group", "region"], default="person", help="検索対象の種別")
    parser.add_argument("--query", default="", help="検索文字列")
    parser.add_argument("--rebuild", action="store_true", help="案件からメモリを再構築する")
    parser.add_argument("--json", action="store_true", help="JSON で出力する")
    return parser.parse_args()


def main():
    args = parse_args()
    rebuilt = 0
    if args.rebuild:
        for case in load_case_records():
            write_case_files(case)
            rebuilt += 1

    results = search_stakeholders(args.kind, args.query, limit=10)
    payload = {"rebuilt": rebuilt, "results": results}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    if args.rebuild:
        print(f"[ok] 関係者メモリを再構築しました: {rebuilt}件")
    print(f"[info] {args.kind} 検索結果: {len(results)}件")
    for item in results:
        print(f"- {item.get('name', '')} ({item.get('type', '')})")


if __name__ == "__main__":
    main()
