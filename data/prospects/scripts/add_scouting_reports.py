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
    "rueben-bain-jr-2026": {
        "report": "Explosive off the snap with a devastating first step that consistently beats tackles. Shows natural bend around the edge and converts speed to power when needed. Developing counter moves but already has a deep bag of pass rush techniques. Relentless motor - never takes a play off. Sets the edge well against the run. Hands are active and violent at the point of attack.",
        "comparison": "Myles Garrett",
        "archetype": "Speed Rusher"
    },
    "caleb-downs-2026": {
        "report": "Elite range and sideline-to-sideline speed. Instincts allow him to diagnose plays before they develop. Comfortable in man coverage against tight ends and can match up in the slot. Ball skills are exceptional - attacks the ball at its highest point. Physical tackler who doesn't shy from run support. Versatile enough to play multiple secondary spots.",
        "comparison": "Derwin James",
        "archetype": "Hybrid Safety"
    },
    "jermod-mccoy-2026": {
        "report": "Fluid hips and smooth transitions in coverage. Press technique is refined with good jam timing at the line. Recovers quickly when beaten off the line - closing speed is a weapon. Zone awareness needs refinement but shows the instincts to jump routes. Ball skills are developing; tends to play the receiver more than the ball. Willing tackler in run support.",
        "comparison": "Sauce Gardner (style)",
        "archetype": "Press-Man Corner"
    },
    "fernando-mendoza-2026": {
        "report": "Polarizing prospect with elite physical tools. Arm strength is special - can make every throw on the field. Accuracy fluctuates, particularly on deep balls under pressure. Quick release gets the ball out before pressure arrives. Decision-making has improved but still forces throws into coverage. Mobile in the pocket and can extend plays with his legs. Anticipation is ahead of schedule for his experience level.",
        "comparison": "Josh Allen (projection)",
        "archetype": "Power Arm"
    },
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
    "spencer-fano-2026": {
        "report": "Textbook pass protector with excellent footwork and balance. Anchors well against power rushers. Hand placement is consistent and he rarely gets his hands inside his frame. Awareness of stunts and twists is advanced. Run blocking shows good drive and finish. Can pull and get to the second level. Pad level occasionally rises in extended sequences.",
        "comparison": "Rashawn Slater",
        "archetype": "Technician"
    },
    "arvell-reese-2026": {
        "report": "Sideline-to-sideline linebacker with closing burst. Instincts in run defense are elite - finds the ball quickly. Tackling is sound and he finishes through contact. Pass coverage is improving but still a work in progress against athletic tight ends. Blitzing ability shows timing and a feel for gaps. Takes on blocks well but can get washed when guards get to the second level.",
        "comparison": "Roquan Smith",
        "archetype": "Run-and-Hit"
    },
    "peter-woods-2026": {
        "report": "Powerful interior presence who demands double teams. Anchor is exceptional - rarely moved off his spot. First step is quick for his size. Hand usage is still developing but shows flashes of violence. Pass rush is more about power than technique at this stage. Run stuffing ability makes him a space-eater. Motor runs hot and cold.",
        "comparison": "Vita Vea",
        "archetype": "Nose Tackle"
    },
    "jeremiyah-love-2026": {
        "report": "Explosive runner with elite acceleration through the hole. Vision to find cutback lanes and set up blocks. Elusiveness in space makes him dangerous in the open field. Power is developing - prefers to make defenders miss rather than run through them. Pass blocking needs work but shows willingness. Receiving skills are polished. Ball security has been clean. Lateral agility creates big-play opportunities.",
        "comparison": "Alvin Kamara",
        "archetype": "Home Run Hitter"
    },
    "sonny-styles-2026": {
        "report": "Rangy linebacker with safety-level coverage skills. Can match tight ends and running backs in man coverage. Instincts are elite - seems to know where the ball is going before the snap. Sideline-to-sideline pursuit is exceptional. Run defense fundamentals need refinement. Tackling can get arm-y at times. Blitzing package is untapped potential.",
        "comparison": "Isaiah Simmons",
        "archetype": "Coverage Linebacker"
    },
    "francis-mauigoa-2026": {
        "report": "Massive frame with the athleticism to match. Pass protection is his calling card - mirror ability and quick feet for his size. Anchors against power rushers. Run blocking shows nastiness and a desire to finish. Footwork is still being refined on combo blocks. Hand placement can slip outside when fatigued. Pull technique is ahead of schedule. Awareness of games and twists is developing.",
        "comparison": "Tristan Wirfs",
        "archetype": "Mauler"
    },
    "david-bailey-2026": {
        "report": "Relentless motor and non-stop effort. First step is explosive off the edge. Pass rush moves are still limited but wins with speed and effort. Bend is adequate but not elite. Speed-to-power conversion is a work in progress. Run stuffing is better than expected - sets the edge well. Hand usage needs development against longer tackles.",
        "comparison": "Rashan Gary (development path)",
        "archetype": "Effort Rusher"
    },
    "tj-parker-2026": {
        "report": "Long and athletic with room to add mass. First step threatens tackles immediately. Developing a variety of pass rush moves - shows a good inside counter. Bend around the edge is natural. Hand usage and timing are works in progress. Run defense is inconsistent - can get washed by double teams. Motor runs hot.",
        "comparison": "Will Anderson Jr. (upside)",
        "archetype": "High-Upside Rusher"
    },
    "avieon-terrell-2026": {
        "report": "Quick-twitch athlete with elite recovery speed. Man coverage is his strength - stays in phase through the route. Press technique needs refinement at the line. Zone coverage instincts are solid but not elite. Ball skills are developing - attacks the catch point. Tackling in run support is willing but technique can break down. Competitive nature shows on tape.",
        "comparison": "A.J. Terrell",
        "archetype": "Man-Coverage Specialist"
    },
    "kenyon-sadiq-2026": {
        "report": "Receiving tight end with soft hands and body control. Route running is advanced for the position. Creates separation against linebackers. Catch radius allows him to make difficult grabs look routine. Blocking is functional but not a strength - effort is there but technique lags. YAC ability is limited. Reliable in the red zone and on third downs.",
        "comparison": "Dallas Goedert",
        "archetype": "Receiving TE"
    },
    "mansoor-delane-2026": {
        "report": "Long corner with excellent ball skills. Plays the ball in the air like a receiver. Man coverage technique is refined - mirrors well with fluid hips. Press technique can be defeated by quick releases. Zone coverage awareness is solid. Recovery speed is average - relies on positioning rather than closing burst. Tackling is adequate.",
        "comparison": "Patrick Surtain II (style)",
        "archetype": "Ball-Hawk Corner"
    },
    "makai-lemon-2026": {
        "report": "Smaller frame but plays bigger than his size. Route running is polished at every level. Release against press is savvy - uses hands well. Separation is created through quickness and technique. Hands are reliable. YAC ability is elite - makes defenders miss in space. Contested catch situations are difficult given his frame. Versatile enough to play inside and outside.",
        "comparison": "Tyreek Hill (movement skills)",
        "archetype": "Slot Weapon"
    },
    "olaivavega-ioane-2026": {
        "report": "Powerful interior lineman with good anchor. Pass protection is sound - rarely gives ground against bull rushes. Hand placement and timing are strengths. Footwork is adequate in pass pro. Run blocking shows movement ability. Pull technique is developing. Awareness of twists and stunts is advanced for his experience. Can play guard or center.",
        "comparison": "Creed Humphrey",
        "archetype": "Anchor Guard"
    },
    "kayden-mcdonald-2026": {
        "report": "Disruptive interior presence with a quick first step. Pass rush ability from the interior is rare. Hand usage is advanced - club-rip is effective. Double team resistance is developing. Run stuffing can be inconsistent - pad level rises. Anchor is adequate against bigger guards. Motor is steady throughout games.",
        "comparison": "Chris Jones (upside)",
        "archetype": "3-Technique"
    },
    "ty-simpson-2026": {
        "report": "Athletic quarterback with mobility to extend plays. Arm strength is adequate for all throws. Accuracy is inconsistent - mechanics break down under pressure. Decision-making has improved but still holds the ball too long. Release is quick when he trusts his read. Pocket presence needs work - doesn't feel pressure from the backside. Anticipation shows flashes but isn't consistent.",
        "comparison": "Trey Lance (developmental)",
        "archetype": "Dual-Threat"
    },
    "dillon-thieneman-2026": {
        "report": "Rangy safety with excellent ball skills. Range to cover ground sideline to sideline. Instincts in zone coverage are advanced - reads quarterback eyes. Man coverage against tight ends is solid. Tackling can be inconsistent - angles sometimes miss. Run support is willing but needs to be more physical. Versatility to play multiple spots in the secondary.",
        "comparison": "Jessie Bates III",
        "archetype": "Centerfield Safety"
    },
    "christen-miller-2026": {
        "report": "Interior disruptor with a quick first step. Pass rush from the three-technique spot is his calling card. Hand usage shows violence and timing. Double team resistance is developing - can get moved when engaged by two blockers. Run stuffing is inconsistent - prefers to penetrate rather than hold ground. Motor is hot throughout games. Anchor needs work against bigger guards.",
        "comparison": "Javon Hargrave",
        "archetype": "Penetrating DT"
    },
    "caleb-lomu-2026": {
        "report": "Young tackle with rare physical tools. Pass protection shows balance and quick feet for his size. Anchors well against speed-to-power. Footwork is still being refined - can get overextended. Run blocking is physical with good drive. Hand placement is consistent. Awareness of games is developing with experience. Upside is significant given his age.",
        "comparison": "Penei Sewell (developmental)",
        "archetype": "Upside OT"
    },
    "emmanuel-pregnon-2026": {
        "report": "Powerful guard who mauls in the run game. Drive blocking shows nasty finish. Pass protection technique is sound - anchors against power. Hand placement can get wide when fatigued. Pull ability is adequate. Footwork in space needs refinement. Awareness of stunts is solid.",
        "comparison": "Quenton Nelson (run game)",
        "archetype": "Mauler Guard"
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
    
    print("\nSample reports added:")
    for prospect in data["prospects"][:10]:
        if prospect["scouting_report"]:
            print(f"  - {prospect['name']['display']} ({prospect['position']}): {prospect['archetype']}")

if __name__ == "__main__":
    main()
