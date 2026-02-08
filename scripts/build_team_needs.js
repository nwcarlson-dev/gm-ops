const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TEAMS_DIR = path.join(DATA_DIR, 'teams');

const baselineNeeds = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'nflmdd_team_needs_2026.json'), 'utf8'));
const capSummary = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'cap_summary_2026.json'), 'utf8'));
const depthCharts = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'depth_charts_2026.json'), 'utf8'));
const playerTradeValues = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'player_trade_values.json'), 'utf8'));
const teamSchemes = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'team_schemes.json'), 'utf8'));
const teamIntel = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, 'team_intel.json'), 'utf8'));

const teams = baselineNeeds.teams || baselineNeeds;
const capTeams = capSummary.teams || capSummary;
const ptvTeams = playerTradeValues.teams || playerTradeValues;
const schemeTeams = teamSchemes.teams || teamSchemes;

const ABBR_TO_NAME = {
  'ARI': 'Cardinals', 'ATL': 'Falcons', 'BAL': 'Ravens', 'BUF': 'Bills',
  'CAR': 'Panthers', 'CHI': 'Bears', 'CIN': 'Bengals', 'CLE': 'Browns',
  'DAL': 'Cowboys', 'DEN': 'Broncos', 'DET': 'Lions', 'GB': 'Packers',
  'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars', 'JAC': 'Jaguars',
  'KC': 'Chiefs', 'LV': 'Raiders', 'LAC': 'Chargers', 'LAR': 'Rams',
  'MIA': 'Dolphins', 'MIN': 'Vikings', 'NE': 'Patriots', 'NO': 'Saints',
  'NYG': 'Giants', 'NYJ': 'Jets', 'PHI': 'Eagles', 'PIT': 'Steelers',
  'SF': '49ers', 'SEA': 'Seahawks', 'TB': 'Buccaneers', 'TEN': 'Titans',
  'WAS': 'Commanders'
};

const OFF_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OT', 'IOL'];
const DEF_POSITIONS = ['EDGE', 'DL', 'LB', 'CB', 'S'];

