const fs = require('fs');
const path = require('path');

const STATS_CSV = path.join(__dirname, '../../data/raw/nflverse/player_stats_seasonal.csv');
const DB_PATH = path.join(__dirname, '../../data/teams/player_database.json');
const OUTPUT_PATH = path.join(__dirname, '../../data/teams/player_database.json');

const RECENT_SEASONS = [2022, 2023, 2024];
const SEASON_WEIGHTS = { 2024: 0.50, 2023: 0.35, 2022: 0.15 };

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const val = (values[j] || '').trim();
      row[headers[j]] = val === '' || val === 'NA' ? null : isNaN(val) ? val : parseFloat(val);
    }
    rows.push(row);
  }
  return rows;
}

function computeWeightedStats(rows) {
  const byPlayer = {};

  for (const row of rows) {
    if (!RECENT_SEASONS.includes(row.season)) continue;
    if (row.season_type !== 'REG') continue;

    const pid = row.player_id;
    if (!byPlayer[pid]) {
      byPlayer[pid] = {
        playerId: pid,
        name: row.player_display_name || row.player_name,
        latestTeam: row.recent_team,
        position: row.position,
        positionGroup: row.position_group,
        seasons: []
      };
    }

    const p = byPlayer[pid];
    if (row.season >= (p.latestSeason || 0)) {
      p.latestTeam = row.recent_team;
      p.latestSeason = row.season;
    }

    p.seasons.push({
      season: row.season,
      games: row.games || 0,
      completions: row.completions || 0,
      attempts: row.attempts || 0,
      passingYards: row.passing_yards || 0,
      passingTDs: row.passing_tds || 0,
      interceptions: row.interceptions || 0,
      sacks: row.sacks || 0,
      passingEPA: row.passing_epa || 0,
      carries: row.carries || 0,
      rushingYards: row.rushing_yards || 0,
      rushingTDs: row.rushing_tds || 0,
      rushingEPA: row.rushing_epa || 0,
      receptions: row.receptions || 0,
      targets: row.targets || 0,
      receivingYards: row.receiving_yards || 0,
      receivingTDs: row.receiving_tds || 0,
      receivingEPA: row.receiving_epa || 0,
      receivingYAC: row.receiving_yards_after_catch || 0,
      receivingFirstDowns: row.receiving_first_downs || 0,
      targetShare: row.target_share || 0,
      specialTeamsTDs: row.special_teams_tds || 0
    });
  }

  const result = {};
  for (const [pid, data] of Object.entries(byPlayer)) {
    const weighted = {};
    let totalWeight = 0;

    const statKeys = ['games', 'completions', 'attempts', 'passingYards', 'passingTDs',
      'interceptions', 'sacks', 'passingEPA', 'carries', 'rushingYards', 'rushingTDs',
      'rushingEPA', 'receptions', 'targets', 'receivingYards', 'receivingTDs',
      'receivingEPA', 'receivingYAC', 'receivingFirstDowns', 'specialTeamsTDs'];

    for (const season of data.seasons) {
      const w = SEASON_WEIGHTS[season.season] || 0.1;
      totalWeight += w;
      for (const key of statKeys) {
        weighted[key] = (weighted[key] || 0) + (season[key] || 0) * w;
      }
    }

    if (totalWeight > 0) {
      for (const key of Object.keys(weighted)) {
        weighted[key] = Math.round(weighted[key] / totalWeight * 10) / 10;
      }
    }

    weighted.completionPct = weighted.attempts > 0 ?
      Math.round(weighted.completions / weighted.attempts * 1000) / 10 : 0;
    weighted.yardsPerCarry = weighted.carries > 0 ?
      Math.round(weighted.rushingYards / weighted.carries * 10) / 10 : 0;
    weighted.yardsPerReception = weighted.receptions > 0 ?
      Math.round(weighted.receivingYards / weighted.receptions * 10) / 10 : 0;
    weighted.tdRate = weighted.attempts > 0 ?
      Math.round(weighted.passingTDs / weighted.attempts * 1000) / 10 : 0;
    weighted.intRate = weighted.attempts > 0 ?
      Math.round(weighted.interceptions / weighted.attempts * 1000) / 10 : 0;

    result[pid] = {
      ...data,
      weightedStats: weighted,
      seasonsPlayed: data.seasons.length
    };
  }

  return result;
}

function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .replace(/[''`\.]/g, '')
    .replace(/\bjr\b/gi, '')
    .replace(/\bsr\b/gi, '')
    .replace(/\bii\b/gi, '')
    .replace(/\biii\b/gi, '')
    .replace(/\biv\b/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchStatsToRoster(statsPlayers, db) {
  let matched = 0;
  let unmatched = 0;

  const byNameTeam = {};
  const byName = {};
  for (const sp of Object.values(statsPlayers)) {
    const norm = normalizePlayerName(sp.name);
    const key = norm + '_' + sp.latestTeam;
    byNameTeam[key] = sp;
    if (!byName[norm]) byName[norm] = sp;
  }

  for (const [teamId, players] of Object.entries(db.teams)) {
    for (const player of players) {
      const norm = normalizePlayerName(player.name);
      const match = byNameTeam[norm + '_' + teamId] || byName[norm];
      if (match && match.weightedStats.games > 0) {
        player.nflStats = {
          playerId: match.playerId,
          seasonsPlayed: match.seasonsPlayed,
          stats: match.weightedStats
        };
        matched++;
      } else {
        unmatched++;
      }
    }
  }

  return { matched, unmatched };
}

function main() {
  console.log('Loading nflverse seasonal stats CSV...');
  const csvText = fs.readFileSync(STATS_CSV, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`Parsed ${rows.length} seasonal stat rows`);

  const recentCount = rows.filter(r => RECENT_SEASONS.includes(r.season) && r.season_type === 'REG').length;
  console.log(`Rows for seasons ${RECENT_SEASONS.join(', ')} (REG only): ${recentCount}`);

  console.log('\nComputing weighted multi-season stats...');
  const statsPlayers = computeWeightedStats(rows);
  console.log(`Unique players with stats: ${Object.keys(statsPlayers).length}`);

  console.log('\nLoading player database...');
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  console.log('Matching stats to roster...');
  const { matched, unmatched } = matchStatsToRoster(statsPlayers, db);
  console.log(`  Matched: ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);
  console.log(`  Match rate: ${Math.round(matched / (matched + unmatched) * 100)}%`);

  const sampleTeam = db.teams['KC'];
  if (sampleTeam) {
    console.log('\n--- Sample: KC Chiefs ---');
    const withStats = sampleTeam.filter(p => p.nflStats);
    console.log(`Players with stats: ${withStats.length}/${sampleTeam.length}`);
    const mahomes = sampleTeam.find(p => p.name.includes('Mahomes'));
    if (mahomes && mahomes.nflStats) {
      const s = mahomes.nflStats.stats;
      console.log(`Mahomes: ${s.games} gm, ${s.passingYards} yds, ${s.passingTDs} TD, ${s.completionPct}% cmp, ${s.interceptions} INT`);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
  console.log(`\nSaved enriched database to ${OUTPUT_PATH}`);
}

main();
