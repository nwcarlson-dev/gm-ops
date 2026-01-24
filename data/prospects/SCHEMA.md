# 2026 Prospects Data Schema

## Overview
This document describes the data structure for NFL draft prospects.

## File Location
`data/prospects/2026_prospects.json`

## Schema Structure

### Meta Object
```json
{
  "draft_year": 2026,
  "last_updated": "YYYY-MM-DD",
  "sources": ["PFF", "ESPN", "NFL.com"],
  "version": "1.0"
}
```

### Prospect Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase-hyphenated) |
| `name` | object | First, last, display name |
| `position` | string | Primary position (QB, RB, WR, TE, OT, OG, C, IDL, EDGE, LB, CB, S, K, P) |
| `school` | string | College name |
| `conference` | string | Conference (SEC, Big Ten, ACC, Big 12, Pac-12, etc.) |
| `class` | string | FR, SO, JR, SR, RS-FR, etc. |

### Bio Object
| Field | Type | Description |
|-------|------|-------------|
| `height_in` | number | Height in inches |
| `weight_lbs` | number | Weight in pounds |
| `birth_date` | string | YYYY-MM-DD format |
| `age_years` | number | Age in years at draft |
| `age_months` | number | Additional months |
| `hometown` | string | City, State |
| `arm_length_in` | number | Arm length in inches |
| `hand_size_in` | number | Hand size in inches |

### Rankings Object
| Field | Type | Description |
|-------|------|-------------|
| `consensus` | number | Consensus big board rank |
| `pff` | number | PFF ranking |
| `espn` | number | ESPN (Kiper/McShay) ranking |
| `nfl` | number | NFL.com ranking |

### Grades Object (PFF)
| Field | Type | Description |
|-------|------|-------------|
| `pff_overall` | number | Overall PFF grade (0-100) |
| Position-specific grades vary by position |

### Combine Object
| Field | Type | Description |
|-------|------|-------------|
| `forty` | number | 40-yard dash time |
| `vertical` | number | Vertical jump (inches) |
| `broad_jump` | number | Broad jump (inches) |
| `three_cone` | number | 3-cone drill time |
| `shuttle` | number | 20-yard shuttle time |
| `bench` | number | Bench press reps (225 lbs) |

### Skills Object
Skills vary by position. All rated 0-100.

**QB Skills:**
- arm_strength, accuracy_short, accuracy_deep, decision_making
- pocket_presence, mobility, release_speed, anticipation

**RB Skills:**
- acceleration, vision, elusiveness, power, pass_blocking
- receiving, ball_security, lateral_agility

**WR Skills:**
- route_running, separation, catch_radius, yac
- contested_catch, release, hands

**OL Skills:**
- pass_protection, footwork, anchor, run_blocking
- pull_ability, awareness, hand_placement

**EDGE Skills:**
- pass_rush_moves, bend_flexibility, speed_to_power
- first_step, hand_usage, run_stuffing, motor

**IDL Skills:**
- run_stuffing, anchor, double_team_resistance
- pass_rush_moves, first_step, hand_usage

**LB Skills:**
- run_defense, pass_coverage, blitzing
- tackling, instincts, sideline_to_sideline

**CB Skills:**
- press_technique, man_coverage, zone_coverage
- ball_skills, recovery_speed, tackling

**S Skills:**
- range, man_coverage, zone_coverage
- tackling, ball_skills, instincts, versatility

### Other Fields
| Field | Type | Description |
|-------|------|-------------|
| `traits` | array | Key scouting traits (strings) |
| `archetype` | string | Player archetype label |
| `projection` | object | {round, range_low, range_high} |
| `scouting_report` | string | Written analysis |
| `comparison` | string | NFL player comparison |

## Data Sources

### PFF Integration
With a PFF subscription, you can export:
- Player grades
- Advanced metrics
- Snap counts
- Signature stats

### Adding New Prospects
1. Copy the template structure
2. Generate unique ID: `firstname-lastname-year`
3. Fill in available data
4. Leave unknown fields as `null`

## Version History
- v1.0 (2026-01-24): Initial schema with top 8 prospects
