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

const OFFENSE_POSITIONS = {
  'QB': 'QB',
  'RB': 'RB',
  'LWR': 'WR1', 'RWR': 'WR2', 'SWR': 'WR3',
  'TE': 'TE',
  'LT': 'LT', 'LG': 'LG', 'C': 'C', 'RG': 'RG', 'RT': 'RT'
};

const DEFENSE_POSITIONS = {
  'LDE': 'EDGE1', 'RDE': 'EDGE2', 'LOLB': 'EDGE1', 'ROLB': 'EDGE2',
  'LDT': 'DL1', 'RDT': 'DL2', 'NT': 'DL3', 'DT': 'DL1',
  'MLB': 'LB1', 'LILB': 'LB1', 'RILB': 'LB2', 'WILL': 'LB1', 'MIKE': 'LB2', 'SAM': 'LB3',
  'LCB': 'CB1', 'RCB': 'CB2', 'SCB': 'CB3', 'NB': 'CB3',
  'FS': 'S1', 'SS': 'S2'
};

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
    
    const offenseKey = OFFENSE_POSITIONS[posAbb];
    const defenseKey = DEFENSE_POSITIONS[posAbb];
    
    if (!offenseKey && !defenseKey) return;
    
    if (!teamDepthCharts[team]) {
      teamDepthCharts[team] = { offense: {}, defense: {} };
    }
    
    const playerName = row.player_name || '';
    const isExpiring = expiringPlayers.has(playerName.toLowerCase());
    
    const entry = {
      name: playerName,
      pos: posAbb,
      depth: posRank,
      expiring: isExpiring
    };
    
    if (offenseKey) {
      if (!teamDepthCharts[team].offense[offenseKey]) {
        teamDepthCharts[team].offense[offenseKey] = [];
      }
      const existing = teamDepthCharts[team].offense[offenseKey];
      if (!existing.find(p => p.name === playerName && p.depth === posRank)) {
        existing.push(entry);
      }
    } else if (defenseKey) {
      if (!teamDepthCharts[team].defense[defenseKey]) {
        teamDepthCharts[team].defense[defenseKey] = [];
      }
      const existing = teamDepthCharts[team].defense[defenseKey];
      if (!existing.find(p => p.name === playerName && p.depth === posRank)) {
        existing.push(entry);
      }
    }
  });
  
  Object.keys(teamDepthCharts).forEach(team => {
    Object.keys(teamDepthCharts[team].offense).forEach(pos => {
      teamDepthCharts[team].offense[pos].sort((a, b) => a.depth - b.depth);
    });
    Object.keys(teamDepthCharts[team].defense).forEach(pos => {
      teamDepthCharts[team].defense[pos].sort((a, b) => a.depth - b.depth);
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
  console.log('\nBears offense positions:', Object.keys(chi.offense));
  console.log('Bears defense positions:', Object.keys(chi.defense));
}
