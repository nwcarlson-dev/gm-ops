# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is an NFL franchise simulation game with the ambition to be the leading football GM sim and mock draft simulator. It offers three tiers: a free Draft mode, an Annual License for Offseason mode (free agency, trades, cap management), and a Full License for a multi-season Franchise mode. The project aims to provide a comprehensive and engaging simulation experience for managing an NFL team.

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

## System Architecture
The project is structured around several HTML pages, each serving a specific game mode or utility, with `game-shell.html` being the primary draft UI. Data is loaded asynchronously from JSON files.

**UI/UX Decisions:**
- **Brand Guidelines:** Uses NFL Red (#D50A0A), NFL Blue (#013369), and Silver (#A5ACAF). Fonts include Teko (headlines), Barlow Condensed (UI), and Inter (body). The logo features a skewed block design with "GM" in red and "OPS" in blue/white border.
- **Layout:** The primary draft UI (`game-shell.html`) features a 2-column layout (Draft Board | Team Info + Prospects).
- **Design Elements:** Includes a live activity ticker, draft countdown, collapsible sidebars, and gradient team logos.
- **Draft Board:** Displays all 257 picks, team needs as placeholders, and dynamic updates as picks are made. Round buttons allow navigation, and trade values are subtly shown.
- **Prospect Display:** Loads all prospects with college colors, position filters, and a watchlist. Prospect details expand accordion-style.
- **Team Info Panel:** Features a Depth tab showing a 2-deep roster with expiring contract indicators and scheme-fit information.

**Technical Implementations & Feature Specifications:**
- **Data Loading:** All game data (prospects, draft order, team needs) is loaded from JSON files.
- **Scheme Fit System:** Matches team needs with prospect skills and physical traits, influenced by `scheme_skill_weights.json`.
- **Draft Logic:** AI draft logic detailed in `DESIGN.md` incorporates board generation, variance tiers, scheme fit, and trade triggers.
- **Scouting Reports:** "More Info" on player cards opens a modal with scouting reports, rankings, and comparisons.
- **Draft Flow:** Supports "Sim to Pick" for AI auto-drafting and player selection functionality.
- **Trade System:** Features a Trade Center modal for proposing value-balanced trades, with CPU-to-CPU and CPU-to-user trade offers. Trade pauses are speed-aware.
- **Draft Results:** A `draft-results.html` page provides detailed analysis and grades based on value over consensus rank, need fulfillment, trade impact, and development certainty. It includes pick-by-pick narratives and team grades.
- **Draft Simulation Script:** A Node.js script (`scripts/simulate-draft.js`) mirrors in-game AI logic for testing and generating simulated draft results.
- **Prospect Data:** Includes detailed bio, rankings, grades, combine metrics, skills (0-100), traits, archetype, projection, and scouting reports. `developmentCertainty` is a key field.
- **Needs Intelligence (`validateTeamNeeds`):** Runs at game startup to correct algorithmically-generated team needs using depth chart data. QB rules use an inclusion-based approach: only QBs on the `RECENT_R1_QBS` list (recent 1st-round picks like Sanders, Ward, Dart, Leonard, Ewers) trigger the rookie shield to demote QB from primary. Expiring contracts and aging QBs (37+ via `KNOWN_QB_AGES`) promote QB to primary. All other QBs (journeymen, late-round picks, bridges) are left alone — no exclusion list needed. Also validates premium positions (EDGE, OT, CB, WR) — if 2+ non-expiring starters exist, demotes from primary.
- **Future Draft Picks:** 2027 and 2028 picks initialized with real-world traded picks applied (sourced from Wikipedia 2027 NFL draft article and Draft Insiders Digest). `REAL_FUTURE_TRADES` array captures 28 known 2027 trades and 5 known 2028 trades. Trade values discounted by year (2027 ≈ 1 round lower, 2028 ≈ 2 rounds lower).

## External Dependencies
- **NFLMDD:** Source for draft order with trade values.
- **NFLverse:** Raw data for contracts, rosters, and depth charts.
- **Third-party Ranking Services (for data enrichment pipeline):**
    - CBS Sports
    - DraftTek
    - Daniel Jeremiah (NFL.com)
    - FantasyPros
- **OpenAI Whisper:** Used by the `dev-feedback-tool` for audio transcription.
- **GitHub:** Used by the `dev-feedback-tool` for storing planning transcripts.