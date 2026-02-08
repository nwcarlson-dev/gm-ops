const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../../data/raw/madden');
const TEAM_ROSTER_FILE = path.join(OUTPUT_DIR, 'team_rosters.json');
const PLAYER_RATINGS_FILE = path.join(OUTPUT_DIR, 'player_ratings.json');

const TEAMS = [
  'arizona-cardinals', 'atlanta-falcons', 'baltimore-ravens', 'buffalo-bills',
  'carolina-panthers', 'chicago-bears', 'cincinnati-bengals', 'cleveland-browns',
  'dallas-cowboys', 'denver-broncos', 'detroit-lions', 'green-bay-packers',
  'houston-texans', 'indianapolis-colts', 'jacksonville-jaguars', 'kansas-city-chiefs',
  'las-vegas-raiders', 'los-angeles-chargers', 'los-angeles-rams', 'miami-dolphins',
  'minnesota-vikings', 'new-england-patriots', 'new-orleans-saints', 'new-york-giants',
  'new-york-jets', 'philadelphia-eagles', 'pittsburgh-steelers', 'san-francisco-49ers',
  'seattle-seahawks', 'tampa-bay-buccaneers', 'tennessee-titans', 'washington-commanders'
];

const TEAM_ABBREV_MAP = {
  'arizona-cardinals': 'ARI', 'atlanta-falcons': 'ATL', 'baltimore-ravens': 'BAL',
  'buffalo-bills': 'BUF', 'carolina-panthers': 'CAR', 'chicago-bears': 'CHI',
  'cincinnati-bengals': 'CIN', 'cleveland-browns': 'CLE', 'dallas-cowboys': 'DAL',
  'denver-broncos': 'DEN', 'detroit-lions': 'DET', 'green-bay-packers': 'GB',
  'houston-texans': 'HOU', 'indianapolis-colts': 'IND', 'jacksonville-jaguars': 'JAX',
  'kansas-city-chiefs': 'KC', 'las-vegas-raiders': 'LV', 'los-angeles-chargers': 'LAC',
  'los-angeles-rams': 'LAR', 'miami-dolphins': 'MIA', 'minnesota-vikings': 'MIN',
  'new-england-patriots': 'NE', 'new-orleans-saints': 'NO', 'new-york-giants': 'NYG',
  'new-york-jets': 'NYJ', 'philadelphia-eagles': 'PHI', 'pittsburgh-steelers': 'PIT',
  'san-francisco-49ers': 'SF', 'seattle-seahawks': 'SEA', 'tampa-bay-buccaneers': 'TB',
  'tennessee-titans': 'TEN', 'washington-commanders': 'WAS'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GMOps/1.0; NFL simulation game data)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout for ${url}`)); });
  });
}

function parseTeamRoster(html, teamSlug) {
  const players = [];
  const teamAbbrev = TEAM_ABBREV_MAP[teamSlug];

  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) || [];

  for (const row of rows) {
    const linkMatch = row.match(/href="https:\/\/www\.maddenratings\.com\/([^"]+)"/);
    if (!linkMatch) continue;

    const slug = linkMatch[1];
    if (slug.startsWith('teams/') || slug.startsWith('lists/')) continue;

    const nameMatch = row.match(/title="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : slug.replace(/-/g, ' ');

    const jerseyMatch = row.match(/#(\d+)/);
    const jersey = jerseyMatch ? parseInt(jerseyMatch[1]) : null;

    const posMatch = row.match(/\[([A-Z]+(?:\s*[A-Z]*)?)\]\(https:\/\/www\.maddenratings\.com\/lists\/[^)]+\)/);
    let position = null;
    if (posMatch) {
      position = posMatch[1].trim();
    } else {
      const posAlt = row.match(/#\d+\s+\[([A-Z]{1,4})\]/);
      if (posAlt) position = posAlt[1];
    }

    const ovrMatch = row.match(/\|\s*(\d{2})\s*\|/g);
    let ovr = null;
    if (ovrMatch && ovrMatch.length >= 1) {
      const nums = ovrMatch.map(m => parseInt(m.replace(/[|\s]/g, '')));
      ovr = nums[0];
    }

    const archetypeMatch = row.match(/\[([A-Za-z\s-]+)\]\(https:\/\/www\.maddenratings\.com\/lists\/[^)]*(?:power-rusher|speed-rusher|run-stopper|pass-coverage|improviser|scrambler|pocket|strong-arm|field-general|slot|man-to-man|zone|hybrid|power-back|elusive-back|receiving-back|physical|route-runner|deep-threat|possession|blocking|pass-protector|agile|power|accurate|run-block)[^)]*\)/i);
    const archetype = archetypeMatch ? archetypeMatch[1].trim() : null;

    if (name && name.length > 2) {
      players.push({
        name,
        slug,
        team: teamAbbrev,
        position,
        jersey,
        ovr,
        archetype,
        url: `https://www.maddenratings.com/${slug}`
      });
    }
  }

  return players;
}

