# Research: Real 7v7 Flag Rules vs. Film Lab's Validation Model

**Ticket:** Linear HJ-286 (wayfinder research: "Q3 research: do real 7v7 league rules conflict with validation?")
**Date:** 2026-08-24
**Author:** research agent (film-lab)

## Summary (verdict)

- **7v7 is a real, codified format — but not the dominant youth format.** The NFL FLAG flagship youth program (and the Olympic/IFAF standard) is **5v5**; 7v7 is the **high-school standard (NFHS)**, the college standard (NCAA/NAIA/NJCAA), a USA Football / IFAF variant, and the common rec-league / tackle-converted / 7-on-7-passing format. Film Lab's choice of 7v7 is legitimate but models one sub-format among many.
- **No rulebook requires exactly 7+7; every rulebook uses a *maximum* or a *start-with* phrasing and explicitly allows playing shorthanded** (as few as 4 players in several books). Film Lab's `validatePlay` (exactly 7 offense + 7 defense) would reject a play that every real rulebook permits.
- **The single real mis-modeling is defensive rush depth.** Film Lab's defensive templates put rushers at **y = 4** (4 yd off the LOS). Every major rulebook (NFL FLAG, USA Flag 5's/7's, ADM, IFAF, CIF/NFHS, college) requires rushers/blitzers to be **≥ 7 yards from the LOS at the snap**. A play drawn with rushers at y=4 is illegal in every rule set surveyed.
- **The 40×40 field matches no real 7v7 field.** Real 7v7 fields are 25–53⅓ yd wide × 70–140 yd long (or 30–40 wide × 40–80 yd playing field for rec leagues). Film Lab's symmetric "40×40, LOS at center" is a diagramming canvas, not a real field; it cannot represent 10-yd end zones, line-to-gain spots (5/10/25 yd), or full-drive depth.
- **Waypoint ordering (invariant 2), the t=0 snap anchor (invariant 3), the role set (invariant 5), and the formation count (invariant 6) do not conflict with any rulebook.** They are model-internal conventions or coaching shorthand that every surveyed rule set tolerates — except that formation *legality* (players-on-LOS counts) is target-league-dependent and Film Lab's templates are illegal under NFHS/CIF rules.

Bottom line: the **field (4)** and **rusher-depth / formation-geometry (5 & 6, partially)** invariants would need revisiting before claiming "legal under real rules"; the **7+7 count (1)** is stricter than all real rulebooks.

---

## Verdict table

