const fs = require('fs');
const path = require('path');

const EA_API_FILE = path.join(__dirname, '../../data/raw/madden/ea_api_ratings.json');
const SKILL_MAP_FILE = path.join(__dirname, '../../data/mappings/madden_skill_map.json');
const DB_PATH = path.join(__dirname, '../../data/teams/player_database.json');
const OUTPUT_PATH = path.join(__dirname, '../../data/teams/player_database.json');

const MADDEN_POS_TO_CANONICAL = {
  QB: 'QB', HB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE',
  LT: 'OT', RT: 'OT', LG: 'IOL', RG: 'IOL', C: 'IOL',
  LEDG: 'EDGE', REDG: 'EDGE', LE: 'EDGE', RE: 'EDGE',
  DT: 'IDL', NT: 'IDL',
  MIKE: 'LB', WILL: 'LB', SAM: 'LB', MLB: 'LB', LOLB: 'LB', ROLB: 'LB',
  CB: 'CB', FS: 'S', SS: 'S',
  K: 'K', P: 'P', LS: 'LS'
};

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''`\.]/g, '')
    .replace(/\bjr\b/gi, '')
    .replace(/\bsr\b/gi, '')
    .replace(/\bii\b$/gi, '')
    .replace(/\biii\b$/gi, '')
    .replace(/\biv\b$/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  if (!fs.existsSync(EA_API_FILE)) {
    console.error('EA API ratings file not found. Run fetch_madden_api.js first.');
    process.exit(1);
  }

  console.log('Loading EA API Madden ratings...');
  const eaData = JSON.parse(fs.readFileSync(EA_API_FILE, 'utf-8'));
  const maddenPlayers = eaData.players;
  console.log(`Madden players loaded: ${maddenPlayers.length}`);

  console.log('Loading player database...');
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  const maddenByNameTeam = {};
  const maddenByName = {};
  for (const mp of maddenPlayers) {
    const norm = normalizeName(mp.name);
    const key = norm + '_' + mp.team;
    maddenByNameTeam[key] = mp;
    if (!maddenByName[norm]) {
      maddenByName[norm] = mp;
    }
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedList = [];

  for (const [teamId, players] of Object.entries(db.teams)) {
    for (const player of players) {
      const norm = normalizeName(player.name);
      const match = maddenByNameTeam[norm + '_' + teamId] || maddenByName[norm];

      if (match && match.stats && Object.keys(match.stats).length > 0) {
        const canonicalPos = MADDEN_POS_TO_CANONICAL[match.position] || null;

        player.madden = {
          ovr: match.ovr,
          position: match.position,
          archetype: match.archetype,
          canonicalPos: canonicalPos,
          stats: match.stats,
          abilities: match.abilities || []
        };
        matched++;
      } else {
        unmatched++;
        if (unmatchedList.length < 20) {
          unmatchedList.push(`${player.name} (${teamId})`);
        }
      }
    }
  }

  const total = matched + unmatched;
  console.log(`\nMatching Results:`);
  console.log(`  Matched: ${matched}/${total} (${Math.round(matched/total*100)}%)`);
  console.log(`  Unmatched: ${unmatched}`);
  if (unmatchedList.length > 0) {
    console.log(`  Sample unmatched: ${unmatchedList.slice(0, 10).join(', ')}`);
  }

  const sampleTeam = db.teams['KC'];
  if (sampleTeam) {
    console.log('\n--- Sample: KC Chiefs ---');
    const withMadden = sampleTeam.filter(p => p.madden);
    console.log(`Players with Madden data: ${withMadden.length}/${sampleTeam.length}`);
    const mahomes = sampleTeam.find(p => p.name.includes('Mahomes'));
    if (mahomes && mahomes.madden) {
      const s = mahomes.madden.stats;
      console.log(`Mahomes OVR: ${mahomes.madden.ovr}, Pos: ${mahomes.madden.position}`);
      console.log(`  Throw Power: ${s.throwPower}, Acc Short: ${s.throwAccuracyShort}, Speed: ${s.speed}`);
      console.log(`  Awareness: ${s.awareness}, Throw Under Pressure: ${s.throwUnderPressure}`);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
  console.log(`\nSaved enriched database to ${OUTPUT_PATH}`);
}

main();
