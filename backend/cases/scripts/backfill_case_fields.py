import argparse
import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models.case import Case
from services.case import CASE_STATUS_ACTIVE, CaseService
from services.db import connect_db


async def ensure_unique_system_name(base_value: str, current_case_id: str) -> str:
    candidate = base_value
    suffix = 2

    while True:
        existing = await Case.find_one(Case.system_name == candidate)
        if not existing or str(existing.id) == current_case_id:
            return candidate
        candidate = f"{base_value}_{suffix}"
        suffix += 1


async def backfill(dry_run: bool) -> None:
    await connect_db()
    cases = await Case.find_all().to_list()

    updated = 0

    for case in cases:
        original_system_name = case.system_name
        original_tag = case.tag
        original_status = case.status

        normalized_tag = CaseService._normalize_tag(case.tag)
        normalized_status = CaseService._normalize_status(case.status)
        normalized_system_name_base = CaseService._normalize_system_name(case.system_name or case.name)
        normalized_system_name = await ensure_unique_system_name(normalized_system_name_base, str(case.id))

        changed = (
            original_system_name != normalized_system_name
            or original_tag != normalized_tag
            or original_status != normalized_status
        )

        if not changed:
            continue

        updated += 1
        print(
            f"[{case.id}] {case.name}: system_name {original_system_name!r} -> {normalized_system_name!r}, "
            f"tag {original_tag!r} -> {normalized_tag!r}, status {original_status!r} -> {normalized_status!r}"
        )

        if not dry_run:
            case.system_name = normalized_system_name
            case.tag = normalized_tag
            case.status = normalized_status or CASE_STATUS_ACTIVE
            await case.save()

    print(f"Processed {len(cases)} cases, updated {updated}")
    if dry_run:
        print("Dry run only, no documents were modified")


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill case system_name/tag/status fields")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing them")
    args = parser.parse_args()
    asyncio.run(backfill(dry_run=args.dry_run))


if __name__ == "__main__":
    main()