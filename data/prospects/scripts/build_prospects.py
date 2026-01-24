#!/usr/bin/env python3
"""
Build prospects JSON from CSV imports.
Saves to current/ and creates dated snapshot.
"""

import csv
import json
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
IMPORTS_DIR = BASE_DIR / "imports"
CURRENT_DIR = BASE_DIR / "current"
SNAPSHOTS_DIR = BASE_DIR / "snapshots"

POS_MAP = {
    "ED": "EDGE",
    "DI": "IDL", 
    "HB": "RB",
    "T": "OT",
    "G": "OG",
    "C": "C",
    "QB": "QB",
    "WR": "WR",
    "TE": "TE",
    "CB": "CB",
    "S": "S",
    "LB": "LB",
    "K": "K",
    "P": "P"
}

def parse_school(school_str):
    """Extract school name and conference from string like 'Miami (FL) Hurricanes'"""
    school = school_str.strip()
    if " " in school:
        parts = school.rsplit(" ", 1)
        return parts[0].strip()
    return school

def parse_height(ht_str):
    """Parse height string like '6-2' to inches"""
    if not ht_str or ht_str == "N/A":
        return None
    try:
        parts = ht_str.split("-")
        return int(parts[0]) * 12 + int(parts[1])
    except:
        return None

def safe_float(val):
    """Safely convert to float"""
    if not val or val == "N/A":
        return None
    try:
        return float(val)
    except:
        return None

def safe_int(val):
    """Safely convert to int"""
    if not val or val == "N/A":
        return None
    try:
        return int(val)
    except:
        return None

def build_prospect_id(name, year=2026):
    """Generate unique ID from name"""
    clean = name.lower().replace(".", "").replace("'", "").replace(" jr", "-jr").replace(" iii", "-iii").replace(" ii", "-ii")
    parts = clean.split()
    return "-".join(parts) + f"-{year}"

def load_pff_csv(filepath):
    """Load PFF big board CSV"""
    prospects = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pff_pos = row.get("Pos", "").strip()
            position = POS_MAP.get(pff_pos, pff_pos)
            
            name = row.get("Player", "").strip()
            school_full = row.get("School", "").strip()
            school = parse_school(school_full)
            
            pff_grade = safe_float(row.get("PFF Grade"))
            pff_waa = safe_float(row.get("PFF WAA"))
            rank = safe_int(row.get("Rank"))
            
            prospect = {
                "id": build_prospect_id(name),
                "name": {
                    "display": name,
                    "first": name.split()[0] if " " in name else name,
                    "last": " ".join(name.split()[1:]) if " " in name else ""
                },
                "position": position,
                "school": school,
                "rankings": {
                    "pff": rank
                },
                "grades": {
                    "pff_overall": pff_grade,
                    "pff_waa": pff_waa
                },
                "bio": {},
                "combine": {},
                "skills": {},
                "traits": [],
                "archetype": None,
                "projection": estimate_projection(rank),
                "scouting_report": None,
                "comparison": None
            }
            prospects.append(prospect)
    
    return prospects

def estimate_projection(rank):
    """Estimate draft projection from rank"""
    if not rank:
        return {"round": 7, "range_low": 200, "range_high": 260}
    if rank <= 10:
        return {"round": 1, "range_low": 1, "range_high": 15}
    elif rank <= 32:
        return {"round": 1, "range_low": 10, "range_high": 32}
    elif rank <= 64:
        return {"round": 2, "range_low": 33, "range_high": 64}
    elif rank <= 100:
        return {"round": 3, "range_low": 65, "range_high": 100}
    elif rank <= 140:
        return {"round": 4, "range_low": 101, "range_high": 140}
    elif rank <= 180:
        return {"round": 5, "range_low": 141, "range_high": 180}
    elif rank <= 220:
        return {"round": 6, "range_low": 181, "range_high": 220}
    else:
        return {"round": 7, "range_low": 221, "range_high": 260}

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    
    pff_file = IMPORTS_DIR / "pff_bigboard_2026-01-24.csv"
    if not pff_file.exists():
        print(f"Error: {pff_file} not found")
        return
    
    print(f"Loading PFF data from {pff_file}...")
    prospects = load_pff_csv(pff_file)
    print(f"Loaded {len(prospects)} prospects")
    
    output = {
        "meta": {
            "draft_year": 2026,
            "last_updated": today,
            "sources": ["PFF"],
            "version": "1.1",
            "total_prospects": len(prospects)
        },
        "prospects": prospects
    }
    
    CURRENT_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    
    current_file = CURRENT_DIR / "2026_prospects.json"
    with open(current_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"Saved to {current_file}")
    
    snapshot_file = SNAPSHOTS_DIR / f"{today}_prospects.json"
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"Snapshot saved to {snapshot_file}")
    
    print("\nTop 10 prospects:")
    for p in prospects[:10]:
        grade = p["grades"]["pff_overall"] or "N/A"
        print(f"  {p['rankings']['pff']:3}. {p['name']['display']:25} {p['position']:4} {p['school']:20} (PFF: {grade})")

if __name__ == "__main__":
    main()
