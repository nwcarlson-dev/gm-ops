# GM Ops - NFL Franchise Simulation

## Overview
GM Ops is a comprehensive NFL franchise simulation game aiming to be "the best football GM sim and mock draft simulator." The project includes three tiers:
- **Free**: Draft mode only
- **Annual License**: Offseason mode (free agency, trades, cap management)
- **Full License**: Franchise mode (multi-season career)

## Project Structure
- `index.html` - Main menu with game mode selection
- `draft-setup.html` - Draft configuration (team selection, settings)
- `draft-room.html` - Draft room interface
- `shared/styles.css` - Shared brand-compliant styles
- `brand-guidelines.html` - Brand/style guidelines
- `DESIGN.md` - Game design documentation
- `dev-guide.html` - Developer guide
- `data/` - Data files and scripts

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

## Future Work
- **Prospect Data**: Need to source real consensus rankings, scouting reports for 100+ players (current data is placeholder)
- **Full Styling Pass**: Refactor draft-setup and draft-room body content to use brand tokens
- **Trade System**: Implement trade value chart and CPU trade offers
- **Draft Results Page**: Grades, recap, export functionality

## User Preferences
- Use numbered lists when asking questions
- Build UI framework first before features
- Premium, cohesive design (not "patched together ERP")
- No cross-navigation between modes (stay in Draft when in Draft, etc.)
