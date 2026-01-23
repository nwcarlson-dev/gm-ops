# GM Ops Dev Planning Transcript
## Draft, File, Click
**Date:** 2026-01-23

### Key Topics
- draft
- file
- click
- create
- GM
- GitHub
- repo
- add
- combine
- API
- player
- update

### Files Referenced
_No files detected_

### Cleanup Stats
- Original exchanges: 1
- Kept: 1
- Removed (noise/off-topic): 0

---

## Transcript

---
### 🤖 Claude

Is there a api resource or resources that I can use to pool things like draft prospect details/rankings (historical and current), current nfl player details/ratings/stats, coaching schemes, roster moves and team draft picks for upcoming drafts?3:46 PMI'll search for NFL data APIs that could provide the comprehensive data you need for GM Ops.3 stepsNFL team draft picks capital future trades API10 results2026 NFL Draft Trade Value Chart & Interactive Tooldrafttek.comNFL Integration - Draft Daysportradar.comTrade Calculator | Over the Capoverthecap.comNFL Draft Trade Value Chart | Over the Capoverthecap.com2026 NFL Trade Value Chartdrafttek.com2026 NFL MOCK DRAFT SIMULATOR WITH TRADESnfldraftbuzz.com2025 NFL Draft trade tracker: Full details on every draft-related move since start of new league yearnfl.comNFL Draft Trade Value Chart – WalterFootballwalterfootball.comNFL Mock Draft Simulator with Trades 2025luxuryfootballelite.comList Of Traded Future NFL Draft Picks - NFLTradeRumors.confltraderumors.coNFL coaching schemes playbooks offensive defensive system database10 resultsFootball Playbooks & Schemes | USA Footballusafootball.comFootball Playbooks: The Ultimate Guide for Coaches - GoRoutgorout.comNFL Playbooks Archives - FootballXOs.comfootballxos.comFree Football Playbook | Football Timesfootballtimes.orgFree Football Playbooks - Football Playbooksfootballplaybooks.netFootball Playbooks | NFL | NCAA | Offensive | Defensivechrisgossett.comThe Ultimate Quarters Based Defensive Playbook | Coaches Choicecoacheschoice.comPlaybooks – Throw Deep Publishingthrowdeeppublishing.comMadden 26 Playbooks - Every Formation And Play In The Gamemadden-school.comWelcome to the NFL...Here's Your 1st Playbookbleacherreport.comBased on my research, here's a comprehensive breakdown of API resources for your GM Ops simulator:
Best API Resources for GM Ops
1. nflverse / nfl_data_py (FREE - Best for Historical Data)
GitHub: github.com/nflverse/nfl_data_py
This is your best free option for comprehensive historical data:
Data TypeAvailableNotesHistorical draft picks✅Since 1980Draft pick values✅Trade value chartsPlayer stats (seasonal/weekly)✅Since 1999Rosters✅Weekly and seasonalCombine results✅Physical measurementsContracts✅Historical and currentDepth charts✅Since 2001Trades✅Transaction historyInjuries✅Since 2009
pythonpip install nfl-data-py
# or newer: pip install nflreadpy
import nfl_data_py as nfl
draft_picks = nfl.import_draft_picks([2015, 2016, 2017])
rosters = nfl.import_rosters([2024, 2025])
2. ESPN Hidden API (FREE - Undocumented)
Reference: gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
Useful endpoints:
sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/draft — Draft data
sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/freeagents — Free agents
site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ID}/overview — Player profiles
Caveat: Undocumented, could change without notice.
3. Sportradar NFL API (PAID - Most Comprehensive)
Docs: developer.sportradar.com/football/reference/nfl-overview
Professional-grade data including:
Real-time transactions & roster moves
Draft day feeds (prospects, trades, picks)
Player profiles with NCAA cross-references
Depth charts and injury reports
This is what major fantasy platforms use.
4. SportsDataIO (PAID - Tiered Pricing)
Docs: sportsdata.io/developers/api-documentation/nfl
Similar coverage to Sportradar with fantasy-focused endpoints.
5. Supporting Data Sources
ResourceData TypeFormatOver The Cap (overthecap.com)Salary cap, contracts, draft pick valuesWeb scraping neededSpotracTransactions, traded picksWeb scraping neededPFF (paid)Player grades, prospect rankingsAPI available with subscription
What's Missing (You'll Need to Build)
Coaching schemes/systems — There's no structured API for this. You'd need to:
Manually categorize teams (West Coast, Shanahan system, Air Raid, etc.)
Create your own scheme database
Track coordinator hiring/firing and map to schemes
Current draft prospect rankings — Most rankings are behind paywalls (ESPN Insider, PFF+). Public options:
NFL.com/draft/tracker/prospects (can be scraped)
CBS Sports rankings (free)
Recommended Stack for GM Ops
nfl_data_py — Historical stats, draft history, rosters, contracts (free)
ESPN API — Current player data, free agents (free but unofficial)
Over The Cap scraping — Draft pick values, cap data
Custom database — Coaching schemes, prospect scouting
Would you like me to help set up the data layer for any of these, or create a schema for storing coaching schemes?does nflverse have 2028 picks?3:50 PMI don't know off the top of my head — let me check what years of draft data nflverse actually covers.nflverse nfl_data_py future draft picks 2026 2027 202810 resultsNFL Future Draft Picks By Team - RealGM Analysisrealgm.com2026 NFL Mock Draft – Round 1 (1-16) – Charlie Campbell – WalterFootballwalterfootball.com2026 NFL Mock Draft: First-Round Picks & Predictions | FantasyProsfantasypros.comCarson Beck Eyed as NFL Draft Replacement for $230 ...heavy.com2026 NFL draft order: 28 Round 1 picks set, Raiders at No. 1 - ESPNespn.com2026 Consensus Big Board | NFL Mock Draft Databasenflmockdraftdatabase.com2026 NFL Mock Draft – WalterFootballwalterfootball.com2026 NFL draft - Wikipediawikipedia.orgTankathon | 2026 NFL Draft Ordertankathon.comNFL Mock Drafts 2026 - Football Draft Projections - CBS Sportscbssports.comnflverse import_draft_picks function years available documentation10 resultsGitHub - nflverse/nfl_data_py: Python code for working with NFL play by play data.github.comPackage index - nflreadr - nflversenflverse.comLoad Draft Picks from PFR — load_draft_picks • nflreadrnflverse.comnfldata/DATASETS.md at master · nflverse/nfldatagithub.comnfl-data-py · PyPIpypi.orgRelease draft_picks · nflverse/nflverse-datagithub.comnflreadr: Download 'nflverse' Datar-universe.devnflreadr/R/load_draft_picks.R at main · nflverse/nflreadrgithub.comnfldata/data/draft_picks.csv at master · nflverse/nfldatagithub.comPackage ‘nflreadr’ September 2, 2025 Title Download 'nflverse' Datar-project.orgNo, nflverse does not have 2028 picks (or any future draft picks).
Here's the situation:
SourceCoveragenflverse load_draft_picks()Historical only — 1980 through the most recent completed draft (2025). It's sourced from Pro Football Reference, which only records picks after they've been made.Future picks (2026, 2027)NFL teams can trade up to 3 years out, so traded future picks exist — but nflverse doesn't track these.2028 picksDon't exist yet — teams can only trade up to three years out, and there have not been any trades of 2028 selections. Realgm
Where to Get Future Pick Data
For GM Ops, you'll need to source future draft capital separately:
SourceDataNotesSpotracTraded future picksWeb scraping requiredOver The CapFuture pick ownershipWeb scraping requiredSportradar API (paid)Real-time draft tradesHas trades endpointNFLTradeRumors.coLists traded 2026/2027 picksManual trackingTankathonCurrent draft order + traded picksVisual only
For your simulator, you'd likely want to:
Initialize each team with 7 picks per round (1-7) for future years
Maintain a separate traded_picks table that tracks ownership changes
Pull from Spotrac or OTC periodically to sync real-world trades
Want me to help design a schema for tracking future draft capital?what does web scraping required mean?3:51 PMGood question — web scraping means there's no official API, so you'd have to write code that:
Loads the webpage (like a browser would)
Parses the HTML to find the data you need
Extracts it into a usable format (JSON, CSV, database)
For example, Over The Cap displays future draft picks on their website, but they don't offer a public API endpoint where you can just call GET /api/picks/2027 and get JSON back. So you'd need to fetch the HTML and pull the data out of the page structure.
ApproachProsConsWeb scrapingFree, gets you the dataFragile (breaks if site changes), potentially against ToS, requires maintenancePaid API (Sportradar, etc.)Reliable, structured, supportedCosts moneyManual entrySimple, no codeTedious, error-prone
For GM Ops Specifically
Since your simulator likely doesn't need real-time accuracy for future picks (they don't change that often), you could:
Manually seed the 2026/2027 pick ownership once from a source like Spotrac
Store it in your own database
Update periodically when big trades happen (a few times per year)
This avoids the fragility of scraping and the cost of a paid API. You'd only need ~50-100 rows of data (teams × rounds × years) that changes infrequently.
Would that work for your use case, or do you need it to stay synced automatically?You've provided the python for nflverse but can you walk me through step by step for how to set up that integration?3:52 PMAbsolutely! Let me walk you through setting up nflverse from scratch.
Step 1: Prerequisites
You'll need Python installed. Open Terminal on your Mac and check:
bashpython3 --version
If you see something like Python 3.10.x or higher, you're good. If not, install it via Homebrew:
bashbrew install python
Step 2: Create a Project Folder
Let's keep things organized:
bashmkdir ~/gm-ops-data
cd ~/gm-ops-data
Step 3: Set Up a Virtual Environment
This keeps your dependencies isolated from other Python projects:
bashpython3 -m venv venv
source venv/bin/activate
You should see (venv) at the start of your terminal prompt now.
Step 4: Install the Package
You have two options. The older, more established package:
bashpip install nfl-data-py
Or the newer port (uses Polars instead of Pandas, slightly faster):
bashpip install nflreadpy
I'd recommend starting with nfl-data-py since it has more documentation and examples.
Step 5: Test It Out
Create a test file:
bashtouch test_nfl.py
Open it in your editor and add:
pythonimport nfl_data_py as nfl
# Get historical draft picks (1980-2025)
draft_picks = nfl.import_draft_picks([2020, 2021, 2022, 2023, 2024, 2025])
print(f"Loaded {len(draft_picks)} draft picks")
print(draft_picks.head())
# Get current rosters
rosters = nfl.import_rosters([2025])
print(f"\nLoaded {len(rosters)} roster entries")
print(rosters[['player_name', 'position', 'team']].head(10))
bashpython test_nfl.py
Step 6: Explore Available Functions
Here's what you can pull for GM Ops:
pythonimport nfl_data_py as nfl
draft_picks = nfl.import_draft_picks([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
draft_values = nfl.import_draft_values()  # Trade value charts
rosters = nfl.import_rosters([2025])
weekly_rosters = nfl.import_weekly_rosters([2025])
combine = nfl.import_combine_data([2020, 2021, 2022, 2023, 2024, 2025])
seasonal_stats = nfl.import_seasonal_data([2024, 2025])
weekly_stats = nfl.import_weekly_data([2025])
# Team/schedule info
schedules = nfl.import_schedules([2025])
team_desc = nfl.import_team_desc()
# Contracts (from Over The Cap)
contracts = nfl.import_contracts()
# Player ID mappings (for cross-referencing sources)
ids = nfl.import_ids()
Step 7: Export to CSV (Optional)
If you want to use the data in Tableau or elsewhere:
pythonimport nfl_data_py as nfl
draft_picks = nfl.import_draft_picks([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
draft_picks.to_csv('draft_picks.csv', index=False)
rosters = nfl.import_rosters([2025])
rosters.to_csv('rosters_2025.csv', index=False)
print("Exported to CSV!")
Quick Reference: Useful Commands
ActionCommandActivate virtual envsource venv/bin/activateDeactivatedeactivateRun scriptpython your_script.pyInstall new packagepip install package-nameSee installed packagespip list
Want me to help you write a more complete data pull script tailored to what GM Ops needs, or set up a refresh schedule so the data stays current?Is there way to create this in github without using desktop tools?3:53 PMYes! You can do everything directly in GitHub's web interface. Here's how:
Step 1: Create a New Repository
Go to github.com and sign in
Click the + icon (top right) → New repository
Repository name: gm-ops-data (or whatever you want)
Description: NFL data integration for GM Ops
Public or Private (your choice)
✅ Check Add a README file
✅ Check Add .gitignore → select Python from the dropdown
Click Create repository
Step 2: Add Your Python Script
From your new repo page, click Add file → Create new file
Name it: pull_nfl_data.py
Paste this starter script:
NFL Data Pull Script for GM Ops
Uses nflverse/nfl_data_py to fetch NFL data
import nfl_data_py as nfl
# Create output directory if it doesn't exist
os.makedirs('data', exist_ok=True)
def pull_draft_data():
"""Pull historical draft picks"""
print("Pulling draft picks...")
years = list(range(2015, 2026))
draft_picks = nfl.import_draft_picks(years)
draft_picks.to_csv('data/draft_picks.csv', index=False)
print(f"  Saved {len(draft_picks)} draft picks")
print("Pulling draft values...")
draft_values = nfl.import_draft_values()
draft_values.to_csv('data/draft_values.csv', index=False)
print(f"  Saved {len(draft_values)} draft value entries")
def pull_player_data():
"""Pull current rosters and player info"""
print("Pulling rosters...")
rosters = nfl.import_rosters([2025])
rosters.to_csv('data/rosters_2025.csv', index=False)
print(f"  Saved {len(rosters)} roster entries")
print("Pulling combine data...")
combine = nfl.import_combine_data(list(range(2020, 2026)))
combine.to_csv('data/combine.csv', index=False)
print(f"  Saved {len(combine)} combine entries")
def pull_contract_data():
"""Pull contract information"""
print("Pulling contracts...")
contracts = nfl.import_contracts()
contracts.to_csv('data/contracts.csv', index=False)
print(f"  Saved {len(contracts)} contracts")
def pull_team_data():
"""Pull team and schedule info"""
print("Pulling team descriptions...")
teams = nfl.import_team_desc()
teams.to_csv('data/teams.csv', index=False)
print(f"  Saved {len(teams)} teams")
print("Pulling schedules...")
schedules = nfl.import_schedules([2024, 2025])
schedules.to_csv('data/schedules.csv', index=False)
print(f"  Saved {len(schedules)} games")
print("GM Ops NFL Data Pull")
pull_draft_data()
pull_player_data()
pull_contract_data()
pull_team_data()
print("Done! Check the /data folder for CSV files.")
if __name__ == "__main__":
4. Scroll down and click **Commit new file**
## Step 3: Add Requirements File
1. Click **Add file** → **Create new file**
2. Name it: `requirements.txt`
Click Commit new file
Step 4: Add GitHub Action for Automatic Runs (Optional)
This will run your script automatically on a schedule and save the data.
Click Add file → Create new file
Name it: .github/workflows/update_data.yml (GitHub will create the folders)
yamlname: Update NFL Data
# Runs every Monday at 6 AM UTC
- cron: '0 6 * * 1'
workflow_dispatch:  # Allows manual trigger
runs-on: ubuntu-latest
- name: Checkout repo
uses: actions/checkout@v4
- name: Set up Python
uses: actions/setup-python@v5
python-version: '3.11'
- name: Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
- name: Run data pull
run: python pull_nfl_data.py
- name: Commit and push changes
git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"
git diff --staged --quiet || git commit -m "Update NFL data [automated]"
4. Click **Commit new file**
## Step 5: Run It Manually (First Time)
1. Go to the **Actions** tab in your repo
2. Click **Update NFL Data** in the left sidebar
3. Click **Run workflow** → **Run workflow**
4. Wait a few minutes for it to complete
5. Check your repo — you should see a new `data/` folder with CSV files
## Your Repo Structure
After setup, you'll have:
│   └── workflows/
│       └── update_data.yml    # Automated runs
│   ├── draft_picks.csv        # Generated data
│   ├── draft_values.csv
│   ├── rosters_2025.csv
│   ├── combine.csv
│   ├── contracts.csv
│   ├── teams.csv
│   └── schedules.csv
├── pull_nfl_data.py           # Main script
├── requirements.txt           # Dependencies
Want me to help you customize the script to pull specific data fields, or connect this to your main GM Ops repo?where is this? Add .gitignore →3:57 PMWhen you're on the Create a new repository screen, look for a section that says "Initialize this repository with:"
It should look something like this:
☑️ Add a README file
☐ Add .gitignore → None ▼
☐ Choose a license → None ▼
Check the box next to Add .gitignore
A dropdown will appear (defaults to "None")
Click the dropdown and type "Python"
Select Python from the list
This automatically creates a .gitignore file that tells Git to ignore common Python junk files (like __pycache__, .pyc files, virtual environments, etc.) so they don't clutter your repo.
If you already created the repo without it, no worries — you can add it manually:
Click Add file → Create new file
Name it: .gitignore
# Byte-compiled / optimized files
# Virtual environments
# Jupyter notebooks
.ipynb_checkpoints/
Click Commit new file
Did you already create the repo, or are you still on the setup screen?I already had a repo for gm ops. Are you saying i need a new one just for data?3:57 PMNot at all! You can add this directly to your existing GM Ops repo. I only suggested a new one because I didn't realize you already had one set up.
Here's what to do instead:
Add to Your Existing GM Ops Repo
Go to your gm-ops repo on GitHub
Decide where you want the data scripts to live. A common structure:
│   ├── scripts/
│   │   └── pull_nfl_data.py    # The Python script
│   └── raw/                     # Where CSVs get saved
├── src/                         # Your existing app code
├── brand-guidelines.html        # Your existing file
├── requirements.txt             # Add nfl-data-py here
1. Create the script file
Click Add file → Create new file
Name it: data/scripts/pull_nfl_data.py
Paste the script from before (just update the output path to data/raw/)
2. Update requirements.txt
If you already have one, edit it and add nfl-data-py and pandas
If you don't have one, create it
3. Add the GitHub Action (optional)
Create .github/workflows/update_data.yml
Same content as before
Does your GM Ops repo already have a requirements.txt or any Python setup? That'll help me tailor the instructions to fit what you've already got.Can you give me a file name that is more specific? it won't be my only data feed, right?3:58 PMGood call. Let's name it based on the source:
data/scripts/pull_nflverse_data.py
And as you add more feeds, you'd have something like:
│   ├── scripts/
│   │   ├── pull_nflverse_data.py      # Historical stats, rosters, draft picks
│   │   ├── pull_espn_data.py          # ESPN hidden API (free agents, etc.)
│   │   ├── pull_overthecap_data.py    # Salary cap, future picks (if you scrape)
│   │   └── pull_sportradar_data.py    # If you get a paid API later
│       ├── nflverse/
│       │   ├── draft_picks.csv
│       │   ├── rosters_2025.csv
│       │   └── ...
│       ├── espn/
│       ├── overthecap/
│       └── sportradar/
This keeps each source separate so when one breaks or needs updating, you're not touching the others.
Want me to update the script with the new file paths?Yes3:58 PMHere's the updated script with the new paths:
File name: data/scripts/pull_nflverse_data.py
NFL Data Pull Script - nflverse source
Uses nflverse/nfl_data_py to fetch NFL data
- Historical draft picks (1980-present)
- Draft pick trade values
- Current rosters
- Combine results
- Player contracts
- Team info and schedules
import nfl_data_py as nfl
# Output directory for nflverse data
OUTPUT_DIR = 'data/raw/nflverse'
"""Create output directory if it doesn't exist"""
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Output directory: {OUTPUT_DIR}")
def pull_draft_data():
"""Pull historical draft picks and values"""
print("\nPulling draft picks...")
years = list(range(2015, 2026))
draft_picks = nfl.import_draft_picks(years)
draft_picks.to_csv(f'{OUTPUT_DIR}/draft_picks.csv', index=False)
print(f"  Saved {len(draft_picks)} draft picks")
print("Pulling draft values...")
draft_values = nfl.import_draft_values()
draft_values.to_csv(f'{OUTPUT_DIR}/draft_values.csv', index=False)
print(f"  Saved {len(draft_values)} draft value entries")
def pull_player_data():
"""Pull current rosters and player info"""
print("\nPulling rosters...")
rosters = nfl.import_rosters([2025])
rosters.to_csv(f'{OUTPUT_DIR}/rosters_2025.csv', index=False)
print(f"  Saved {len(rosters)} roster entries")
print("Pulling combine data...")
combine = nfl.import_combine_data(list(range(2020, 2026)))
combine.to_csv(f'{OUTPUT_DIR}/combine.csv', index=False)
print(f"  Saved {len(combine)} combine entries")
print("Pulling player IDs...")
ids = nfl.import_ids()
ids.to_csv(f'{OUTPUT_DIR}/player_ids.csv', index=False)
print(f"  Saved {len(ids)} player ID mappings")
def pull_contract_data():
"""Pull contract information from Over The Cap via nflverse"""
print("\nPulling contracts...")
contracts = nfl.import_contracts()
contracts.to_csv(f'{OUTPUT_DIR}/contracts.csv', index=False)
print(f"  Saved {len(contracts)} contracts")
def pull_team_data():
"""Pull team and schedule info"""
print("\nPulling team descriptions...")
teams = nfl.import_team_desc()
teams.to_csv(f'{OUTPUT_DIR}/teams.csv', index=False)
print(f"  Saved {len(teams)} teams")
print("Pulling schedules...")
schedules = nfl.import_schedules([2024, 2025])
schedules.to_csv(f'{OUTPUT_DIR}/schedules.csv', index=False)
print(f"  Saved {len(schedules)} games")
def pull_stats_data():
"""Pull player statistics"""
print("\nPulling seasonal stats...")
seasonal = nfl.import_seasonal_data([2023, 2024, 2025])
seasonal.to_csv(f'{OUTPUT_DIR}/stats_seasonal.csv', index=False)
print(f"  Saved {len(seasonal)} seasonal stat lines")
print("Pulling weekly stats (current season)...")
weekly = nfl.import_weekly_data([2025])
weekly.to_csv(f'{OUTPUT_DIR}/stats_weekly_2025.csv', index=False)
print(f"  Saved {len(weekly)} weekly stat lines")
print("GM Ops Data Pull: nflverse")
pull_draft_data()
pull_player_data()
pull_contract_data()
pull_team_data()
pull_stats_data()
print("\n" + "=" * 50)
print(f"Done! Files saved to {OUTPUT_DIR}/")
if __name__ == "__main__":
And update the GitHub Action to match:
File name: .github/workflows/update_nflverse_data.yml
yamlname: Update nflverse Data
# Runs every Monday at 6 AM UTC
- cron: '0 6 * * 1'
workflow_dispatch:  # Allows manual trigger
runs-on: ubuntu-latest
- name: Checkout repo
uses: actions/checkout@v4
- name: Set up Python
uses: actions/setup-python@v5
python-version: '3.11'
- name: Install dependencies
python -m pip install --upgrade pip
pip install nfl-data-py pandas
- name: Run nflverse data pull
run: python data/scripts/pull_nflverse_data.py
- name: Commit and push changes
git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"
git add data/raw/nflverse/
git diff --staged --quiet || git commit -m "Update nflverse data [automated]"
Want me to also give you a starter template for one of the other feeds (ESPN or Over The Cap)?do you're suggesting i make a data branch and two branches beneath?4:00 PMNo, sorry for the confusion! I'm not talking about Git branches at all — I'm talking about folders (directories) in your repo.
So in your existing gm-ops repo on the main branch, you'd just create this folder structure:
├── data/                          ← folder
│   ├── scripts/                   ← folder
│   │   └── pull_nflverse_data.py  ← file
│   └── raw/                       ← folder
│       └── nflverse/              ← folder (created automatically by the script)
│           ├── draft_picks.csv
│           ├── rosters_2025.csv
│           └── ...
├── your existing stuff...
When you create a file in GitHub's web interface, you can create folders at the same time by typing the path with slashes. So when you click Add file → Create new file, you'd type:
data/scripts/pull_nflverse_data.py
GitHub will automatically create the data/ and scripts/ folders for you.
Does that make more sense?I thought a branch was a folder. I also don't know how to create a folder4:01 PMNo worries, let me clarify!
Branch vs Folder
ConceptWhat it isFolderA directory that organizes your files (like folders on your Mac)BranchA separate copy of your entire repo where you can make changes without affecting the main version
You probably only have one branch right now called main — and that's totally fine. Everything we're doing stays on main.
How to Create a Folder in GitHub
GitHub doesn't have a "create folder" button. Instead, you create folders by typing the path when you name a file:
Go to your gm-ops repo
Click Add file → Create new file
In the "Name your file..." box at the top, type:
data/scripts/pull_nflverse_data.py
As soon as you type the first /, GitHub will turn data into a folder. Same with scripts/.
Paste the script content into the big text area below
Scroll down and click Commit new file
That's it — GitHub creates the folders automatically based on the slashes in the file name.
Want to try that and let me know if you hit any snags?Ok so the py file and yml have been created. How do I execute it to pull the data and where can I store it?4:04 PMThe data will be stored right in your repo in the data/raw/nflverse/ folder (the script creates this automatically). Here's how to run it:
How to Execute the Script
Go to your gm-ops repo
Click the Actions tab (near the top, next to "Pull requests")
You might see a message asking you to enable workflows — click I understand my workflows, go ahead and enable them if so
In the left sidebar, click Update nflverse Data
On the right side, click the Run workflow dropdown
Click the green Run workflow button
You'll see a yellow dot (in progress) or check mark (success)
Click on the run to see the logs
Takes about 1-2 minutes
Once it finishes:
Go back to your repo's main Code tab
You should see a new folder: data/
Click into data/ → raw/ → nflverse/
Your CSV files will be there
If Something Goes Wrong
Let me know what error you see in the Actions log and I'll help you fix it.
Ready to give it a try?the folders aren't created yet4:04 PMThat's fine — the folders get created automatically when the script runs. You don't need to create them manually.
When you run the Action:
The script runs on GitHub's servers
This line in the script creates the folders:
python   os.makedirs(OUTPUT_DIR, exist_ok=True)
The CSV files get saved there
The Action commits the new files back to your repo
So just go ahead and run the Action:
Click the Actions tab
Click Update nflverse Data in the left sidebar
Click Run workflow → Run workflow
After it finishes (green checkmark), refresh your repo's Code tab and you'll see the data/raw/nflverse/ folder with all the CSVs inside.
Give it a shot — what do you see when you click the Actions tab?it said it ran but I don't see data/raw4:06 PMLet's check what happened.
Go to the Actions tab
Click on the run that just completed (should show a green checkmark or red X)
Click on update-data (the job name)
You'll see a list of steps — look for any that have a red X or expand each step to see the logs
Can you tell me:
Did it show a green checkmark ✓ or red X ✗?
If you expand the Run nflverse data pull step, what does it say?
Most likely causes:
SymptomLikely issueRed X on "Run nflverse data pull"Script error — we'll see it in the logsGreen checks but no filesThe "Commit and push" step didn't find changes, or there's a permissions issue
Also, expand the Commit and push changes step — it might say something like "nothing to commit" or show a permissions error.
Let me know what you find and I'll help you fix it.4:06 PMI can see it failed — "Process completed with exit code 1." Let's find out why.
Click on update-data (the one with the red X in the jobs list) to expand it and see the individual steps.
You should see something like:
✓ Install dependencies
✗ Run nflverse data pull   ← this one probably failed
Click on the failed step to expand the logs. There should be an error message that tells us what went wrong.
Can you share what you see there? Either screenshot it or copy/paste the error text.4:09 PMFound it! The error on line 20 says:
AttributeError: module 'nfl_data_py' has no attribute 'import_rosters'. Did you mean: '__import_rosters'?
The function name changed in a newer version of the package. Let me give you an updated script with the correct function names.
Go to your repo, find data/scripts/pull_nflverse_data.py, click the pencil icon to edit it, and replace the entire contents with:
NFL Data Pull Script - nflverse source
Uses nflverse/nfl_data_py to fetch NFL data
- Historical draft picks (1980-present)
- Draft pick trade values
- Current rosters
- Combine results
- Player contracts
- Team info and schedules
import nfl_data_py as nfl
# Output directory for nflverse data
OUTPUT_DIR = 'data/raw/nflverse'
"""Create output directory if it doesn't exist"""
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Output directory: {OUTPUT_DIR}")
def pull_draft_data():
"""Pull historical draft picks and values"""
print("\nPulling draft picks...")
years = list(range(2015, 2026))
draft_picks = nfl.import_draft_picks(years)
draft_picks.to_csv(f'{OUTPUT_DIR}/draft_picks.csv', index=False)
print(f"  Saved {len(draft_picks)} draft picks")
print("Pulling draft values...")
draft_values = nfl.import_draft_values()
draft_values.to_csv(f'{OUTPUT_DIR}/draft_values.csv', index=False)
print(f"  Saved {len(draft_values)} draft value entries")
def pull_player_data():
"""Pull current rosters and player info"""
print("\nPulling rosters...")
rosters = nfl.import_seasonal_rosters([2025])
rosters.to_csv(f'{OUTPUT_DIR}/rosters_2025.csv', index=False)
print(f"  Saved {len(rosters)} roster entries")
print("Pulling combine data...")
combine = nfl.import_combine_data(list(range(2020, 2026)))
combine.to_csv(f'{OUTPUT_DIR}/combine.csv', index=False)
print(f"  Saved {len(combine)} combine entries")
print("Pulling player IDs...")
ids = nfl.import_ids()
ids.to_csv(f'{OUTPUT_DIR}/player_ids.csv', index=False)
print(f"  Saved {len(ids)} player ID mappings")
def pull_contract_data():
"""Pull contract information from Over The Cap via nflverse"""
print("\nPulling contracts...")
contracts = nfl.import_contracts()
contracts.to_csv(f'{OUTPUT_DIR}/contracts.csv', index=False)
print(f"  Saved {len(contracts)} contracts")
def pull_team_data():
"""Pull team and schedule info"""
print("\nPulling team descriptions...")
teams = nfl.import_team_desc()
teams.to_csv(f'{OUTPUT_DIR}/teams.csv', index=False)
print(f"  Saved {len(teams)} teams")
print("Pulling schedules...")
schedules = nfl.import_schedules([2024, 2025])
schedules.to_csv(f'{OUTPUT_DIR}/schedules.csv', index=False)
print(f"  Saved {len(schedules)} games")
def pull_stats_data():
"""Pull player statistics"""
print("\nPulling seasonal stats...")
seasonal = nfl.import_seasonal_data([2023, 2024, 2025])
seasonal.to_csv(f'{OUTPUT_DIR}/stats_seasonal.csv', index=False)
print(f"  Saved {len(seasonal)} seasonal stat lines")
print("Pulling weekly stats (current season)...")
weekly = nfl.import_weekly_data([2025])
weekly.to_csv(f'{OUTPUT_DIR}/stats_weekly_2025.csv', index=False)
print(f"  Saved {len(weekly)} weekly stat lines")
print("GM Ops Data Pull: nflverse")
pull_draft_data()
pull_player_data()
pull_contract_data()
pull_team_data()
pull_stats_data()
print("\n" + "=" * 50)
print(f"Done! Files saved to {OUTPUT_DIR}/")
if __name__ == "__main__":
The fix: Changed import_rosters to import_seasonal_rosters on line 42.
After you commit the change, go back to Actions and run the workflow again.

---
*Archived via GM Ops Dev Planning Transcripts*
