# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is a comprehensive NFL franchise simulation game aiming to be "the best football GM sim and mock draft simulator." The project includes three tiers:
- **Free**: Draft mode only
- **Annual License**: Offseason mode (free agency, trades, cap management)
- **Full License**: Franchise mode (multi-season career)

## Project Structure
- `index.html` - Main menu with game mode selection
- `draft-setup.html` - Draft configuration (team selection, settings)
- `draft-room.html` - Legacy draft room (simpler UI)
- `game-shell.html` - **Primary draft UI** with 2-column layout (Draft Board | Team Info + Prospects), JSON data loading
- `shared/styles.css` - Shared brand-compliant styles
- `brand-guidelines.html` - Brand/style guidelines
- `DESIGN.md` - Game design documentation
- `dev-guide.html` - Developer guide
- `data/` - Data files and scripts
  - `data/prospects/current/2026_prospects.json` - 337 prospects with full schema
  - `data/draft/2026_draft_order.json` - 257 picks with trade values (NFLMDD source)
  - `data/teams/nflmdd_team_needs_2026.json` - Team needs by position
  - `data/schemes/scheme_skill_weights.json` - Skill importance weights by scheme (offense + defense)
  - `data/prospects/SCHEMA.md` - Documentation for prospect data structure
  - `data/raw/nflverse/` - Raw data from NFLverse (contracts, rosters, depth charts)
  - `data/teams/depth_charts_2026.json` - 2-deep roster for all 32 teams with expiring contract flags

