const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'teams', 'player_database.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'teams', 'player_database.json');
const SKILL_MAP_PATH = path.join(__dirname, '..', 'data', 'mappings', 'madden_skill_map.json');
const SCHEME_PATH = path.join(__dirname, '..', 'data', 'schemes', 'scheme_skill_weights.json');

const POSITION_SKILLS = {
  QB: ['armStrength', 'accuracyShort', 'accuracyMedium', 'accuracyDeep', 'releaseSpeed', 'decisionMaking', 'pocketPresence', 'mobility', 'playAction', 'leadership', 'contactAggression'],
  RB: ['vision', 'acceleration', 'tackleBreaking', 'elusiveness', 'passCatching', 'passProtection', 'contactAggression', 'ballSecurity'],
  FB: ['runBlocking', 'passProtection', 'shortAreaPower', 'tackleBreaking', 'contactAggression', 'passCatching', 'speed'],
  WR: ['routeRunning', 'release', 'separation', 'catchRadius', 'hands', 'yacAbility', 'contestedCatches', 'contactAggression', 'decisionMaking'],
  TE: ['runBlocking', 'routeRunning', 'hands', 'yacAbility', 'contestedCatches', 'seamThreat', 'redZoneTarget', 'contactAggression'],
  OT: ['passProtection', 'runBlocking', 'anchor', 'footwork', 'awareness', 'powerAtPOA', 'contactAggression'],
  OG: ['runBlocking', 'passProtection', 'awareness', 'anchor', 'pullAbility', 'doubleTeams', 'contactAggression'],
  OC: ['runBlocking', 'passProtection', 'awareness', 'anchor', 'snapping', 'reachAbility', 'leadership'],
  IDL: ['runStuffing', 'passRushMoves', 'blockShedding', 'anchor', 'penetration', 'doubleTeamResistance', 'pursuit', 'contactAggression'],
  EDGE: ['passRushMoves', 'speedToPower', 'bendFlexibility', 'runDefense', 'blockShedding', 'pursuit', 'coverageAbility', 'contactAggression'],
  LB: ['runDefense', 'blockShedding', 'tackling', 'pursuit', 'zoneCoverage', 'manCoverage', 'blitzing', 'instincts', 'contactAggression'],
  DB: ['manCoverage', 'zoneCoverage', 'pressTechnique', 'ballSkills', 'tackling', 'range', 'instincts', 'blitzing', 'contactAggression'],
  K: ['legStrength', 'accuracy', 'clutch', 'kickoffDistance', 'kickoffHangtime'],
  P: ['legStrength', 'hangtime', 'directional', 'consistency'],
  LS: ['longSnapping', 'tackling', 'consistency']
};

const POS_MAP = {
  QB: 'QB', RB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE',
  OT: 'OT', IOL: 'OG', C: 'OC', OG: 'OG',
  DL: 'IDL', DT: 'IDL', NT: 'IDL',
  EDGE: 'EDGE', DE: 'EDGE', OLB: 'EDGE',
  LB: 'LB', ILB: 'LB', MLB: 'LB',
  CB: 'DB', S: 'DB', NB: 'DB', FS: 'DB', SS: 'DB',
  K: 'K', P: 'P', LS: 'LS'
};

const SOURCE_WEIGHTS = {
  pff: 0.30,
  madden: 0.25,
  nflStats: 0.20,
  contract: 0.10,
  draftCapital: 0.10,
  tier: 0.05
};

function redistributeWeights(availableSources) {
  const available = {};
  let totalAvailable = 0;
  for (const src of availableSources) {
    if (SOURCE_WEIGHTS[src] != null) {
      available[src] = SOURCE_WEIGHTS[src];
      totalAvailable += SOURCE_WEIGHTS[src];
    }
  }
  if (totalAvailable === 0) return {};
  const result = {};
  for (const [src, w] of Object.entries(available)) {
    result[src] = w / totalAvailable;
  }
  return result;
}

function madden99to2080(value) {
  if (value == null) return null;
  return 20 + (value / 99) * 60;
}

