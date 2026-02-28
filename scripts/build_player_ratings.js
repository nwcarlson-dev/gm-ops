const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'teams', 'player_database.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'teams', 'player_database.json');
const SKILL_MAP_PATH = path.join(__dirname, '..', 'data', 'mappings', 'madden_skill_map.json');
const SCHEME_PATH = path.join(__dirname, '..', 'data', 'schemes', 'scheme_skill_weights.json');

// =========================================================================
// POSITION SKILLS (canonical skill sets per position)
// =========================================================================

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

// =========================================================================
// SOURCE PRIORITY PER SKILL PER POSITION
// Determines how to blend Madden, sentiment, and stats for each skill.
//   eyeTest:    sentiment is primary (100% if available, Madden fallback)
//   statDriven: Madden+stats 60%, sentiment 40% — stats inform but sentiment has real weight
//   measurable: Madden dominates (75%), sentiment minor (25%)
//   hybrid:     Madden 40% / sentiment 60% — sentiment leads for subjective skills
// =========================================================================

const SKILL_SOURCE_PRIORITY = {
  QB: {
    armStrength: 'eyeTest',         // no stat measures arm strength
    accuracyShort: 'hybrid',        // stats help but eye test sees mechanics, ball placement
    accuracyMedium: 'hybrid',
    accuracyDeep: 'hybrid',         // partly eye test, partly stat
    releaseSpeed: 'eyeTest',        // film study only
    decisionMaking: 'hybrid',       // TWP helps but reads, progressions are eye test
    pocketPresence: 'eyeTest',      // pocket feel is pure film study / eye test
    mobility: 'measurable',         // speed/accel are combine numbers
    playAction: 'eyeTest',          // film study only
    leadership: 'eyeTest',          // pure intangible
    contactAggression: 'measurable',
  },
  RB: {
    vision: 'eyeTest',              // can't stat-measure vision
    acceleration: 'measurable',     // combine/testing data
    tackleBreaking: 'hybrid',       // some stats (broken tackles), mostly eye test
    elusiveness: 'hybrid',          // some stats (YAC, missed tackles forced)
    passCatching: 'hybrid',         // receptions help but route quality is eye test
    passProtection: 'eyeTest',      // film study
    contactAggression: 'measurable',
    ballSecurity: 'statDriven',     // fumble rate is the best signal
  },
  FB: {
    runBlocking: 'eyeTest',
    passProtection: 'eyeTest',
    shortAreaPower: 'measurable',
    tackleBreaking: 'hybrid',
    contactAggression: 'measurable',
    passCatching: 'hybrid',
    speed: 'measurable',
  },
  WR: {
    routeRunning: 'eyeTest',        // film study — can't stat this
    release: 'eyeTest',             // film study
    separation: 'hybrid',           // some stats (separation metrics), mostly eye test
    catchRadius: 'eyeTest',         // eye test
    hands: 'hybrid',                // catch rate helps but drop context is eye test
    yacAbility: 'hybrid',           // YAC stats + eye test
    contestedCatches: 'hybrid',     // contested catch rate + eye test
    contactAggression: 'measurable',
    decisionMaking: 'eyeTest',      // route adjustments, reads
  },
  TE: {
    runBlocking: 'eyeTest',         // film study
    routeRunning: 'eyeTest',
    hands: 'hybrid',                // catch rate helps but technique is eye test
    yacAbility: 'hybrid',
    contestedCatches: 'eyeTest',    // almost entirely film evaluation
    seamThreat: 'hybrid',           // partly speed (measurable), partly usage
    redZoneTarget: 'hybrid',        // usage + skill in tight windows is eye test
    contactAggression: 'measurable',
  },
  OT: {
    passProtection: 'hybrid',       // pressures help but technique is eye test
    runBlocking: 'hybrid',          // PFF grade + eye test
    anchor: 'eyeTest',              // technique, can't stat this
    footwork: 'eyeTest',            // pure technique
    awareness: 'eyeTest',           // mental processing
    powerAtPOA: 'measurable',       // strength-based
    contactAggression: 'measurable',
  },
  OG: {
    runBlocking: 'hybrid',
    passProtection: 'hybrid',
    awareness: 'eyeTest',
    anchor: 'eyeTest',
    pullAbility: 'eyeTest',         // technique, film study
    doubleTeams: 'eyeTest',
    contactAggression: 'measurable',
  },
  OC: {
    runBlocking: 'hybrid',
    passProtection: 'hybrid',
    awareness: 'eyeTest',
    anchor: 'eyeTest',
    snapping: 'eyeTest',            // technique
    reachAbility: 'eyeTest',
    leadership: 'eyeTest',
  },
  IDL: {
    runStuffing: 'hybrid',          // PFF run defense grade + eye test
    passRushMoves: 'eyeTest',       // technique
    blockShedding: 'eyeTest',       // technique
    anchor: 'measurable',           // strength-based
    penetration: 'statDriven',      // pressures, TFLs
    doubleTeamResistance: 'eyeTest',
    pursuit: 'hybrid',              // tackles + eye test
    contactAggression: 'measurable',
  },
  EDGE: {
    passRushMoves: 'eyeTest',       // technique, repertoire
    speedToPower: 'measurable',     // speed/strength combo
    bendFlexibility: 'eyeTest',     // pure eye test — can you bend the corner
    runDefense: 'hybrid',           // tackles/stops + eye test
    blockShedding: 'eyeTest',       // technique
    pursuit: 'hybrid',
    coverageAbility: 'hybrid',      // coverage grade + eye test
    contactAggression: 'measurable',
  },
  LB: {
    runDefense: 'hybrid',           // tackles + eye test
    blockShedding: 'eyeTest',       // technique
    tackling: 'statDriven',         // tackles, missed tackle rate
    pursuit: 'hybrid',              // tackles + range eye test
    zoneCoverage: 'hybrid',         // coverage grade + eye test
    manCoverage: 'hybrid',
    blitzing: 'statDriven',         // sacks, pressures
    instincts: 'eyeTest',           // pure intangible
    contactAggression: 'measurable',
  },
  DB: {
    manCoverage: 'hybrid',          // coverage grade + eye test
    zoneCoverage: 'hybrid',
    pressTechnique: 'eyeTest',      // pure technique
    ballSkills: 'hybrid',           // INTs/PBUs + eye test
    tackling: 'statDriven',         // tackle stats, missed tackle rate
    range: 'measurable',            // speed/accel based
    instincts: 'eyeTest',           // pure intangible
    blitzing: 'statDriven',         // pressures from slot/safety
    contactAggression: 'measurable',
  },
  K: {
    legStrength: 'measurable',
    accuracy: 'statDriven',         // FG%, XP%
    clutch: 'eyeTest',              // big moment performance
    kickoffDistance: 'measurable',
    kickoffHangtime: 'measurable',
  },
  P: {
    legStrength: 'measurable',
    hangtime: 'statDriven',
    directional: 'eyeTest',
    consistency: 'statDriven',
  },
  LS: {
    longSnapping: 'eyeTest',
    tackling: 'statDriven',
    consistency: 'eyeTest',
  },
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

// =========================================================================
// CONVERSION FUNCTIONS — Linear 1.2x conversion anchored at Madden 78 = 50
// =========================================================================

/**
 * Convert a Madden attribute (0-99) to the GM Ops 20-80 scale.
 *
 * Madden's effective range is ~50-99 (50 pts). GM Ops is 20-80 (60 pts).
 * Ratio: 60/50 = 1.2 GM Ops points per Madden point.
 * Anchor: Madden 78 = 50 (average starter).
 *
 * Formula: GM_Ops = (Madden - 78) × 1.2 + 50, clamped to [20, 80]
 *
 * Reference points:
 *   Madden 99  →  75  (elite / generational)
 *   Madden 95  →  70  (star)
 *   Madden 92  →  67  (very good starter)
 *   Madden 85  →  58  (above average)
 *   Madden 78  →  50  (average starter)
 *   Madden 72  →  43  (backup)
 *   Madden 65  →  34  (deep depth)
 *   Madden 55  →  22  (practice squad / floor)
 *   ≤53        →  20  (clamped floor)
 *
 * The natural ceiling for Madden 99 is 75, meaning 76-80 is only
 * reachable through modifiers (sentiment, accolades, etc.).
 */
function maddenTo2080(value) {
  if (value == null) return null;
  const converted = (value - 78) * 1.2 + 50;
  return Math.round(Math.max(20, Math.min(80, converted)));
}

/** Convert individual Madden attribute to 20-80 scale. */
function maddenSkillTo2080(value) {
  return maddenTo2080(value);
}

/**
 * Convert Madden OVR (0-99) to 20-80 scale.
 * Used only as fallback for players without individual skill data.
 */
function maddenOvrTo2080(value) {
  return maddenTo2080(value);
}

// =========================================================================
// FALLBACK BASE RATING (for players without Madden data)
// =========================================================================

function pffGradeToBase(pffGrade) {
  if (pffGrade == null) return null;
  if (pffGrade >= 92) return 70;
  if (pffGrade >= 85) return 63;
  if (pffGrade >= 80) return 58;
  if (pffGrade >= 75) return 53;
  if (pffGrade >= 70) return 49;
  if (pffGrade >= 65) return 45;
  if (pffGrade >= 60) return 42;
  if (pffGrade >= 55) return 38;
  if (pffGrade >= 50) return 34;
  if (pffGrade >= 45) return 30;
  return 25;
}

function tierToBase(tier) {
  switch (tier) {
    case 'elite': return 60;
    case 'above_average': return 55;
    case 'starter': return 50;
    case 'average': return 46;
    case 'below_average': return 40;
    case 'bridge': return 38;
    case 'developing': return 34;
    case 'backup': return 32;
    case 'depth': return 28;
    case 'practice_squad': return 24;
    case 'reserve': return 30;
    default: return 35;
  }
}

function computeFallbackBase(player) {
  const pffGrade = player.pff ? player.pff.grade : null;
  const tier = player.performanceTier || player.role || 'backup';

  let base = tierToBase(tier);
  if (pffGrade != null) {
    base = pffGradeToBase(pffGrade);
  }
  return clamp(base, 20, 75);
}

// =========================================================================
// MODIFIER FUNCTIONS (applied after skill computation)
// =========================================================================

/**
 * PFF skill offset: adjusts Madden attribute values BEFORE conversion to 20-80.
 * This makes PFF influence the base skills, not just a flat modifier.
 * When PFF and Madden disagree, PFF pulls skills toward reality.
 *
 * Example: Willis has Madden 65 but PFF 92.3 → offset +10 lifts each
 *          attribute by 10 before conversion, bridging the gap.
 *          Tua has Madden 75 but PFF 62.1 → offset -4 pulls attributes
 *          down before conversion, reflecting poor recent play.
 */
function pffSkillOffset(pffGrade) {
  if (pffGrade == null) return 0;
  // Further reduced to keep middle-of-the-road contributors from
  // vaulting into the 70s/80s purely on a hot season.  PFF can still
  // nudge skills, but the maximum swing is ±3.
  if (pffGrade >= 92) return 3;
  if (pffGrade >= 88) return 2;
  if (pffGrade >= 85) return 1;
  if (pffGrade >= 75) return 0;
  if (pffGrade >= 65) return -1;
  if (pffGrade >= 60) return -2;
  return -3;
}

/**
 * Flat PFF modifier (reduced — heavy lifting is in pffSkillOffset now).
 * Kept for residual differentiation at the extremes.
 */
function pffAdjustment(pffGrade) {
  if (pffGrade == null) return 0;
  // Flatten the curve so that only truly elite grades (>91) earn a bonus
  // and sub‑par performance doesn't crater players more than a couple
  // points.  This modifier is additive on overall after normalization.
  if (pffGrade >= 92) return 2;
  if (pffGrade >= 88) return 1;
  if (pffGrade >= 85) return 1;
  if (pffGrade >= 80) return 0;
  if (pffGrade >= 70) return 0;
  if (pffGrade >= 60) return -1;
  if (pffGrade >= 50) return -1;
  return -2;
}

/**
 * Pre-normalization sentiment modifier: small nudge that feeds into the
 * normalization pool.  The heavy lifting is done post-normalization
 * by applySentimentPostNorm().
 */
function sentimentAdjustment(sentiment) {
  if (!sentiment || sentiment.score == null) return 0;
  return (sentiment.score - 5) * 0.3; // Range: -1.2 to +1.5
}

function accoladesAdjustment(accolades) {
  if (!accolades) return 0;
  let adj = 0;
  // Increased for decorated players (Mahomes, etc.) whose PFF grade
  // may not reflect career-level talent in a single season.
  if (accolades.allPro >= 3) adj += 5;
  else if (accolades.allPro >= 2) adj += 4;
  else if (accolades.allPro >= 1) adj += 2;
  if (accolades.proBowls >= 5) adj += 2;
  else if (accolades.proBowls >= 3) adj += 1;
  return Math.min(adj, 5);
}

function draftCapitalAdjustment(contract, yearsExp) {
  if (!contract || !contract.draftRound) return 0;
  if (yearsExp > 4) return 0; // First 4 years: draft pedigree matters
  const round = contract.draftRound;
  if (round === 1) {
    // 1st-2nd year: franchise investment premium
    if (yearsExp <= 2) return 5;
    return 3;
  }
  if (round === 2) return 1;
  return 0;
}

function ageAdjust(age) {
  if (age == null) return 0;
  if (age <= 24) return 1;
  if (age <= 27) return 0;
  if (age <= 29) return 0;
  if (age <= 31) return -1;
  if (age <= 33) return -3;
  if (age <= 35) return -4;
  return -5;
}

/**
 * Performance vs. expectation modifier.
 * Compares PFF grade (recent on-field performance) against Madden OVR
 * (reputation/history-based rating). Rewards players outperforming
 * their Madden rating and penalizes those underperforming.
 *
 * This captures the lagging-indicator problem: Madden over-values
 * established players and under-values rising talent.
 *
 * Players with elite PFF (≥88) are exempt from penalties — they're
 * performing at a high level regardless of what Madden thinks.
 */
function performanceVsExpectation(maddenOvr, pffGrade) {
  if (maddenOvr == null || pffGrade == null) return 0;

  // Elite PFF performers always get a bonus
  if (pffGrade >= 90) return 3;
  if (pffGrade >= 88) return 2;

  const gap = pffGrade - maddenOvr;

  // Outperforming Madden (rising stars, breakout players)
  if (gap >= 5) return 4;
  if (gap >= 0) return 2;

  // Slightly underperforming (normal variance)
  if (gap >= -5) return 0;

  // Significantly underperforming Madden rating
  if (gap >= -10) return -2;
  if (gap >= -15) return -4;
  return -5;
}

// =========================================================================
// MADDEN SKILL EXTRACTION (direct from individual attributes)
// =========================================================================

/**
 * Extract per-skill ratings from Madden individual attributes.
 * Applies PFF skill offset to each Madden attribute before conversion,
 * so PFF grade directly influences base skill levels.
 * Returns { skill: rating } or null if no Madden data.
 */
function getMaddenSkillRatings(player, canonicalPos, skillMap) {
  if (!player.madden || !player.madden.stats) return null;

  const maddenPos = player.madden.position;
  const mapKey = skillMap.positionMap[maddenPos];
  const posMapping = skillMap[mapKey] || skillMap[canonicalPos];
  if (!posMapping) return null;

  // Skills are pure Madden-attribute-derived. PFF influences overall
  // via modifiers, not individual skill attributes (arm strength doesn't
  // change based on one season's PFF grade).
  const skillAccum = {};
  const skillCounts = {};

  for (const [maddenAttr, canonicalSkill] of Object.entries(posMapping)) {
    const val = player.madden.stats[maddenAttr];
    if (val == null || typeof val !== 'number') continue;
    const converted = maddenSkillTo2080(val);
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

// =========================================================================
// STAT BOOSTS (2025 PFF stats only — no nflverse, no multi-season)
// Each skill clamped to [-3, +4] after all boosts computed.
// =========================================================================

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

      if (compPct > 67) { boosts.accuracyShort = 3; boosts.accuracyMedium = 2; }
      else if (compPct > 63) { boosts.accuracyShort = 1; boosts.accuracyMedium = 1; }
      else if (compPct < 58) { boosts.accuracyShort = -2; boosts.accuracyMedium = -2; }

      if (tdPct > 1.8) boosts.decisionMaking = 2;
      else if (tdPct > 1.2) boosts.decisionMaking = 1;

      if (intRate > 0.7) { boosts.decisionMaking = (boosts.decisionMaking || 0) - 3; }
      else if (intRate > 0.5) { boosts.decisionMaking = (boosts.decisionMaking || 0) - 1; }
      else if (intRate < 0.3) { boosts.decisionMaking = (boosts.decisionMaking || 0) + 1; }

      // PFF turnover-worthy play rate (replaces EPA — more precise, 2025 only)
      const twpRate = stats.twpRate || 0;
      if (twpRate > 4.0) {
        boosts.decisionMaking = (boosts.decisionMaking || 0) - 2;
        boosts.pocketPresence = (boosts.pocketPresence || 0) - 1;
      } else if (twpRate > 3.0) {
        boosts.decisionMaking = (boosts.decisionMaking || 0) - 1;
      } else if (twpRate < 2.0) {
        boosts.decisionMaking = (boosts.decisionMaking || 0) + 1;
      }

      // PFF big time throw rate (positive signal for arm talent + decision-making)
      const bttRate = stats.bttRate || 0;
      if (bttRate > 6.0) {
        boosts.armStrength = (boosts.armStrength || 0) + 2;
        boosts.accuracyDeep = (boosts.accuracyDeep || 0) + 1;
      } else if (bttRate > 4.5) {
        boosts.armStrength = (boosts.armStrength || 0) + 1;
      }

      // Sack rate penalty (from PFF data)
      const sackPct = stats.sackPercent || 0;
      if (sackPct > 8) {
        boosts.pocketPresence = (boosts.pocketPresence || 0) - 2;
        boosts.releaseSpeed = (boosts.releaseSpeed || 0) - 1;
      } else if (sackPct > 6) {
        boosts.pocketPresence = (boosts.pocketPresence || 0) - 1;
      } else if (sackPct < 3) {
        boosts.pocketPresence = (boosts.pocketPresence || 0) + 1;
      }
      break;
    }
    case 'RB': {
      const gamesPlayed = stats.games || 1;
      const ypc = stats.ypc || 0;
      const rushYpg = (stats.rushYards || 0) / gamesPlayed;
      const receptions = stats.receptions || 0;

      if (ypc > 4.8) { boosts.vision = 3; boosts.elusiveness = 2; }
      else if (ypc > 4.2) { boosts.vision = 1; boosts.elusiveness = 1; }
      else if (ypc < 3.5) { boosts.vision = -2; boosts.elusiveness = -1; }

      if (rushYpg > 70) { boosts.acceleration = 2; boosts.tackleBreaking = 2; }
      else if (rushYpg > 50) { boosts.acceleration = 1; }

      if (receptions > 30) boosts.passCatching = 3;
      else if (receptions > 15) boosts.passCatching = 1;
      else boosts.passCatching = -1;
      break;
    }
    case 'WR': {
      const gamesPlayed = stats.games || 1;
      const recYpg = (stats.recYards || 0) / gamesPlayed;
      const catchRate = stats.targets > 0 ? (stats.receptions / stats.targets) : 0;
      const tdsPerGame = (stats.recTDs || 0) / gamesPlayed;

      if (recYpg > 60) { boosts.routeRunning = 3; boosts.separation = 2; }
      else if (recYpg > 40) { boosts.routeRunning = 1; boosts.separation = 1; }
      else if (recYpg < 20) { boosts.routeRunning = -2; boosts.separation = -1; }

      if (catchRate > 0.7) { boosts.hands = 3; boosts.catchRadius = 2; }
      else if (catchRate > 0.6) { boosts.hands = 1; }
      else if (catchRate < 0.5) { boosts.hands = -2; }

      if (tdsPerGame > 0.5) { boosts.contestedCatches = 2; boosts.yacAbility = 1; }
      break;
    }
    case 'TE': {
      const gamesPlayed = stats.games || 1;
      const recYpg = (stats.recYards || 0) / gamesPlayed;
      const tds = stats.recTDs || 0;

      if (recYpg > 40) { boosts.routeRunning = 3; boosts.hands = 2; boosts.seamThreat = 2; }
      else if (recYpg > 25) { boosts.routeRunning = 1; boosts.hands = 1; }
      else if (recYpg < 10) { boosts.runBlocking = 2; boosts.routeRunning = -2; }

      if (tds > 5) { boosts.redZoneTarget = 3; boosts.contestedCatches = 2; }
      else if (tds > 2) { boosts.redZoneTarget = 1; }
      break;
    }
    case 'OT': case 'OG': case 'OC': {
      const pressures = stats.pressuresAllowed || 0;
      const gamesPlayed = stats.games || 1;
      const pressPerGame = pressures / gamesPlayed;

      if (pressPerGame < 1.5) { boosts.passProtection = 3; boosts.anchor = 2; }
      else if (pressPerGame < 2.5) { boosts.passProtection = 1; }
      else if (pressPerGame > 4) { boosts.passProtection = -3; boosts.anchor = -1; }

      const rbGrade = stats.runBlockGrade || 0;
      if (rbGrade > 75) boosts.runBlocking = 3;
      else if (rbGrade > 65) boosts.runBlocking = 1;
      else if (rbGrade < 50) boosts.runBlocking = -2;
      break;
    }
    case 'EDGE': {
      const gamesPlayed = stats.games || 1;
      const sacks = stats.sacks || 0;
      const sacksPerGame = sacks / gamesPlayed;

      if (sacksPerGame > 0.7) { boosts.passRushMoves = 4; boosts.bendFlexibility = 2; }
      else if (sacksPerGame > 0.4) { boosts.passRushMoves = 2; boosts.bendFlexibility = 1; }
      else if (sacksPerGame < 0.2) { boosts.passRushMoves = -1; }

      const tacklesPerGame = (stats.tackles || 0) / gamesPlayed;
      if (tacklesPerGame > 3) { boosts.runDefense = 2; boosts.pursuit = 1; }
      break;
    }
    case 'IDL': {
      const gamesPlayed = stats.games || 1;
      const pressures = stats.totalPressures || 0;
      const pressPerGame = pressures / gamesPlayed;

      if (pressPerGame > 2.5) { boosts.passRushMoves = 3; boosts.penetration = 2; }
      else if (pressPerGame > 1.5) { boosts.passRushMoves = 1; boosts.penetration = 1; }

      const runDefGrade = stats.runDefGrade || 0;
      if (runDefGrade > 75) { boosts.runStuffing = 3; boosts.anchor = 2; }
      else if (runDefGrade > 65) { boosts.runStuffing = 1; }
      else if (runDefGrade < 50) { boosts.runStuffing = -1; }
      break;
    }
    case 'LB': {
      const gamesPlayed = stats.games || 1;
      const tackles = stats.tackles || 0;
      const covGrade = stats.coverageGrade || 0;
      const sacks = stats.sacks || 0;

      const tacklesPerGame = tackles / gamesPlayed;
      if (tacklesPerGame > 6) { boosts.tackling = 3; boosts.runDefense = 2; boosts.pursuit = 2; }
      else if (tacklesPerGame > 4) { boosts.tackling = 1; boosts.runDefense = 1; }
      else if (tacklesPerGame < 2) { boosts.tackling = -1; }

      if (covGrade > 70) { boosts.zoneCoverage = 3; boosts.manCoverage = 1; }
      else if (covGrade > 60) { boosts.zoneCoverage = 1; }
      else if (covGrade < 45) { boosts.zoneCoverage = -2; }

      if (sacks > 3) boosts.blitzing = 3;
      break;
    }
    case 'DB': {
      const gamesPlayed = stats.games || 1;
      const ints = stats.interceptions || 0;
      const pbus = stats.passBreakups || 0;
      const covGrade = stats.coverageGrade || 0;
      const isCB = (actualPos === 'CB' || actualPos === 'NB');

      if (covGrade > 75) { boosts.manCoverage = 3; boosts.zoneCoverage = 2; }
      else if (covGrade > 65) { boosts.manCoverage = 1; boosts.zoneCoverage = 1; }
      else if (covGrade < 50) { boosts.manCoverage = -2; boosts.zoneCoverage = -1; }

      if (ints > 3) { boosts.ballSkills = 4; boosts.instincts = 2; }
      else if (ints > 1) { boosts.ballSkills = 1; }

      if (pbus > 10) boosts.pressTechnique = 2;
      else if (pbus > 5) boosts.pressTechnique = 1;

      if (isCB) {
        boosts.pressTechnique = (boosts.pressTechnique || 0) + 1;
        boosts.range = (boosts.range || 0) - 1;
      } else {
        boosts.range = (boosts.range || 0) + 2;
        boosts.pressTechnique = (boosts.pressTechnique || 0) - 2;
      }
      break;
    }
  }

  // Clamp each skill boost to [-3, +4] to prevent any single source from dominating
  for (const [skill, val] of Object.entries(boosts)) {
    boosts[skill] = Math.max(-3, Math.min(4, val));
  }

  return boosts;
}

