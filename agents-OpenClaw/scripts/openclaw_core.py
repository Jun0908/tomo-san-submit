"""
openclaw_core.py
OpenClaw の案件管理、公開情報連携、ブリーフ生成に使う共通ロジック。
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Iterable


JST = timezone(timedelta(hours=9))
BASE_DIR = Path(os.environ.get("OPENCLAW_DATA_ROOT", Path(__file__).resolve().parents[1]))
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"
CASES_DIR = DATA_DIR / "cases"
PUBLIC_DIR = DATA_DIR / "public" / "kesennuma"
BRIEFS_DIR = REPORTS_DIR / "briefs"

STOPWORDS = {
    "こと", "これ", "それ", "ため", "よう", "ところ", "さん", "です", "ます", "ある", "いる",
    "した", "して", "する", "いる", "なる", "また", "から", "まで", "について", "に関する",
    "おり", "より", "もの", "地域", "市民", "相談", "案件", "確認", "対応", "関連", "予定",
}

TAG_RULES = {
    "子育て": ["子育て", "保育", "保育園", "幼稚園", "こども", "子ども", "学童", "育児"],
    "教育": ["学校", "通学", "教育", "児童", "生徒", "部活", "再編"],
    "交通安全": ["横断歩道", "通学路", "信号", "交通", "安全", "道路", "歩道"],
    "防災": ["防災", "避難", "津波", "地震", "災害", "避難所"],
    "福祉": ["福祉", "介護", "高齢", "障がい", "障害", "福祉サービス"],
    "医療": ["病院", "医療", "診療", "健康", "検診"],
    "人口減少": ["人口減少", "移住", "定住", "少子化", "婚活"],
    "産業": ["雇用", "漁業", "観光", "商店", "事業者", "産業", "入札"],
    "議会": ["議会", "議案", "一般質問", "会議資料", "議会だより", "定例会", "委員会"],
}


def ensure_directories():
    """OpenClaw が使う出力先ディレクトリを作成する。"""
    for path in [CASES_DIR, PUBLIC_DIR, BRIEFS_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def now_jst() -> datetime:
    """JST の現在時刻を返す。"""
    return datetime.now(JST)


def read_text_if_exists(path: Path) -> str:
    """ファイルが存在すればテキストを返す。"""
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


def write_json(path: Path, payload):
    """UTF-8 の整形済み JSON を書き込む。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def slugify(text: str, fallback: str = "item", max_length: int = 32) -> str:
    """ファイル名向けの簡易 slug を返す。"""
    normalized = unicodedata.normalize("NFKC", text or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    if not slug:
        digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:8]
        return f"{fallback}-{digest}"
    return slug[:max_length].strip("-") or fallback


def stable_id(prefix: str, *parts: str) -> str:
    """文字列群から安定した短い ID を作る。"""
    joined = "||".join(part for part in parts if part)
    digest = hashlib.sha1(joined.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}"