| Rule book / source | Format | On-field player count | Field size | Positions | Conflict with Film Lab? | What would need to change |
|---|---|---|---|---|---|---|
| **NFL FLAG Regular Season Rules 2025** (primary, nfl.com PDF) | **5v5** (NFL Flag is 5-a-side; 6v6/7v7/9v9 exist in other leagues) | Max **5** on field (roster max 10, min 7 to enter); may continue with 4 | 50 yd × 25 yd playing + two 10-yd EZs (70 yd total); no-run zones 5 yd before EZ & midfield; ball spotted 5-yd line; **ball may not be closer than 10 yd to a sideline** | Center on LOS; QB off LOS; "blitzer" (7 yd) concept; WR/RB mix | **Partial** (5v5 ≠ 7v7; center-on-LOS ✓; blitzer 7 yd ✓ vs. Film Lab's 4 yd ✗) | 7v7 assumption; rusher depth; field dims |
| **USA Flag 5's & 7's High School Rulebook v2026.2** (primary, USA Football PDF) | **7v7** (also 5v5 sibling) | **Start with 7**; play with 6 on injury; **no fewer than 4**; roster ≥ 7, max 15 rec. | 30 × 70 yd + two 10-yd EZs (50-yd field of play; v2025.1 said **25** × 70) | Offense = center + QB + 5 receivers/backs; defense = **Blitzer** (≥7 yd, max 2) / **Rusher** | **Partial** | 7+7 is a start-with, not exact; rusher depth; field |
| **USA Football ADM 7-on-7 Rulebook** (primary, usafootball.com PDF) | **7v7** | Start with 7 (roster min 7, max 15 rec.) | 50-yd field of play + 10-yd EZs (diagram; league-dependent per rulebook note) | Offense = center + QB + 5 receivers; **2 receivers MUST be on LOS** (opposite sides of center); other 3 ≥ 1 yd behind LOS; **no one but QB within 3 yd of center**; center is the *only ineligible* player; defense: any number may rush, all ≥ 7 yd | **Partial** | Rusher depth; no-laterals rule not modeled; LOS-count rule differs per league |
| **IFAF Flag Football Rules 2023** (primary, bafra.info PDF) | **5v5** standard; **7v7 variant** ("big field") | 5v5: "not more than 5"; 7v7: "**not more than 7**", roster max 20 | 5v5: 50 × 25 yd + 10-yd EZs; **7v7: 50 × 30 yd** ("big field"), 40–60 yd length / 25–35 width range | Offense = snapper/runner/receiver; defense = blitzer/rusher/defender; **no minimum players on LOS at the snap**; blitzer > 7 yd, max 2 | **Partial** | 7v7 is a variant, not the standard; rusher depth; field |
| **NFHS Flag Football Rules 2025-26 / 2026** (primary rules-change page; book is paywalled) | **7v7** (HS standard) | **1-1-3: "all teams must start the game with 7 players"** | Three state-adopted field options: **40 yd wide × 100 yd**, **40 × 120 yd**, **53⅓ × 120 yd** (each + two 10-yd EZs); 4th option 53⅓ × 100 for 2026-27 | State-adopted; formation rule per CIF adoption requires **≥ 4 on LOS**; rushers ≥ 7 yd | **Partial** | Field dims (Film Lab 40×40 too short, width ok); 4-on-LOS formation legality |
| **CIF Flag Football Rule Book 2024** (primary via SDCFOA PDF; CA girls HS, NFHS-family) | **7v7** | "Each team shall begin the game with 7 players" (may play down on injury) | **40 wide × 80 long** (min 30, up to 45 wide; small 20 × 40) + 10-yd EZs | Team A must have **4+ on the LOS**; ≥ 1 on each side of center; rushers **≥ 7 yd**; max 2 rushers cross LOS vs. QB; no-run zone: ≤ 3 players within 4 yd of ball | **Yes** (formation geometry + rusher depth) | 4-on-LOS formation requirement; rusher depth; field |
| **NCAA/NAIA/NJCAA Collegiate Flag Rules 2025-26/2026-27** (primary, naia.org PDF) | **7v7** (college) | "two teams of **no more than seven players each**… may legally play with **fewer than seven**" | Goal lines **80 yd apart**, EZ 10 yd; width per Appendix (NCAA one-pager: 80 × 40) | No formal positions (all eligible); max 2 rushers (7-yd rush line) | **Partial** | 7+7 is a max, not exact; field |
| **WA State 7v7 Flag Rules 2024-25** (primary via WSIFOA PDF) | **7v7** | "Teams may play **two players down** to avoid a forfeit" (i.e. 5) | **30 yd wide × min 50 yd long** (+ EZs); pass-only zones 5 yd before goal lines | Backfield-screening model; blitz line 7 yd; max 2 ROW blitzers | **Partial** | 7+7 is not exact; field |
| **San Diego AYF Flag Rules 2022** (local AYF chapter, secondary) | **8v8** | "eight-man team"; five linemen + three backs | Four zones of 20 yd (80 yd total) | ≥ 5 offensive players within 1 yd of LOS | **Yes for AYF chapter** | AYF flag is 8v8 locally, not 7v7 |
| **NFL Flag (flagship youth)** — nflflag.com rules page & 2024 rulebook (secondary/primary) | **5v5** | Max 5 on field | Option A: 25 × 70 + 10-yd EZs; Option B: 25 × 64 + 7-yd EZs | QB, center, WR/RB mix; rushers (max 2) + DBs/safety | **Partial** | 7v7 assumption; field; rusher depth |
| **Rec 7v7 leagues** (MidAmerica 7v7, Texas Power Rankings, Passing Down, Redmond YF — secondary) | **7v7** | 7 on field | **40 yd playing field + 10-yd EZ**; width 40 (min 30–55) | Standard 7v7 positions | **Partial / closest match** | Field depth off by factor of 2 vs. Film Lab's 40-yd downfield |

---

## Per-invariant analysis

### Invariant 1 — exactly 7 offensive + 7 defensive players (`validatePlay` enforces `offense.length!==7`, `defense.length!==7`)

**Conflict: PARTIAL. 7v7 is real, but "exactly 7+7" is stricter than every rulebook.**

- 7v7 is codified: NFHS HS standard ("the first book features rules governing the **7-on-7** player game"; rules-change 2026 **1-1-3: "Standardized that all teams must start the game with 7 players"** — [NFHS rules-change page](https://nfhs.org/sports/flag-football/rules)); USA Flag 7's; IFAF "Flag 7 on 7"; NCAA/college; WA state; CIF.
- But 7v7 is **not** the dominant youth format. NFL FLAG (the largest youth flag program) is **5v5** ("NFL FLAG football teams compete **5 on 5**, but you may find various leagues out there—6 on 6, 7 on 7, 9 on 9—depending on the region and age group", with max 10 rostered — [nflflag.com/flag-football-rules](https://nflflag.com/flag-football-rules)); the Olympic/IFAF standard is also 5v5 (IFAF 2023, R 1-1-1: "not more than 5 players each"). 7v7 is the HS/college/adult and tackle-converted profile.
- Every 7v7 rulebook phrases the count as a **maximum or a start-with and explicitly allows playing shorthanded**:
  - USA Flag 7's: "Teams must start games with seven players on the field. In the event of an injury, a team with insufficient substitute players may play with six players on the field **but no fewer than four**." (Rule 1, Sec 2, Art 3)
  - IFAF 7v7: "Teams consist of **not more than 7 players**." (R 1-1-1)
  - NCAA/college: "two teams of **no more than seven players each**… A team **may legally play with fewer than seven players**." (Rule 1-1-1)
  - CIF: "Each team shall begin the game with 7 players, but if it has no substitutes to replace injured…" (allowed to play down).
  - WA: "Teams may play **two players down** to avoid a forfeit" (i.e. 5).
  - NFL FLAG 5v5 analog: "If a team of 5 sustains an injury, the team can continue with **4 players** but no fewer."
- **Implication:** `validatePlay` rejects e.g. a 6v6 or 5v7 play that every real rulebook permits (shorthanded due to injury/no-shows). The 7+7 model is correct for the *canonical* snapshot but not for legitimate shorthanded play. Consider relaxing to "≤ 7 per side, with an optional min" (e.g. 4) if cross-league legality is a goal.

### Invariant 2 — sorted waypoints (non-decreasing t)

**Conflict: NO.** No rulebook constrains waypoint time-ordering; this is a model-internal animation invariant (a player cannot occupy two positions at two times unless time is non-decreasing). It cannot conflict with real rules. The one adjacent real rule is pre-snap motion: "only one player can motion at a time" (NFL FLAG 14.2.1), motion must be "lateral or backwards" (NFL FLAG 14.2.2/14.2.3; USA Flag 7's 4-8-1c; CIF 5.4.3), and the offense must be set for 1 second before the snap — none of which the model encodes, and none of which the sorted-waypoint invariant contradicts. No change needed.

### Invariant 3 — first waypoint anchored at t=0 (LOS at y=0, play starts at the snap)

**Conflict: NO.** The t=0 = snap anchor matches every rulebook's live-ball definition ("The ball is live at the snap and remains live until an official's whistle" — NFL FLAG 9.1, USA Flag 7's R3-1-1, ADM, IFAF). LOS at y=0 with negative-y = offensive backfield matches real geometry: "Backfield: The part of the field directly behind the line of scrimmage" ([playfootball.nfl.com glossary](https://playfootball.nfl.com/flag/flag-football-glossary/)); the center on the LOS, QB off it (NFL FLAG 14.1/14.2.1; USA Flag 7's 4-8-1). Defense *may* line up on the LOS in every surveyed book ("Players not rushing the quarterback can defend on the line of scrimmage" — ADM; USA Flag 7's), so Film Lab's defenders at y=0 are legal.
- **Nuance (rule-set dependent):** CIF requires the *snapper to be completely behind* the LOS and snaps "to any person whose feet are at least 2 yards behind the line of scrimmage" (CIF 5.4.3), whereas NFL FLAG requires the center *on* the LOS. Film Lab's center-at-y=0 is legal under NFL FLAG/USA Flag/ADM/IFAF, and the QB-at-y=-5 satisfies CIF's 2-yd snap rule. No validation conflict; just note the center-position divergence between rule sets.
- The model does not encode pre-snap motion, no-run zones, or drive position; all are out of scope for the t=0 invariant.

### Invariant 4 — field is 40×40 (x ∈ [0,40], y ∈ [-40,40]; y=0 at LOS)

**Conflict: PARTIAL — no real 7v7 field is 40×40, and real fields are much longer than wide; the 40-yd width is realistic for rec 7v7.**

Real 7v7 field sizes (primary sources unless noted):
- **NFL FLAG (2024 rulebook):** 25 × 70 with two 10-yd EZs (Option A) or 25 × 64 with two 7-yd EZs (Option B); midfield line-to-gain; no-run zones 5 yd before midfield and the EZ. [NFL FLAG Rulebook 2024 PDF]
- **USA Flag 5's/7's (v2026.2):** "30 X 70 yards in total with two 10-yard end zones and a 50 yard field of play." (v2025.1 stated **25** × 70.) No-run zones only before the goal line.
- **IFAF 7v7:** "big field **50 x 30 yd**" field of play (plus EZs); national-change range 40–60 yd length × 25–35 yd width. [IFAF 2023]
- **NFHS:** three state-adopted options — **40 yd wide × 100 yd**, **40 × 120 yd**, **53⅓ × 120 yd**, each plus two 10-yd EZs (4th option 53⅓ × 100 in 2026-27). [NFHS rules-change page + field diagrams PDF; option numbers cross-confirmed by coversports guide]
- **College (NCAA/NAIA/NJCAA):** goal lines **80 yd apart**, 10-yd EZs; NCAA one-pager: standard field **80 × 40** + two 10-yd EZs.
- **CIF (CA girls HS):** "40 yards wide by 80 yards long"; width min 30 / max 40 (up to 45); small field 20 × 40.
- **WA state 7v7:** "30-yards wide and a minimum of 50 yards long (plus end zones)".
- **Common rec/tournament 7v7** (secondary): **40-yd playing field + 10-yd EZ**, width 40 (min 30) — MidAmerica 7v7, Texas Power Rankings, Passing Down, Redmond YF. This is the configuration closest to Film Lab.
- **San Diego AYF flag:** 4 zones of 20 yd = 80 yd total (8v8).

**Assessment:** Film Lab's 40-yd width matches the rec-7v7 / CIF width and is within the NFHS range (40). But (a) **no real field is a 40×40 square** — real fields are 70–140 yd long with 10-yd end zones; (b) the model's 40 yd of *downfield* (y ∈ [0,40]) clips at 40 yd, which is short of a full drive on NFL FLAG (50-yd field of play + EZ) and far short of NFHS (100–120 yd); (c) the model **cannot represent a 10-yd end zone, line-to-gain spots (5/10/25 yd), or no-run zones** (5 yd before EZ/midfield), all of which are real y-coordinate features; (d) negative-y backfield has no rulebook limit, but 40 yd of backfield far exceeds any real need (QBs/snappers are 1–7 yd off the LOS). As a *per-play diagramming canvas* the square is a defensible simplification — but it is **not** a real 7v7 field, and a play drawn near the ±40 boundary would be out of bounds on a real 70–140 yd field. If the canvas is meant to be rule-accurate, FIELD_WIDTH≈30–40 and FIELD_DEPTH should reflect a full field (≈50–120 yd downfield + EZ), or the canvas should be re-labeled as "rec-7v7 drill field" rather than any sanctioned field.

### Invariant 5 — roles: offense = qb|c|rb|wr|slot; defense = rusher|lb|db|s

**Conflict: PARTIAL — the role *set* is coaching shorthand (no rulebook forbids or mandates these), but two geometric consequences are illegal under real rules.**

- **Rulebook position vocabulary is generic:** offense = snapper/center, quarterback, and receiver/back — "Any player who does not initiate the snap nor receive the snap is considered an eligible receiver/back" (USA Flag 7's 1-3-1; ADM; IFAF "snapper, runner, receiver"). Defense = blitzer/rusher/defender (IFAF), or just "Blitzer" and "Rusher" (USA Flag 7's). No major rulebook defines "slot", "wr", "rb", "lb", "db", or "s". Film Lab's roles are a modeling vocabulary, and **none are illegal** under any surveyed rule set.
- **Genuine mis-modeling — rusher depth:** every rulebook requires rushers/blitzers to be **≥ 7 yards from the LOS at the snap**:
  - NFL FLAG 13.6: "Blitzers must be 7 yards away from the line of scrimmage at the snap and signal their intention to blitz by raising an arm."
  - USA Flag 7's 4-5-1: "All Blitzers must be a minimum of seven yards behind the line of scrimmage when the ball is snapped and must declare themselves by raising their hand. No more than two players may establish themselves as Blitzers."
  - ADM: "All players who rush the passer must be a minimum of seven yards behind the line of scrimmage when the ball is snapped." (any number may rush)
  - IFAF: blitzer "more than 7 yards away from the scrimmage line at the snap"; max 2 blitzers.
  - CIF 8.3: "A legal rusher must be 7 yards or more from the LOS at the time of the snap."
  - College: rush line 7 yd (per NCAA/SDCFOA).
  Film Lab's `formations.ts` places `rusher`/`rusher2` at **y = 4** (4 yd off the LOS). A play drawn with a 4-yd rusher is **illegal in every surveyed rule set** (illegal rush / illegal blitz penalty). This is the most concrete legality bug in the formation templates.
- **Rusher count:** Film Lab models exactly 2 rushers. That is consistent with the max-2 rules (NFL FLAG 2024/2025 tournaments, USA Flag 7's, IFAF, CIF) and permitted by ADM ("any number"). ✓
- **Center/QB eligibility diverges by rule set** (not a validation issue, but affects play legality): ADM makes the center the **only ineligible player** ("The center is the only ineligible player on the field… ineligible to receive handoffs or catch passes" — ADM positions; "center sneak" banned, ADM running §3a / USA Flag 7's penalty table), whereas USA Flag 7's and NFL FLAG make the center **eligible to go out for passes** ("All players are eligible to receive a pass including the quarterback" — NFL FLAG 12.1; "the center … is eligible to go out for passes" — USA Flag 7's). Film Lab does not validate route/eligibility, so a center-route play is rejected nowhere but would be illegal under ADM.
- **QB run rule:** QB may not run across the LOS in NFL FLAG / USA Flag / ADM / WA, but **may run once per series** in CIF. Film Lab doesn't model run/pass eligibility — no validation conflict, just a rule-set difference a coach must respect.

### Invariant 6 — exactly 5 offensive formations (2x1, 3x1, Bunch, Trips, Empty) and 5 defensive looks (Man 1-rush, Man 2-rush, Cover 2/3/4)

**Conflict: NO for the count; PARTIAL for formation legality under some rule sets.**

- No rulebook mandates or limits the *number* of formation templates — 5+5 is an app-design choice, not a rule. No conflict.
- **Formation legality is target-league-dependent, and Film Lab's templates are illegal under NFHS/CIF rules:**
  - **CIF/NFHS-family:** "Team A must have **4 or more players on the LOS** at the time of the snap" and "at least 1 player on either side of the center" (CIF 5.4.4/5.4.5). Film Lab's offense formations put **3 on the LOS** (center at y=0, wr1, wr2) → **illegal formation** under CIF/NFHS.
  - **USA Flag 7's:** "a minimum of one player on the line of scrimmage (the center) and any number of players on the line of scrimmage. The quarterback must be off the line of scrimmage." → Film Lab templates ✓.
  - **IFAF:** "There is no minimum number of players on the scrimmage line at the snap." → ✓.
  - **ADM:** "Two of those receivers must be on the line of scrimmage at the snap – each positioned on opposite sides of the center," and the other three "at least one yard behind the line of scrimmage in either a slot or running back position"; "No player other than the quarterback may line up within three yards of the center." → Film Lab's 2x1/3x1/Bunch/Trips/Empty have wr1+wr2 on the LOS on opposite sides ✓, slots at y=-2 (1+ yd back) ✓, RB at y=-5 ✓, and no one (other than QB) within 3 yd of center (nearest slot is 10 yd away) ✓.
  - **NFL FLAG:** center on LOS, QB off → ✓.
  - **San Diego AYF (8v8):** "At least five offensive players must be within one yard of the line of scrimmage at the snap" → Film Lab templates (3 on LOS + 2 at y=-2 = 5 within 1 yd) ✓ — but the format is 8v8, so the 7-player count fails.
- **Other rules that would make a modeled play illegal (modeling gaps, not validation conflicts):**
  - **No-run zones:** all major books make runs illegal when the ball is spotted in a no-run zone (NFL FLAG 4.2/10.6, USA Flag 7's 4-2-3, ADM, CIF 7.2). Film Lab doesn't know drive position, so it can neither enforce nor reject this — a "run play" diagrammed from inside a no-run zone is illegal in reality but passes validation. Consider tagging plays (pass/run) and, if drive context is ever modeled, flagging run plays in no-run zones.
  - **ADM no-laterals:** "No laterals of any kind are allowed, including pitches and throwbacks" (ADM running §4) — stricter than NFL FLAG (laterals allowed behind LOS). Not a validation concern.
  - **Neutral zone / offside:** automatic dead-ball foul if any player enters the neutral zone pre-snap (NFL FLAG 9.2, USA Flag 7's R3-1-2). Film Lab's LOS-anchored model should keep defenders off the LOS-side of y=0 at t=0 — the defense templates already do (y≥4). Note this if users ever drag a defender onto y=0 at the snap.

---

## Sources

### Primary (rulebooks / governing-body PDFs, downloaded and read in full where noted)

1. **NFL FLAG — Regular Season Rules 2025** (5v5 flagship), PDF, 19 pp. — https://static.www.nfl.com/image/upload/league/gxtdqh8hcquhezyzssfo.pdf — Sections 3 (game), 4 (field 50×25 + 10-yd EZs), 7 (rosters max 10 / on-field max 5 / min 4), 9 (live ball at snap), 10–12 (running/passing/receiving), 13.6 (blitzers 7 yd), 14 (formations: center on LOS, QB off), 15 (penalties incl. illegal blitz/rush).
2. **USA Flag 5's & USA Flag 7's High School Rulebooks v2026.2** (USA Football), combined PDF — https://resources.usafootball.com/assets/usawebsite/usa-flag-5-s-usa-flag-7-s-combined-rulebooks.pdf — 7's book: Rule 1 Sec 2 (rosters ≥7 / start with 7 / min 4), Sec 3 (positions: center, QB, 5 receivers; blitzer/rusher), Sec 7 (field 30×70 + 10-yd EZs), Rule 4 Sec 5 (blitzer ≥7 yd, max 2), Sec 8 (formations: min 1 on LOS, QB off). Note: the 5's book repeats "seven players on offense" verbatim — an internal copy/paste error in the source document.
3. **USA Flag 7's Rulebook v2025.1** (earlier edition; field stated as **25** × 70) — https://fdm.usafootball.com/docs/default-source/default-document-library/usa-flag-7's-rulebook.pdf
4. **USA Football ADM 7-on-7 Flag Rule Book** (American Development Model), PDF — https://assets.usafootball.com/documents/rookietackle/resources/ADM-7on7-Flag-Rulebook.pdf — Positions (center+QB+5 receivers; 2 receivers on LOS opposite sides; 3-yd center exclusion; center only ineligible), Rushing the Passer (≥7 yd, any number), Running (no laterals; no-run zones), Field diagram.
5. **IFAF Flag Football Rules 2023**, PDF (268 pp.) — https://rules.bafra.info/flag/2023/FlagRules2023.pdf — R 1-1-1 (5v5 "not more than 5"; roster max 15), "Flag 7 on 7 (big field 50 x 30 yd)" section (not more than 7; roster max 20), Dimensions of Fields, R 7-1-4 (blitzer >7 yd, max 2), "no minimum number of players on the scrimmage line at the snap" (p. 14 area).
6. **2025 AYF National Rulebook** (American Youth Football), PDF — https://dt5602vnjxv0c.cloudfront.net/portals/22785/docs/2025ayfrulebook.pdf — FLAG DIVISION section states model flag rules are published at www.MyAYF.com (member-walled); the national book contains no flag *playing* rules (admin only). Actual AYF national flag playing rules were **not accessible** (member login) — see Honesty notes.
7. **NCAA/NAIA/NJCAA Collegiate Flag Football Rules Book 2025-26 and 2026-27** (NAIA), PDF (72 pp.) — https://www.naia.org/wp-content/uploads/2026/06/W-Flag-Football_NAIA-NJCAA-Collegiate-Flag-Football-Rules-Book-2025-26-and-2026-27.pdf — R 1-1-1 ("no more than seven players each… may legally play with fewer"), goal lines 80 yd apart, 10-yd EZs, >7-players substitution foul, max-2 rushers.
8. **CIF Flag Football Rule Book 2024** (California Interscholastic Federation; adopted for CA girls HS flag, NFHS-family), PDF via SDCFOA — https://www.sdcfoa.org/_downloads/cf57e66dd5fbcf8093729b22f5240e99 — field 40×80 (+10-yd EZs; min 30 wide); begin with 7 players; 5.4.4 "4 or more players on the LOS"; 5.4.3 motion/snap rules; 8.3 rushers ≥7 yd; 7.2 no-run zone; 7.3.a ≤3 players within 4 yd of ball in no-run zone; max 2 rushers vs. QB.
9. **NFHS Flag Football Rules Changes — 2026** (official rules-change list) — https://nfhs.org/sports/flag-football/rules — 1-1-3 "Standardized that all teams must start the game with 7 players"; new 4th field option (1-1-2, Table 1-7). The NFHS rulebook itself is a paid publication and was **not** read in full (see Honesty notes).
10. **NFHS Flag Football Field Diagrams 2025-26** (official diagrams), PDF — https://assets.nfhs.org/umbraco/media/7213835/2025-26-nfhs-flag-football-field-diagrams-final.pdf — three field layouts (widths 120'/160'; lengths 240'/300'; 30-ft end zones).
11. **NFHS press releases / coverage of the first rulebook** — https://nfhs.org/stories/first-nfhs-flag-football-rules-book-other-fall-sports-rules-publications-now-available — "features rules governing the **7-on-7** player game, and provides three options for size of the field."
12. **WA State 7v7 Flag Football Rules 2024-25** (Washington Interscholastic Officials, Ralston International), PDF — https://wsifoa.org/wp-content/uploads/2025/02/WAStateFlagRules.pdf — fields 30 wide × min 50 long + EZs; two lines-to-gain; "Teams may play two players down to avoid a forfeit"; blitz line 7 yd; max 2 ROW blitzers; pass-only zones 5 yd before goal lines.
13. **NFL FLAG Rulebook 2024** — https://img1.wsimg.com/blobby/go/77ccfa01-edc4-42a9-9e45-04d13edd89b7/NFL_Flag_Rulebook_2024.pdf and https://cdn.mediavalet.com/usca/rcx/DgBtnnoMFUCXWCBQE3YN2w/DrD-aWDG6UWPBmiG-IkKbQ/Original/NFL%20FLAG%20Rulebook%202024.pdf — field Options A (25×70+10) and B (25×64+7 EZs); no-run zones; max 2 rushers.
14. **NCAA Women's Flag Football 2025** (college flag, mirror), PDF — https://efoa-ny.com/wp-content/uploads/2025/04/College-Flag-Football-Rule-Book-2025-3.48.03-PM-3.48.03-PM-3.48.03-PM-3.48.03-PM-1.pdf — same content as #7.
15. **NFL Play Football — Flag Football Glossary** — https://playfootball.nfl.com/flag/flag-football-glossary/ — definitions of line of scrimmage, backfield, no-run zone, field sizes (NFL FLAG 30 × 70; HS/college 100 × 40).

### Secondary (summaries, officials' associations, league web pages)

16. **nflflag.com — Flag Football Rules** (NFL FLAG operator, RCX Sports) — https://nflflag.com/flag-football-rules — "teams compete **5 on 5**… 6 on 6, 7 on 7, 9 on 9"; "you won't find one standardized rule book across all organizations" for 7v7; field 30 × 70; positions guide (QB, center, WR/RB; rushers + DBs/safety; 7v7/9v9 may have linemen).
17. **San Diego County Football Officials Association — AYF Flag Football Rules 2022** (local AYF chapter doc, Word) — https://www.sdcfoa.org/ayf-flag-football-rules — **8-man** teams; five linemen + three backs; four 20-yd zones; ≥5 offensive players within 1 yd of LOS; no punts/field goals. **Local chapter, not AYF national.**
18. **SDCFOA Weekly Bull — Flag Football 9/18/24** (CA girls-flag officials' bulletin; NFHS/CIF-family) — https://www.sdcfoa.org/information-update-1-16-23/weekly-bull-flag-9-18-24 — "Offense must have at least **4 players on the line of scrimmage** and no more than 3 players in the backfield"; bunch-formation / no-run-zone notes.
19. **coversports.com — Flag Football Field Dimensions: 5v5, 7v7 & Youth** (2025) — https://coversports.com/resources/field-guides/flag-football-dimensions-guide — 7v7 field table (NFHS options; Texans USAFB 30×70; USA Football ADM varies); "5-on-5 is the Olympic and NFL FLAG standard; 7-on-7 is now the NFHS high school standard"; youth fields 50–70 × 25–30.
20. **sportsdestinations.com — Need Details on the New NFHS Flag Football Rules?** (2025) — https://www.sportsdestinations.com/sports/football/need-details-new-nfhs-flag-football-rules-here-36237 — NFHS field configs "120 ft wide × 240 ft long; 120 × 300; 160 × 300" with two 30-ft EZs. **Note:** conflicts with coversports on Option 1 length (80 yd vs 100 yd playing field) — see Honesty notes.
21. **on3.com — NFHS releases first rules publication for girls flag football** (2025) — https://www.on3.com/high-school/news/nfhs-releases-first-rules-publication-for-girls-flag-football/ — 7v7, four 12-minute quarters, three field options incl. regulation 11-man field.
22. **NCAA Flag Football one-pager** — https://ncaaorg.s3.amazonaws.com/inclusion/emsports/INC_FlagFootballOnePager.pdf — "7-on-7 format"; "standard field is **80x40 yards** plus two 10-yard endzones"; 20-yard first-down lines.
23. **MidAmerica 7v7 — Rules** — https://www.midamerica7v7.org/blog/rules/ — 40-yd playing field + 10-yd EZ; width min 40 (30 for girls variant https://www.midamerica7v7.org/blog/girlsflag/).
24. **Texas Power Rankings — 7v7 Tournament Rules** — https://texaspowerrankings.com/7v7-tournament-rules — "Field will be 40 yards in length. 10 yard deep End Zone."
25. **Passing Down Girls Flag Rules** — https://www.passingdown.com/uploads/2/1/4/7/21472998/passing_down_girls_flag_rules.docx-3.pdf — 40-yd field + 10-yd EZ; width 40–55.
26. **Redmond Youth Football — 7v7 Rules** — https://www.redmondyouthfootball.org/Default.aspx?tabid=1025515 — 50-yd field (40-yd playing field + 10-yd EZ).
27. **Play NFL Flag (nfl.com)** — https://www.nfl.com/news/play-nfl-flag — NFL Flag is "5-a-side"; basic rules (7-second clock, blitzer ≥7 yd with arm raised, 1 player may motion laterally/backwards, QB may not run beyond LOS).
28. **USA Football — Flag Football Rules & Rulebooks** — https://usafootball.com/national-team/rules — IFAF rules govern international/Olympic competition; USA FLAG 7's mirrors the 5's book "with adjustments made for the additional two players."
29. **NFL FLAG Tournament Rule Changes** — https://nflflag.com/events/rules/important-rule-changes — "School/grade based 7U and 6U: The defensive 5-yard alignment cushion…" (bump-zone analogue at young ages).
30. **Scribd — AYF Flag and Touch Football Rules** (copy of older AYF flag doc) — https://www.scribd.com/document/146484437/ncdrtc-bx — "Teams consist of **8 players**." (Secondary/uncorroborated.)

---

## Honesty notes (what could not be verified)

- **AYF national flag playing rules are behind a member wall** (www.MyAYF.com). The AYF National Rulebook contains only administrative flag-division text and points to MyAYF.com for model playing rules. I verified AYF flag only via (a) the national rulebook's own delegation text and (b) a **local** San Diego AYF chapter document (8v8) and an older Scribd copy (8 players). **The current national AYF flag format (5v5/7v7/8v8) could not be confirmed from a primary source** — treat any AYF-specific claim as unverified beyond "AYF runs a flag program and publishes model rules on MyAYF.com."
- **The NFHS Flag Football Rules Book (2025-26 and 2026-27) is a paid publication and was not read.** NFHS-derived claims rest on the official rules-change list, official field diagrams, NFHS press releases, and the CIF rulebook (a state adoption). The "≥4 on the LOS" formation rule is confirmed in CIF (primary) and SDCFOA officials' bulletins (secondary) but was **not** verified from the NFHS text itself; NFHS books may vary the formation rule by state adoption.
- **NFHS field Option 1 length is ambiguous across sources:** NFHS's own diagram + sportsdestinations read it as **80-yd playing field (240 ft)**, while coversports lists it as a **100-yd playing field**. I did not resolve this discrepancy from a single authoritative source; the report uses "40 yd wide × 80–100 yd" for Option 1 and the 120-yd option for Option 2.
- **USA Flag 5's/7's field width changed between editions:** v2025.1 states **25** × 70; v2026.2 states **30** × 70 (for both the 5's and 7's books). The 2026.2 number is used in the verdict table, with the earlier value noted.
- **Rusher-count rule is inconsistent across books:** max 2 in NFL FLAG / USA Flag 7's / IFAF / CIF; "any number" in ADM; "no limit on the number of rushing attempts" (not rushers) in CIF. Film Lab's fixed 2-rusher defense is within every surveyed envelope.
- **No-run-zone and drive-position modeling** were treated as out of scope for the six invariants (they are not enforced by `validatePlay`), but they are the two rule features most likely to make a *modeled* play illegal in reality.

## Files consulted (Film Lab)

- `src/engine/validate.ts` — `validatePlay` (7+7, t=0 anchor, sorted waypoints, field bounds), `validateFormation` (7 players, role whitelists).
- `src/engine/geometry.ts` — `FIELD_WIDTH=40`, `FIELD_DEPTH=40`, `LINE_OF_SCRIMMAGE_Y=0`.
- `src/engine/types.ts` — `OffenseRole='qb'|'c'|'rb'|'wr'|'slot'`, `DefenseRole='rusher'|'lb'|'db'|'s'`.
- `src/data/formations.ts` — 5 offense formations (2x1, 3x1, Bunch, Trips, Empty) and 5 defense looks (Man 1-rush, Man 2-rush, Cover 2/3/4); defense rushers at y=4, lb at y=8, db at y=14, s at y=20; offense c/wr at y=0, qb/rb at y=-5, slots at y=-2.