// =========================================================================
// SCHEME OVERALL (unchanged from v3.0)
// =========================================================================

// Scaling factor: amplifies distance from 50 so well-rounded elite players
// rate higher. avg 70 → 76, avg 60 → 63, avg 50 → 50. Keeps 20-80 range.
const OVERALL_SCALING_FACTOR = 0.3;

function applyOverallScaling(avg) {
  return avg + (avg - 50) * OVERALL_SCALING_FACTOR;
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
  const avg = weightedSum / totalWeight;
  return clamp(Math.round(applyOverallScaling(avg)), 20, 80);
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
        if (!canonicalPos) { errors++; continue; }
        const validSkills = POSITION_SKILLS[canonicalPos];
        for (const skill of Object.keys(weights)) {
          if (!validSkills.includes(skill)) { errors++; }
        }
      }
    }
  }
  return errors;
}

// =========================================================================
// HELPERS
// =========================================================================

function clamp(val, min, max) {
  return Math.round(Math.max(min, Math.min(max, val)));
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

// =========================================================================
// MADDEN POSITION OVERRIDE
// =========================================================================

/**
 * Correct position misclassifications using Madden position data.
 * Depth chart positions can be wrong for versatile defenders (e.g. Parsons
 * listed at SLB in a 4-3 → classified as LB, but Madden says REDG → EDGE).
 *
 * Rules:
 *   - Madden LEDG/REDG/LOLB/ROLB + current pos LB → override to EDGE
 *   - Madden DT/NT + current pos EDGE → override to DL
 */
const MADDEN_EDGE_POSITIONS = new Set(['LEDG', 'REDG', 'LOLB', 'ROLB', 'LE', 'RE']);
const MADDEN_IDL_POSITIONS = new Set(['DT', 'NT']);

function correctPositionsFromMadden(db) {
  let overrides = 0;
  const examples = [];

  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (!player.madden || !player.madden.position) continue;
      const maddenPos = player.madden.position;
      const curPos = player.position;

      // Edge rushers misclassified as LB
      if (MADDEN_EDGE_POSITIONS.has(maddenPos) && curPos === 'LB') {
        player.position = 'EDGE';
        player.subPosition = 'OLB';
        player.side = 'defense';
        overrides++;
        if (examples.length < 8) examples.push(`${player.name} (${teamCode}): LB → EDGE (Madden: ${maddenPos})`);
      }

      // Interior DL misclassified as EDGE
      if (MADDEN_IDL_POSITIONS.has(maddenPos) && curPos === 'EDGE') {
        player.position = 'DL';
        // Determine sub-position from depth chart pos
        const dcPos = player.depthChartPos;
        if (dcPos === 'NT') {
          player.subPosition = 'NT';
        } else if (dcPos === 'LDT' || dcPos === 'RDT') {
          player.subPosition = '3-Tech';
        } else {
          // DE spot but playing interior — use scheme context
          player.subPosition = '3-4 DE';
        }
        overrides++;
        if (examples.length < 8) examples.push(`${player.name} (${teamCode}): EDGE → DL (Madden: ${maddenPos}, sub: ${player.subPosition})`);
      }
    }
  }

  console.log(`Madden position overrides: ${overrides} players`);
  for (const e of examples) console.log(`  ${e}`);
  return overrides;
}

