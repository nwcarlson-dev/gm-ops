const fs = require('fs');
const path = require('path');

const CURRENT_YEAR = 2026;
const REFERENCE_DATE = new Date('2026-04-24');

const POSITION_BASE_VALUES = {
  QB:   { elite: 1800, starter: 800, bridge: 150, backup: 30 },
  EDGE: { elite: 1200, starter: 600, bridge: 200, backup: 60 },
  OT:   { elite: 900, starter: 500, bridge: 150, backup: 40 },
  CB:   { elite: 800, starter: 450, bridge: 130, backup: 35 },
  WR:   { elite: 800, starter: 450, bridge: 130, backup: 35 },
  DL:   { elite: 700, starter: 400, bridge: 120, backup: 30 },
  LB:   { elite: 550, starter: 300, bridge: 100, backup: 25 },
  S:    { elite: 500, starter: 280, bridge: 90, backup: 20 },
  TE:   { elite: 450, starter: 250, bridge: 80, backup: 20 },
  IOL:  { elite: 400, starter: 220, bridge: 70, backup: 15 },
  RB:   { elite: 350, starter: 180, bridge: 60, backup: 15 },
  K:    { elite: 40, starter: 20, bridge: 10, backup: 5 },
  P:    { elite: 40, starter: 20, bridge: 10, backup: 5 },
  LS:   { elite: 10, starter: 5, bridge: 2, backup: 1 },
  FB:   { elite: 60, starter: 30, bridge: 15, backup: 5 },
  NB:   { elite: 500, starter: 280, bridge: 90, backup: 20 },
};

const POSITION_PRIME_WINDOWS = {
  QB:   { start: 25, peak: 28, end: 34 },
  EDGE: { start: 23, peak: 26, end: 30 },
  OT:   { start: 24, peak: 27, end: 32 },
  CB:   { start: 23, peak: 26, end: 30 },
  WR:   { start: 23, peak: 26, end: 30 },
  DL:   { start: 24, peak: 27, end: 31 },
  LB:   { start: 23, peak: 26, end: 30 },
  S:    { start: 23, peak: 26, end: 31 },
  TE:   { start: 24, peak: 27, end: 31 },
  IOL:  { start: 24, peak: 27, end: 32 },
  RB:   { start: 22, peak: 24, end: 27 },
  K:    { start: 24, peak: 30, end: 40 },
  P:    { start: 24, peak: 30, end: 40 },
  LS:   { start: 24, peak: 30, end: 40 },
  FB:   { start: 23, peak: 26, end: 30 },
  NB:   { start: 23, peak: 26, end: 30 },
};

