#!/usr/bin/env python3
"""
Planning Ingestion Agent CLI

Command-line interface for running the planning document sync.

Usage:
    python main.py sync --frequency weekly
    python main.py sync --frequency monthly
    python main.py sync --all
    python main.py sync --source home-building-sites
    python main.py sync --all --force
    python main.py sync --all --dry-run
    python main.py list
"""

import argparse
import asyncio
import sys
from typing import Optional

from config import PLANNING_SOURCES, SyncFrequency, load_env_config
from agent import create_agent, SyncSummary, SyncResult


def print_summary(summary: SyncSummary) -> None:
    """Print sync summary to console."""
    print("\n" + "=" * 60)
    print("SYNC SUMMARY")
    print("=" * 60)
    print(f"Total sources:  {summary.total}")
    print(f"Created:        {summary.created}")
    print(f"Updated:        {summary.updated}")
    print(f"Skipped:        {summary.skipped}")
    print(f"Failed:         {summary.failed}")
    print("=" * 60)

    if summary.failed > 0:
        print("\nFailed sources:")
        for result in summary.results:
            if result.action == "error":
                print(f"  - {result.source_id}: {result.message}")


def print_result(result: SyncResult) -> None:
    """Print single sync result to console."""
    status = "OK" if result.success else "FAIL"
    print(f"[{status}] {result.source_id}: {result.action} - {result.message or ''}")


def list_sources() -> None:
    """List all configured sources."""
    print("\n" + "=" * 80)
    print("CONFIGURED PLANNING SOURCES")
    print("=" * 80)

    print(f"\n{'ID':<30} {'Type':<6} {'Freq':<8} {'Category':<20}")
    print("-" * 80)

    for source in PLANNING_SOURCES:
        print(
            f"{source.id:<30} "
            f"{source.content_type.value:<6} "
            f"{source.sync_frequency.value:<8} "
            f"{source.category:<20}"
        )

    print("-" * 80)
    print(f"Total: {len(PLANNING_SOURCES)} sources")
    print(
        f"  Weekly: {len([s for s in PLANNING_SOURCES if s.sync_frequency == SyncFrequency.WEEKLY])}"
    )
    print(
        f"  Monthly: {len([s for s in PLANNING_SOURCES if s.sync_frequency == SyncFrequency.MONTHLY])}"
    )


async def run_sync(
    frequency: Optional[str] = None,
    source_id: Optional[str] = None,
    all_sources: bool = False,
    force: bool = False,
    dry_run: bool = False,
) -> int:
    """
    Run the sync operation.

    Args:
        frequency: "weekly" or "monthly"
        source_id: Specific source ID to sync
        all_sources: Sync all sources
        force: Force re-sync even if unchanged
        dry_run: Preview changes without executing

    Returns:
        Exit code (0 for success, 1 for failure)
    """
    # Validate environment
    try:
        config = load_env_config()
    except ValueError as e:
        print(f"ERROR: {e}")
        print("\nPlease set the required environment variables.")
        print("See .env.example for details.")
        return 1

    if dry_run:
        print("\n[DRY RUN] The following sources would be synced:")
        sources = PLANNING_SOURCES

        if frequency:
            freq = SyncFrequency(frequency)
            sources = [s for s in sources if s.sync_frequency == freq]
        elif source_id:
            sources = [s for s in sources if s.id == source_id]

        for source in sources:
            print(f"  - {source.id} ({source.content_type.value})")

        print(f"\nTotal: {len(sources)} sources")
        return 0

    # Run sync
    async with create_agent() as agent:
        if source_id:
            print(f"\nSyncing single source: {source_id}")
            result = await agent.sync_single(source_id, force=force)
            print_result(result)
            return 0 if result.success else 1

        elif frequency:
            freq = SyncFrequency(frequency)
            print(f"\nSyncing {frequency} sources...")
            summary = await agent.sync_by_frequency(freq, force=force)
            print_summary(summary)
            return 0 if summary.failed == 0 else 1

        elif all_sources:
            print("\nSyncing all sources...")
            summary = await agent.sync_all(force=force)
            print_summary(summary)
            return 0 if summary.failed == 0 else 1

        else:
            print("ERROR: Specify --frequency, --source, or --all")
            return 1


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Milwaukee Planning Documents Ingestion Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py list                          # List all configured sources
  python main.py sync --frequency weekly       # Sync weekly sources
  python main.py sync --frequency monthly      # Sync monthly sources
  python main.py sync --all                    # Sync all sources
  python main.py sync --source home-building-sites  # Sync single source
  python main.py sync --all --force            # Force re-sync all
  python main.py sync --all --dry-run          # Preview what would sync
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # List command
    subparsers.add_parser("list", help="List all configured sources")

    # Sync command
    sync_parser = subparsers.add_parser("sync", help="Sync planning documents")
    sync_group = sync_parser.add_mutually_exclusive_group(required=True)
    sync_group.add_argument(
        "--frequency",
        choices=["weekly", "monthly"],
        help="Sync sources by frequency",
    )
    sync_group.add_argument(
        "--source",
        help="Sync a specific source by ID",
    )
    sync_group.add_argument(
        "--all",
        action="store_true",
        help="Sync all sources",
    )

    sync_parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-sync even if content unchanged",
    )
    sync_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without executing",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    if args.command == "list":
        list_sources()
        return 0

    if args.command == "sync":
        return asyncio.run(
            run_sync(
                frequency=args.frequency,
                source_id=args.source,
                all_sources=args.all,
                force=args.force,
                dry_run=args.dry_run,
            )
        )

    return 1


if __name__ == "__main__":
    sys.exit(main())
