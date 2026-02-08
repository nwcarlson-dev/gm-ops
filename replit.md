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
The project is structured around several HTML pages with mode routing via query parameters. `index.html` is the main menu, `game-setup.html` handles team selection for both Draft and Offseason modes (via `?mode=draft` or `?mode=offseason`), and `game-shell.html` is the primary draft UI. Data is loaded asynchronously from JSON files.

**Navigation Flow:**
- `index.html` → `game-setup.html?mode=draft` → `game-shell.html` (Draft mode)
- `index.html` → `game-setup.html?mode=offseason` → (Offseason phases) (Offseason mode)
- Old `draft-setup.html` kept for backward compatibility but `game-setup.html` is the canonical file.

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
- **Prospect Data:** 601 prospects with detailed bio (height, weight — 99%+ coverage), consensus rankings from 7+ sources, position-specific skill ratings (0-100 scale, AI-generated from scouting data, 100% coverage), scouting reports (37% coverage from NFLMDD/Jeremiah — higher for top prospects), traits, archetype, projection, and comparisons. `developmentCertainty` is a key field. 337 core prospects from multiple ranking sources + 264 extended prospects scraped from DraftTek big board (ranks 301-500) for realistic UDFA pool (~10.8 UDFAs per team after 257-pick draft).
- **Data Enrichment Pipeline:** `scripts/enrichment/` contains automated scrapers and AI enrichment tools:
    - `scrape-rankings.js` — Scrapes 7 ranking sources (PFF, CBS, DraftTek, Jeremiah, FantasyPros, NFLMDD, Tankathon). DraftTek scraper covers pages 1-5 (up to 500 prospects) and captures height/weight/class year. Unmatched DraftTek prospects are auto-added as new entries with full bio data.
    - `scrape-reports.js` — Scrapes individual scouting reports from NFLMDD player pages.
    - `enrich-bios.js` — Uses OpenAI to fill missing bio data (height, weight, age, DOB, hometown) in batches of 15.
    - `generate-skills.js` — Uses OpenAI (gpt-4o-mini) to generate position-specific skill ratings based on scouting reports, rankings, and bio data.
    - All scripts accessible via `/api/prospects/enrich/*` endpoints. Pipeline runs: rankings → bios → reports → skills.
- **Needs Intelligence (`validateTeamNeeds`):** Runs at game startup to correct algorithmically-generated team needs using depth chart data. QB rules use an inclusion-based approach: only QBs on the `RECENT_R1_QBS` list (recent 1st-round picks like Sanders, Ward, Dart, Leonard, Ewers) trigger the rookie shield to demote QB from primary. Expiring contracts and aging QBs (37+ via `KNOWN_QB_AGES`) promote QB to primary. All other QBs (journeymen, late-round picks, bridges) are left alone — no exclusion list needed. Also validates premium positions (EDGE, OT, CB, WR) — if 2+ non-expiring starters exist, demotes from primary.
- **Future Draft Picks:** 2027 and 2028 picks initialized with real-world traded picks applied (sourced from Wikipedia 2027 NFL draft article and Draft Insiders Digest). `REAL_FUTURE_TRADES` array captures 28 known 2027 trades and 5 known 2028 trades. Trade values discounted by year (2027 ≈ 1 round lower, 2028 ≈ 2 rounds lower).
- **Player Trade Values:** `scripts/build_player_trade_values.js` generates `data/teams/player_trade_values.json` with trade values for rostered players using the same point system as draft picks. Performance tiers: elite/starter/developing/bridge/backup. Age curves per position. Draft-round-aware contract modifiers (1st round: 1.55-1.70x, 2nd: 1.10-1.20x). "Developing" tier added for 2nd-round rookies.
- **Team Needs Generation Pipeline:** `scripts/build_team_needs.js` generates `data/teams/team_needs_detailed.json` — the single source of truth for positional needs with archetypes and contextual notes. Both `game-setup.html` and `game-shell.html` load from this file. Inputs: baseline needs (`nflmdd_team_needs_2026.json`), team schemes (`team_schemes.json`), depth charts, player trade values, and `team_intel.json` (living intel file with position-specific notes about injuries, FA departures, contract situations, scheme changes). Archetypes are derived from scheme-to-archetype mapping (e.g., Shanahan Wide Zone → "Zone Blocker" at OT). Notes are generated from intel + roster analysis (aging starters, expiring contracts, bridge-level players). To regenerate after any input changes: `node scripts/build_team_needs.js`. The `team_intel.json` file is the place to add news, injury updates, and roster moves — the build script weaves them into the generated notes. `validateTeamNeeds()` at runtime adjusts priorities but never touches archetypes or notes.
- **Cap Summary Data:** `scripts/build_cap_summary.js` generates `data/teams/cap_summary_2026.json` with cap space, dead money, and expiring contracts per team from `data/raw/nflverse/contracts.csv`.
- **Offseason Phase System:** 7 configurable phases stored as `OFFSEASON_PHASES` array: Franchise Tags → Contract Decisions → Free Agency → Pre-Draft → NFL Draft → UDFA Signing → Roster Finalization. Phase timeline renders as a compact horizontal progress bar. Order is configurable (not hardcoded) to support future user setting to move FA after draft.
- **Cap Data on Team Cards:** Both Draft and Offseason modes show cap space (green/red), expiring contracts count, and dead money as small badges on team selection cards. Data loaded from `cap_summary_2026.json` with team name-to-abbreviation mapping.
- **Offseason Mode in game-shell.html:** Same shell file handles both Draft and Offseason modes via `?mode=offseason` query param. Phase progress bar shows at top (below header). Sidebar adapts to show persistent tools (My Roster, Trade Center, Salary Cap, Team Needs, League Activity) instead of draft-specific items. Main content area swaps between `draftContent` and `offseasonContent` divs.
- **Phase 1 - Franchise Tags:** 2-column layout. Left shows eligible expiring non-rookie players sorted by trade value with tag selection dropdown (No Tag / Franchise / Transition). Right shows cap summary with meter bar and league-wide tag decisions from CPU teams. Tag costs use position-based averages or 120% of current APY (whichever is higher). Transition tags = 80% of franchise cost. Max 1 franchise + 1 transition per team. CPU auto-tags highest-value expiring starters.
- **Phase 2 - Contract Decisions:** Full-width table of expiring contracts (excluding tagged players). Three actions per player: Let Walk (goes to FA pool), Extend (2yr at 110% APY), Release (cut with dead cap). Running cap total updates live. CPU teams extend elite/starter players (trade value > 300) and let bridge/backup players walk.
- **Phase 3 - Free Agency:** 2-column layout. Left shows FA market with position filter tabs, player cards with "Make Offer" inline forms (years slider + APY input). Right shows user's cap space, roster composition, pending offers, completed signings. Day-by-day advancement with CPU bidding (30% chance per need match + cap space). Market settles after 3 consecutive days with no signings.
- **Phase 4 - Pre-Draft:** Simple summary screen showing offseason recap (cap space, FA signings, players lost) with two options: "Explore Trades" or "Enter the Draft". Minimal phase since users have already scouted real prospects.

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