function pffGradeToBase(pffGrade) {
  if (pffGrade == null) return null;
  if (pffGrade >= 92) return 75 + (pffGrade - 92) * 0.625;
  if (pffGrade >= 85) return 68 + (pffGrade - 85) * 1.0;
  if (pffGrade >= 80) return 63 + (pffGrade - 80) * 1.0;
  if (pffGrade >= 75) return 58 + (pffGrade - 75) * 1.0;
  if (pffGrade >= 70) return 53 + (pffGrade - 70) * 1.0;
  if (pffGrade >= 65) return 49 + (pffGrade - 65) * 0.8;
  if (pffGrade >= 60) return 45 + (pffGrade - 60) * 0.8;
  if (pffGrade >= 55) return 41 + (pffGrade - 55) * 0.8;
  if (pffGrade >= 50) return 37 + (pffGrade - 50) * 0.8;
  if (pffGrade >= 45) return 33 + (pffGrade - 45) * 0.8;
  return 25 + (pffGrade / 45) * 8;
}

function tierToBase(tier) {
  switch (tier) {
    case 'elite': return 68;
    case 'above_average': return 58;
    case 'average': return 50;
    case 'below_average': return 42;
    case 'developing': return 38;
    default: return 45;
  }
}

function contractToBase(contract) {
  if (!contract || !contract.hasContract) return null;
  const apy = contract.apy || 0;
  if (apy >= 40) return 72;
  if (apy >= 25) return 65;
  if (apy >= 15) return 58;
  if (apy >= 8) return 52;
  if (apy >= 4) return 46;
  if (apy >= 1.5) return 40;
  return 35;
}

function draftCapitalToBase(contract) {
  if (!contract) return null;
  const round = contract.draftRound;
  if (round == null) return null;
  if (round === 1) return 65;
  if (round === 2) return 58;
  if (round === 3) return 53;
  if (round === 4) return 48;
  if (round === 5) return 44;
  if (round === 6) return 40;
  if (round === 7) return 37;
  return 35;
}

function roleAdjust(role) {
  switch (role) {
    case 'starter': return 3;
    case 'backup': return -3;
    case 'depth': return -6;
    default: return 0;
  }
}

function ageAdjust(age) {
  if (age == null) return 0;
  if (age <= 24) return 1;
  if (age <= 27) return 2;
  if (age <= 30) return 0;
  if (age <= 32) return -1;
  if (age <= 34) return -3;
  return -5;
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff);
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(val, min, max) {
  return Math.round(Math.max(min, Math.min(max, val)));
}

function getMaddenSkillRatings(player, canonicalPos, skillMap) {
  if (!player.madden || !player.madden.stats) return null;

  const maddenPos = player.madden.position;
  const mapKey = skillMap.positionMap[maddenPos];
  const posMapping = skillMap[mapKey] || skillMap[canonicalPos];
  if (!posMapping) return null;

  const skillAccum = {};
  const skillCounts = {};

  for (const [maddenAttr, canonicalSkill] of Object.entries(posMapping)) {
    const val = player.madden.stats[maddenAttr];
    if (val == null || typeof val !== 'number') continue;
    const converted = madden99to2080(val);
    if (!skillAccum[canonicalSkill]) {
      skillAccum[canonicalSkill] = 0;
      skillCounts[canonicalSkill] = 0;
    }
    skillAccum[canonicalSkill] += converted;
    skillCounts[canonicalSkill]++;
  }

  const result = {};
  for (const [skill, total] of Object.entries(skillAccum)) {
    result[skill] = total / skillCounts[skill];
  }
  return Object.keys(result).length > 0 ? result : null;
}