// =========================================================================
// TIER / ROLE CORRECTIONS (kept from v3.0)
// =========================================================================

function correctTiersAndRoles(db) {
  let corrections = 0;
  for (const [teamCode, players] of Object.entries(db.teams)) {
    const byPosition = {};
    for (const player of players) {
      const pos = player.position;
      if (!byPosition[pos]) byPosition[pos] = [];
      byPosition[pos].push(player);
    }
    for (const player of players) {
      const maddenOvr = player.madden ? player.madden.ovr : null;
      const pffGrade = player.pff ? player.pff.grade : null;
      if (maddenOvr == null && pffGrade == null) continue;

      const signalScore = (maddenOvr || 0) * 0.7 + (pffGrade || 0) * 0.3;
      const posGroup = byPosition[player.position] || [];
      const posSignals = posGroup.map(p => {
        const mo = p.madden ? p.madden.ovr : 0;
        const pg = p.pff ? p.pff.grade : 0;
        return { player: p, score: mo * 0.7 + pg * 0.3 };
      }).sort((a, b) => b.score - a.score);

      const rank = posSignals.findIndex(s => s.player === player);
      const isTopAtPos = rank === 0;

      if (player.role === 'backup' && isTopAtPos && posGroup.length > 1 && signalScore > 50) {
        player.role = 'starter';
      }

      let correctedTier = null;
      if ((maddenOvr >= 90 && (pffGrade == null || pffGrade >= 70)) ||
          (pffGrade >= 85 && (maddenOvr == null || maddenOvr >= 80)) ||
          (maddenOvr >= 85 && pffGrade >= 80)) {
        correctedTier = 'elite';
      } else if ((maddenOvr >= 80 && (pffGrade == null || pffGrade >= 60)) ||
                 (pffGrade >= 75 && (maddenOvr == null || maddenOvr >= 70))) {
        correctedTier = 'above_average';
      } else if ((maddenOvr >= 70 && (pffGrade == null || pffGrade >= 50)) ||
                 (pffGrade >= 65 && (maddenOvr == null || maddenOvr >= 60))) {
        correctedTier = 'average';
      } else if ((maddenOvr >= 60) || (pffGrade >= 55)) {
        correctedTier = 'below_average';
      } else {
        correctedTier = 'developing';
      }

      const tierRank = { elite: 5, above_average: 4, average: 3, starter: 3, below_average: 2, bridge: 2, developing: 1, backup: 0 };
      if ((tierRank[correctedTier] || 0) > (tierRank[player.performanceTier] || 0)) {
        player.performanceTier = correctedTier;
        corrections++;
      }
    }
  }
  console.log(`Tier/role corrections: ${corrections} players`);
  return corrections;
}

