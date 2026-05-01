"""
case_update.py
案件の内部ステータスやフォローアップ属性を更新する。
"""

from __future__ import annotations

import argparse
import json

from openclaw_core import (
    CASES_DIR,
    append_public_timeline,
    coerce_string_list,
    normalize_public_fields,
    now_jst,
    read_json_if_exists,
    write_case_files,
    write_public_case_latest_snapshot,
)


def parse_args():
    parser = argparse.ArgumentParser(description="案件を更新する")
    parser.add_argument("--case-id", required=True, help="案件 ID")
    parser.add_argument("--status", default="", help="新しい内部ステータス")
    parser.add_argument("--route", default="", help="新しい処理ルート")
    parser.add_argument("--owner", default="", help="担当者。principal / secretary など")
    parser.add_argument("--due", default="", help="フォローアップ期限")
    parser.add_argument("--follow-up-status", default="", help="フォローアップ状態")
    parser.add_argument("--decision-result", default="", help="本人判断の結果メモ")
    parser.add_argument("--next-action", action="append", default=[], help="次のアクションを追加")
    parser.add_argument("--risk-level", default="", help="リスクレベル")
    parser.add_argument("--risk-flag", action="append", default=[], help="リスクフラグを追加")
    parser.add_argument("--public-message", default="", help="公開タイムラインに載せるメッセージ")
    parser.add_argument("--json", action="store_true", help="JSON で出力する")
    return parser.parse_args()


def load_case_by_id(case_id: str) -> dict | None:
    for path in sorted(CASES_DIR.glob("*.json")):
        payload = read_json_if_exists(path, default=None)
        if isinstance(payload, dict) and payload.get("id") == case_id:
            return payload
    return None


def update_case_status(
    case_id: str,
    status: str,
    *,
    public_message: str = "",
    route: str = "",
    owner: str = "",
    due: str = "",
    follow_up_status: str = "",
    decision_result: str = "",
    next_actions: list[str] | None = None,
    risk_level: str = "",
    risk_flags: list[str] | None = None,
) -> dict:
    case = load_case_by_id(case_id)
    if case is None:
        raise SystemExit(f"案件が見つかりません: {case_id}")

    if status:
        case["status_internal"] = status
        case["status"] = status
    if route:
        triage = case.get("triage", {}) if isinstance(case.get("triage"), dict) else {}
        triage["route"] = route
        case["triage"] = triage
        case["route"] = route
    if owner:
        follow_up = case.get("follow_up", {}) if isinstance(case.get("follow_up"), dict) else {}
        follow_up["owner"] = owner
        case["follow_up"] = follow_up
        case["owner"] = owner
    if due:
        follow_up = case.get("follow_up", {}) if isinstance(case.get("follow_up"), dict) else {}
        triage = case.get("triage", {}) if isinstance(case.get("triage"), dict) else {}
        follow_up["due_at"] = due
        triage["deadline"] = due
        case["follow_up"] = follow_up
        case["triage"] = triage
        case["due"] = due
        case["deadline"] = due
    if follow_up_status:
        follow_up = case.get("follow_up", {}) if isinstance(case.get("follow_up"), dict) else {}
        follow_up["status"] = follow_up_status
        case["follow_up"] = follow_up
        case["follow_up_status"] = follow_up_status
    if decision_result:
        follow_up = case.get("follow_up", {}) if isinstance(case.get("follow_up"), dict) else {}
        follow_up["decision_result"] = decision_result
        case["follow_up"] = follow_up
        case["decision_result"] = decision_result
    if next_actions:
        existing_actions = coerce_string_list(case.get("next_actions"))
        follow_up = case.get("follow_up", {}) if isinstance(case.get("follow_up"), dict) else {}
        follow_up["next_actions"] = existing_actions + next_actions
        case["follow_up"] = follow_up
        case["next_actions"] = existing_actions + next_actions
    if risk_level:
        risk = case.get("risk", {}) if isinstance(case.get("risk"), dict) else {}
        risk["level"] = risk_level
        case["risk"] = risk
        case["risk_level"] = risk_level
    if risk_flags:
        risk = case.get("risk", {}) if isinstance(case.get("risk"), dict) else {}
        risk["flags"] = coerce_string_list(risk.get("flags")) + risk_flags
        case["risk"] = risk
        case["risk_flags"] = coerce_string_list(case.get("risk_flags")) + risk_flags

    case["updated_at"] = now_jst().isoformat()
    updated = normalize_public_fields(case)

    if public_message.strip():
        updated = append_public_timeline(
            updated,
            updated.get("status_public", "確認中"),
            public_message.strip(),
            created_at=updated["updated_at"],
        )

    md_path, json_path, public_json_path = write_case_files(updated)
    public_index_path, _ = write_public_case_latest_snapshot()
    return {
        "case": updated,
        "files": {
            "markdown": str(md_path),
            "json": str(json_path),
            "public_json": str(public_json_path),
            "public_index": str(public_index_path),
        },
    }


def main():
    args = parse_args()
    payload = update_case_status(
        args.case_id,
        args.status,
        public_message=args.public_message,
        route=args.route,
        owner=args.owner,
        due=args.due,
        follow_up_status=args.follow_up_status,
        decision_result=args.decision_result,
        next_actions=args.next_action,
        risk_level=args.risk_level,
        risk_flags=args.risk_flag,
    )
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    print(f"[ok] 案件を更新しました: {payload['case']['id']}")
    print(f"内部ステータス: {payload['case']['status_internal']}")
    print(f"ルート: {payload['case']['route']}")
    print(f"フォローアップ: {payload['case']['follow_up_status']}")


if __name__ == "__main__":
    main()
