import { GreathelmKnight, MercenaryCompany, StandingDoctrine } from '../schema/worldSchema';

/**
 * Greathelm plays on an A4 / US Letter footprint (11.0" wide x 8.5" deep).
 * We model coordinates in inches: X in [0.6 .. 10.4], Y in [0.6 .. 7.9].
 * Base radius of a 28mm/32mm knight is ~0.45". Base-contact / melee reach is 1.25".
 */
export const ARENA_WIDTH_INCHES = 11.0;
export const ARENA_HEIGHT_INCHES = 8.5;
export const MELEE_RANGE_INCHES = 1.45;

export interface ArenaKnightState {
  id: string;
  side: 'CHRISTIAN' | 'HUNTER';
  name: string;
  title: string;
  role: GreathelmKnight['role'];
  weapon: string;
  armorRating: number;
  maxWounds: number;
  wounds: number;
  clashSkill: number;
  bashBonus: number;
  x: number;
  y: number;
  momentum: number; // 0, 1, or 2 tokens
  activatedThisRound: boolean;
  downed: boolean;
  downedOutcome?: 'BATTERED_ARMOR' | 'SCARRED_VENDETTA' | 'CAPTURED_RANSOM';
}

export interface InitiativeDie {
  id: string;
  side: 'CHRISTIAN' | 'HUNTER';
  value: number; // 1..6
  spent: boolean;
}

export interface ReplayStep {
  stepIndex: number;
  round: number;
  actorSide: 'CHRISTIAN' | 'HUNTER' | 'SYSTEM';
  actorId?: string;
  targetId?: string;
  dieSpent?: number;
  actionType:
    | 'ROUND_START'
    | 'SPRINT_ENCIRCLE'
    | 'TACTICAL_SHIFT'
    | 'SHIELD_BASH'
    | 'LIGHT_CLASH'
    | 'HEAVY_CLASH_EXECUTE'
    | 'HAZARD_RING_OUT'
    | 'DOCTRINE_WITHDRAWAL'
    | 'BATTLE_END';
  fromPos?: { x: number; y: number };
  toPos?: { x: number; y: number };
  targetFromPos?: { x: number; y: number };
  targetToPos?: { x: number; y: number };
  headline: string;
  detail: string;
  floatingText?: string;
  knightsSnapshot: ArenaKnightState[];
  christianDiceSnapshot: InitiativeDie[];
  hunterDiceSnapshot: InitiativeDie[];
}

export interface PostBattleCasualtyReport {
  knightId: string;
  knightName: string;
  side: 'CHRISTIAN' | 'HUNTER';
  roll: number;
  outcomeTitle: string;
  mechanicalEffect: string;
  ransomCrowns?: number;
}

export interface GreathelmSimulationResult {
  winner: 'CHRISTIAN' | 'HUNTER' | 'DRAW';
  winReason: string;
  roundsFought: number;
  steps: ReplayStep[];
  casualtyReports: PostBattleCasualtyReport[];
  prestigeDeltaChristian: number;
  prestigeDeltaHunter: number;
}

