# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is a comprehensive NFL franchise simulation game aiming to be "the best football GM sim and mock draft simulator." The project includes three tiers:
- **Free**: Draft mode only
- **Annual License**: Offseason mode (free agency, trades, cap management)
- **Full License**: Franchise mode (multi-season career)

## Project Structure
- `index.html` - Main menu with game mode selection
- `draft-setup.html` - Draft configuration (team selection, settings)
- `draft-room.html` - Draft room interface (original)
- `game-shell.html` - New unified game shell with 3-column layout
- `shared/styles.css` - Shared brand-compliant styles
- `brand-guidelines.html` - Brand/style guidelines
- `DESIGN.md` - Game design documentation
- `dev-guide.html` - Developer guide
- `data/` - Data files and scripts
  - `data/prospects/2026_prospects.json` - Prospect database with full schema
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
- **Jan 2026**: Collapsible need cards with expand/collapse toggle
- **Jan 2026**: Age display with months (e.g., "21 yr | 8 mo")
- **Jan 2026**: Created `data/prospects/2026_prospects.json` with extensible schema for all prospect data

## Future Work
- **Prospect Data Import**: Populate 100+ prospects from PFF/consensus sources into JSON
- **Draft Order with Selections**: Show drafted players in left panel
- **Trade System**: Trade ticker, incoming calls, CPU-to-CPU trades, trade value chart
- **Prospect Scouting Modal**: Click prospect → full report with scheme fit score
- **Full Styling Pass**: Refactor draft-setup and draft-room body content to use brand tokens
- **Draft Results Page**: Grades, recap, export functionality

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