def normalize_text(text: str) -> str:
    """比較用にテキストを正規化する。"""
    text = unicodedata.normalize("NFKC", text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def clean_text_block(text: str) -> str:
    """表示用にテキストを整える。"""
    text = unicodedata.normalize("NFKC", text or "")
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_csv_field(value: str | None) -> list[str]:
    """カンマ区切りや改行区切りの文字列を配列に変換する。"""
    if not value:
        return []
    return [item.strip() for item in re.split(r"[,\n]", value) if item.strip()]


def dedupe_keep_order(values: Iterable[str]) -> list[str]:
    """順序を保ったまま重複を除く。"""
    seen = set()
    result = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def extract_keywords(text: str, limit: int = 12) -> list[str]:
    """案件や公開情報の簡易検索に使うキーワードを抽出する。"""
    text = normalize_text(text)
    tokens = re.findall(r"[一-龥ぁ-んァ-ヶーa-z0-9]{2,}", text)
    filtered = [
        token for token in tokens
        if token not in STOPWORDS and not token.isdigit()
    ]
    counts = Counter(filtered)
    return [token for token, _ in counts.most_common(limit)]


def derive_tags(*texts: str) -> list[str]:
    """定義済みキーワードからタグを推定する。"""
    joined = normalize_text(" ".join(texts))
    tags = []
    for tag, keywords in TAG_RULES.items():
        if any(keyword.lower() in joined for keyword in keywords):
            tags.append(tag)
    return tags


def summarize_text(text: str, limit: int = 140) -> str:
    """長文から短い要約用テキストを作る。"""
    cleaned = re.sub(r"\s+", " ", clean_text_block(text))
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rstrip() + "…"


def extract_people(text: str) -> list[str]:
    """簡易的に人名らしき表現を拾う。"""
    matches = re.findall(r"([一-龥ぁ-んァ-ヶA-Za-z0-9]+(?:さん|氏|様))", text or "")
    return dedupe_keep_order(matches)


def build_case_record(
    *,
    title: str = "",
    summary: str = "",
    transcript: str = "",
    location: str = "",
    people: list[str] | None = None,
    tags: list[str] | None = None,
    urgency: str = "medium",
    status: str = "open",
    open_questions: list[str] | None = None,
    next_actions: list[str] | None = None,
    related_case_ids: list[str] | None = None,
    related_public_info_ids: list[str] | None = None,
    created_at: str | None = None,
) -> dict:
    """相談内容から案件レコードを作る。"""
    created_at = created_at or now_jst().isoformat()
    transcript = clean_text_block(transcript)
    people = dedupe_keep_order((people or []) + extract_people(transcript))
    summary = clean_text_block(summary) or summarize_text(transcript or title, limit=180)
    title = clean_text_block(title) or summarize_text(summary or transcript, limit=36) or "無題の案件"
    location = clean_text_block(location)
    tags = dedupe_keep_order((tags or []) + derive_tags(title, summary, transcript, location))
    keywords = extract_keywords(" ".join([title, summary, transcript, location, " ".join(people)]))

    case_id = stable_id("case", created_at, title, summary)

    return {
        "id": case_id,
        "title": title,
        "summary": summary,
        "location": location,
        "people": people,
        "tags": tags,
        "keywords": keywords,
        "urgency": urgency,
        "status": status,
        "created_at": created_at,
        "open_questions": dedupe_keep_order(open_questions or []),
        "next_actions": dedupe_keep_order(next_actions or []),
        "related_case_ids": dedupe_keep_order(related_case_ids or []),
        "related_public_info_ids": dedupe_keep_order(related_public_info_ids or []),
        "source_transcript": transcript,
    }


def case_to_markdown(case: dict) -> str:
    """案件レコードを Markdown にする。"""
    lines = [
        f"# {case['title']}",
        "",
        f"- ID: {case['id']}",
        f"- 作成日時: {case['created_at']}",
        f"- ステータス: {case['status']}",
        f"- 緊急度: {case['urgency']}",
        f"- 場所: {case['location'] or '未設定'}",
        f"- 関係者: {', '.join(case['people']) if case['people'] else '未設定'}",
        f"- タグ: {', '.join(case['tags']) if case['tags'] else '未設定'}",
        "",
        "## 要約",
        case["summary"] or "なし",
        "",
        "## 未確認事項",
    ]

    lines.extend([f"- {item}" for item in case["open_questions"]] or ["- なし"])
    lines.extend(["", "## 次のアクション"])
    lines.extend([f"- {item}" for item in case["next_actions"]] or ["- なし"])
    lines.extend(["", "## 関連案件"])
    lines.extend([f"- {item}" for item in case["related_case_ids"]] or ["- なし"])
    lines.extend(["", "## 関連公開情報"])
    lines.extend([f"- {item}" for item in case["related_public_info_ids"]] or ["- なし"])
    lines.extend(["", "## 元の会話"])
    lines.append(case["source_transcript"] or "記録なし")
    return "\n".join(lines).strip() + "\n"


def write_case_files(case: dict):
    """案件の Markdown と JSON を保存する。"""
    ensure_directories()
    date_prefix = case["created_at"][:10]
    filename = f"{date_prefix}-{slugify(case['title'], fallback='case')}"
    md_path = CASES_DIR / f"{filename}.md"
    json_path = CASES_DIR / f"{filename}.json"
    md_path.write_text(case_to_markdown(case), encoding="utf-8")
    write_json(json_path, case)
    return md_path, json_path


def load_case_records() -> list[dict]:
    """保存済み案件を JSON から読み込む。"""
    ensure_directories()
    records = []
    for path in sorted(CASES_DIR.glob("*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            continue
    return sorted(records, key=lambda item: item.get("created_at", ""), reverse=True)


def build_query_record(text: str = "", location: str = "", tags: list[str] | None = None) -> dict:
    """検索用の擬似レコードを作る。"""
    return {
        "id": "query",
        "title": summarize_text(text, limit=36) or "query",
        "summary": text,
        "location": location,
        "people": [],
        "tags": dedupe_keep_order((tags or []) + derive_tags(text, location)),
        "keywords": extract_keywords(" ".join([text, location])),
        "open_questions": [],
        "next_actions": [],
    }


def score_case_similarity(query: dict, candidate: dict) -> int:
    """案件同士の関連度をざっくり数値化する。"""
    score = 0
    query_tags = set(query.get("tags", []))
    candidate_tags = set(candidate.get("tags", []))
    shared_tags = query_tags & candidate_tags
    score += len(shared_tags) * 6

    query_keywords = set(query.get("keywords", []))
    candidate_keywords = set(candidate.get("keywords", []))
    shared_keywords = query_keywords & candidate_keywords
    score += min(len(shared_keywords), 6) * 2

    query_location = normalize_text(query.get("location", ""))
    candidate_location = normalize_text(candidate.get("location", ""))
    if query_location and candidate_location and query_location in candidate_location:
        score += 5

    shared_people = set(query.get("people", [])) & set(candidate.get("people", []))
    score += len(shared_people) * 3

    query_text = normalize_text(" ".join([query.get("title", ""), query.get("summary", "")]))
    candidate_text = normalize_text(" ".join([candidate.get("title", ""), candidate.get("summary", "")]))
    if query_text and candidate_text and (query_text in candidate_text or candidate_text in query_text):
        score += 4

    return score


def find_related_cases(
    query: dict | str,
    cases: list[dict] | None = None,
    *,
    limit: int = 5,
    exclude_ids: Iterable[str] | None = None,
) -> list[dict]:
    """案件またはクエリ文字列に関連する案件候補を返す。"""
    query_record = query if isinstance(query, dict) else build_query_record(query)
    cases = cases if cases is not None else load_case_records()
    exclude_ids = set(exclude_ids or [])
    results = []

    for candidate in cases:
        if candidate.get("id") in exclude_ids:
            continue
        score = score_case_similarity(query_record, candidate)
        if score <= 0:
            continue
        results.append({
            "id": candidate["id"],
            "title": candidate["title"],
            "score": score,
            "summary": candidate.get("summary", ""),
            "location": candidate.get("location", ""),
            "tags": candidate.get("tags", []),
        })

    results.sort(key=lambda item: (-item["score"], item["title"]))
    return results[:limit]


def build_public_record(
    *,
    source: str,
    title: str,
    url: str,
    published_at: str,
    summary: str = "",
) -> dict:
    """公開情報レコードを作る。"""
    tags = derive_tags(title, summary, source)
    keywords = extract_keywords(" ".join([title, summary, source]))
    item_id = stable_id("public", source, url, title)
    return {
        "id": item_id,
        "source": source,
        "title": clean_text_block(title),
        "url": url,
        "published_at": published_at,
        "summary": clean_text_block(summary),
        "tags": tags,
        "keywords": keywords,
    }


def load_public_records() -> list[dict]:
    """最新の公開情報スナップショットを読む。"""
    ensure_directories()
    latest_path = PUBLIC_DIR / "latest.json"
    if latest_path.exists():
        try:
            return json.loads(latest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []
    return []


def public_records_to_markdown(records: list[dict], title: str) -> str:
    """公開情報一覧を Markdown 化する。"""
    lines = [f"# {title}", ""]
    if not records:
        lines.append("公開情報はありません。")
        return "\n".join(lines) + "\n"

    for item in records:
        lines.append(f"## {item['title']}")
        lines.append(f"- ID: {item['id']}")
        lines.append(f"- ソース: {item['source']}")
        lines.append(f"- 公開日: {item['published_at']}")
        lines.append(f"- URL: {item['url']}")
        lines.append(f"- タグ: {', '.join(item['tags']) if item['tags'] else '未設定'}")
        if item.get("summary"):
            lines.append("")
            lines.append(item["summary"])
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def write_public_snapshot(records: list[dict]):
    """公開情報の latest / 日付スナップショットを保存する。"""
    ensure_directories()
    date_prefix = now_jst().strftime("%Y-%m-%d")
    write_json(PUBLIC_DIR / "latest.json", records)
    write_json(PUBLIC_DIR / f"{date_prefix}.json", records)
    (PUBLIC_DIR / "latest.md").write_text(
        public_records_to_markdown(records, "気仙沼市 公開情報 latest"),
        encoding="utf-8",
    )
    (PUBLIC_DIR / f"{date_prefix}.md").write_text(
        public_records_to_markdown(records, f"気仙沼市 公開情報 {date_prefix}"),
        encoding="utf-8",
    )


def score_public_relevance(query: dict, item: dict) -> int:
    """案件や予定に対する公開情報の関連度を返す。"""
    score = 0
    shared_tags = set(query.get("tags", [])) & set(item.get("tags", []))
    score += len(shared_tags) * 6

    shared_keywords = set(query.get("keywords", [])) & set(item.get("keywords", []))
    score += min(len(shared_keywords), 6) * 2

    query_text = normalize_text(" ".join([query.get("title", ""), query.get("summary", "")]))
    item_text = normalize_text(" ".join([item.get("title", ""), item.get("summary", "")]))
    if query_text and item_text and (query_text in item_text or item_text in query_text):
        score += 4
    return score


def find_related_public_info(query: dict | str, public_records: list[dict] | None = None, *, limit: int = 5) -> list[dict]:
    """案件やテキストに関連する公開情報候補を返す。"""
    query_record = query if isinstance(query, dict) else build_query_record(query)
    public_records = public_records if public_records is not None else load_public_records()

    results = []
    for item in public_records:
        score = score_public_relevance(query_record, item)
        if score <= 0:
            continue
        results.append({
            "id": item["id"],
            "title": item["title"],
            "url": item["url"],
            "published_at": item["published_at"],
            "tags": item.get("tags", []),
            "score": score,
        })
    results.sort(key=lambda entry: (-entry["score"], entry["published_at"]), reverse=False)
    return results[:limit]


def build_event_query_record(event: dict) -> dict:
    """予定から案件・公開情報検索用の擬似レコードを作る。"""
    title = event.get("title", "")
    location = event.get("location", "")
    attendees = " ".join(event.get("attendees", []))
    description = event.get("description", "")
    tags = derive_tags(title, location, description)
    keywords = extract_keywords(" ".join([title, location, attendees, description]))
    return {
        "id": event.get("id", "event"),
        "title": title,
        "summary": description or title,
        "location": location,
        "people": event.get("attendees", []),
        "tags": tags,
        "keywords": keywords,
        "open_questions": [],
        "next_actions": [],
    }


def build_brief_record(event: dict, related_cases: list[dict], related_public_info: list[dict]) -> dict:
    """予定向けのブリーフレコードを作る。"""
    tag_counter = Counter()
    open_questions = []
    next_actions = []

    for case in related_cases:
        for tag in case.get("tags", []):
            tag_counter[tag] += 1
        open_questions.extend(case.get("open_questions", []))
        next_actions.extend(case.get("next_actions", []))

    return {
        "event_id": event["id"],
        "event_title": event["title"],
        "event_time": event["start_at"],
        "event_location": event.get("location", ""),
        "related_cases": related_cases,
        "related_public_info": related_public_info,
        "recent_patterns": [
            {"tag": tag, "count": count}
            for tag, count in tag_counter.most_common(5)
        ],
        "questions_to_ask": dedupe_keep_order(open_questions)[:5],
        "next_actions": dedupe_keep_order(next_actions)[:5],
        "reference_docs": [
            {"title": item["title"], "url": item.get("url", "")}
            for item in related_public_info[:5]
        ],
        "generated_at": now_jst().isoformat(),
    }


def brief_to_markdown(brief: dict) -> str:
    """ブリーフレコードを Markdown にする。"""
    lines = [
        f"# 準備ブリーフ: {brief['event_title']}",
        "",
        f"- 予定ID: {brief['event_id']}",
        f"- 開始: {brief['event_time']}",
        f"- 場所: {brief['event_location'] or '未設定'}",
        f"- 作成: {brief['generated_at']}",
        "",
        "## 関連案件",
    ]

    if brief["related_cases"]:
        for case in brief["related_cases"]:
            lines.append(f"- {case['title']} ({case['id']})")
            if case.get("summary"):
                lines.append(f"  - 要約: {summarize_text(case['summary'], limit=100)}")
            if case.get("location"):
                lines.append(f"  - 場所: {case['location']}")
    else:
        lines.append("- 該当なし")

    lines.extend(["", "## 最近の論点"])
    if brief["recent_patterns"]:
        for pattern in brief["recent_patterns"]:
            lines.append(f"- {pattern['tag']} ({pattern['count']}件)")
    else:
        lines.append("- 該当なし")

    lines.extend(["", "## 今回確認したいこと"])
    lines.extend([f"- {item}" for item in brief["questions_to_ask"]] or ["- 特になし"])

    lines.extend(["", "## 次のアクション候補"])
    lines.extend([f"- {item}" for item in brief["next_actions"]] or ["- 特になし"])

    lines.extend(["", "## 関連する公開情報"])
    if brief["related_public_info"]:
        for item in brief["related_public_info"]:
            lines.append(f"- {item['title']} ({item['published_at']})")
            if item.get("url"):
                lines.append(f"  - URL: {item['url']}")
    else:
        lines.append("- 該当なし")

    return "\n".join(lines).strip() + "\n"


def write_brief_files(brief: dict):
    """ブリーフの Markdown と JSON を保存する。"""
    ensure_directories()
    date_prefix = brief["event_time"][:10]
    filename = f"{date_prefix}-{slugify(brief['event_title'], fallback='brief')}"
    md_path = BRIEFS_DIR / f"{filename}.md"
    json_path = BRIEFS_DIR / f"{filename}.json"
    md_path.write_text(brief_to_markdown(brief), encoding="utf-8")
    write_json(json_path, brief)
    return md_path, json_path
