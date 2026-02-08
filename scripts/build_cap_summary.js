const fs = require('fs');
const path = require('path');

const CURRENT_YEAR = 2026;
const SALARY_CAP = 272.5;

const TEAM_NAME_TO_ABBR = {
  'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF',
  'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE',
  'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB',
  'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAX', 'Chiefs': 'KC',
  'Raiders': 'LV', 'Chargers': 'LAC', 'Rams': 'LAR', 'Dolphins': 'MIA',
  'Vikings': 'MIN', 'Patriots': 'NE', 'Saints': 'NO', 'Giants': 'NYG',
  'Jets': 'NYJ', 'Eagles': 'PHI', 'Steelers': 'PIT', 'Seahawks': 'SEA',
  '49ers': 'SF', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Commanders': 'WAS',
  'Washington': 'WAS', 'Football Team': 'WAS',
  'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
  'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
  'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
  'HOU': 'HOU', 'IND': 'IND', 'JAC': 'JAX', 'JAX': 'JAX', 'KC': 'KC',
  'LV': 'LV', 'LAC': 'LAC', 'LAR': 'LAR', 'MIA': 'MIA',
  'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO', 'NYG': 'NYG',
  'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT', 'SEA': 'SEA',
  'SF': 'SF', 'TB': 'TB', 'TEN': 'TEN', 'WAS': 'WAS',
};

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
    headers.forEach((h, i) => obj[h.trim()] = vals[i] || '');
    return obj;
  });
}

function main() {
  console.log('============================================================');
  console.log('GM Ops: Building Cap Summary');
  console.log('============================================================');

  const contractsRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'raw', 'nflverse', 'contracts.csv'), 'utf8');
  const contracts = parseCSV(contractsRaw);

  const playerTradeValues = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'teams', 'player_trade_values.json'), 'utf8'));

  const teamCaps = {};
  const allTeams = Object.keys(playerTradeValues.teams);
  allTeams.forEach(abbr => {
    teamCaps[abbr] = {
      salaryCap: SALARY_CAP,
      totalCommitted: 0,
      deadMoney: 0,
      capSpace: 0,
      activeContracts: 0,
      expiringContracts: 0,
      topContracts: [],
      rosterSize: 0,
    };
  });

  const activeContracts = contracts.filter(c => {
    if (c.is_active !== 'True') return false;
    const yearSigned = parseInt(c.year_signed) || 0;
    const years = parseFloat(c.years) || 0;
    if (yearSigned + years <= CURRENT_YEAR) return false;
    return true;
  });

  const teamContracts = {};
  const seen = {};

  activeContracts.forEach(c => {
    const rawTeam = c.team || '';
    const abbr = TEAM_NAME_TO_ABBR[rawTeam];
    if (!abbr || !teamCaps[abbr]) return;

    const key = `${c.player}_${abbr}`;
    if (seen[key]) return;
    seen[key] = true;

    const apy = parseFloat(c.apy) || 0;
    const guaranteed = parseFloat(c.guaranteed) || 0;
    const yearSigned = parseInt(c.year_signed) || CURRENT_YEAR;
    const years = parseFloat(c.years) || 1;
    const yearsElapsed = CURRENT_YEAR - yearSigned;
    const yearsRemaining = Math.max(0, years - yearsElapsed);
    const isExpiring = yearsRemaining <= 1;

    const capHit = apy;

    const signingBonus = guaranteed * 0.4;
    const proratedPerYear = signingBonus / years;
    const remainingProration = proratedPerYear * yearsRemaining;
    const deadCap = Math.min(remainingProration, capHit * 0.8);

    teamCaps[abbr].totalCommitted += capHit;
    teamCaps[abbr].deadMoney += deadCap;
    teamCaps[abbr].activeContracts++;

    if (!teamContracts[abbr]) teamContracts[abbr] = [];
    teamContracts[abbr].push({
      player: c.player,
      position: c.position,
      capHit: Math.round(apy * 10) / 10,
      yearsRemaining: Math.round(yearsRemaining * 10) / 10,
      isExpiring,
    });
  });

  for (const abbr of allTeams) {
    const ptv = playerTradeValues.teams[abbr] || [];
    teamCaps[abbr].rosterSize = ptv.length;
    teamCaps[abbr].expiringContracts = ptv.filter(p => p.isExpiring).length;

    teamCaps[abbr].totalCommitted = Math.round(teamCaps[abbr].totalCommitted * 10) / 10;
    teamCaps[abbr].deadMoney = Math.round(teamCaps[abbr].deadMoney * 10) / 10;
    teamCaps[abbr].capSpace = Math.round((SALARY_CAP - teamCaps[abbr].totalCommitted) * 10) / 10;

    const contracts = teamContracts[abbr] || [];
    contracts.sort((a, b) => b.capHit - a.capHit);
    teamCaps[abbr].topContracts = contracts.slice(0, 5).map(c => ({
      player: c.player,
      position: c.position,
      capHit: c.capHit,
    }));
  }

  const output = {
    meta: {
      generated: new Date().toISOString(),
      season: CURRENT_YEAR,
      salaryCap: SALARY_CAP,
    },
    teams: teamCaps,
  };

  const outPath = path.join(__dirname, '..', 'data', 'teams', 'cap_summary_2026.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outPath}`);

  console.log('\n--- CAP SUMMARY BY TEAM ---');
  const sorted = allTeams.sort((a, b) => teamCaps[b].capSpace - teamCaps[a].capSpace);
  sorted.forEach(abbr => {
    const t = teamCaps[abbr];
    const capLabel = t.capSpace >= 0 ? `$${t.capSpace}M space` : `-$${Math.abs(t.capSpace)}M over`;
    console.log(`  ${abbr}: ${capLabel} | $${t.totalCommitted}M committed | $${t.deadMoney}M dead | ${t.expiringContracts} expiring | ${t.rosterSize} players`);
  });
}

main();