// =========================================================================
// CORE RATING GENERATION (v4.0 -- direct skills from Madden attributes)
// =========================================================================

function generatePlayerRatings(player, skillMap) {
  const canonicalPos = POS_MAP[player.position] || player.position;
  const skills = POSITION_SKILLS[canonicalPos];
  if (!skills) return null;

  const pffGrade = player.pff ? player.pff.grade : null;
  const pffStats = player.pff ? player.pff.stats : null;

  // ── Step 1: Get per-skill ratings from Madden individual attributes ──
  const maddenSkills = getMaddenSkillRatings(player, canonicalPos, skillMap);
  const hasMadden = maddenSkills != null;

  // ── Step 2: Fallback base for skills without Madden data ──
  const fallbackBase = hasMadden
    ? null  // Not needed -- Madden covers most skills
    : computeFallbackBase(player);

  // ── Step 3: Stat boosts from 2025 PFF stats only ──
  // No nflverse, no multi-season. PFF data is the sole stat source.
  const statBoosts = getStatBoosts(canonicalPos, player.position, pffStats);

  // ── Step 4: Compute modifier adjustments ──
  // These affect OVERALL only, NOT individual skills. This keeps skills
  // as pure Madden-attribute-derived values with proper differentiation
  // (e.g. arm strength reflects actual throw power, not a uniform boost).
  const pffMod = pffAdjustment(pffGrade);
  const sentMod = sentimentAdjustment(player.sentiment);
  const accMod = accoladesAdjustment(player.accolades);
  const draftMod = draftCapitalAdjustment(player.contract, player.yearsExp || 0);
  const ageMod = ageAdjust(player.age);
  const perfMod = performanceVsExpectation(
    player.madden ? player.madden.ovr : null, pffGrade
  );

  // Total modifier (applied to overall only)
  const totalModifier = pffMod + sentMod + accMod + draftMod + ageMod + perfMod;

  // ── Step 5: Build per-skill ratings ──
  const rng = seededRandom(hashString(player.name + player.team + player.position));
  const ratings = {};
  let totalSkillRating = 0;

  // Track what sources were used
  const sourcesUsed = [];
  if (hasMadden) sourcesUsed.push('madden');
  if (pffGrade != null) sourcesUsed.push('pff');
  if (player.sentiment && player.sentiment.score != null) sourcesUsed.push('sentiment');
  if (player.accolades && (player.accolades.proBowls > 0 || player.accolades.allPro > 0)) sourcesUsed.push('accolades');
  if (player.contract && player.contract.draftRound) sourcesUsed.push('draftCapital');
  if (pffStats) sourcesUsed.push('pffStats');

  // Get source priority map for this position
  const sourcePriority = SKILL_SOURCE_PRIORITY[canonicalPos] || {};
  // Get sentiment skill ratings (new format: actual 20-80 ratings, not adjustments)
  const sentimentRatings = (player.sentiment && player.sentiment.skillRatings) || {};

  // Sentiment gap fill: when sentiment exists for the player but doesn't cover
  // a specific skill, estimate from the overall sentiment score rather than
  // letting Madden crater the value. Score 5 (avg) → ~45, Score 8 → ~60.
  const sentimentScore = player.sentiment ? player.sentiment.score : null;
  const sentimentFallback = sentimentScore != null ? 30 + (sentimentScore - 1) * 3.5 : null;

  // Roster floor: no rostered NFL player should have a 20 ("non-prospect")
  // in any skill. 30 = "well below average pro" which is the realistic minimum.
  const ROSTER_SKILL_FLOOR = 30;

  for (const skill of skills) {
    // ── Step 5a: Compute Madden base for this skill ──
    let maddenBase;
    if (hasMadden && maddenSkills[skill] != null) {
      maddenBase = maddenSkills[skill];
    } else if (hasMadden) {
      const mappedValues = Object.values(maddenSkills);
      maddenBase = mappedValues.reduce((a, b) => a + b, 0) / mappedValues.length;
    } else {
      maddenBase = fallbackBase;
    }

    // Apply roster floor to Madden base — prevents attribute-specific Madden
    // values (e.g. RB passBlock 49 → 20) from cratering to non-prospect levels
    maddenBase = Math.max(maddenBase, ROSTER_SKILL_FLOOR);

    // ── Step 5b: Apply stat boosts to Madden base ──
    let maddenWithStats = maddenBase;
    if (statBoosts[skill]) {
      maddenWithStats += statBoosts[skill];
    }

    // ── Step 5c: Blend per source priority ──
    const priority = sourcePriority[skill] || 'hybrid';
    const hasSentiment = sentimentRatings[skill] != null;
    // When sentiment analysis exists but doesn't cover this specific skill,
    // use a sentiment-derived estimate so Madden doesn't dominate unchecked.
    const sentimentVal = hasSentiment ? sentimentRatings[skill]
      : (sentimentFallback != null ? sentimentFallback : null);
    const useSentiment = sentimentVal != null;
    let skillRating;

    switch (priority) {
      case 'eyeTest':
        // Sentiment is the source (100%). Madden only as fallback.
        if (useSentiment) {
          skillRating = sentimentVal;
        } else {
          skillRating = maddenWithStats;
        }
        break;

      case 'statDriven':
        // Madden+stats 60%, sentiment 40% — stats inform but sentiment has real weight.
        if (useSentiment) {
          skillRating = maddenWithStats * 0.6 + sentimentVal * 0.4;
        } else {
          skillRating = maddenWithStats;
        }
        break;

      case 'measurable':
        // Madden dominates (75%). Sentiment provides minor context (25%).
        if (useSentiment) {
          skillRating = maddenBase * 0.75 + sentimentVal * 0.25;
        } else {
          skillRating = maddenBase;
        }
        break;

      case 'hybrid':
      default:
        // Sentiment leads (60%), Madden provides baseline (40%).
        if (useSentiment) {
          skillRating = maddenWithStats * 0.4 + sentimentVal * 0.6;
        } else {
          skillRating = maddenWithStats;
        }
        break;
    }

    // Small variance for differentiation (±1 range)
    const variance = (rng() - 0.5) * 2;
    skillRating += variance;

    // Apply roster floor — no rostered player is a "non-prospect" at any skill
    skillRating = clamp(skillRating, ROSTER_SKILL_FLOOR, 80);
    ratings[skill] = skillRating;
    totalSkillRating += skillRating;
  }

  // Overall = scaled mean of skills + modifier adjustment (modifiers affect overall only)
  const skillMean = totalSkillRating / skills.length;
  const overall = clamp(Math.round(applyOverallScaling(skillMean) + totalModifier), 20, 80);

  return {
    overall,
    skills: ratings,
    canonicalPosition: canonicalPos,
    sourcesUsed: sourcesUsed.length > 0 ? sourcesUsed : ['tier']
  };
}

