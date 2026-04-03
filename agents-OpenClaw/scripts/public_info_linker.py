"""
public_info_linker.py
保存済み案件と公開情報の関連候補をまとめる。
"""

from __future__ import annotations

import json
from pathlib import Path

from openclaw_core import CASES_DIR, PUBLIC_DIR, find_related_public_info, load_case_records, load_public_records, write_json


def build_report(cases: list[dict], public_records: list[dict]) -> tuple[list[dict], str]:
    """案件ごとの関連公開情報候補を返す。"""
    rows = []
    lines = ["# 案件と公開情報の関連候補", ""]

    for case in cases:
        matches = find_related_public_info(case, public_records, limit=5)
        rows.append(
            {
                "case_id": case["id"],
                "case_title": case["title"],
                "related_public_info": matches,
            }
        )

        lines.append(f"## {case['title']}")
        if matches:
            for item in matches:
                lines.append(f"- {item['title']} ({item['published_at']})")
                lines.append(f"  - {item['url']}")
        else:
            lines.append("- 該当なし")
        lines.append("")

    return rows, "\n".join(lines).strip() + "\n"


def main():
    cases = load_case_records()
    public_records = load_public_records()
    rows, markdown = build_report(cases, public_records)

    json_path = PUBLIC_DIR / "case-links.json"
    md_path = PUBLIC_DIR / "case-links.md"
    write_json(json_path, rows)
    md_path.write_text(markdown, encoding="utf-8")

    print(f"✅ リンク候補を保存しました: {json_path}")
    print(f"案件数: {len(cases)} / 公開情報数: {len(public_records)}")


if __name__ == "__main__":
    main()
