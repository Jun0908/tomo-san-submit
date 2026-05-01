"""
judgment_board.py
本人判断ボードを生成する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import build_judgment_board, load_calendar_events, load_case_records, write_judgment_board_files


def parse_args():
    parser = argparse.ArgumentParser(description="本人判断ボードを生成する")
    parser.add_argument("--json", action="store_true", help="JSON で出力する")
    return parser.parse_args()


def main():
    args = parse_args()
    board = build_judgment_board(load_case_records(), events=load_calendar_events())
    files = write_judgment_board_files(board)
    payload = {"board": board, "files": files}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 本人判断ボードを出力しました: {files['latest_markdown']}")
    print(f"本人判断待ち: {board['summary']['principal_decision_count']}件")
    print(f"今日中に見たい案件: {board['summary']['due_today_count']}件")


if __name__ == "__main__":
    main()
