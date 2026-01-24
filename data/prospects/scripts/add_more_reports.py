#!/usr/bin/env python3
"""
Add additional scouting reports to prospect data.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
CURRENT_FILE = BASE_DIR / "current" / "2026_prospects.json"

ADDITIONAL_REPORTS = {
    # === MORE OFFENSIVE TACKLES ===
    "dametrious-crownover-2026": {
        "report": "Athletic tackle with good feet. Pass protection shows potential. Anchor is developing against power. Run blocking shows effort. Hand placement needs refinement. Upside is there with technique work.",
        "comparison": "Garrett Bolles",
        "archetype": "Athletic OT"
    },
    "jude-bowry-2026": {
        "report": "Physical tackle who excels in run blocking. Drive blocking is powerful. Pass protection footwork is developing. Anchor is solid against power. Hand placement is adequate. Technique is improving.",
        "comparison": "Jack Conklin",
        "archetype": "Run-First OT"
    },
    "faalili-faamoe-2026": {
        "report": "Long tackle with good reach. Pass protection uses his length well. Anchor needs development. Footwork is raw. Run blocking shows effort. Project with physical tools.",
        "comparison": "Charles Cross",
        "archetype": "Length OT"
    },
    "aamil-wagner-2026": {
        "report": "Technical tackle with solid fundamentals. Pass protection footwork is sound. Anchor is adequate. Run blocking shows technique. Hand placement is consistent. Steady performer.",
        "comparison": "Garett Bolles",
        "archetype": "Technician OT"
    },
    "drew-shelton-2026": {
        "report": "Physical tackle with good anchor. Pass protection is solid. Run blocking shows power. Footwork is adequate. Hand placement is developing. Consistent performer.",
        "comparison": "Jawaan Taylor",
        "archetype": "Power OT"
    },
    "jc-davis-2026": {
        "report": "Massive tackle with elite size. Pass protection anchor is elite. Footwork is limited. Run blocking shows power. Hand placement is developing. Size is his calling card.",
        "comparison": "Orlando Brown Jr.",
        "archetype": "Massive OT"
    },
    "blake-miller-2026": {
        "report": "Athletic tackle with good movement skills. Pass protection shows potential. Anchor is developing. Run blocking is physical. Hand placement is adequate. Upside player.",
        "comparison": "Teven Jenkins",
        "archetype": "Athletic OT"
    },

    # === MORE INTERIOR OFFENSIVE LINE ===
    "alex-harkey-2026": {
        "report": "Powerful guard who excels in run blocking. Drive blocking shows finish. Pass protection anchor is solid. Hand placement is adequate. Pull ability is good.",
        "comparison": "Elgton Jenkins",
        "archetype": "Run Guard"
    },
    "keylan-rutledge-2026": {
        "report": "Physical guard with good anchor. Run blocking is his strength. Pass protection is solid. Hand placement shows violence. Pull technique is developing.",
        "comparison": "Dalton Risner",
        "archetype": "Physical Guard"
    },
    "carver-willis-2026": {
        "report": "Athletic guard with good movement. Pass protection shows quick feet. Run blocking is developing. Hand placement is adequate. Pull ability is a strength.",
        "comparison": "Kenyon Green",
        "archetype": "Athletic Guard"
    },
    "chris-adams-2026": {
        "report": "Versatile interior lineman who can play multiple spots. Pass protection is solid. Run blocking shows effort. Hand placement is developing. Football IQ is high.",
        "comparison": "Connor Williams",
        "archetype": "Versatile IOL"
    },
    "parker-brailsford-2026": {
        "report": "Smart center with good line calls. Pass protection anchor is solid. Run blocking shows technique. Hand placement is consistent. Leadership is evident.",
        "comparison": "Tyler Linderbaum",
        "archetype": "Cerebral Center"
    },
    "bryce-foster-2026": {
        "report": "Physical center with good anchor. Pass protection is sound. Run blocking shows power. Hand placement is adequate. Line calls are improving.",
        "comparison": "Lloyd Cushenberry",
        "archetype": "Physical Center"
    },
    "iapani-laloulu-2026": {
        "report": "Athletic center with good movement skills. Pass protection shows quick feet. Run blocking is developing. Hand placement is adequate. Versatile player.",
        "comparison": "Cesar Ruiz",
        "archetype": "Athletic Center"
    },

    # === MORE QUARTERBACKS ===
    "jackson-arnold-2026": {
        "report": "Athletic quarterback with good mobility. Arm strength is adequate. Accuracy is developing - better on the move. Decision-making needs refinement. Release is quick. Pocket presence is raw. Running ability is a plus.",
        "comparison": "Jalen Hurts (developmental)",
        "archetype": "Dual-Threat"
    },
    "miller-moss-2026": {
        "report": "Pocket passer with adequate arm strength. Accuracy is his calling card. Deep ball touch is developing. Decision-making is sound. Release is quick. Mobility is limited. Anticipation on timing routes is good.",
        "comparison": "Jimmy Garoppolo",
        "archetype": "Pocket Passer"
    },
    "sawyer-robertson-2026": {
        "report": "Physical quarterback with good arm strength. Accuracy is developing. Decision-making shows maturity. Pocket presence is adequate. Mobility is limited. Can push the ball downfield.",
        "comparison": "Andy Dalton",
        "archetype": "Traditional QB"
    },
    "kyron-drones-2026": {
        "report": "Dual-threat quarterback with excellent mobility. Arm strength is good. Accuracy is inconsistent from the pocket. Decision-making improves outside structure. Running ability is elite. Pocket presence needs work.",
        "comparison": "Marcus Mariota",
        "archetype": "Dual-Threat"
    },
    "nico-iamaleava-2026": {
        "report": "Athletic quarterback with good arm talent. Accuracy is developing. Decision-making is raw. Mobility is a weapon. Release is quick. Anticipation needs work. High-ceiling prospect.",
        "comparison": "Justin Fields",
        "archetype": "Athletic QB"
    },
    "dante-moore-2026": {
        "report": "Talented passer with good arm strength. Accuracy shows flashes. Decision-making is developing. Pocket presence is improving. Mobility is adequate. High school pedigree. Development needed.",
        "comparison": "Sam Howell",
        "archetype": "Developing QB"
    },

    # === MORE LINEBACKERS ===
    "trey-moore-2026": {
        "report": "Physical linebacker who fills gaps aggressively. Run defense is his calling card. Tackling is sound. Pass coverage is limited. Blitzing shows timing. Sideline-to-sideline pursuit is adequate.",
        "comparison": "Jordyn Brooks",
        "archetype": "Downhill LB"
    },
    "whit-weeks-2026": {
        "report": "Instinctive linebacker with good football IQ. Run defense reads are solid. Tackling is reliable. Pass coverage is developing. Blitzing is adequate. Well-rounded skill set.",
        "comparison": "Nick Bolton",
        "archetype": "Instinctive LB"
    },
    "malachi-lawrence-2026": {
        "report": "Rangy linebacker with good pursuit angles. Run defense is solid. Tackling shows improvement. Pass coverage is developing. Blitzing shows burst. Sideline-to-sideline range is good.",
        "comparison": "Frankie Luvu",
        "archetype": "Rangy LB"
    },
    "aiden-fisher-2026": {
        "report": "Physical linebacker who takes on blocks. Run defense is his strength. Tackling is sure. Pass coverage is limited. Blitzing is developing. Traditional inside linebacker.",
        "comparison": "Demario Davis",
        "archetype": "Thumper LB"
    },
    "amare-campbell-2026": {
        "report": "Athletic linebacker with coverage potential. Pass coverage is developing. Run defense instincts are adequate. Tackling needs work. Blitzing shows burst. Sideline-to-sideline range is good.",
        "comparison": "Patrick Queen",
        "archetype": "Athletic LB"
    },
    "eric-gentry-2026": {
        "report": "Rangy linebacker with unique length. Pass coverage uses his size. Run defense is developing. Tackling is adequate. Blitzing shows timing. Sideline-to-sideline pursuit is good. Unique body type.",
        "comparison": "Jamin Davis",
        "archetype": "Long LB"
    },
    "drayk-bowen-2026": {
        "report": "Physical linebacker who attacks downhill. Run defense is solid. Tackling is sure and violent. Pass coverage is limited. Blitzing shows aggression. Takes on blocks well.",
        "comparison": "Tremaine Edmunds",
        "archetype": "Downhill LB"
    },
    "jacob-rodriguez-2026": {
        "report": "Instinctive linebacker with good reads. Run defense is his strength. Tackling is reliable. Pass coverage is adequate. Blitzing shows timing. Consistent performer.",
        "comparison": "Alex Anzalone",
        "archetype": "Run LB"
    },
    "keyron-crawford-2026": {
        "report": "Physical linebacker with good size. Run defense is solid. Tackling is sure. Pass coverage is developing. Blitzing is adequate. Takes on blocks well.",
        "comparison": "Shaquille Leonard",
        "archetype": "Thumper LB"
    },

    # === MORE EDGE RUSHERS ===
    "lt-overton-2026": {
        "report": "Powerful edge rusher with developing technique. First step is adequate. Pass rush is more power than speed. Bend is limited. Run stuffing is a strength. Hand usage is developing. Motor is consistent.",
        "comparison": "Azeez Ojulari",
        "archetype": "Power Edge"
    },
    "tyreak-sapp-2026": {
        "report": "Versatile edge defender who can stand up or put his hand down. First step is quick. Pass rush moves are developing. Run defense is solid. Motor runs hot. Scheme versatility adds value.",
        "comparison": "Jadeveon Clowney",
        "archetype": "Versatile Edge"
    },
    "max-llewellyn-2026": {
        "report": "Technical edge rusher with good fundamentals. First step is adequate. Pass rush moves show technique. Bend is limited. Run stuffing is solid. Hand usage is refined. Consistent effort.",
        "comparison": "Alex Highsmith",
        "archetype": "Technique Edge"
    },
    "quincy-rhodes-2026": {
        "report": "Athletic edge with upside. First step shows burst. Pass rush moves are raw. Bend is developing. Run defense needs work. Motor is inconsistent. Tools are there for development.",
        "comparison": "Yannick Ngakoue",
        "archetype": "Upside Edge"
    },
    "anthony-lucas-2026": {
        "report": "Long edge defender with good length. First step is adequate. Pass rush uses his reach. Bend is limited by his frame. Run defense is solid. Hand usage is developing.",
        "comparison": "Jordan Phillips",
        "archetype": "Length DE"
    },
    "patrick-payton-2026": {
        "report": "Quick edge rusher with good first step. Pass rush shows burst. Bend is natural. Run defense is developing. Hand usage needs work. Motor is consistent. Speed rusher profile.",
        "comparison": "Preston Smith",
        "archetype": "Speed Edge"
    },
    "matayo-uiagalelei-2026": {
        "report": "Powerful edge with good size. First step is adequate. Pass rush is more power oriented. Bend is limited. Run defense is a strength. Hand usage shows violence. Physical player.",
        "comparison": "Montez Sweat",
        "archetype": "Power Edge"
    },
    "zion-young-2026": {
        "report": "Explosive edge rusher with quick first step. Pass rush shows burst. Bend around the corner is developing. Run defense is inconsistent. Hand usage is raw. Motor runs hot.",
        "comparison": "Marcus Davenport",
        "archetype": "Explosive Edge"
    },
    "clev-lubin-2026": {
        "report": "Athletic edge with versatility. First step is quick. Pass rush moves are developing. Bend is adequate. Run defense shows effort. Can line up at multiple spots.",
        "comparison": "Shaq Barrett",
        "archetype": "Versatile Edge"
    },
    "derrick-moore-2026": {
        "report": "Powerful edge defender with good anchor. Run defense is his calling card. Pass rush is developing. First step is adequate. Bend is limited. Sets the edge well.",
        "comparison": "Emmanuel Ogbah",
        "archetype": "Run-First Edge"
    },

    # === MORE CORNERBACKS ===
    "thaddeus-dixon-2026": {
        "report": "Physical corner with good size. Press technique uses his frame. Man coverage is developing. Zone coverage instincts are adequate. Ball skills need work. Tackling is a strength.",
        "comparison": "Tre'Davious White",
        "archetype": "Physical Corner"
    },
    "dj-mckinney-2026": {
        "report": "Quick corner with good feet. Man coverage is his strength. Press technique is developing. Zone coverage shows solid instincts. Ball skills are adequate. Recovery speed is good.",
        "comparison": "Marlon Humphrey",
        "archetype": "Man Corner"
    },
    "tacario-davis-2026": {
        "report": "Long corner with developing technique. Press uses his length. Man coverage is raw. Zone coverage shows potential. Ball skills are developing. Upside is there.",
        "comparison": "James Bradberry",
        "archetype": "Length Corner"
    },
    "treydan-stukes-2026": {
        "report": "Athletic corner with good length. Press technique shows potential. Man coverage is developing. Zone instincts are adequate. Ball skills need work. Physical player.",
        "comparison": "Carlton Davis",
        "archetype": "Athletic Corner"
    },
    "jalon-kilgore-2026": {
        "report": "Quick corner with good recovery speed. Man coverage is solid. Press technique is adequate. Zone coverage is developing. Ball skills show potential. Tackling needs work.",
        "comparison": "Byron Murphy Jr.",
        "archetype": "Speed Corner"
    },
    "smith-snowden-2026": {
        "report": "Fluid corner with good hips. Man coverage shows technique. Press is developing. Zone coverage instincts are solid. Ball skills are adequate. Reliable performer.",
        "comparison": "Bryce Hall",
        "archetype": "Zone Corner"
    },
    "will-lee-iii-2026": {
        "report": "Athletic corner with good ball skills. Man coverage is solid. Press technique is developing. Zone coverage shows instincts. Tackling is adequate. Playmaker ability.",
        "comparison": "Greg Newsome II",
        "archetype": "Playmaker Corner"
    },
    "brent-austin-2026": {
        "report": "Quick corner with good feet. Man coverage technique is solid. Press is developing. Zone instincts are adequate. Ball skills need refinement. Tackling is willing.",
        "comparison": "Cam Taylor-Britt",
        "archetype": "Quick Corner"
    },
    "julian-neal-2026": {
        "report": "Physical corner with good length. Press technique is refined. Man coverage is solid. Zone coverage instincts are developing. Ball skills are adequate. Tackling is a strength.",
        "comparison": "Duke Riley",
        "archetype": "Physical Corner"
    },
    "malik-muhammad-2026": {
        "report": "Quick corner with good technique. Man coverage is his calling card. Press shows timing. Zone coverage instincts are solid. Ball skills are developing. Competitive nature.",
        "comparison": "Trayvon Mullen",
        "archetype": "Man Corner"
    },
    "jerry-wilson-2026": {
        "report": "Long corner with developing technique. Press uses his reach. Man coverage is raw. Zone coverage shows potential. Ball skills need work. Upside with coaching.",
        "comparison": "Caleb Farley",
        "archetype": "Length Corner"
    },
    "davison-igbinosun-2026": {
        "report": "Physical corner with good size. Press technique is developing. Man coverage shows potential. Zone instincts are adequate. Ball skills are raw. Tackling is solid.",
        "comparison": "Adoree' Jackson",
        "archetype": "Physical Corner"
    },
    "daylen-everette-2026": {
        "report": "Fluid corner with good transitions. Man coverage technique is solid. Press is adequate. Zone coverage instincts are developing. Ball skills show potential. Reliable performer.",
        "comparison": "Paulson Adebo",
        "archetype": "Smooth Corner"
    },

    # === MORE SAFETIES ===
    "tao-johnson-2026": {
        "report": "Rangy safety with good ball skills. Range for centerfield duties is adequate. Zone coverage instincts are solid. Man coverage is developing. Tackling is reliable. Run support is willing.",
        "comparison": "Quandre Diggs",
        "archetype": "Free Safety"
    },
    "robert-spears-jennings-2026": {
        "report": "Physical safety who plays in the box. Run support is his calling card. Tackling is sure and violent. Man coverage is limited. Zone instincts are adequate. Range is limited for centerfield.",
        "comparison": "Jimmie Ward",
        "archetype": "Box Safety"
    },
    "earl-little-jr-2026": {
        "report": "Instinctive safety with good ball skills. Zone coverage reads are solid. Man coverage is developing. Range is adequate. Tackling is reliable. Run support is willing.",
        "comparison": "Julian Love",
        "archetype": "Instinctive Safety"
    },
    "xavier-nwankpa-2026": {
        "report": "Athletic safety with versatility. Range is good for centerfield. Zone coverage shows instincts. Man coverage is developing. Tackling is adequate. Ball skills show potential.",
        "comparison": "Kyle Hamilton (developmental)",
        "archetype": "Versatile Safety"
    },
    "isaiah-nwokobia-2026": {
        "report": "Physical safety with good tackling. Run support is solid. Zone coverage is developing. Man coverage is limited. Range is adequate. Instincts are improving.",
        "comparison": "Jordan Fuller",
        "archetype": "Run Safety"
    },
    "michael-taaffe-2026": {
        "report": "Instinctive safety with good reads. Zone coverage is his strength. Man coverage is adequate. Range is solid. Tackling is reliable. Ball skills are developing.",
        "comparison": "Harrison Smith",
        "archetype": "Zone Safety"
    },
    "adon-shuler-2026": {
        "report": "Athletic safety with good range. Zone coverage shows potential. Man coverage is developing. Tackling is adequate. Ball skills are solid. Versatile defender.",
        "comparison": "Eddie Jackson",
        "archetype": "Rangy Safety"
    },
    "bray-hubbard-2026": {
        "report": "Physical safety who excels in run support. Tackling is violent and sure. Zone coverage is developing. Man coverage is limited. Range is adequate for box duties.",
        "comparison": "Landon Collins",
        "archetype": "Box Safety"
    },
    "bud-clark-2026": {
        "report": "Rangy safety with good ball skills. Zone coverage instincts are solid. Range is good. Man coverage is developing. Tackling is adequate. Playmaker potential.",
        "comparison": "Marcus Williams",
        "archetype": "Centerfield Safety"
    },
    "jalen-catalon-2026": {
        "report": "Instinctive safety with good football IQ. Zone coverage reads are advanced. Man coverage is adequate. Tackling is sure. Range is limited. Ball skills are solid.",
        "comparison": "Micah Hyde",
        "archetype": "Zone Safety"
    },

    # === MORE INTERIOR DEFENSIVE LINE ===
    "chris-mcclellan-2026": {
        "report": "Powerful interior lineman with good anchor. Run stuffing is his calling card. First step is adequate. Pass rush is limited. Hand usage is developing. Double team resistance is solid.",
        "comparison": "Leonard Williams",
        "archetype": "Run-Stuffer"
    },
    "cj-fite-2026": {
        "report": "Quick interior lineman with penetrating ability. First step is good. Pass rush shows potential. Run stuffing is developing. Hand usage is adequate. Anchor needs work.",
        "comparison": "Kenny Clark",
        "archetype": "Penetrating DT"
    },
    "domonique-orange-2026": {
        "report": "Powerful nose tackle who occupies blockers. Anchor is elite. Run stuffing is his calling card. First step is limited. Pass rush is raw. Demands double teams.",
        "comparison": "Vita Vea",
        "archetype": "Nose Tackle"
    },
    "caleb-banks-2026": {
        "report": "Athletic interior lineman with upside. First step is quick. Pass rush is developing. Run stuffing is inconsistent. Hand usage is raw. Motor is good. Upside player.",
        "comparison": "Christian Wilkins",
        "archetype": "Athletic DT"
    },
    "david-oke-2026": {
        "report": "Powerful interior player with good anchor. Run stuffing is solid. First step is adequate. Pass rush is limited. Hand usage is developing. Consistent effort.",
        "comparison": "D.J. Reader",
        "archetype": "Run-Stuffer"
    },
    "tim-keenan-iii-2026": {
        "report": "Space-eating nose tackle who demands attention. Anchor is elite. Run stuffing is his strength. First step is limited. Pass rush is raw. Two-gap ability is plus.",
        "comparison": "Poona Ford",
        "archetype": "Two-Gap NT"
    },
    "demonte-capehart-2026": {
        "report": "Powerful interior player with good size. Anchor is solid. Run stuffing is his calling card. First step is adequate. Pass rush is developing. Hand usage shows violence.",
        "comparison": "Derrick Brown",
        "archetype": "Power DT"
    },
    "darrell-jackson-jr-2026": {
        "report": "Massive interior presence with elite size. Anchor is exceptional. Run stuffing is a strength. First step is limited. Pass rush is raw. Occupies blockers.",
        "comparison": "Danny Shelton",
        "archetype": "Massive NT"
    },

    # === MORE WIDE RECEIVERS ===
    "jeff-caldwell-2026": {
        "report": "Big receiver with good catch radius. Route running is developing. Separation comes from size. Hands are reliable. YAC is limited. Contested catches are a strength.",
        "comparison": "Allen Robinson",
        "archetype": "Possession WR"
    },
    "elijah-sarratt-2026": {
        "report": "Smooth route runner with good technique. Separation is created through precision. Hands are reliable. YAC ability is developing. Contested catches are adequate. Well-rounded receiver.",
        "comparison": "Adam Thielen",
        "archetype": "Route Runner"
    },
    "antonio-williams-2026": {
        "report": "Quick receiver with good feet. Route running is polished. Separation is created with quickness. Hands are reliable. YAC shows burst. Contested catches are limited by size.",
        "comparison": "Hunter Renfrow",
        "archetype": "Slot WR"
    },
    "josh-cameron-2026": {
        "report": "Physical receiver with good size. Route running is developing. Separation comes from physicality. Hands are reliable. YAC is limited. Contested catches are his calling card.",
        "comparison": "Darnell Mooney",
        "archetype": "Physical WR"
    },
    "zachariah-branch-2026": {
        "report": "Electric playmaker with speed. Route running is developing. Separation comes from explosiveness. Hands are reliable. YAC ability is elite. Versatile weapon. Return game value.",
        "comparison": "Tyreek Hill (speed)",
        "archetype": "Speed Demon"
    },
    "nyck-harbor-2026": {
        "report": "Athletic receiver with good size. Route running is developing. Separation comes from athleticism. Hands are adequate. YAC shows potential. Contested catches are improving.",
        "comparison": "Chase Claypool",
        "archetype": "Athletic WR"
    },
    "eric-rivers-2026": {
        "report": "Quick receiver who works well from the slot. Route running is polished. Separation is created with footwork. Hands are soft. YAC ability is good. Versatile player.",
        "comparison": "Slot weapon",
        "archetype": "Slot WR"
    },
    "chris-bell-2026": {
        "report": "Big receiver with strong hands. Route running is developing. Separation is created with size. Catch radius is excellent. YAC is limited. Contested catches are a strength. Red zone target.",
        "comparison": "Tee Higgins",
        "archetype": "Red Zone WR"
    },
    "eric-mcalister-2026": {
        "report": "Athletic receiver with good body control. Route running is developing. Separation shows potential. Hands are reliable. YAC ability is adequate. Contested catches are improving.",
        "comparison": "JuJu Smith-Schuster",
        "archetype": "Balanced WR"
    },
    "kevin-coleman-jr-2026": {
        "report": "Quick receiver with explosive speed. Route running is developing. Separation comes from speed. Hands are adequate. YAC ability is elite. Versatile weapon who can take the top off.",
        "comparison": "Marquise Brown",
        "archetype": "Speed WR"
    },
    "brenen-thompson-2026": {
        "report": "Small but explosive receiver. Speed is his primary weapon. Route running is developing. Separation comes from quickness. Hands are adequate. YAC shows burst. Deep threat.",
        "comparison": "Kadarius Toney",
        "archetype": "Speedster"
    },
    "jakobi-lane-2026": {
        "report": "Big receiver with long frame. Route running is developing. Separation is created with size. Hands are reliable. YAC is limited. Contested catches are a strength.",
        "comparison": "D.K. Metcalf (style)",
        "archetype": "Downfield WR"
    },
    "malachi-fields-2026": {
        "report": "Athletic receiver with good size. Route running is developing. Separation comes from athleticism. Hands are adequate. YAC shows potential. Upside receiver.",
        "comparison": "N'Keal Harry",
        "archetype": "Developmental WR"
    },

    # === MORE TIGHT ENDS ===
    "joe-royer-2026": {
        "report": "Balanced tight end with solid receiving skills. Route running is adequate. Separation against linebackers is developing. Hands are reliable. Blocking is functional. YAC is limited.",
        "comparison": "T.J. Hockenson",
        "archetype": "Balanced TE"
    },
    "daequan-wright-2026": {
        "report": "Athletic tight end with receiving upside. Route running is developing. Separation shows potential. Hands are soft. Blocking is a weakness. YAC ability is good.",
        "comparison": "Gerald Everett",
        "archetype": "Receiving TE"
    },
    "lance-mason-2026": {
        "report": "Physical tight end who excels as a blocker. Run blocking is his calling card. Pass protection is solid. Route running is limited. Hands are adequate. Inline tight end.",
        "comparison": "Tyler Higbee",
        "archetype": "Blocking TE"
    },
    "jack-endries-2026": {
        "report": "Reliable tight end with good hands. Route running is solid in the short game. Separation is adequate. Blocking is developing. YAC is limited. Red zone target.",
        "comparison": "Robert Tonyan",
        "archetype": "Possession TE"
    },
    "josh-cuevas-2026": {
        "report": "Athletic tight end with receiving potential. Route running shows promise. Separation is developing. Hands are soft. Blocking is a work in progress. Upside player.",
        "comparison": "Mike Gesicki",
        "archetype": "Move TE"
    },

    # === MORE RUNNING BACKS ===
    "kaytron-allen-2026": {
        "report": "Physical runner who runs through contact. Vision is solid. Elusiveness is limited. Power is his calling card. Pass blocking is developing. Receiving skills are adequate. Ball security is good. Between the tackles runner.",
        "comparison": "Najee Harris",
        "archetype": "Power Back"
    },
    "bryson-washington-2026": {
        "report": "Quick runner with good burst. Vision is developing. Elusiveness shows potential. Power is limited. Pass blocking needs work. Receiving skills are adequate. Ball security is solid.",
        "comparison": "Tony Pollard",
        "archetype": "Explosive Back"
    },
    "terion-stewart-2026": {
        "report": "Balanced runner with solid fundamentals. Vision is good. Elusiveness is adequate. Power is developing. Pass blocking is willing. Receiving skills are solid. Well-rounded back.",
        "comparison": "Javonte Williams",
        "archetype": "Balanced RB"
    },
    "le-veon-moss-2026": {
        "report": "Patient runner with good vision. Finds cutback lanes naturally. Elusiveness is adequate. Power is solid. Pass blocking is developing. Receiving skills are limited.",
        "comparison": "Leonard Fournette",
        "archetype": "Patient Back"
    },
    "nicholas-singleton-2026": {
        "report": "Explosive runner with speed. Vision is developing. Elusiveness shows burst. Power is limited. Pass blocking needs work. Receiving is raw. Home run ability is his calling card.",
        "comparison": "Raheem Mostert",
        "archetype": "Speed Back"
    },
    "darius-taylor-2026": {
        "report": "Quick runner with good lateral agility. Vision is solid. Elusiveness is a strength. Power is developing. Pass blocking is adequate. Receiving skills are good.",
        "comparison": "Rico Dowdle",
        "archetype": "Elusive Back"
    },
    "quintrevion-wisner-2026": {
        "report": "Physical runner with good pad level. Vision is adequate. Elusiveness is limited. Power between the tackles is solid. Pass blocking is developing. Reliable runner.",
        "comparison": "Zach Moss",
        "archetype": "Power Back"
    },
    "hollywood-smothers-2026": {
        "report": "Quick runner with good speed. Vision is developing. Elusiveness shows burst. Power is limited. Pass blocking is raw. Receiving skills show potential. Big play threat.",
        "comparison": "Jaylen Warren",
        "archetype": "Speed Back"
    },
    "desmond-reid-2026": {
        "report": "Explosive playmaker with receiving skills. Vision is adequate. Elusiveness is elite in space. Power is limited. Pass blocking needs development. Receiving is a strength. Versatile weapon.",
        "comparison": "Austin Ekeler",
        "archetype": "Receiving Back"
    }
}

def main():
    with open(CURRENT_FILE, "r") as f:
        data = json.load(f)
    
    updated = 0
    for prospect in data["prospects"]:
        pid = prospect["id"]
        if pid in ADDITIONAL_REPORTS and not prospect.get("scouting_report"):
            report_data = ADDITIONAL_REPORTS[pid]
            prospect["scouting_report"] = report_data["report"]
            prospect["comparison"] = report_data.get("comparison")
            prospect["archetype"] = report_data.get("archetype")
            updated += 1
    
    with open(CURRENT_FILE, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Added {updated} additional scouting reports")
    
    total_with_reports = sum(1 for p in data["prospects"] if p.get("scouting_report"))
    total = len(data["prospects"])
    print(f"Total prospects with reports: {total_with_reports}/{total} ({100*total_with_reports//total}%)")

if __name__ == "__main__":
    main()
