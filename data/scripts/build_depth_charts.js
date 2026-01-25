const fs = require('fs');
const path = require('path');

const CURRENT_YEAR = 2026;

const TEAM_ABBR_MAP = {
  'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
  'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
  'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
  'HOU': 'HOU', 'IND': 'IND', 'JAX': 'JAC', 'JAC': 'JAC',
  'KC': 'KC', 'LA': 'LAR', 'LAC': 'LAC', 'LAR': 'LAR', 'LV': 'LV',
  'MIA': 'MIA', 'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO',
  'NYG': 'NYG', 'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT',
  'SEA': 'SEA', 'SF': 'SF', 'TB': 'TB', 'TEN': 'TEN', 'WAS': 'WAS'
};

const POS_CATEGORIES = {
  'QB': 'QB',
  'RB': 'RB', 'FB': 'RB',
  'WR': 'WR', 'LWR': 'WR', 'RWR': 'WR', 'SWR': 'WR',
  'TE': 'TE',
  'LT': 'OL', 'RT': 'OL', 'LG': 'OL', 'RG': 'OL', 'C': 'OL',
  'LDE': 'EDGE', 'RDE': 'EDGE', 'LOLB': 'EDGE', 'ROLB': 'EDGE',
  'LDT': 'DL', 'RDT': 'DL', 'NT': 'DL', 'DT': 'DL',
  'MLB': 'LB', 'LILB': 'LB', 'RILB': 'LB', 'WILL': 'LB', 'MIKE': 'LB', 'SAM': 'LB',
  'LCB': 'CB', 'RCB': 'CB', 'SCB': 'CB', 'CB': 'CB', 'NB': 'CB',
  'FS': 'S', 'SS': 'S', 'S': 'S'
};

const OFFENSE_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL'];
const DEFENSE_POSITIONS = ['EDGE', 'DL', 'LB', 'CB', 'S'];

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i] || '');
    return obj;
  });
}

function loadContracts() {
  const content = fs.readFileSync(path.join(__dirname, '../raw/nflverse/contracts.csv'), 'utf8');
  const rows = parseCSV(content);
  const expiringPlayers = new Set();
  
  rows.forEach(row => {
    if (row.is_active === 'True' && row.year_signed && row.years) {
      const yearSigned = parseInt(row.year_signed);
      const years = parseInt(row.years);
      const expiryYear = yearSigned + years;
      if (expiryYear <= CURRENT_YEAR) {
        expiringPlayers.add(row.player.toLowerCase());
      }
    }
  });
  
  console.log(`Found ${expiringPlayers.size} players with expiring contracts`);
  return expiringPlayers;
}

function loadDepthCharts(expiringPlayers) {
  const content = fs.readFileSync(path.join(__dirname, '../raw/nflverse/depth_charts_2025.csv'), 'utf8');
  const rows = parseCSV(content);
  
  let latestDate = '';
  rows.forEach(row => {
    if (row.dt > latestDate) latestDate = row.dt;
  });
  console.log(`Latest depth chart date: ${latestDate}`);
  
  const latestRows = rows.filter(row => row.dt === latestDate);
  console.log(`${latestRows.length} entries for latest date`);
  
  const teamDepthCharts = {};
  
  latestRows.forEach(row => {
    const team = TEAM_ABBR_MAP[row.team] || row.team;
    const posRank = parseInt(row.pos_rank) || 1;
    
    if (posRank > 2) return;
    
    const posAbb = row.pos_abb || row.pos_name;
    const category = POS_CATEGORIES[posAbb];
    if (!category) return;
    
    const isOffense = OFFENSE_POSITIONS.includes(category);
    const isDefense = DEFENSE_POSITIONS.includes(category);
    if (!isOffense && !isDefense) return;
    
    if (!teamDepthCharts[team]) {
      teamDepthCharts[team] = {
        offense: { QB: [], RB: [], WR: [], TE: [], OL: [] },
        defense: { EDGE: [], DL: [], LB: [], CB: [], S: [] }
      };
    }
    
    const playerName = row.player_name || '';
    const isExpiring = expiringPlayers.has(playerName.toLowerCase());
    
    const entry = {
      name: playerName,
      pos: posAbb,
      depth: posRank,
      expiring: isExpiring
    };
    
    const existingNames = isOffense 
      ? teamDepthCharts[team].offense[category].map(p => p.name + p.pos)
      : teamDepthCharts[team].defense[category].map(p => p.name + p.pos);
    
    if (!existingNames.includes(playerName + posAbb)) {
      if (isOffense) {
        teamDepthCharts[team].offense[category].push(entry);
      } else {
        teamDepthCharts[team].defense[category].push(entry);
      }
    }
  });
  
  Object.keys(teamDepthCharts).forEach(team => {
    Object.keys(teamDepthCharts[team].offense).forEach(cat => {
      teamDepthCharts[team].offense[cat].sort((a, b) => a.depth - b.depth);
    });
    Object.keys(teamDepthCharts[team].defense).forEach(cat => {
      teamDepthCharts[team].defense[cat].sort((a, b) => a.depth - b.depth);
    });
  });
  
  return teamDepthCharts;
}

const expiringPlayers = loadContracts();
const depthCharts = loadDepthCharts(expiringPlayers);

const outputPath = path.join(__dirname, '../teams/depth_charts_2026.json');
fs.writeFileSync(outputPath, JSON.stringify(depthCharts, null, 2));
console.log(`Wrote depth charts to ${outputPath}`);
console.log(`Teams: ${Object.keys(depthCharts).length}`);

const chi = depthCharts['CHI'];
if (chi) {
  console.log('\nBears sample:');
  console.log('QB:', chi.offense.QB.slice(0, 2).map(p => p.name));
  console.log('WR:', chi.offense.WR.slice(0, 4).map(p => p.name));
  console.log('EDGE:', chi.defense.EDGE.slice(0, 3).map(p => p.name));
}
