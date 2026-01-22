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
    years = list(range(2015, 2026))
    draft_picks = nfl.import_draft_picks(years)
    draft_picks.to_csv(f'{OUTPUT_DIR}/draft_picks.csv', index=False)
    print(f"  Saved {len(draft_picks)} draft picks")
    
    print("Pulling draft values...")
    draft_values = nfl.import_draft_values()
    draft_values.to_csv(f'{OUTPUT_DIR}/draft_values.csv', index=False)
    print(f"  Saved {len(dr
