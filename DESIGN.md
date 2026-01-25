# GM Ops - Technical Design Document

> **Last Updated:** January 25, 2026  
> **Purpose:** Single source of truth for all game systems, mechanics, and technical decisions.  
> **Update Policy:** This document must be updated whenever design decisions are made in Claude chats.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Control Level System](#control-level-system)
3. [Player Rating System](#player-rating-system)
4. [Position Flexibility System](#position-flexibility-system)
5. [Scheme System](#scheme-system)
6. [Combine & Pro Day System](#combine--pro-day-system)
7. [Coaching Staff System](#coaching-staff-system)
8. [Front Office System](#front-office-system)
9. [Owner System](#owner-system)
10. [Free Agency System](#free-agency-system)
11. [Trade System](#trade-system)
12. [AI Draft Logic System](#ai-draft-logic-system)
13. [Offseason Structure](#offseason-structure)
14. [Career Progression](#career-progression)
15. [UI Sliders & Configurable Settings](#ui-sliders--configurable-settings)
16. [Culture System](#culture-system)
17. [Implementation Status](#implementation-status)
18. [Current Data Models](#current-data-models)
19. [Session Log](#session-log)

---

## Core Philosophy

**GM Ops is a roster construction simulator, not a play-calling simulator.**

- Schemes define which skills matter at each position (skill weights)
- Coach ratings determine how well they execute the scheme (simulation outcomes)
- Gameplan sliders provide adjustable tendencies (run/pass ratio, aggressiveness)
- Archetypes are cosmetic labels only - no gameplay impact
- The user's job: Draft/sign players who fit scheme weights, hire coaches who run schemes that fit the roster

---

## Control Level System

**"Difficulty" in GM Ops is not about simulation difficulty - it's about management responsibility.**

The simulation engine runs identically regardless of setting. What changes is how much the user controls vs. delegates to the CPU, and how much guidance the game provides.

### Control Levels

| Level | Name | Philosophy |
|-------|------|------------|
| 1 | **Casual** | Enjoy the experience, CPU handles details |
| 2 | **Balanced** | Strategic oversight with smart assistance |
| 3 | **Involved** | Full control with helpful recommendations |
| 4 | **Total Control** | You're on your own - minimal hand-holding |

### What Changes Per Level

| Aspect | Casual | Balanced | Involved | Total Control |
|--------|--------|----------|----------|---------------|
| **Draft** | CPU drafts based on your priorities | You pick Round 1, CPU handles rest | You pick all, see recommendations | You pick all, no suggestions |
| **Free Agency** | CPU signs based on needs/budget | Approve/veto major signings | Full control, value alerts shown | Full control, no alerts |
| **Trades** | CPU proposes, you approve/veto | CPU proposes, you can counter | You initiate, CPU shows fair value | You initiate, no value guidance |
| **Roster Cuts** | Automatic | Approve final 53 | Make all cuts, warnings shown | Make all cuts, no warnings |
| **Cap Management** | Automatic restructures | Approve restructures over $X | Manual, suggestions shown | Manual, no suggestions |
| **Scouting** | Auto-scout all prospects | Auto-scout, you deep-dive top targets | Manual, scheme fit highlighted | Manual, raw data only |
| **Scheme Fit Badges** | Always shown prominently | Shown on hover | Shown in detail view only | Off by default (can enable) |
| **Decision Prompts** | Major moments only (1st round pick) | Key decisions (top FA, trades) | All decisions presented | All decisions, no guidance |

### Design Philosophy

**Target audience already wants control over picks, trades, and signings** - that's why they're playing a GM sim. The control levels are about:

1. **Admin work** - Roster cuts (90→53), practice squad churn, IR moves, waiver claims
2. **Guidance level** - Scheme fit badges, value alerts, trade recommendations
3. **Organizational depth** - Scout assignments, coaching staff management, front office hires
4. **Information density** - Summary cards vs. detailed spreadsheets

### User Experience Goals

1. **Casual**: Minimize tedious admin, maximize big moments. "I'll draft and sign stars, but handle the roster bubble for me."

2. **Balanced**: Strategic control with smart automation for grunt work. "I'll make every pick, but auto-cut to 53 based on my depth chart."

3. **Involved**: Full control with efficiency tools. "Show me everything, highlight what matters, I'll decide."

4. **Total Control**: Maximum agency, minimal hand-holding. "No recommendations - I have my own evaluations."

### Implementation Notes

- **Presets, not locks**: Control levels are starting templates, not restrictions
- **Per-feature override**: User can select "Balanced" but toggle individual settings (e.g., "I always control roster cuts manually")
- **Changeable anytime**: Adjust mid-franchise, mid-offseason, whenever
- **Same simulation**: Engine runs identically regardless of control level
- **UI density scales**: Lower levels see summary views, higher levels see full tables
- **Data always accessible**: Control level affects what's surfaced, not what exists - users can always dig deeper
- **Saveable profiles**: Users can save custom control/slider configurations and load them for new franchises

### Leaderboard Eligibility

Public leaderboards require standardized settings to ensure fair competition:

- **Control Level**: Total Control (no CPU assistance)
- **Sliders**: Default values (no user modifications)
- **Verification**: Franchise must be started with these settings; mid-save changes disqualify

Users can still play however they want - custom settings just mark the save as "unranked" for public leaderboard purposes.

**Community Settings**: Users can share custom slider/control configurations with others. These are valid for play and community challenges, just not public leaderboard rankings.

**Private/Online Franchises**: Friends playing together can use whatever settings they want - no restrictions. Total Control + default sliders only applies to public leaderboard eligibility, not private leagues.

---

## Player Rating System

### Physical Attributes (All Players)

| Attribute | Description |
|-----------|-------------|
| Height | Measured in inches |
| Weight | Measured in pounds |
| Arm Length | Measured in inches |
| Hand Size | Measured in inches |
| Wingspan | Measured in inches |
| Speed | 40-yard dash time converted to 0-100 |
| Agility | 3-cone/shuttle converted to 0-100 |
| Vertical | Vertical jump converted to 0-100 |
| Strength | Bench press / functional strength |

### Universal Skills (All Players)

| Skill | Description |
|-------|-------------|
| Motor | Consistent effort, not taking plays off |
| Contact Aggression | Seeking contact vs. protecting self |
| Football IQ | Understanding of the game |
| Punt Return | Ability to return punts |
| Kick Return | Ability to return kicks |
| Coverage Instincts | Special teams coverage ability |
| Gunner | Punt coverage specialist ability |

### Position Skills

#### Quarterback (QB) - 11 Skills
- Arm Strength
- Accuracy (Short)
- Accuracy (Medium)
- Accuracy (Deep)
- Release Speed (time to throw / quick release)
- Decision Making
- Pocket Presence
- Mobility
- Play Action
- Leadership
- Contact Aggression

#### Running Back (RB) - 8 Skills
- Vision
- Acceleration
- Tackle Breaking
- Elusiveness
- Pass Catching
- Pass Protection
- Contact Aggression
- Ball Security

#### Fullback (FB) - 7 Skills
- Run Blocking
- Pass Protection
- Short Area Power
- Tackle Breaking
- Contact Aggression
- Pass Catching
- Speed

#### H-Back - 6 Skills
- Run Blocking
- Pass Catching
- Route Running
- Pass Protection
- Speed
- Versatility

#### Wide Receiver (WR) - 9 Skills
- Route Running
- Release
- Separation
- Catch Radius
- Hands
- YAC Ability
- Contested Catches
- Contact Aggression
- Decision Making

#### Tight End (TE) - 8 Skills
- Run Blocking
- Route Running
- Hands
- YAC Ability
- Contested Catches
- Seam Threat
- Red Zone Target
- Contact Aggression

#### Offensive Tackle (OT) - 7 Skills
- Pass Protection
- Run Blocking
- Anchor
- Footwork
- Awareness
- Power at POA
- Contact Aggression

#### Offensive Guard (OG) - 7 Skills
- Run Blocking
- Pass Protection
- Awareness
- Anchor
- Pull Ability
- Double Teams
- Contact Aggression

#### Offensive Center (OC) - 7 Skills
- Run Blocking
- Pass Protection
- Awareness
- Anchor
- Snapping
- Reach Ability
- Leadership

#### Interior Defensive Line (IDL) - 8 Skills
- Run Stuffing
- Pass Rush Moves
- Block Shedding
- Anchor
- Penetration
- Double Team Resistance
- Pursuit
- Contact Aggression

#### Edge - 8 Skills
- Pass Rush Moves
- Speed to Power
- Bend/Flexibility
- Run Defense
- Block Shedding
- Pursuit
- Coverage Ability
- Contact Aggression

#### Linebacker (LB) - 9 Skills
- Run Defense
- Block Shedding
- Tackling
- Pursuit
- Zone Coverage
- Man Coverage
- Blitzing
- Instincts
- Contact Aggression

#### Defensive Back (DB) - 9 Skills
- Man Coverage
- Zone Coverage
- Press Technique
- Ball Skills
- Tackling
- Range
- Instincts
- Blitzing
- Contact Aggression

#### Kicker (K) - 5 Skills
- Leg Strength
- Accuracy
- Clutch
- Kickoff Distance
- Kickoff Hangtime

#### Punter (P) - 4 Skills
- Leg Strength
- Hangtime
- Directional
- Consistency

#### Long Snapper (LS) - 3 Skills
- Long Snapping
- Tackling
- Consistency

### Archetypes (Cosmetic Only)

Archetypes are labels derived from a player's highest skills. They have **zero gameplay impact** - only the underlying skill ratings matter for scheme fit.

Examples:
- QB: Pocket Passer, Dual-Threat, Game Manager
- RB: Power Back, Scat Back, All-Purpose
- WR: Deep Threat, Possession, Slot, YAC Monster
- Edge: Speed Rusher, Power Rusher, Hybrid

---

## Position Flexibility System

### Core Concept

Players have a **Primary Position** and can have **Secondary Positions** they're capable of playing. Secondary positions have their own skill ratings (which may be lower than primary).

### Player Position Structure
```javascript
{
  primaryPosition: "RB",
  primarySkills: { /* RB skills at full rating */ },
  
  secondaryPositions: [
    {
      position: "WR-Slot",
      proficiency: 65,  // 0-100, how well they play this position
      skills: { /* WR skills, typically lower */ }
    }
  ]
}
```

### Position Transition Paths

These are the logical position changes based on skill overlap:

#### Offense

| From | Can Play | Notes |
|------|----------|-------|
| RB | WR-Slot, H-Back | Pass-catching backs line up in slot |
| FB | H-Back, TE | Blocking/receiving hybrid |
| H-Back | TE, FB, WR-Slot | Versatile by definition |
| WR-X | WR-Z, WR-Slot | Outside receivers can move around |
| WR-Z | WR-X, WR-Slot | Outside receivers can move around |
| WR-Slot | WR-X, WR-Z, RB | Slot receivers sometimes outside or motion to backfield |
| TE-Y | TE-U, WR-X | Inline TE can flex out |
| TE-U | TE-Y, WR-Slot, H-Back | Move TE very versatile |
| OT-LT | OT-RT, OG | Tackles can kick inside |
| OT-RT | OT-LT, OG | Tackles can kick inside |
| OG | OC, OT | Guards can play center or emergency tackle |
| OC | OG | Centers can play guard |

#### Defense

| From | Can Play | Notes |
|------|----------|-------|
| Edge | Off-Ball LB, IDL (4-3 DE to 3-4 DE) | Pass rushers can drop or move inside |
| IDL-NT | IDL-3T | Nose can play 3-tech in sub packages |
| IDL-3T | IDL-NT, Edge (in 3-4) | 3-tech can play nose or stand up |
| LB-MIKE | LB-WILL, LB-SAM | Off-ball LBs interchange |
| LB-WILL | LB-MIKE, S-SS | Coverage LBs can play safety |
| LB-SAM | LB-MIKE, Edge | Strong-side LB can rush |
| CB-Outside | CB-Slot, S-FS | Corners can move inside or to safety |
| CB-Slot | CB-Outside, S-SS | Nickel corners can play outside or safety |
| S-FS | S-SS, CB, LB-WILL | Free safety very versatile |
| S-SS | S-FS, LB-WILL, CB-Slot | Strong safety can play multiple spots |

### Scheme-Specific Position Requirements

Different schemes need different position configurations:

| Scheme | Position Variations |
|--------|---------------------|
| 3-4 Defense | Needs 2 Edge (1 pass rusher, 1 hybrid), NT, 2 ILB, 2 OLB |
| 4-3 Defense | Needs 2 Edge, 2 IDL (1 NT, 1 3T), 3 LB |
| 4-2-5 Nickel | Needs 3 CB (2 outside, 1 slot), 2 S, 2 LB |
| Dime | Needs 4 CB or 3 CB + extra S |
| West Coast | Needs pass-catching RB, TE who can flex |
| Spread | Needs 4+ WRs, may use RB in slot |
| Power Run | Needs FB or H-Back, inline TE |

### Depth Chart Flexibility

The system automatically considers secondary positions when building depth charts:

1. **Primary Position First** - Players fill their primary position
2. **Secondary by Proficiency** - If primary is filled, check secondary positions
3. **Scheme Fit Still Applies** - Secondary position still uses scheme skill weights
4. **Proficiency Penalty** - Secondary position performance = skills × proficiency %

Example: A RB with 85 Vision playing WR-Slot at 65% proficiency effectively has ~55 Route Running impact.

### Position Groups for UI

| Group | Positions |
|-------|-----------|
| Quarterbacks | QB |
| Running Backs | RB, FB, H-Back |
| Receivers | WR-X, WR-Z, WR-Slot |
| Tight Ends | TE-Y, TE-U |
| Offensive Line | OT-LT, OT-RT, OG, OC |
| Interior D-Line | IDL-NT, IDL-3T |
| Edge Rushers | Edge |
| Linebackers | LB-MIKE, LB-WILL, LB-SAM |
| Cornerbacks | CB-Outside, CB-Slot |
| Safeties | S-FS, S-SS |
| Specialists | K, P, LS |

### Position Display Names (for UI / Team Needs)

| Code | Display Name | Alternate Names |
|------|--------------|-----------------|
| QB | Quarterback | QB |
| RB | Running Back | RB, Halfback |
| FB | Fullback | FB |
| H-Back | H-Back | H-Back, F-Back |
| WR-X | Wide Receiver (X) | WR, Split End |
| WR-Z | Wide Receiver (Z) | WR, Flanker |
| WR-Slot | Slot Receiver | Slot, Nickel WR |
| TE-Y | Tight End (Y) | TE, Inline TE |
| TE-U | Tight End (U) | Move TE, Flex TE |
| OT-LT | Left Tackle | LT, Offensive Tackle |
| OT-RT | Right Tackle | RT, Offensive Tackle |
| OG | Offensive Guard | OG, Guard |
| OC | Center | C, Center |
| IDL-NT | Nose Tackle | NT, Nose, 0-Tech |
| IDL-3T | Defensive Tackle | DT, 3-Tech, Under Tackle |
| Edge | Edge Rusher | Edge, DE, OLB (3-4) |
| LB-MIKE | Middle Linebacker | MLB, MIKE, ILB |
| LB-WILL | Weak-side Linebacker | WLB, WILL, ILB |
| LB-SAM | Strong-side Linebacker | SLB, SAM, OLB |
| CB-Outside | Cornerback | CB, Outside Corner |
| CB-Slot | Slot Corner | Nickel, SCB |
| S-FS | Free Safety | FS, Deep Safety |
| S-SS | Strong Safety | SS, Box Safety |
| K | Kicker | K, PK |
| P | Punter | P |
| LS | Long Snapper | LS |

### Team Needs Format

Team needs in `index.html` use display names with archetypes:
```javascript
offNeeds: [
  [true, "Quarterback", "Dual-Threat"],      // [isCritical, position, archetype]
  [true, "Offensive Tackle", "Blindside Protector"],
  [false, "Wide Receiver", "Field Stretcher"]
],
defNeeds: [
  [true, "Cornerback", "Press-Man"],
  [false, "Edge Rusher", "Speed Rusher"],
  [false, "Safety", "Centerfield"]
]
```

**Standard Position Names for Team Needs:**
- Quarterback
- Running Back
- Fullback
- Wide Receiver
- Tight End
- Offensive Tackle
- Offensive Guard / Interior O-Line
- Center
- Defensive Tackle / Defensive Line
- Nose Tackle
- Edge Rusher / Edge
- Linebacker
- Cornerback
- Safety

**Standard Archetypes for Team Needs:**

| Position | Archetypes |
|----------|------------|
| QB | Pocket Passer, Dual-Threat, Game Manager, Gunslinger |
| RB | Power Back, Scat Back, Workhorse, Pass Catcher |
| WR | Field Stretcher, Possession, YAC Monster, Contested Catch, Route Technician |
| TE | Inline Blocker, Seam Stretcher, Move TE, Red Zone Threat |
| OT | Blindside Protector, Mauler, Technician, Athletic, Anchor |
| OG/C | Road Grader, Zone Blocker, Pivot, Power Blocker |
| IDL | Penetrator, Anchor, Two-Gap, 3-Tech |
| Edge | Speed Rusher, Power Rusher, Bendy, Run Stuffer, Hybrid |
| LB | Thumper, Coverage, Sideline-to-Sideline, Versatile, Blitzer |
| CB | Press-Man, Zone, Ballhawk, Technical, Physical |
| S | Centerfield, Box Safety, Hybrid, Playmaker, Range |

---

## AI Draft Logic System

**Approved: January 25, 2026**

### Overview

Each AI team generates a hidden draft board at the start of each draft. This board varies from consensus rankings based on scheme fit, team needs, and random variance. The board drives both pick selection AND trade-up decisions.

### Team Draft Board Generation

Each team's draft board applies these modifiers to the consensus ranking:

1. **Base**: Start with prospect's `consensus.rank`
2. **Scheme Fit Modifier**: Adjust based on player's skill match to team's offensive/defensive scheme (from `data/schemes/scheme_skill_weights.json`)
3. **Need Boost**: Positions the team needs get bumped up on the board
4. **Development Certainty Modifier**: "Sure fire" prospects have less variance; "projects" have more
5. **Random Variance**: Per-team, per-prospect randomization for replayability

**Teams without a Head Coach**: Skip scheme modifier entirely, use pure BPA + needs + variance.

### Variance Tiers

The higher a player's consensus rank, the less variance in team boards:

| Consensus Range | Max Variance | Notes |
|-----------------|--------------|-------|
| Top 5 | ±5 picks | Elite prospects, universal agreement |
| 6-15 | ±10 picks | First-round locks |
| 16-50 | ±20 picks | Significant team disagreement possible |
| 51+ | ±30+ picks | Wide variance; one team's 4th rounder is another's undrafted |

### Development Certainty

Derived from scouting report keywords and projection data:

| Certainty Level | Variance Multiplier | Indicators |
|-----------------|---------------------|------------|
| **Sure Fire** (1.0) | 0.5x | "ready", "day one", "starter", "polish" |
| **Standard** (0.5) | 1.0x | Default / no strong indicators |
| **Project** (0.0) | 1.5x | "raw", "project", "development", "upside" |

Formula: `finalVariance = baseVariance * (0.5 + certaintyMultiplier)`

### Positional Value Modifier

Certain positions have inherent draft value beyond their ranking:

| Position | Modifier | Notes |
|----------|----------|-------|
| QB | +10-15 picks | Teams reach for franchise QBs |
| OT | +5-8 picks | Premium on blindside protection |
| EDGE | +5-8 picks | Pass rushers at a premium |
| WR (playmaker) | +3-5 picks | Explosive pass catchers valued |
| RB | -10-15 picks | Positional devaluation, shorter careers |

These modifiers reflect real NFL draft tendencies where teams consistently overdraft QBs and pass rushers while letting RBs fall.

### Scheme Fit Calculation

```
schemeFit = Σ(playerSkill × schemeWeight) / Σ(schemeWeights)
```

Players who fit the scheme well get boosted on that team's board. Players who don't fit may fall significantly for scheme-heavy teams.

### Pick Selection Logic

When an AI team is on the clock:

1. Filter available prospects
2. Look up team's hidden draft board ranking for each prospect
3. Select the highest-ranked available prospect on their board

This replaces the current "first available at need position" logic.

### Trade-Up Triggers (Future Implementation)

When a prospect on a team's board is ranked significantly higher than the current pick slot:

- **Trigger threshold**: Prospect ranked 15+ spots higher than current pick on team's board
- **Value check**: Would the trade be fair based on trade value chart?
- **Capital check**: Does the team have enough picks to trade up?

If all conditions met, team may initiate a trade offer.

### 2026 Team Scheme Assignments

| Team | Offensive Scheme | Defensive Scheme |
|------|------------------|------------------|
| 49ers | Shanahan Wide Zone | 4-3 Wide-9 |
| Bears | Johnson Erhardt-Perkins | 4-3 Under |
| Bengals | 11 Personnel Spread | 3-4 Zone |
| Bills | Spread Vertical | 4-3 Zone |
| Broncos | Payton West Coast | 3-4 Multiple |
| Browns | Zone Run Heavy | 4-3 Aggressive |
| Buccaneers | Vertical Attack | 3-4 Pressure |
| Cardinals | Spread RPO | 3-4 Hybrid |
| Chargers | Harbaugh Power Run | 3-4 Versatile |
| Chiefs | West Coast Spread | 3-4 Multiple Blitz |
| Colts | RPO Heavy | 4-3 Cover 3 |
| Commanders | Air Raid Concepts | 4-2-5 Nickel |
| Cowboys | Coryell Vertical | 4-3 Single High |
| Dolphins | TBD | TBD |
| Eagles | RPO Heavy Spread | Fangio Two-High |
| Falcons | Wide Zone | 3-4 Aggressive |
| Giants | Spread Concepts | 3-4 Pressure |
| Jaguars | West Coast Balanced | 3-4 Pressure |
| Jets | Shanahan Wide Zone | Multiple Front |
| Lions | Power Gap Scheme | 4-3 Attacking |
| Packers | LaFleur Zone Concepts | 4-3 Swarming |
| Panthers | West Coast Zone | 3-4 Base |
| Patriots | West Coast Power | Hybrid Multiple |
| Raiders | Vertical Spread | 4-3 Cover 1 |
| Rams | McVay Outside Zone | 3-4 Light Box |
| Ravens | Power RPO | Disguised 3-4 |
| Saints | West Coast Timing | 4-3 Under |
| Seahawks | Macdonald Hybrid | 3-4 Ravens Style |
| Steelers | Play-Action Power | 3-4 Traditional |
| Texans | Shanahan Concepts | 4-3 Attacking Front |
| Titans | Play-Action Vertical | 3-4 Multiple |
| Vikings | McVay Wide Zone | 3-4 Exotic Pressures |

### Data Files

| File | Purpose |
|------|---------|
| `data/schemes/scheme_skill_weights.json` | Skill importance weights by offensive/defensive scheme |
| `data/teams/team_schemes.json` | Team scheme assignments |
| `data/prospects/current/2026_prospects.json` | Prospect data with `developmentCertainty` field |

### Testing / Debug Mode

A hidden "Show AI Boards" toggle can display each team's hidden rankings for testing purposes. This should not affect production UI.

---

## Culture System

**Approved: January 24, 2026**

Culture in GM Ops is primarily driven by the **head coach**. The GM's main lever for culture is hiring the right coach, though ongoing decisions can build or erode it.

### Culture Factors (Total = 100)

| Factor | Weight | Description | Primary Drivers |
|--------|--------|-------------|-----------------|
| **Leadership** | 30 | Locker room authority and direction | Coach's leadership skill, veteran presence on roster |
| **Trust** | 25 | Belief that organization keeps its word | Consistent decision-making, keeping promises |
| **Chemistry** | 20 | How well personalities mesh | Roster stability, compatible player personalities |
| **Morale** | 15 | Current emotional state of the team | Recent win/loss performance |
| **Stability** | 10 | Organizational continuity | Coaching and front office tenure |

### How Culture Changes

**Positive Events:**
- Hiring a coach with high leadership skill → Leadership boost
- Winning streak → Morale rises
- Keeping same core players together → Chemistry improves
- Long coaching tenure → Stability maxes out
- Honoring player-friendly promises → Trust builds

**Negative Events:**
- Losing streak → Morale drops
- Cutting a team captain → Trust drops significantly
- High roster turnover → Chemistry suffers
- Firing coaches frequently → Stability tanks
- Breaking trust (bad trades, letting favorites walk) → Trust erodes

### Honeymoon Effect

New head coach hires start with elevated culture scores (benefit of the doubt), which then adjust based on actual performance. "When somebody gets hired new, the culture's good and that's all they talk about. But then once they start losing, the culture's out the door."

### Culture Impact on Gameplay

*(To be determined - potential effects:)*
- Player performance bonuses/penalties
- Free agent attractiveness
- Willingness to take team-friendly deals
- Injury recovery speed
- Player development rates

---

## Development Workflow

### Planning Dialogue Process (Approved: Jan 24, 2026)

1. **Capture**: All planning dialogue (full context, not summaries) saved to `dev-planning-transcripts/` folder

2. **File structure**: New file per day, named like `2026-01-24_brief-summary.md`

3. **Numbering**: Format `[day].[topic].[subtopic]` for all discussions

4. **Approval flow**: 
   - Iterate on topics until user says "approve topic X"
   - Approved topics get committed to `DESIGN.md`
   - Skip `dev-guide.html` (requires styling work)

5. **Before coding**: DESIGN.md must be updated with approved topic before any implementation starts

---

## Implementation Status

### Draft Room UI (game-shell.html)

**Layout**: 2-column design
- Left: Draft Board (pick list with team needs, trade values)
- Right: Team Info panel + Available Prospects

**Team Info Panel** (collapsible):
- Tabs: Needs | Picks | Scheme | Depth
- Clicking any tab expands panel if collapsed
- No scrollbar - content expands fully

**Needs Tab**:
- Side-by-side Offensive/Defensive needs
- Position accordions with skill tags and scouting notes

**Picks Tab**:
- User's draft picks with round/pick numbers

**Scheme Tab**:
- Offensive scheme + Play Caller
- Defensive scheme + Play Caller
- Scheme Fit Traits summary

**Depth Tab** (implemented Jan 25, 2026):
- 2-deep roster display for all 32 teams
- 11 positions per side (offense/defense)
- Offense: QB, RB, WR×3, TE, LT, LG, C, RG, RT
- Defense (nickel): LDE, LDT, RDT, RDE, LB×2, LCB, RCB, NB, FS, SS
- Status flags: EXP (expiring contract), RET (retirement risk), INJ (long-term injury)
- Data source: NFLverse depth charts + contracts

**Data Files**:
- `data/teams/depth_charts_2026.json` - 32 teams with 2-deep rosters
- `data/raw/nflverse/depth_charts_2025.csv` - Source depth chart data
- `data/raw/nflverse/contracts.csv` - Contract expiration data
- `data/scripts/build_depth_charts.js` - Build script for depth chart JSON

---

## Session Log

### January 25, 2026

**Depth Chart Implementation**:
- Added Depth tab to Team Info panel
- Downloaded NFLverse depth charts and contract data
- Created build script to merge depth charts with expiring contract flags
- Implemented 11-position offense/defense structure (nickel defense)
- Styled depth chart with equal-height columns, alternating rows
- Added status flag legend (EXP, RET, INJ)

**UI Fixes**:
- Removed max-height constraint from Team Info panel (no scrollbars)
- Fixed collapse/expand toggle for Team Info panel
- Made tab clicks expand panel when collapsed
- Restored Scheme tab content (Play Callers, Scheme Fit Traits)

---
