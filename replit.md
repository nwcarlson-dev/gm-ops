# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is an NFL franchise simulation game designed to be a leading football GM sim and mock draft simulator. It offers a free Draft mode, an Annual License for an Offseason mode (including free agency, trades, and cap management), and a Full License for a multi-season Franchise mode. The project aims to deliver a comprehensive and engaging experience for managing an NFL team with a focus on realism and strategic depth.

## User Preferences
- Use numbered lists when asking questions
- Build UI framework first before features
- Premium, cohesive design (not "patched together ERP")
- No cross-navigation between modes (stay in Draft when in Draft, etc.)
- Slow down - don't jump ahead before topics are concluded
- Vet features before implementing - present options first
- Update DESIGN.md before coding
- MANDATORY: Review all existing documentation and data BEFORE making any changes - never overwrite existing content without first understanding what's there and confirming it won't lose valuable context
- Do not touch sections the user didn't ask to change - scope changes strictly to what was requested
- MANDATORY: When issues or unwanted results occur, fix the root cause — the logic or workflow that produced the problem — not the symptom. No one-off patches. Always treat the cause, not the symptom.
- MANDATORY: All screens and components must be mobile-friendly. Use responsive CSS with breakpoints for tablet (768px) and phone (480px). Layouts should collapse to single-column, text/elements should scale down, and touch targets should be appropriately sized. Follow the mobile-responsive patterns established in the draft presentation cards and game-setup pages.
- Mobile priority: Desktop is the primary experience — make it awesome and robust. The Management Panel (depth chart + tools) on mobile can be a simple action button that opens a popover/drawer; it doesn't need to replicate the full desktop experience. Just make sure it looks clean and is functional.
- MANDATORY: NEVER push, sync, or commit changes to git through the API or automatically. All git operations (commit, push, sync) must be left for the user to do manually. Do not attempt to resolve git conflicts, trigger rebases, or interact with the remote repository in any way. Only make code changes to local files.

## System Architecture
The project utilizes HTML pages for routing, with `index.html` for the main menu, `game-setup.html` for mode-specific team selection, and `game-shell.html` as the primary interface for game modes. All game data is loaded asynchronously from JSON files.

**Navigation Flow:**
- `index.html` → `game-setup.html?mode=draft` → `game-shell.html` (Draft mode)
- `index.html` → `game-setup.html?mode=offseason` → (Offseason phases) (Offseason mode)

