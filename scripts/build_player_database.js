const fs = require('fs');
const path = require('path');

const CURRENT_YEAR = 2026;
const REFERENCE_DATE = new Date('2026-04-24');

const DEPTH_CHART_TO_CANONICAL_POS = {
  QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FB: 'FB',
  LT: 'OT', RT: 'OT', LG: 'IOL', RG: 'IOL', C: 'IOL',
  LDE: 'EDGE', RDE: 'EDGE',
  LDT: 'DL', RDT: 'DL',
  LB: 'LB', WILL: 'LB', MIKE: 'LB', SAM: 'LB',
  LCB: 'CB', RCB: 'CB', NB: 'NB',
  SS: 'S', FS: 'S',
  K: 'K', P: 'P', LS: 'LS',
};

const TEAM_NAME_TO_ABBR = {
  Cardinals: 'ARI', Falcons: 'ATL', Ravens: 'BAL', Bills: 'BUF',
  Panthers: 'CAR', Bears: 'CHI', Bengals: 'CIN', Browns: 'CLE',
  Cowboys: 'DAL', Broncos: 'DEN', Lions: 'DET', Packers: 'GB',
  Texans: 'HOU', Colts: 'IND', Jaguars: 'JAX', Chiefs: 'KC',
  Raiders: 'LV', Chargers: 'LAC', Rams: 'LAR', Dolphins: 'MIA',
  Vikings: 'MIN', Patriots: 'NE', Saints: 'NO', Giants: 'NYG',
  Jets: 'NYJ', Eagles: 'PHI', Steelers: 'PIT', '49ers': 'SF',
  Seahawks: 'SEA', Buccaneers: 'TB', Titans: 'TEN', Commanders: 'WAS',
};

const POSITION_ELITE_APY_THRESHOLD = {
  QB: 30, EDGE: 18, OT: 16, CB: 15, WR: 18, DL: 14,
  LB: 11, S: 10, TE: 10, IOL: 9, RB: 7, K: 4, P: 4,
  LS: 1.5, FB: 3, NB: 10,
};