// =========================================================================
// POST-HOC NORMALIZATION
// =========================================================================

/**
 * Number of starters per team for each canonical position.
 * Used to identify the "starter cohort" for normalization:
 * we shift so the STARTER mean = 50 (average NFL starter),
 * letting backups and depth fall below 50 naturally.
 */
const STARTERS_PER_TEAM = {
  QB: 1, RB: 1, WR: 3, TE: 1, FB: 0.5,
  OT: 2, OG: 3, OC: 3,
  EDGE: 2, IDL: 2.5, LB: 2.5,
  DB: 3, K: 1, P: 1, LS: 1,
};

/**
 * Skills are NOT normalized — they stay as pure Madden-attribute-derived
 * values on the 20-80 scale. This preserves realistic differentiation
 * (e.g. Allen's arm strength > Goff's arm strength).
 *
 * Only OVERALL gets normalized via starter-mean-shift + modifiers.
 */

/**
 * Normalize ratings per position group via starter-mean-shift.
 *
 * Scale reference:
 *   80: Elite / perennial All-Pro / HoF talent
 *   70: Plus-plus; high-level starter / All-Pro
 *   60: Above-average; solid starter
 *   50: Average; typical NFL starter
 *   40: Below-average; functional backup / specialist
 *   30: Well below-average; emergency player / camp body
 *   20: Non-prospect
 *
 * Overall gets the full shift; skills get a reduced shift (SKILL_NORM_FACTOR)
 * so elite individual attributes are preserved.
 */
