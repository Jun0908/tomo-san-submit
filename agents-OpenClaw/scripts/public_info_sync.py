"""
public_info_sync.py
気仙沼市の公開情報を取得し、OpenClaw 用に保存する。
"""

from __future__ import annotations

import argparse
import json
import xml.etree.ElementTree as ET
from urllib.request import urlopen

from openclaw_core import build_public_record, write_public_snapshot


PUBLIC_SOURCES = [
    {
        "name": "市議会 新着情報",
        "url": "https://www.kesennuma.miyagi.jp/li/shisei/160/news.rss",
    },
    {
        "name": "市議会 注目情報",
        "url": "https://www.kesennuma.miyagi.jp/li/shisei/160/notice.rss",
    },
]


def parse_args():
    parser = argparse.ArgumentParser(description="気仙沼市の公開情報を同期する")
    parser.add_argument("--json", action="store_true", help="JSON で標準出力する")
    return parser.parse_args()


def fetch_rss(source: dict) -> list[dict]:
    """RSS を取得して公開情報レコードへ変換する。"""
    with urlopen(source["url"], timeout=20) as response:
        xml_bytes = response.read().lstrip(b"\xef\xbb\xbf")
    root = ET.fromstring(xml_bytes)
    records = []

    for item in root.findall("./channel/item"):
        title = item.findtext("title", default="(無題)")
        link = item.findtext("link", default="")
        pub_date = item.findtext("pubDate", default="")
        description = item.findtext("description", default="")

        records.append(
            build_public_record(
                source=source["name"],
                title=title,
                url=link,
                published_at=pub_date,
                summary=description,
            )
        )

    return records


def dedupe_records(records: list[dict]) -> list[dict]:
    """URL ベースで重複を除く。"""
    deduped = {}
    for item in records:
        deduped[item["url"]] = item
    return list(deduped.values())


def main():
    args = parse_args()
    all_records = []

    for source in PUBLIC_SOURCES:
        all_records.extend(fetch_rss(source))

    records = dedupe_records(all_records)
    records.sort(key=lambda item: item.get("published_at", ""), reverse=True)
    write_public_snapshot(records)

    payload = {
        "count": len(records),
        "sources": [source["name"] for source in PUBLIC_SOURCES],
        "records": records[:10],
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 公開情報を同期しました: {len(records)}件")
    for item in records[:5]:
        print(f"- {item['title']} ({item['published_at']})")


if __name__ == "__main__":
    main()