function parsePlayerRatings(html, playerInfo) {
  const ratings = {};

  const categoryPatterns = [
    { key: 'general', pattern: /General Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'passing', pattern: /Passing-specific Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'receiving', pattern: /Receiving Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'ballCarrier', pattern: /Ball-carrier Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'defense', pattern: /Defense Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'blocking', pattern: /Blocking Ratings[\s\S]*?(?=##### \d|$)/i },
    { key: 'kicking', pattern: /Kicking Ratings[\s\S]*?(?=##### \d|$)/i }
  ];

  const ratingLineRegex = /- (\d+)\s+([A-Za-z\s]+)/g;

  for (const { key, pattern } of categoryPatterns) {
    const sectionMatch = html.match(pattern);
    if (!sectionMatch) continue;

    const section = sectionMatch[0];
    ratings[key] = {};

    let match;
    const lineRegex = /- (\d+)\s+([A-Za-z\s]+?)(?:\n|$)/g;
    while ((match = lineRegex.exec(section)) !== null) {
      const value = parseInt(match[1]);
      const attrName = match[2].trim();
      if (attrName && value >= 0 && value <= 99) {
        const camelKey = attrName
          .toLowerCase()
          .replace(/\b(\w)/g, (m, c, i) => i === 0 ? c : c.toUpperCase())
          .replace(/\s+/g, '');
        ratings[key][camelKey] = value;
      }
    }
  }

  const posMatch = html.match(/Position:\s*\[([A-Z]{1,4})/);
  const position = posMatch ? posMatch[1] : playerInfo.position;

  const archetypeMatch = html.match(/Archetype:\s*\[([^\]]+)\]/);
  const archetype = archetypeMatch ? archetypeMatch[1].trim() : playerInfo.archetype;

  const ovrMatch = html.match(/(\d{2})\s*\n\s*Madden 26 Rating/);
  const ovr = ovrMatch ? parseInt(ovrMatch[1]) : playerInfo.ovr;

  return {
    name: playerInfo.name,
    team: playerInfo.team,
    slug: playerInfo.slug,
    position: position,
    ovr: ovr,
    archetype: archetype,
    jersey: playerInfo.jersey,
    ratings
  };
}

async function scrapeTeamRosters() {
  console.log('=== Scraping Madden Team Rosters ===\n');

  if (fs.existsSync(TEAM_ROSTER_FILE)) {
    console.log('Team roster file already exists. Loading cached data.');
    console.log('Delete data/raw/madden/team_rosters.json to re-scrape.\n');
    return JSON.parse(fs.readFileSync(TEAM_ROSTER_FILE, 'utf-8'));
  }

  const allPlayers = [];

  for (const team of TEAMS) {
    const url = `https://www.maddenratings.com/teams/${team}`;
    try {
      console.log(`  Scraping ${team}...`);
      const html = await fetchPage(url);
      const players = parseTeamRoster(html, team);
      allPlayers.push(...players);
      console.log(`    Found ${players.length} players`);
      await sleep(1500);
    } catch (err) {
      console.error(`    ERROR scraping ${team}: ${err.message}`);
      await sleep(2000);
    }
  }

  console.log(`\nTotal players discovered: ${allPlayers.length}`);
  fs.writeFileSync(TEAM_ROSTER_FILE, JSON.stringify(allPlayers, null, 2));
  console.log(`Saved to ${TEAM_ROSTER_FILE}\n`);
  return allPlayers;
}

async function scrapePlayerRatings(rosterPlayers) {
  console.log('=== Scraping Individual Player Ratings ===\n');

  let existing = {};
  if (fs.existsSync(PLAYER_RATINGS_FILE)) {
    existing = JSON.parse(fs.readFileSync(PLAYER_RATINGS_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(existing).length} cached player ratings.`);
  }

  const toScrape = rosterPlayers.filter(p => !existing[p.slug]);
  console.log(`Players to scrape: ${toScrape.length} (${Object.keys(existing).length} already cached)\n`);

  let scraped = 0;
  let errors = 0;
  const saveInterval = 25;

  for (const player of toScrape) {
    try {
      const html = await fetchPage(player.url);
      const ratings = parsePlayerRatings(html, player);
      existing[player.slug] = ratings;
      scraped++;

      if (scraped % 10 === 0) {
        process.stdout.write(`  Scraped ${scraped}/${toScrape.length} (${errors} errors)\r`);
      }

      if (scraped % saveInterval === 0) {
        fs.writeFileSync(PLAYER_RATINGS_FILE, JSON.stringify(existing, null, 2));
      }

      await sleep(1200);
    } catch (err) {
      errors++;
      console.error(`\n  ERROR: ${player.name} (${player.slug}): ${err.message}`);
      await sleep(2000);
    }
  }

  fs.writeFileSync(PLAYER_RATINGS_FILE, JSON.stringify(existing, null, 2));
  console.log(`\n\nScraping complete: ${scraped} new, ${errors} errors`);
  console.log(`Total cached: ${Object.keys(existing).length} players`);
  console.log(`Saved to ${PLAYER_RATINGS_FILE}\n`);
  return existing;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const rosterPlayers = await scrapeTeamRosters();
  const playerRatings = await scrapePlayerRatings(rosterPlayers);

  const withRatings = Object.values(playerRatings).filter(p =>
    p.ratings && Object.keys(p.ratings).length > 0
  );
  console.log(`\n=== Summary ===`);
  console.log(`Players with detailed ratings: ${withRatings.length}`);
  console.log(`Players with general ratings: ${withRatings.filter(p => p.ratings.general).length}`);
  console.log(`Players with passing ratings: ${withRatings.filter(p => p.ratings.passing).length}`);
  console.log(`Players with defense ratings: ${withRatings.filter(p => p.ratings.defense).length}`);
}

main().catch(console.error);
