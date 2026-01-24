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
- `game-shell.html` - **Primary draft UI** with 3-column layout, JSON data loading
- `shared/styles.css` - Shared brand-compliant styles
- `brand-guidelines.html` - Brand/style guidelines
- `DESIGN.md` - Game design documentation
- `dev-guide.html` - Developer guide
- `data/` - Data files and scripts
  - `data/prospects/current/2026_prospects.json` - 338 prospects with full schema
  - `data/draft/2026_draft_order.json` - 257 picks with trade values (NFLMDD source)
  - `data/teams/nflmdd_team_needs_2026.json` - Team needs by position
  - `data/prospects/SCHEMA.md` - Documentation for prospect data structure
  - `data/raw/nflverse/` - Raw data from NFLverse

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
- **Jan 2026**: Created `data/prospects/2026_prospects.json` with 338 prospects
- **Jan 2026**: Draft room now loads all data from JSON files (prospects, draft order, team needs)
- **Jan 2026**: "More Info" button on player cards opens scouting report modal with rankings & comparisons
- **Jan 2026**: Filled-need indicators track when user drafts at need positions
- **Jan 2026**: Draft pick list shows trade values and traded picks (via team)
- **Jan 2026**: 257 picks with NFLMDD trade values, Bears at #25
- **Jan 24**: game-shell.html now loads 338 prospects from JSON with college colors, position filters, watchlist
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

## Future Work
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

## Pending: GitHub Integration
- User wants dev-feedback tool pushed to GitHub so other AI engines can access transcripts
- GitHub connector authorization codes are delayed/not arriving
- Revisit when authorization flow works