## Brand Guidelines
- **Colors**: NFL Red (#D50A0A), NFL Blue (#013369), Silver (#A5ACAF)
- **Fonts**: Teko (headlines), Barlow Condensed (UI), Inter (body)
- **Logo**: Skewed block design with GM (red) + OPS (blue/white border)

## Running the Project
Python HTTP server on port 5000 (static site).

## Recent Changes
- Created main menu with 3 game mode cards (Draft, Offseason, Franchise)
- Added live activity ticker and draft countdown
- Established consistent GM Ops branding across all pages
- Wired draft-setup → draft-room navigation with localStorage data passing
- Built game-shell.html with collapsible sidebar, team needs panel, scheme tab
- Implemented gradient team logos using TEAM_DATA with team colors
- Added scheme-fit matching system: team needs show position skills (gold tags) + physical traits (silver tags)
- Synced DESIGN.md from GitHub with full skill definitions per position
- **Jan 2026**: 3-column draft layout (Draft Order | Big Board | Team Panel)
- **Jan 2026**: Created `data/prospects/2026_prospects.json` with 337 prospects (originally 338; Dante Moore removed Feb 2026)
- **Jan 2026**: Draft room now loads all data from JSON files (prospects, draft order, team needs)
- **Jan 2026**: "More Info" button on player cards opens scouting report modal with rankings & comparisons
- **Jan 2026**: Filled-need indicators track when user drafts at need positions
- **Jan 2026**: Draft pick list shows trade values and traded picks (via team)
- **Jan 2026**: 257 picks with NFLMDD trade values, Bears at #25
- **Jan 24**: game-shell.html now loads 337 prospects from JSON with college colors, position filters, watchlist
- **Jan 24**: Accordion expansion for prospect details (replaced modal popup)
- **Jan 24**: Consensus range uses descriptive labels (Top 10, Late 1st, etc.) in Range stat card
- **Jan 24**: Draft Board shows ALL 257 picks with team needs as placeholders (PFF-style)
- **Jan 24**: Team needs drop off as positions are filled during draft
- **Jan 24**: Trade values displayed subtly under pick numbers
- **Jan 24**: Round buttons scroll to round start; auto-highlight on scroll
- **Jan 24**: 3-column layout ratio adjusted: Draft Board (2fr) | Prospects (3fr) | Team Info (240-280px)
- **Jan 24**: User team panel moved to header area (shows team logo, name, pick status)
- **Jan 24**: Select button appears on prospect rows when user is on the clock
- **Jan 24**: Player selection functionality - draft a player and update draft board/needs
- **Jan 24**: Sim to Pick - auto-draft AI picks until user's next pick
- **Jan 24**: Trade Center - modal to propose trades with value-based fairness check
- **Jan 24**: Position-to-need mapping for accurate needs tracking (OG->IOL, DE->EDGE, etc.)
- **Jan 24**: Sim controls with speed settings (Instant/Fast/Normal/Slow), target pick input, and stop button
- **Jan 25**: Created scheme skill weights JSON (`data/schemes/scheme_skill_weights.json`) with 7 offensive and 6 defensive schemes
- **Jan 25**: Added `developmentCertainty` field to all 337 prospects (Sure Fire, High Floor, Standard, Developmental, Project)
- **Jan 25**: Documented full AI Draft Logic System in DESIGN.md (board generation, variance tiers, scheme fit, trade triggers)
- **Jan 25**: Restructured to 2-column layout: Draft Board (left) | Team Info + Prospects (right)
- **Jan 25**: Added panel titles to Draft Board and Team Info matching Available Prospects styling
- **Jan 25**: Removed "Load More" button - all 337 prospects load initially with scrollable list
- **Jan 25**: Fixed prospect visibility bug (removed overflow:hidden from prospect-card)
- **Jan 25**: Added Depth tab to Team Info with 2-deep roster by position
- **Jan 25**: Downloaded NFLverse depth charts data (`data/raw/nflverse/depth_charts_2025.csv`)
- **Jan 25**: Created `data/teams/depth_charts_2026.json` with expiring contract indicators
- **Jan 25**: Depth tab shows 11 positions per side (offense: QB, RB, WR×3, TE, LT, LG, C, RG, RT; defense nickel: LDE, LDT, RDT, RDE, LB×2, LCB, RCB, NB, FS, SS)
- **Jan 25**: Expiring contracts shown with EXP superscript flag
- **Jan 25**: Depth chart legend with status flags (EXP, RET, INJ)
- **Jan 25**: Team Info panel collapse/expand fixed (no scrollbars, tabs expand panel)
- **Jan 25**: Restored Scheme tab content (Play Callers, Scheme Fit Traits)

- **Feb 7**: Comprehensive 2026 coaching staff update across all 32 teams
  - 10 new head coaches: Raiders (Klint Kubiak), Cardinals (Mike LaFleur), Giants (John Harbaugh), Browns (Todd Monken), Dolphins (Jeff Hafley), Titans (Robert Saleh), Ravens (Jesse Minter), Falcons (Kevin Stefanski), Bills (Joe Brady), Steelers (Mike McCarthy)
  - 20+ coordinator changes: Jets (Frank Reich OC, Glenn calls D), Commanders (David Blough OC, Daronte Jones DC), Chargers (Mike McDaniel OC, Chris O'Leary DC), Lions (Drew Petzing OC), Packers (Jonathan Gannon DC), Eagles (Sean Mannion OC), 49ers (Raheem Morris DC), Chiefs (Eric Bieniemy OC), Rams (Kliff Kingsbury OC), Buccaneers (Zac Robinson OC), Cowboys (Christian Parker DC), Bears (Doyle left for Ravens)
  - Updated `draft-setup.html` (all 32 teams OC/DC/scheme), `team_schemes.json`, `scheme_skill_weights.json` (75+ scheme aliases)
  - Scheme alias system maps team-specific scheme names → canonical categories for skill weights
  - TBD schemes for teams with incomplete coaching hires (Raiders DC, Cardinals DC)
- **Feb 7**: Prospect data corrections
  - Removed Dante Moore (QB, Oregon) — returned to school Jan 15, 2026; not in 2026 draft class
  - Fernando Mendoza (QB, Indiana) updated to consensus #1 overall (Heisman winner, led Indiana to natl championship)
  - 337 prospects total (was 338)
  - AI draft board variance now uses per-session random seed for unique drafts each playthrough

## Future Work
- **AI Draft Logic Implementation**: Implement the documented draft board generation and pick selection in game-shell.html
- **Trade Triggers**: AI trade-up logic when high-value prospect falls (design documented in DESIGN.md)
- **Trade System**: Trade ticker, incoming calls, CPU-to-CPU trades, trade value chart
- **Full Styling Pass**: Refactor draft-setup body content to use brand tokens
- **Draft Results Page**: Grades, recap, export functionality
- **Team Selection**: Let user pick any team (currently hardcoded to Bears)
- **Draft Timer**: Add clock/timer for user picks

## Prospect Data Schema
See `data/prospects/SCHEMA.md` for full documentation. Key fields:
- Bio (height, weight, age, arm length, hand size)
- Rankings (consensus, PFF, ESPN, NFL)
- Grades (PFF overall + position-specific)
- Combine metrics
- Skills (0-100 ratings per position)
- Traits, archetype, projection, scouting report, comparison

## User Preferences
- Use numbered lists when asking questions
- Build UI framework first before features
- Premium, cohesive design (not "patched together ERP")
- No cross-navigation between modes (stay in Draft when in Draft, etc.)
- **Slow down** - don't jump ahead before topics are concluded
- **Vet features** before implementing - present options first
- Update DESIGN.md before coding

## Dev Feedback Tool
Standalone local tool for recording planning dialogue. Runs on Mac, independent of Replit.

**Location**: `dev-feedback-tool/` (also on GitHub)

**Features**:
- Audio recording with OpenAI Whisper transcription
- Two topic types: Game Dev (default) and Technical
- Auto-detects technical keywords and prompts to switch folders
- Saves to GitHub: `dev-planning-transcripts/` or `dev-technical-transcripts/`
- Topic numbering: `1.1, 1.2...` (game) or `T1.1, T1.2...` (technical)

**Running locally**:
```bash
cd dev-feedback-tool
OPENAI_API_KEY=xxx GITHUB_TOKEN=xxx node server.js
# Open http://localhost:5000/dev-feedback.html
```

**Vercel Deployment**: gm-ops.vercel.app

**Features**:
- AI-generated titles (required before saving - retries 3x)
- Move topics between Game/Technical categories
- Notification to Replit when transcripts are saved (requires REPLIT_NOTIFY_URL env var)

**Replit Integration**:
- `/api/all-transcripts` - View all transcripts from GitHub
- `/api/transcript-notification` - Receives notifications when new topics are saved

**Day 1 Topics Logged** (Jan 24, 2026):
- 1.1-1.12+: Game features (prospect loading, draft board, trade center, sim-to-pick, culture system, etc.)
- T1.1-T1.2: Technical (planning workflow, standalone tool setup)