function getFormationCoords(
  side: 'CHRISTIAN' | 'HUNTER',
  formation: StandingDoctrine['formation'],
  index: number
): { x: number; y: number } {
  const isLeft = side === 'CHRISTIAN';
  const baseX = isLeft ? 2.1 : 8.9;
  const dir = isLeft ? 1 : -1;

  switch (formation) {
    case 'SHIELDWALL': {
      const yOffsets = [1.8, 2.75, 3.7, 4.65, 5.6, 6.55];
      const xStagger = index % 2 === 0 ? 0.25 * dir : -0.15 * dir;
      return { x: baseX + xStagger, y: yOffsets[index] };
    }
    case 'FLYING_WEDGE': {
      // Spearhead aimed at the bridge center (Y = 4.25)
      const wedgeOffsets = [
        { dx: 0.9, y: 4.25 }, // Captain at tip
        { dx: 0.35, y: 3.4 },
        { dx: 0.35, y: 5.1 },
        { dx: -0.2, y: 2.55 },
        { dx: -0.2, y: 5.95 },
        { dx: -0.45, y: 4.25 },
      ];
      const o = wedgeOffsets[index];
      return { x: baseX + o.dx * dir, y: o.y };
    }
    case 'REFUSED_FLANK': {
      const yOffsets = [1.5, 2.3, 3.1, 4.4, 5.8, 6.9];
      const dx = index < 3 ? 0.65 * dir : -0.5 * dir;
      return { x: baseX + dx, y: yOffsets[index] };
    }
    case 'ENVELOPMENT':
    default: {
      const yOffsets = [1.25, 2.15, 3.65, 4.85, 6.35, 7.25];
      const dx = index === 0 || index === 5 ? 0.85 * dir : -0.1 * dir;
      return { x: baseX + dx, y: yOffsets[index] };
    }
  }
}

export function createInitialArenaKnights(
  christian: MercenaryCompany,
  hunter: MercenaryCompany
): ArenaKnightState[] {
  const chrKnights: ArenaKnightState[] = christian.lanceRoster.map((k, idx) => {
    const pos = getFormationCoords('CHRISTIAN', christian.doctrine.formation, idx);
    return {
      id: k.id,
      side: 'CHRISTIAN',
      name: k.name,
      title: k.title,
      role: k.role,
      weapon: k.weapon,
      armorRating: k.armorRating,
      maxWounds: k.maxWounds,
      wounds: k.currentWounds,
      clashSkill: k.clashSkill,
      bashBonus: k.bashBonus,
      x: pos.x,
      y: pos.y,
      momentum: k.role === 'CHAMPION' ? 1 : 0,
      activatedThisRound: false,
      downed: false,
    };
  });

  const hunKnights: ArenaKnightState[] = hunter.lanceRoster.map((k, idx) => {
    const pos = getFormationCoords('HUNTER', hunter.doctrine.formation, idx);
    return {
      id: k.id,
      side: 'HUNTER',
      name: k.name,
      title: k.title,
      role: k.role,
      weapon: k.weapon,
      armorRating: k.armorRating,
      maxWounds: k.maxWounds,
      wounds: k.currentWounds,
      clashSkill: k.clashSkill,
      bashBonus: k.bashBonus,
      x: pos.x,
      y: pos.y,
      momentum: k.role === 'CHAMPION' ? 1 : 0,
      activatedThisRound: false,
      downed: false,
    };
  });

  return [...chrKnights, ...hunKnights];
}