function getStatBoosts(canonicalPos, actualPos, stats) {
  if (!stats) return {};
  const boosts = {};

  switch (canonicalPos) {
    case 'QB': {
      const gamesPlayed = stats.games || 1;
      const passYpg = (stats.passYards || 0) / gamesPlayed;
      const compPct = stats.completionPct || 0;
      const tdPct = (stats.passTDs || 0) / gamesPlayed;
      const intRate = (stats.ints || 0) / gamesPlayed;

      if (passYpg > 250) boosts.armStrength = 3;
      else if (passYpg > 200) boosts.armStrength = 1;
      else if (passYpg < 150) boosts.armStrength = -2;

      if (compPct > 67) { boosts.accuracyShort = 4; boosts.accuracyMedium = 3; }
      else if (compPct > 63) { boosts.accuracyShort = 2; boosts.accuracyMedium = 1; }
      else if (compPct < 58) { boosts.accuracyShort = -3; boosts.accuracyMedium = -2; }

      if (tdPct > 1.8) boosts.decisionMaking = 3;
      else if (tdPct > 1.2) boosts.decisionMaking = 1;

      if (intRate > 1.0) { boosts.decisionMaking = (boosts.decisionMaking || 0) - 3; }
      else if (intRate < 0.5) { boosts.decisionMaking = (boosts.decisionMaking || 0) + 2; }
      break;
    }
    case 'RB': {
      const gamesPlayed = stats.games || 1;
      const rushYpg = (stats.rushYards || 0) / gamesPlayed;
      const ypc = stats.ypc || 0;
      const receptions = stats.receptions || 0;

      if (ypc > 4.8) { boosts.vision = 4; boosts.elusiveness = 3; }
      else if (ypc > 4.2) { boosts.vision = 2; boosts.elusiveness = 1; }
      else if (ypc < 3.5) { boosts.vision = -3; boosts.elusiveness = -2; }

      if (rushYpg > 70) { boosts.acceleration = 3; boosts.tackleBreaking = 2; }
      else if (rushYpg > 50) { boosts.acceleration = 1; }

      if (receptions > 30) { boosts.passCatching = 4; }
      else if (receptions > 15) { boosts.passCatching = 2; }
      else { boosts.passCatching = -2; }
      break;
    }
    case 'WR': {
      const gamesPlayed = stats.games || 1;
      const recYpg = (stats.recYards || 0) / gamesPlayed;
      const catchRate = stats.targets > 0 ? (stats.receptions / stats.targets) : 0;
      const tdsPerGame = (stats.recTDs || 0) / gamesPlayed;

      if (recYpg > 60) { boosts.routeRunning = 4; boosts.separation = 3; }
      else if (recYpg > 40) { boosts.routeRunning = 2; boosts.separation = 1; }
      else if (recYpg < 20) { boosts.routeRunning = -2; boosts.separation = -2; }

      if (catchRate > 0.7) { boosts.hands = 4; boosts.catchRadius = 2; }
      else if (catchRate > 0.6) { boosts.hands = 2; }
      else if (catchRate < 0.5) { boosts.hands = -3; }

      if (tdsPerGame > 0.5) { boosts.contestedCatches = 3; boosts.yacAbility = 2; }
      break;
    }
    case 'TE': {
      const gamesPlayed = stats.games || 1;
      const recYpg = (stats.recYards || 0) / gamesPlayed;
      const tds = stats.recTDs || 0;

      if (recYpg > 40) { boosts.routeRunning = 4; boosts.hands = 3; boosts.seamThreat = 3; }
      else if (recYpg > 25) { boosts.routeRunning = 2; boosts.hands = 2; }
      else if (recYpg < 10) { boosts.runBlocking = 3; boosts.routeRunning = -3; }

      if (tds > 5) { boosts.redZoneTarget = 4; boosts.contestedCatches = 3; }
      else if (tds > 2) { boosts.redZoneTarget = 2; }
      break;
    }
    case 'OT':
    case 'OG':
    case 'OC': {
      const pressures = stats.pressuresAllowed || 0;
      const rbGrade = stats.runBlockGrade || 0;
      const pbGrade = stats.passBlockGrade || 0;
      const gamesPlayed = stats.games || 1;

      const pressPerGame = pressures / gamesPlayed;
      if (pressPerGame < 1.5) { boosts.passProtection = 4; boosts.anchor = 2; }
      else if (pressPerGame < 2.5) { boosts.passProtection = 2; }
      else if (pressPerGame > 4) { boosts.passProtection = -4; boosts.anchor = -2; }

      if (rbGrade > 75) { boosts.runBlocking = 4; }
      else if (rbGrade > 65) { boosts.runBlocking = 2; }
      else if (rbGrade < 50) { boosts.runBlocking = -3; }

      if (pbGrade > 75) { boosts.awareness = 3; boosts.footwork = 2; }
      else if (pbGrade > 65) { boosts.awareness = 1; }
      break;
    }
    case 'EDGE': {
      const gamesPlayed = stats.games || 1;
      const sacks = stats.sacks || 0;
      const prWinRate = stats.passRushWinRate || 0;

      const sacksPerGame = sacks / gamesPlayed;
      if (sacksPerGame > 0.7) { boosts.passRushMoves = 5; boosts.bendFlexibility = 3; }
      else if (sacksPerGame > 0.4) { boosts.passRushMoves = 3; boosts.bendFlexibility = 1; }
      else if (sacksPerGame < 0.2) { boosts.passRushMoves = -2; }

      if (prWinRate > 15) { boosts.speedToPower = 4; }
      else if (prWinRate > 10) { boosts.speedToPower = 2; }

      const tacklesPerGame = (stats.tackles || 0) / gamesPlayed;
      if (tacklesPerGame > 3) { boosts.runDefense = 3; boosts.pursuit = 2; }
      break;
    }
    case 'IDL': {
      const gamesPlayed = stats.games || 1;
      const pressures = stats.totalPressures || 0;
      const runDefGrade = stats.runDefGrade || 0;

      const pressPerGame = pressures / gamesPlayed;
      if (pressPerGame > 2.5) { boosts.passRushMoves = 4; boosts.penetration = 3; }
      else if (pressPerGame > 1.5) { boosts.passRushMoves = 2; boosts.penetration = 1; }

      if (runDefGrade > 75) { boosts.runStuffing = 4; boosts.anchor = 3; }
      else if (runDefGrade > 65) { boosts.runStuffing = 2; }
      else if (runDefGrade < 50) { boosts.runStuffing = -2; }

      const tacklesPerGame = (stats.tackles || 0) / gamesPlayed;
      if (tacklesPerGame > 3) { boosts.blockShedding = 3; }
      break;
    }
    case 'LB': {
      const gamesPlayed = stats.games || 1;
      const tackles = stats.tackles || 0;
      const sacks = stats.sacks || 0;
      const pressures = stats.totalPressures || 0;
      const covGrade = stats.coverageGrade || 0;

      const tacklesPerGame = tackles / gamesPlayed;
      if (tacklesPerGame > 6) { boosts.tackling = 4; boosts.runDefense = 3; boosts.pursuit = 3; }
      else if (tacklesPerGame > 4) { boosts.tackling = 2; boosts.runDefense = 2; }
      else if (tacklesPerGame < 2) { boosts.tackling = -2; }

      if (covGrade > 70) { boosts.zoneCoverage = 4; boosts.manCoverage = 2; }
      else if (covGrade > 60) { boosts.zoneCoverage = 2; }
      else if (covGrade < 45) { boosts.zoneCoverage = -3; }

      if (sacks > 3) { boosts.blitzing = 4; }
      else if (pressures > 15) { boosts.blitzing = 2; }
      break;
    }
    case 'DB': {
      const gamesPlayed = stats.games || 1;
      const ints = stats.interceptions || 0;
      const pbus = stats.passBreakups || 0;
      const covGrade = stats.coverageGrade || 0;
      const tackles = stats.tackles || 0;
      const qbRating = stats.qbRatingAgainst || null;
      const isCB = (actualPos === 'CB' || actualPos === 'NB');

      if (covGrade > 75) { boosts.manCoverage = 4; boosts.zoneCoverage = 3; }
      else if (covGrade > 65) { boosts.manCoverage = 2; boosts.zoneCoverage = 2; }
      else if (covGrade < 50) { boosts.manCoverage = -3; boosts.zoneCoverage = -2; }

      if (ints > 3) { boosts.ballSkills = 5; boosts.instincts = 3; }
      else if (ints > 1) { boosts.ballSkills = 2; }

      if (pbus > 10) { boosts.pressTechnique = 3; }
      else if (pbus > 5) { boosts.pressTechnique = 1; }

      if (qbRating != null && qbRating < 75) { boosts.manCoverage = (boosts.manCoverage || 0) + 3; }
      else if (qbRating != null && qbRating > 100) { boosts.manCoverage = (boosts.manCoverage || 0) - 2; }

      const tacklesPerGame = tackles / gamesPlayed;
      if (tacklesPerGame > 4) { boosts.tackling = 3; }

      if (isCB) {
        boosts.pressTechnique = (boosts.pressTechnique || 0) + 2;
        boosts.manCoverage = (boosts.manCoverage || 0) + 1;
        boosts.range = (boosts.range || 0) - 2;
      } else {
        boosts.range = (boosts.range || 0) + 3;
        boosts.tackling = (boosts.tackling || 0) + 1;
        boosts.pressTechnique = (boosts.pressTechnique || 0) - 3;
      }
      break;
    }
  }

  return boosts;
}

