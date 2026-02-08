# GM Ops - Technical Design Document

> **Last Updated:** February 8, 2026  
> **Purpose:** Single source of truth for all game systems, mechanics, and technical decisions.  
> **Update Policy:** This document must be updated whenever design decisions are made in Claude chats.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Control Level System](#control-level-system)
3. [Universal Game Shell Layout](#universal-game-shell-layout)
4. [Player Rating System](#player-rating-system)
5. [Position Flexibility System](#position-flexibility-system)
6. [Scheme System](#scheme-system)
7. [Combine & Pro Day System](#combine--pro-day-system)
8. [Coaching Staff System](#coaching-staff-system)
9. [Front Office System](#front-office-system)
10. [Owner System](#owner-system)
11. [Free Agency System](#free-agency-system)
12. [Trade System](#trade-system)
13. [AI Draft Logic System](#ai-draft-logic-system)
14. [Offseason Structure](#offseason-structure)
15. [Career Progression](#career-progression)
16. [UI Sliders & Configurable Settings](#ui-sliders--configurable-settings)
17. [Culture System](#culture-system)
18. [Implementation Status](#implementation-status)
19. [Current Data Models](#current-data-models)
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

## Universal Game Shell Layout

**Designed: February 2026**

### Design Principle

GM Ops is a roster construction game. The depth chart is the heartbeat of the experience — it should always be accessible regardless of what phase the user is in. Every screen in the game follows the same two-panel layout: phase-specific content on the left, a persistent Management Panel on the right.

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│  GM OPS  ●  [CURRENT PHASE]                          [User Profile]     │
│  [Phase Progress Bar - offseason/franchise only]                        │
├─────────────────────────────────┬────────────────────────────────────────┤
│                                 │  MANAGEMENT PANEL                     │
│                                 │  [Offense] [Defense] [ST] [Tools]     │
│   PHASE CONTENT                 │                                       │
│                                 │  (Tab content here - depth chart      │
│   Content changes based on      │   when O/D/ST selected, tools menu    │
│   the active game phase:        │   when Tools selected)                │
│                                 │                                       │
│   • Franchise Tag explanation   │                                       │
│   • Free agent market           │                                       │
│   • Draft board                 │                                       │
│   • Game planning               │                                       │
│   • Training camp               │                                       │
│                                 │                                       │
└─────────────────────────────────┴────────────────────────────────────────┘
```

### Elastic Panel Width

The Management Panel has three width states. It expands and contracts based on what the user is doing:

| State | Panel Width | Phase Content | When Used |
|-------|-------------|---------------|-----------|
| **Default** | ~45% | Visible (~55%) | Browsing depth chart, reviewing roster |
| **Expanded** | ~60-65% | Compressed but visible | Viewing deeper depth chart backups (columns 3-4+) |
| **Full-Screen** | 100% | Hidden | Trade Center, Free Agent market, detailed Cap tables |

Full-screen tools display a clear "Close" or "Back" button that returns the panel to its default width and restores the phase content on the left.

### Management Panel Tabs

Four tabs across the top of the Management Panel:

| Tab | Content |
|-----|---------|
| **Offense** | Offensive depth chart (QB, RB, WR×3, TE, LT, LG, C, RG, RT) |
| **Defense** | Defensive depth chart in nickel base (LDE, LDT, RDT, RDE, LB×2, LCB, RCB, NB, FS, SS) |
| **ST** | Special teams depth chart (K, P, KR, PR, LS) |
| **Tools** | Vertical hierarchical menu of management tools |

Tabs are mutually exclusive — only one tab's content is visible at a time. When "Tools" is active, the depth chart is not visible. When "Offense" is active, the Tools menu is not visible.

### Tools Menu

The Tools tab displays a vertical hierarchical menu listing available management options. Menu items vary by phase/mode but the core set includes:

| Tool | Description | Panel Width |
|------|-------------|-------------|
| **Transactions** | Trade center for proposing and evaluating trades | Full-screen |
| **Free Agents** | Browse and sign available free agents (when applicable) | Full-screen |
| **Cap Management** | Salary cap breakdown, restructure options, dead money | Expanded or full-screen |
| **Stats** | Team and player statistics for the current season/phase | Expanded |
| **Team Needs** | Positional needs with archetypes and context | Default |
| **League Activity** | Recent league-wide transactions and news | Default |
| **Draft Picks** | View owned draft picks and trade value (when applicable) | Default |
| **Settings** | Game speed, control level, audio preferences | Default (modal) |

### Phase Content (Left Side)

The left panel content swaps entirely based on the active game phase. It provides context, instructions, and phase-specific interfaces:

| Phase | Left Panel Content |
|-------|-------------------|
| **Franchise Tags** | Explanation of franchise vs transition tags, list of eligible expiring-contract players to consider |
| **Contract Decisions** | Expiring contracts overview, extend/release/walk interface |
| **Free Agency** | FA market overview (detailed browsing moves to full-screen via Tools) |
| **Pre-Draft** | Offseason recap summary, trade exploration prompt |
| **NFL Draft** | Draft board with pick list, team needs, prospect rankings |
| **UDFA Signing** | Available undrafted free agents |
| **Roster Finalization** | Roster cut-down interface |
| **Regular Season** | Game schedule, matchup preview, weekly recap |
| **Training Camp** | Camp battles, roster bubble, preseason results |

### Mobile Behavior

On screens narrower than 768px, the two-panel layout collapses to a single column. The Management Panel becomes a slide-out drawer accessible via a persistent tab/button at the bottom or side of the screen. Player pills are designed to work in both wide (desktop) and narrow (drawer) contexts.

---

### Depth Chart Component

The depth chart is the primary view within the Offense, Defense, and ST tabs of the Management Panel.

#### Position Rows (Shelves)

Each starting position gets a horizontal row/shelf. The position label appears once on the left side of the row. All players in that row are implied to play that position — no position label is repeated on individual player cards.

**Offense positions (11):** QB, RB, WR1, WR2, WR3, TE, LT, LG, C, RG, RT
**Defense positions (11, nickel):** LDE, LDT, RDT, RDE, LB1, LB2, LCB, RCB, NB, FS, SS
**Special Teams (5):** K, P, KR, PR, LS

#### Depth Display

- **Default view:** 2-deep per position (starter + first backup visible)
- **Expandable:** A "show more" indicator (arrow or `+N`) at the end of a row reveals additional backups to the right when clicked
- When additional depth is revealed, the Management Panel may widen to Expanded state (~60-65%) to accommodate

#### Player Pills

Each player is displayed as a compact, rounded-rectangle card ("pill") within their position row.

**Default pill content (always visible):**

```
┌─────────────────────────────────────────────┐
│  Player Name   │ Stat1 │ Stat2 │ ⓘ  │ ⋮   │
│                │       │       │    │     │
│  [subtle status indicator bar at bottom]    │
└─────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Player Name** | Full name, truncated if needed |
| **Stat 1** | Primary phase-contextual stat (see table below) |
| **Stat 2** | Secondary phase-contextual stat (see table below) |
| **ⓘ (Tooltip icon)** | Opens detailed player popup with full info |
| **⋮ (Action menu)** | Opens contextual action dropdown |
| **Status indicator** | Subtle colored bar or accent at the bottom edge of the pill (not the entire pill) |

#### Phase-Contextual Stats on Pills

The two stat slots on each player pill change based on the current game phase:

| Phase | Stat 1 | Stat 2 |
|-------|--------|--------|
| **Offseason (Tags, Contracts, FA)** | PFF Grade | Cap Hit / APY |
| **Pre-Draft** | PFF Grade | Contract Status (expiring, years left) |
| **NFL Draft** | PFF Grade | Cap Hit |
| **Regular Season** | Last Game Key Stat (yards, TDs, tackles, etc.) | Injury Status |
| **Training Camp** | Camp Performance Grade | Roster Bubble indicator |
| **Franchise Mode (system grades)** | System-Generated Grade | Cap Hit |

#### Tooltip Popup (ⓘ)

Clicking the tooltip icon opens a detailed popup overlay for that player. Contains information not shown on the pill:

- Age, height, weight
- Full contract breakdown (years, total value, guaranteed, cap hits by year)
- Career stats summary
- Injury history
- PFF grades breakdown (if available)
- Scheme fit assessment
- Trade value
- Development trajectory (franchise mode)

#### Action Menu (⋮)

Clicking the action menu icon opens a contextual dropdown of available actions for that player. Actions vary by phase:

| Action | Available During | Description |
|--------|-----------------|-------------|
| **Trade** | All phases (except active draft pick) | Opens trade center with this player pre-loaded |
| **Extend** | Offseason contract phases | Offer a contract extension |
| **Restructure** | All phases | Convert salary to signing bonus to create cap space |
| **Release** | All phases | Cut the player (with dead cap implications) |
| **Apply Franchise Tag** | Phase 1 (Franchise Tags) only | Tag this player with the franchise tag |
| **Apply Transition Tag** | Phase 1 (Franchise Tags) only | Tag this player with the transition tag |
| **View Full Stats** | All phases | Opens detailed stats view |
| **Move on Depth Chart** | All phases | Promote/demote within the position shelf |

Only contextually relevant actions appear — for example, "Apply Franchise Tag" only shows on expiring-contract players during the Franchise Tag phase.

#### Drag-and-Drop Depth Chart System

The depth chart uses a custom drag-and-drop system (no library) for reordering players within and across position rows. This is a core interactive feature — the spec below should be sufficient to rebuild it from scratch.

##### Layout Structure

- **Two-column layout**: Left column is `.labels-col` (44px wide, position abbreviations like QB, RB, WR). Right column is `.pills-area` (scrollable horizontally).
- **Pills grid**: `.pills-grid` is a flex-column container set to `min-width: calc(300%)` of the pills-area, creating 6 equal-width columns for depth slots (1ST STRING through 6TH STRING).
- **Column headers**: A `.column-headers` row at the top with 6 `flex: 1` spans showing "1ST STRING", "2ND STRING", etc.
- **Position rows**: Each `.pill-row` is a flex row with `gap: 8px` containing exactly 6 `.pos-pill` elements (filled or `.empty-slot`).
- **Labels alignment**: `.labels-col` has `padding: 34px 0 12px 0` to vertically align position labels with pill rows below the header row. Both use `gap: 10px` to stay in sync.
- **Horizontal scroll**: Only ~2 columns visible at default panel width. User scrolls to see deeper depth. When panel is fully expanded (`expand-right` state), `pills-grid` resets to `min-width: 0; width: 100%` and all 6 columns are visible.

##### Pill Elements

- **Filled pill**: Has `dataset.pos` (position) and `dataset.player` (name). Contains a `.pill-name` span. First pill in row gets `.starter` class (red left border via `border-left: 2px solid var(--accent-red)`).
- **Empty pill**: `.pos-pill.empty-slot` — dashed border, no player data, `cursor: default`, not draggable.
- **Pill styling**: `flex: 1`, dark background `rgba(0,0,0,0.15)`, rounded `border-radius: 6px`, `cursor: grab`, `font-family: 'Barlow Condensed'`, `font-size: 13px` for name text. Hover lifts pill slightly (`translateY(-1px)`) with shadow.

##### Tab Isolation

Each tab (Offense, Defense, Special Teams) is built independently via `buildTab()`. Drag context is scoped to one tab — you cannot drag between tabs. Each tab's `initDragDrop()` captures its own `rows` and `labels` NodeLists.

##### Drag Lifecycle

1. **mousedown/touchstart** on a filled pill → `startDrag(pill, x, y)`
2. **startDrag**: Records `fromRow`, `fromIndex`, creates a floating clone (`.drag-clone`), marks original as `.drag-source` (faded to 0.25 opacity, scaled to 0.95). Calculates compatible positions via `getCompatiblePositions()`. Marks ineligible rows/labels with `.drop-ineligible` (opacity 0.3).
3. **mousemove/touchmove** → `handleMove(x, y)`: Moves clone to cursor. Hit-tests against compatible rows. Determines `hoverIndex` by checking if cursor X is left of each pill's midpoint. Calls `showPreview()` when hover target changes.
4. **mouseup/touchend** → `finishDrag()`: Removes clone, clears all preview/eligibility classes, performs the actual DOM rearrangement if a valid drop target exists.

##### Position Compatibility Rules (`POSITION_COMPAT`)

Determines which rows a player can be dragged to. The dragged pill's original position is always compatible with itself. Additional compatibility:

| Position | Can Move To | Rationale |
|----------|-------------|-----------|
| QB | (none) | QBs stay at QB |
| RB | WR | Versatile backs can play receiver |
| WR | RB | Reverse flex |
| TE | WR | Move TE flex |
| LT, LG, C, RG, RT | All other OL | Any OL can play any OL position |
| DT | EDGE | Interior linemen can rush outside |
| EDGE | DT, LB | Edge can move inside or drop back |
| LB | EDGE, SS, FS | Linebackers can rush or play safety |
| CB | NCB, SS, FS | Any DB can play any DB position |
| NCB | CB, SS, FS | Any DB can play any DB position |
| SS | FS, CB, NCB, LB | Safeties can play any DB or LB |
| FS | SS, CB, NCB, LB | Safeties can play any DB or LB |
| K, P | (none) | Specialists stay put |

##### Visual Feedback During Drag

- **Ineligible rows fade**: Rows and labels where the player cannot be dropped get `.drop-ineligible` (opacity 0.3). Eligible rows remain full opacity. This is an inverted approach — highlight by dimming what's invalid rather than highlighting what's valid.
- **Floating clone**: `.drag-clone` follows cursor with `position: fixed`, `z-index: 1000`, slightly enlarged (`scale(1.05)`), green border (`rgba(74, 222, 128, 0.5)`), heavy shadow. `pointer-events: none` so it doesn't interfere with hit detection.
- **Source pill ghost**: Original pill stays in place but faded (`.drag-source`: opacity 0.25, scale 0.95).
- **Hover target highlight**: The pill slot under the cursor gets `.insert-target` — subtle green background (`rgba(74, 222, 128, 0.12)`), green border (`rgba(74, 222, 128, 0.35)`), and inner glow. Applied to ALL slots (filled or empty).
- **Shift preview (same-row)**: When hovering at a new position within the same row, pills between the source and target positions get `translateX(±shift)` transforms to slide toward their new positions. Shift amount = `pillWidth + gap(8px)`. Direction depends on whether dragging left or right. Uses `effectiveInsert` (accounts for off-by-one when dragging rightward: `if (fromIndex < hoverIndex) effectiveInsert--`).
- **Shift preview (cross-row)**: Source row pills after the dragged pill shift left (closing the gap). Target row pills after the insertion point shift right (making room). The insert-target pill itself does NOT shift — it stays in place as the landing zone indicator.
- **Transitions**: All pills have `transition: transform 0.15s ease` (via `transition: all 0.2s ease` on `.pos-pill`), so shift previews animate smoothly.

##### Drop Behavior (Insert, Not Swap)

On drop, the system uses **insert** behavior, not swap:

1. **Same-row**: Remove pill from original index. Calculate `targetIndex` (with off-by-one correction: `if (fromIndex < targetIndex) targetIndex--`). Extract all filled pills, splice dragged pill into `targetIndex`, rebuild row with filled pills followed by empty slots up to `DEPTH_SLOTS` (6).
2. **Cross-row**: Remove pill from source row, `rebuildRow(sourceRow)` to compact it. Update pill's `dataset.pos` to the target row's position. Insert pill into target row at the target index using the same splice-and-rebuild logic. Apply `.cross-move` class (green flash animation, 0.5s) for visual confirmation.
3. **Starter update**: After any drop, `updateDepthLabels()` recalculates which pill is index 0 (starter) and applies/removes the `.starter` class (red left border).

##### Key Helper Functions

- `getCompatiblePositions(pos)` → Returns a Set of all positions the given position can move to (including itself).
- `buildTab(tabEl, data)` → Creates the full depth chart DOM for one tab from data array of `{pos, players[]}` objects.
- `updateDepthLabels(row)` → Toggles `.starter` class on first filled pill in a row.
- `createEmptyPill(pos)` → Creates a new `.pos-pill.empty-slot` element.
- `rebuildRow(row)` → Compacts a row: moves all filled pills to the front, pads with empty slots to 6 total.
- `initDragDrop(tabEl)` → Sets up all drag event listeners scoped to one tab.

##### Constants

- `DEPTH_SLOTS = 6` — Maximum players per position row.
- `gap = 8` (px) — CSS gap between pills in a row, used in shift calculations.
- `depthLabels = ['1ST STRING', '2ND STRING', '3RD STRING', '4TH STRING', '5TH STRING', '6TH STRING']`

##### Known Behaviors & Edge Cases

- Hovering outside all rows clears preview (no target).
- `hoverIndex` can equal `pillEls.length` if cursor is past all pills — clamped to `pills.length - 1` for safety.
- Cross-row moves update the pill's `dataset.pos` to match the destination row.
- Same-row no-op: If `effectiveInsert === fromIndex`, no preview is shown (pill would return to its original spot).
- The pills-area scrollbar is hidden (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`).

##### Data Structure (Hardcoded in Prototype, Will Come from JSON)

Each tab receives an array of row objects. In production, this data will load from `data/teams/depth_charts_2026.json`:
```
[
  { pos: 'QB', players: ['Jacoby Brissett', 'Kedon Slovis'] },
  { pos: 'RB', players: ['Michael Carter', 'Emari Demercado'] },
  ...
]
```
Players array is ordered by depth (index 0 = starter). Empty slots are auto-generated up to DEPTH_SLOTS.

#### Subtle Status Indicators

Player pills use subtle visual cues — never full-pill coloring — to communicate status at a glance:

| Indicator | Visual Treatment | Meaning |
|-----------|-----------------|---------|
| **Expiring contract** | Thin amber/yellow bottom border | Contract expires after this season |
| **Injured** | Small red dot or thin red accent | Currently injured |
| **High performer** | Thin green bottom border | Top-tier PFF grade or system grade |
| **Rookie** | Small blue dot or thin blue accent | First-year player |
| **Franchise tagged** | Thin gold bottom border | Player has been franchise/transition tagged |
| **Roster bubble** | Thin orange dashed border | At risk of being cut (training camp) |

Only one indicator shows at a time, prioritized by urgency (injured > expiring > bubble > tagged > rookie > performer).

---

### Franchise & Transition Tags (Phase 1 — Enhanced Design)

#### Overview

Franchise and transition tags are tools NFL teams use to retain key players whose contracts are expiring. A team can use one franchise tag OR one transition tag per year (not both types on different players — one tag total, of either type). Tags are one-year contracts at a guaranteed salary based on top positional pay.

#### Why Teams Use Tags

**Franchise Tag:** Used when a team absolutely must keep a player. The high cost signals the player is elite. If another team signs the player to an offer sheet, the original team can match the offer or receive two first-round draft picks as compensation. This makes it extremely rare for a franchised player to actually leave.

**Transition Tag:** A budget-friendly alternative when a team wants the right to match any offer but can accept losing the player. The salary is lower (~12-20% cheaper) because there is no draft pick compensation if the player leaves. Teams use this when they value the player but aren't willing to pay franchise-tag money.

#### Tag Rules

| Rule | Detail |
|------|--------|
| **Limit** | One tag per team per year (franchise OR transition, not both) |
| **Eligibility** | Players with expiring contracts only; excludes rookies on rookie deals |
| **Franchise tag cost** | Higher of: (a) average of top 5 salaries at the position, or (b) 120% of the player's prior salary |
| **Transition tag cost** | Higher of: (a) average of top 10 salaries at the position, or (b) 120% of the player's prior salary |
| **Consecutive tags** | 2nd consecutive year: 120% of prior tag cost. 3rd year: 144% of prior year or the QB tag rate, whichever is higher |
| **Right of first refusal** | Both tags grant the original team the right to match any outside offer |
| **Compensation if player leaves** | Franchise: two 1st-round picks. Transition: nothing |
| **Negotiation window** | Tagged players can negotiate long-term extensions until mid-July; after that, they play on the one-year tag |

#### Tag Costs by Position (GM Ops Values)

| Position | Franchise Tag | Transition Tag |
|----------|--------------|----------------|
| QB | $40M | $35M |
| LB | $25M | $21M |
| DT/DL | $25M | $21M |
| WR | $24M | $21M |
| OL | $23M | $21M |
| EDGE/DE | $22M | $20M |
| CB | $20M | $18M |
| S | $19M | $15M |
| RB | $14M | $11M |
| TE | $12M | $10M |
| K/P | $6M | $5M |

#### Phase 1 UI (Updated for Universal Layout)

**Left panel (Phase Content):** Educational content explaining the difference between franchise and transition tags, how costs are calculated, and strategic guidance on when to use each. Below the explanation, a list of the user's expiring-contract players eligible for tagging, with their position, current APY, and projected tag costs for both tag types. This serves as a reference/recommendation list.

**Right panel (Management Panel):** The depth chart is visible in its default state. Expiring-contract players show the amber "expiring" status indicator on their pills. The user applies tags via the action menu (⋮) on individual player pills — selecting "Apply Franchise Tag" or "Apply Transition Tag" from the dropdown. Once a tag is applied, the pill's status indicator updates to gold (tagged) and the tag cost is reflected in the cap calculations.

**Advancing:** A "Confirm & Advance" button in the left panel locks in tag decisions and moves to Phase 2.

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
| OT-LT | OT-RT, OG, OC | Any OL can play any OL position |
| OT-RT | OT-LT, OG, OC | Any OL can play any OL position |
| OG | OT-LT, OT-RT, OC | Any OL can play any OL position |
| OC | OT-LT, OT-RT, OG | Any OL can play any OL position |

#### Defense

| From | Can Play | Notes |
|------|----------|-------|
| Edge | Off-Ball LB, IDL (4-3 DE to 3-4 DE) | Pass rushers can drop or move inside |
| IDL-NT | IDL-3T | Nose can play 3-tech in sub packages |
| IDL-3T | IDL-NT, Edge (in 3-4) | 3-tech can play nose or stand up |
| LB-MIKE | LB-WILL, LB-SAM | Off-ball LBs interchange |
| LB-WILL | LB-MIKE, S-SS, S-FS | Coverage LBs can play safety |
| LB-SAM | LB-MIKE, Edge, S-SS, S-FS | Strong-side LB can rush or play safety |
| CB-Outside | CB-Slot, S-FS, S-SS | Any DB can play any DB position |
| CB-Slot | CB-Outside, S-SS, S-FS | Any DB can play any DB position |
| S-FS | S-SS, CB-Outside, CB-Slot, LB | Any safety can play any DB or LB position |
| S-SS | S-FS, CB-Outside, CB-Slot, LB | Any safety can play any DB or LB position |

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

## Coaching Staff System

**Added: February 8, 2026**

### Overview

Each NFL team has a coaching staff of up to 12 key positions. In Draft and Offseason modes, staff is **display-only** (real NFL personnel). In Franchise mode (future), staff management becomes interactive with hiring, firing, and a coaching carousel as Phase 0 of the offseason.

### Coaching Positions

| Position | Role in Game | Impact |
|----------|-------------|--------|
| **Head Coach** | Sets team culture, scheme identity | Culture system, scheme weights |
| **Offensive Coordinator** | Calls offensive plays | Offensive scheme effectiveness |
| **Defensive Coordinator** | Calls defensive plays | Defensive scheme effectiveness |
| **Special Teams Coordinator** | Manages special teams | ST unit performance |
| **Quarterbacks Coach** | Develops QBs | QB development rate modifier |
| **Running Backs Coach** | Develops RBs | RB development rate modifier |
| **Wide Receivers Coach** | Develops WRs | WR development rate modifier |
| **Tight Ends Coach** | Develops TEs | TE development rate modifier |
| **Offensive Line Coach** | Develops OL | OL development rate modifier |
| **Defensive Line Coach** | Develops DL/EDGE | DL development rate modifier |
| **Linebackers Coach** | Develops LBs | LB development rate modifier |
| **Secondary Coach** | Develops CBs/Safeties | DB development rate modifier |

### Mode Behavior

| Mode | Staff Interaction |
|------|------------------|
| **Draft** | View-only in Tools panel |
| **Offseason** | View-only in Tools panel |
| **Franchise** | Full management — hire, fire, promote. Coaching carousel occurs as Phase 0 before Franchise Tags |

### Data Source

`data/teams/staff_database.json` — compiled from NFL.com, Wikipedia, ESPN, and team websites. Updated seasonally. Position coaches marked as null/TBD are genuinely unfilled (common in early offseason when new head coaches are still building staffs).

---

## Front Office System

**Added: February 8, 2026**

### Overview

Each team has a unique front office structure reflecting real NFL organizational hierarchies. Unlike coaching staff (which follows a standard template), front office roles vary by team — some have a President above the GM, some don't have a traditional GM title at all (e.g., Cowboys' Will McClay as VP of Player Personnel, Bengals' Duke Tobin as Director of Player Personnel, Patriots' Eliot Wolf as EVP of Player Personnel).

### Front Office Positions (6-7 per team, org-specific)

| Level | Examples | Notes |
|-------|----------|-------|
| **Owner** | Jerry Jones, Robert Kraft | Every team has one |
| **President** | Kevin Warren (CHI), Hymie Elhai (NYJ) | Not all teams have this role |
| **GM / Top Football Exec** | Ryan Poles, Brett Veach | Title varies by organization |
| **Assistant GM / VP Personnel** | Ray Agnew (DET), Alec Halaby (PHI) | Key decision-making support |
| **Director of Pro Scouting** | Evaluates current NFL players | Trade and FA intelligence |
| **Director of College Scouting** | Evaluates draft prospects | Draft board construction |

### Mode Behavior

| Mode | Front Office Interaction |
|------|------------------------|
| **Draft** | View-only in Tools panel |
| **Offseason** | View-only in Tools panel |
| **Franchise** | Full management — hire/fire GM, scouting directors. Scouting department affects prospect evaluation accuracy |

### Design Notes

- Front office structure is team-specific, not a one-size-fits-all template
- In Franchise mode, scouting department quality will affect how accurate prospect grades are (better scouts = more reliable ratings)
- GM hiring/firing affects draft philosophy and free agency strategy AI

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

### Trade-Up Triggers (Implemented Feb 7, 2026)

CPU teams evaluate trade-up opportunities before each pick using a **motivation score** system. This allows trades at all points in the draft, not just for large rank gaps.

#### Motivation Score Components

| Factor | Points | Description |
|--------|--------|-------------|
| **Board Gap** | gap × 0.6 | How much higher the prospect is on team's board vs their pick position (min gap: 8) |
| **Primary Need** | +15 | Prospect fills a primary team need |
| **Secondary Need** | +7 | Prospect fills a secondary need |
| **Position Premium** | +4 to +12 | QB (12 if top 10), EDGE/OT (6 if top 15), WR (4 if top 12) |
| **Risk of Loss** | +1 to +8 | Higher when fewer picks separate team from target (8 if ≤5 spots) |

**Trade threshold**: Motivation ≥ 28 triggers trade evaluation (calibrated Feb 8, 2026 to produce ~5-6 first-round trades matching real NFL data)

**Trade probability (CPU-CPU)**: `min(0.18, (motivation - 28) × 0.02 + 0.05)` — 6 teams evaluated per pick

**Trade probability (CPU-User)**: `min(0.15, (motivation - 28) × 0.018 + 0.04)` — 5 teams evaluated per pick

#### Trade Package Building

- Searches buyer's available picks for value-balanced packages (1-3 picks)
- Acceptable range: 85%-150% of target pick value (prefers minimal overpay)
- Teams must retain at least 1 pick after trading

#### Trade Types

| Type | Behavior |
|------|----------|
| **CPU-to-CPU** | Executes automatically, announced inline on draft board, brief pause on Normal/Slow |
| **CPU-to-User** | Always pauses the draft regardless of speed. User can Accept, Decline, or Counter |
| **User-Initiated** | User opens Trade Center modal, selects picks/players, proposes trade |

#### Player Trading (Added Feb 8, 2026)

The Trade Center supports trading rostered players alongside draft picks:
- Player trade values loaded from `data/teams/player_trade_values.json`
- Players displayed by position with trade value, organized in collapsible sections
- Player values included in trade balance calculations alongside pick values
- On trade execution, players are transferred between team rosters (spliced from source, pushed to destination)
- Both user-initiated and CPU trades can include players

#### Draft Board Announcements (Replaced Ticker Feb 8, 2026)

The ticker system was removed. Pick announcements now display inline on the draft board:
- Past picks show sentence-style: "The [Team] select **[POS] [Name]**"
- Trade indicators appear on the "Trade for" action button with animation
- Current pick is prominent with team branding
- Future picks show team needs subtly as placeholders

#### Speed-Based Trade Behavior

| Speed | CPU-CPU Trade Pause | CPU-User Offers |
|-------|-------------------|-----------------|
| Instant | No pause | Always pause |
| Fast | 400ms pause | Always pause |
| Normal | 1200ms pause | Always pause |
| Slow | 1200ms pause | Always pause |

#### CPU-to-User Trade Offers

When the user is on the clock, CPU teams may offer to trade up:
- Sim pauses and trade offer modal appears
- Shows what they send vs what you send, with values
- Explains their motivation (e.g., "addressing a key need at EDGE")
- **Accept**: Execute trade, pick changes hands
- **Decline**: Close modal, draft stays paused
- **Counter**: Opens full Trade Center pre-filled with that team
- **Resume Sim**: Available if sim was running when offer came in

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

## Offseason Structure

**Implemented: February 2026**

### Overview

The offseason is a phased progression system. Each phase represents a distinct period of NFL offseason activity. The user completes actions in each phase before advancing to the next. CPU teams process their decisions simultaneously.

### Phase System

Seven phases stored in a configurable `OFFSEASON_PHASES` array:

| # | Phase | Description |
|---|-------|-------------|
| 1 | **Franchise Tags** | Protect top expiring players |
| 2 | **Contract Decisions** | Extend, release, or let walk remaining expiring players |
| 3 | **Free Agency** | Sign available free agents, compete with CPU teams |
| 4 | **Pre-Draft** | Offseason recap, option to explore trades or enter draft |
| 5 | **NFL Draft** | 7-round draft (transitions to existing draft system) |
| 6 | **UDFA Signing** | Sign undrafted free agents (future) |
| 7 | **Roster Finalization** | Cut to 53, set depth chart (future) |

Phase order is configurable (not hardcoded) to support a future user setting to move Free Agency after the draft.

### Navigation & UI Architecture

- Offseason mode uses the same `game-shell.html` as Draft mode, detected via `?mode=offseason` query param
- A horizontal phase progress bar renders below the header, only visible in offseason mode
- Sidebar shows persistent tools (My Roster, Trade Center, Salary Cap, Team Needs, League Activity) instead of draft-specific items
- Main content area swaps between `draftContent` and `offseasonContent` divs based on mode
- No cross-navigation between modes (draft stays in draft, offseason stays in offseason)

### State Management

A global `offseasonState` object tracks all offseason data:

```javascript
offseasonState = {
  userTeam: "NYG",           // User's team abbreviation
  currentPhase: 0,           // Index into OFFSEASON_PHASES
  rosters: { ... },          // All 32 teams' rosters from player_trade_values.json
  capData: { ... },          // Cap space, dead money per team from cap_summary_2026.json
  franchiseTags: {           // Per-team tag decisions
    "NYG": { franchise: "PlayerName", transition: "PlayerName" },
    ...
  },
  contractDecisions: {       // Per-team contract actions
    "NYG": { "PlayerName": { action: "extend"|"release"|"walk" } },
    ...
  },
  freeAgents: [],            // Built after Phase 2, array of player objects
  faSignings: [],            // Completed FA signings { player, team, apy, years }
  faDay: 1,                  // Current FA day
  faOffers: [],              // Pending user offers
  faNoSigningDays: 0,        // Consecutive days with no signings (market settlement tracker)
  faMarketSettled: false,    // True when 3 consecutive no-signing days
  faFilter: "All"            // Position filter for FA market display
}
```

### Cap Calculation Chain

Cap calculations flow consistently across all phases with no double-counting:

1. **Base Cap** = `capData.capSpace` (from `cap_summary_2026.json`)
2. **After Tags** = Base - tag cost deltas (tag cost - player's existing APY for each tag applied)
3. **After Contracts** = After Tags + contract deltas:
   - Extend: costs 10% more than current APY (delta = -APY * 0.1)
   - Release: saves APY minus dead cap (delta = +APY - guaranteed * 0.5)
   - Walk: no cap impact (player was expiring anyway)
4. **After FA** = After Contracts - sum of all FA signing APYs

Each phase UI shows the running cap total reflecting all prior phase decisions.

### Phase 1: Franchise Tags

**Layout**: 2-column. Left: eligible player list. Right: cap summary with meter bar + league-wide tag decisions.

**Eligibility**: Expiring players on the roster, excluding rookies (players on rookie contracts).

**Tag Types & Costs**:

| Tag Type | Cost Formula | Limit |
|----------|-------------|-------|
| Franchise | max(120% of player's APY, position average from `FRANCHISE_TAG_COSTS`) | 1 per team |
| Transition | 80% of franchise tag cost | 1 per team |

Position-based franchise tag cost averages (`FRANCHISE_TAG_COSTS` constant):
- QB: $35M, WR: $22M, Edge: $21M, OT: $18M, CB: $18M, S: $15M, DT: $14M, LB: $13M, TE: $12M, RB: $10M, OG: $16M, C: $15M, K/P: $5M

**CPU Auto-Tag Logic**: CPU teams tag their highest trade-value expiring starters:
- Trade value > 200: Apply franchise tag
- Trade value > 150: Apply transition tag
- Process one franchise tag and one transition tag per team max

**User Actions**: Select "No Tag", "Franchise", or "Transition" per player via dropdown. Confirm to advance.

### Phase 2: Contract Decisions

**Layout**: Full-width table of expiring contracts, excluding players tagged in Phase 1.

**Actions Per Player**:

| Action | Effect | Cap Impact |
|--------|--------|-----------|
| **Let Walk** | Player enters FA pool | None (was expiring) |
| **Extend** | 2-year extension at 110% of current APY | Costs 10% more cap |
| **Release** | Cut with dead cap | Saves APY, costs 50% of guaranteed as dead cap |

Default action is "Let Walk" (no decision needed).

**Running Cap Total**: Updates live as user toggles decisions, showing projected cap space after all decisions.

**CPU Contract Logic**: CPU teams extend players with trade value > 300 (elite/starter tier). All others default to walk. This keeps star players while letting depth/bridge players hit the market.

**Advancing**: User confirms all decisions. Free agent pool is constructed. Phase advances.

### Phase 3: Free Agency

**Layout**: 2-column. Left: FA market with position filter tabs and player cards. Right: user's cap space, roster composition, pending offers, completed signings.

**FA Pool Construction** (built at end of Phase 2):
1. Iterate all 32 teams' rosters
2. Include players where `isExpiring === true`
3. Exclude players who were franchise/transition tagged in Phase 1
4. Exclude players whose contract decision was "extend" in Phase 2
5. Exclude players whose contract decision was "release" (they are cut, not free agents)
6. Only "walk" players (explicit or default) enter the FA pool
7. Sort by trade value descending
8. Each FA carries: name, position, age, APY (asking price), trade value, previous team

**User Offer System**:
- Inline offer forms per player card with years slider (1-5) and APY input
- Offers are pending until next day advancement
- Multiple pending offers allowed (cap permitting)

**Day-by-Day Simulation**:
1. User makes offers, then clicks "Advance Day"
2. CPU teams process FA decisions:
   - Each CPU team scans available FAs
   - 30% chance per player that matches a team need AND team has cap space
   - CPU offer = player's asking APY * random(0.9-1.1)
   - Higher trade value players get more competitive bids
3. User offers resolve (accepted if no higher CPU bid)
4. Track consecutive days with zero signings (`faNoSigningDays`)
5. Market settles after 3 consecutive no-signing days (auto-advance option)

**Market Settlement**: When `faNoSigningDays >= 3`, remaining FAs are considered unsigned. Phase advances.

### Phase 4: Pre-Draft

**Layout**: Centered summary card showing offseason recap.

**Summary Content**:
- Current cap space (after all phases)
- Number of FA signings made
- Number of players lost (walked from user's team)

**Two Actions**:
- "Explore Trades" - Opens trade center for pre-draft trades (future implementation)
- "Enter the Draft" - Transitions to Draft mode within the same shell

This is intentionally minimal since users have already scouted real prospects via the draft mode's prospect database.

### Phases 5-7 (Future)

- **Phase 5 - NFL Draft**: Transitions to existing draft system
- **Phase 6 - UDFA Signing**: Sign undrafted free agents post-draft
- **Phase 7 - Roster Finalization**: Cut roster to 53, finalize depth chart, practice squad

### Data Sources

| File | Purpose |
|------|---------|
| `data/teams/player_trade_values.json` | ~1150 rostered players with contracts, tiers, trade values |
| `data/teams/cap_summary_2026.json` | Per-team cap space, dead money, expiring contract counts |
| `scripts/build_player_trade_values.js` | Generates player trade values from NFLverse data |
| `scripts/build_cap_summary.js` | Generates cap summary from NFLverse contracts |

### CSS Architecture

Offseason-specific styles use the `.os-*` prefix (50+ classes) to avoid conflicts with draft mode styles. Key class families:
- `.os-table-*` - Tables for contract decisions, tag lists
- `.os-badge-*` - Tier badges, position pills, status indicators
- `.os-cap-*` - Cap meter bars, cap summary displays
- `.os-fa-*` - Free agent cards, offer forms, market display
- `.os-phase-*` - Phase progress bar, phase headers

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

### Offseason Mode (game-shell.html)

**Implemented: February 2026**

**Mode Detection**: URL query param `?mode=offseason` triggers offseason UI. Default is draft mode.

**Phase Progress Bar**: Horizontal bar below header showing all 7 phases. Current phase highlighted, completed phases marked. Only visible in offseason mode.

**Sidebar (Offseason)**:
- My Roster - View current roster
- Trade Center - Propose/evaluate trades
- Salary Cap - Cap space breakdown
- Team Needs - Current positional needs
- League Activity - Recent league transactions

**Phase 1 UI - Franchise Tags**:
- 2-column layout (eligible players | cap summary + league tags)
- Dropdown per player: No Tag / Franchise / Transition
- Cap meter bar showing projected impact
- League-wide tag decisions from CPU teams displayed on right

**Phase 2 UI - Contract Decisions**:
- Full-width table with player name, position, age, APY, tier, guaranteed
- Three action buttons per row: Let Walk / Extend / Release
- Running cap total bar updates on every action change
- "Confirm Decisions" button to advance

**Phase 3 UI - Free Agency**:
- 2-column layout (FA market | user cap + signings)
- Position filter tabs across top of market column
- Player cards with inline offer forms (years slider 1-5, APY input)
- "Advance Day" button triggers CPU bidding round
- Completed signings list on right panel
- Market settlement notification after 3 quiet days

**Phase 4 UI - Pre-Draft**:
- Centered summary card showing offseason recap stats
- Two action buttons: "Explore Trades" / "Enter the Draft"

**Data Dependencies**:
- `data/teams/player_trade_values.json` - Roster data with trade values
- `data/teams/cap_summary_2026.json` - Cap space data
- Team name-to-abbreviation mapping via `TEAM_ABBR_MAP` constant

**localStorage Key**: `gmops_draft_settings` (shared with draft mode setup via `game-setup.html`)

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

### February 7, 2026

**Prospect Data Corrections**:
- Removed Dante Moore (QB, Oregon) — announced Jan 15, 2026 he's returning to school for 2026 season, targeting 2027 draft
- Fernando Mendoza (QB, Indiana) updated to consensus #1 overall — Heisman winner, led Indiana to national championship, unanimous top pick across PFF/CBS/Yahoo/FOX/Ringer mocks
- Weak QB class without Moore: only Mendoza is a clear 1st-round QB; Ty Simpson (Alabama) potential QB2
- 337 prospects total (was 338)

**AI Draft Board Variance Fix**:
- Previous implementation used deterministic seed (team+prospect name) producing identical boards every draft
- Added per-session random seed (`draftSessionSeed`) so each draft playthrough generates unique team boards
- Variance tiers and development certainty modifiers still apply per DESIGN.md spec

### February 8, 2026

**Offseason Mode Implementation**:
- Added mode detection to game-shell.html via `?mode=offseason` query param
- Built horizontal phase progress bar (7 phases) below header, offseason-only
- Created adaptive sidebar: persistent tools for offseason, draft-specific items for draft
- Implemented Phase 1 (Franchise Tags): eligible player list, tag cost calculations (120% APY or position average), CPU auto-tagging, cap meter
- Implemented Phase 2 (Contract Decisions): expiring contracts table, extend/release/walk actions, running cap total, CPU logic (extend elite/starters > 300 trade value)
- Implemented Phase 3 (Free Agency): FA market with position filters, inline offer forms, day-by-day CPU bidding (30% per need match), market settlement after 3 quiet days
- Implemented Phase 4 (Pre-Draft): summary screen with offseason recap, "Explore Trades" or "Enter the Draft" options
- Added 50+ offseason CSS classes with `.os-*` prefix to avoid draft mode conflicts
- Data loaded from `player_trade_values.json` and `cap_summary_2026.json`

**Bug Fixes**:
- Fixed localStorage key mismatch: game-setup saves to `gmops_draft_settings`, game-shell now reads from same key
- Fixed `previousTeamAbbr` bug in Pre-Draft phase: property was named `previousTeam` in FA pool construction but referenced as `previousTeamAbbr` in walked-player count
- Verified FA pool correctly excludes tagged and extended players, only includes "walk" decisions
- Confirmed draft mode completely unaffected by offseason additions

**Documentation**:
- Added comprehensive Offseason Structure section to DESIGN.md with phase system, state management, cap chain, CPU logic, FA pool rules
- Added Offseason Mode to Implementation Status section
- Updated replit.md with offseason phase details

### February 8, 2026 (cont.)

**Universal Game Shell Layout Design**:
- Designed two-panel universal layout: Phase Content (left, ~55%) + Management Panel (right, ~45%)
- Management Panel has 4 tabs: Offense, Defense, ST, Tools (mutually exclusive — standard tab behavior)
- Depth chart tabs show position rows with draggable player pills; Tools tab shows vertical hierarchical menu
- Elastic panel width system: Default (~45%), Expanded (~60-65%), Full-Screen (100%)
- Full-screen used for Trade Center, Free Agent market; hides phase content with "Close" to return
- Player pills show: Name, two phase-contextual stats, tooltip icon (ⓘ), action menu (⋮)
- Action menu items are phase-aware: Trade, Extend, Restructure, Release, Apply Franchise/Transition Tag, View Stats, Move on Depth Chart
- Subtle status indicators on pill bottom edge (amber=expiring, red=injured, green=high performer, blue=rookie, gold=tagged, orange dashed=roster bubble)
- Phase 1 (Franchise Tags) redesigned: left panel shows educational content + eligible players; tags applied via player pill action menus on depth chart
- Updated franchise/transition tag costs and rules based on 2025 NFL data
- Mobile: Management Panel becomes slide-out drawer on screens < 768px
- Documented in DESIGN.md as new "Universal Game Shell Layout" section with sub-sections for depth chart component, player pills, tools menu, and elastic panel

**ESPN Logo Integration**:
- Integrated ESPN CDN logos for all 32 NFL teams and 754 college programs across game-shell, game-setup, and draft-results pages
- Built `data/espn_college_ids.json` with 2,612 name variant entries for comprehensive college logo lookup
- All logos have graceful fallback (onerror hides image, shows gradient abbreviation box)
- NFL logos: `https://a.espncdn.com/i/teamlogos/nfl/500/{abbr}.png`
- College logos: `https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png`