function normalizeRatings(db, targetStarterMean) {
  const byPos = {};

  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (!player.ratings) continue;
      const pos = player.ratings.position || POS_MAP[player.position] || player.position;
      if (!byPos[pos]) byPos[pos] = [];
      byPos[pos].push(player);
    }
  }

  let totalAdjusted = 0;
  console.log('\n--- Pre-Normalization Distribution ---');

  for (const [pos, players] of Object.entries(byPos)) {
    if (players.length < 3) continue;

    const posSkills = POSITION_SKILLS[pos] || Object.keys(players[0]?.ratings?.skills || {});

    // Compute the skill mean (raw attributes only) and modifier delta
    // for each player. Overall = skillMean + modifiers.
    const playerData = players.map(p => {
      const vals = posSkills.map(s => p.ratings.skills[s]).filter(v => v != null);
      const skillMean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 20;
      const modifierDelta = p.ratings.overall - skillMean;
      return { player: p, skillMean, modifierDelta };
    });

    // Determine starter count for this position
    const startersPerTeam = STARTERS_PER_TEAM[pos] || 1;
    const starterCount = Math.min(Math.round(startersPerTeam * 32), players.length);

    // Compute shift from SKILL MEANS (not overall), so modifiers aren't
    // washed out. The shift normalizes the raw-talent base; modifiers
    // provide differentiation above/below for PFF, sentiment, accolades, etc.
    const sortedBySkillMean = [...playerData].sort((a, b) => b.skillMean - a.skillMean);
    const starterSkillMeans = sortedBySkillMean.slice(0, starterCount).map(d => d.skillMean);
    const starterMean = starterSkillMeans.reduce((a, b) => a + b, 0) / starterSkillMeans.length;

    const shift = Math.round(targetStarterMean - starterMean);

    const overalls = players.map(p => p.ratings.overall);
    const ovrMean = overalls.reduce((a, b) => a + b, 0) / overalls.length;

    console.log(`  ${pos.padEnd(5)} | ${players.length.toString().padStart(4)} pl | StarterN: ${starterCount.toString().padStart(3)} | SkillMean: ${starterMean.toFixed(1)} | OvrMean: ${ovrMean.toFixed(1)} | OVR Shift: ${shift > 0 ? '+' : ''}${shift}`);

    if (shift === 0) continue;

    for (const { player, skillMean, modifierDelta } of playerData) {
      // Skills: NOT shifted (stay as raw Madden-attribute values)
      // Overall: scaled normalized skill base + modifiers
      const normalizedBase = skillMean + shift;
      player.ratings.overall = clamp(Math.round(applyOverallScaling(normalizedBase) + modifierDelta), 20, 80);
      totalAdjusted++;
    }
  }

  console.log(`Normalization: ${totalAdjusted} players (skills untouched, overall shifted + modifiers preserved)`);
  return totalAdjusted;
}

// =========================================================================
// POST-NORMALIZATION SENTIMENT ADJUSTMENT
// =========================================================================

/**
 * Apply sentiment as a post-normalization adjustment so it is NOT washed
 * out by the starter-mean-shift.  This is where sentiment has real bite.
 *
 * Adjustment = (score − 5) × 1.5, clamped to [−5, +5].
 *   score 10 → +5       score 7 → +3        score 4 → −1.5
 *   score  9 → +5       score 6 → +1.5      score 3 → −3
 *   score  8 → +4.5     score 5 →  0        score 2 → −4.5
 *
 * Adjusts every skill, then recalculates overall.
 */
function applySentimentPostNorm(db) {
  let adjusted = 0;
  let skipped = 0;

  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (!player.ratings || !player.ratings.skills) continue;
      if (!player.sentiment || player.sentiment.score == null) { skipped++; continue; }

      const score = player.sentiment.score;
      if (score === 5) continue; // neutral — no adjustment

      // Reduced multiplier (0.5/pt) — sentiment now directly impacts individual
      // skills via SKILL_SOURCE_PRIORITY, so this overall nudge is just a tiebreaker.
      const raw = (score - 5) * 0.5;
      const adj = Math.max(-3, Math.min(3, raw));

      player.ratings.overall = clamp(player.ratings.overall + Math.round(adj), 20, 80);

      adjusted++;
    }
  }

  console.log(`Post-norm sentiment adjustment: ${adjusted} players adjusted, ${skipped} without sentiment`);
  return adjusted;
}

// =========================================================================
// RARITY ENFORCEMENT (new in v4.1)
// =========================================================================

// Rules defining how many players of a given position may exceed a rating
// threshold.  Entries are checked in descending order so that higher bars are
// enforced first.  Specialist positions also cap how many players may sit at or
// above the `average starter` mark (50).
const RARITY_RULES = {
  QB:  [{threshold:80, max:3}, {threshold:75, max:8}, {threshold:70, max:32}],
  RB:  [{threshold:80, max:3}, {threshold:75, max:10}, {threshold:70, max:32}],
  WR:  [{threshold:80, max:3}, {threshold:75, max:10}, {threshold:70, max:32}],
  TE:  [{threshold:80, max:3}, {threshold:75, max:8}, {threshold:70, max:32}],
  OT:  [{threshold:80, max:3}, {threshold:75, max:8}],
  OG:  [{threshold:80, max:3}, {threshold:75, max:8}],
  OC:  [{threshold:80, max:2}, {threshold:75, max:6}],
  EDGE:[{threshold:80, max:3}, {threshold:75, max:8}],
  IDL: [{threshold:80, max:3}, {threshold:75, max:8}],
  LB:  [{threshold:80, max:3}, {threshold:75, max:8}],
  DB:  [{threshold:80, max:3}, {threshold:75, max:8}],
  K:   [{threshold:50, max:32}],
  P:   [{threshold:50, max:32}],
  LS:  [{threshold:50, max:32}],
};