function generatePlayerRatings(player, skillMap) {
  const canonicalPos = POS_MAP[player.position] || player.position;
  const skills = POSITION_SKILLS[canonicalPos];
  if (!skills) return null;

  const pffGrade = player.pff ? player.pff.grade : null;
  const pffStats = player.pff ? player.pff.stats : null;
  const nflStats = player.nflStats ? player.nflStats.stats : null;

  const pffBase = pffGradeToBase(pffGrade);
  const maddenOvr = player.madden ? madden99to2080(player.madden.ovr) : null;
  const contractBase = contractToBase(player.contract);
  const draftBase = draftCapitalToBase(player.contract);
  const tierBase = tierToBase(player.performanceTier);

  const available = [];
  if (pffBase != null) available.push('pff');
  if (maddenOvr != null) available.push('madden');
  if (nflStats != null) available.push('nflStats');
  if (contractBase != null) available.push('contract');
  if (draftBase != null) available.push('draftCapital');
  available.push('tier');

  const weights = redistributeWeights(available);

  let baseRating = 0;
  if (weights.pff) baseRating += pffBase * weights.pff;
  if (weights.madden) baseRating += maddenOvr * weights.madden;
  if (weights.nflStats) baseRating += (pffBase || tierBase) * weights.nflStats;
  if (weights.contract) baseRating += contractBase * weights.contract;
  if (weights.draftCapital) baseRating += draftBase * weights.draftCapital;
  if (weights.tier) baseRating += tierBase * weights.tier;

  baseRating += roleAdjust(player.role);
  baseRating += ageAdjust(player.age);
  baseRating = Math.max(25, Math.min(75, baseRating));

  const maddenSkills = getMaddenSkillRatings(player, canonicalPos, skillMap);

  const statBoosts = getStatBoosts(canonicalPos, player.position, pffStats || nflStats);

  const rng = seededRandom(hashString(player.name + player.team + player.position));

  const ratings = {};
  let totalSkillRating = 0;

  for (const skill of skills) {
    let skillRating = baseRating;

    if (maddenSkills && maddenSkills[skill] != null) {
      const maddenVal = maddenSkills[skill];
      const maddenInfluence = weights.madden ? Math.min(weights.madden * 1.5, 0.45) : 0.15;
      skillRating = skillRating * (1 - maddenInfluence) + maddenVal * maddenInfluence;
    }

    if (statBoosts[skill]) {
      skillRating += statBoosts[skill];
    }

    const variance = (rng() - 0.5) * 5;
    skillRating += variance;

    skillRating = clamp(skillRating, 20, 80);
    ratings[skill] = skillRating;
    totalSkillRating += skillRating;
  }

  const overall = clamp(Math.round(totalSkillRating / skills.length), 20, 80);

  return {
    overall,
    skills: ratings,
    canonicalPosition: canonicalPos,
    sourcesUsed: available
  };
}

