const fs = require('fs');
const path = require('path');

const prospectsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/prospects/current/2026_prospects.json'), 'utf8'));
const draftOrderData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/draft/2026_draft_order.json'), 'utf8'));
const teamNeedsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/teams/nflmdd_team_needs_2026.json'), 'utf8'));
const teamSchemesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/teams/team_schemes.json'), 'utf8'));
const schemeWeightsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/schemes/scheme_skill_weights.json'), 'utf8'));

const POSITION_VALUE = {
    QB: 12, OT: 6, EDGE: 6, WR: 3, RB: -12, FB: -15, TE: 0,
    OG: 0, C: 0, IOL: 0, OL: 0, IDL: 0, DT: 0, NT: 0, DL: 0,
    LB: 0, ILB: 0, MLB: 0, CB: 2, S: 1, FS: 1, SS: 1
};

const TEAM_DATA = {
    Raiders: { abbr: "LV" }, Jets: { abbr: "NYJ" }, Cardinals: { abbr: "ARI" },
    Titans: { abbr: "TEN" }, Giants: { abbr: "NYG" }, Browns: { abbr: "CLE" },
    Commanders: { abbr: "WAS" }, Saints: { abbr: "NO" }, Chiefs: { abbr: "KC" },
    Bengals: { abbr: "CIN" }, Dolphins: { abbr: "MIA" }, Cowboys: { abbr: "DAL" },
    Rams: { abbr: "LAR" }, Ravens: { abbr: "BAL" }, Panthers: { abbr: "CAR" },
    Jaguars: { abbr: "JAX" }, Colts: { abbr: "IND" }, Chargers: { abbr: "LAC" },
    Bears: { abbr: "CHI" }, Falcons: { abbr: "ATL" }, "49ers": { abbr: "SF" },
    Seahawks: { abbr: "SEA" }, Packers: { abbr: "GB" }, Texans: { abbr: "HOU" },
    Vikings: { abbr: "MIN" }, Buccaneers: { abbr: "TB" }, Steelers: { abbr: "PIT" },
    Eagles: { abbr: "PHI" }, Bills: { abbr: "BUF" }, Lions: { abbr: "DET" },
    Broncos: { abbr: "DEN" }, Patriots: { abbr: "NE" }
};

function mapPositionToNeed(pos) {
    const map = {
        OT: "OT", OG: "IOL", C: "IOL", IOL: "IOL", OL: "OL",
        DE: "EDGE", OLB: "EDGE", EDGE: "EDGE",
        DT: "DL", NT: "DL", IDL: "DL", DL: "DL",
        ILB: "LB", MLB: "LB", LB: "LB",
        FS: "S", SS: "S", S: "S", CB: "CB",
        QB: "QB", WR: "WR", RB: "RB", TE: "TE", FB: "RB", K: "K", P: "P", LS: "LS"
    };
    return map[pos] || pos;
}

function seededRandom(seed) {
    let s = seed >>> 0;
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 13), 0x45d9f3b);
    s = (s ^ (s >>> 16)) >>> 0;
    return s / 4294967296;
}

const userTeamName = "Bears";
const draftSessionSeed = Math.floor(Math.random() * 1000000);

const prospects = prospectsData.prospects.map(p => ({
    id: p.id,
    name: p.name.display || p.name,
    position: p.position,
    school: p.school,
    consensus_rank: p.consensus?.rank || 300,
    range_low: p.consensus?.range_low,
    range_high: p.consensus?.range_high,
    pff_grade: p.grades?.pff_overall,
    archetype: p.archetype,
    comparison: p.comparison,
    developmentCertainty: p.developmentCertainty,
    projection: p.projection,
    scouting_report: p.scouting_report,
    drafted: false
}));

const draftOrder = (draftOrderData.picks || draftOrderData).map(p => ({
    overall: p.overall || p.pick,
    round: p.round,
    pick: p.pick_in_round || p.pick,
    team: p.team,
    value: p.value || p.trade_value || 0,
    via: p.via || null,
    drafted: null
}));

