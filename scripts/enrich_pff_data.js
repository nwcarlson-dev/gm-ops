const fs = require('fs');
const path = require('path');

const PFF_TEAM_TO_DB = {
  ARZ: 'ARI', BLT: 'BAL', CLV: 'CLE', HST: 'HOU', LA: 'LAR',
  ATL: 'ATL', BUF: 'BUF', CAR: 'CAR', CHI: 'CHI', CIN: 'CIN',
  DAL: 'DAL', DEN: 'DEN', DET: 'DET', GB: 'GB', IND: 'IND',
  JAX: 'JAX', KC: 'KC', LAC: 'LAC', LV: 'LV', MIA: 'MIA',
  MIN: 'MIN', NE: 'NE', NO: 'NO', NYG: 'NYG', NYJ: 'NYJ',
  PHI: 'PHI', PIT: 'PIT', SEA: 'SEA', SF: 'SF', TB: 'TB',
  TEN: 'TEN', WAS: 'WAS',
};

const PFF_DIR = path.join(__dirname, '..', 'attached_assets');
const DB_PATH = path.join(__dirname, '..', 'data', 'teams', 'player_database.json');

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        vals.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    vals.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i] || ''; });
    return obj;
  });
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function loadCSV(filename) {
  const files = fs.readdirSync(PFF_DIR);
  const match = files.find(f => f.startsWith(filename) && f.endsWith('.csv'));
  if (!match) {
    console.warn(`  Warning: No CSV found for ${filename}`);
    return [];
  }
  const content = fs.readFileSync(path.join(PFF_DIR, match), 'utf8');
  return parseCSV(content);
}