const POSITION_AVG_APY = {
  QB: 35, EDGE: 20, OT: 18, CB: 16, WR: 20, DL: 15,
  LB: 12, S: 12, TE: 12, IOL: 10, RB: 8, K: 4, P: 4,
  LS: 1.5, FB: 3, NB: 12,
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

function getPerformanceTier(position, apy, isStarter, isRookieDeal, draftRound) {
  if (!isStarter) return 'backup';

  const eliteThreshold = POSITION_ELITE_APY_THRESHOLD[position] || 10;
  const starterThreshold = POSITION_STARTER_APY_THRESHOLD[position] || 4;

  if (isRookieDeal) {
    if (draftRound && draftRound <= 1) return 'elite';
    if (draftRound && draftRound <= 3) return 'starter';
    if (draftRound && draftRound <= 5) return 'bridge';
    return 'bridge';
  }

  if (apy >= eliteThreshold) return 'elite';
  if (apy >= starterThreshold) return 'starter';
  return 'bridge';
}

const DEPTH_CHART_TO_VALUE_POS = {
  QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE',
  LT: 'OT', RT: 'OT', LG: 'IOL', RG: 'IOL', C: 'IOL',
  LDE: 'EDGE', RDE: 'EDGE',
  LDT: 'DL', RDT: 'DL',
  LB: 'LB', WILL: 'LB', MIKE: 'LB', SAM: 'LB',
  LCB: 'CB', RCB: 'CB', NB: 'NB',
  SS: 'S', FS: 'S',
  K: 'K', P: 'P', LS: 'LS', FB: 'FB',
};

const CONTRACT_POS_TO_VALUE_POS = {
  QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FB: 'FB',
  LT: 'OT', RT: 'OT', LG: 'IOL', RG: 'IOL', C: 'IOL',
  ED: 'EDGE', IDL: 'DL', LB: 'LB', CB: 'CB', S: 'S',
  K: 'K', P: 'P', LS: 'LS',
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

function getAgeCurveMultiplier(position, age) {
  if (age === null) return 0.85;
  const prime = POSITION_PRIME_WINDOWS[position] || POSITION_PRIME_WINDOWS.LB;

  if (age < prime.start) {
    return 0.80 + (age - 20) * 0.05;
  } else if (age <= prime.peak) {
    return 0.95 + ((age - prime.start) / (prime.peak - prime.start)) * 0.05;
  } else if (age <= prime.end) {
    const decline = (age - prime.peak) / (prime.end - prime.peak);
    return 1.0 - (decline * 0.35);
  } else {
    const yearsOver = age - prime.end;
    return Math.max(0.1, 0.65 - (yearsOver * 0.15));
  }
}

function getContractModifier(apy, position, yearsRemaining, isRookieDeal) {
  const avgAPY = POSITION_AVG_APY[position] || 10;
  const marketRatio = apy / avgAPY;

  if (isRookieDeal) {
    let modifier = 1.0;
    if (yearsRemaining >= 3) modifier = 1.25;
    else if (yearsRemaining >= 2) modifier = 1.15;
    else if (yearsRemaining >= 1) modifier = 1.0;
    else modifier = 0.75;
    return modifier;
  }

  let modifier = 1.0;
  if (marketRatio < 0.5) {
    modifier = 1.25;
  } else if (marketRatio < 0.75) {
    modifier = 1.1;
  } else if (marketRatio < 1.0) {
    modifier = 1.0;
  } else if (marketRatio < 1.3) {
    modifier = 0.9;
  } else if (marketRatio < 1.6) {
    modifier = 0.75;
  } else {
    modifier = 0.55;
  }

  if (yearsRemaining >= 3) {
    modifier *= 1.05;
  } else if (yearsRemaining <= 1) {
    modifier *= 0.8;
  } else if (yearsRemaining === 0) {
    modifier *= 0.6;
  }

  return modifier;
}

function estimateDeadCap(guaranteed, yearSigned, years) {
  const yearsElapsed = CURRENT_YEAR - yearSigned;
  if (yearsElapsed <= 0) return guaranteed;
  if (yearsElapsed >= years) return 0;

  const frontLoadFactor = 0.6;
  const annualBase = guaranteed / years;
  const frontLoaded = annualBase * frontLoadFactor;
  const backLoaded = annualBase * (1 - frontLoadFactor) / (years - 1);

  let amortized = 0;
  for (let y = 0; y < yearsElapsed; y++) {
    if (y === 0) amortized += frontLoaded;
    else amortized += backLoaded;
  }

  return Math.max(0, guaranteed - amortized);
}

function determineEligibility(player) {
  const { position, age, apy, guaranteed, yearsRemaining, yearSigned, isStarter, tradeValue } = player;

  if (position === 'QB' && isStarter && apy >= 30 && age < 34 && yearsRemaining >= 2) {
    return { tradeable: false, reason: 'Franchise QB under long-term contract' };
  }

  const deadCap = estimateDeadCap(guaranteed, yearSigned, player.contractYears);
  player.deadCap = Math.round(deadCap * 10) / 10;

  if (deadCap > 50 && yearsRemaining >= 3) {
    return { tradeable: false, reason: `$${Math.round(deadCap)}M dead cap hit` };
  }

  if (yearSigned === CURRENT_YEAR && apy >= 15 && yearsRemaining >= 3) {
    return { tradeable: false, reason: 'Just signed extension — Year 1 of new deal' };
  }

  if (yearSigned === CURRENT_YEAR - 1 && apy >= 25 && yearsRemaining >= 3 && guaranteed > 60) {
    return { tradeable: false, reason: `Recent mega-deal — $${Math.round(guaranteed)}M guaranteed` };
  }

  const premiumPositions = ['QB', 'EDGE', 'OT', 'CB', 'WR', 'DL'];
  if (isStarter && age !== null && age <= 25 && yearsRemaining >= 3
      && premiumPositions.includes(position)
      && (player.performanceTier === 'elite' || (player.isRookieDeal && player.draftRound && player.draftRound <= 2))) {
    return { tradeable: false, reason: 'Young cornerstone player under team control' };
  }

  return { tradeable: true, reason: null };
}

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildRosterBirthDateMap(rosterRows) {
  const map = {};
  rosterRows.forEach(row => {
    if (!row.player_name || !row.birth_date) return;
    const key = normalizeName(row.player_name);
    if (row.birth_date && row.birth_date.length >= 8) {
      map[key] = row.birth_date;
    }
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

function main() {
  console.log('='.repeat(60));
  console.log('GM Ops: Building Player Trade Values');
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

  const birthDateMap = buildRosterBirthDateMap(rosterRows);
  const contractMap = buildContractMap(contractRows);

  console.log(`Loaded ${Object.keys(depthCharts).length} teams' depth charts`);
  console.log(`Loaded ${contractRows.length} contracts (${Object.keys(contractMap).length} active unique)`);
  console.log(`Loaded ${Object.keys(birthDateMap).length} birth dates from rosters`);

  const allPlayers = {};
  let matched = 0, unmatched = 0, noAge = 0;

  const HISTORICAL_COMPS = [
    { name: 'Elite young WR trade', example: 'Stefon Diggs 2020', value: 1700 },
    { name: 'Aging star WR trade', example: 'Davante Adams 2024', value: 300 },
    { name: 'Star CB trade', example: 'Jalen Ramsey 2019', value: 3800 },
    { name: 'Elite OT trade', example: 'Laremy Tunsil 2025', value: 1200 },
    { name: 'Bust QB trade', example: 'Kenny Pickett 2024', value: 150 },
    { name: 'Aging star DL trade', example: 'Leonard Williams 2024', value: 650 },
  ];

  for (const [team, chart] of Object.entries(depthCharts)) {
    const sides = [
      { side: 'offense', players: chart.offense || [] },
      { side: 'defense', players: chart.defense || [] },
    ];

    for (const { side, players } of sides) {
      for (const posGroup of players) {
        const dcPos = posGroup.pos;
        const valuePos = DEPTH_CHART_TO_VALUE_POS[dcPos];
        if (!valuePos) continue;

        ['starter', 'backup'].forEach(role => {
          const entry = posGroup[role];
          if (!entry || !entry.name) return;

          const playerName = entry.name;
          const nameKey = normalizeName(playerName);
          const isStarter = role === 'starter';
          const isExpiring = entry.expiring === true;

          const birthDate = birthDateMap[nameKey];
          const age = calculateAge(birthDate);
          if (!birthDate) noAge++;

          const contract = contractMap[nameKey];

          let apy = 0, guaranteed = 0, yearSigned = 2024, contractYears = 1, totalValue = 0;
          let isRookieDeal = false, draftRound = null;
          let contractFound = false;

          if (contract) {
            matched++;
            contractFound = true;
            apy = parseFloat(contract.apy) || 0;
            guaranteed = parseFloat(contract.guaranteed) || 0;
            yearSigned = parseInt(contract.year_signed) || 2024;
            contractYears = parseFloat(contract.years) || 1;
            totalValue = parseFloat(contract.value) || 0;
            draftRound = contract.draft_round ? parseFloat(contract.draft_round) : null;

            const draftYear = contract.draft_year ? parseInt(contract.draft_year) : null;
            if (draftYear && (CURRENT_YEAR - draftYear) <= 4 && contractYears <= 5) {
              isRookieDeal = true;
            }
          } else {
            unmatched++;
          }

          const yearsRemaining = isExpiring ? 0 : Math.max(0, (yearSigned + contractYears) - CURRENT_YEAR);
          const performanceTier = getPerformanceTier(valuePos, apy, isStarter, isRookieDeal, draftRound);
          const baseValues = POSITION_BASE_VALUES[valuePos] || POSITION_BASE_VALUES.LB;
          const baseValue = baseValues[performanceTier] || baseValues.backup;
          const ageMultiplier = getAgeCurveMultiplier(valuePos, age);
          const contractModifier = contractFound
            ? getContractModifier(apy, valuePos, yearsRemaining, isRookieDeal)
            : 1.0;

          let tradeValue = Math.round(baseValue * ageMultiplier * contractModifier);
          tradeValue = Math.max(0, tradeValue);

          const playerData = {
            name: playerName,
            team,
            position: valuePos,
            depthChartPos: dcPos,
            role: isStarter ? 'starter' : 'backup',
            performanceTier,
            age,
            birthDate: birthDate || null,
            tradeValue,
            apy: Math.round(apy * 10) / 10,
            guaranteed: Math.round(guaranteed * 10) / 10,
            totalContractValue: Math.round(totalValue * 10) / 10,
            yearsRemaining: Math.round(yearsRemaining * 10) / 10,
            yearSigned,
            contractYears,
            isRookieDeal,
            isExpiring,
            draftRound,
            contractFound,
          };

          const eligibility = determineEligibility({
            ...playerData,
            isStarter,
          });
          playerData.tradeable = eligibility.tradeable;
          playerData.tradeBlockedReason = eligibility.reason;

          const playerKey = `${team}_${dcPos}_${role}`;
          allPlayers[playerKey] = playerData;
        });
      }
    }
  }

  console.log(`\nProcessed ${Object.keys(allPlayers).length} players`);
  console.log(`Contract matches: ${matched} | No match: ${unmatched} | No age data: ${noAge}`);

  const byTeam = {};
  for (const [key, player] of Object.entries(allPlayers)) {
    if (!byTeam[player.team]) byTeam[player.team] = [];
    byTeam[player.team].push(player);
  }

  for (const team of Object.keys(byTeam)) {
    byTeam[team].sort((a, b) => b.tradeValue - a.tradeValue);
  }

  const output = {
    meta: {
      generated: new Date().toISOString(),
      referenceDate: REFERENCE_DATE.toISOString().split('T')[0],
      totalPlayers: Object.keys(allPlayers).length,
      tradeableCount: Object.values(allPlayers).filter(p => p.tradeable).length,
      untradeableCount: Object.values(allPlayers).filter(p => !p.tradeable).length,
      notes: 'Trade values expressed in same point system as draft picks. Calibrated against recent NFL player trades.',
    },
    teams: byTeam,
  };

  const outputPath = path.join(__dirname, '../data/teams/player_trade_values.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  console.log('\n--- SUMMARY BY TEAM ---');
  const teamSummaries = [];
  for (const [team, players] of Object.entries(byTeam).sort()) {
    const tradeable = players.filter(p => p.tradeable).length;
    const untradeable = players.filter(p => !p.tradeable).length;
    const topPlayer = players[0];
    teamSummaries.push({ team, total: players.length, tradeable, untradeable, topPlayer: topPlayer.name, topValue: topPlayer.tradeValue });
  }
  teamSummaries.forEach(t => {
    console.log(`  ${t.team}: ${t.total} players (${t.tradeable} tradeable, ${t.untradeable} locked) | Top: ${t.topPlayer} (${t.topValue} pts)`);
  });

  console.log('\n--- UNTRADEABLE PLAYERS ---');
  const untradeable = Object.values(allPlayers)
    .filter(p => !p.tradeable)
    .sort((a, b) => b.tradeValue - a.tradeValue);
  untradeable.forEach(p => {
    console.log(`  ${p.team} ${p.name} (${p.position}, age ${p.age || '?'}) — ${p.tradeBlockedReason}`);
  });

  console.log('\n--- TOP 25 MOST VALUABLE TRADEABLE PLAYERS ---');
  const topTradeable = Object.values(allPlayers)
    .filter(p => p.tradeable)
    .sort((a, b) => b.tradeValue - a.tradeValue)
    .slice(0, 25);
  topTradeable.forEach((p, i) => {
    const pickEquiv = tradeValueToPickDescription(p.tradeValue);
    console.log(`  ${i + 1}. ${p.team} ${p.name} (${p.position}/${p.performanceTier}, ${p.age || '?'}yo) — ${p.tradeValue} pts ≈ ${pickEquiv} | APY: $${p.apy}M | ${p.yearsRemaining}yr left`);
  });

  console.log('\n--- CALIBRATION CHECK ---');
  console.log('Real-world trade comps for reference:');
  HISTORICAL_COMPS.forEach(c => {
    console.log(`  ${c.example}: ~${c.value} pts (${tradeValueToPickDescription(c.value)})`);
  });
}

function tradeValueToPickDescription(value) {
  if (value >= 3000) return '#1 overall';
  if (value >= 2200) return 'Top-3 pick';
  if (value >= 1700) return 'Top-5 pick';
  if (value >= 1300) return 'Top-10 pick';
  if (value >= 1000) return 'Mid 1st';
  if (value >= 590) return 'Late 1st';
  if (value >= 400) return 'Early 2nd';
  if (value >= 270) return '2nd/3rd round';
  if (value >= 150) return '3rd/4th round';
  if (value >= 100) return '4th round';
  if (value >= 42) return '5th round';
  if (value >= 18) return '6th round';
  if (value >= 5) return '7th round';
  return 'Minimal';
}

main();