const allTeamNeeds = {};
if (teamNeedsData.teams) {
    Object.entries(teamNeedsData.teams).forEach(([key, val]) => {
        allTeamNeeds[key] = val;
    });
} else {
    Object.entries(teamNeedsData).forEach(([key, val]) => {
        if (key !== 'meta') allTeamNeeds[key] = val;
    });
}

const teamSchemes = teamSchemesData.teams || teamSchemesData;
const teamDraftBoards = {};
const teamFilledNeeds = {};
const trades = [];
const pickResults = [];

function generateTeamDraftBoards() {
    const teams = Object.keys(TEAM_DATA);
    teams.forEach(teamName => {
        const teamData = TEAM_DATA[teamName];
        const abbr = teamData.abbr;
        const needs = allTeamNeeds[abbr] || { primary: [], secondary: [] };

        const scoredProspects = prospects.map(p => {
            const consensusRank = p.consensus_rank || 300;
            let posValue = POSITION_VALUE[p.position] || 0;

            if (p.position === 'RB') {
                if (consensusRank <= 10) posValue = -2;
                else if (consensusRank <= 25) posValue = -5;
            }
            if (p.position === 'QB' && consensusRank <= 15) posValue = 15;

            const needCategory = mapPositionToNeed(p.position);
            let needBoost = 0;
            if (needs.primary && needs.primary.includes(needCategory)) needBoost = 8;
            else if (needs.secondary && needs.secondary.includes(needCategory)) needBoost = 4;

            const devCert = p.developmentCertainty?.score ?? 0.5;
            const varianceMultiplier = 0.5 + (1 - devCert);

            let baseVariance;
            if (consensusRank <= 3) baseVariance = 2;
            else if (consensusRank <= 10) baseVariance = 4;
            else if (consensusRank <= 20) baseVariance = 8;
            else if (consensusRank <= 50) baseVariance = 15;
            else baseVariance = 25;

            const charSum = (teamName + p.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const seed = charSum * 2654435761 + draftSessionSeed;
            const randomFactor = seededRandom(seed) * 2 - 1;
            const variance = Math.round(randomFactor * baseVariance * varianceMultiplier);
            const boardRank = consensusRank - posValue - needBoost + variance;

            return { id: p.id, boardRank, consensusRank };
        });

        scoredProspects.sort((a, b) => a.boardRank - b.boardRank);
        teamDraftBoards[teamName] = scoredProspects.map(p => ({ id: p.id, boardRank: p.boardRank }));
    });
}

function getTeamBoardRank(teamName, prospectId) {
    const board = teamDraftBoards[teamName];
    if (!board) return 999;
    const idx = board.findIndex(p => p.id === prospectId);
    return idx >= 0 ? idx + 1 : 999;
}

function getTeamPick(teamName) {
    const board = teamDraftBoards[teamName];
    if (!board) return prospects.find(p => !p.drafted);
    for (const entry of board) {
        const prospect = prospects.find(p => p.id === entry.id && !p.drafted);
        if (prospect) return prospect;
    }
    return prospects.find(p => !p.drafted);
}

function evaluateTradeMotivation(teamName, pickOverall, currentPick) {
    const board = teamDraftBoards[teamName];
    if (!board) return null;
    const teamData = TEAM_DATA[teamName];
    if (!teamData) return null;
    const abbr = teamData.abbr;
    const needs = allTeamNeeds[abbr] || { primary: [], secondary: [] };
    const filled = teamFilledNeeds[teamName] || [];
    const primaryNeeds = (needs.primary || []).filter(n => !filled.includes(n));
    const secondaryNeeds = (needs.secondary || []).filter(n => !filled.includes(n));

    const teamPicks = draftOrder.filter(d => d.team === teamName && d.overall >= currentPick && !d.drafted);
    if (teamPicks.length < 2) return null;

    const nextTeamPick = teamPicks[0];
    if (!nextTeamPick || nextTeamPick.overall <= pickOverall) return null;

    const spotsAhead = nextTeamPick.overall - pickOverall;
    if (spotsAhead < 2) return null;

    const availableProspects = prospects.filter(p => !p.drafted);

    let bestTarget = null;
    let bestMotivation = 0;

    for (let i = 0; i < Math.min(board.length, 80); i++) {
        const entry = board[i];
        const prospect = availableProspects.find(p => p.id === entry.id);
        if (!prospect) continue;

        const boardRank = i + 1;
        const teamPickSlot = nextTeamPick.overall;
        const boardGap = teamPickSlot - boardRank;
        if (boardGap < 3) continue;

        const needCategory = mapPositionToNeed(prospect.position);
        let needScore = 0;
        if (primaryNeeds.includes(needCategory)) needScore = 15;
        else if (secondaryNeeds.includes(needCategory)) needScore = 7;

        let positionPremium = 0;
        if (prospect.position === 'QB' && boardRank <= 10) positionPremium = 12;
        else if (['EDGE', 'OT'].includes(prospect.position) && boardRank <= 15) positionPremium = 6;
        else if (prospect.position === 'WR' && boardRank <= 12) positionPremium = 4;

        let riskOfLoss = 0;
        if (spotsAhead > 20) riskOfLoss = 3;
        else if (spotsAhead > 10) riskOfLoss = 6;
        else if (spotsAhead > 5) riskOfLoss = 10;
        else riskOfLoss = 14;

        const motivation = boardGap * 0.6 + needScore + positionPremium + riskOfLoss;

        if (motivation > bestMotivation && motivation >= 18) {
            bestMotivation = motivation;
            bestTarget = {
                prospect, motivation, boardRank,
                needLevel: primaryNeeds.includes(needCategory) ? 'primary' : (secondaryNeeds.includes(needCategory) ? 'secondary' : 'none'),
                fromPick: nextTeamPick.overall,
                toPick: pickOverall
            };
        }
        if (bestTarget) break;
    }

    return bestTarget;
}

function buildTradePackage(buyerTeam, targetPickOverall, currentPick) {
    const buyerPicks = draftOrder.filter(d => d.team === buyerTeam && d.overall >= currentPick && !d.drafted)
        .sort((a, b) => a.overall - b.overall);
    if (buyerPicks.length < 2) return null;

    const targetPick = draftOrder.find(d => d.overall === targetPickOverall);
    if (!targetPick) return null;
    const targetValue = targetPick.value || 0;

    let bestPackage = null;
    let bestOverpay = Infinity;

    for (let i = 0; i < buyerPicks.length; i++) {
        const main = buyerPicks[i];
        if (main.overall <= targetPickOverall) continue;

        let packageValue = main.value || 0;

        if (packageValue >= targetValue * 0.85 && packageValue <= targetValue * 1.3) {
            const overpay = packageValue - targetValue;
            if (Math.abs(overpay) < Math.abs(bestOverpay)) {
                bestOverpay = overpay;
                bestPackage = { give: [main], receive: [targetPick], giveValue: packageValue, receiveValue: targetValue };
            }
        }

        for (let j = i + 1; j < buyerPicks.length && j < i + 4; j++) {
            const extra = buyerPicks[j];
            const twoPickValue = packageValue + (extra.value || 0);
            if (twoPickValue >= targetValue * 0.85 && twoPickValue <= targetValue * 1.5) {
                const overpay = twoPickValue - targetValue;
                if (overpay >= 0 && overpay < bestOverpay) {
                    bestOverpay = overpay;
                    bestPackage = { give: [main, extra], receive: [targetPick], giveValue: twoPickValue, receiveValue: targetValue };
                }
            }

            for (let k = j + 1; k < buyerPicks.length && k < j + 3; k++) {
                const third = buyerPicks[k];
                const threePickValue = twoPickValue + (third.value || 0);
                if (threePickValue >= targetValue * 0.9 && threePickValue <= targetValue * 1.5) {
                    const overpay = threePickValue - targetValue;
                    if (overpay >= 0 && overpay < bestOverpay) {
                        bestOverpay = overpay;
                        bestPackage = { give: [main, extra, third], receive: [targetPick], giveValue: threePickValue, receiveValue: targetValue };
                    }
                }
            }
        }
    }

    return bestPackage;
}

function runDraft() {
    generateTeamDraftBoards();
    console.log(`Draft session seed: ${draftSessionSeed}`);
    console.log(`Simulating for user team: ${userTeamName}`);

    let currentPick = 1;

    while (currentPick <= 257) {
        const pickData = draftOrder.find(d => d.overall === currentPick);
        if (!pickData) { currentPick++; continue; }

        if (!pickData._tradeChecked) {
            const teams = Object.keys(TEAM_DATA).filter(t => t !== pickData.team);
            const shuffled = [...teams].sort(() => seededRandom(currentPick * 31 + draftSessionSeed) - 0.5);

            for (const buyerTeam of shuffled.slice(0, 10)) {
                const motivation = evaluateTradeMotivation(buyerTeam, currentPick, currentPick);
                if (!motivation) continue;

                const tradeRoll = seededRandom(currentPick * 97 + buyerTeam.length * 13 + draftSessionSeed);
                const tradeChance = Math.min(0.35, (motivation.motivation - 18) * 0.03 + 0.08);
                if (tradeRoll > tradeChance) continue;

                const package_ = buildTradePackage(buyerTeam, currentPick, currentPick);
                if (!package_) continue;

                const originalSeller = pickData.team;

                package_.give.forEach(pick => {
                    const p = draftOrder.find(d => d.overall === pick.overall);
                    if (p) { p.team = originalSeller; p.via = buyerTeam; }
                });
                package_.receive.forEach(pick => {
                    const p = draftOrder.find(d => d.overall === pick.overall);
                    if (p) { p.team = buyerTeam; p.via = originalSeller; }
                });

                trades.push({
                    beforePick: currentPick,
                    buyer: buyerTeam,
                    seller: originalSeller,
                    buyerGives: package_.give.map(p => ({ overall: p.overall, round: p.round, value: p.value || 0 })),
                    buyerReceives: package_.receive.map(p => ({ overall: p.overall, round: p.round, value: p.value || 0 })),
                    giveValue: package_.giveValue,
                    receiveValue: package_.receiveValue,
                    motivation: {
                        score: motivation.motivation,
                        needLevel: motivation.needLevel,
                        targetPlayer: motivation.prospect.name,
                        targetPosition: motivation.prospect.position
                    }
                });

                pickData._tradeChecked = true;
                break;
            }
        }

        const pickingTeam = draftOrder.find(d => d.overall === currentPick).team;
        const pick = getTeamPick(pickingTeam);

        if (pick) {
            pick.drafted = true;
            pickData.drafted = { name: pick.name, position: pick.position };

            const needCategory = mapPositionToNeed(pick.position);
            if (!teamFilledNeeds[pickingTeam]) teamFilledNeeds[pickingTeam] = [];
            teamFilledNeeds[pickingTeam].push(needCategory);

            const abbr = TEAM_DATA[pickingTeam]?.abbr;
            const needs = allTeamNeeds[abbr] || { primary: [], secondary: [] };
            const filled = teamFilledNeeds[pickingTeam] || [];
            const primaryNeeds = (needs.primary || []).filter(n => !filled.includes(n));
            const secondaryNeeds = (needs.secondary || []).filter(n => !filled.includes(n));

            const isPrimary = needs.primary?.includes(needCategory) && !filled.slice(0, -1).includes(needCategory);
            const isSecondary = needs.secondary?.includes(needCategory) && !filled.slice(0, -1).includes(needCategory);

            const boardRank = getTeamBoardRank(pickingTeam, pick.id);

            const schemes = teamSchemes[pickingTeam] || { offScheme: "TBD", defScheme: "TBD" };

            const isUserTeam = pickingTeam === userTeamName;

            const tradeForPick = trades.find(t =>
                t.buyerReceives.some(r => r.overall === currentPick) && t.buyer === pickingTeam
            );
            const tradedAwayPick = trades.find(t =>
                t.buyerReceives.some(r => r.overall === currentPick) && t.seller === pickingTeam
            );

            pickResults.push({
                overall: currentPick,
                round: pickData.round,
                pickInRound: pickData.pick,
                team: pickingTeam,
                teamAbbr: abbr,
                via: pickData.via,
                pickValue: pickData.value || 0,
                player: {
                    id: pick.id,
                    name: pick.name,
                    position: pick.position,
                    school: pick.school,
                    consensusRank: pick.consensus_rank,
                    rangeLow: pick.range_low,
                    rangeHigh: pick.range_high,
                    pffGrade: pick.pff_grade,
                    archetype: pick.archetype,
                    comparison: pick.comparison,
                    developmentCertainty: pick.developmentCertainty,
                    projection: pick.projection
                },
                analysis: {
                    boardRank: boardRank,
                    needLevel: isPrimary ? 'primary' : (isSecondary ? 'secondary' : 'none'),
                    needCategory: needCategory,
                    valueOverConsensus: pick.consensus_rank - currentPick,
                    isReach: currentPick < pick.consensus_rank - 15,
                    isSteal: currentPick > pick.consensus_rank + 15,
                    tradedUp: !!tradeForPick,
                    tradedAway: !!tradedAwayPick,
                    tradeDetails: tradeForPick || null,
                    offScheme: schemes.offScheme,
                    defScheme: schemes.defScheme
                },
                isUserTeam: isUserTeam
            });
        }

        currentPick++;
    }

    const output = {
        meta: {
            generated: new Date().toISOString(),
            sessionSeed: draftSessionSeed,
            userTeam: userTeamName,
            totalPicks: pickResults.length,
            totalTrades: trades.length
        },
        picks: pickResults,
        trades: trades,
        teamSummaries: buildTeamSummaries()
    };

    fs.writeFileSync(path.join(__dirname, '../data/draft/simulated_draft_results.json'), JSON.stringify(output, null, 2));
    console.log(`Draft complete: ${pickResults.length} picks, ${trades.length} trades`);
    console.log(`Output: data/draft/simulated_draft_results.json`);
}

function buildTeamSummaries() {
    const summaries = {};
    const teams = Object.keys(TEAM_DATA);

    teams.forEach(teamName => {
        const teamPicks = pickResults.filter(p => p.team === teamName);
        const abbr = TEAM_DATA[teamName].abbr;
        const needs = allTeamNeeds[abbr] || { primary: [], secondary: [] };
        const filled = teamFilledNeeds[teamName] || [];
        const schemes = teamSchemes[teamName] || {};

        const primaryFilled = (needs.primary || []).filter(n => filled.includes(n));
        const secondaryFilled = (needs.secondary || []).filter(n => filled.includes(n));
        const primaryUnfilled = (needs.primary || []).filter(n => !filled.includes(n));

        const teamTrades = trades.filter(t => t.buyer === teamName || t.seller === teamName);

        let totalValueGained = 0;
        let totalValueSpent = 0;
        teamTrades.forEach(t => {
            if (t.buyer === teamName) {
                totalValueSpent += t.giveValue;
                totalValueGained += t.receiveValue;
            } else {
                totalValueGained += t.giveValue;
                totalValueSpent += t.receiveValue;
            }
        });

        summaries[teamName] = {
            abbr,
            picks: teamPicks.map(p => ({
                overall: p.overall,
                round: p.round,
                player: p.player.name,
                position: p.player.position,
                consensusRank: p.player.consensusRank,
                needLevel: p.analysis.needLevel,
                valueOverConsensus: p.analysis.valueOverConsensus
            })),
            needsFilled: { primary: primaryFilled, secondary: secondaryFilled },
            needsUnfilled: primaryUnfilled,
            trades: teamTrades.length,
            tradeValueNet: totalValueGained - totalValueSpent,
            offScheme: schemes.offScheme,
            defScheme: schemes.defScheme
        };
    });

    return summaries;
}

runDraft();