function normalizeName(name) {
  return name
    .replace(/\s+(Jr\.?|Sr\.?|III|II|IV|V)$/i, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

function buildPffLookup(rows) {
  const lookup = {};
  for (const row of rows) {
    const teamAbbr = PFF_TEAM_TO_DB[row.team_name] || row.team_name;
    const key = `${normalizeName(row.player)}_${teamAbbr}`;
    if (!lookup[key]) {
      lookup[key] = row;
    }
  }
  return lookup;
}

function getFromLookup(lookup, playerName, teamAbbr) {
  const key = `${normalizeName(playerName)}_${teamAbbr}`;
  return lookup[key] || null;
}

console.log('Loading PFF data files...');
const passing = buildPffLookup(loadCSV('passing_summary'));
const rushing = buildPffLookup(loadCSV('rushing_summary'));
const receiving = buildPffLookup(loadCSV('receiving_summary'));
const defense = buildPffLookup(loadCSV('defense_summary'));
const blocking = buildPffLookup(loadCSV('offense_blocking'));
const passRush = buildPffLookup(loadCSV('pass_rush_summary'));
const coverage = buildPffLookup(loadCSV('defense_coverage_summary'));
const runDef = buildPffLookup(loadCSV('run_defense_summary'));
const fieldGoal = buildPffLookup(loadCSV('field_goal_summary'));
const punting = buildPffLookup(loadCSV('punting_summary'));

console.log('Loading player database...');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

let matched = 0;
let unmatched = 0;
let total = 0;

for (const teamAbbr of Object.keys(db.teams)) {
  for (const player of db.teams[teamAbbr]) {
    total++;
    const pos = player.position;
    const name = player.name;
    let pffData = null;

    if (pos === 'QB') {
      const row = getFromLookup(passing, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_offense),
          stats: {
            passYards: num(row.yards),
            passTDs: num(row.touchdowns),
            completionPct: num(row.completion_percent),
            ints: num(row.interceptions),
            games: num(row.player_game_count),
          }
        };
      }
    } else if (pos === 'RB' || pos === 'FB') {
      const row = getFromLookup(rushing, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_offense),
          stats: {
            rushYards: num(row.yards),
            rushTDs: num(row.touchdowns),
            attempts: num(row.attempts),
            ypc: num(row.ypa),
            games: num(row.player_game_count),
          }
        };
      }
      const recRow = getFromLookup(receiving, name, teamAbbr);
      if (recRow && pffData) {
        pffData.stats.recYards = num(recRow.yards);
        pffData.stats.receptions = num(recRow.receptions);
      }
    } else if (pos === 'WR') {
      const row = getFromLookup(receiving, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_offense),
          stats: {
            recYards: num(row.yards),
            recTDs: num(row.touchdowns),
            receptions: num(row.receptions),
            targets: num(row.targets),
            games: num(row.player_game_count),
          }
        };
      }
    } else if (pos === 'TE') {
      const row = getFromLookup(receiving, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_offense),
          stats: {
            recYards: num(row.yards),
            recTDs: num(row.touchdowns),
            receptions: num(row.receptions),
            targets: num(row.targets),
            games: num(row.player_game_count),
          }
        };
      }
    } else if (pos === 'OT' || pos === 'IOL') {
      const row = getFromLookup(blocking, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_offense),
          stats: {
            pressuresAllowed: num(row.pressures_allowed),
            sacksAllowed: num(row.sacks_allowed),
            runBlockGrade: num(row.grades_run_block),
            passBlockGrade: num(row.grades_pass_block),
            games: num(row.player_game_count),
          }
        };
      }
    } else if (pos === 'EDGE') {
      const defRow = getFromLookup(defense, name, teamAbbr);
      const prRow = getFromLookup(passRush, name, teamAbbr);
      if (defRow) {
        pffData = {
          grade: num(defRow.grades_defense),
          stats: {
            sacks: num(defRow.sacks),
            totalPressures: num(defRow.total_pressures),
            tackles: num(defRow.tackles),
            games: num(defRow.player_game_count),
          }
        };
        if (prRow) {
          pffData.stats.passRushGrade = num(prRow.grades_pass_rush_defense);
          pffData.stats.passRushWinRate = num(prRow.pass_rush_win_rate);
        }
      }
    } else if (pos === 'DL') {
      const defRow = getFromLookup(defense, name, teamAbbr);
      const prRow = getFromLookup(passRush, name, teamAbbr);
      if (defRow) {
        pffData = {
          grade: num(defRow.grades_defense),
          stats: {
            sacks: num(defRow.sacks),
            totalPressures: num(defRow.total_pressures),
            tackles: num(defRow.tackles),
            games: num(defRow.player_game_count),
          }
        };
        if (prRow) {
          pffData.stats.passRushGrade = num(prRow.grades_pass_rush_defense);
          pffData.stats.runDefGrade = num(defRow.grades_run_defense);
        }
      }
    } else if (pos === 'LB') {
      const defRow = getFromLookup(defense, name, teamAbbr);
      if (defRow) {
        pffData = {
          grade: num(defRow.grades_defense),
          stats: {
            tackles: num(defRow.tackles),
            sacks: num(defRow.sacks),
            totalPressures: num(defRow.total_pressures),
            coverageGrade: num(defRow.grades_coverage_defense),
            games: num(defRow.player_game_count),
          }
        };
      }
    } else if (pos === 'CB' || pos === 'NB') {
      const defRow = getFromLookup(defense, name, teamAbbr);
      const covRow = getFromLookup(coverage, name, teamAbbr);
      if (defRow) {
        pffData = {
          grade: num(defRow.grades_defense),
          stats: {
            interceptions: num(defRow.interceptions),
            passBreakups: num(defRow.pass_break_ups),
            tackles: num(defRow.tackles),
            coverageGrade: num(defRow.grades_coverage_defense),
            games: num(defRow.player_game_count),
          }
        };
        if (covRow) {
          pffData.stats.qbRatingAgainst = num(covRow.qb_rating_against);
        }
      }
    } else if (pos === 'S') {
      const defRow = getFromLookup(defense, name, teamAbbr);
      if (defRow) {
        pffData = {
          grade: num(defRow.grades_defense),
          stats: {
            interceptions: num(defRow.interceptions),
            passBreakups: num(defRow.pass_break_ups),
            tackles: num(defRow.tackles),
            coverageGrade: num(defRow.grades_coverage_defense),
            games: num(defRow.player_game_count),
          }
        };
      }
    } else if (pos === 'K') {
      const row = getFromLookup(fieldGoal, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_fgep_kicker),
          stats: {
            fgMade: num(row.total_made),
            fgAttempts: num(row.total_attempts),
            fgPct: num(row.total_percent),
            games: num(row.player_game_count),
          }
        };
      }
    } else if (pos === 'P') {
      const row = getFromLookup(punting, name, teamAbbr);
      if (row) {
        pffData = {
          grade: num(row.grades_punter),
          stats: {
            avgYards: num(row.average_yards_per_attempt),
            insideTwenty: num(row.inside_twenties),
            attempts: num(row.attempts),
            games: num(row.player_game_count),
          }
        };
      }
    }

    if (pffData) {
      player.pff = pffData;
      matched++;
    } else {
      unmatched++;
    }
  }
}

console.log(`\nResults:`);
console.log(`  Total players: ${total}`);
console.log(`  Matched with PFF data: ${matched}`);
console.log(`  Unmatched: ${unmatched}`);
console.log(`  Match rate: ${(matched / total * 100).toFixed(1)}%`);

const unmatchedByPos = {};
for (const teamAbbr of Object.keys(db.teams)) {
  for (const player of db.teams[teamAbbr]) {
    if (!player.pff) {
      const pos = player.position;
      if (!unmatchedByPos[pos]) unmatchedByPos[pos] = [];
      unmatchedByPos[pos].push(`${player.name} (${teamAbbr})`);
    }
  }
}
console.log('\nUnmatched by position:');
for (const [pos, players] of Object.entries(unmatchedByPos).sort()) {
  console.log(`  ${pos}: ${players.length} players`);
  if (players.length <= 5) {
    players.forEach(p => console.log(`    - ${p}`));
  } else {
    players.slice(0, 3).forEach(p => console.log(`    - ${p}`));
    console.log(`    ... and ${players.length - 3} more`);
  }
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`\nSaved enriched database to ${DB_PATH}`);
