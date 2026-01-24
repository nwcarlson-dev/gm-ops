#!/usr/bin/env python3
"""
Add scouting reports to prospect data.
Reports use natural prose with subtle skill verbiage embedded.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
CURRENT_FILE = BASE_DIR / "current" / "2026_prospects.json"

SCOUTING_REPORTS = {
    # === TOP EDGE RUSHERS ===
    "rueben-bain-jr-2026": {
        "report": "Explosive off the snap with a devastating first step that consistently beats tackles. Shows natural bend around the edge and converts speed to power when needed. Developing counter moves but already has a deep bag of pass rush techniques. Relentless motor - never takes a play off. Sets the edge well against the run. Hands are active and violent at the point of attack.",
        "comparison": "Myles Garrett",
        "archetype": "Speed Rusher"
    },
    "david-bailey-2026": {
        "report": "Relentless motor and non-stop effort. First step is explosive off the edge. Pass rush moves are still limited but wins with speed and effort. Bend is adequate but not elite. Speed-to-power conversion is a work in progress. Run stuffing is better than expected - sets the edge well. Hand usage needs development against longer tackles.",
        "comparison": "Rashan Gary",
        "archetype": "Effort Rusher"
    },
    "tj-parker-2026": {
        "report": "Long and athletic with room to add mass. First step threatens tackles immediately. Developing a variety of pass rush moves - shows a good inside counter. Bend around the edge is natural. Hand usage and timing are works in progress. Run defense is inconsistent - can get washed by double teams. Motor runs hot.",
        "comparison": "Will Anderson Jr.",
        "archetype": "High-Upside Rusher"
    },
    "keldric-faulk-2026": {
        "report": "Power rusher with a strong anchor against the run. First step is adequate but wins with leverage and power. Speed-to-power is his primary move. Bend is limited - struggles to flatten around the corner. Hand usage is physical and violent. Motor is consistent. Sets the edge well in run defense.",
        "comparison": "Josh Allen (JAX)",
        "archetype": "Power Rusher"
    },
    "cashius-howell-2026": {
        "report": "Undersized but plays with tremendous effort. First step is explosive and gets him into the backfield quickly. Pass rush moves are developing - relies on speed currently. Bend is excellent for his frame. Run defense is a concern - gets washed against bigger tackles. Motor never stops. Hand usage is improving.",
        "comparison": "Haason Reddick",
        "archetype": "Speed Rusher"
    },
    "vincent-anthony-jr-2026": {
        "report": "Athletic edge defender with length. First step is quick but not elite. Pass rush moves are limited - wins with effort and motor. Bend around the corner is developing. Hand usage needs work - gets locked up by stronger tackles. Run defense shows good effort and gap discipline. Versatile enough to stand up or put his hand in the dirt.",
        "comparison": "Uchenna Nwosu",
        "archetype": "Versatile Edge"
    },
    "romello-height-2026": {
        "report": "Hybrid edge/linebacker with coverage ability. First step is adequate from a two-point stance. Pass rush moves are limited but shows timing on stunts. More comfortable dropping into coverage than rushing the passer. Run defense instincts are solid. Motor is consistent. Versatility adds value.",
        "comparison": "Kyle Van Noy",
        "archetype": "Hybrid Edge"
    },
    "joshua-josephs-2026": {
        "report": "Quick-twitch athlete off the edge. First step wins the rep early. Pass rush moves are still developing but has a nice inside counter. Bend is adequate - not a natural ankle bender. Speed-to-power needs work. Run defense is a weakness - gets washed too easily. Motor runs hot and cold.",
        "comparison": "Jermaine Johnson",
        "archetype": "Developmental Edge"
    },
    "r-mason-thomas-2026": {
        "report": "Compact edge rusher with good leverage. First step is quick for his frame. Pass rush moves include a solid club-rip. Speed-to-power is his bread and butter. Bend is limited by his build. Run stuffing is a strength - plays with good pad level. Hand usage is active and violent.",
        "comparison": "Sam Hubbard",
        "archetype": "Run-First Edge"
    },
    "tj-guy-2026": {
        "report": "Long edge rusher still growing into his frame. First step is explosive when he gets low. Pass rush moves are limited but shows flashes. Bend around the corner is natural. Run defense needs refinement - too easily moved off his spot. Motor is steady. Upside is significant if he adds strength.",
        "comparison": "Travon Walker (developmental)",
        "archetype": "High-Ceiling Edge"
    },
    "caden-curry-2026": {
        "report": "Versatile defensive end who can kick inside on passing downs. First step is quick. Pass rush moves show good hand usage and timing. Bend is adequate. Run defense is sound - holds his gap. Motor is relentless. Can line up at multiple spots along the defensive line.",
        "comparison": "Carl Lawson",
        "archetype": "Versatile DE"
    },

    # === TOP SAFETIES ===
    "caleb-downs-2026": {
        "report": "Elite range and sideline-to-sideline speed. Instincts allow him to diagnose plays before they develop. Comfortable in man coverage against tight ends and can match up in the slot. Ball skills are exceptional - attacks the ball at its highest point. Physical tackler who doesn't shy from run support. Versatile enough to play multiple secondary spots.",
        "comparison": "Derwin James",
        "archetype": "Hybrid Safety"
    },
    "terry-moore-2026": {
        "report": "Rangy safety with excellent instincts in zone coverage. Reads quarterback eyes and breaks on throws. Man coverage is developing - can match tight ends. Ball skills show potential. Tackling is sound with good technique. Range allows him to play centerfield effectively. Physical in run support.",
        "comparison": "Jessie Bates III",
        "archetype": "Centerfield Safety"
    },
    "jordan-castell-2026": {
        "report": "Athletic safety with versatility to play multiple spots. Range is adequate for single-high responsibilities. Man coverage skills are developing. Zone instincts are solid - reads route combinations well. Tackling is aggressive but technique can break down. Ball skills are average. Run support is willing.",
        "comparison": "Jordan Poyer",
        "archetype": "Box Safety"
    },
    "dillon-thieneman-2026": {
        "report": "Rangy safety with excellent ball skills. Range to cover ground sideline to sideline. Instincts in zone coverage are advanced - reads quarterback eyes. Man coverage against tight ends is solid. Tackling can be inconsistent - angles sometimes miss. Run support is willing but needs to be more physical. Versatility to play multiple spots in the secondary.",
        "comparison": "Jessie Bates III",
        "archetype": "Centerfield Safety"
    },
    "aj-haulcy-2026": {
        "report": "Physical safety who excels in run support. Fills the alley aggressively and is a sure tackler. Man coverage is limited - struggles against athletic tight ends. Zone instincts are adequate. Ball skills need development. Range is limited for centerfield responsibilities. Best as a box safety in the modern game.",
        "comparison": "Jamal Adams",
        "archetype": "Box Safety"
    },
    "emmanuel-mcneil-warren-2026": {
        "report": "Ball-hawking safety with excellent instincts. Ball skills are elite - creates turnovers. Range is good for centerfield duties. Zone coverage reads are advanced. Man coverage is developing but shows potential. Tackling can be hit or miss. Run support is adequate but not his calling card.",
        "comparison": "Minkah Fitzpatrick",
        "archetype": "Ball-Hawk Safety"
    },
    "keionte-scott-2026": {
        "report": "Versatile defensive back who can play safety or corner. Range is good for his size. Man coverage technique is developing. Zone instincts are solid. Ball skills show potential - attacks the ball well. Tackling is aggressive and physical. Run support is willing. Versatility adds value.",
        "comparison": "Budda Baker",
        "archetype": "Versatile DB"
    },
    "rod-moore-2026": {
        "report": "Instinctive safety with good ball skills. Range is adequate for single-high duties. Zone coverage reads are his strength - anticipates routes. Man coverage is limited against athletic tight ends. Tackling is sound. Run support shows good angles. Ball skills allow him to create turnovers.",
        "comparison": "Kevin Byard",
        "archetype": "Zone Safety"
    },
    "genesis-smith-2026": {
        "report": "Athletic safety with range and ball skills. Covers ground quickly sideline to sideline. Zone coverage instincts are developing. Man coverage shows potential against tight ends. Tackling technique is solid. Ball skills are a weapon. Run support is adequate.",
        "comparison": "Antoine Winfield Jr.",
        "archetype": "Rangy Safety"
    },
    "kamari-ramsey-2026": {
        "report": "Physical safety who plays in the box. Run support is his calling card - fills gaps aggressively. Tackling is sound and violent. Man coverage is limited. Zone coverage shows adequate instincts. Range is limited for centerfield duties. Ball skills are developing.",
        "comparison": "Jamal Adams",
        "archetype": "Box Safety"
    },
    "zakee-wheatley-2026": {
        "report": "Rangy safety with good ball skills. Covers ground well in zone coverage. Instincts allow him to jump routes. Man coverage is adequate against tight ends. Tackling is reliable. Run support is physical. Range makes him a candidate for single-high duties.",
        "comparison": "Marcus Williams",
        "archetype": "Centerfield Safety"
    },

    # === TOP CORNERBACKS ===
    "jermod-mccoy-2026": {
        "report": "Fluid hips and smooth transitions in coverage. Press technique is refined with good jam timing at the line. Recovers quickly when beaten off the line - closing speed is a weapon. Zone awareness needs refinement but shows the instincts to jump routes. Ball skills are developing; tends to play the receiver more than the ball. Willing tackler in run support.",
        "comparison": "Sauce Gardner",
        "archetype": "Press-Man Corner"
    },
    "avieon-terrell-2026": {
        "report": "Quick-twitch athlete with elite recovery speed. Man coverage is his strength - stays in phase through the route. Press technique needs refinement at the line. Zone coverage instincts are solid but not elite. Ball skills are developing - attacks the catch point. Tackling in run support is willing but technique can break down. Competitive nature shows on tape.",
        "comparison": "A.J. Terrell",
        "archetype": "Man-Coverage Specialist"
    },
    "mansoor-delane-2026": {
        "report": "Long corner with excellent ball skills. Plays the ball in the air like a receiver. Man coverage technique is refined - mirrors well with fluid hips. Press technique can be defeated by quick releases. Zone coverage awareness is solid. Recovery speed is average - relies on positioning rather than closing burst. Tackling is adequate.",
        "comparison": "Patrick Surtain II",
        "archetype": "Ball-Hawk Corner"
    },
    "daniel-harris-2026": {
        "report": "Physical corner who excels in press coverage. Jam at the line disrupts timing. Man coverage is sound - stays in phase with good technique. Zone coverage awareness needs work. Recovery speed is adequate. Ball skills are developing. Tackling in run support is a strength - not afraid of contact.",
        "comparison": "Marshon Lattimore",
        "archetype": "Press Corner"
    },
    "jeadyn-lukus-2026": {
        "report": "Long corner with good length. Press technique uses his frame well. Man coverage shows fluid hips. Zone coverage instincts are developing. Recovery speed is adequate for his size. Ball skills need refinement - doesn't always locate the ball. Tackling is sound.",
        "comparison": "Jaylon Johnson",
        "archetype": "Length Corner"
    },
    "christian-gray-2026": {
        "report": "Technical corner with refined footwork. Press technique is sound with good hand timing. Man coverage shows the ability to mirror routes. Zone coverage reads are developing. Recovery speed is a concern against deep threats. Ball skills are average. Tackling is willing in run support.",
        "comparison": "Donte Jackson",
        "archetype": "Technical Corner"
    },
    "dj-harvey-2026": {
        "report": "Smooth corner with fluid transitions. Man coverage technique is refined. Press technique shows good jam timing. Zone coverage awareness is solid. Ball skills are a strength - attacks throws at the catch point. Recovery speed is adequate. Tackling needs work.",
        "comparison": "Trevon Diggs (ball skills)",
        "archetype": "Ball-Hawk Corner"
    },
    "cam-calhoun-2026": {
        "report": "Quick corner with good change of direction. Man coverage is his strength - mirrors well. Press technique is developing. Zone coverage shows adequate instincts. Recovery speed is excellent. Ball skills need refinement. Tackling in run support is a weakness.",
        "comparison": "Eli Apple",
        "archetype": "Speed Corner"
    },
    "aj-harris-2026": {
        "report": "Physical corner who plays with an edge. Press technique is refined and physical. Man coverage shows good mirroring ability. Zone coverage instincts are solid. Ball skills are developing. Recovery speed is adequate. Tackling is a strength - plays with violence.",
        "comparison": "J.C. Jackson",
        "archetype": "Physical Corner"
    },
    "jermaine-mathews-jr-2026": {
        "report": "Athletic corner with good length. Press technique uses his frame effectively. Man coverage shows fluid hips and quick feet. Zone coverage awareness is developing. Ball skills show potential. Recovery speed is good. Tackling is adequate in run support.",
        "comparison": "Denzel Ward",
        "archetype": "Athletic Corner"
    },
    "tyreek-chappell-2026": {
        "report": "Quick-twitch corner with excellent recovery speed. Man coverage is refined - stays in phase. Press technique needs work at the line. Zone coverage instincts are adequate. Ball skills are developing. Tackling is a weakness. Speed is his primary asset.",
        "comparison": "Jaycee Horn",
        "archetype": "Speed Corner"
    },
    "raion-strader-2026": {
        "report": "Long corner with developing technique. Press technique uses his length. Man coverage shows potential but footwork needs refinement. Zone coverage awareness is adequate. Ball skills are raw. Recovery speed is good for his size. Tackling is willing.",
        "comparison": "Jeff Okudah (developmental)",
        "archetype": "Developmental Corner"
    },
    "brandon-cisse-2026": {
        "report": "Smooth corner with good instincts. Man coverage technique is solid - mirrors well. Press technique is adequate. Zone coverage reads are a strength. Ball skills are developing. Recovery speed is average. Tackling is willing in run support.",
        "comparison": "Kendall Fuller",
        "archetype": "Zone Corner"
    },
    "colton-hood-2026": {
        "report": "Young corner with physical tools. Press technique is developing. Man coverage shows fluid hips. Zone coverage awareness is raw. Ball skills show potential. Recovery speed is good. Tackling is aggressive. Upside is significant given his age.",
        "comparison": "Derek Stingley Jr. (projection)",
        "archetype": "Upside Corner"
    },
    "keith-abney-ii-2026": {
        "report": "Quick corner with excellent feet. Man coverage is his strength - mirrors routes well. Press technique is adequate. Zone coverage instincts are developing. Ball skills show potential. Recovery speed is elite. Tackling needs work.",
        "comparison": "Trae Waynes",
        "archetype": "Speed Corner"
    },
    "dangelo-ponds-2026": {
        "report": "Undersized but competitive corner. Press technique is limited by his frame. Man coverage shows quick feet and good mirroring. Zone coverage instincts are solid. Ball skills are excellent despite his size. Recovery speed is a weapon. Tackling is a concern against bigger receivers.",
        "comparison": "Asante Samuel Jr.",
        "archetype": "Slot Corner"
    },
    "chris-johnson-2026": {
        "report": "Physical corner with refined technique. Press technique is his calling card. Man coverage is sound. Zone coverage shows good instincts. Ball skills are developing. Recovery speed is adequate. Tackling is a strength in run support.",
        "comparison": "Darius Slay",
        "archetype": "Physical Corner"
    },

    # === TOP QUARTERBACKS ===
    "fernando-mendoza-2026": {
        "report": "Polarizing prospect with elite physical tools. Arm strength is special - can make every throw on the field. Accuracy fluctuates, particularly on deep balls under pressure. Quick release gets the ball out before pressure arrives. Decision-making has improved but still forces throws into coverage. Mobile in the pocket and can extend plays with his legs. Anticipation is ahead of schedule for his experience level.",
        "comparison": "Josh Allen",
        "archetype": "Power Arm"
    },
    "ty-simpson-2026": {
        "report": "Athletic quarterback with mobility to extend plays. Arm strength is adequate for all throws. Accuracy is inconsistent - mechanics break down under pressure. Decision-making has improved but still holds the ball too long. Release is quick when he trusts his read. Pocket presence needs work - doesn't feel pressure from the backside. Anticipation shows flashes but isn't consistent.",
        "comparison": "Trey Lance",
        "archetype": "Dual-Threat"
    },
    "eli-holstein-2026": {
        "report": "Pocket passer with good arm strength. Accuracy is his calling card, particularly on short and intermediate throws. Deep ball accuracy is developing. Decision-making is sound - takes what the defense gives. Pocket presence is refined - slides and steps up well. Mobility is limited - won't create with his legs. Release is quick and compact. Anticipation shows on timing routes.",
        "comparison": "Kirk Cousins",
        "archetype": "Pocket Passer"
    },
    "aidan-chiles-2026": {
        "report": "Athletic quarterback with mobility. Arm strength is adequate. Accuracy is inconsistent - mechanics break down when pressured. Decision-making needs refinement - forces throws into coverage. Release is quick. Pocket presence is developing. Can create plays outside the pocket with his legs. Anticipation is raw.",
        "comparison": "Jalen Hurts (early career)",
        "archetype": "Dual-Threat"
    },
    "john-mateer-2026": {
        "report": "Dual-threat quarterback with excellent mobility. Arm strength is adequate for most throws. Accuracy is developing - better on the move than from the pocket. Decision-making improves in RPO situations. Release is adequate. Pocket presence needs work. Running ability is a weapon. Anticipation is limited.",
        "comparison": "Lamar Jackson (runner)",
        "archetype": "Running QB"
    },
    "trinidad-chambliss-2026": {
        "report": "Athletic quarterback with good mobility. Arm strength is adequate. Accuracy shows flashes but is inconsistent. Decision-making is developing. Release is quick. Pocket presence needs refinement. Can extend plays with his legs. Anticipation is raw but shows potential.",
        "comparison": "Marcus Mariota",
        "archetype": "Dual-Threat"
    },
    "cade-klubnik-2026": {
        "report": "Pocket passer with adequate arm strength. Accuracy is his strength, particularly in the short game. Deep ball touch is developing. Decision-making is sound. Release is quick and efficient. Pocket presence is refined. Limited mobility but moves well enough to avoid pressure. Anticipation on timing routes is a strength.",
        "comparison": "Derek Carr",
        "archetype": "Pocket Passer"
    },
    "garrett-nussmeier-2026": {
        "report": "Quick-release passer with good accuracy. Arm strength is adequate for the intermediate game. Deep ball needs work. Decision-making shows maturity. Pocket presence is developing. Mobility is limited. Anticipation on short routes is a strength. Mechanics are sound.",
        "comparison": "Baker Mayfield",
        "archetype": "Quick Release"
    },

    # === TOP OFFENSIVE TACKLES ===
    "spencer-fano-2026": {
        "report": "Textbook pass protector with excellent footwork and balance. Anchors well against power rushers. Hand placement is consistent and he rarely gets his hands inside his frame. Awareness of stunts and twists is advanced. Run blocking shows good drive and finish. Can pull and get to the second level. Pad level occasionally rises in extended sequences.",
        "comparison": "Rashawn Slater",
        "archetype": "Technician"
    },
    "francis-mauigoa-2026": {
        "report": "Massive frame with the athleticism to match. Pass protection is his calling card - mirror ability and quick feet for his size. Anchors against power rushers. Run blocking shows nastiness and a desire to finish. Footwork is still being refined on combo blocks. Hand placement can slip outside when fatigued. Pull technique is ahead of schedule. Awareness of games and twists is developing.",
        "comparison": "Tristan Wirfs",
        "archetype": "Mauler"
    },
    "caleb-lomu-2026": {
        "report": "Young tackle with rare physical tools. Pass protection shows balance and quick feet for his size. Anchors well against speed-to-power. Footwork is still being refined - can get overextended. Run blocking is physical with good drive. Hand placement is consistent. Awareness of games is developing with experience. Upside is significant given his age.",
        "comparison": "Penei Sewell",
        "archetype": "Upside OT"
    },
    "xavier-chaplin-2026": {
        "report": "Powerful tackle with good anchor. Pass protection shows adequate footwork. Anchors against bull rushers. Run blocking is physical - looks to finish. Hand placement needs refinement. Awareness of stunts is developing. Pad level can rise. Athleticism is limited.",
        "comparison": "La'el Collins",
        "archetype": "Power Tackle"
    },
    "tree-babalade-2026": {
        "report": "Long tackle with developing technique. Pass protection shows potential with his reach. Anchor is adequate. Footwork needs refinement - gets overextended. Run blocking shows effort but lacks finish. Hand placement is inconsistent. Upside is there with proper coaching.",
        "comparison": "Andre Dillard",
        "archetype": "Developmental OT"
    },
    "earnest-greene-iii-2026": {
        "report": "Massive tackle with good feet for his size. Pass protection anchor is elite. Footwork is developing. Run blocking shows power and drive. Hand placement is adequate. Awareness of games is solid. Can play either tackle spot.",
        "comparison": "Tyron Smith",
        "archetype": "Power Tackle"
    },
    "max-iheanachor-2026": {
        "report": "Big tackle with developing technique. Pass protection shows adequate anchor. Footwork needs work against speed rushers. Run blocking is powerful. Hand placement is inconsistent. Awareness of stunts is developing. Upside is there with the right coaching.",
        "comparison": "Orlando Brown Jr.",
        "archetype": "Road Grader"
    },
    "monroe-freeling-2026": {
        "report": "Long tackle with excellent length. Pass protection uses his reach effectively. Anchor is solid against power. Footwork is refined. Run blocking shows good technique. Hand placement is consistent. Awareness of games is advanced. Can slide to guard if needed.",
        "comparison": "Jedrick Wills Jr.",
        "archetype": "Balanced OT"
    },
    "riley-mahlman-2026": {
        "report": "Technically sound tackle with good fundamentals. Pass protection footwork is refined. Anchor is adequate. Run blocking shows good technique. Hand placement is consistent. Awareness of stunts is solid. Athleticism is limited but compensates with technique.",
        "comparison": "Taylor Decker",
        "archetype": "Technician"
    },
    "niki-prongos-2026": {
        "report": "Athletic tackle with good feet. Pass protection shows quick feet and balance. Anchor needs development against power. Footwork is refined. Run blocking shows effort. Hand placement is developing. Awareness of games is adequate.",
        "comparison": "Andrew Thomas",
        "archetype": "Athletic OT"
    },
    "austin-barber-2026": {
        "report": "Physical tackle who excels in the run game. Run blocking is his calling card - finishes blocks with violence. Pass protection anchor is solid. Footwork needs refinement against speed. Hand placement is adequate. Awareness of stunts is developing.",
        "comparison": "Mekhi Becton",
        "archetype": "Run-First OT"
    },
    "caleb-tiernan-2026": {
        "report": "Long tackle with good length. Pass protection uses his reach. Anchor is developing. Footwork is adequate. Run blocking shows effort. Hand placement needs work. Upside is there with technique refinement.",
        "comparison": "Isaiah Wynn",
        "archetype": "Length Tackle"
    },
    "isaiah-world-2026": {
        "report": "Massive tackle with rare size. Pass protection anchor is elite due to his frame. Footwork is developing. Run blocking shows power. Hand placement is inconsistent. Awareness of games is raw. Project with upside.",
        "comparison": "D.J. Humphries",
        "archetype": "Size Projection"
    },

    # === TOP INTERIOR OFFENSIVE LINE ===
    "charles-jagusah-2026": {
        "report": "Powerful guard with elite anchor. Pass protection is his strength - rarely gets moved. Hand placement is consistent. Footwork is adequate. Run blocking shows drive and finish. Pull ability is developing. Awareness of stunts is advanced.",
        "comparison": "Zack Martin",
        "archetype": "Anchor Guard"
    },
    "olaivavega-ioane-2026": {
        "report": "Powerful interior lineman with good anchor. Pass protection is sound - rarely gives ground against bull rushes. Hand placement and timing are strengths. Footwork is adequate in pass pro. Run blocking shows movement ability. Pull technique is developing. Awareness of twists and stunts is advanced for his experience. Can play guard or center.",
        "comparison": "Creed Humphrey",
        "archetype": "Anchor Guard"
    },
    "emmanuel-pregnon-2026": {
        "report": "Powerful guard who mauls in the run game. Drive blocking shows nasty finish. Pass protection technique is sound - anchors against power. Hand placement can get wide when fatigued. Pull ability is adequate. Footwork in space needs refinement. Awareness of stunts is solid.",
        "comparison": "Quenton Nelson",
        "archetype": "Mauler Guard"
    },
    "roderick-kearney-2026": {
        "report": "Athletic guard with good movement skills. Pass protection shows quick feet. Anchor is developing against power rushers. Run blocking is physical. Pull technique is smooth. Hand placement is consistent. Awareness of stunts is adequate.",
        "comparison": "Chris Lindstrom",
        "archetype": "Athletic Guard"
    },
    "ethan-onianwa-2026": {
        "report": "Powerful guard with a mean streak. Pass protection anchor is solid. Hand placement shows violence. Run blocking is physical and nasty. Footwork is adequate. Pull ability is developing. Plays with an edge.",
        "comparison": "Kevin Zeitler",
        "archetype": "Mauler Guard"
    },
    "kadyn-proctor-2026": {
        "report": "Massive interior lineman with elite size. Anchor is exceptional - impossible to move. Pass protection is solid. Run blocking shows power. Footwork is limited by his size. Hand placement is adequate. Can play guard or tackle.",
        "comparison": "Trent Brown",
        "archetype": "Massive IOL"
    },
    "tomas-rimac-2026": {
        "report": "Technical guard with good fundamentals. Pass protection footwork is refined. Anchor is adequate. Run blocking shows technique over power. Hand placement is consistent. Pull ability is solid. Awareness of games is advanced.",
        "comparison": "Joel Bitonio",
        "archetype": "Technician Guard"
    },
    "joshua-braun-2026": {
        "report": "Powerful guard who excels in the run game. Run blocking is his calling card. Pass protection anchor is solid. Hand placement is adequate. Footwork is developing. Pull ability is good. Plays with physicality.",
        "comparison": "Andrew Norwell",
        "archetype": "Run Guard"
    },
    "chase-bisontis-2026": {
        "report": "Athletic guard with good feet. Pass protection shows quick movement. Anchor is developing. Run blocking shows potential. Hand placement is adequate. Pull ability is a strength. Awareness of stunts needs work.",
        "comparison": "Tyler Smith",
        "archetype": "Athletic Guard"
    },
    "connor-tollison-2026": {
        "report": "Smart center with good football IQ. Pass protection anchor is solid. Line calls are his strength. Run blocking shows technique. Hand placement is consistent. Footwork is adequate. Leadership is evident on tape.",
        "comparison": "Jason Kelce (smarts)",
        "archetype": "Cerebral Center"
    },
    "connor-lew-2026": {
        "report": "Physical center with good anchor. Pass protection is sound. Run blocking is powerful. Hand placement is adequate. Footwork is developing. Line calls show intelligence. Can also play guard.",
        "comparison": "Frank Ragnow",
        "archetype": "Physical Center"
    },

    # === TOP WIDE RECEIVERS ===
    "jordyn-tyson-2026": {
        "report": "Crisp route runner who creates separation at every level. Releases cleanly against press coverage. Strong hands and impressive catch radius for his size. After the catch, shows burst and vision to pick up yards. Contested catch ability is underrated - competitive at the catch point. Could improve as a blocker in the run game.",
        "comparison": "Amon-Ra St. Brown",
        "archetype": "Route Technician"
    },
    "carnell-tate-2026": {
        "report": "Long strider with excellent body control. Tracks the deep ball naturally. Separation comes from route precision rather than pure speed. Hands are reliable - rarely drops catchable balls. YAC ability is limited by lack of explosiveness after the catch. Size allows him to win contested situations. Needs to improve release against physical corners.",
        "comparison": "Chris Olave",
        "archetype": "Deep Threat"
    },
    "makai-lemon-2026": {
        "report": "Smaller frame but plays bigger than his size. Route running is polished at every level. Release against press is savvy - uses hands well. Separation is created through quickness and technique. Hands are reliable. YAC ability is elite - makes defenders miss in space. Contested catch situations are difficult given his frame. Versatile enough to play inside and outside.",
        "comparison": "Tyreek Hill",
        "archetype": "Slot Weapon"
    },
    "eugene-wilson-iii-2026": {
        "report": "Explosive receiver with good speed. Route running is developing. Release against press needs work. Separation comes from athleticism. Hands are reliable. YAC ability shows burst. Contested catches are hit or miss. Raw but has upside.",
        "comparison": "Jaylen Waddle",
        "archetype": "Speed Receiver"
    },
    "jaden-greathouse-2026": {
        "report": "Big slot receiver with reliable hands. Route running is refined in the short and intermediate game. Release against press is adequate. Separation comes from size and timing. Hands are excellent. YAC ability is limited. Contested catches are a strength. Solid blocker.",
        "comparison": "Michael Pittman Jr.",
        "archetype": "Possession Receiver"
    },
    "nic-anderson-2026": {
        "report": "Long receiver with good catch radius. Route running is developing. Release against press needs refinement. Separation is created with length. Hands are reliable. YAC ability is limited. Contested catches are his calling card. Deep ball tracking is natural.",
        "comparison": "Courtland Sutton",
        "archetype": "Contested Catch WR"
    },
    "noah-thomas-2026": {
        "report": "Route runner with good technique. Separation comes from precision and timing. Release against press is solid. Hands are reliable. YAC ability is developing. Contested catches are adequate. Well-rounded skill set.",
        "comparison": "Keenan Allen",
        "archetype": "Route Technician"
    },
    "kc-concepcion-2026": {
        "report": "Quick receiver who works well from the slot. Route running is polished. Release against press uses quickness. Separation is created with footwork. Hands are soft. YAC ability is good. Contested catches are difficult given his size. Versatile weapon.",
        "comparison": "Brandin Cooks",
        "archetype": "Slot Receiver"
    },
    "denzel-boston-2026": {
        "report": "Big receiver with excellent catch radius. Route running is developing. Release against press needs work. Separation is created with size. Hands are reliable. YAC ability is limited. Contested catches are a major strength. Red zone threat.",
        "comparison": "Mike Williams",
        "archetype": "Red Zone Threat"
    },
    "chris-brazzell-ii-2026": {
        "report": "Long receiver with developing technique. Route running shows potential. Release against press is raw. Separation comes from length and speed. Hands need refinement. YAC ability is limited. Contested catches show his size advantage. Project with upside.",
        "comparison": "D.K. Metcalf (physical)",
        "archetype": "Downfield Threat"
    },
    "omar-cooper-jr-2026": {
        "report": "Quick receiver with good route running. Separation is created through technique. Release against press is developing. Hands are reliable. YAC ability is a strength. Contested catches are limited by size. Versatile player who can work inside and outside.",
        "comparison": "Terry McLaurin",
        "archetype": "Complete Receiver"
    },
    "johntay-cook-2026": {
        "report": "Athletic receiver with good speed. Route running is developing. Release against press needs work. Separation comes from athleticism. Hands are adequate. YAC ability shows burst. Raw but has tools to develop.",
        "comparison": "Rashod Bateman",
        "archetype": "Developmental WR"
    },
    "j-michael-sturdivant-2026": {
        "report": "Smooth route runner with good technique. Separation is created through precision. Release against press is solid. Hands are reliable. YAC ability is adequate. Contested catches are developing. Well-rounded receiver.",
        "comparison": "Diontae Johnson",
        "archetype": "Route Runner"
    },
    "deion-burks-2026": {
        "report": "Explosive playmaker who can line up anywhere. Route running is developing. Separation comes from athleticism. Hands are reliable. YAC ability is elite - makes defenders miss. Contested catches are limited by size. Versatile weapon in the right scheme.",
        "comparison": "Deebo Samuel",
        "archetype": "YAC Monster"
    },
    "eric-singleton-jr-2026": {
        "report": "Quick receiver with good feet. Route running is polished. Release against press uses quickness. Separation is created with footwork. Hands are soft. YAC ability is good. Contested catches are difficult given his size.",
        "comparison": "Christian Kirk",
        "archetype": "Slot Receiver"
    },
    "germie-bernard-2026": {
        "report": "Smooth receiver with developing route running. Separation comes from technique. Release against press is adequate. Hands are reliable. YAC ability shows potential. Contested catches are developing. Upside receiver.",
        "comparison": "George Pickens",
        "archetype": "Developing WR"
    },
    "dane-key-2026": {
        "report": "Athletic receiver with good speed. Route running is raw. Separation comes from athleticism. Hands need refinement. YAC ability is explosive. Contested catches are developing. Tools are there for development.",
        "comparison": "Marquise Brown",
        "archetype": "Speed Receiver"
    },

    # === TOP TIGHT ENDS ===
    "kenyon-sadiq-2026": {
        "report": "Receiving tight end with soft hands and body control. Route running is advanced for the position. Creates separation against linebackers. Catch radius allows him to make difficult grabs look routine. Blocking is functional but not a strength - effort is there but technique lags. YAC ability is limited. Reliable in the red zone and on third downs.",
        "comparison": "Dallas Goedert",
        "archetype": "Receiving TE"
    },
    "john-michael-gyllenborg-2026": {
        "report": "Athletic tight end with receiving potential. Route running is developing. Separation against linebackers is adequate. Catch radius is good. Hands are reliable. Blocking technique is developing. YAC ability shows potential. Well-rounded skill set.",
        "comparison": "Pat Freiermuth",
        "archetype": "Balanced TE"
    },
    "lawson-luckie-2026": {
        "report": "Physical tight end who excels as a blocker. Run blocking is his calling card - moves defenders off the ball. Pass protection is solid. Route running is developing. Hands are adequate. Catch radius is limited. YAC ability is minimal. Inline tight end who adds value in the run game.",
        "comparison": "Dalton Schultz",
        "archetype": "Blocking TE"
    },
    "max-klare-2026": {
        "report": "Receiving tight end with good hands. Route running shows potential. Separation against linebackers is developing. Catch radius is excellent. Blocking is a weakness. YAC ability is limited. Red zone target due to his size.",
        "comparison": "Cole Kmet",
        "archetype": "Receiving TE"
    },
    "rj-maryland-2026": {
        "report": "Athletic tight end with receiving skills. Route running is refined. Separation against linebackers is good. Hands are reliable. Catch radius is adequate. Blocking needs development. YAC ability shows burst. Versatile weapon in the passing game.",
        "comparison": "Kyle Pitts (style)",
        "archetype": "Move TE"
    },
    "marlin-klein-2026": {
        "report": "Balanced tight end with solid fundamentals. Route running is adequate. Separation is created with size. Hands are reliable. Blocking technique is developing. YAC ability is limited. Inline tight end with receiving upside.",
        "comparison": "Evan Engram",
        "archetype": "Balanced TE"
    },
    "jack-velling-2026": {
        "report": "Physical tight end with blocking ability. Run blocking shows good technique. Pass protection is solid. Route running is developing. Hands are adequate. Catch radius is good for his size. YAC ability is limited. Traditional Y tight end.",
        "comparison": "Austin Hooper",
        "archetype": "Inline TE"
    },
    "miles-kitselman-2026": {
        "report": "Athletic tight end with receiving potential. Route running shows promise. Separation against linebackers is adequate. Hands are developing. Blocking is a work in progress. YAC ability shows athleticism. Upside in the passing game.",
        "comparison": "Noah Fant",
        "archetype": "Seam Threat"
    },
    "jaren-kanak-2026": {
        "report": "Versatile tight end with good athleticism. Route running is developing. Separation is created with movement. Hands are reliable. Blocking technique is adequate. YAC ability shows burst. Can line up multiple spots.",
        "comparison": "Mark Andrews (style)",
        "archetype": "Move TE"
    },
    "oscar-delp-2026": {
        "report": "Reliable tight end with good hands. Route running is solid in the short game. Separation is limited against athletic linebackers. Catch radius is good. Blocking is developing. YAC ability is minimal. Possession tight end.",
        "comparison": "Hunter Henry",
        "archetype": "Possession TE"
    },
    "eli-stowers-2026": {
        "report": "Athletic tight end with receiving skills. Route running shows potential. Separation against linebackers is adequate. Hands are soft. Blocking needs development. YAC ability shows athleticism. Upside as a move tight end.",
        "comparison": "Hayden Hurst",
        "archetype": "Receiving TE"
    },
    "michael-trigg-2026": {
        "report": "Athletic tight end with good movement skills. Route running is developing. Separation is created with athleticism. Hands are reliable. Blocking is a weakness. YAC ability is good. Versatile weapon who can stress defenses.",
        "comparison": "Darren Waller (upside)",
        "archetype": "Move TE"
    },

    # === TOP RUNNING BACKS ===
    "jeremiyah-love-2026": {
        "report": "Explosive runner with elite acceleration through the hole. Vision to find cutback lanes and set up blocks. Elusiveness in space makes him dangerous in the open field. Power is developing - prefers to make defenders miss rather than run through them. Pass blocking needs work but shows willingness. Receiving skills are polished. Ball security has been clean. Lateral agility creates big-play opportunities.",
        "comparison": "Alvin Kamara",
        "archetype": "Home Run Hitter"
    },
    "jaydn-ott-2026": {
        "report": "Patient runner with good vision. Finds cutback lanes naturally. Elusiveness is adequate. Power between the tackles shows improvement. Pass blocking is willing but technique needs work. Receiving skills are polished. Ball security is solid. Lateral agility is good. Workhorse back profile.",
        "comparison": "Josh Jacobs",
        "archetype": "Workhorse Back"
    },
    "cj-baxter-2026": {
        "report": "Powerful runner who finishes runs. Vision is adequate. Elusiveness is limited - prefers to run through tacklers. Power is his calling card. Pass blocking shows willingness. Receiving is developing. Ball security is solid. North-south runner who moves the pile.",
        "comparison": "Derrick Henry (style)",
        "archetype": "Power Back"
    },
    "jadarian-price-2026": {
        "report": "Quick runner with good burst. Vision shows potential. Elusiveness in space is a strength. Power is limited. Pass blocking needs development. Receiving skills are excellent. Ball security is solid. Lateral agility is elite. Change-of-pace back with upside.",
        "comparison": "Austin Ekeler",
        "archetype": "Scatback"
    },
    "demond-claiborne-2026": {
        "report": "Elusive runner with good vision. Finds creases and explodes through them. Elusiveness is his calling card. Power is developing. Pass blocking is a weakness. Receiving skills are solid. Ball security needs attention. Lateral agility creates big plays. Home run threat.",
        "comparison": "Jamaal Charles",
        "archetype": "Explosive Back"
    },
    "jonah-coleman-2026": {
        "report": "Compact runner with good pad level. Vision is developing. Elusiveness is adequate. Power is surprising for his size. Pass blocking is willing. Receiving skills are solid. Ball security is good. Lateral agility is a strength. Well-rounded skill set.",
        "comparison": "Aaron Jones",
        "archetype": "Balanced Back"
    },
    "jamal-haynes-2026": {
        "report": "Athletic runner with speed. Vision is developing. Elusiveness shows burst. Power is limited. Pass blocking needs work. Receiving skills are adequate. Ball security is solid. Speed is his primary weapon. Big-play threat on the perimeter.",
        "comparison": "Raheem Mostert",
        "archetype": "Speed Back"
    },

    # === TOP INTERIOR DEFENSIVE LINE ===
    "peter-woods-2026": {
        "report": "Powerful interior presence who demands double teams. Anchor is exceptional - rarely moved off his spot. First step is quick for his size. Hand usage is still developing but shows flashes of violence. Pass rush is more about power than technique at this stage. Run stuffing ability makes him a space-eater. Motor runs hot and cold.",
        "comparison": "Vita Vea",
        "archetype": "Nose Tackle"
    },
    "christen-miller-2026": {
        "report": "Interior disruptor with a quick first step. Pass rush from the three-technique spot is his calling card. Hand usage shows violence and timing. Double team resistance is developing - can get moved when engaged by two blockers. Run stuffing is inconsistent - prefers to penetrate rather than hold ground. Motor is hot throughout games. Anchor needs work against bigger guards.",
        "comparison": "Javon Hargrave",
        "archetype": "Penetrating DT"
    },
    "kayden-mcdonald-2026": {
        "report": "Disruptive interior presence with a quick first step. Pass rush ability from the interior is rare. Hand usage is advanced - club-rip is effective. Double team resistance is developing. Run stuffing can be inconsistent - pad level rises. Anchor is adequate against bigger guards. Motor is steady throughout games.",
        "comparison": "Chris Jones",
        "archetype": "3-Technique"
    },
    "james-smith-2026": {
        "report": "Powerful nose tackle who occupies blockers. Anchor is elite - two-gapping strength. First step is adequate. Hand usage is developing. Pass rush ability is limited. Run stuffing is his calling card - eats space. Motor is consistent.",
        "comparison": "Daron Payne",
        "archetype": "Space Eater"
    },
    "keeshawn-silver-2026": {
        "report": "Athletic interior lineman with upside. First step is quick. Hand usage is developing. Anchor is adequate. Pass rush shows flashes. Run stuffing is inconsistent. Double team resistance needs work. Motor runs hot. Upside if he adds strength.",
        "comparison": "Dexter Lawrence (projection)",
        "archetype": "Athletic DT"
    },
    "keanu-tanuvasa-2026": {
        "report": "Powerful interior player with good anchor. Run stuffing is his strength. First step is adequate. Hand usage is developing. Pass rush is limited. Double team resistance is solid. Motor is consistent. Traditional nose tackle profile.",
        "comparison": "Jonathan Allen",
        "archetype": "Run-Stuffer"
    },
    "zane-durant-2026": {
        "report": "Penetrating three-technique with a quick first step. Pass rush shows potential. Hand usage is developing. Anchor needs work against power. Run stuffing is inconsistent. Motor is hot. Upside as a pass rusher.",
        "comparison": "Grady Jarrett",
        "archetype": "Penetrating 3T"
    },
    "ahmad-moten-sr-2026": {
        "report": "Physical interior player who occupies blockers. Anchor is solid. Run stuffing is his calling card. First step is adequate. Hand usage shows violence. Pass rush is limited. Motor is consistent. Two-gap defender.",
        "comparison": "Jeffery Simmons",
        "archetype": "Two-Gap DT"
    },
    "lee-hunter-2026": {
        "report": "Massive interior presence with elite size. Anchor is exceptional due to his frame. Run stuffing is a strength. First step is limited. Hand usage is developing. Pass rush is raw. Demands double teams. Space eater.",
        "comparison": "Calais Campbell",
        "archetype": "Massive DT"
    },
    "akheem-mesidor-2026": {
        "report": "Versatile interior player with pass rush ability. First step is quick. Hand usage shows timing. Anchor is adequate. Run stuffing is developing. Motor runs hot. Can kick outside in sub packages.",
        "comparison": "Cameron Heyward",
        "archetype": "Versatile DL"
    },

    # === TOP LINEBACKERS ===
    "arvell-reese-2026": {
        "report": "Sideline-to-sideline linebacker with closing burst. Instincts in run defense are elite - finds the ball quickly. Tackling is sound and he finishes through contact. Pass coverage is improving but still a work in progress against athletic tight ends. Blitzing ability shows timing and a feel for gaps. Takes on blocks well but can get washed when guards get to the second level.",
        "comparison": "Roquan Smith",
        "archetype": "Run-and-Hit"
    },
    "sonny-styles-2026": {
        "report": "Rangy linebacker with safety-level coverage skills. Can match tight ends and running backs in man coverage. Instincts are elite - seems to know where the ball is going before the snap. Sideline-to-sideline pursuit is exceptional. Run defense fundamentals need refinement. Tackling can get arm-y at times. Blitzing package is untapped potential.",
        "comparison": "Isaiah Simmons",
        "archetype": "Coverage Linebacker"
    },
    "lander-barton-2026": {
        "report": "Physical linebacker who excels against the run. Run defense instincts are solid. Tackling is violent and sure. Pass coverage is limited - struggles against athletic tight ends. Blitzing shows timing. Sideline-to-sideline range is adequate. Takes on blocks well. Traditional inside linebacker.",
        "comparison": "Bobby Wagner",
        "archetype": "Thumper"
    },
    "harold-perkins-jr-2026": {
        "report": "Explosive linebacker with pass rush ability. Blitzing is his calling card - times the snap well. Run defense instincts are developing. Tackling is aggressive but technique can break down. Pass coverage is limited. Sideline-to-sideline pursuit shows burst. High-upside player.",
        "comparison": "Micah Parsons (style)",
        "archetype": "Hybrid LB"
    },
    "jake-golday-2026": {
        "report": "Instinctive linebacker with good football IQ. Run defense reads are advanced. Tackling is sound. Pass coverage is adequate against tight ends. Blitzing shows timing. Sideline-to-sideline range is good. Takes on blocks well. Well-rounded linebacker.",
        "comparison": "Lavonte David",
        "archetype": "Complete LB"
    },
    "cj-allen-2026": {
        "report": "Physical linebacker who fills gaps. Run defense is his calling card. Tackling is sure and violent. Pass coverage is limited. Blitzing is developing. Sideline-to-sideline pursuit is adequate. Takes on blocks with violence. Downhill linebacker.",
        "comparison": "Zack Baun",
        "archetype": "Downhill LB"
    },
    "anthony-hill-jr-2026": {
        "report": "Athletic linebacker with coverage potential. Pass coverage shows ability to match tight ends. Run defense instincts are developing. Tackling is adequate. Blitzing shows burst. Sideline-to-sideline range is good. Upside in the right system.",
        "comparison": "Devin Lloyd",
        "archetype": "Athletic LB"
    },
    "josiah-trotter-2026": {
        "report": "Instinctive linebacker with football bloodlines. Run defense reads are advanced for his age. Tackling is sound. Pass coverage is developing. Blitzing is adequate. Sideline-to-sideline pursuit shows potential. Young player with upside.",
        "comparison": "Jeremiah Trotter (style)",
        "archetype": "Instinctive LB"
    }
}

def main():
    with open(CURRENT_FILE, "r") as f:
        data = json.load(f)
    
    updated = 0
    for prospect in data["prospects"]:
        pid = prospect["id"]
        if pid in SCOUTING_REPORTS:
            report_data = SCOUTING_REPORTS[pid]
            prospect["scouting_report"] = report_data["report"]
            prospect["comparison"] = report_data.get("comparison")
            prospect["archetype"] = report_data.get("archetype")
            updated += 1
    
    with open(CURRENT_FILE, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Updated {updated} prospects with scouting reports")
    
    positions = {}
    for prospect in data["prospects"]:
        if prospect["scouting_report"]:
            pos = prospect["position"]
            positions[pos] = positions.get(pos, 0) + 1
    
    print("\nReports by position:")
    for pos, count in sorted(positions.items(), key=lambda x: -x[1]):
        print(f"  {pos}: {count}")

if __name__ == "__main__":
    main()
