"""
public_case_export.py
公開向けに見せられる案件 JSON を一覧として書き出す。
"""

from __future__ import annotations

from openclaw_core import write_public_case_latest_snapshot


def main():
    latest_path, records = write_public_case_latest_snapshot()
    print(f"[ok] 公開向け案件一覧を出力しました: {latest_path}")
    print(f"件数: {len(records)}")


if __name__ == "__main__":
    main()
