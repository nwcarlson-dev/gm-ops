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

const SPECIAL_TEAMS = ['PK', 'P', 'H', 'PR', 'KR', 'LS', 'K'];

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
    
    const posAbb = row.pos_abb || '';
    const posSlot = parseInt(row.pos_slot) || 0;
    const posGroup = row.pos_grp || '';
    
    if (!posAbb || SPECIAL_TEAMS.includes(posAbb)) return;
    
    if (!teamDepthCharts[team]) {
      teamDepthCharts[team] = { offense: [], defense: [] };
    }
    
    const playerName = row.player_name || '';
    const nameLower = playerName.toLowerCase();
    const isExpiring = expiringPlayers.has(nameLower);
    
    const isDefense = posGroup.toLowerCase().includes('d') || 
      ['LDE', 'RDE', 'LDT', 'RDT', 'NT', 'LOLB', 'ROLB', 'MLB', 'LILB', 'RILB', 'WILL', 'MIKE', 'SAM', 'WLB', 'SLB', 'LCB', 'RCB', 'SCB', 'NB', 'FS', 'SS'].includes(posAbb);
    
    const entry = {
      name: playerName,
      pos: posAbb,
      slot: posSlot,
      depth: posRank,
      expiring: isExpiring
    };
    
    if (isDefense) {
      teamDepthCharts[team].defense.push(entry);
    } else {
      teamDepthCharts[team].offense.push(entry);
    }
  });
  
  return teamDepthCharts;
}

function organizeDepthChart(entries) {
  const byPosSlot = {};
  
  entries.forEach(e => {
    const key = `${e.pos}-${e.slot}`;
    if (!byPosSlot[key]) {
      byPosSlot[key] = { pos: e.pos, slot: e.slot, starter: null, backup: null };
    }
    if (e.depth === 1) {
      byPosSlot[key].starter = { name: e.name, expiring: e.expiring };
    } else if (e.depth === 2) {
      byPosSlot[key].backup = { name: e.name, expiring: e.expiring };
    }
  });
  
  return Object.values(byPosSlot).sort((a, b) => a.slot - b.slot);
}

function buildFinalDepthCharts(teamDepthCharts) {
  const result = {};
  
  Object.keys(teamDepthCharts).forEach(team => {
    const { offense, defense } = teamDepthCharts[team];
    
    result[team] = {
      offense: organizeDepthChart(offense),
      defense: organizeDepthChart(defense)
    };
  });
  
  return result;
}

const expiringPlayers = loadContracts();
const depthCharts = loadDepthCharts(expiringPlayers);
const finalData = buildFinalDepthCharts(depthCharts);

const outputPath = path.join(__dirname, '../teams/depth_charts_2026.json');
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
console.log(`Wrote depth charts to ${outputPath}`);
console.log(`Teams: ${Object.keys(finalData).length}`);

const chi = finalData['CHI'];
if (chi) {
  console.log('\nBears offense:');
  chi.offense.forEach(p => {
    const s = p.starter;
    const b = p.backup;
    console.log(`  ${p.pos}: ${s?.name || '-'}${s?.expiring ? ' [Q]' : ''} / ${b?.name || '-'}${b?.expiring ? ' [Q]' : ''}`);
  });
  console.log('\nBears defense:');
  chi.defense.forEach(p => {
    const s = p.starter;
    const b = p.backup;
    console.log(`  ${p.pos}: ${s?.name || '-'}${s?.expiring ? ' [Q]' : ''} / ${b?.name || '-'}${b?.expiring ? ' [Q]' : ''}`);
  });
}
