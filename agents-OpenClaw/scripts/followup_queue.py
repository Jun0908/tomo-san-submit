"""
followup_queue.py
フォローアップ実行キューを表示する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import build_followup_queue, load_case_records


def parse_args():
    parser = argparse.ArgumentParser(description="フォローアップキューを生成する")
    parser.add_argument("--json", action="store_true", help="JSON で出力する")
    return parser.parse_args()


def main():
    args = parse_args()
    payload = build_followup_queue(load_case_records())
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print("[ok] フォローアップキューを生成しました")
    print(f"稼働中: {payload['summary']['active_count']}件")
    print(f"緊急: {payload['summary']['urgent_count']}件")
    print(f"超過: {payload['summary']['overdue_count']}件")
    for item in payload["urgent"][:5]:
        print(f"- {item['case_title']} ({item['status']})")


if __name__ == "__main__":
    main()
