#!/usr/bin/env python3
"""
Build prospects JSON from CSV imports.
Supports multiple sources: PFF, CBS, ESPN, NFL.com, etc.
Merges data and calculates consensus rankings.
"""

import csv
import json
import re
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
    "DL": "IDL",
    "DE": "EDGE",
    "HB": "RB",
    "T": "OT",
    "G": "OG",
    "IOL": "IOL",
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
    if not val or str(val).strip() in ["", "N/A"]:
        return None
    try:
        return float(str(val).strip())
    except:
        return None

def safe_int(val):
    if not val or str(val).strip() in ["", "N/A"]:
        return None
    try:
        return int(str(val).strip())
    except:
        return None

def safe_str(val):
    if not val or str(val).strip() == "":
        return None
    return str(val).strip()

def parse_height(ht_str):
    """Parse height like '6-5' or '6-3' to inches"""
    if not ht_str:
        return None
    match = re.match(r"(\d+)-(\d+)", str(ht_str).strip())
    if match:
        feet, inches = int(match.group(1)), int(match.group(2))
        return feet * 12 + inches
    return None

def normalize_name(name):
    """Create normalized key for matching across sources"""
    clean = name.lower()
    clean = re.sub(r"[.\'\"]", "", clean)
    clean = re.sub(r"\s+(jr|sr|ii|iii|iv)\.?$", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def build_prospect_id(name, year=2026):
    clean = name.lower().replace(".", "").replace("'", "")
    clean = re.sub(r"\s+(jr|sr|ii|iii|iv)$", lambda m: "-" + m.group(1), clean)
    parts = clean.split()
    return "-".join(parts) + f"-{year}"

def parse_school_full(school_str):
    school = school_str.strip()
    school = re.sub(r"\s*(Hurricanes|Buckeyes|Volunteers|Fighting Irish|Blue Devils|Thundering Herd|Sooners|Tigers|Cowboys|Trojans|Gators|Crimson Tide|Golden Jackets|Longhorns|Utes|Badgers|Ducks|Cougars|Panthers|Gamecocks|Nittany Lions|Bearcats|Wolverines|Spartans|Cardinal|Hawkeyes|Hokies|Bulldogs|Wildcats|Razorbacks|Bears|Hoosiers|Seminoles|Red Raiders|Cyclones|Sun Devils|Commodores|Mustangs|Aggies|Tar Heels|Yellow Jackets|Demon Deacons|Jayhawks|Horned Frogs|Eagles|Golden Gophers|Scarlet Knights|Mountaineers|Golden Eagles|Broncos|Green Wave|Bulls|Bison|Knights|Rockets)$", "", school)
    return school.strip()

def class_year_map(year_str):
    mapping = {"Fr": "FR", "So": "SO", "Soph": "SO", "Jr": "JR", "Sr": "SR"}
    return mapping.get(year_str, year_str)

def calculate_consensus(rankings):
    ranks = [v for v in rankings.values() if v is not None]
    if not ranks:
        return None, None, None
    consensus = int(median(ranks))
    return consensus, min(ranks), max(ranks)

def projection_label(pick_low, pick_high):
    """Convert pick range to readable label like 'Early 2nd - Late 2nd'"""
    def pick_to_label(pick):
        if pick <= 10:
            return "Top 10"
        elif pick <= 20:
            return "Mid 1st"
        elif pick <= 32:
            return "Late 1st"
        elif pick <= 48:
            return "Early 2nd"
        elif pick <= 56:
            return "Mid 2nd"
        elif pick <= 64:
            return "Late 2nd"
        elif pick <= 80:
            return "Early 3rd"
        elif pick <= 90:
            return "Mid 3rd"
        elif pick <= 100:
            return "Late 3rd"
        elif pick <= 120:
            return "Early 4th"
        elif pick <= 140:
            return "Mid-Late 4th"
        elif pick <= 160:
            return "Early 5th"
        elif pick <= 180:
            return "Mid-Late 5th"
        elif pick <= 200:
            return "Day 3"
        elif pick <= 230:
            return "Late Rounds"
        else:
            return "UDFA"
    
    low_label = pick_to_label(pick_low)
    high_label = pick_to_label(pick_high)
    
    if low_label == high_label:
        return low_label
    else:
        return f"{low_label} - {high_label}"

def estimate_projection_round(rank):
    if not rank:
        return 7
    if rank <= 32:
        return 1
    elif rank <= 64:
        return 2
    elif rank <= 100:
        return 3
    elif rank <= 140:
        return 4
    elif rank <= 180:
        return 5
    elif rank <= 220:
        return 6
    else:
        return 7

def load_pff_csv(filepath):
    """Load PFF big board CSV"""
    prospects = {}
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pff_pos = row.get("Pos", "").strip()
            position = POS_MAP.get(pff_pos, pff_pos)
            
            name = row.get("Player", "").strip()
            school_full = row.get("School", "").strip()
            school = parse_school_full(school_full)
            
            pff_grade = safe_float(row.get("PFF Grade"))
            pff_waa = safe_float(row.get("PFF WAA"))
            pff_rank = safe_int(row.get("Rank"))
            
            key = normalize_name(name)
            
            prospects[key] = {
                "id": build_prospect_id(name),
                "name": {
                    "display": name,
                    "first": name.split()[0] if " " in name else name,
                    "last": " ".join(name.split()[1:]) if " " in name else ""
                },
                "position": position,
                "position_source": {"pff": pff_pos},
                "school": school,
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
                "rankings": {
                    "pff": pff_rank,
                    "cbs": None,
                    "espn": None,
                    "nfl": None,
                    "the_athletic": None
                },
                "position_rankings": {},
                "consensus": {"rank": None, "range_low": None, "range_high": None},
                "grades": {
                    "pff_overall": pff_grade,
                    "pff_waa": pff_waa
                },
                "combine": {},
                "skills": {},
                "traits": [],
                "archetype": None,
                "projection": {"round": None, "range_low": None, "range_high": None, "label": None},
                "scouting_report": None,
                "comparison": None,
                "source_raw": {
                    "pff": {"rank": pff_rank, "grade": pff_grade, "waa": pff_waa, "school_full": school_full, "position": pff_pos}
                }
            }
    return prospects

def load_cbs_csv(filepath):
    """Load CBS big board CSV (tab-separated)"""
    prospects = {}
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            name = row.get("Player", "").strip()
            if not name:
                continue
                
            cbs_pos = row.get("Pos", "").strip()
            position = POS_MAP.get(cbs_pos, cbs_pos)
            
            school = row.get("School", "").strip()
            school = parse_school_full(school)
            
            cbs_rank = safe_int(row.get("Rk"))
            pos_rank = safe_int(row.get("Pos Rk"))
            year = safe_str(row.get("Year"))
            height = parse_height(row.get("HT"))
            weight = safe_int(row.get("WT"))
            
            key = normalize_name(name)
            
            prospects[key] = {
                "name": name,
                "position": position,
                "position_cbs": cbs_pos,
                "school": school,
                "class_year": class_year_map(year) if year else None,
                "cbs_rank": cbs_rank,
                "pos_rank": pos_rank,
                "height_in": height,
                "weight_lbs": weight
            }
    return prospects

def merge_sources(pff_data, cbs_data):
    """Merge CBS data into PFF base"""
    merged = pff_data.copy()
    
    for key, cbs in cbs_data.items():
        if key in merged:
            p = merged[key]
            p["rankings"]["cbs"] = cbs["cbs_rank"]
            p["position_rankings"]["cbs"] = cbs["pos_rank"]
            p["position_source"]["cbs"] = cbs["position_cbs"]
            
            if cbs["height_in"]:
                p["bio"]["height_in"] = cbs["height_in"]
            if cbs["weight_lbs"]:
                p["bio"]["weight_lbs"] = cbs["weight_lbs"]
            if cbs["class_year"]:
                p["class_year"] = cbs["class_year"]
            
            p["source_raw"]["cbs"] = {
                "rank": cbs["cbs_rank"],
                "pos_rank": cbs["pos_rank"],
                "position": cbs["position_cbs"],
                "height": cbs["height_in"],
                "weight": cbs["weight_lbs"],
                "year": cbs["class_year"]
            }
        else:
            new_prospect = {
                "id": build_prospect_id(cbs["name"]),
                "name": {
                    "display": cbs["name"],
                    "first": cbs["name"].split()[0] if " " in cbs["name"] else cbs["name"],
                    "last": " ".join(cbs["name"].split()[1:]) if " " in cbs["name"] else ""
                },
                "position": cbs["position"],
                "position_source": {"cbs": cbs["position_cbs"]},
                "school": cbs["school"],
                "conference": None,
                "class_year": cbs["class_year"],
                "bio": {
                    "height_in": cbs["height_in"],
                    "weight_lbs": cbs["weight_lbs"],
                    "birth_date": None,
                    "age_years": None,
                    "age_months": None,
                    "hometown": None,
                    "arm_length_in": None,
                    "hand_size_in": None
                },
                "rankings": {
                    "pff": None,
                    "cbs": cbs["cbs_rank"],
                    "espn": None,
                    "nfl": None,
                    "the_athletic": None
                },
                "position_rankings": {"cbs": cbs["pos_rank"]},
                "consensus": {"rank": None, "range_low": None, "range_high": None},
                "grades": {"pff_overall": None, "pff_waa": None},
                "combine": {},
                "skills": {},
                "traits": [],
                "archetype": None,
                "projection": {"round": None, "range_low": None, "range_high": None, "label": None},
                "scouting_report": None,
                "comparison": None,
                "source_raw": {
                    "cbs": {
                        "rank": cbs["cbs_rank"],
                        "pos_rank": cbs["pos_rank"],
                        "position": cbs["position_cbs"],
                        "height": cbs["height_in"],
                        "weight": cbs["weight_lbs"],
                        "year": cbs["class_year"]
                    }
                }
            }
            merged[key] = new_prospect
    
    return merged

def recalculate_consensus(prospects):
    for key, p in prospects.items():
        rankings = p.get("rankings", {})
        consensus, range_low, range_high = calculate_consensus(rankings)
        p["consensus"] = {
            "rank": consensus,
            "range_low": range_low,
            "range_high": range_high
        }
        
        if range_low and range_high:
            p["projection"] = {
                "round": estimate_projection_round(consensus),
                "range_low": range_low,
                "range_high": range_high,
                "label": projection_label(range_low, range_high)
            }
        elif consensus:
            p["projection"] = {
                "round": estimate_projection_round(consensus),
                "range_low": consensus,
                "range_high": consensus,
                "label": projection_label(consensus, consensus)
            }
    return prospects

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    sources_used = []
    
    pff_file = IMPORTS_DIR / "pff_bigboard_2026-01-24.csv"
    cbs_file = IMPORTS_DIR / "cbs_bigboard_2026-01-24.csv"
    
    prospects = {}
    
    if pff_file.exists():
        print(f"Loading PFF data from {pff_file}...")
        prospects = load_pff_csv(pff_file)
        sources_used.append("PFF")
        print(f"  Loaded {len(prospects)} prospects from PFF")
    
    if cbs_file.exists():
        print(f"Loading CBS data from {cbs_file}...")
        cbs_data = load_cbs_csv(cbs_file)
        sources_used.append("CBS")
        print(f"  Loaded {len(cbs_data)} prospects from CBS")
        
        before = len(prospects)
        prospects = merge_sources(prospects, cbs_data)
        new_from_cbs = len(prospects) - before
        print(f"  Merged: {len(cbs_data) - new_from_cbs} matched, {new_from_cbs} new from CBS")
    
    prospects = recalculate_consensus(prospects)
    
    prospects_list = sorted(prospects.values(), key=lambda p: p["consensus"]["rank"] or 999)
    
    with_both = sum(1 for p in prospects_list if p["rankings"]["pff"] and p["rankings"]["cbs"])
    with_height = sum(1 for p in prospects_list if p["bio"]["height_in"])
    
    output = {
        "meta": {
            "draft_year": 2026,
            "last_updated": today,
            "sources": sources_used,
            "version": "1.3",
            "total_prospects": len(prospects_list),
            "consensus_method": "median_of_sources"
        },
        "prospects": prospects_list
    }
    
    CURRENT_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    
    current_file = CURRENT_DIR / "2026_prospects.json"
    with open(current_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved to {current_file}")
    
    snapshot_file = SNAPSHOTS_DIR / f"{today}_prospects.json"
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"Snapshot saved to {snapshot_file}")
    
    print(f"\n=== Stats ===")
    print(f"Total prospects: {len(prospects_list)}")
    print(f"With both PFF + CBS rank: {with_both}")
    print(f"With height/weight: {with_height}")
    print(f"Sources: {', '.join(sources_used)}")
    
    print(f"\n=== Top 15 by Consensus ===")
    for p in prospects_list[:15]:
        pff = p["rankings"]["pff"] or "-"
        cbs = p["rankings"]["cbs"] or "-"
        label = p["projection"]["label"] or "-"
        ht = p["bio"]["height_in"]
        ht_str = f"{ht // 12}-{ht % 12}" if ht else "-"
        wt = p["bio"]["weight_lbs"] or "-"
        print(f"  {p['consensus']['rank']:3}. {p['name']['display']:25} {p['position']:4} PFF:{pff:>3} CBS:{cbs:>3}  {ht_str:>4} {wt:>3}lb  [{label}]")

if __name__ == "__main__":
    main()
