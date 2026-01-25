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

const OFFENSE_POSITIONS = {
  'QB': { group: 'QB', count: 1 },
  'RB': { group: 'RB', count: 1 },
  'FB': { group: 'FB', count: 1 },
  'WR': { group: 'WR', count: 3 },
  'TE': { group: 'TE', count: 1 },
  'LT': { group: 'LT', count: 1 },
  'LG': { group: 'LG', count: 1 },
  'C': { group: 'C', count: 1 },
  'RG': { group: 'RG', count: 1 },
  'RT': { group: 'RT', count: 1 }
};

const DEFENSE_DL = ['LDE', 'RDE', 'LDT', 'RDT', 'NT', 'DE', 'DT'];
const DEFENSE_LB = ['MLB', 'WLB', 'SLB', 'LILB', 'RILB', 'LOLB', 'ROLB', 'ILB', 'OLB', 'LB'];
const DEFENSE_CB = ['LCB', 'RCB', 'CB'];
const DEFENSE_NB = ['NB', 'SCB', 'DB'];
const DEFENSE_S = ['FS', 'SS', 'S'];

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
  
  const teamData = {};
  
  latestRows.forEach(row => {
    const team = TEAM_ABBR_MAP[row.team] || row.team;
    const posRank = parseInt(row.pos_rank) || 1;
    const posAbb = row.pos_abb || '';
    const posGroup = row.pos_grp || '';
    
    if (!posAbb || SPECIAL_TEAMS.includes(posAbb)) return;
    
    if (!teamData[team]) {
      teamData[team] = { offense: {}, defense: {} };
    }
    
    const playerName = row.player_name || '';
    const isExpiring = expiringPlayers.has(playerName.toLowerCase());
    
    const isDefense = posGroup.toLowerCase().includes('d') || 
      [...DEFENSE_DL, ...DEFENSE_LB, ...DEFENSE_CB, ...DEFENSE_NB, ...DEFENSE_S].includes(posAbb);
    
    const entry = { name: playerName, pos: posAbb, rank: posRank, expiring: isExpiring };
    
    if (isDefense) {
      let group;
      if (DEFENSE_DL.includes(posAbb)) group = posAbb;
      else if (DEFENSE_LB.includes(posAbb)) group = 'LB';
      else if (DEFENSE_CB.includes(posAbb)) group = posAbb;
      else if (DEFENSE_NB.includes(posAbb)) group = 'NB';
      else if (DEFENSE_S.includes(posAbb)) group = posAbb;
      else group = posAbb;
      
      if (!teamData[team].defense[group]) teamData[team].defense[group] = [];
      if (!teamData[team].defense[group].find(p => p.name === playerName)) {
        teamData[team].defense[group].push(entry);
      }
    } else {
      const offPos = OFFENSE_POSITIONS[posAbb];
      if (offPos) {
        if (!teamData[team].offense[posAbb]) teamData[team].offense[posAbb] = [];
        if (!teamData[team].offense[posAbb].find(p => p.name === playerName)) {
          teamData[team].offense[posAbb].push(entry);
        }
      }
    }
  });
  
  Object.keys(teamData).forEach(team => {
    Object.keys(teamData[team].offense).forEach(pos => {
      teamData[team].offense[pos].sort((a, b) => a.rank - b.rank);
    });
    Object.keys(teamData[team].defense).forEach(pos => {
      teamData[team].defense[pos].sort((a, b) => a.rank - b.rank);
    });
  });
  
  return teamData;
}

function buildFinalDepthCharts(teamData) {
  const result = {};
  
  const offenseTemplate = [
    { pos: 'QB', count: 1 },
    { pos: 'RB', count: 1 },
    { pos: 'WR', count: 3 },
    { pos: 'TE', count: 1 },
    { pos: 'LT', count: 1 },
    { pos: 'LG', count: 1 },
    { pos: 'C', count: 1 },
    { pos: 'RG', count: 1 },
    { pos: 'RT', count: 1 }
  ];
  
  const defenseTemplate = [
    { pos: 'LDE', count: 1 },
    { pos: 'LDT', count: 1 },
    { pos: 'RDT', count: 1 },
    { pos: 'RDE', count: 1 },
    { pos: 'LB', count: 2 },
    { pos: 'LCB', count: 1 },
    { pos: 'RCB', count: 1 },
    { pos: 'NB', count: 1 },
    { pos: 'FS', count: 1 },
    { pos: 'SS', count: 1 }
  ];
  
  Object.keys(teamData).forEach(team => {
    const offense = [];
    const defense = [];
    
    offenseTemplate.forEach(({ pos, count }) => {
      const players = teamData[team].offense[pos] || [];
      for (let i = 0; i < count; i++) {
        const starter = players[i] || null;
        const backup = players[i + count] || null;
        offense.push({
          pos: pos,
          starter: starter ? { name: starter.name, expiring: starter.expiring } : null,
          backup: backup ? { name: backup.name, expiring: backup.expiring } : null
        });
      }
    });
    
    defenseTemplate.forEach(({ pos, count }) => {
      const players = teamData[team].defense[pos] || [];
      for (let i = 0; i < count; i++) {
        const starter = players[i] || null;
        const backup = players[i + count] || null;
        defense.push({
          pos: pos,
          starter: starter ? { name: starter.name, expiring: starter.expiring } : null,
          backup: backup ? { name: backup.name, expiring: backup.expiring } : null
        });
      }
    });
    
    result[team] = { offense, defense };
  });
  
  return result;
}

const expiringPlayers = loadContracts();
const teamData = loadDepthCharts(expiringPlayers);
const finalData = buildFinalDepthCharts(teamData);

const outputPath = path.join(__dirname, '../teams/depth_charts_2026.json');
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
console.log(`Wrote depth charts to ${outputPath}`);
console.log(`Teams: ${Object.keys(finalData).length}`);

const chi = finalData['CHI'];
if (chi) {
  console.log('\nBears offense (11 positions):');
  chi.offense.forEach(p => {
    console.log(`  ${p.pos}: ${p.starter?.name || '-'} / ${p.backup?.name || '-'}`);
  });
  console.log('\nBears defense (11 positions):');
  chi.defense.forEach(p => {
    console.log(`  ${p.pos}: ${p.starter?.name || '-'} / ${p.backup?.name || '-'}`);
  });
}