const POSITION_STARTER_APY_THRESHOLD = {
  QB: 12, EDGE: 8, OT: 7, CB: 6, WR: 7, DL: 6,
  LB: 5, S: 5, TE: 5, IOL: 4, RB: 3, K: 2, P: 2,
  LS: 0.8, FB: 1.5, NB: 5,
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

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateAge(birthDate) {
  if (!birthDate || birthDate.length < 8) return null;
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return null;
  let age = REFERENCE_DATE.getFullYear() - dob.getFullYear();
  const monthDiff = REFERENCE_DATE.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && REFERENCE_DATE.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function getPerformanceTier(position, apy, isStarter, isRookieDeal, draftRound) {
  if (!isStarter) return 'backup';
  const eliteThreshold = POSITION_ELITE_APY_THRESHOLD[position] || 10;
  const starterThreshold = POSITION_STARTER_APY_THRESHOLD[position] || 4;
  if (isRookieDeal) {
    if (draftRound && draftRound <= 1) return 'elite';
    if (draftRound && draftRound <= 2) return 'developing';
    if (draftRound && draftRound <= 4) return 'bridge';
    return 'bridge';
  }
  if (apy >= eliteThreshold) return 'elite';
  if (apy >= starterThreshold) return 'starter';
  return 'bridge';
}

function buildRosterMap(rosterRows) {
  const map = {};
  rosterRows.forEach(row => {
    if (!row.player_name) return;
    const key = normalizeName(row.player_name);
    const teamAbbr = row.team;
    map[key] = {
      birthDate: row.birth_date || null,
      height: row.height ? parseInt(row.height) : null,
      weight: row.weight ? parseInt(row.weight) : null,
      college: row.college || null,
      jerseyNumber: row.jersey_number ? parseInt(row.jersey_number) : null,
      yearsExp: row.years_exp ? parseInt(row.years_exp) : null,
      headshotUrl: row.headshot_url || null,
      espnId: row.espn_id || null,
      playerId: row.player_id || null,
      draftClub: row.draft_club || null,
      draftNumber: row.draft_number ? parseInt(row.draft_number) : null,
      entryYear: row.entry_year ? parseInt(row.entry_year) : null,
      rosterTeam: teamAbbr || null,
    };
  });
  return map;
}

function buildContractMap(contractRows) {
  const map = {};
  contractRows.forEach(row => {
    if (row.is_active !== 'True') return;
    const key = normalizeName(row.player);
    if (!map[key] || parseFloat(row.apy || 0) > parseFloat(map[key].apy || 0)) {
      map[key] = row;
    }
  });
  return map;
}

function resolveContractTeam(contractTeam) {
  if (!contractTeam) return null;
  const parts = contractTeam.split('/');
  const teamName = parts[parts.length - 1].trim();
  return TEAM_NAME_TO_ABBR[teamName] || null;
}

function main() {
  console.log('='.repeat(60));
  console.log('GM Ops: Building Universal Player Database');
  console.log('='.repeat(60));

  const depthCharts = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../data/teams/depth_charts_2026.json'), 'utf8'
  ));
  const contractRows = parseCSV(fs.readFileSync(
    path.join(__dirname, '../data/raw/nflverse/contracts.csv'), 'utf8'
  ));
  const rosterRows = parseCSV(fs.readFileSync(
    path.join(__dirname, '../data/raw/nflverse/rosters_2025.csv'), 'utf8'
  ));

  const rosterMap = buildRosterMap(rosterRows);
  const contractMap = buildContractMap(contractRows);

  console.log(`Loaded ${Object.keys(depthCharts).length} teams' depth charts`);
  console.log(`Loaded ${contractRows.length} contracts (${Object.keys(contractMap).length} active unique)`);
  console.log(`Loaded ${Object.keys(rosterMap).length} roster entries`);

  const allPlayers = {};
  let contractMatched = 0, contractMissing = 0;
  let rosterMatched = 0, rosterMissing = 0;

  for (const [team, chart] of Object.entries(depthCharts)) {
    const sides = [
      { side: 'offense', players: chart.offense || [] },
      { side: 'defense', players: chart.defense || [] },
    ];

    for (const { side, players } of sides) {
      for (const posGroup of players) {
        const dcPos = posGroup.pos;
        const canonicalPos = DEPTH_CHART_TO_CANONICAL_POS[dcPos];
        if (!canonicalPos) continue;

        ['starter', 'backup'].forEach(role => {
          const entry = posGroup[role];
          if (!entry || !entry.name) return;

          const playerName = entry.name;
          const nameKey = normalizeName(playerName);
          const isStarter = role === 'starter';
          const isExpiring = entry.expiring === true;

          const rosterInfo = rosterMap[nameKey];
          if (rosterInfo) rosterMatched++;
          else rosterMissing++;

          const contract = contractMap[nameKey];
          if (contract) contractMatched++;
          else contractMissing++;

          const birthDate = rosterInfo?.birthDate || null;
          const age = calculateAge(birthDate);

          let apy = 0, guaranteed = 0, yearSigned = null, contractYears = 0, totalValue = 0;
          let isRookieDeal = false, draftRound = null, draftYear = null;
          let hasContract = false;

          if (contract) {
            hasContract = true;
            apy = parseFloat(contract.apy) || 0;
            guaranteed = parseFloat(contract.guaranteed) || 0;
            yearSigned = parseInt(contract.year_signed) || null;
            contractYears = parseFloat(contract.years) || 0;
            totalValue = parseFloat(contract.value) || 0;
            draftRound = contract.draft_round ? parseFloat(contract.draft_round) : null;
            draftYear = contract.draft_year ? parseInt(contract.draft_year) : null;

            if (draftYear && (CURRENT_YEAR - draftYear) <= 4 && contractYears <= 5) {
              isRookieDeal = true;
            }
          }

          const yearsRemaining = isExpiring ? 0 :
            (yearSigned && contractYears ? Math.max(0, (yearSigned + contractYears) - CURRENT_YEAR) : null);

          const performanceTier = getPerformanceTier(canonicalPos, apy, isStarter, isRookieDeal, draftRound);

          const playerKey = `${team}_${nameKey}`;
          if (allPlayers[playerKey]) return;

          allPlayers[playerKey] = {
            name: playerName,
            team,
            position: canonicalPos,
            depthChartPos: dcPos,
            side,
            role,
            performanceTier,
            age,
            birthDate,
            height: rosterInfo?.height || null,
            weight: rosterInfo?.weight || null,
            college: rosterInfo?.college || null,
            jerseyNumber: rosterInfo?.jerseyNumber || null,
            yearsExp: rosterInfo?.yearsExp || null,
            headshotUrl: rosterInfo?.headshotUrl || null,
            espnId: rosterInfo?.espnId || null,
            contract: {
              hasContract,
              apy: hasContract ? Math.round(apy * 10) / 10 : null,
              guaranteed: hasContract ? Math.round(guaranteed * 10) / 10 : null,
              totalValue: hasContract ? Math.round(totalValue * 10) / 10 : null,
              yearsRemaining: yearsRemaining !== null ? Math.round(yearsRemaining * 10) / 10 : null,
              yearSigned,
              contractYears,
              isRookieDeal,
              isExpiring,
              draftRound,
              draftYear,
            },
          };
        });
      }
    }
  }

  console.log(`\nProcessed ${Object.keys(allPlayers).length} unique players`);
  console.log(`Contract matches: ${contractMatched} | Missing: ${contractMissing}`);
  console.log(`Roster matches: ${rosterMatched} | Missing: ${rosterMissing}`);

  const byTeam = {};
  for (const player of Object.values(allPlayers)) {
    if (!byTeam[player.team]) byTeam[player.team] = [];
    byTeam[player.team].push(player);
  }

  for (const team of Object.keys(byTeam)) {
    byTeam[team].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'starter' ? -1 : 1;
      return (b.contract.apy || 0) - (a.contract.apy || 0);
    });
  }

  const totalWithContract = Object.values(allPlayers).filter(p => p.contract.hasContract).length;
  const totalWithAge = Object.values(allPlayers).filter(p => p.age !== null).length;
  const totalExpiring = Object.values(allPlayers).filter(p => p.contract.isExpiring).length;

  const output = {
    meta: {
      generated: new Date().toISOString(),
      referenceDate: REFERENCE_DATE.toISOString().split('T')[0],
      draftYear: CURRENT_YEAR,
      totalPlayers: Object.keys(allPlayers).length,
      playersWithContract: totalWithContract,
      playersWithAge: totalWithAge,
      expiringContracts: totalExpiring,
      sources: ['nflverse/contracts.csv', 'nflverse/rosters_2025.csv', 'depth_charts_2026.json'],
    },
    teams: byTeam,
  };

  const outputPath = path.join(__dirname, '../data/teams/player_database.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  console.log('\n--- TEAM SUMMARY ---');
  for (const [team, players] of Object.entries(byTeam).sort()) {
    const starters = players.filter(p => p.role === 'starter').length;
    const backups = players.filter(p => p.role === 'backup').length;
    const withContract = players.filter(p => p.contract.hasContract).length;
    const expiring = players.filter(p => p.contract.isExpiring).length;
    console.log(`  ${team}: ${players.length} players (${starters}S/${backups}B), ${withContract} w/ contract, ${expiring} expiring`);
  }

  console.log('\n--- PLAYERS MISSING CONTRACT DATA ---');
  const missingContract = Object.values(allPlayers)
    .filter(p => !p.contract.hasContract && p.role === 'starter')
    .sort((a, b) => a.team.localeCompare(b.team));
  missingContract.forEach(p => {
    console.log(`  ${p.team} ${p.name} (${p.position}, ${p.depthChartPos}) - STARTER, no contract found`);
  });

  console.log(`\nTotal starters missing contracts: ${missingContract.length}`);
}

main();
