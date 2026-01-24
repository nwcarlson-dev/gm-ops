#!/usr/bin/env python3
"""Update prospect JSON with correct PFF rankings from CSV."""
import json
import csv
import re

def normalize_name(name):
    """Normalize player name for matching."""
    name = name.lower().strip()
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name

def normalize_school(school):
    """Normalize school name for matching."""
    school = school.lower().strip()
    school = re.sub(r'\s+(university|college|state|tech|a&m|ole miss).*', '', school)
    school = school.replace('(fl)', '').replace('(oh)', '').strip()
    return school

# Load PFF CSV
pff_rankings = {}
with open('attached_assets/nfl-draft-bigboard-scout-mode-2026-01-24_(1)_1769238396020.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rank = int(row['Rank'])
        player = row['Player'].strip()
        school = row['School'].strip()
        pos = row['Pos'].strip()
        grade = row['PFF Grade'].strip()
        waa = row['PFF WAA'].strip()
        
        key = normalize_name(player)
        pff_rankings[key] = {
            'rank': rank,
            'pos': pos,
            'school': school,
            'grade': float(grade) if grade != 'N/A' else None,
            'waa': float(waa) if waa != 'N/A' else None
        }

print(f"Loaded {len(pff_rankings)} PFF rankings")

# Load prospect JSON
with open('data/prospects/current/2026_prospects.json', 'r') as f:
    data = json.load(f)

prospects = data['prospects']
matched = 0
unmatched = []

for p in prospects:
    name = p['name']['display'] if isinstance(p['name'], dict) else p['name']
    key = normalize_name(name)
    
    if key in pff_rankings:
        pff = pff_rankings[key]
        p['rankings']['pff'] = pff['rank']
        if pff['grade']:
            p['grades']['pff_overall'] = pff['grade']
        if pff['waa']:
            p['grades']['pff_waa'] = pff['waa']
        matched += 1
    else:
        # Try partial match
        found = False
        for pff_key, pff in pff_rankings.items():
            if key in pff_key or pff_key in key:
                p['rankings']['pff'] = pff['rank']
                if pff['grade']:
                    p['grades']['pff_overall'] = pff['grade']
                if pff['waa']:
                    p['grades']['pff_waa'] = pff['waa']
                matched += 1
                found = True
                break
        if not found:
            if p['rankings'].get('pff'):
                unmatched.append(f"{name} (had PFF #{p['rankings']['pff']})")
            p['rankings']['pff'] = None

# Recalculate consensus for each prospect
for p in prospects:
    rankings = p.get('rankings', {})
    valid_ranks = [r for r in [rankings.get('pff'), rankings.get('cbs')] if r is not None]
    
    if valid_ranks:
        p['consensus'] = {
            'rank': int(sum(valid_ranks) / len(valid_ranks)),
            'range_low': min(valid_ranks),
            'range_high': max(valid_ranks)
        }
    else:
        p['consensus'] = {'rank': 999, 'range_low': None, 'range_high': None}

print(f"Matched {matched} prospects")
print(f"Unmatched: {len(unmatched)}")
if unmatched[:10]:
    print("First 10 unmatched:", unmatched[:10])

# Save updated JSON
with open('data/prospects/current/2026_prospects.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Updated prospect JSON saved")