function applyRarityNormalization(db) {
  let adjusted = 0;
  for (const [pos, rules] of Object.entries(RARITY_RULES)) {
    // collect all players at exactly this roster position
    const players = Object.values(db.teams)
      .flat()
      .filter(p => p.position === pos && p.ratings && typeof p.ratings.overall === 'number');
    if (players.length === 0) continue;

    players.sort((a, b) => b.ratings.overall - a.ratings.overall);

    for (const rule of rules) {
      let above = players.filter(p => p.ratings.overall >= rule.threshold);
      while (above.length > rule.max) {
        const pl = above.pop(); // lowest player still above threshold
        pl.ratings.overall = rule.threshold - 1;
        adjusted++;
      }
    }
  }
  console.log(`Rarity normalization adjusted ${adjusted} players`);
  return adjusted;
}

// =========================================================================
// AUTO-ASSIGN DEPTH CHART ROLES FROM RATINGS
// =========================================================================

const DC_PATH = path.join(__dirname, '..', 'data', 'teams', 'depth_charts_2026.json');

// Number of starters per canonical position
const STARTER_COUNTS_34 = {
  QB: 1, RB: 1, WR: 3, TE: 1, FB: 1,
  OT: 2, IOL: 3,
  EDGE: 2, DL: 3, LB: 2,
  CB: 2, NB: 1, S: 2,
  K: 1, P: 1, LS: 1,
};
const STARTER_COUNTS_43 = {
  QB: 1, RB: 1, WR: 3, TE: 1, FB: 1,
  OT: 2, IOL: 3,
  EDGE: 2, DL: 2, LB: 3,
  CB: 2, NB: 1, S: 2,
  K: 1, P: 1, LS: 1,
};

// 3-4 scheme template positions for depth chart JSON
const DEFENSE_TEMPLATE_34 = ['LDE', 'NT', 'RDE', 'SLB', 'WLB', 'LILB', 'RILB'];
// 4-3 scheme template positions for depth chart JSON
const DEFENSE_TEMPLATE_43 = ['LDE', 'LDT', 'RDT', 'RDE', 'WLB', 'MLB', 'SLB'];
// Secondary is the same for both
const SECONDARY_TEMPLATE = ['LCB', 'RCB', 'NB', 'FS', 'SS'];
// Offense template
const OFFENSE_TEMPLATE = ['QB', 'RB', 'WR', 'WR', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];

/**
 * Get the best scheme overall for a player (team-specific scheme if available).
 */
function getPlayerSchemeRating(player, schemes) {
  if (!player.ratings) return 0;
  // Use the team's scheme overall if available, else fall back to overall
  const teamSchemeOvrs = player.ratings.schemeOveralls || {};
  const schemeOvrValues = Object.values(teamSchemeOvrs);
  if (schemeOvrValues.length > 0) {
    return Math.max(...schemeOvrValues);
  }
  return player.ratings.overall || 0;
}

/**
 * Assign starter/backup/depth roles based on player ratings.
 * Preserves rosterStatus from the NFL roster (ACT, RES, DEV, INA).
 * Generates rating-based depth_charts_2026.json.
 */
function assignDepthChartRoles(db, schemes) {
  let depthCharts;
  try {
    depthCharts = JSON.parse(fs.readFileSync(DC_PATH, 'utf-8'));
  } catch (e) {
    console.warn('Could not load existing depth charts; skipping depth chart role assignment.');
    return;
  }

  let roleChanges = 0;
  const updatedDC = {};

  for (const [teamCode, players] of Object.entries(db.teams)) {
    const frontType = depthCharts[teamCode]?.frontType || '43';
    const starterCounts = frontType === '34' ? STARTER_COUNTS_34 : STARTER_COUNTS_43;

    // Group by canonical position
    const byPos = {};
    for (const player of players) {
      const pos = player.position;
      if (!byPos[pos]) byPos[pos] = [];
      byPos[pos].push(player);
    }

    // Sort each position group by overall rating (descending)
    for (const [pos, posPlayers] of Object.entries(byPos)) {
      posPlayers.sort((a, b) => {
        const ovrA = a.ratings ? a.ratings.overall : 0;
        const ovrB = b.ratings ? b.ratings.overall : 0;
        return ovrB - ovrA;
      });

      const numStarters = starterCounts[pos] || 1;

      for (let i = 0; i < posPlayers.length; i++) {
        let newRole;
        if (i < numStarters) {
          newRole = 'starter';
        } else if (i < numStarters * 2) {
          newRole = 'backup';
        } else {
          newRole = 'depth';
        }

        if (posPlayers[i].role !== newRole) {
          posPlayers[i].role = newRole;
          roleChanges++;
        }
      }
    }

    // ── Regenerate depth chart JSON for this team ──
    const defTemplate = frontType === '34' ? DEFENSE_TEMPLATE_34 : DEFENSE_TEMPLATE_43;
    const fullDefTemplate = [...defTemplate, ...SECONDARY_TEMPLATE];

    const offense = [];
    const defense = [];

    // Map canonical position back to depth chart slot positions
    const dcPosToCanonical = {};
    // Offense
    const offCanonicalMap = {
      QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FB: 'FB',
      LT: 'OT', RT: 'OT', LG: 'IOL', RG: 'IOL', C: 'IOL',
    };
    // Defense depends on front
    const defCanonicalMap34 = {
      LDE: 'DL', NT: 'DL', RDE: 'DL',
      SLB: 'EDGE', WLB: 'EDGE',
      LILB: 'LB', RILB: 'LB',
      LCB: 'CB', RCB: 'CB', NB: 'NB', FS: 'S', SS: 'S',
    };
    const defCanonicalMap43 = {
      LDE: 'EDGE', RDE: 'EDGE',
      LDT: 'DL', RDT: 'DL',
      WLB: 'LB', MLB: 'LB', SLB: 'LB',
      LCB: 'CB', RCB: 'CB', NB: 'NB', FS: 'S', SS: 'S',
    };
    const defCanonicalMap = frontType === '34' ? defCanonicalMap34 : defCanonicalMap43;

    // Build offense slots
    const usedOffense = new Set();
    for (const dcPos of OFFENSE_TEMPLATE) {
      const canonical = offCanonicalMap[dcPos];
      const eligible = (byPos[canonical] || []).filter(p => !usedOffense.has(p.name));
      // Prefer players whose depthChartPos matches this slot
      const exactMatch = eligible.filter(p => p.depthChartPos === dcPos);
      const picked = exactMatch.length > 0 ? exactMatch : eligible;
      const starter = picked[0] || null;
      const backup = picked[1] || (eligible.length > (exactMatch.length > 0 ? 0 : 0) ? eligible.filter(p => p !== starter)[0] : null);
      if (starter) usedOffense.add(starter.name);
      if (backup) usedOffense.add(backup.name);
      offense.push({
        pos: dcPos,
        starter: starter ? { name: starter.name, expiring: starter.contract?.isExpiring || false } : null,
        backup: backup ? { name: backup.name, expiring: backup.contract?.isExpiring || false } : null,
      });
    }

    // Build defense slots
    const usedDefense = new Set();
    for (const dcPos of fullDefTemplate) {
      const canonical = defCanonicalMap[dcPos];
      const eligible = (byPos[canonical] || []).filter(p => !usedDefense.has(p.name));
      // Prefer players whose depthChartPos matches
      const exactMatch = eligible.filter(p => p.depthChartPos === dcPos);
      const picked = exactMatch.length > 0 ? exactMatch : eligible;
      const starter = picked[0] || null;
      const backup = picked[1] || (eligible.filter(p => p !== starter)[0] || null);
      if (starter) usedDefense.add(starter.name);
      if (backup) usedDefense.add(backup.name);
      defense.push({
        pos: dcPos,
        starter: starter ? { name: starter.name, expiring: starter.contract?.isExpiring || false } : null,
        backup: backup ? { name: backup.name, expiring: backup.contract?.isExpiring || false } : null,
      });
    }

    updatedDC[teamCode] = { frontType, offense, defense };
  }

  // Save updated depth charts
  fs.writeFileSync(DC_PATH, JSON.stringify(updatedDC, null, 2));
  console.log(`Depth chart role assignment: ${roleChanges} role changes across all teams`);
  console.log(`Regenerated depth_charts_2026.json from ratings`);

  // Print sample
  const chi = updatedDC['CHI'];
  if (chi) {
    console.log(`\nCHI (${chi.frontType === '34' ? '3-4' : '4-3'}) rating-based depth chart:`);
    console.log('  Offense:');
    chi.offense.forEach(p => {
      console.log(`    ${p.pos.padEnd(4)}: ${(p.starter?.name || '-').padEnd(22)} / ${p.backup?.name || '-'}`);
    });
    console.log('  Defense:');
    chi.defense.forEach(p => {
      console.log(`    ${p.pos.padEnd(5)}: ${(p.starter?.name || '-').padEnd(22)} / ${p.backup?.name || '-'}`);
    });
  }
}

