# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is an NFL franchise simulation game aiming to be the leading football GM sim and mock draft simulator. It offers a free Draft mode, an Annual License for Offseason mode (free agency, trades, cap management), and a Full License for a multi-season Franchise mode. The project provides a comprehensive and engaging experience for managing an NFL team, focusing on realism and strategic depth in the NFL context.

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
The project uses several HTML pages, with mode routing handled by query parameters. `index.html` serves as the main menu, `game-setup.html` manages team selection for different modes, and `game-shell.html` is the primary interface for both Draft and Offseason modes. All game data is loaded asynchronously from JSON files.

**Navigation Flow:**
- `index.html` → `game-setup.html?mode=draft` → `game-shell.html` (Draft mode)
- `index.html` → `game-setup.html?mode=offseason` → (Offseason phases) (Offseason mode)

**UI/UX Decisions:**
- **Brand Guidelines:** Utilizes NFL Red (#D50A0A), NFL Blue (#013369), and Silver (#A5ACAF). Typography includes Teko (headlines), Barlow Condensed (UI), and Inter (body). The logo features a skewed block design.
- **Universal Game Shell Layout:** All modes use a consistent two-panel layout: Phase Content (left, ~55%) + Management Panel (right, ~45%). The Management Panel has 4 mutually exclusive tabs: Offense, Defense, ST (depth charts), and Tools (vertical menu of management options like Transactions, Cap Management, Stats, etc.). The panel is elastic — default ~45%, expanded ~60-65% for deeper depth chart views, and full-screen (100%, hiding left panel) for heavy tools like Trade Center and Free Agent market.
- **Player Pills:** Roster players displayed as compact draggable cards in depth chart position rows. Each pill shows: Name, two phase-contextual stats, tooltip icon (ⓘ) for full details, and action menu (⋮) with phase-aware options (Trade, Extend, Restructure, Release, Apply Tags, etc.). Subtle bottom-edge color indicators for status (amber=expiring, red=injured, green=performer, gold=tagged).
- **Depth Chart Drag-and-Drop:** Custom drag-and-drop system (no library) with insert behavior (not swap). Supports same-row reorder and cross-row moves with position compatibility rules. Full spec in DESIGN.md under "Drag-and-Drop Depth Chart System". Prototype in `layout-test.html`.
- **Design Elements:** Incorporates a live activity ticker, countdown timers, and ESPN CDN logos for all 32 NFL teams and 754 colleges.
- **Draft Board:** Displays all draft picks, team needs, and dynamically updates. Includes round navigation and subtle trade value indicators.
- **Prospect Display:** Shows prospects with college colors, position filters, and a watchlist. Prospect details are presented in an expandable accordion format.
- **Team Info Panel:** Features a Depth tab showing a 2-deep roster with contract and scheme-fit information.

**Technical Implementations & Feature Specifications:**
- **Data Loading:** All game data, including prospects, draft order, and team needs, is loaded from JSON files.
- **Player Rating Scale:** All player skill and trait ratings use the **20-80 scouting scale** (professional scouting standard). 50=average NFL starter, 80=franchise elite/All-Pro, 20=non-prospect. PFF grades (0-100) are a separate observational system displayed alongside scouting ratings. Full scale breakdown in DESIGN.md under "Player Rating System."
- **Scheme Fit System:** Matches team needs with prospect attributes based on `scheme_skill_weights.json`.
- **Draft Logic:** AI draft logic, detailed in `DESIGN.md`, includes board generation, variance tiers, scheme fit, and trade triggers.
- **Scouting Reports:** Player cards provide detailed scouting reports, rankings, and comparisons via modals.
- **Draft Flow:** Supports "Sim to Pick" for AI drafting and manual player selection. Features a dynamic **Pick Presentation System** with trade alerts, on-the-clock displays, and pick reveals, adjusting timing based on speed settings.
- **Trade System:** A Trade Center modal facilitates value-balanced trades between user and CPU, and CPU-to-CPU.
- **Draft Results:** `draft-results.html` offers post-draft analysis, grades, and narratives based on various metrics.
- **Draft Simulation Script:** A Node.js script (`scripts/simulate-draft.js`) mirrors in-game AI for testing and generating simulations.
- **Prospect Data:** Includes 601 prospects with comprehensive bios, consensus rankings, position-specific skill ratings, scouting reports, traits, archetypes, and development certainty.
- **Data Enrichment Pipeline:** Automated Node.js scripts in `scripts/enrichment/` scrape ranking sources, scouting reports, and use OpenAI for generating missing bio data and position-specific skill ratings. This pipeline ensures comprehensive and accurate prospect data.
- **Needs Intelligence (`validateTeamNeeds`):** Dynamically adjusts algorithmically generated team needs at game startup based on depth charts, expiring contracts, aging QBs, and premium position coverage.
- **Future Draft Picks:** Incorporates real-world traded picks for 2027 and 2028, with value adjusted by year.
- **Universal Player Database:** `scripts/build_player_database.js` generates `data/teams/player_database.json`, the single authoritative source for all rostered player data. Merges nflverse contracts, rosters, and depth charts into one file with: name, team, position, age, college, jersey number, years of experience, headshot URL, ESPN ID, performance tier, and full contract details (APY, guaranteed, years remaining, expiring status, rookie deal flag). All UI components (pills, tooltips, action menus) reference this database. 1,293 players across 32 teams.
- **PFF Data Enrichment:** `scripts/enrich_pff_data.js` enriches `player_database.json` with PFF grades and position-specific stats from uploaded PFF CSV exports (16 files covering passing, rushing, receiving, defense, OL blocking, kickers, punters, special teams). Each player gets a `pff` object with `grade` (overall PFF grade) and `stats` (position-appropriate stats like passYards/TDs for QB, sacks/pressures for EDGE, pressuresAllowed/runBlockGrade for OL, etc.). 93.3% match rate across all 32 teams. PFF grade color tiers: Elite (90+, gold), Great (80-89, green), Above Avg (70-79, blue), Average (60-69, gray), Below (sub-60, red).
- **Player Trade Values:** `scripts/build_player_trade_values.js` calculates trade values for rostered players based on a point system, performance tiers, age curves, and contract modifiers. This is a peripheral calculation used only by the Trade Center — NOT the source of truth for player identity or contract data.
- **Team Needs Generation Pipeline:** `scripts/build_team_needs.js` creates `data/teams/team_needs_detailed.json`, the authoritative source for positional needs with archetypes and contextual notes, drawing from various inputs like baseline needs, team schemes, depth charts, contracts, and `team_intel.json`.
- **Starter Needs vs Depth Needs:** Distinguishes between critical starter needs (driving early picks and aggressive trades) and depth needs (guiding later-round selections), with different UI visibility and CPU logic.
- **Multi-Opening Count:** Starter needs display a count when multiple starting slots are open, derived from comparing secure starters against position-specific minimums.
- **Position Key Standardization:** Standardizes position formats across different data sources into 11 canonical categories using `mapPositionToNeed()` and `normalizePos()` functions.
- **Roster-Based Needs Filtering:** Filters needs based on whether a position is covered by secure, non-expiring, and non-aging starters, with age thresholds defined per position.
- **Cap Summary Data:** `scripts/build_cap_summary.js` generates `data/teams/cap_summary_2026.json` for cap space, dead money, and expiring contracts.
- **Offseason Phase System:** Structured into 7 configurable phases: Franchise Tags, Contract Decisions, Free Agency, Pre-Draft, NFL Draft, UDFA Signing, and Roster Finalization, displayed via a horizontal progress bar.
- **Cap Data on Team Cards:** Team selection cards display cap space, expiring contracts, and dead money.
- **Offseason Mode in game-shell.html:** The `game-shell.html` adapts for Offseason mode, featuring a phase progress bar and persistent tools like My Roster, Trade Center, and Salary Cap in the sidebar.
- **Phase 1 - Franchise Tags:** Allows users to apply Franchise or Transition tags to expiring players, with CPU teams automatically tagging high-value players.
- **Phase 2 - Contract Decisions:** Users can extend, let walk, or release players with expiring contracts, affecting the live cap total.
- **Phase 3 - Free Agency:** Users can make offers to free agents, with CPU teams also participating in daily bidding.
- **Phase 4 - Pre-Draft:** A summary screen showing offseason recap, offering options to explore trades or proceed to the draft.

## External Dependencies
- **NFLMDD:** Provides draft order and trade values.
- **NFLverse:** Source for raw contract, roster, and depth chart data.
- **Third-party Ranking Services:** CBS Sports, DraftTek, Daniel Jeremiah (NFL.com), FantasyPros for prospect data enrichment.
- **OpenAI Whisper:** Used for audio transcription in the `dev-feedback-tool`.
- **GitHub:** Used by the `dev-feedback-tool` for storing planning transcripts.