export function distanceInches(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Checks if a coordinate falls into the deep Blackwater River channels on either side of the central stone bridge.
 * Bridge spans X in [4.2 .. 6.8], safe roadway Y in [2.35 .. 6.15].
 * Above Y < 2.1 or below Y > 6.4 within the river band [4.55 .. 6.45] is deep river water!
 */
export function isRiverHazard(x: number, y: number): boolean {
  const inRiverChannelX = x >= 4.65 && x <= 6.35;
  const offBridgeY = y < 2.05 || y > 6.45;
  return inRiverChannelX && offBridgeY;
}

function cloneKnights(knights: ArenaKnightState[]): ArenaKnightState[] {
  return knights.map((k) => ({ ...k }));
}

function cloneDice(dice: InitiativeDie[]): InitiativeDie[] {
  return dice.map((d) => ({ ...d }));
}

/**
 * Deterministic PRNG so replays are repeatable or varied by seed
 */
function createSeededRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function rollInitiativePool(
  side: 'CHRISTIAN' | 'HUNTER',
  activeCount: number,
  rng: () => number = Math.random
): InitiativeDie[] {
  const dice: InitiativeDie[] = [];
  for (let i = 0; i < activeCount; i++) {
    const val = Math.floor(rng() * 6) + 1;
    dice.push({
      id: `${side}-d-${i}-${ Math.floor(rng() * 9999) }`,
      side,
      value: val,
      spent: false,
    });
  }
  // Greathelm groups initiative dice from 6s down to 1s
  return dice.sort((a, b) => b.value - a.value);
}

function selectTargetByDoctrine(
  actor: ArenaKnightState,
  enemies: ArenaKnightState[],
  doctrine: StandingDoctrine
): ArenaKnightState {
  const activeEnemies = enemies.filter((e) => !e.downed);
  if (activeEnemies.length === 0) return enemies[0];

  const sorted = [...activeEnemies].sort((a, b) => {
    const distA = distanceInches(actor, a);
    const distB = distanceInches(actor, b);

    if (doctrine.targetFocus === 'ENEMY_CAPTAIN_VIP') {
      const vipScoreA = a.role === 'CAPTAIN' || a.role === 'BANNERMAN' ? -2.2 : 0;
      const vipScoreB = b.role === 'CAPTAIN' || b.role === 'BANNERMAN' ? -2.2 : 0;
      return distA + vipScoreA - (distB + vipScoreB);
    }
    if (doctrine.targetFocus === 'WEAKEST_WOUNDED_KNIGHT') {
      return a.wounds * 1.5 + distA - (b.wounds * 1.5 + distB);
    }
    // ISOLATED_FLANKER: prefer enemies near river banks (top/bottom Y)
    const edgeDistA = Math.min(a.y, ARENA_HEIGHT_INCHES - a.y);
    const edgeDistB = Math.min(b.y, ARENA_HEIGHT_INCHES - b.y);
    return distA + edgeDistA * 0.5 - (distB + edgeDistB * 0.5);
  });

  return sorted[0];
}

function checkDoctrineRetreat(
  side: 'CHRISTIAN' | 'HUNTER',
  knights: ArenaKnightState[],
  doctrine: StandingDoctrine
): boolean {
  const downedCount = knights.filter((k) => k.side === side && k.downed).length;
  if (doctrine.retreatThreshold === 'WITHDRAW_AT_2_DOWNED' && downedCount >= 2) {
    return true;
  }
  if (doctrine.retreatThreshold === 'WITHDRAW_AT_3_DOWNED' && downedCount >= 3) {
    return true;
  }
  return false;
}

/**
 * Runs a complete Greathelm 6v6 skirmish governed by Christian & Hunter's Standing Tactical Doctrines
 * and outputs every frame for the 60-second animated Replay Viewer.
 */
export function simulateDoctrineGreathelmBattle(
  christian: MercenaryCompany,
  hunter: MercenaryCompany,
  seed: number = Date.now()
): GreathelmSimulationResult {
  const rng = createSeededRng(seed);
  const rollD6 = () => Math.floor(rng() * 6) + 1;

  const knights = createInitialArenaKnights(christian, hunter);
  const steps: ReplayStep[] = [];
  let stepCounter = 0;

  let winner: 'CHRISTIAN' | 'HUNTER' | 'DRAW' = 'DRAW';
  let winReason = '';
  let roundsFought = 0;

  for (let round = 1; round <= 4; round++) {
    roundsFought = round;
    knights.forEach((k) => {
      if (!k.downed) k.activatedThisRound = false;
    });

    const chrActive = knights.filter((k) => k.side === 'CHRISTIAN' && !k.downed).length;
    const hunActive = knights.filter((k) => k.side === 'HUNTER' && !k.downed).length;

    const chrDice = rollInitiativePool('CHRISTIAN', chrActive, rng);
    const hunDice = rollInitiativePool('HUNTER', hunActive, rng);

    steps.push({
      stepIndex: stepCounter++,
      round,
      actorSide: 'SYSTEM',
      actionType: 'ROUND_START',
      headline: `Round ${round} — Initiative Dice Pools Rolled`,
      detail: `Iron Vultures rolled [${chrDice.map((d) => d.value).join(', ')}] vs. Red Lance [${hunDice.map((d) => d.value).join(', ')}]. Higher sets seize the initiative!`,
      floatingText: `ROUND ${round}`,
      knightsSnapshot: cloneKnights(knights),
      christianDiceSnapshot: cloneDice(chrDice),
      hunterDiceSnapshot: cloneDice(hunDice),
    });

    // Determine who activates first based on highest unspent die
    let turnGuard = 0;
    while (
      (chrDice.some((d) => !d.spent) || hunDice.some((d) => !d.spent)) &&
      turnGuard < 16
    ) {
      turnGuard++;

      // Check Mercenary Retreat Thresholds before next activation
      if (checkDoctrineRetreat('CHRISTIAN', knights, christian.doctrine)) {
        winner = 'HUNTER';
        winReason = `Christian's Captain sounded the horn under [${christian.doctrine.retreatThreshold}] Doctrine after 2 knights fell, preserving the company roster!`;
        steps.push({
          stepIndex: stepCounter++,
          round,
          actorSide: 'CHRISTIAN',
          actionType: 'DOCTRINE_WITHDRAWAL',
          headline: 'Iron Vultures Sound Tactical Withdrawal!',
          detail: winReason,
          floatingText: 'HORN SOUNDED — RETREAT!',
          knightsSnapshot: cloneKnights(knights),
          christianDiceSnapshot: cloneDice(chrDice),
          hunterDiceSnapshot: cloneDice(hunDice),
        });
        break;
      }

      if (checkDoctrineRetreat('HUNTER', knights, hunter.doctrine)) {
        winner = 'CHRISTIAN';
        winReason = `Hunter's Captain sounded the horn under [${hunter.doctrine.retreatThreshold}] Doctrine after 2 knights fell, saving his veterans for tomorrow!`;
        steps.push({
          stepIndex: stepCounter++,
          round,
          actorSide: 'HUNTER',
          actionType: 'DOCTRINE_WITHDRAWAL',
          headline: 'The Red Lance Withdraws in Good Order!',
          detail: winReason,
          floatingText: 'RETREAT ORDER!',
          knightsSnapshot: cloneKnights(knights),
          christianDiceSnapshot: cloneDice(chrDice),
          hunterDiceSnapshot: cloneDice(hunDice),
        });
        break;
      }

      const nextChrDie = chrDice.find((d) => !d.spent);
      const nextHunDie = hunDice.find((d) => !d.spent);

      let activeSide: 'CHRISTIAN' | 'HUNTER';
      if (nextChrDie && nextHunDie) {
        if (nextChrDie.value > nextHunDie.value) {
          activeSide = 'CHRISTIAN';
        } else if (nextHunDie.value > nextChrDie.value) {
          activeSide = 'HUNTER';
        } else {
          activeSide = turnGuard % 2 === 1 ? 'CHRISTIAN' : 'HUNTER';
        }
      } else if (nextChrDie) {
        activeSide = 'CHRISTIAN';
      } else {
        activeSide = 'HUNTER';
      }

      const die = (activeSide === 'CHRISTIAN' ? nextChrDie : nextHunDie)!;
      die.spent = true;

      const doctrine = activeSide === 'CHRISTIAN' ? christian.doctrine : hunter.doctrine;
      const readyKnights = knights.filter(
        (k) => k.side === activeSide && !k.downed && !k.activatedThisRound
      );
      const fallbackKnights = knights.filter((k) => k.side === activeSide && !k.downed);
      const pool = readyKnights.length > 0 ? readyKnights : fallbackKnights;
      if (pool.length === 0) break;

      const enemies = knights.filter((k) => k.side !== activeSide && !k.downed);
      if (enemies.length === 0) break;

      // Pick the knight best positioned for the die value
      const actor = pool.sort((a, b) => {
        const minDistA = Math.min(...enemies.map((e) => distanceInches(a, e)));
        const minDistB = Math.min(...enemies.map((e) => distanceInches(b, e)));
        return minDistA - minDistB;
      })[0];

      actor.activatedThisRound = true;
      const target = selectTargetByDoctrine(actor, enemies, doctrine);
      const dist = distanceInches(actor, target);
      const fromPos = { x: actor.x, y: actor.y };

      if (dist > MELEE_RANGE_INCHES) {
        // Need to close distance onto the Red Ford bridge!
        const isSprint = die.value >= 3;
        const moveAllowance = isSprint ? 2.65 : 1.55;
        const stepDist = Math.min(moveAllowance, Math.max(0.2, dist - 0.95));
        const angle = Math.atan2(target.y - actor.y, target.x - actor.x);

        let nextX = actor.x + Math.cos(angle) * stepDist;
        let nextY = actor.y + Math.sin(angle) * stepDist;
        // Funnel across the stone bridge if crossing the river channel
        if (nextX >= 4.4 && nextX <= 6.6) {
          nextY = Math.max(2.35, Math.min(6.15, nextY));
        }
        actor.x = Number(nextX.toFixed(2));
        actor.y = Number(nextY.toFixed(2));

        if (isSprint) {
          actor.momentum = Math.min(2, actor.momentum + 1);
        }

        const newDist = distanceInches(actor, target);
        // If Sprint + High Die (5-6) brought us into base contact, trigger Momentum Charge Clash!
        if (newDist <= MELEE_RANGE_INCHES && die.value >= 5) {
          const atkRoll = rollD6() + actor.clashSkill + actor.momentum;
          const defRoll = rollD6() + target.armorRating - 1;
          const dmg = atkRoll >= defRoll ? (die.value === 6 ? 2 : 1) : 0;
          if (dmg > 0) {
            target.wounds = Math.max(0, target.wounds - dmg);
            if (target.wounds === 0) target.downed = true;
          }
          steps.push({
            stepIndex: stepCounter++,
            round,
            actorSide: activeSide,
            actorId: actor.id,
            targetId: target.id,
            dieSpent: die.value,
            actionType: 'HEAVY_CLASH_EXECUTE',
            fromPos,
            toPos: { x: actor.x, y: actor.y },
            headline: `${actor.name} Executes a Momentum Charge! (Die [${die.value}])`,
            detail: `${actor.name} sprinted into base contact with ${target.name} (+1 Momentum) and clashed (${atkRoll} vs ${defRoll}) → ${
              dmg > 0
                ? `${dmg} Wound(s) dealt! ${target.downed ? `${target.name} is DOWNED!` : ''}`
                : `Parried off ${target.name}'s plate!`
            }`,
            floatingText: dmg > 0 ? `-${dmg} WOUND! (${actor.weapon})` : 'CLANG! PARRIED',
            knightsSnapshot: cloneKnights(knights),
            christianDiceSnapshot: cloneDice(chrDice),
            hunterDiceSnapshot: cloneDice(hunDice),
          });
        } else {
          steps.push({
            stepIndex: stepCounter++,
            round,
            actorSide: activeSide,
            actorId: actor.id,
            targetId: target.id,
            dieSpent: die.value,
            actionType: isSprint ? 'SPRINT_ENCIRCLE' : 'Tactical_SHIFT' as any,
            fromPos,
            toPos: { x: actor.x, y: actor.y },
            headline: `${actor.name} ${isSprint ? 'Sprints & Gains Momentum' : 'Shifts Position'} (Die [${die.value}])`,
            detail: `${actor.name} advances toward ${target.name} on the bridge${
              isSprint ? ' and gains a Momentum Token.' : '.'
            }`,
            floatingText: isSprint ? '+1 MOMENTUM' : 'SHIFT',
            knightsSnapshot: cloneKnights(knights),
            christianDiceSnapshot: cloneDice(chrDice),
            hunterDiceSnapshot: cloneDice(hunDice),
          });
        }
      } else {
        // Already in melee base contact! Choose Bash vs Light Clash vs Heavy Clash based on die & Doctrine
        const preferBash =
          (die.value <= 2 && doctrine.lowDicePriority === 'SHIELD_BASH_STRIP_MOMENTUM') ||
          target.momentum >= 2 ||
          (target.x >= 4.5 && target.x <= 6.5 && (target.y < 2.8 || target.y > 5.7));

        if (preferBash) {
          const targetFrom = { x: target.x, y: target.y };
          const pushDist = 1.15 + actor.bashBonus * 0.35;
          const pushAngle = Math.atan2(target.y - actor.y, target.x - actor.x);
          target.x = Number(
            Math.max(0.5, Math.min(10.5, target.x + Math.cos(pushAngle) * pushDist)).toFixed(2)
          );
          target.y = Number(
            Math.max(0.5, Math.min(8.0, target.y + Math.sin(pushAngle) * pushDist)).toFixed(2)
          );
          const stripped = target.momentum;
          target.momentum = 0;

          const plungedIntoRiver = isRiverHazard(target.x, target.y);
          if (plungedIntoRiver) {
            target.wounds = 0;
            target.downed = true;
            target.downedOutcome = 'CAPTURED_RANSOM';
          }

          steps.push({
            stepIndex: stepCounter++,
            round,
            actorSide: activeSide,
            actorId: actor.id,
            targetId: target.id,
            dieSpent: die.value,
            actionType: plungedIntoRiver ? 'HAZARD_RING_OUT' : 'SHIELD_BASH',
            fromPos,
            toPos: { x: actor.x, y: actor.y },
            targetFromPos: targetFrom,
            targetToPos: { x: target.x, y: target.y },
            headline: plungedIntoRiver
              ? `${actor.name} Bashes ${target.name} Off Red Ford Bridge!`
              : `${actor.name} Shield-Bashes ${target.name} (Die [${die.value}])`,
            detail: plungedIntoRiver
              ? `${target.name} is hurled over the stone parapet into the Blackwater River! Dragged ashore alive for Ransom!`
              : `Pushed ${target.name} back ${pushDist.toFixed(1)}" and stripped ${stripped} Momentum token(s).`,
            floatingText: plungedIntoRiver ? 'SPLASH! BRIDGE RING-OUT!' : 'BASH! -MOMENTUM',
            knightsSnapshot: cloneKnights(knights),
            christianDiceSnapshot: cloneDice(chrDice),
            hunterDiceSnapshot: cloneDice(hunDice),
          });
        } else {
          // Melee Clash!
          const isHeavy = die.value >= 5 || actor.momentum >= 1;
          const momentumBonus = actor.momentum;
          const atkRoll = rollD6() + actor.clashSkill + momentumBonus + (isHeavy ? 1 : 0);
          const defRoll = rollD6() + target.armorRating;
          if (isHeavy && actor.momentum > 0) {
            actor.momentum = Math.max(0, actor.momentum - 1);
          }

          let dmg = 0;
          if (atkRoll > defRoll + 2) {
            dmg = 2;
          } else if (atkRoll >= defRoll) {
            dmg = 1;
          }

          if (dmg > 0) {
            target.wounds = Math.max(0, target.wounds - dmg);
            if (target.wounds === 0) target.downed = true;
          } else {
            // Glancing blow pushes defender slightly
            actor.momentum = Math.min(2, actor.momentum + 1);
          }

          steps.push({
            stepIndex: stepCounter++,
            round,
            actorSide: activeSide,
            actorId: actor.id,
            targetId: target.id,
            dieSpent: die.value,
            actionType: isHeavy ? 'HEAVY_CLASH_EXECUTE' : 'LIGHT_CLASH',
            fromPos,
            toPos: { x: actor.x, y: actor.y },
            headline: `${actor.name} Clashes with ${target.name} (Die [${die.value}])`,
            detail: `${isHeavy ? 'Heavy Pollaxe/Blade Clash' : 'Quick Clash'} (${atkRoll} vs Armor ${defRoll}): ${
              dmg > 0
                ? `Cracks plate for ${dmg} Wound(s)! ${
                    target.downed ? `${target.name} crashes to the cobbles!` : ''
                  }`
                : `${target.name} turns the blow on his shield!`
            }`,
            floatingText:
              dmg > 0
                ? `${target.downed ? 'KNIGHT DOWN!' : `-${dmg} WOUND!`}`
                : 'DEFLECTED!',
            knightsSnapshot: cloneKnights(knights),
            christianDiceSnapshot: cloneDice(chrDice),
            hunterDiceSnapshot: cloneDice(hunDice),
          });
        }
      }
    }

    if (winner !== 'DRAW') break;
  }

  const chrStanding = knights.filter((k) => k.side === 'CHRISTIAN' && !k.downed).length;
  const hunStanding = knights.filter((k) => k.side === 'HUNTER' && !k.downed).length;

  if (winner === 'DRAW') {
    if (chrStanding > hunStanding) {
      winner = 'CHRISTIAN';
      winReason = `Iron Vultures hold the Red Ford bridgehead (${chrStanding} knights standing vs. ${hunStanding}). Magistrate Corvo crosses safely!`;
    } else if (hunStanding > chrStanding) {
      winner = 'HUNTER';
      winReason = `The Red Lance seizes the bridgehead (${hunStanding} knights standing vs. ${chrStanding}) and captures the Salt Tariff Ledger!`;
    } else {
      winner = 'CHRISTIAN';
      winReason = `Bloody stalemate on the bridge (${chrStanding}v${hunStanding}), but Christian's escort pushes Magistrate Corvo across under shieldwall cover!`;
    }
  }

  // Roll on the Chivalric Post-Battle Injury & Ransom Table for every downed knight
  const casualtyReports: PostBattleCasualtyReport[] = knights
    .filter((k) => k.downed)
    .map((k) => {
      const roll = k.downedOutcome === 'CAPTURED_RANSOM' ? 5 : (Math.floor(rng() * 5) + 1);
      if (roll <= 2) {
        return {
          knightId: k.id,
          knightName: k.name,
          side: k.side,
          roll,
          outcomeTitle: 'Battered Plate & Concussion',
          mechanicalEffect: 'Survives! Armor needs 45c smithing repair before tomorrow’s tick.',
        };
      } else if (roll <= 4) {
        return {
          knightId: k.id,
          knightName: k.name,
          side: k.side,
          roll,
          outcomeTitle: 'Bloodied Visor — Swears Vendetta!',
          mechanicalEffect:
            'Survives with a Scar! Gains [+1 Clash Skill] when fighting the rival company next time.',
        };
      } else {
        return {
          knightId: k.id,
          knightName: k.name,
          side: k.side,
          roll,
          outcomeTitle: 'Captured Alive for Chivalric Ransom!',
          mechanicalEffect:
            'Held in rival pavilion. Captor can demand 180 Crowns or a 2-Day Non-Aggression Writ.',
          ransomCrowns: 180,
        };
      }
    });

  steps.push({
    stepIndex: stepCounter++,
    round: roundsFought,
    actorSide: 'SYSTEM',
    actionType: 'BATTLE_END',
    headline: `Skirmish Resolved — ${
      winner === 'CHRISTIAN' ? 'The Iron Vultures Prevail!' : 'The Red Lance Triumphs!'
    }`,
    detail: winReason,
    floatingText: winner === 'CHRISTIAN' ? 'IRON VULTURES VICTORY' : 'RED LANCE VICTORY',
    knightsSnapshot: cloneKnights(knights),
    christianDiceSnapshot: [],
    hunterDiceSnapshot: [],
  });

  return {
    winner,
    winReason,
    roundsFought,
    steps,
    casualtyReports,
    prestigeDeltaChristian: winner === 'CHRISTIAN' ? 3 : 1,
    prestigeDeltaHunter: winner === 'HUNTER' ? 3 : 1,
  };
}
