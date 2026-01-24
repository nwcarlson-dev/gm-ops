#!/usr/bin/env python3
"""
Build prospects JSON from CSV imports.
Supports multiple sources: PFF, ESPN, NFL.com, etc.
Saves to current/ and creates dated snapshot.
"""

import csv
import json
from datetime import datetime
from pathlib import Path
from statistics import median

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

def safe_float(val):
    """Safely convert to float"""
    if not val or val == "N/A" or val.strip() == "":
        return None
    try:
        return float(val)
    except:
        return None

def safe_int(val):
    """Safely convert to int"""
    if not val or val == "N/A" or val.strip() == "":
        return None
    try:
        return int(val)
    except:
        return None

def safe_str(val):
    """Safely get string, None if empty"""
    if not val or val.strip() == "":
        return None
    return val.strip()

def build_prospect_id(name, year=2026):
    """Generate unique ID from name"""
    clean = name.lower().replace(".", "").replace("'", "").replace(" jr", "-jr").replace(" iii", "-iii").replace(" ii", "-ii")
    parts = clean.split()
    return "-".join(parts) + f"-{year}"

def parse_school_full(school_str):
    """Parse school string like 'Miami (FL) Hurricanes' into school and mascot"""
    school = school_str.strip()
    words = school.split()
    if len(words) >= 2:
        mascot = words[-1]
        school_name = " ".join(words[:-1])
        return school_name, mascot
    return school, None

def calculate_consensus(rankings):
    """Calculate consensus rank from available sources"""
    ranks = [v for v in rankings.values() if v is not None]
    if not ranks:
        return None, None, None
    consensus = int(median(ranks))
    range_low = min(ranks)
    range_high = max(ranks)
    return consensus, range_low, range_high

def estimate_projection_round(consensus_rank):
    """Estimate draft round from consensus rank"""
    if not consensus_rank:
        return 7
    if consensus_rank <= 32:
        return 1
    elif consensus_rank <= 64:
        return 2
    elif consensus_rank <= 100:
        return 3
    elif consensus_rank <= 140:
        return 4
    elif consensus_rank <= 180:
        return 5
    elif consensus_rank <= 220:
        return 6
    else:
        return 7

def load_pff_csv(filepath):
    """Load PFF big board CSV - captures ALL columns"""
    prospects = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pff_pos = row.get("Pos", "").strip()
            position = POS_MAP.get(pff_pos, pff_pos)
            
            name = row.get("Player", "").strip()
            school_full = row.get("School", "").strip()
            school_name, mascot = parse_school_full(school_full)
            
            pff_grade = safe_float(row.get("PFF Grade"))
            pff_waa = safe_float(row.get("PFF WAA"))
            pff_rank = safe_int(row.get("Rank"))
            
            user_notes = safe_str(row.get("Notes"))
            user_score = safe_float(row.get("Overall Score"))
            user_label = safe_str(row.get("Score Label"))
            
            rankings = {
                "pff": pff_rank,
                "espn": None,
                "nfl": None,
                "the_athletic": None
            }
            consensus, range_low, range_high = calculate_consensus(rankings)
            
            projection_round = estimate_projection_round(consensus or pff_rank)
            
            prospect = {
                "id": build_prospect_id(name),
                "name": {
                    "display": name,
                    "first": name.split()[0] if " " in name else name,
                    "last": " ".join(name.split()[1:]) if " " in name else ""
                },
                "position": position,
                "position_pff": pff_pos,
                "school": school_name,
                "school_mascot": mascot,
                "conference": None,
                "class_year": None,
                "bio": {
                    "height_in": None,
                    "weight_lbs": None,
                    "birth_date": None,
                    "age_years": None,
                    "age_months": None,
                    "hometown": None,
                    "arm_length_in": None,
                    "hand_size_in": None
                },
                "rankings": rankings,
                "consensus": {
                    "rank": consensus,
                    "range_low": range_low,
                    "range_high": range_high
                },
                "grades": {
                    "pff_overall": pff_grade,
                    "pff_waa": pff_waa
                },
                "combine": {
                    "forty": None,
                    "vertical": None,
                    "broad_jump": None,
                    "three_cone": None,
                    "shuttle": None,
                    "bench": None
                },
                "skills": {},
                "traits": [],
                "archetype": None,
                "projection": {
                    "round": projection_round,
                    "range_low": range_low or pff_rank,
                    "range_high": range_high or pff_rank
                },
                "scouting_report": None,
                "comparison": None,
                "user_data": {
                    "notes": user_notes,
                    "score": user_score,
                    "label": user_label
                },
                "source_raw": {
                    "pff": {
                        "rank": pff_rank,
                        "grade": pff_grade,
                        "waa": pff_waa,
                        "school_full": school_full,
                        "position": pff_pos
                    }
                }
            }
            prospects.append(prospect)
    
    return prospects

def merge_espn_data(prospects, espn_filepath):
    """Merge ESPN rankings into existing prospects (future use)"""
    pass

def merge_nfl_data(prospects, nfl_filepath):
    """Merge NFL.com rankings into existing prospects (future use)"""
    pass

def recalculate_consensus(prospects):
    """Recalculate consensus after merging multiple sources"""
    for p in prospects:
        rankings = p.get("rankings", {})
        consensus, range_low, range_high = calculate_consensus(rankings)
        p["consensus"] = {
            "rank": consensus,
            "range_low": range_low,
            "range_high": range_high
        }
        if consensus:
            p["projection"]["round"] = estimate_projection_round(consensus)
            p["projection"]["range_low"] = range_low
            p["projection"]["range_high"] = range_high
    return prospects

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    
    pff_file = IMPORTS_DIR / "pff_bigboard_2026-01-24.csv"
    if not pff_file.exists():
        print(f"Error: {pff_file} not found")
        return
    
    print(f"Loading PFF data from {pff_file}...")
    prospects = load_pff_csv(pff_file)
    print(f"Loaded {len(prospects)} prospects from PFF")
    
    prospects = recalculate_consensus(prospects)
    
    sources_used = ["PFF"]
    
    output = {
        "meta": {
            "draft_year": 2026,
            "last_updated": today,
            "sources": sources_used,
            "version": "1.2",
            "total_prospects": len(prospects),
            "consensus_method": "median_of_sources"
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
    
    print(f"\nStats:")
    print(f"  Total prospects: {len(prospects)}")
    print(f"  With PFF grade: {sum(1 for p in prospects if p['grades']['pff_overall'])}")
    print(f"  Sources: {', '.join(sources_used)}")
    
    print("\nTop 10 by PFF rank:")
    for p in prospects[:10]:
        grade = p["grades"]["pff_overall"] or "N/A"
        print(f"  {p['rankings']['pff']:3}. {p['name']['display']:25} {p['position']:4} {p['school']:20} (PFF: {grade})")

if __name__ == "__main__":
    main()
