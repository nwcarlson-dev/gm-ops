# GM Ops - Game Design Document

## Overview
GM Ops is a comprehensive NFL franchise simulation focusing on realistic GM decision-making. The game emphasizes scheme fit, player development, and multi-season dynasty building.

---

## Core Systems

### 1. Scheme System
Every team runs offensive and defensive schemes that define ideal player traits.

#### Offensive Schemes
| Scheme | Key Traits Required | Positional Priorities |
|--------|---------------------|----------------------|
| **Shanahan Wide Zone** | Athletic OL, one-cut RBs, YAC receivers | OT mobility, RB vision, WR after-catch |
| **Air Raid** | Quick release QB, route-running WRs, pass-pro OL | QB processing, WR separation, OL pass-pro |
| **Power Run** | Physical OL, downhill RBs, blocking TEs | OL strength, RB power, TE blocking |
| **West Coast** | Accurate short-pass QB, possession WRs | QB accuracy, WR hands, RB receiving |
| **Spread RPO** | Dual-threat QB, versatile skill players | QB mobility, WR versatility, OL zone blocking |

#### Defensive Schemes
| Scheme | Key Traits Required | Positional Priorities |
|--------|---------------------|----------------------|
| **4-3 Under** | Speed rushers, rangy LBs, man-capable CBs | EDGE speed, LB range, CB man coverage |
| **3-4 Odd** | 2-gap DL, hybrid OLBs, smart ILBs | DL size, OLB versatility, ILB instincts |
| **Tampa 2** | Fast LBs, zone corners, centerfield safety | LB speed, CB zone skills, S range |
| **Press Man** | Physical corners, pass-rush specialists | CB press, EDGE power, S physicality |
| **Hybrid/Multiple** | Versatile players at every level | Position flexibility, football IQ |

### 2. Prospect Trait System
Every prospect has traits that determine scheme fit.

#### Trait Categories
- **Physical**: Speed, Strength, Agility, Size, Explosiveness
- **Technical**: Technique, Hands, Route Running, Pass Rush Moves
- **Mental**: Football IQ, Processing, Vision, Instincts
- **Intangibles**: Motor, Leadership, Clutch, Durability

#### Scheme Fit Calculation
```
Scheme Fit Score = 
  (Matching Priority Traits × Weight) / Total Priority Traits
  
  Weight:
  - Primary trait match: 1.0
  - Secondary trait match: 0.5
  - Trait mismatch: 0.0
```

### 3. Team Needs System
Team needs are determined by:
1. **Roster gaps** - Missing starters or depth
2. **Contract situations** - Expiring deals, cap casualties
3. **Scheme requirements** - Traits needed for system
4. **Priority level** - High (immediate), Medium (near-term), Low (depth)

#### Need Priority Indicators
- **High (Red)**: Immediate starter need, critical weakness
- **Medium (Yellow)**: Upgrade opportunity, depth concern
- **Low (Muted)**: Future depth, luxury pick

### 4. Draft Room Integration
The draft room helps users identify scheme-fit prospects:

#### Prospect Card Shows:
- Overall rank and positional rank
- Physical measurables
- Archetype (e.g., "Franchise Passer", "Speed Rusher")
- Key traits with scheme-fit indicators
- Draft range projection
- Team fit suggestions

#### Scheme Fit Visualization:
- **Green checkmark**: Trait matches team's scheme priority
- **Yellow dash**: Trait is neutral for scheme
- **Red X**: Trait conflicts with scheme requirements

---

## Player Archetypes by Position

### Quarterback
| Archetype | Key Traits | Ideal Schemes |
|-----------|-----------|---------------|
| Franchise Passer | Accuracy, Processing, Arm | West Coast, Air Raid |
| Dual-Threat | Mobility, Arm, Athleticism | Spread RPO, Shanahan |
| Game Manager | Accuracy, Decision-making | Power Run, West Coast |
| Gunslinger | Arm strength, Confidence | Air Raid, Vertical |

### Running Back
| Archetype | Key Traits | Ideal Schemes |
|-----------|-----------|---------------|
| Workhorse | Durability, Vision, Power | Power Run |
| Speed Back | Breakaway speed, Agility | Shanahan, Spread |
| Receiving Back | Hands, Routes, Pass-pro | West Coast, Air Raid |
| Power Back | Strength, Contact balance | Power Run, Short-yardage |

### Wide Receiver
| Archetype | Key Traits | Ideal Schemes |
|-----------|-----------|---------------|
| X-Receiver | Size, Contested catch | Power Run, West Coast |
| Slot Playmaker | Quickness, YAC, Routes | Shanahan, Spread |
| Deep Threat | Speed, Tracking | Air Raid, Vertical |
| Possession | Hands, Routes, Reliability | West Coast |

### Edge Rusher
| Archetype | Key Traits | Ideal Schemes |
|-----------|-----------|---------------|
| Speed Rusher | Get-off, Bend, Speed | 4-3 Under, Hybrid |
| Power Rusher | Strength, Bull rush | 3-4, Power front |
| Hybrid Defender | Versatility, Coverage | Multiple, 3-4 OLB |

### Cornerback
| Archetype | Key Traits | Ideal Schemes |
|-----------|-----------|---------------|
| Lockdown | Man coverage, Press | Press Man |
| Zone Corner | Ball skills, Instincts | Tampa 2, Cover 3 |
| Slot Corner | Quickness, Tackling | Nickel packages |

---

## Franchise Mode Integration

### Season Simulation
- Weekly game simulation based on scheme matchups
- Player performance affected by scheme fit
- Injuries, suspensions, weather effects

### Player Development
- Trait improvement based on coaching and reps
- Scheme fit affects development rate
- Age-based progression curves

### Dynasty Tracking
- Multi-season career stats
- Draft class grades
- GM rating and job security
- Owner relationships

---

## Data Sources (Future)
- Consensus draft rankings from multiple sources
- Real scouting reports and measurables
- Historical draft data for projection accuracy
- API integration for live roster updates

---

## Version History
- v0.1: Initial draft room UI framework
- v0.2: Scheme/trait system design (current)