// =========================================================================
// MAIN
// =========================================================================

function main() {
  console.log('Loading player database...');
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  console.log('Loading Madden skill map...');
  const skillMap = JSON.parse(fs.readFileSync(SKILL_MAP_PATH, 'utf-8'));

  console.log('Loading scheme weights...');
  const schemes = JSON.parse(fs.readFileSync(SCHEME_PATH, 'utf-8'));

  console.log('\nValidating scheme weights...');
  const weightErrors = validateSchemeWeights(schemes);
  if (weightErrors > 0) {
    console.warn(`Found ${weightErrors} scheme weight key mismatches (will be ignored).`);
  } else {
    console.log('All scheme weight keys are valid.');
  }

  console.log('\nCorrecting positions from Madden data...');
  correctPositionsFromMadden(db);

  console.log('\nCorrecting tier/role assignments...');
  correctTiersAndRoles(db);

  let totalPlayers = 0;
  let ratingsGenerated = 0;
  let skipped = 0;
  const positionStats = {};
  const sourceCounters = { madden: 0, pff: 0, sentiment: 0, accolades: 0, draftCapital: 0, pffStats: 0, tier: 0 };

  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      totalPlayers++;
      const ratings = generatePlayerRatings(player, skillMap);

      if (ratings) {
        ratingsGenerated++;
        for (const src of ratings.sourcesUsed) {
          sourceCounters[src] = (sourceCounters[src] || 0) + 1;
        }

        // Compute scheme overalls
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

  console.log(`\n=== Pre-Normalization Ratings (v4.0 Direct Skills) ===`);
  console.log(`Total: ${totalPlayers} | Generated: ${ratingsGenerated} | Skipped: ${skipped}`);

  // ── Post-hoc normalization ──
  // Target 53: the SKILL BASE of the average starter normalizes to 53,
  // but modifiers and sentiment bring the median starter's overall to ~50.
  // This gives elite QBs enough headroom to reach the 70s.
  console.log('\nApplying post-hoc normalization (starter skill base → 53)...');
  normalizeRatings(db, 53);

  // ── Post-normalization sentiment adjustment (survives normalization) ──
  console.log('\nApplying post-normalization sentiment adjustment...');
  applySentimentPostNorm(db);

  // ── Rarity enforcement to rein in the tails of the distribution ──
  if (typeof applyRarityNormalization === 'function') {
    console.log('Applying rarity normalization...');
    applyRarityNormalization(db);
  }

  // ── Recalculate scheme overalls after normalization + sentiment ──
  console.log('Recalculating scheme overalls after normalization...');
  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (!player.ratings || !player.ratings.skills) continue;

      const schemeOveralls = {};
      const side = player.side;
      const schemeSide = side === 'offense' ? 'offensive' : side === 'defense' ? 'defensive' : null;
      const schemePosKey = getSchemePositionKey(player.position);

      if (schemeSide && schemes[schemeSide]) {
        for (const [schemeName, schemeData] of Object.entries(schemes[schemeSide])) {
          const weights = schemeData[schemePosKey];
          if (weights && typeof weights === 'object') {
            const schemeOvr = calculateSchemeOverall(player.ratings.skills, weights);
            if (schemeOvr != null) {
              schemeOveralls[schemeName] = schemeOvr;
            }
          }
        }
      }

      player.ratings.schemeOveralls = schemeOveralls;
    }
  }

  // ── Auto-assign depth chart roles from ratings ──
  console.log('\nAssigning depth chart roles from ratings...');
  assignDepthChartRoles(db, schemes);

  // ── Update metadata ──
  db.meta.ratingsGenerated = new Date().toISOString();
  db.meta.ratingsVersion = '4.0';
  db.meta.ratingScale = '20-80 scouting scale';
  db.meta.ratingModel = 'Direct skills from Madden attributes (recalibrated), PFF/sentiment/accolades modifiers, post-hoc normalization';

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));

  // ── Reporting ──
  console.log('\n=== Player Rating Generation Complete (v4.0) ===');
  console.log(`Total players: ${totalPlayers}`);
  console.log(`Ratings generated: ${ratingsGenerated}`);
  console.log(`Skipped: ${skipped}`);

  console.log('\n--- Source Coverage ---');
  for (const [src, count] of Object.entries(sourceCounters)) {
    const pct = ratingsGenerated > 0 ? Math.round(count / ratingsGenerated * 100) : 0;
    console.log(`  ${src.padEnd(14)} | ${count.toString().padStart(5)} players (${pct}%)`);
  }

  console.log('\n--- Post-Normalization Distribution by Position ---');
  const postStats = {};
  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (!player.ratings) continue;
      const pos = player.position;
      if (!postStats[pos]) postStats[pos] = { count: 0, totalOvr: 0, min: 80, max: 20 };
      postStats[pos].count++;
      postStats[pos].totalOvr += player.ratings.overall;
      postStats[pos].min = Math.min(postStats[pos].min, player.ratings.overall);
      postStats[pos].max = Math.max(postStats[pos].max, player.ratings.overall);
    }
  }
  const sorted = Object.entries(postStats).sort((a, b) => b[1].count - a[1].count);
  for (const [pos, data] of sorted) {
    const avg = Math.round(data.totalOvr / data.count);
    console.log(`  ${pos.padEnd(5)} | ${data.count.toString().padStart(4)} players | Avg: ${avg} | Range: ${data.min}-${data.max}`);
  }

  console.log('\n--- Sample Players ---');
  const sampleNames = ['Patrick Mahomes', 'Josh Allen', 'Caleb Williams', 'Jalen Hurts', 'Dak Prescott',
                        'Jared Goff', 'Jalen Carter', 'Derrick Brown', 'Myles Garrett', 'Sauce Gardner'];
  for (const [teamCode, players] of Object.entries(db.teams)) {
    for (const player of players) {
      if (sampleNames.includes(player.name) && player.ratings) {
        const arm = player.ratings.skills.armStrength || '-';
        console.log(`  ${player.name} (${player.position}, ${teamCode}): OVR ${player.ratings.overall} | ARM: ${arm} | Sources: ${player.ratings.sourcesUsed.join(', ')}`);
      }
    }
  }
}

main();
