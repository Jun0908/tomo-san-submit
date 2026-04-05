"""
public_case_export.py
公開向けに見せられる案件 JSON を一覧として書き出す。
"""

from __future__ import annotations

from openclaw_core import CASES_PUBLIC_DIR, load_public_case_records, write_json


def main():
    records = load_public_case_records()
    latest_path = CASES_PUBLIC_DIR / "latest.json"
    write_json(latest_path, records)
    print(f"✅ 公開向け案件一覧を出力しました: {latest_path}")
    print(f"件数: {len(records)}")


if __name__ == "__main__":
    main()