const SCHEME_ARCHETYPE_MAP = {
  offensive: {
    'Shanahan Wide Zone':  { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', TE: 'Move', WR: 'YAC Monster' },
    'Shanahan Concepts':   { OT: 'Athletic', IOL: 'Zone Blocker', RB: 'Zone Runner', TE: 'Move', WR: 'YAC Monster' },
    'Kubiak Zone Run':     { OT: 'Zone Blocker', IOL: 'Road Grader', RB: 'Workhorse', TE: 'Inline Blocker' },
    'West Coast':          { OT: 'Pass Protector', IOL: 'Pivot', WR: 'Route Technician', TE: 'Seam Stretcher', RB: 'Pass Catcher' },
    'West Coast Spread':   { OT: 'Pass Protector', IOL: 'Athletic', WR: 'Field Stretcher', TE: 'Seam Stretcher', RB: 'Scat Back' },
    'West Coast Power':    { OT: 'Mauler', IOL: 'Road Grader', RB: 'Power', WR: 'Field Stretcher', TE: 'Inline Blocker' },
    'West Coast Timing':   { OT: 'Pass Protector', IOL: 'Pivot', WR: 'Route Technician', TE: 'Move', RB: 'Scat Back' },
    'West Coast Zone':     { OT: 'Zone Blocker', IOL: 'Athletic', WR: 'YAC Monster', TE: 'Move', RB: 'Zone Runner' },
    'West Coast Balanced': { OT: 'Technician', IOL: 'Road Grader', WR: 'Possession', TE: 'Move', RB: 'Workhorse' },
    'Erhardt Perkins':     { OT: 'Mauler', IOL: 'Road Grader', WR: 'Contested Catch', TE: 'Move', RB: 'Dynamic Playmaker' },
    'Erhardt-Perkins':     { OT: 'Mauler', IOL: 'Road Grader', WR: 'Contested Catch', TE: 'Move', RB: 'Dynamic Playmaker' },
    'Air Raid':            { OT: 'Pass Protector', IOL: 'Athletic', WR: 'Field Stretcher', TE: 'Seam Stretcher', QB: 'Gunslinger' },
    'Power Gap':           { OT: 'Mauler', IOL: 'Road Grader', RB: 'Power', TE: 'Inline Blocker', WR: 'Contested Catch' },
    'Spread Option RPO':   { OT: 'Athletic', IOL: 'Zone Blocker', QB: 'Dual-Threat', RB: 'Dynamic Playmaker', WR: 'Field Stretcher' },
    'RPO Heavy':           { OT: 'Athletic', IOL: 'Zone Blocker', QB: 'Dual-Threat', RB: 'Dynamic Playmaker', WR: 'Field Stretcher' },
    'Vertical Deep Shot':  { OT: 'Pass Protector', WR: 'Field Stretcher', TE: 'Seam Stretcher', RB: 'Pass Catcher' },
    'Coryell Vertical':    { OT: 'Pass Protector', WR: 'Field Stretcher', TE: 'Seam Stretcher', RB: 'Scat Back' },
    '11 Personnel Spread': { OT: 'Pass Protector', IOL: 'Athletic', WR: 'Route Technician', TE: 'Move', RB: 'Pass Catcher' },
    'McVay Outside Zone':  { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', TE: 'Move', WR: 'YAC Monster' },
    'McVay Wide Zone':     { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', WR: 'YAC Monster' },
    'Power RPO':           { OT: 'Mauler', IOL: 'Road Grader', QB: 'Dual-Threat', RB: 'Power', TE: 'Inline Blocker' },
    'LaFleur Zone Concepts': { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', WR: 'YAC Monster', TE: 'Move' },
    'Monken Vertical':     { OT: 'Pass Protector', WR: 'Field Stretcher', TE: 'Seam Stretcher', QB: 'Pocket Passer' },
    'McCarthy West Coast': { OT: 'Pass Protector', IOL: 'Road Grader', WR: 'Contested Catch', TE: 'Move', RB: 'Power' },
    'Brady Spread':        { OT: 'Pass Protector', IOL: 'Athletic', WR: 'Contested Catch', TE: 'Seam Stretcher', RB: 'Pass Catcher' },
    'Nagy West Coast':     { OT: 'Technician', IOL: 'Pivot', WR: 'Route Technician', TE: 'Move', RB: 'Scat Back' },
    'Payton West Coast':   { OT: 'Technician', IOL: 'Road Grader', WR: 'Route Technician', TE: 'Seam Stretcher', RB: 'Scat Back' },
    'Robinson Zone Scheme': { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', WR: 'YAC Monster', TE: 'Move' },
    'Daboll Erhardt-Perkins': { OT: 'Mauler', IOL: 'Road Grader', WR: 'Field Stretcher', TE: 'Move', RB: 'Dynamic Playmaker' },
    'Reich Erhardt-Perkins': { OT: 'Mauler', IOL: 'Road Grader', WR: 'Contested Catch', TE: 'Move', RB: 'Dynamic Playmaker' },
    'Stefanski Wide Zone':  { OT: 'Zone Blocker', IOL: 'Athletic', RB: 'Zone Runner', WR: 'YAC Monster', TE: 'Move' },
    'McDaniel Zone Scheme': { OT: 'Zone Blocker', IOL: 'Road Grader', RB: 'Zone Runner', WR: 'Slot', TE: 'Inline Blocker' },
    'Petzing Balanced':     { OT: 'Mauler', IOL: 'Pivot', RB: 'Dynamic Playmaker', WR: 'Route Technician', TE: 'Move' },
    'Blough Concepts':      { OT: 'Pass Protector', IOL: 'Athletic', WR: 'Possession', RB: 'Pass Catcher' },
    'Mannion Zone Concepts': { OT: 'Zone Blocker', IOL: 'Athletic', WR: 'Field Stretcher', RB: 'Zone Runner' },
    'Macdonald Hybrid':     { OT: 'Mauler', IOL: 'Road Grader', WR: 'Route Technician', TE: 'Inline Blocker' },
    'Johnson Erhardt-Perkins': { OT: 'Mauler', IOL: 'Zone Blocker', WR: 'Contested Catch', TE: 'Move', RB: 'Dynamic Playmaker' },
    'Kubiak Concepts':      { OT: 'Zone Blocker', IOL: 'Road Grader', RB: 'Workhorse', TE: 'Inline Blocker' }
  },
  defensive: {
    '4-3 Under':           { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Sideline-to-Sideline', CB: 'Press-Man', S: 'Centerfield' },
    '4-3 Wide-9':          { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Coverage', CB: 'Press-Man', S: 'Centerfield' },
    '4-3 Attacking':       { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Thumper', CB: 'Technical', S: 'Hybrid' },
    '4-3 Cover 3':         { EDGE: 'Speed Rusher', DL: 'Anchor', LB: 'Coverage', CB: 'Zone', S: 'Centerfield' },
    '4-3 Attacking Front': { EDGE: 'Explosive', DL: 'Penetrator', LB: 'Thumper', CB: 'Physical', S: 'Hybrid' },
    '3-4 Multiple':        { EDGE: 'Power', DL: 'Two-Gap', LB: 'Sideline-to-Sideline', CB: 'Zone', S: 'Ballhawk' },
    '3-4 Multiple Blitz':  { EDGE: 'Power', DL: 'Penetrator', LB: 'Coverage', CB: 'Physical', S: 'Ballhawk' },
    '3-4 Base':            { EDGE: 'Power', DL: '3-Tech', LB: 'Run Stuffer', CB: 'Press-Man', S: 'Ballhawk' },
    '3-4 Pressure':        { EDGE: 'Long Arm', DL: 'Penetrator', LB: 'Blitzer', CB: 'Press-Man', S: 'Hybrid' },
    '3-4 Zone':            { EDGE: 'Power', DL: 'Anchor', LB: 'Versatile', CB: 'Zone', S: 'Ballhawk' },
    '3-4 Versatile':       { EDGE: 'Power', DL: 'Penetrator', LB: 'Coverage', CB: 'Technical', S: 'Box' },
    '3-4 Aggressive':      { EDGE: 'Explosive', DL: 'Penetrator', LB: 'Blitzer', CB: 'Man-Press', S: 'Ballhawk' },
    '3-4 Exotic Pressures': { EDGE: 'Bendy', DL: 'Penetrator', LB: 'Coverage', CB: 'Technical', S: 'Centerfield' },
    '3-4 Ravens Style':    { EDGE: 'Explosive', DL: 'Two-Gap', LB: 'Coverage', CB: 'Zone', S: 'Hybrid' },
    '3-4 Light Box':       { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Coverage', CB: 'Ballhawk', S: 'Centerfield' },
    'Fangio Two-High':     { EDGE: 'Technical', DL: 'Anchor', LB: 'Coverage', CB: 'Zone', S: 'Centerfield' },
    'Multiple Front':      { EDGE: 'Explosive', DL: 'Versatile', LB: 'Thumper', CB: 'Press-Man', S: 'Box' },
    'Flores Pressure':     { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Blitzer', CB: 'Technical', S: 'Centerfield' },
    'Aggressive Multiple': { EDGE: 'Bendy', DL: 'Penetrator', LB: 'Coverage', CB: 'Man-Press', S: 'Hybrid' },
    'Disguised 3-4':       { EDGE: 'Power', DL: 'Two-Gap', LB: 'Sideline-to-Sideline', CB: 'Man-Press', S: 'Hybrid' },
    'Hybrid Multiple':     { EDGE: 'Power', DL: 'Two-Gap', LB: 'Thumper', CB: 'Physical', S: 'Ballhawk' },
    'Cover 3 Zone':        { EDGE: 'Power', DL: 'Two-Gap', LB: 'Run Stuffer', CB: 'Physical', S: 'Centerfield' },
    'Glenn Hybrid Man':    { EDGE: 'Bendy', DL: 'Penetrator', LB: 'Coverage', CB: 'Ballhawk', S: 'Playmaker' },
    'Leonhard Quarters':   { EDGE: 'Power', DL: 'Two-Gap', LB: 'Sideline-to-Sideline', CB: 'Man-Press', S: 'Ballhawk' },
    'Gannon Quarters':     { EDGE: 'Power', DL: 'Anchor', LB: 'Thumper', CB: 'Zone', S: 'Ballhawk' }
  }
};

const DEFAULT_OFF_ARCHETYPE = { OT: 'Technician', IOL: 'Road Grader', WR: 'Contested Catch', TE: 'Move', RB: 'Dynamic Playmaker', QB: 'Pocket Passer' };
const DEFAULT_DEF_ARCHETYPE = { EDGE: 'Speed Rusher', DL: 'Penetrator', LB: 'Sideline-to-Sideline', CB: 'Press-Man', S: 'Centerfield' };

function normalizePos(pos) {
  const map = {
    'ED': 'EDGE', 'DE': 'EDGE', 'OLB': 'EDGE', 'LOLB': 'EDGE', 'ROLB': 'EDGE',
    'LDE': 'EDGE', 'RDE': 'EDGE',
    'DT': 'DL', 'NT': 'DL', 'IDL': 'DL',
    'ILB': 'LB', 'MLB': 'LB', 'RILB': 'LB', 'LILB': 'LB', 'WLB': 'LB', 'SLB': 'LB',
    'LT': 'OT', 'RT': 'OT', 'T': 'OT',
    'LG': 'IOL', 'RG': 'IOL', 'C': 'IOL', 'G': 'IOL',
    'FS': 'S', 'SS': 'S',
    'Defensive Tackle': 'DL', 'Defensive Line': 'DL',
    'Edge Rusher': 'EDGE', 'Linebacker': 'LB', 'Cornerback': 'CB',
    'Safety': 'S', 'Wide Receiver': 'WR', 'Running Back': 'RB',
    'Tight End': 'TE', 'Quarterback': 'QB',
    'Offensive Tackle': 'OT', 'Interior O-Line': 'IOL'
  };
  return map[pos] || pos;
}

function findSchemeArchetype(offScheme, defScheme, pos) {
  if (OFF_POSITIONS.includes(pos)) {
    for (const [schemeName, archetypes] of Object.entries(SCHEME_ARCHETYPE_MAP.offensive)) {
      if (offScheme && offScheme.toLowerCase().includes(schemeName.toLowerCase())) {
        if (archetypes[pos]) return archetypes[pos];
      }
    }
    for (const [schemeName, archetypes] of Object.entries(SCHEME_ARCHETYPE_MAP.offensive)) {
      const words = schemeName.toLowerCase().split(/\s+/);
      if (offScheme && words.some(w => w.length > 3 && offScheme.toLowerCase().includes(w))) {
        if (archetypes[pos]) return archetypes[pos];
      }
    }
    return DEFAULT_OFF_ARCHETYPE[pos] || 'Versatile';
  } else {
    for (const [schemeName, archetypes] of Object.entries(SCHEME_ARCHETYPE_MAP.defensive)) {
      if (defScheme && defScheme.toLowerCase().includes(schemeName.toLowerCase())) {
        if (archetypes[pos]) return archetypes[pos];
      }
    }
    for (const [schemeName, archetypes] of Object.entries(SCHEME_ARCHETYPE_MAP.defensive)) {
      const words = schemeName.toLowerCase().split(/\s+/);
      if (defScheme && words.some(w => w.length > 3 && defScheme.toLowerCase().includes(w))) {
        if (archetypes[pos]) return archetypes[pos];
      }
    }
    return DEFAULT_DEF_ARCHETYPE[pos] || 'Versatile';
  }
}

function getRosterNote(abbr, pos) {
  const players = ptvTeams[abbr];
  if (!players) return null;
  const posPlayers = players.filter(p => normalizePos(p.position) === pos || normalizePos(p.depthChartPos) === pos);
  if (posPlayers.length === 0) return null;

  const starters = posPlayers.filter(p => p.role === 'starter');
  const aging = starters.filter(p => p.age >= 32);
  const expiring = starters.filter(p => p.isExpiring);
  const lowTier = starters.filter(p => p.performanceTier === 'backup' || p.performanceTier === 'bridge');

  const parts = [];
  if (aging.length > 0) {
    parts.push(aging.map(p => `${p.name} (${p.age}) aging`).join('; '));
  }
  if (expiring.length > 0) {
    const names = expiring.filter(p => !aging.some(a => a.name === p.name)).map(p => p.name);
    if (names.length > 0) {
      parts.push(`${names.join(', ')} on expiring ${names.length === 1 ? 'contract' : 'contracts'}`);
    }
  }
  if (lowTier.length > 0) {
    const names = lowTier.filter(p => !aging.some(a => a.name === p.name) && !expiring.some(e => e.name === p.name)).map(p => p.name);
    if (names.length > 0) {
      parts.push(`${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} only ${lowTier[0].performanceTier}-level`);
    }
  }
  if (starters.length === 0 && posPlayers.length > 0) {
    parts.push('No clear starter on roster');
  }
  return parts.length > 0 ? parts.join('. ') + '.' : null;
}

function buildTeamNeeds(abbr) {
  const teamName = ABBR_TO_NAME[abbr];
  if (!teamName) return null;

  const baseline = teams[abbr];
  if (!baseline) return null;

  const scheme = schemeTeams[teamName] || {};
  const offScheme = scheme.offScheme || 'TBD';
  const defScheme = scheme.defScheme || 'TBD';
  const intel = teamIntel[abbr] || [];

  const offNeeds = [];
  const defNeeds = [];

  function buildNeed(pos, priority) {
    const archetype = findSchemeArchetype(offScheme, defScheme, pos);

    const allNotes = [];
    const intelNotes = intel.filter(i => i.pos === pos);
    intelNotes.forEach(i => allNotes.push(i.note));

    const rosterNote = getRosterNote(abbr, pos);
    if (rosterNote) {
      allNotes.push(rosterNote);
    }

    const note = allNotes.join(' ');

    return { pos, archetype, priority, note };
  }

  baseline.primary.forEach(pos => {
    const need = buildNeed(pos, 'high');
    if (OFF_POSITIONS.includes(pos)) offNeeds.push(need);
    else defNeeds.push(need);
  });

  baseline.secondary.slice(0, 4).forEach(pos => {
    const need = buildNeed(pos, 'medium');
    if (OFF_POSITIONS.includes(pos)) offNeeds.push(need);
    else defNeeds.push(need);
  });

  return { offNeeds, defNeeds };
}

const output = {
  meta: {
    generated: new Date().toISOString(),
    description: 'Auto-generated team needs with archetypes and contextual notes. Re-run scripts/build_team_needs.js to regenerate.',
    inputs: ['nflmdd_team_needs_2026.json', 'team_schemes.json', 'depth_charts_2026.json', 'cap_summary_2026.json', 'player_trade_values.json', 'team_intel.json']
  },
  teams: {}
};

const allAbbrs = Object.keys(teams);
let totalNeeds = 0;
let needsWithNotes = 0;

allAbbrs.forEach(abbr => {
  const result = buildTeamNeeds(abbr);
  if (result) {
    output.teams[abbr] = result;
    const all = [...result.offNeeds, ...result.defNeeds];
    totalNeeds += all.length;
    needsWithNotes += all.filter(n => n.note && n.note.trim().length > 0).length;
  }
});

const outputPath = path.join(TEAMS_DIR, 'team_needs_detailed.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`Generated team_needs_detailed.json`);
console.log(`  Teams: ${Object.keys(output.teams).length}`);
console.log(`  Total needs: ${totalNeeds}`);
console.log(`  Needs with notes: ${needsWithNotes} (${Math.round(needsWithNotes/totalNeeds*100)}%)`);
console.log(`  Output: ${outputPath}`);
