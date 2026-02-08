const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '../../data/raw/madden');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ea_api_ratings.json');
const API_BASE = 'https://drop-api.ea.com/rating/madden-nfl';
const PAGE_SIZE = 100;

const TEAM_ID_TO_ABBREV = {
  0: 'FA', 1: 'ARI', 2: 'CIN', 3: 'ATL', 4: 'BUF', 5: 'CAR',
  6: 'CHI', 7: 'CLE', 8: 'DAL', 9: 'DEN', 10: 'DET', 11: 'GB',
  12: 'HOU', 13: 'IND', 14: 'JAX', 15: 'KC', 16: 'LV',
  17: 'LAC', 18: 'LAR', 19: 'MIA', 20: 'MIN', 21: 'NE',
  22: 'NO', 23: 'NYG', 24: 'NYJ', 25: 'PHI', 26: 'PIT',
  27: 'SF', 28: 'SEA', 29: 'TB', 30: 'TEN', 31: 'WAS', 32: 'BAL'
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse JSON')); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllPlayers() {
  console.log('=== Fetching Madden 26 Ratings from EA API ===\n');

  let offset = 0;
  let totalItems = null;
  const allPlayers = [];

  while (true) {
    const url = `${API_BASE}?locale=en&limit=${PAGE_SIZE}&offset=${offset}`;
    console.log(`  Fetching offset=${offset}...`);

    const data = await fetchJSON(url);

    if (totalItems === null) {
      totalItems = data.totalItems;
      console.log(`  Total players available: ${totalItems}\n`);
    }

    if (!data.items || data.items.length === 0) break;

    for (const player of data.items) {
      const stats = {};
      if (player.stats) {
        for (const [key, val] of Object.entries(player.stats)) {
          stats[key] = typeof val === 'object' ? val.value : val;
        }
      }

      const teamAbbrev = player.team ?
        (TEAM_ID_TO_ABBREV[player.team.id] || player.team.label) : 'FA';

      allPlayers.push({
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        name: `${player.firstName} ${player.lastName}`,
        team: teamAbbrev,
        position: player.position ? player.position.shortLabel : null,
        positionType: player.position?.positionType?.id || null,
        ovr: player.overallRating,
        archetype: player.archetype ? player.archetype.label : null,
        age: player.age,
        jersey: player.jerseyNum,
        yearsPro: player.yearsPro,
        college: player.college,
        abilities: (player.playerAbilities || []).map(a => ({
          id: a.id, label: a.label, type: a.type?.label
        })),
        stats
      });
    }

    console.log(`  Got ${data.items.length} players (total: ${allPlayers.length}/${totalItems})`);

    offset += PAGE_SIZE;
    if (offset >= totalItems) break;

    await sleep(500);
  }

  return allPlayers;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const players = await fetchAllPlayers();

  console.log(`\n=== Summary ===`);
  console.log(`Total players fetched: ${players.length}`);

  const byTeam = {};
  for (const p of players) {
    byTeam[p.team] = (byTeam[p.team] || 0) + 1;
  }
  console.log(`Teams: ${Object.keys(byTeam).length}`);

  const byPos = {};
  for (const p of players) {
    byPos[p.position] = (byPos[p.position] || 0) + 1;
  }
  console.log('\nBy position:');
  for (const [pos, count] of Object.entries(byPos).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pos}: ${count}`);
  }

  const output = {
    meta: {
      source: 'EA Sports Drop API',
      url: API_BASE,
      fetchedAt: new Date().toISOString(),
      totalPlayers: players.length
    },
    players
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
