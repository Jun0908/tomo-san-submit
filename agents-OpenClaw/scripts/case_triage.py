"""
case_triage.py
保存済み案件を Plan2 のトリアージ構造で再正規化する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import load_case_records, normalize_public_fields, write_case_files, write_public_case_latest_snapshot


def parse_args():
    parser = argparse.ArgumentParser(description="保存済み案件を再トリアージする")
    parser.add_argument("--case-id", default="", help="対象案件 ID。未指定なら全件")
    parser.add_argument("--json", action="store_true", help="JSON で出力する")
    return parser.parse_args()


def main():
    args = parse_args()
    cases = load_case_records()
    if args.case_id:
        cases = [case for case in cases if case.get("id") == args.case_id or case.get("id", "").startswith(args.case_id)]
        if not cases:
            raise SystemExit(f"案件が見つかりません: {args.case_id}")

    updated_rows = []
    for case in cases:
        normalized = normalize_public_fields(case)
        write_case_files(normalized)
        updated_rows.append(
            {
                "id": normalized["id"],
                "title": normalized["title"],
                "route": normalized.get("route", ""),
                "risk_level": normalized.get("risk_level", "low"),
                "follow_up_status": normalized.get("follow_up_status", ""),
            }
        )

    public_index_path, _ = write_public_case_latest_snapshot()
    payload = {"updated": updated_rows, "public_index": str(public_index_path)}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 再トリアージ完了: {len(updated_rows)}件")
    print(f"公開インデックス: {public_index_path}")


if __name__ == "__main__":
    main()