function calculateSchemeOverall(playerSkills, weights) {
  if (!playerSkills || !weights) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [skill, weight] of Object.entries(weights)) {
    if (playerSkills[skill] != null) {
      weightedSum += playerSkills[skill] * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return clamp(Math.round(weightedSum / totalWeight), 20, 80);
}

function getSchemePositionKey(playerPosition) {
  switch (playerPosition) {
    case 'CB': case 'NB': return 'CB';
    case 'S': return 'S';
    case 'IOL': case 'OG': case 'C': return 'IOL';
    case 'OT': return 'OT';
    case 'DL': case 'DT': case 'NT': return 'IDL';
    case 'EDGE': case 'DE': case 'OLB': return 'EDGE';
    case 'LB': case 'ILB': case 'MLB': return 'LB';
    default: return playerPosition;
  }
}

function validateSchemeWeights(schemes) {
  const SCHEME_POS_TO_CANONICAL = {
    QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE',
    OT: 'OT', IOL: 'OG',
    EDGE: 'EDGE', IDL: 'IDL', LB: 'LB',
    CB: 'DB', S: 'DB'
  };

  let errors = 0;
  for (const side of ['offensive', 'defensive']) {
    if (!schemes[side]) continue;
    for (const [schemeName, schemeData] of Object.entries(schemes[side])) {
      for (const [posKey, weights] of Object.entries(schemeData)) {
        if (posKey === 'description') continue;
        const canonicalPos = SCHEME_POS_TO_CANONICAL[posKey];
        if (!canonicalPos) {
          console.warn(`  WARNING: Unknown position '${posKey}' in ${schemeName}`);
          errors++;
          continue;
        }
        const validSkills = POSITION_SKILLS[canonicalPos];
        for (const skill of Object.keys(weights)) {
          if (!validSkills.includes(skill)) {
            console.warn(`  WARNING: Skill '${skill}' in ${schemeName}.${posKey} is not a valid ${canonicalPos} skill`);
            errors++;
          }
        }
      }
    }
  }
  return errors;
}

function main() {
  console.log('Loading player database...');
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  console.log('Loading Madden skill map...');
  const skillMap = JSON.parse(fs.readFileSync(SKILL_MAP_PATH, 'utf-8'));

  console.log('Loading scheme weights...');
  const schemes = JSON.parse(fs.readFileSync(SCHEME_PATH, 'utf-8'));

  console.log('\nValidating scheme weights against canonical skills...');
  const weightErrors = validateSchemeWeights(schemes);
  if (weightErrors > 0) {
    console.warn(`\nFound ${weightErrors} scheme weight key mismatches. These weights will be ignored.\n`);
  } else {
    console.log('All scheme weight keys are valid.\n');
  }

  let totalPlayers = 0;
  let ratingsGenerated = 0;
  let skipped = 0;
  const positionStats = {};
  const sourceCounters = { pff: 0, madden: 0, nflStats: 0, contract: 0, draftCapital: 0, tier: 0 };

  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      totalPlayers++;
      const ratings = generatePlayerRatings(player, skillMap);

      if (ratings) {
        ratingsGenerated++;

        for (const src of ratings.sourcesUsed) {
          sourceCounters[src]++;
        }

        const schemeOveralls = {};
        const side = player.side;
        const schemeSide = side === 'offense' ? 'offensive' : side === 'defense' ? 'defensive' : null;
        const schemePosKey = getSchemePositionKey(player.position);

        if (schemeSide && schemes[schemeSide]) {
          for (const [schemeName, schemeData] of Object.entries(schemes[schemeSide])) {
            const weights = schemeData[schemePosKey];
            if (weights && typeof weights === 'object') {
              const schemeOvr = calculateSchemeOverall(ratings.skills, weights);
              if (schemeOvr != null) {
                schemeOveralls[schemeName] = schemeOvr;
              }
            }
          }
        }

        player.ratings = {
          overall: ratings.overall,
          position: ratings.canonicalPosition,
          skills: ratings.skills,
          schemeOveralls,
          sourcesUsed: ratings.sourcesUsed
        };

        if (!positionStats[player.position]) {
          positionStats[player.position] = { count: 0, totalOvr: 0, min: 80, max: 20 };
        }
        positionStats[player.position].count++;
        positionStats[player.position].totalOvr += ratings.overall;
        positionStats[player.position].min = Math.min(positionStats[player.position].min, ratings.overall);
        positionStats[player.position].max = Math.max(positionStats[player.position].max, ratings.overall);
      } else {
        skipped++;
      }
    }
  }

  db.meta.ratingsGenerated = new Date().toISOString();
  db.meta.ratingsVersion = '2.0';
  db.meta.ratingScale = '20-80 scouting scale';
  db.meta.ratingSources = 'Multi-source: PFF, Madden EA API, nflverse stats, contract, draft capital, performance tier';

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));

  console.log('\n=== Player Rating Generation Complete (v2.0 Multi-Source) ===');
  console.log(`Total players: ${totalPlayers}`);
  console.log(`Ratings generated: ${ratingsGenerated}`);
  console.log(`Skipped: ${skipped}`);

  console.log('\n--- Source Coverage ---');
  for (const [src, count] of Object.entries(sourceCounters)) {
    console.log(`  ${src.padEnd(14)} | ${count.toString().padStart(5)} players (${Math.round(count / ratingsGenerated * 100)}%)`);
  }

  console.log('\n--- Rating Distribution by Position ---');
  const sorted = Object.entries(positionStats).sort((a, b) => b[1].count - a[1].count);
  for (const [pos, data] of sorted) {
    const avg = Math.round(data.totalOvr / data.count);
    console.log(`  ${pos.padEnd(5)} | ${data.count.toString().padStart(3)} players | Avg: ${avg} | Range: ${data.min}-${data.max}`);
  }

  console.log('\n--- Sample Players ---');
  const sampleNames = ['Patrick Mahomes', 'Josh Allen', 'Derrick Henry', 'Tyreek Hill', 'Myles Garrett', 'Sauce Gardner'];
  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (sampleNames.includes(player.name) && player.ratings) {
        console.log(`  ${player.name} (${player.position}, ${teamCode}): OVR ${player.ratings.overall} | Sources: ${player.ratings.sourcesUsed.join(', ')}`);
      }
    }
  }
}

main();