**UI/UX Decisions:**
- **Brand Guidelines:** Uses NFL Red (#D50A0A), NFL Blue (#013369), and Silver (#A5ACAF), with specific fonts for headlines, UI, and body text.
- **Universal Game Shell Layout:** A consistent two-panel layout (Phase Content + Management Panel) is used across all modes. The Management Panel features depth charts and tools, with elastic sizing and full-screen options for specific functionalities.
- **Player Pills:** Compact, draggable cards for roster players, displaying key info, stats, and contextual action menus. Status indicators are shown via subtle bottom-edge colors.
- **Depth Chart Drag-and-Drop:** Custom drag-and-drop system supporting insert behavior, same-row reorder, and cross-row moves with position compatibility.
- **Design Elements:** Includes a live activity ticker, countdown timers, and ESPN CDN logos for NFL teams and colleges.
- **Draft Board:** Dynamic display of draft picks, team needs, and trade value indicators.
- **Prospect Display:** Shows prospects with college colors, position filters, watchlist, and expandable accordion details.
- **Team Info Panel:** Displays a 2-deep roster with contract and scheme-fit information.

**Technical Implementations & Feature Specifications:**
- **Data Loading:** All game data, including prospects, draft order, and team needs, is loaded from JSON files.
- **Player Rating Scale:** Employs the 20-80 scouting scale for all player skill and trait ratings, with 50 representing an average NFL starter.
- **Player Ratings Generation (v2.0 Multi-Source):** `scripts/build_player_ratings.js` generates 20-80 skill ratings for rostered players by blending PFF grades, Madden EA API ratings, nflverse NFL stats, contract value, draft capital, and performance tier. Weights are dynamically redistributed if sources are missing, with experience-based adjustments for rookies and veterans.
- **Projected Ceiling Ratings (Planned):** Will provide projected ceiling ratings per skill, influenced by age curve, performance trajectory, and draft pedigree.
- **Staff Generation System (Planned):** Franchise mode will generate coaching and front office staff from retired players and non-player sources, using the 20-80 rating scale for staff attributes.
- **Scheme Fit System:** Matches team needs with prospect attributes based on `scheme_skill_weights.json`, supporting 7 offensive and 6 defensive schemes.
- **Draft Logic:** AI draft logic detailed in `DESIGN.md`, covering board generation, variance tiers, scheme fit, and trade triggers.
- **Scouting Reports:** Detailed scouting reports, rankings, and comparisons are available via player card modals.
- **Draft Flow:** Supports "Sim to Pick" and manual player selection, with a dynamic Pick Presentation System that includes trade alerts and on-the-clock displays.
- **Trade System:** A Trade Center modal facilitates value-balanced trades between users and CPU, and CPU-to-CPU.
- **Draft Results:** `draft-results.html` provides post-draft analysis, grades, and narratives.
- **Draft Simulation Script:** A Node.js script (`scripts/simulate-draft.js`) mirrors in-game AI for testing and generating simulations.
- **Prospect Data:** Includes 601 prospects with comprehensive bios, rankings, position-specific skill ratings, scouting reports, traits, archetypes, and development certainty.
- **Data Enrichment Pipeline:** Automated Node.js scripts in `scripts/enrichment/` scrape ranking sources, scouting reports, and use OpenAI for generating missing bio data and skill ratings.
- **Needs Intelligence (`validateTeamNeeds`):** Dynamically adjusts team needs based on depth charts, expiring contracts, aging QBs, and premium position coverage.
- **Future Draft Picks:** Incorporates real-world traded picks for 2027 and 2028.
- **Universal Player Database:** `scripts/build_player_database.js` generates `data/teams/player_database.json`, the authoritative source for all rostered player data, merging nflverse information with contract details and other attributes.
- **PFF Data Enrichment:** `scripts/enrich_pff_data.js` enriches `player_database.json` with PFF grades and position-specific stats from CSV exports.
- **Player Trade Values:** `scripts/build_player_trade_values.js` calculates trade values based on a point system, performance tiers, age curves, and contract modifiers.
- **Team Needs Generation Pipeline:** `scripts/build_team_needs.js` creates `data/teams/team_needs_detailed.json` from various inputs, providing authoritative positional needs.
- **Starter Needs vs Depth Needs:** Distinguishes between critical starter needs and depth needs, influencing CPU logic and UI.
- **Multi-Opening Count:** Displays a count for multiple open starting slots, derived from secure starters versus minimums.
- **Position Key Standardization:** Standardizes position formats across data sources.
- **Roster-Based Needs Filtering:** Filters needs based on secure, non-expiring, and non-aging starters.
- **Cap Summary Data:** `scripts/build_cap_summary.js` generates `data/teams/cap_summary_2026.json` for cap space, dead money, and expiring contracts.
- **Offseason Phase System:** Structured into 7 configurable phases (Franchise Tags, Contract Decisions, Free Agency, Pre-Draft, NFL Draft, UDFA Signing, Roster Finalization) with a horizontal progress bar.
- **Cap Data on Team Cards:** Team selection cards display cap space, expiring contracts, and dead money.
- **Offseason Mode in game-shell.html:** `game-shell.html` adapts for Offseason mode with a phase progress bar and persistent tools.
- **Phase 1 - Franchise Tags:** Allows applying Franchise or Transition tags.
- **Phase 2 - Contract Decisions:** Users can extend, let walk, or release players.
- **Phase 3 - Free Agency:** Users can make offers to free agents.
- **Phase 4 - Pre-Draft:** Summary screen with options for trades or proceeding to the draft.

## External Dependencies
- **NFLMDD:** Provides draft order and trade values.
- **NFLverse:** Source for raw contract, roster, depth chart data, and seasonal player statistics.
- **EA Sports Drop API:** `drop-api.ea.com/rating/madden-nfl` for Madden 26 player ratings.
- **Third-party Ranking Services:** CBS Sports, DraftTek, Daniel Jeremiah (NFL.com), FantasyPros for prospect data enrichment.
- **OpenAI Whisper:** Used for audio transcription in the `dev-feedback-tool`.
- **GitHub:** Used by the `dev-feedback-tool` for storing planning transcripts.