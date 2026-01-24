# GM Ops - Technical Design Document

> **Last Updated:** January 22, 2026  
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
7. [Front Office System](#front-office-system)
8. [Owner System](#owner-system)
9. [Free Agency System](#free-agency-system)
10. [Trade System](#trade-system)
11. [Draft System](#draft-system)
12. [Offseason Structure](#offseason-structure)
13. [Career Progression](#career-progression)
14. [UI Sliders & Configurable Settings](#ui-sliders--configurable-settings)
15. [Implementation Status](#implementation-status)
16. [Current Data Models](#current-data-models)
17. [Session Log](#session-log)

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
