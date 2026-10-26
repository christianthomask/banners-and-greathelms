import React, { useEffect, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Dices,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import {
  ArenaKnightState,
  createInitialArenaKnights,
  distanceInches,
  GreathelmSimulationResult,
  InitiativeDie,
  isRiverHazard,
  MELEE_RANGE_INCHES,
  rollInitiativePool,
} from '../engine/greathelmEngine';
import { MercenaryCompany, StandingDoctrine } from '../schema/worldSchema';
import { soundEngine } from '../utils/soundEngine';
import { DetailedKnightPuppet } from './GreathelmPuppetRenderer';

interface GreathelmArenaViewProps {
  christian: MercenaryCompany;
  hunter: MercenaryCompany;
  lastSimulation: GreathelmSimulationResult;
  onUpdateDoctrine: (
    companyKey: 'christian' | 'hunter',
    doctrine: StandingDoctrine
  ) => void;
  onRunNewSimulation: (seed?: number) => void;
  onCommitBattleToLedger: (sim: GreathelmSimulationResult) => void;
}

const KNIGHT_PORTRAITS: Record<string, string> = {
  'chr-k1': '/assets/portrait-k1.webp',
  'chr-k2': '/assets/portrait-k2.webp',
  'chr-k3': '/assets/portrait-k3.webp',
  'chr-k4': '/assets/portrait-k4.webp',
  'chr-k5': '/assets/portrait-k5.webp',
  'chr-k6': '/assets/portrait-k6.webp',
  'hun-k1': '/assets/portrait-captured-rival.webp',
  'hun-k2': '/assets/portrait-k2.webp',
  'hun-k3': '/assets/portrait-k3.webp',
  'hun-k4': '/assets/portrait-k4.webp',
  'hun-k5': '/assets/portrait-k5.webp',
  'hun-k6': '/assets/portrait-k6.webp',
};

// Map 11.0" x 8.5" tabletop inches onto the 1536x880 Widescreen 2.5D Red Ford Stone Bridge Diorama
function mapDioramaX(xInches: number): number {
  return Math.round(135 + (xInches / 11.0) * 1266);
}

function mapDioramaY(yInches: number): number {
  if (yInches < 2.15) {
    // North river hazard channel above top parapet
    return Math.round(115 + (Math.max(0.3, yInches) / 2.15) * 115);
  }
  if (yInches > 6.35) {
    // South river hazard channel below bottom parapet
    return Math.round(585 + (Math.min(2.15, yInches - 6.35) / 2.15) * 145);
  }
  // Safe cobbled bridge roadway (yInches 2.15 .. 6.35 -> yPixels 265 .. 535)
  return Math.round(265 + ((yInches - 2.15) / 4.2) * 270);
}

export const GreathelmArenaView: React.FC<GreathelmArenaViewProps> = ({
  christian,
  hunter,
  lastSimulation,
  onUpdateDoctrine,
  onRunNewSimulation,
  onCommitBattleToLedger,
}) => {
  const [arenaMode, setArenaMode] = useState<'REPLAY_DOCTRINE' | 'LIVE_PLAY'>(
    'REPLAY_DOCTRINE'
  );

  // REPLAY MODE STATE
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedKnightId, setSelectedKnightId] = useState<string>('chr-k1');

  // LIVE PLAY MODE STATE
  const [liveRound, setLiveRound] = useState<number>(1);
  const [liveKnights, setLiveKnights] = useState<ArenaKnightState[]>(() =>
    createInitialArenaKnights(christian, hunter)
  );
  const [liveChrDice, setLiveChrDice] = useState<InitiativeDie[]>(() =>
    rollInitiativePool('CHRISTIAN', 6)
  );
  const [liveHunDice, setLiveHunDice] = useState<InitiativeDie[]>(() =>
    rollInitiativePool('HUNTER', 6)
  );
  const [selectedLiveDieId, setSelectedLiveDieId] = useState<string | null>(null);
  const [liveBannerLog, setLiveBannerLog] = useState<string>(
    'Live Greathelm Mode: Select an unspent Initiative Die (6s down to 1s) in the bottom tray, click a Knight on the bridge, and command an action!'
  );

  useEffect(() => {
    setStepIdx(0);
    setIsPlaying(false);
  }, [lastSimulation]);

  const currentStep =
    lastSimulation.steps[Math.min(stepIdx, lastSimulation.steps.length - 1)] ||
    lastSimulation.steps[0];

  // Trigger procedural medieval combat foley when replay step advances
  useEffect(() => {
    if (arenaMode !== 'REPLAY_DOCTRINE' || stepIdx === 0) return;
    const step =
      lastSimulation.steps[Math.min(stepIdx, lastSimulation.steps.length - 1)];
    if (!step) return;

    if (
      step.detail.includes('RIVER') ||
      step.detail.includes('RING-OUT') ||
      step.floatingText?.includes('SPLASH')
    ) {
      soundEngine.playRiverSplash();
    } else if (
      step.headline.includes('Bash') ||
      step.floatingText?.includes('BASH')
    ) {
      soundEngine.playShieldBash();
    } else if (
      step.headline.includes('Clash') ||
      step.headline.includes('Strike') ||
      step.floatingText?.includes('WOUND') ||
      step.floatingText?.includes('ARMOR')
    ) {
      soundEngine.playSwordClash();
    } else if (step.headline.includes('Round')) {
      soundEngine.playDiceClatter();
    } else {
      soundEngine.playIronClick();
    }
  }, [stepIdx, arenaMode, lastSimulation.steps]);

  useEffect(() => {
    if (!isPlaying || arenaMode !== 'REPLAY_DOCTRINE') return;
    const timer = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= lastSimulation.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1150);
    return () => clearInterval(timer);
  }, [isPlaying, arenaMode, lastSimulation.steps.length]);

  const displayedKnights =
    arenaMode === 'REPLAY_DOCTRINE' ? currentStep.knightsSnapshot : liveKnights;
  const displayedChrDice =
    arenaMode === 'REPLAY_DOCTRINE'
      ? currentStep.christianDiceSnapshot
      : liveChrDice;
  const displayedHunDice =
    arenaMode === 'REPLAY_DOCTRINE' ? currentStep.hunterDiceSnapshot : liveHunDice;

  const inspectedKnight =
    displayedKnights.find((k) => k.id === selectedKnightId) || displayedKnights[0];

  const selectedLiveDie =
    [...liveChrDice, ...liveHunDice].find((d) => d.id === selectedLiveDieId) || null;

  const chrTotalMomentum = displayedKnights
    .filter((k) => k.side === 'CHRISTIAN' && !k.downed)
    .reduce((acc, k) => acc + k.momentum, 0);
  const hunTotalMomentum = displayedKnights
    .filter((k) => k.side === 'HUNTER' && !k.downed)
    .reduce((acc, k) => acc + k.momentum, 0);

  const resetLiveBoard = () => {
    soundEngine.playDiceClatter();
    setLiveRound(1);
    setLiveKnights(createInitialArenaKnights(christian, hunter));
    setLiveChrDice(rollInitiativePool('CHRISTIAN', 6));
    setLiveHunDice(rollInitiativePool('HUNTER', 6));
    setSelectedLiveDieId(null);
    setLiveBannerLog('Bridge formations reset. Roll or spend Initiative Dice!');
  };

  const executeLiveAction = (
    action: 'SPRINT' | 'SHIFT' | 'BASH' | 'CLASH'
  ) => {
    if (!selectedLiveDie || selectedLiveDie.spent) {
      setLiveBannerLog('Pick an unspent Initiative Die from the bottom pool first!');
      return;
    }
    if (!inspectedKnight || inspectedKnight.downed) {
      setLiveBannerLog('Select an active standing knight on the bridge!');
      return;
    }
    if (inspectedKnight.side !== selectedLiveDie.side) {
      setLiveBannerLog(
        `Selected die belongs to ${selectedLiveDie.side}, so select a ${selectedLiveDie.side} knight!`
      );
      return;
    }

    const updatedKnights = liveKnights.map((k) => ({ ...k }));
    const actor = updatedKnights.find((k) => k.id === inspectedKnight.id)!;
    const enemies = updatedKnights.filter(
      (k) => k.side !== actor.side && !k.downed
    );
    if (enemies.length === 0) return;

    const nearestEnemy = enemies.sort(
      (a, b) => distanceInches(actor, a) - distanceInches(actor, b)
    )[0];
    const dist = distanceInches(actor, nearestEnemy);

    if (action === 'SPRINT' || action === 'SHIFT') {
      soundEngine.playIronClick();
      const moveDist = action === 'SPRINT' ? 2.4 : 1.35;
      const angle = Math.atan2(nearestEnemy.y - actor.y, nearestEnemy.x - actor.x);
      const nx =
        actor.x + Math.cos(angle) * Math.min(moveDist, Math.max(0.4, dist - 0.9));
      let ny =
        actor.y + Math.sin(angle) * Math.min(moveDist, Math.max(0.4, dist - 0.9));
      if (nx >= 4.4 && nx <= 6.6) {
        ny = Math.max(2.35, Math.min(6.15, ny));
      }
      actor.x = Number(nx.toFixed(2));
      actor.y = Number(ny.toFixed(2));
      if (action === 'SPRINT') {
        actor.momentum = Math.min(2, actor.momentum + 1);
      }
      actor.activatedThisRound = true;
      setLiveBannerLog(
        `${actor.name} spent Die [${selectedLiveDie.value}] to ${
          action === 'SPRINT' ? 'Sprint (+1 Momentum)' : 'Tactical Shift'
        } toward ${nearestEnemy.name}!`
      );
    } else if (action === 'BASH') {
      if (dist > MELEE_RANGE_INCHES + 0.4) {
        setLiveBannerLog(
          `${actor.name} is ${dist.toFixed(1)}" away from ${nearestEnemy.name}—Sprint or Shift closer first!`
        );
        return;
      }
      const pushDist = 1.25 + actor.bashBonus * 0.35;
      const angle = Math.atan2(nearestEnemy.y - actor.y, nearestEnemy.x - actor.x);
      nearestEnemy.x = Number(
        Math.max(
          0.5,
          Math.min(10.5, nearestEnemy.x + Math.cos(angle) * pushDist)
        ).toFixed(2)
      );
      nearestEnemy.y = Number(
        Math.max(
          0.5,
          Math.min(8.0, nearestEnemy.y + Math.sin(angle) * pushDist)
        ).toFixed(2)
      );
      nearestEnemy.momentum = 0;
      const ringOut = isRiverHazard(nearestEnemy.x, nearestEnemy.y);
      if (ringOut) {
        nearestEnemy.wounds = 0;
        nearestEnemy.downed = true;
        soundEngine.playRiverSplash();
      } else {
        soundEngine.playShieldBash();
      }
      setLiveBannerLog(
        ringOut
          ? `SPLASH! ${actor.name} bashed ${nearestEnemy.name} through the parapet gap into the Blackwater River! Captured for Ransom!`
          : `${actor.name} bashed ${nearestEnemy.name} back ${pushDist.toFixed(1)}" and stripped all Momentum!`
      );
    } else if (action === 'CLASH') {
      if (dist > MELEE_RANGE_INCHES + 0.4) {
        setLiveBannerLog(
          `${actor.name} is ${dist.toFixed(1)}" away from ${nearestEnemy.name}—Sprint into base contact first!`
        );
        return;
      }
      soundEngine.playSwordClash();
      const isHeavy = selectedLiveDie.value >= 5 || actor.momentum > 0;
      const atkRoll =
        Math.floor(Math.random() * 6) +
        1 +
        actor.clashSkill +
        actor.momentum +
        (isHeavy ? 1 : 0);
      const defRoll = Math.floor(Math.random() * 6) + 1 + nearestEnemy.armorRating;
      if (actor.momentum > 0) actor.momentum -= 1;

      const dmg = atkRoll > defRoll + 2 ? 2 : atkRoll >= defRoll ? 1 : 0;
      if (dmg > 0) {
        nearestEnemy.wounds = Math.max(0, nearestEnemy.wounds - dmg);
        if (nearestEnemy.wounds === 0) nearestEnemy.downed = true;
      }
      setLiveBannerLog(
        `${actor.name} Clashed with ${nearestEnemy.name} (Roll ${atkRoll} vs Armor ${defRoll}) → ${
          dmg > 0
            ? `${dmg} Wound(s) dealt! ${nearestEnemy.downed ? `${nearestEnemy.name} DOWNED!` : ''}`
            : 'Clang! Turned by Milanese plate!'
        }`
      );
    }

    if (selectedLiveDie.side === 'CHRISTIAN') {
      setLiveChrDice((prev) =>
        prev.map((d) => (d.id === selectedLiveDie.id ? { ...d, spent: true } : d))
      );
    } else {
      setLiveHunDice((prev) =>
        prev.map((d) => (d.id === selectedLiveDie.id ? { ...d, spent: true } : d))
      );
    }
    setSelectedLiveDieId(null);
    setLiveKnights(updatedKnights);
  };

  const svgW = 1536;
  const svgH = 860;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          FULL-WIDTH WIDESCREEN LANDSCAPE 2.5D RED FORD STONE BRIDGE DIORAMA
          ===================================================================== */}
      <div className="forged-iron-frame rounded-xl overflow-hidden shadow-2xl">
        {/* TOP IRON & OAK STRATEGY HEADER BAR */}
        <div className="bg-[#120e0a]/95 border-b border-amber-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40">
                Widescreen Greathelm 6v6 Diorama • 8.5&quot; × 11&quot; Tabletop Scale
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Scene: The Narrow Cobbled Stone Bridge at Red Ford (Hex 03,02)
              </span>
            </div>
            <h2
              className="text-lg sm:text-xl font-extrabold text-amber-100 mt-1"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {christian.companyName} (Christian) vs. {hunter.companyName} (Hunter)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-stone-950/90 p-1 border border-stone-700">
              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  setArenaMode('REPLAY_DOCTRINE');
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  arenaMode === 'REPLAY_DOCTRINE'
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Doctrine Auto-Resolve &amp; 60s Replay
              </button>
              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  setArenaMode('LIVE_PLAY');
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  arenaMode === 'LIVE_PLAY'
                    ? 'bg-emerald-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Play Live (Interactive Turn-by-Turn)
              </button>
            </div>

            <button
              onClick={() => {
                soundEngine.playDiceClatter();
                onRunNewSimulation(Date.now());
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-200 transition cursor-pointer shadow"
            >
              <Dices className="h-4 w-4 text-amber-400" /> Re-Simulate Clash
            </button>
          </div>
        </div>

        {/* TACTICAL ACTION TICKER */}
        <div className="bg-stone-950/95 border-b border-amber-500/25 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {arenaMode === 'REPLAY_DOCTRINE' ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-300 border border-amber-500/40">
                ROUND {currentStep.round} • STEP {stepIdx + 1}/{lastSimulation.steps.length}
              </span>
              <span className="text-xs font-bold text-amber-200">
                {currentStep.headline}
              </span>
              <span className="text-xs text-stone-300">— {currentStep.detail}</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-emerald-300">
              {liveBannerLog}
            </div>
          )}

          {arenaMode === 'REPLAY_DOCTRINE' && currentStep.dieSpent && (
            <span className="rounded bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-200 shadow">
              Initiative Die Spent: [{currentStep.dieSpent}]
            </span>
          )}
        </div>

        {/* WIDESCREEN 2.5D BRIDGE VIEWPORT WITH HOLLOW IRON FRAME OVERLAY & FLOATING KNIGHT INSPECTOR */}
        <div className="relative w-full overflow-x-auto bg-[#0c0a08]">
          {/* Hollow Painted Forged-Iron & Gothic-Oak Picture Frame Overlay */}
          <div className="viewport-iron-frame-overlay hidden sm:block" />

          {/* Painted Gothic Fleur-de-Lis Iron Corner Bosses */}
          <img
            src="/assets/corner-boss-tl.webp"
            alt=""
            className="pointer-events-none hidden sm:block absolute top-0 left-0 h-16 w-16 z-30"
          />
          <img
            src="/assets/corner-boss-tr.webp"
            alt=""
            className="pointer-events-none hidden sm:block absolute top-0 right-0 h-16 w-16 z-30"
          />
          <img
            src="/assets/corner-boss-bl.webp"
            alt=""
            className="pointer-events-none hidden sm:block absolute bottom-0 left-0 h-16 w-16 z-30"
          />
          <img
            src="/assets/corner-boss-br.webp"
            alt=""
            className="pointer-events-none hidden sm:block absolute bottom-0 right-0 h-16 w-16 z-30"
          />

          {/* FLOATING TOP-LEFT DIEGETIC SELECTED KNIGHT INSPECTOR PLAQUE */}
          {inspectedKnight && (
            <div className="sm:absolute left-7 top-6 z-30 bg-[#14100c]/92 border-2 border-[#8c6d43] rounded-xl p-3 shadow-2xl backdrop-blur-sm max-w-full sm:max-w-[360px]">
              <div className="flex items-center gap-3">
                <img
                  src={
                    KNIGHT_PORTRAITS[inspectedKnight.id] ||
                    '/assets/portrait-k1.webp'
                  }
                  alt={inspectedKnight.name}
                  className="h-14 w-14 rounded-lg object-cover border-2 border-amber-500/60 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      inspectedKnight.side === 'CHRISTIAN'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {inspectedKnight.side === 'CHRISTIAN'
                      ? 'Iron Vultures'
                      : 'The Red Lance'}{' '}
                    • {inspectedKnight.role}
                  </span>
                  <h3
                    className="text-sm font-extrabold text-amber-100 mt-0.5 truncate"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {inspectedKnight.name}
                  </h3>
                  <div className="text-[11px] text-stone-300 font-mono truncate">
                    {inspectedKnight.weapon} • Armor {inspectedKnight.armorRating}+ • HP{' '}
                    {inspectedKnight.wounds}/{inspectedKnight.maxWounds} • ⚡
                    {inspectedKnight.momentum}
                  </div>
                </div>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto min-w-[780px] select-none block"
          >
            <defs>
              <filter
                id="miniatureDropShadow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feDropShadow
                  dx="0"
                  dy="8"
                  stdDeviation="6"
                  floodColor="#000000"
                  floodOpacity="0.88"
                />
              </filter>
              <filter
                id="momentumGlow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* PAINTED WIDESCREEN 2.5D RED FORD STONE BRIDGE BACKDROP */}
            <image
              href="/assets/bridge-battle-backdrop.png"
              x="0"
              y="-40"
              width={svgW}
              height={1024}
              preserveAspectRatio="xMidYMid slice"
            />

            {/* SUBTLE ISOMETRIC GREATHELM ZONE GRID ON THE BRIDGE STONES */}
            <g opacity="0.24">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((inchX) => {
                const gx = mapDioramaX(inchX);
                return (
                  <g key={`bgrid-x-${inchX}`}>
                    <line
                      x1={gx}
                      y1={245}
                      x2={gx}
                      y2={565}
                      stroke="#fde68a"
                      strokeWidth="1.2"
                      strokeDasharray="6 6"
                    />
                    <text
                      x={gx + 4}
                      y={260}
                      fill="#fde68a"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {inchX}&quot;
                    </text>
                  </g>
                );
              })}
              {[2.85, 4.25, 5.65].map((inchY, idx) => {
                const gy = mapDioramaY(inchY);
                return (
                  <line
                    key={`bgrid-y-${idx}`}
                    x1={140}
                    y1={gy}
                    x2={1396}
                    y2={gy}
                    stroke="#fde68a"
                    strokeWidth="1.2"
                    strokeDasharray="8 6"
                  />
                );
              })}
            </g>

            {/* BROKEN PARAPET RING-OUT HAZARD ZONES */}
            <g transform="translate(690, 212)">
              <rect
                x="-150"
                y="-16"
                width="300"
                height="26"
                rx="5"
                fill="#082f49"
                fillOpacity="0.85"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="11"
                fontWeight="800"
                letterSpacing="1.2"
              >
                🌊 NORTH PARAPET GAP • BASH RING-OUT
              </text>
            </g>

            <g transform="translate(860, 588)">
              <rect
                x="-150"
                y="-16"
                width="300"
                height="26"
                rx="5"
                fill="#082f49"
                fillOpacity="0.85"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="11"
                fontWeight="800"
                letterSpacing="1.2"
              >
                🌊 SOUTH PARAPET GAP • BASH RING-OUT
              </text>
            </g>

            {/* MOVEMENT & BASH KNOCKBACK VECTORS */}
            {arenaMode === 'REPLAY_DOCTRINE' &&
              currentStep.fromPos &&
              currentStep.toPos && (
                <line
                  x1={mapDioramaX(currentStep.fromPos.x)}
                  y1={mapDioramaY(currentStep.fromPos.y)}
                  x2={mapDioramaX(currentStep.toPos.x)}
                  y2={mapDioramaY(currentStep.toPos.y)}
                  stroke={
                    currentStep.actorSide === 'CHRISTIAN' ? '#fbbf24' : '#f87171'
                  }
                  strokeWidth="5"
                  strokeDasharray="10 6"
                />
              )}

            {arenaMode === 'REPLAY_DOCTRINE' &&
              currentStep.targetFromPos &&
              currentStep.targetToPos && (
                <line
                  x1={mapDioramaX(currentStep.targetFromPos.x)}
                  y1={mapDioramaY(currentStep.targetFromPos.y)}
                  x2={mapDioramaX(currentStep.targetToPos.x)}
                  y2={mapDioramaY(currentStep.targetToPos.y)}
                  stroke="#38bdf8"
                  strokeWidth="6"
                />
              )}

            {/* RENDER ALL 12 PAINTED 2.5D ARMORED KNIGHT MINIATURES (SORTED BY Y FOR PAINTER'S DEPTH) */}
            {[...displayedKnights]
              .sort((a, b) => a.y - b.y)
              .map((k) => {
                const kx = mapDioramaX(k.x);
                const ky = mapDioramaY(k.y);
                const isSelected = k.id === selectedKnightId;
                const isCurrentActor =
                  arenaMode === 'REPLAY_DOCTRINE' && currentStep.actorId === k.id;
                const isCurrentTarget =
                  arenaMode === 'REPLAY_DOCTRINE' && currentStep.targetId === k.id;
                const inRiver = isRiverHazard(k.x, k.y);

                return (
                  <g key={k.id} transform={`translate(${kx}, ${ky})`}>
                    <DetailedKnightPuppet
                      knight={k}
                      isSelected={isSelected}
                      isCurrentActor={isCurrentActor}
                      isCurrentTarget={isCurrentTarget}
                      inRiver={inRiver}
                      onClick={() => {
                        soundEngine.playIronClick();
                        setSelectedKnightId(k.id);
                      }}
                    />
                  </g>
                );
              })}

            {/* FLOATING CALLOUT BANNER OVER THE BRIDGE */}
            {arenaMode === 'REPLAY_DOCTRINE' && currentStep.floatingText && (
              <g transform={`translate(${svgW / 2}, 52)`}>
                <rect
                  x="-220"
                  y="-24"
                  width="440"
                  height="38"
                  rx="8"
                  fill="#0c0a09"
                  fillOpacity="0.92"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="15"
                  fontWeight="900"
                  letterSpacing="1.5"
                >
                  ⚔ {currentStep.floatingText}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* CONCEPT #3 CARVED-OAK WIDESCREEN BOTTOM STRATEGY CONSOLE (DICE POOLS + MOMENTUM ORBS + DOCTRINE CARDS) */}
        <div className="bg-[#16110c] border-t-2 border-[#785c38] p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT: CHRISTIAN'S INITIATIVE DICE TRAY & MOMENTUM ORB */}
            <div className="lg:col-span-4 rounded-xl border border-amber-500/40 bg-stone-950/90 p-3 shadow-inner flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/doctrine-shieldwall-card.webp"
                  alt="Iron Vultures Doctrine"
                  className="h-12 w-9 rounded object-cover border border-amber-500/50 shrink-0"
                />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Iron Vultures Pool
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {christian.doctrine.formation.replace('_', ' ')}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 mt-1">
                    <Zap className="h-3 w-3 text-amber-300" />
                    <span className="text-[10px] font-mono font-extrabold text-amber-200">
                      Momentum {chrTotalMomentum}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {displayedChrDice.map((d) => (
                  <button
                    key={d.id}
                    disabled={arenaMode === 'REPLAY_DOCTRINE' || d.spent}
                    onClick={() => {
                      soundEngine.playDiceClatter();
                      setSelectedLiveDieId(d.id);
                    }}
                    className={`h-9 w-9 rounded-lg font-mono text-sm font-black flex items-center justify-center border-2 transition ${
                      d.spent
                        ? 'bg-stone-900/60 text-stone-600 border-stone-800 line-through'
                        : selectedLiveDieId === d.id
                        ? 'bg-amber-300 text-stone-950 border-white scale-110 shadow-lg'
                        : 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 border-amber-200 hover:brightness-110 cursor-pointer shadow'
                    }`}
                  >
                    {d.value}
                  </button>
                ))}
              </div>
            </div>

            {/* CENTER: REPLAY CONTROLS OR LIVE TURN COMMANDS */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center gap-2">
              {arenaMode === 'REPLAY_DOCTRINE' ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundEngine.playIronClick();
                        setIsPlaying(false);
                        setStepIdx(0);
                      }}
                      className="rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 p-2 text-stone-300 cursor-pointer"
                      title="Restart Replay"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playIronClick();
                        setIsPlaying(false);
                        setStepIdx((s) => Math.max(0, s - 1));
                      }}
                      className="rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 p-2 text-stone-300 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playWarhorn();
                        setIsPlaying((p) => !p);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-stone-950 shadow-lg cursor-pointer"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" /> Pause Clash
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Play 60s Skirmish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setStepIdx((s) =>
                          Math.min(lastSimulation.steps.length - 1, s + 1)
                        );
                      }}
                      className="rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 p-2 text-stone-300 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, lastSimulation.steps.length - 1)}
                    value={stepIdx}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setStepIdx(Number(e.target.value));
                    }}
                    className="w-full max-w-xs accent-amber-500 cursor-pointer"
                  />
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => executeLiveAction('SPRINT')}
                    className="rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 text-xs font-bold text-amber-200 cursor-pointer"
                  >
                    Sprint (+⚡)
                  </button>
                  <button
                    onClick={() => executeLiveAction('SHIFT')}
                    className="rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 px-2.5 py-1.5 text-xs font-bold text-stone-200 cursor-pointer"
                  >
                    Shift
                  </button>
                  <button
                    onClick={() => executeLiveAction('BASH')}
                    className="rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 px-2.5 py-1.5 text-xs font-bold text-sky-200 cursor-pointer"
                  >
                    Shield Bash
                  </button>
                  <button
                    onClick={() => executeLiveAction('CLASH')}
                    className="rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-2.5 py-1.5 text-xs font-bold text-red-200 cursor-pointer"
                  >
                    Melee Clash
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playDiceClatter();
                      setLiveRound((r) => r + 1);
                      setLiveChrDice(
                        rollInitiativePool(
                          'CHRISTIAN',
                          liveKnights.filter(
                            (k) => k.side === 'CHRISTIAN' && !k.downed
                          ).length
                        )
                      );
                      setLiveHunDice(
                        rollInitiativePool(
                          'HUNTER',
                          liveKnights.filter(
                            (k) => k.side === 'HUNTER' && !k.downed
                          ).length
                        )
                      );
                      setLiveBannerLog(
                        `Round ${liveRound + 1} — Fresh Initiative Dice Rolled!`
                      );
                    }}
                    className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    Next Round ({liveRound})
                  </button>
                  <button
                    onClick={resetLiveBoard}
                    className="rounded bg-stone-800 px-2 py-1.5 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: HUNTER'S INITIATIVE DICE TRAY & MOMENTUM ORB */}
            <div className="lg:col-span-4 rounded-xl border border-red-500/40 bg-stone-950/90 p-3 shadow-inner flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {displayedHunDice.map((d) => (
                  <button
                    key={d.id}
                    disabled={arenaMode === 'REPLAY_DOCTRINE' || d.spent}
                    onClick={() => {
                      soundEngine.playDiceClatter();
                      setSelectedLiveDieId(d.id);
                    }}
                    className={`h-9 w-9 rounded-lg font-mono text-sm font-black flex items-center justify-center border-2 transition ${
                      d.spent
                        ? 'bg-stone-900/60 text-stone-600 border-stone-800 line-through'
                        : selectedLiveDieId === d.id
                        ? 'bg-red-300 text-stone-950 border-white scale-110 shadow-lg'
                        : 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-300 hover:brightness-110 cursor-pointer shadow'
                    }`}
                  >
                    {d.value}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                    Red Lance Pool
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {hunter.doctrine.formation.replace('_', ' ')}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-400/50 px-2 py-0.5 mt-1">
                    <Zap className="h-3 w-3 text-red-300" />
                    <span className="text-[10px] font-mono font-extrabold text-red-200">
                      Momentum {hunTotalMomentum}
                    </span>
                  </div>
                </div>
                <img
                  src="/assets/doctrine-wedge-card.webp"
                  alt="Red Lance Doctrine"
                  className="h-12 w-9 rounded object-cover border border-red-500/50 shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          WIDESCREEN 3-COLUMN BOTTOM DECK: CHRISTIAN DOCTRINE + HUNTER DOCTRINE + PARCHMENT RANSOM LEDGER
          ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CHRISTIAN'S STANDING DOCTRINE (4 COLS) */}
        <div className="xl:col-span-4 carved-oak-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
            <div className="flex items-center gap-3">
              <img
                src="/assets/doctrine-shieldwall-card.webp"
                alt="Shieldwall Doctrine"
                className="h-12 w-10 rounded object-cover border border-amber-500/40"
              />
              <div>
                <h3
                  className="text-sm font-bold text-amber-200 flex items-center gap-1.5"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  <Shield className="h-4 w-4 text-amber-400" /> Christian’s Doctrine
                </h3>
                <p className="text-[11px] text-stone-400">
                  Iron Vultures Ghost Commander AI
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Starting Formation
              </label>
              <select
                value={christian.doctrine.formation}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    formation: e.target.value as StandingDoctrine['formation'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="SHIELDWALL">SHIELDWALL (Tight Line)</option>
                <option value="FLYING_WEDGE">FLYING_WEDGE (Spearhead)</option>
                <option value="REFUSED_FLANK">REFUSED_FLANK (Echelon)</option>
                <option value="ENVELOPMENT">ENVELOPMENT (Wide Pincer)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                High Dice (5s &amp; 6s)
              </label>
              <select
                value={christian.doctrine.highDicePriority}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    highDicePriority:
                      e.target.value as StandingDoctrine['highDicePriority'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="HEAVY_CLASH_EXECUTE">HEAVY_CLASH_EXECUTE</option>
                <option value="MOMENTUM_FLANK_CHARGE">MOMENTUM_FLANK_CHARGE</option>
                <option value="GUARD_BANNERMAN">GUARD_BANNERMAN</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Low Dice (1s &amp; 2s)
              </label>
              <select
                value={christian.doctrine.lowDicePriority}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    lowDicePriority:
                      e.target.value as StandingDoctrine['lowDicePriority'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="SHIELD_BASH_STRIP_MOMENTUM">
                  SHIELD_BASH_STRIP_MOMENTUM
                </option>
                <option value="TACTICAL_SHIFT_STEP">TACTICAL_SHIFT_STEP</option>
                <option value="BRACE_ARMOR_STANCE">BRACE_ARMOR_STANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Retreat Threshold
              </label>
              <select
                value={christian.doctrine.retreatThreshold}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    retreatThreshold:
                      e.target.value as StandingDoctrine['retreatThreshold'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="WITHDRAW_AT_2_DOWNED">WITHDRAW_AT_2_DOWNED</option>
                <option value="WITHDRAW_AT_3_DOWNED">WITHDRAW_AT_3_DOWNED</option>
                <option value="NO_RETREAT_FIGHT_TO_LAST">
                  NO_RETREAT_FIGHT_TO_LAST
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* HUNTER'S STANDING DOCTRINE (4 COLS) */}
        <div className="xl:col-span-4 carved-oak-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
            <div className="flex items-center gap-3">
              <img
                src="/assets/doctrine-wedge-card.webp"
                alt="Flying Wedge Doctrine"
                className="h-12 w-10 rounded object-cover border border-red-500/40"
              />
              <div>
                <h3
                  className="text-sm font-bold text-red-200 flex items-center gap-1.5"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  <Swords className="h-4 w-4 text-red-400" /> Hunter’s Doctrine
                </h3>
                <p className="text-[11px] text-stone-400">
                  The Red Lance Ghost Commander AI
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Starting Formation
              </label>
              <select
                value={hunter.doctrine.formation}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    formation: e.target.value as StandingDoctrine['formation'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="FLYING_WEDGE">FLYING_WEDGE (Spearhead)</option>
                <option value="SHIELDWALL">SHIELDWALL (Tight Line)</option>
                <option value="REFUSED_FLANK">REFUSED_FLANK (Echelon)</option>
                <option value="ENVELOPMENT">ENVELOPMENT (Wide Pincer)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                High Dice (5s &amp; 6s)
              </label>
              <select
                value={hunter.doctrine.highDicePriority}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    highDicePriority:
                      e.target.value as StandingDoctrine['highDicePriority'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="MOMENTUM_FLANK_CHARGE">MOMENTUM_FLANK_CHARGE</option>
                <option value="HEAVY_CLASH_EXECUTE">HEAVY_CLASH_EXECUTE</option>
                <option value="GUARD_BANNERMAN">GUARD_BANNERMAN</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Low Dice (1s &amp; 2s)
              </label>
              <select
                value={hunter.doctrine.lowDicePriority}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    lowDicePriority:
                      e.target.value as StandingDoctrine['lowDicePriority'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="TACTICAL_SHIFT_STEP">TACTICAL_SHIFT_STEP</option>
                <option value="SHIELD_BASH_STRIP_MOMENTUM">
                  SHIELD_BASH_STRIP_MOMENTUM
                </option>
                <option value="BRACE_ARMOR_STANCE">BRACE_ARMOR_STANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Retreat Threshold
              </label>
              <select
                value={hunter.doctrine.retreatThreshold}
                onChange={(e) => {
                  soundEngine.playIronClick();
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    retreatThreshold:
                      e.target.value as StandingDoctrine['retreatThreshold'],
                  });
                }}
                className="w-full cast-iron-slot rounded px-2.5 py-1.5 text-stone-100"
              >
                <option value="WITHDRAW_AT_2_DOWNED">WITHDRAW_AT_2_DOWNED</option>
                <option value="WITHDRAW_AT_3_DOWNED">WITHDRAW_AT_3_DOWNED</option>
                <option value="NO_RETREAT_FIGHT_TO_LAST">
                  NO_RETREAT_FIGHT_TO_LAST
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* CHIVALRIC POST-BATTLE INJURY, VENDETTA & RANSOM LEDGER (4 COLS) */}
        <div className="xl:col-span-4 parchment-sheet rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-950/20 pb-2">
            <h3
              className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <Award className="h-4 w-4 text-amber-800" /> Chivalric Ransom &amp; Scars
            </h3>
            <span className="rounded bg-amber-900 text-amber-100 px-2 py-0.5 text-[10px] font-bold">
              Victor: {lastSimulation.winner}
            </span>
          </div>

          <p className="text-xs text-stone-800 leading-relaxed font-medium">
            {lastSimulation.winReason}
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {lastSimulation.casualtyReports.length === 0 ? (
              <div className="text-xs text-stone-600 italic">
                No knights downed in this simulation.
              </div>
            ) : (
              lastSimulation.casualtyReports.map((rep) => (
                <div
                  key={rep.knightId}
                  className="rounded-lg border border-amber-950/25 bg-[#e5d4b3] p-2.5 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-extrabold ${
                        rep.side === 'CHRISTIAN'
                          ? 'text-amber-950'
                          : 'text-red-900'
                      }`}
                    >
                      {rep.knightName}
                    </span>
                    <span className="rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-mono text-amber-200">
                      d6 [{rep.roll}] • {rep.outcomeTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-800">
                    {rep.mechanicalEffect}
                  </p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              soundEngine.playWaxSealCrack();
              onCommitBattleToLedger(lastSimulation);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 hover:bg-stone-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200 shadow transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-400" /> Seal Outcome to MCP Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
