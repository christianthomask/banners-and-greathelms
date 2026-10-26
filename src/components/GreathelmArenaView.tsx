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
  ShieldAlert,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import {
  ARENA_HEIGHT_INCHES,
  ARENA_WIDTH_INCHES,
  ArenaKnightState,
  createInitialArenaKnights,
  distanceInches,
  GreathelmSimulationResult,
  InitiativeDie,
  isRiverHazard,
  MELEE_RANGE_INCHES,
  rollInitiativePool,
  simulateDoctrineGreathelmBattle,
} from '../engine/greathelmEngine';
import { MercenaryCompany, StandingDoctrine } from '../schema/worldSchema';

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
    'Live Greathelm Mode: Select an unspent Initiative Die (6s down to 1s), select a Knight, and choose an action!'
  );

  useEffect(() => {
    setStepIdx(0);
    setIsPlaying(false);
  }, [lastSimulation]);

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

  const currentStep =
    lastSimulation.steps[Math.min(stepIdx, lastSimulation.steps.length - 1)] ||
    lastSimulation.steps[0];

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

  // LIVE PLAY HELPERS
  const selectedLiveDie =
    [...liveChrDice, ...liveHunDice].find((d) => d.id === selectedLiveDieId) || null;

  const resetLiveBoard = () => {
    setLiveRound(1);
    setLiveKnights(createInitialArenaKnights(christian, hunter));
    setLiveChrDice(rollInitiativePool('CHRISTIAN', 6));
    setLiveHunDice(rollInitiativePool('HUNTER', 6));
    setSelectedLiveDieId(null);
    setLiveBannerLog('Board reset to starting formations. Roll or spend Initiative Dice!');
  };

  const executeLiveAction = (
    action: 'SPRINT' | 'SHIFT' | 'BASH' | 'CLASH'
  ) => {
    if (!selectedLiveDie || selectedLiveDie.spent) {
      setLiveBannerLog('Pick an unspent Initiative Die from the top pool first!');
      return;
    }
    if (!inspectedKnight || inspectedKnight.downed) {
      setLiveBannerLog('Select an active standing knight on the board!');
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
      const moveDist = action === 'SPRINT' ? 2.4 : 1.35;
      const angle = Math.atan2(nearestEnemy.y - actor.y, nearestEnemy.x - actor.x);
      let nx = actor.x + Math.cos(angle) * Math.min(moveDist, Math.max(0.4, dist - 0.9));
      let ny = actor.y + Math.sin(angle) * Math.min(moveDist, Math.max(0.4, dist - 0.9));
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
        Math.max(0.5, Math.min(10.5, nearestEnemy.x + Math.cos(angle) * pushDist)).toFixed(2)
      );
      nearestEnemy.y = Number(
        Math.max(0.5, Math.min(8.0, nearestEnemy.y + Math.sin(angle) * pushDist)).toFixed(2)
      );
      nearestEnemy.momentum = 0;
      const ringOut = isRiverHazard(nearestEnemy.x, nearestEnemy.y);
      if (ringOut) {
        nearestEnemy.wounds = 0;
        nearestEnemy.downed = true;
      }
      setLiveBannerLog(
        ringOut
          ? `SPLASH! ${actor.name} bashed ${nearestEnemy.name} off Red Ford Bridge into the river! Captured for Ransom!`
          : `${actor.name} bashed ${nearestEnemy.name} back ${pushDist.toFixed(1)}" and stripped all Momentum!`
      );
    } else if (action === 'CLASH') {
      if (dist > MELEE_RANGE_INCHES + 0.4) {
        setLiveBannerLog(
          `${actor.name} is ${dist.toFixed(1)}" away from ${nearestEnemy.name}—Sprint into base contact first!`
        );
        return;
      }
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
            : 'Clang! Turned by plate armor!'
        }`
      );
    }

    // Spend die
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

  // SVG scaling: 11.0" x 8.5" mapped to 770 x 595 pixels (70px per inch)
  const PX_PER_INCH = 70;
  const svgW = ARENA_WIDTH_INCHES * PX_PER_INCH;
  const svgH = ARENA_HEIGHT_INCHES * PX_PER_INCH;

  return (
    <div className="space-y-6">
      {/* HEADER BAR: GREATHELM SCALE & MODE SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-[#171410] p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
              Greathelm Micro-Skirmish • 8.5&quot; × 11&quot; Arena
            </span>
            <span className="text-xs text-stone-400 font-mono">
              6 Knights vs. 6 Knights • Scene: The Narrow Stone Bridge at Red Ford
            </span>
          </div>
          <h2
            className="text-lg sm:text-xl font-bold text-stone-100 mt-1"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {christian.companyName} (Christian) vs. {hunter.companyName} (Hunter)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-stone-900 p-1 border border-stone-700">
            <button
              onClick={() => setArenaMode('REPLAY_DOCTRINE')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                arenaMode === 'REPLAY_DOCTRINE'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Doctrine Auto-Resolve &amp; 60s Replay
            </button>
            <button
              onClick={() => setArenaMode('LIVE_PLAY')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                arenaMode === 'LIVE_PLAY'
                  ? 'bg-emerald-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Play Live (Interactive Turn-by-Turn)
            </button>
          </div>

          <button
            onClick={() => onRunNewSimulation(Date.now())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 px-3 py-2 text-xs font-semibold text-amber-200 transition cursor-pointer"
          >
            <Dices className="h-4 w-4 text-amber-400" /> Re-Simulate Doctrine Clash
          </button>
        </div>
      </div>

      {/* INITIATIVE DICE POOLS & REPLAY SCRUBBER / LIVE ACTION BAR */}
      <div className="rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* CHRISTIAN'S INITIATIVE DICE POOL (6s DOWN TO 1s) */}
          <div className="lg:col-span-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Christian’s Initiative Pool
              </div>
              <div className="text-[11px] text-stone-400">
                {christian.doctrine.formation.replace('_', ' ')}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {displayedChrDice.length === 0 ? (
                <span className="text-xs text-stone-500 font-mono">Pool Spent</span>
              ) : (
                displayedChrDice.map((d) => (
                  <button
                    key={d.id}
                    disabled={arenaMode === 'REPLAY_DOCTRINE' || d.spent}
                    onClick={() => setSelectedLiveDieId(d.id)}
                    className={`h-8 w-8 rounded-md font-mono text-sm font-extrabold flex items-center justify-center border transition ${
                      d.spent
                        ? 'bg-stone-900/50 text-stone-600 border-stone-800 line-through'
                        : selectedLiveDieId === d.id
                        ? 'bg-amber-300 text-stone-950 border-white scale-110 shadow'
                        : 'bg-amber-500 text-stone-950 border-amber-300 hover:brightness-110 cursor-pointer'
                    }`}
                  >
                    {d.value}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CENTER PLAYBACK CONTROLS OR LIVE ACTION BUTTONS */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-2">
            {arenaMode === 'REPLAY_DOCTRINE' ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx(0);
                    }}
                    className="rounded-lg bg-stone-800 hover:bg-stone-700 p-2 text-stone-300 cursor-pointer"
                    title="Restart Replay"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx((s) => Math.max(0, s - 1));
                    }}
                    className="rounded-lg bg-stone-800 hover:bg-stone-700 p-2 text-stone-300 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 shadow cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" /> Pause Replay
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
                      setStepIdx((s) => Math.min(lastSimulation.steps.length - 1, s + 1));
                    }}
                    className="rounded-lg bg-stone-800 hover:bg-stone-700 p-2 text-stone-300 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-stone-400">
                  Step {stepIdx + 1} / {lastSimulation.steps.length} • Round {currentStep.round}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  onClick={() => executeLiveAction('SPRINT')}
                  className="rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 text-xs font-bold text-amber-200 cursor-pointer"
                >
                  Sprint (+Momentum)
                </button>
                <button
                  onClick={() => executeLiveAction('SHIFT')}
                  className="rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 px-2.5 py-1.5 text-xs font-bold text-stone-200 cursor-pointer"
                >
                  Shift Step
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
                    setLiveRound((r) => r + 1);
                    setLiveChrDice(
                      rollInitiativePool(
                        'CHRISTIAN',
                        liveKnights.filter((k) => k.side === 'CHRISTIAN' && !k.downed).length
                      )
                    );
                    setLiveHunDice(
                      rollInitiativePool(
                        'HUNTER',
                        liveKnights.filter((k) => k.side === 'HUNTER' && !k.downed).length
                      )
                    );
                    setLiveBannerLog(`Round ${liveRound + 1} — Fresh Initiative Dice Rolled!`);
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

          {/* HUNTER'S INITIATIVE DICE POOL (6s DOWN TO 1s) */}
          <div className="lg:col-span-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2">
            <div className="flex items-center gap-1.5">
              {displayedHunDice.length === 0 ? (
                <span className="text-xs text-stone-500 font-mono">Pool Spent</span>
              ) : (
                displayedHunDice.map((d) => (
                  <button
                    key={d.id}
                    disabled={arenaMode === 'REPLAY_DOCTRINE' || d.spent}
                    onClick={() => setSelectedLiveDieId(d.id)}
                    className={`h-8 w-8 rounded-md font-mono text-sm font-extrabold flex items-center justify-center border transition ${
                      d.spent
                        ? 'bg-stone-900/50 text-stone-600 border-stone-800 line-through'
                        : selectedLiveDieId === d.id
                        ? 'bg-red-300 text-stone-950 border-white scale-110 shadow'
                        : 'bg-red-500 text-white border-red-300 hover:brightness-110 cursor-pointer'
                    }`}
                  >
                    {d.value}
                  </button>
                ))
              )}
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                Hunter’s Initiative Pool
              </div>
              <div className="text-[11px] text-stone-400">
                {hunter.doctrine.formation.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* CURRENT STEP / LIVE ACTION TICKER */}
        <div className="rounded-lg border border-stone-800 bg-stone-950/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          {arenaMode === 'REPLAY_DOCTRINE' ? (
            <div>
              <div className="text-xs font-bold text-amber-300">{currentStep.headline}</div>
              <div className="text-xs text-stone-300">{currentStep.detail}</div>
            </div>
          ) : (
            <div className="text-xs font-semibold text-emerald-300">{liveBannerLog}</div>
          )}

          {arenaMode === 'REPLAY_DOCTRINE' && currentStep.dieSpent && (
            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-mono font-bold text-amber-200">
              Spent Initiative Die: [{currentStep.dieSpent}]
            </span>
          )}
        </div>
      </div>

      {/* MAIN ARENA GRID: 8.5" x 11" TABLETOP CANVAS (8 COLS) + KNIGHT & CASUALTY INSPECTOR (4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 8.5" x 11" GREATHELM ARENA SVG */}
        <div className="xl:col-span-8 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl">
          <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2 font-mono">
            <span>GREATHELM A4 / US LETTER ARENA (11.0&quot; × 8.5&quot;)</span>
            <span>CLICK ANY KNIGHT TO INSPECT LOADOUT, MOMENTUM &amp; WOUNDS</span>
          </div>

          <div className="relative w-full overflow-x-auto rounded-lg border-2 border-stone-700 bg-[#1b1813] shadow-inner">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto min-w-[540px] select-none"
            >
              {/* 1-INCH TABLETOP MEASURE GRID */}
              {Array.from({ length: 11 }).map((_, i) => (
                <g key={`grid-v-${i}`}>
                  <line
                    x1={i * PX_PER_INCH}
                    y1={0}
                    x2={i * PX_PER_INCH}
                    y2={svgH}
                    stroke="#ffffff"
                    strokeOpacity="0.05"
                    strokeWidth="1"
                  />
                  <text
                    x={i * PX_PER_INCH + 6}
                    y={14}
                    fill="#78716c"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {i}&quot;
                  </text>
                </g>
              ))}
              {Array.from({ length: 9 }).map((_, j) => (
                <g key={`grid-h-${j}`}>
                  <line
                    x1={0}
                    y1={j * PX_PER_INCH}
                    x2={svgW}
                    y2={j * PX_PER_INCH}
                    stroke="#ffffff"
                    strokeOpacity="0.05"
                    strokeWidth="1"
                  />
                </g>
              ))}

              {/* BLACKWATER RIVER HAZARD CHANNELS (X = 4.65" to 6.35") */}
              <rect
                x={4.65 * PX_PER_INCH}
                y={0}
                width={1.7 * PX_PER_INCH}
                height={svgH}
                fill="#082f49"
                fillOpacity="0.85"
              />
              <text
                x={5.5 * PX_PER_INCH}
                y={48}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="10"
                fontWeight="700"
                opacity="0.8"
              >
                DEEP RIVER (BASH RING-OUT)
              </text>
              <text
                x={5.5 * PX_PER_INCH}
                y={svgH - 22}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="10"
                fontWeight="700"
                opacity="0.8"
              >
                DEEP RIVER (BASH RING-OUT)
              </text>

              {/* THE RED FORD STONE BRIDGE (SAFE ROADWAY Y = 2.1" to 6.4") */}
              <rect
                x={4.25 * PX_PER_INCH}
                y={2.1 * PX_PER_INCH}
                width={2.5 * PX_PER_INCH}
                height={4.3 * PX_PER_INCH}
                rx="6"
                fill="#292524"
                stroke="#78716c"
                strokeWidth="3"
              />
              {/* Bridge Stone Parapets */}
              <line
                x1={4.3 * PX_PER_INCH}
                y1={2.1 * PX_PER_INCH}
                x2={6.7 * PX_PER_INCH}
                y2={2.1 * PX_PER_INCH}
                stroke="#a8a29e"
                strokeWidth="5"
                strokeDasharray="14 6"
              />
              <line
                x1={4.3 * PX_PER_INCH}
                y1={6.4 * PX_PER_INCH}
                x2={6.7 * PX_PER_INCH}
                y2={6.4 * PX_PER_INCH}
                stroke="#a8a29e"
                strokeWidth="5"
                strokeDasharray="14 6"
              />
              <text
                x={5.5 * PX_PER_INCH}
                y={4.25 * PX_PER_INCH}
                textAnchor="middle"
                fill="#57534e"
                fontSize="13"
                fontWeight="800"
                letterSpacing="2"
              >
                RED FORD BRIDGE
              </text>

              {/* ACTION MOVEMENT / BASH VECTOR HIGHLIGHT IN REPLAY MODE */}
              {arenaMode === 'REPLAY_DOCTRINE' &&
                currentStep.fromPos &&
                currentStep.toPos && (
                  <line
                    x1={currentStep.fromPos.x * PX_PER_INCH}
                    y1={currentStep.fromPos.y * PX_PER_INCH}
                    x2={currentStep.toPos.x * PX_PER_INCH}
                    y2={currentStep.toPos.y * PX_PER_INCH}
                    stroke={
                      currentStep.actorSide === 'CHRISTIAN' ? '#fbbf24' : '#f87171'
                    }
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                )}

              {arenaMode === 'REPLAY_DOCTRINE' &&
                currentStep.targetFromPos &&
                currentStep.targetToPos && (
                  <line
                    x1={currentStep.targetFromPos.x * PX_PER_INCH}
                    y1={currentStep.targetFromPos.y * PX_PER_INCH}
                    x2={currentStep.targetToPos.x * PX_PER_INCH}
                    y2={currentStep.targetToPos.y * PX_PER_INCH}
                    stroke="#38bdf8"
                    strokeWidth="4"
                  />
                )}

              {/* RENDER ALL 12 KNIGHTS (6 IRON VULTURES vs 6 RED LANCE) */}
              {displayedKnights.map((k) => {
                const kx = k.x * PX_PER_INCH;
                const ky = k.y * PX_PER_INCH;
                const isChr = k.side === 'CHRISTIAN';
                const isSelected = k.id === selectedKnightId;
                const isCurrentActor =
                  arenaMode === 'REPLAY_DOCTRINE' && currentStep.actorId === k.id;
                const isCurrentTarget =
                  arenaMode === 'REPLAY_DOCTRINE' && currentStep.targetId === k.id;

                return (
                  <g
                    key={k.id}
                    transform={`translate(${kx}, ${ky})`}
                    onClick={() => setSelectedKnightId(k.id)}
                    className="cursor-pointer transition-transform"
                    opacity={k.downed ? 0.42 : 1}
                  >
                    {/* Base Contact / Melee Reach Ring for Selected or Active Knight */}
                    {(isSelected || isCurrentActor) && !k.downed && (
                      <circle
                        r={MELEE_RANGE_INCHES * PX_PER_INCH * 0.55}
                        fill="none"
                        stroke={isChr ? '#fbbf24' : '#f87171'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.65"
                      />
                    )}

                    {/* Target Impact Ring */}
                    {isCurrentTarget && (
                      <circle
                        r="31"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                      />
                    )}

                    {/* 32mm Miniature Base */}
                    <circle
                      r="22"
                      fill={
                        k.downed
                          ? '#1c1917'
                          : isChr
                          ? '#b45309'
                          : '#991b1b'
                      }
                      stroke={
                        isSelected
                          ? '#ffffff'
                          : isCurrentActor
                          ? '#fde047'
                          : isChr
                          ? '#fbbf24'
                          : '#fca5a5'
                      }
                      strokeWidth={isSelected || isCurrentActor ? 3.5 : 2}
                    />

                    {/* Role Shortcode & Name */}
                    <text
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="800"
                    >
                      {k.downed ? '☠' : k.role.slice(0, 3)}
                    </text>

                    {/* Knight Name Label */}
                    <rect
                      x="-40"
                      y="25"
                      width="80"
                      height="14"
                      rx="3"
                      fill="#0c0a09"
                      fillOpacity="0.88"
                    />
                    <text
                      y="35"
                      textAnchor="middle"
                      fill={isChr ? '#fde68a' : '#fecaca'}
                      fontSize="8.5"
                      fontWeight="700"
                    >
                      {k.name.replace('Sir ', '').slice(0, 13)}
                    </text>

                    {/* Wound Pips (Top Left of Base) */}
                    {!k.downed && (
                      <g transform="translate(-20, -28)">
                        {Array.from({ length: k.maxWounds }).map((_, wIdx) => (
                          <circle
                            key={wIdx}
                            cx={wIdx * 9}
                            cy="0"
                            r="3.5"
                            fill={wIdx < k.wounds ? '#22c55e' : '#44403c'}
                            stroke="#0c0a09"
                            strokeWidth="1"
                          />
                        ))}
                      </g>
                    )}

                    {/* Momentum Tokens (Top Right of Base - Gold Lightning Pips) */}
                    {!k.downed && k.momentum > 0 && (
                      <g transform="translate(14, -26)">
                        <rect
                          x="-8"
                          y="-7"
                          width="24"
                          height="13"
                          rx="4"
                          fill="#eab308"
                          stroke="#0c0a09"
                          strokeWidth="1"
                        />
                        <text
                          x="4"
                          y="2.5"
                          textAnchor="middle"
                          fill="#0c0a09"
                          fontSize="8.5"
                          fontWeight="900"
                        >
                          ⚡{k.momentum}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* FLOATING COMBAT CALLOUT BANNER ON THE CANVAS */}
              {arenaMode === 'REPLAY_DOCTRINE' && currentStep.floatingText && (
                <g transform={`translate(${svgW / 2}, 36)`}>
                  <rect
                    x="-145"
                    y="-18"
                    width="290"
                    height="28"
                    rx="6"
                    fill="#0c0a09"
                    fillOpacity="0.92"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize="11"
                    fontWeight="800"
                    letterSpacing="1"
                  >
                    {currentStep.floatingText}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED KNIGHT CARD + POST-BATTLE RANSOM & INJURY LEDGER */}
        <div className="xl:col-span-4 space-y-4">
          {/* KNIGHT INSPECTOR CARD */}
          {inspectedKnight && (
            <div className="rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
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
                  <h3 className="text-base font-bold text-stone-100 mt-1">
                    {inspectedKnight.name}
                  </h3>
                  <p className="text-xs text-stone-400">{inspectedKnight.title}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-amber-300 font-bold">
                    Armor {inspectedKnight.armorRating}+
                  </div>
                  <div className="text-xs text-emerald-400">
                    Wounds {inspectedKnight.wounds}/{inspectedKnight.maxWounds}
                  </div>
                  <div className="text-xs text-yellow-300">
                    Momentum ⚡{inspectedKnight.momentum}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="rounded bg-stone-900 p-2 border border-stone-800">
                  <div className="text-[10px] text-stone-400">WEAPON</div>
                  <div className="font-bold text-stone-200 truncate">
                    {inspectedKnight.weapon}
                  </div>
                </div>
                <div className="rounded bg-stone-900 p-2 border border-stone-800">
                  <div className="text-[10px] text-stone-400">CLASH SKILL</div>
                  <div className="font-bold text-amber-300">
                    +{inspectedKnight.clashSkill}d6
                  </div>
                </div>
                <div className="rounded bg-stone-900 p-2 border border-stone-800">
                  <div className="text-[10px] text-stone-400">BASH BONUS</div>
                  <div className="font-bold text-sky-300">
                    +{inspectedKnight.bashBonus} Push
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHIVALRIC POST-BATTLE INJURY, VENDETTA & RANSOM OUTCOME TABLE */}
          <div className="rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-bold text-amber-200 flex items-center gap-2"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                <Award className="h-4 w-4 text-amber-400" /> Post-Battle Ransom &amp; Scars
              </h3>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Winner: {lastSimulation.winner}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {lastSimulation.winReason}
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lastSimulation.casualtyReports.length === 0 ? (
                <div className="text-xs text-stone-400 italic">
                  No knights downed in this simulation.
                </div>
              ) : (
                lastSimulation.casualtyReports.map((rep) => (
                  <div
                    key={rep.knightId}
                    className="rounded-lg border border-stone-800 bg-stone-900/80 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold ${
                          rep.side === 'CHRISTIAN' ? 'text-amber-300' : 'text-red-300'
                        }`}
                      >
                        {rep.knightName}
                      </span>
                      <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-200">
                        d6 Roll [{rep.roll}] • {rep.outcomeTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">{rep.mechanicalEffect}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onCommitBattleToLedger(lastSimulation)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-950 shadow transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Commit Skirmish Outcome to MCP Event Ledger
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: STANDING TACTICAL DOCTRINES (THE AUTO-RESOLVE BRAIN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHRISTIAN'S STANDING DOCTRINE */}
        <div className="rounded-xl border border-amber-500/30 bg-[#16130f] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" /> Christian’s Standing Tactical Doctrine
              </h3>
              <p className="text-[11px] text-stone-400">
                Governs The Iron Vultures if Christian cannot join a live clash window.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
              Ghost Commander AI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Starting Formation
              </label>
              <select
                value={christian.doctrine.formation}
                onChange={(e) =>
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    formation: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="SHIELDWALL">SHIELDWALL (Tight Line)</option>
                <option value="FLYING_WEDGE">FLYING_WEDGE (Bridge Spearhead)</option>
                <option value="REFUSED_FLANK">REFUSED_FLANK (Echelon)</option>
                <option value="ENVELOPMENT">ENVELOPMENT (Wide Pincer)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                High Initiative Dice (5s &amp; 6s)
              </label>
              <select
                value={christian.doctrine.highDicePriority}
                onChange={(e) =>
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    highDicePriority: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="HEAVY_CLASH_EXECUTE">HEAVY_CLASH_EXECUTE</option>
                <option value="MOMENTUM_FLANK_CHARGE">MOMENTUM_FLANK_CHARGE</option>
                <option value="GUARD_BANNERMAN">GUARD_BANNERMAN</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Low Initiative Dice (1s &amp; 2s)
              </label>
              <select
                value={christian.doctrine.lowDicePriority}
                onChange={(e) =>
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    lowDicePriority: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
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
                Mercenary Retreat Threshold
              </label>
              <select
                value={christian.doctrine.retreatThreshold}
                onChange={(e) =>
                  onUpdateDoctrine('christian', {
                    ...christian.doctrine,
                    retreatThreshold: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="WITHDRAW_AT_2_DOWNED">
                  WITHDRAW_AT_2_DOWNED (Save Roster)
                </option>
                <option value="WITHDRAW_AT_3_DOWNED">
                  WITHDRAW_AT_3_DOWNED (Hold Longer)
                </option>
                <option value="NO_RETREAT_FIGHT_TO_LAST">
                  NO_RETREAT_FIGHT_TO_LAST
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* HUNTER'S STANDING DOCTRINE */}
        <div className="rounded-xl border border-red-500/30 bg-[#171111] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-red-200 flex items-center gap-2">
                <Swords className="h-4 w-4 text-red-400" /> Hunter’s Standing Tactical Doctrine
              </h3>
              <p className="text-[11px] text-stone-400">
                Governs The Red Lance if Hunter cannot join a live clash window.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
              Ghost Commander AI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Starting Formation
              </label>
              <select
                value={hunter.doctrine.formation}
                onChange={(e) =>
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    formation: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="FLYING_WEDGE">FLYING_WEDGE (Bridge Spearhead)</option>
                <option value="SHIELDWALL">SHIELDWALL (Tight Line)</option>
                <option value="REFUSED_FLANK">REFUSED_FLANK (Echelon)</option>
                <option value="ENVELOPMENT">ENVELOPMENT (Wide Pincer)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                High Initiative Dice (5s &amp; 6s)
              </label>
              <select
                value={hunter.doctrine.highDicePriority}
                onChange={(e) =>
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    highDicePriority: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="MOMENTUM_FLANK_CHARGE">MOMENTUM_FLANK_CHARGE</option>
                <option value="HEAVY_CLASH_EXECUTE">HEAVY_CLASH_EXECUTE</option>
                <option value="GUARD_BANNERMAN">GUARD_BANNERMAN</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">
                Low Initiative Dice (1s &amp; 2s)
              </label>
              <select
                value={hunter.doctrine.lowDicePriority}
                onChange={(e) =>
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    lowDicePriority: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
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
                Mercenary Retreat Threshold
              </label>
              <select
                value={hunter.doctrine.retreatThreshold}
                onChange={(e) =>
                  onUpdateDoctrine('hunter', {
                    ...hunter.doctrine,
                    retreatThreshold: e.target.value as any,
                  })
                }
                className="w-full rounded bg-stone-900 border border-stone-700 px-2.5 py-1.5 text-stone-100"
              >
                <option value="WITHDRAW_AT_2_DOWNED">
                  WITHDRAW_AT_2_DOWNED (Save Roster)
                </option>
                <option value="WITHDRAW_AT_3_DOWNED">
                  WITHDRAW_AT_3_DOWNED (Hold Longer)
                </option>
                <option value="NO_RETREAT_FIGHT_TO_LAST">
                  NO_RETREAT_FIGHT_TO_LAST
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
