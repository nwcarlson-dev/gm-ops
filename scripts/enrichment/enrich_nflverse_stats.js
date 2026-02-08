const fs = require('fs');
const path = require('path');

const STATS_CSV = path.join(__dirname, '../../data/raw/nflverse/player_stats_2024.csv');
const DB_PATH = path.join(__dirname, '../../data/teams/player_database.json');
const OUTPUT_PATH = path.join(__dirname, '../../data/teams/player_database.json');

const RECENT_SEASONS = [2023, 2024, 2025];
const SEASON_WEIGHTS = { 2025: 0.50, 2024: 0.35, 2023: 0.15 };

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',');
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const val = (values[j] || '').trim();
      row[headers[j]] = val === '' || val === 'NA' ? null : isNaN(val) ? val : parseFloat(val);
    }
    rows.push(row);
  }
  return rows;
}

function aggregateSeasonalStats(weeklyRows) {
  const playerSeasons = {};

  for (const row of weeklyRows) {
    const season = row.season;
    if (!RECENT_SEASONS.includes(season)) continue;
    if (row.season_type !== 'REG') continue;

    const key = `${row.player_id}_${season}`;
    if (!playerSeasons[key]) {
      playerSeasons[key] = {
        playerId: row.player_id,
        name: row.player_display_name || row.player_name,
        team: row.recent_team,
        position: row.position,
        positionGroup: row.position_group,
        season: season,
        games: 0,
        completions: 0, attempts: 0, passingYards: 0, passingTDs: 0,
        interceptions: 0, sacks: 0, passingEPA: 0,
        carries: 0, rushingYards: 0, rushingTDs: 0, rushingEPA: 0,
        receptions: 0, targets: 0, receivingYards: 0, receivingTDs: 0,
        receivingEPA: 0, receivingYAC: 0, receivingFirstDowns: 0,
        targetShare: 0, targetShareCount: 0,
        specialTeamsTDs: 0
      };
    }

    const ps = playerSeasons[key];
    ps.games++;
    ps.completions += row.completions || 0;
    ps.attempts += row.attempts || 0;
    ps.passingYards += row.passing_yards || 0;
    ps.passingTDs += row.passing_tds || 0;
    ps.interceptions += row.interceptions || 0;
    ps.sacks += row.sacks || 0;
    ps.passingEPA += row.passing_epa || 0;
    ps.carries += row.carries || 0;
    ps.rushingYards += row.rushing_yards || 0;
    ps.rushingTDs += row.rushing_tds || 0;
    ps.rushingEPA += row.rushing_epa || 0;
    ps.receptions += row.receptions || 0;
    ps.targets += row.targets || 0;
    ps.receivingYards += row.receiving_yards || 0;
    ps.receivingTDs += row.receiving_tds || 0;
    ps.receivingEPA += row.receiving_epa || 0;
    ps.receivingYAC += row.receiving_yards_after_catch || 0;
    ps.receivingFirstDowns += row.receiving_first_downs || 0;
    if (row.target_share != null) {
      ps.targetShare += row.target_share;
      ps.targetShareCount++;
    }
    ps.specialTeamsTDs += row.special_teams_tds || 0;
  }

  return playerSeasons;
}

function computeWeightedCareerStats(playerSeasons) {
  const byPlayer = {};

  for (const ps of Object.values(playerSeasons)) {
    if (!byPlayer[ps.playerId]) {
      byPlayer[ps.playerId] = {
        playerId: ps.playerId,
        name: ps.name,
        latestTeam: ps.team,
        position: ps.position,
        positionGroup: ps.positionGroup,
        seasons: []
      };
    }
    byPlayer[ps.playerId].seasons.push(ps);
    if (ps.season > (byPlayer[ps.playerId].latestSeason || 0)) {
      byPlayer[ps.playerId].latestTeam = ps.team;
      byPlayer[ps.playerId].latestSeason = ps.season;
    }
  }

  const result = {};
  for (const [playerId, data] of Object.entries(byPlayer)) {
    const weighted = {};
    let totalWeight = 0;

    for (const season of data.seasons) {
      const w = SEASON_WEIGHTS[season.season] || 0.1;
      totalWeight += w;

      const statKeys = ['completions', 'attempts', 'passingYards', 'passingTDs',
        'interceptions', 'sacks', 'passingEPA', 'carries', 'rushingYards', 'rushingTDs',
        'rushingEPA', 'receptions', 'targets', 'receivingYards', 'receivingTDs',
        'receivingEPA', 'receivingYAC', 'receivingFirstDowns', 'specialTeamsTDs', 'games'];

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
    weighted.yardsPerTarget = weighted.targets > 0 ?
      Math.round(weighted.receivingYards / weighted.targets * 10) / 10 : 0;
    weighted.tdRate = weighted.attempts > 0 ?
      Math.round(weighted.passingTDs / weighted.attempts * 1000) / 10 : 0;
    weighted.intRate = weighted.attempts > 0 ?
      Math.round(weighted.interceptions / weighted.attempts * 1000) / 10 : 0;

    result[playerId] = {
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
    .replace(/[''`]/g, '')
    .replace(/\bjr\.?\b/gi, '')
    .replace(/\bsr\.?\b/gi, '')
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

  const statsLookup = {};
  for (const sp of Object.values(statsPlayers)) {
    const key = normalizePlayerName(sp.name) + '_' + sp.latestTeam;
    statsLookup[key] = sp;
    const nameOnly = normalizePlayerName(sp.name);
    if (!statsLookup[nameOnly]) statsLookup[nameOnly] = sp;
  }

  for (const [teamId, players] of Object.entries(db.teams)) {
    for (const player of players) {
      const key1 = normalizePlayerName(player.name) + '_' + teamId;
      const key2 = normalizePlayerName(player.name);

      const match = statsLookup[key1] || statsLookup[key2];
      if (match) {
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
  console.log('Loading nflverse stats CSV...');
  const csvText = fs.readFileSync(STATS_CSV, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`Parsed ${rows.length} weekly stat rows`);

  const recentRows = rows.filter(r => RECENT_SEASONS.includes(r.season));
  console.log(`Rows for seasons ${RECENT_SEASONS.join(', ')}: ${recentRows.length}`);

  console.log('\nAggregating seasonal stats...');
  const playerSeasons = aggregateSeasonalStats(rows);
  console.log(`Player-seasons: ${Object.keys(playerSeasons).length}`);

  console.log('\nComputing weighted career stats...');
  const statsPlayers = computeWeightedCareerStats(playerSeasons);
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
      console.log(`Mahomes weighted stats:`, JSON.stringify(mahomes.nflStats.stats, null, 2).slice(0, 300));
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
  console.log(`\nSaved enriched database to ${OUTPUT_PATH}`);
}

main();
