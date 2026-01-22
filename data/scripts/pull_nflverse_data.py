"""
NFL Data Pull Script - nflverse source
Uses nflverse/nfl_data_py to fetch NFL data

Data includes:
- Historical draft picks (1980-present)
- Draft pick trade values
- Current rosters
- Combine results
- Player contracts
- Team info and schedules
"""

import nfl_data_py as nfl
import os

# Output directory for nflverse data
OUTPUT_DIR = 'data/raw/nflverse'

def setup():
    """Create output directory if it doesn't exist"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")

def pull_draft_data():
    """Pull historical draft picks and values"""
    print("\nPulling draft picks...")
    years = list(range(2015, 2025))
    draft_picks = nfl.import_draft_picks(years)
    draft_picks.to_csv(f'{OUTPUT_DIR}/draft_picks.csv', index=False)
    print(f"  Saved {len(draft_picks)} draft picks")
    
    print("Pulling draft values...")
    draft_values = nfl.import_draft_values()
    draft_values.to_csv(f'{OUTPUT_DIR}/draft_values.csv', index=False)
    print(f"  Saved {len(draft_values)} draft value entries")

def pull_player_data():
    """Pull current rosters and player info"""
    print("\nPulling rosters...")
    rosters = nfl.import_seasonal_rosters([2025])
    rosters.to_csv(f'{OUTPUT_DIR}/rosters_2025.csv', index=False)
    print(f"  Saved {len(rosters)} roster entries")
    
    print("Pulling combine data...")
    combine = nfl.import_combine_data(list(range(2020, 2025)))
    combine.to_csv(f'{OUTPUT_DIR}/combine.csv', index=False)
    print(f"  Saved {len(combine)} combine entries")
    
    print("Pulling player IDs...")
    ids = nfl.import_ids()
    ids.to_csv(f'{OUTPUT_DIR}/player_ids.csv', index=False)
    print(f"  Saved {len(ids)} player ID mappings")

def pull_contract_data():
    """Pull contract information from Over The Cap via nflverse"""
    print("\nPulling contracts...")
    contracts = nfl.import_contracts()
    contracts.to_csv(f'{OUTPUT_DIR}/contracts.csv', index=False)
    print(f"  Saved {len(contracts)} contracts")

def pull_team_data():
    """Pull team and schedule info"""
    print("\nPulling team descriptions...")
    teams = nfl.import_team_desc()
    teams.to_csv(f'{OUTPUT_DIR}/teams.csv', index=False)
    print(f"  Saved {len(teams)} teams")
    
    print("Pulling schedules...")
    schedules = nfl.import_schedules([2024, 2025])
    schedules.to_csv(f'{OUTPUT_DIR}/schedules.csv', index=False)
    print(f"  Saved {len(schedules)} games")

def pull_stats_data():
    """Pull player statistics"""
    print("\nPulling seasonal stats...")
    seasonal = nfl.import_seasonal_data([2023, 2024, 2025])
    seasonal.to_csv(f'{OUTPUT_DIR}/stats_seasonal.csv', index=False)
    print(f"  Saved {len(seasonal)} seasonal stat lines")
    
    print("Pulling weekly stats (current season)...")
    weekly = nfl.import_weekly_data([2025])
    weekly.to_csv(f'{OUTPUT_DIR}/stats_weekly_2025.csv', index=False)
    print(f"  Saved {len(weekly)} weekly stat lines")

def main():
    print("=" * 50)
    print("GM Ops Data Pull: nflverse")
    print("=" * 50)
    
    setup()
    pull_draft_data()
    pull_player_data()
    pull_contract_data()
    pull_team_data()
    pull_stats_data()
    
    print("\n" + "=" * 50)
    print(f"Done! Files saved to {OUTPUT_DIR}/")
    print("=" * 50)

if __name__ == "__main__":
    main()
