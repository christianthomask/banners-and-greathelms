import React, { useState } from 'react';
import {
  ChevronRight,
  Compass,
  Eye,
  Flame,
  MapPin,
  ScrollText,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { WorldState } from '../engine/initialWorldState';
import {
  DailyCommandOrders,
  HexTile,
  PoliticalClock,
} from '../schema/worldSchema';
import { soundEngine } from '../utils/soundEngine';
import { MountedCaptainMiniature } from './GreathelmPuppetRenderer';

interface WarTableViewProps {
  world: WorldState;
  selectedPerspective: 'BOTH' | 'CHRISTIAN' | 'HUNTER';
  setSelectedPerspective: (p: 'BOTH' | 'CHRISTIAN' | 'HUNTER') => void;
  onUpdateOrders: (
    companyKey: 'christian' | 'hunter',
    orders: DailyCommandOrders
  ) => void;
  onTriggerGreathelmClash: () => void;
  onOpenPavilion: () => void;
  onRunDawnTick: () => void;
  onAdjustClock: (clockId: string, delta: number) => void;
}

/**
 * Brass & Iron Segmented Political Progress Clock (matching Concept #2 top-right HUD)
 */
const SegmentedClockSvg: React.FC<{
  segments: number;
  filled: number;
  color: string;
  size?: number;
}> = ({ segments, filled, color, size = 62 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.39;

  const slices = [];
  for (let i = 0; i < segments; i++) {
    const startAngle = (i * 2 * Math.PI) / segments - Math.PI / 2;
    const endAngle = ((i + 1) * 2 * Math.PI) / segments - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const isFilled = i < filled;

    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
    slices.push(
      <path
        key={i}
        d={pathData}
        fill={isFilled ? color : '#171411'}
        stroke="#6b5335"
        strokeWidth="1.8"
      />
    );
  }

  return (
    <svg width={size} height={size} className="shrink-0 drop-shadow-md">
      <circle
        cx={cx}
        cy={cy}
        r={r + 3}
        fill="#0d0b09"
        stroke="#a17c48"
        strokeWidth="2"
      />
      {slices}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.48}
        fill="#16130f"
        stroke="#8c6d43"
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="#fde68a"
        fontSize="11"
        fontWeight="800"
        fontFamily="Cinzel, serif"
      >
        {filled}/{segments}
      </text>
    </svg>
  );
};

export const WarTableView: React.FC<WarTableViewProps> = ({
  world,
  selectedPerspective,
  setSelectedPerspective,
  onUpdateOrders,
  onTriggerGreathelmClash,
  onOpenPavilion,
  onRunDawnTick,
  onAdjustClock,
}) => {
  const [selectedHexId, setSelectedHexId] = useState<string>('03,02');
  const [activeOrderCompany, setActiveOrderCompany] = useState<
    'christian' | 'hunter'
  >('christian');
  const [, setOpenedSeal] = useState<'ALL' | 'CHRISTIAN' | 'HUNTER'>('ALL');

  const selectedHex: HexTile =
    world.hexes.find((h) => h.id === selectedHexId) || world.hexes[6];

  const chr = world.companies.christian;
  const hun = world.companies.hunter;
  const orderCompany = activeOrderCompany === 'christian' ? chr : hun;

  // Widescreen 1536x780 Isometric 2.5D Hex Projection
  const getIsoHexPixel = (q: number, r: number) => {
    const hexW = 260;
    const hexH = 195;
    const xOffset = r % 2 === 0 ? 118 : 0;
    const x = q * hexW + xOffset + 125;
    const y = r * hexH + 108;
    return { x, y };
  };

  const getIsoHexPolygon = (cx: number, cy: number, rx = 124, ry = 92) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="space-y-7">
      {/* =====================================================================
          WIDESCREEN 2.5D PAINTED ISOMETRIC HEXCRAWL MAP & INSET CLOCKS
          ===================================================================== */}
      <div className="forged-iron-frame rounded-xl overflow-hidden shadow-2xl">
        {/* TOP STRATEGY HUD BAR (MATCHING CONCEPT #2) */}
        <div className="bg-[#120e0a]/95 px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#6b5335]">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-amber-400" />
            <div>
              <h3
                className="text-base sm:text-lg font-extrabold text-amber-200 tracking-wider"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                THE IRON MARCHES — WIDESCREEN 2.5D CAMPAIGN MAP
              </h3>
              <p className="text-[11px] text-stone-400">
                Click any hex landmark to inspect garrisons or plot Christian &amp; Hunter’s
                Cavalry March Vectors.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-stone-950/90 p-1 border border-[#574a36]">
              <span className="px-2 text-[11px] font-medium text-stone-400 flex items-center gap-1">
                <Eye className="h-3 w-3" /> View:
              </span>
              {(['BOTH', 'CHRISTIAN', 'HUNTER'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    soundEngine.playIronClick();
                    setSelectedPerspective(mode);
                    if (mode === 'CHRISTIAN') setActiveOrderCompany('christian');
                    if (mode === 'HUNTER') setActiveOrderCompany('hunter');
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    selectedPerspective === mode
                      ? mode === 'CHRISTIAN'
                        ? 'bg-amber-500 text-stone-950'
                        : mode === 'HUNTER'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-200 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {mode === 'BOTH'
                    ? 'Co-GM (Both)'
                    : mode === 'CHRISTIAN'
                    ? 'Iron Vultures'
                    : 'Red Lance'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundEngine.playWarhorn();
                onRunDawnTick();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 px-3 py-1.5 text-xs font-bold text-amber-200 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Execute Dawn MCP Tick (Day {world.day + 1})
            </button>
          </div>
        </div>

        {/* INTERACTIVE WIDESCREEN 2.5D PAINTED MAP VIEWPORT WITH HOLLOW IRON FRAME & CORNER BOSSES */}
        <div className="relative bg-[#0d110d]">
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

          {/* LEFT FACTION HERALDIC SHIELD COLUMN (CONCEPT #2) */}
          <div className="hidden md:flex flex-col gap-2.5 absolute left-7 top-16 z-30 bg-stone-950/90 border-2 border-[#6b5335] rounded-xl p-2.5 shadow-2xl backdrop-blur-sm">
            {world.factions.map((fac) => (
              <div
                key={fac.id}
                title={`${fac.name}: ${fac.activeGoal}`}
                className="group relative flex flex-col items-center p-1.5 rounded-lg border border-stone-800 hover:border-amber-400 bg-stone-900/90 cursor-pointer"
              >
                <div
                  className="h-9 w-8 rounded-b-full border-2 border-amber-200/70 flex items-center justify-center font-black text-xs text-stone-950 shadow"
                  style={{ backgroundColor: fac.color }}
                >
                  {fac.name.slice(0, 1)}
                </div>
                <span className="text-[9px] font-mono text-stone-300 mt-1">
                  {fac.standingWithChristian >= 0
                    ? `+${fac.standingWithChristian}`
                    : fac.standingWithChristian}
                  /{fac.standingWithHunter >= 0
                    ? `+${fac.standingWithHunter}`
                    : fac.standingWithHunter}
                </span>
              </div>
            ))}
          </div>

          {/* TOP-RIGHT INSET POLITICAL PROGRESS CLOCKS BOX (CONCEPT #2) */}
          <div className="md:absolute right-7 top-6 z-30 bg-[#14100b]/92 border-2 border-[#8c6d43] rounded-xl p-3 shadow-2xl backdrop-blur-sm max-w-full md:max-w-[360px]">
            <div
              className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200 text-center border-b border-[#574a36] pb-1.5 mb-2"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Political Progress Clocks
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {world.clocks.slice(0, 2).map((clock) => {
                const owner = world.factions.find((f) => f.id === clock.factionId);
                return (
                  <div
                    key={clock.id}
                    className="flex items-center gap-2 rounded-lg bg-stone-950/85 border border-[#4a3f31] p-1.5"
                  >
                    <SegmentedClockSvg
                      segments={clock.segments}
                      filled={clock.filled}
                      color={owner?.color || '#f59e0b'}
                      size={52}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-amber-100 leading-tight line-clamp-2">
                        {clock.title}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => {
                            soundEngine.playIronClick();
                            onAdjustClock(clock.id, -1);
                          }}
                          className="h-4 w-4 rounded bg-stone-800 hover:bg-stone-700 text-[10px] font-bold text-stone-300 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onClick={() => {
                            soundEngine.playIronClick();
                            onAdjustClock(clock.id, 1);
                          }}
                          className="h-4 w-4 rounded bg-stone-800 hover:bg-stone-700 text-[10px] font-bold text-amber-300 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2.5D PAINTED ISOMETRIC WIDESCREEN SVG OVERLAY ON PAINTED TERRAIN */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 1536 780"
              className="w-full h-auto min-w-[780px] select-none block"
            >
              <defs>
                <filter
                  id="miniatureShadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="7"
                    stdDeviation="5"
                    floodColor="#000000"
                    floodOpacity="0.88"
                  />
                </filter>
                <marker
                  id="iso-arrow-chr"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                </marker>
                <marker
                  id="iso-arrow-hun"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
                <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Layer 1: Painted 2.5D Widescreen Terrain Backdrop */}
              <image
                href="/assets/iron-marches-painted-terrain.png"
                x="0"
                y="-90"
                width="1536"
                height="1024"
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                x="0"
                y="0"
                width="1536"
                height="780"
                fill="#0c0a08"
                fillOpacity="0.20"
              />

              {/* Layer 2: Subtle Gold/Iron Isometric Hexagonal Grid & Landmarks */}
              {world.hexes.map((hex) => {
                const { x, y } = getIsoHexPixel(hex.q, hex.r);
                const isSelected = hex.id === selectedHexId;
                const isConflict =
                  chr.dailyOrders.marchOrder.targetHexId === hex.id &&
                  hun.dailyOrders.marchOrder.targetHexId === hex.id;

                return (
                  <g
                    key={hex.id}
                    onClick={() => {
                      soundEngine.playIronClick();
                      setSelectedHexId(hex.id);
                    }}
                    className="cursor-pointer group"
                  >
                    <polygon
                      points={getIsoHexPolygon(x, y, 124, 90)}
                      fill={
                        isSelected
                          ? 'rgba(251, 191, 36, 0.16)'
                          : isConflict
                          ? 'rgba(239, 68, 68, 0.20)'
                          : hex.fogState === 'UNEXPLORED_BUFFER'
                          ? 'rgba(10, 10, 10, 0.62)'
                          : 'rgba(0, 0, 0, 0.06)'
                      }
                      stroke={
                        isSelected
                          ? '#fde047'
                          : isConflict
                          ? '#ef4444'
                          : '#d97706'
                      }
                      strokeOpacity={isSelected || isConflict ? 0.95 : 0.45}
                      strokeWidth={isSelected ? 4 : isConflict ? 3.5 : 2}
                      strokeDasharray={
                        hex.fogState === 'UNEXPLORED_BUFFER' ? '8 6' : undefined
                      }
                    />

                    {/* Siege Fire Glow on Oakhaven (02,02) & Muddy Bombards (02,01) */}
                    {(hex.id === '02,02' || hex.id === '02,01') && (
                      <circle cx={x} cy={y - 16} r="68" fill="url(#fire-glow)" />
                    )}

                    {/* Parchment Ribbon Label on Map */}
                    <g transform={`translate(${x}, ${y + 48})`}>
                      <rect
                        x="-98"
                        y="-14"
                        width="196"
                        height="28"
                        rx="5"
                        fill="#e6d2aa"
                        stroke="#5c4020"
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#23170b"
                        fontSize="14"
                        fontWeight="800"
                        fontFamily="Cinzel, serif"
                      >
                        {hex.name}
                      </text>
                    </g>

                    {/* Red Ford Flashpoint Crossed Swords Icon */}
                    {isConflict && (
                      <g transform={`translate(${x}, ${y - 12})`}>
                        <circle
                          r="24"
                          fill="#7f1d1d"
                          stroke="#fde047"
                          strokeWidth="3"
                        />
                        <text
                          x="0"
                          y="7"
                          textAnchor="middle"
                          fill="#fef2f2"
                          fontSize="21"
                        >
                          ⚔
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Layer 3: Plotted Dashed March Arrows (Concept #2) */}
              {(() => {
                const chrFrom = world.hexes.find(
                  (h) => h.id === chr.currentHexId
                );
                const chrTo = world.hexes.find(
                  (h) => h.id === chr.dailyOrders.marchOrder.targetHexId
                );
                const hunFrom = world.hexes.find(
                  (h) => h.id === hun.currentHexId
                );
                const hunTo = world.hexes.find(
                  (h) => h.id === hun.dailyOrders.marchOrder.targetHexId
                );

                return (
                  <>
                    {chrFrom && chrTo && chrFrom.id !== chrTo.id && (
                      <path
                        d={`M ${getIsoHexPixel(chrFrom.q, chrFrom.r).x} ${
                          getIsoHexPixel(chrFrom.q, chrFrom.r).y
                        } Q ${
                          (getIsoHexPixel(chrFrom.q, chrFrom.r).x +
                            getIsoHexPixel(chrTo.q, chrTo.r).x) /
                          2
                        } ${
                          getIsoHexPixel(chrTo.q, chrTo.r).y + 42
                        } ${getIsoHexPixel(chrTo.q, chrTo.r).x - 28} ${
                          getIsoHexPixel(chrTo.q, chrTo.r).y - 12
                        }`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="6"
                        strokeDasharray="14 8"
                        markerEnd="url(#iso-arrow-chr)"
                      />
                    )}
                    {hunFrom && hunTo && hunFrom.id !== hunTo.id && (
                      <path
                        d={`M ${getIsoHexPixel(hunFrom.q, hunFrom.r).x} ${
                          getIsoHexPixel(hunFrom.q, hunFrom.r).y
                        } Q ${
                          (getIsoHexPixel(hunFrom.q, hunFrom.r).x +
                            getIsoHexPixel(hunTo.q, hunTo.r).x) /
                          2
                        } ${
                          getIsoHexPixel(hunTo.q, hunTo.r).y + 42
                        } ${getIsoHexPixel(hunTo.q, hunTo.r).x + 28} ${
                          getIsoHexPixel(hunTo.q, hunTo.r).y - 12
                        }`}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="6"
                        strokeDasharray="14 8"
                        markerEnd="url(#iso-arrow-hun)"
                      />
                    )}
                  </>
                );
              })()}

              {/* Layer 4: Painted 2.5D Mounted Warhorse Captain Miniatures */}
              {(() => {
                const chrHex = world.hexes.find((h) => h.id === chr.currentHexId);
                const hunHex = world.hexes.find((h) => h.id === hun.currentHexId);
                return (
                  <>
                    {chrHex && (
                      <g
                        transform={`translate(${
                          getIsoHexPixel(chrHex.q, chrHex.r).x - 42
                        }, ${getIsoHexPixel(chrHex.q, chrHex.r).y - 8})`}
                        onClick={() => {
                          soundEngine.playIronClick();
                          setSelectedHexId(chrHex.id);
                        }}
                      >
                        <MountedCaptainMiniature
                          side="CHRISTIAN"
                          label="THE IRON VULTURES"
                          sublabel="Capt. Christian • 6 Knights"
                        />
                      </g>
                    )}
                    {hunHex && (
                      <g
                        transform={`translate(${
                          getIsoHexPixel(hunHex.q, hunHex.r).x + 42
                        }, ${getIsoHexPixel(hunHex.q, hunHex.r).y - 8})`}
                        onClick={() => {
                          soundEngine.playIronClick();
                          setSelectedHexId(hunHex.id);
                        }}
                      >
                        <MountedCaptainMiniature
                          side="HUNTER"
                          label="THE RED LANCE"
                          sublabel="Capt. Hunter • 6 Knights"
                        />
                      </g>
                    )}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* BOTTOM CARVED-OAK COMMAND BAR & SELECTED HEX DETAILS (CONCEPT #2) */}
          <div className="bg-[#16110c] p-3.5 border-t-2 border-[#6b5335] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-stone-900 border border-[#785c38] flex items-center justify-center text-amber-400 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-sm text-amber-200"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Hex {selectedHex.id} — {selectedHex.name}
                  </span>
                  <span className="rounded bg-stone-900 px-2 py-0.5 text-[10px] font-mono text-stone-300 border border-stone-700">
                    {selectedHex.garrisonStrength}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5">
                  {selectedHex.rumorHook}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  onUpdateOrders('christian', {
                    ...chr.dailyOrders,
                    marchOrder: {
                      ...chr.dailyOrders.marchOrder,
                      targetHexId: selectedHex.id,
                      note: `March Iron Vultures to ${selectedHex.name} (${selectedHex.id})`,
                    },
                  });
                }}
                className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 px-3 py-1.5 text-xs font-bold text-amber-200 transition cursor-pointer"
              >
                Plot Christian’s March → {selectedHex.id}
              </button>

              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  onUpdateOrders('hunter', {
                    ...hun.dailyOrders,
                    marchOrder: {
                      ...hun.dailyOrders.marchOrder,
                      targetHexId: selectedHex.id,
                      note: `March Red Lance to ${selectedHex.name} (${selectedHex.id})`,
                    },
                  });
                }}
                className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 px-3 py-1.5 text-xs font-bold text-red-200 transition cursor-pointer"
              >
                Plot Hunter’s March → {selectedHex.id}
              </button>

              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  onOpenPavilion();
                }}
                className="rounded-lg bg-stone-800 hover:bg-stone-700 border border-[#6b5335] px-3 py-1.5 text-xs font-bold text-amber-100 transition cursor-pointer"
              >
                Open Company Pavilion &amp; Paperdoll →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MILESTONE 1: THE STRONGHOLD WAR-TENT DESK (BROADSHEET + 3 DAILY ORDERS)
          ===================================================================== */}
      <div className="forged-iron-frame rounded-xl p-4 sm:p-6 shadow-2xl">
        {/* Desk Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#574a36] pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded bg-amber-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40">
              <ScrollText className="h-3.5 w-3.5" /> Captain’s Oak War-Table • Day{' '}
              {world.chronicle.day}
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">
              06:00 AM Dawn Broadsheet &amp; 3-Order Command Ledger
            </span>
          </div>
        </div>

        {/* DESK GRID: LEFT PARCHMENT BROADSHEET & WAX RAVENS (8 COLS) + RIGHT IRON 3-ORDER SIDEBAR (4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: DIEGETIC PARCHMENT BROADSHEET + WAX-SEALED RAVEN DISPATCHES */}
          <div className="lg:col-span-8 space-y-4">
            <div className="parchment-sheet rounded-xl p-4 sm:p-6 relative">
              {/* Masthead */}
              <div className="border-b-2 border-[#5c4020] pb-3 text-center">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-[#5c4020]">
                  <span>VOL. XIV • WESTMARK PRESS</span>
                  <span>DAY {world.chronicle.day} OF THE CAMPAIGN</span>
                  <span>PRICE: ONE COPPER</span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-black tracking-wider text-[#1f140a] mt-1"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  Banners <span className="text-red-800">&amp;</span> Greathelms
                </h2>
                <div
                  className="text-sm sm:text-base font-bold tracking-[0.22em] uppercase text-[#3d2914] border-t border-[#8c6d43] mt-1 pt-1"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  THE DAWN CHRONICLE
                </div>
              </div>

              {/* Lead Headline */}
              <div className="my-3 text-center border-b border-[#8c6d43] pb-3">
                <h3
                  className="text-base sm:text-lg font-extrabold text-[#23170b]"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {world.chronicle.headline}
                </h3>
                <p className="text-xs sm:text-sm italic text-[#4a3319] mt-0.5">
                  {world.chronicle.subhead}
                </p>
              </div>

              {/* 3 WOODCUT ILLUSTRATED NEWSPAPER COLUMNS (MATCHING CONCEPT #1) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:border-r border-[#8c6d43]/60 md:pr-3">
                  <div
                    className="text-xs font-extrabold uppercase text-[#23170b] text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Siege in the North
                  </div>
                  <img
                    src="/assets/woodcut-alliance.webp"
                    alt="Woodcut Alliance"
                    className="w-full h-28 object-cover rounded border border-[#6b5030] sepia-[.25] contrast-125"
                  />
                  <p className="text-[11px] leading-relaxed text-[#2b1d0e]">
                    {world.chronicle.publicRumors[0]}
                  </p>
                </div>

                <div className="space-y-1.5 md:border-r border-[#8c6d43]/60 md:pr-3">
                  <div
                    className="text-xs font-extrabold uppercase text-[#23170b] text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Red Ford Skirmish Escalates
                  </div>
                  <img
                    src="/assets/woodcut-skirmish.webp"
                    alt="Woodcut Skirmish"
                    className="w-full h-28 object-cover rounded border border-[#6b5030] sepia-[.25] contrast-125"
                  />
                  <p className="text-[11px] leading-relaxed text-[#2b1d0e]">
                    {world.chronicle.publicRumors[1]}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div
                    className="text-xs font-extrabold uppercase text-[#23170b] text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Mercenaries in Demand
                  </div>
                  <img
                    src="/assets/woodcut-fields.webp"
                    alt="Woodcut Fields"
                    className="w-full h-28 object-cover rounded border border-[#6b5030] sepia-[.25] contrast-125"
                  />
                  <p className="text-[11px] leading-relaxed text-[#2b1d0e]">
                    {world.chronicle.publicRumors[2]}
                  </p>
                </div>
              </div>
            </div>

            {/* WAX-SEALED PRIVATE RAVEN DISPATCHES ON THE OAK DESK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedPerspective === 'BOTH' ||
                selectedPerspective === 'CHRISTIAN') && (
                <div
                  onClick={() => {
                    soundEngine.playWaxSealCrack();
                    setOpenedSeal('CHRISTIAN');
                  }}
                  className="parchment-sheet rounded-xl p-3.5 relative cursor-pointer hover:brightness-105 transition"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src="/assets/wax-seal-amber.webp"
                      alt="Amber Wax Seal"
                      className="h-14 w-14 rounded-full object-contain drop-shadow-md shrink-0"
                    />
                    <div>
                      <div
                        className="text-xs font-extrabold uppercase tracking-wider text-amber-950"
                        style={{ fontFamily: 'Cinzel, serif' }}
                      >
                        Raven Dispatch • Christian’s Iron Vultures
                      </div>
                      <p className="text-xs italic text-[#2b1d0e] mt-1 leading-relaxed">
                        {world.chronicle.christianRavenWhisper}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(selectedPerspective === 'BOTH' ||
                selectedPerspective === 'HUNTER') && (
                <div
                  onClick={() => {
                    soundEngine.playWaxSealCrack();
                    setOpenedSeal('HUNTER');
                  }}
                  className="parchment-sheet rounded-xl p-3.5 relative cursor-pointer hover:brightness-105 transition"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src="/assets/wax-seal-crimson.webp"
                      alt="Crimson Wax Seal"
                      className="h-14 w-14 rounded-full object-contain drop-shadow-md shrink-0"
                    />
                    <div>
                      <div
                        className="text-xs font-extrabold uppercase tracking-wider text-red-950"
                        style={{ fontFamily: 'Cinzel, serif' }}
                      >
                        Raven Dispatch • Hunter’s Red Lance
                      </div>
                      <p className="text-xs italic text-[#2b1d0e] mt-1 leading-relaxed">
                        {world.chronicle.hunterRavenWhisper}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: FORGED-IRON "3 DAILY COMMAND ORDERS" SIDEBAR (MATCHING CONCEPT #1) */}
          <div className="lg:col-span-4 carved-oak-panel rounded-xl p-4 space-y-3.5">
            {/* Ornate Header Plaque */}
            <div className="parchment-sheet rounded-lg py-2 px-3 text-center">
              <div
                className="text-sm sm:text-base font-extrabold text-[#23170b]"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                3 Daily Command Orders
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5c4020]">
                15-Minute Daily Captain’s Budget
              </div>
            </div>

            {/* Company Selector Pill inside Sidebar */}
            <div className="grid grid-cols-2 gap-1.5 bg-stone-950 p-1 rounded-lg border border-[#4a3f31]">
              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  setActiveOrderCompany('christian');
                }}
                className={`rounded py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeOrderCompany === 'christian'
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Iron Vultures ({chr.crowns}c)
              </button>
              <button
                onClick={() => {
                  soundEngine.playIronClick();
                  setActiveOrderCompany('hunter');
                }}
                className={`rounded py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeOrderCompany === 'hunter'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Red Lance ({hun.crowns}c)
              </button>
            </div>

            {/* MEDALLION SLOT 1: MARCH ORDER */}
            <div className="cast-iron-slot rounded-xl p-2.5 flex items-center gap-3">
              <img
                src="/assets/medallion-march.webp"
                alt="March Order Medallion"
                className="h-16 w-16 rounded-full border-2 border-amber-500/70 object-cover shrink-0 shadow-md"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold text-amber-100"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    March Order
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    → Hex {orderCompany.dailyOrders.marchOrder.targetHexId}
                  </span>
                </div>
                <select
                  value={orderCompany.dailyOrders.marchOrder.type}
                  onChange={(e) => {
                    soundEngine.playIronClick();
                    onUpdateOrders(activeOrderCompany, {
                      ...orderCompany.dailyOrders,
                      marchOrder: {
                        ...orderCompany.dailyOrders.marchOrder,
                        type: e.target.value as DailyCommandOrders['marchOrder']['type'],
                      },
                    });
                  }}
                  className="w-full rounded bg-stone-900 border border-[#6b5335] px-2 py-1 text-xs font-semibold text-amber-200"
                >
                  <option value="CAUTIOUS_PATROL">Cautious Patrol</option>
                  <option value="FAST_MARCH">Fast Forced March</option>
                  <option value="AMBUSH_FORD">Set Bridge Ambush</option>
                  <option value="FORAGE_CAMP">Forage &amp; Encamp</option>
                </select>
                <p className="text-[10px] text-stone-400 truncate">
                  {orderCompany.dailyOrders.marchOrder.note}
                </p>
              </div>
            </div>

            {/* MEDALLION SLOT 2: COMPANY ORDER */}
            <div className="cast-iron-slot rounded-xl p-2.5 flex items-center gap-3">
              <img
                src="/assets/medallion-company.webp"
                alt="Company Order Medallion"
                className="h-16 w-16 rounded-full border-2 border-amber-500/70 object-cover shrink-0 shadow-md"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold text-amber-100"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Company Order
                  </span>
                  <ChevronRight className="h-4 w-4 text-amber-400" />
                </div>
                <select
                  value={orderCompany.dailyOrders.companyOrder.type}
                  onChange={(e) => {
                    soundEngine.playIronClick();
                    onUpdateOrders(activeOrderCompany, {
                      ...orderCompany.dailyOrders,
                      companyOrder: {
                        ...orderCompany.dailyOrders.companyOrder,
                        type: e.target.value as DailyCommandOrders['companyOrder']['type'],
                      },
                    });
                  }}
                  className="w-full rounded bg-stone-900 border border-[#6b5335] px-2 py-1 text-xs font-semibold text-amber-200"
                >
                  <option value="ACCEPT_CONTRACT">Sign &amp; Execute Contract</option>
                  <option value="REPAIR_ARMOR_AND_HEAL">
                    Smithy Armor Repair &amp; Heal
                  </option>
                  <option value="FORTIFY_FIELD_CAMP">Fortify Field Stakes</option>
                  <option value="DEMAND_RANSOM_PARLEY">
                    Demand Prisoner Ransom
                  </option>
                </select>
                <p className="text-[10px] text-stone-400 truncate">
                  {orderCompany.dailyOrders.companyOrder.note}
                </p>
              </div>
            </div>

            {/* MEDALLION SLOT 3: SHADOW ORDER */}
            <div className="cast-iron-slot rounded-xl p-2.5 flex items-center gap-3">
              <img
                src="/assets/medallion-shadow.webp"
                alt="Shadow Order Medallion"
                className="h-16 w-16 rounded-full border-2 border-amber-500/70 object-cover shrink-0 shadow-md"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold text-amber-100"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    Shadow Order
                  </span>
                  <ChevronRight className="h-4 w-4 text-amber-400" />
                </div>
                <select
                  value={orderCompany.dailyOrders.shadowOrder.type}
                  onChange={(e) => {
                    soundEngine.playIronClick();
                    onUpdateOrders(activeOrderCompany, {
                      ...orderCompany.dailyOrders,
                      shadowOrder: {
                        ...orderCompany.dailyOrders.shadowOrder,
                        type: e.target.value as DailyCommandOrders['shadowOrder']['type'],
                      },
                    });
                  }}
                  className="w-full rounded bg-stone-900 border border-[#6b5335] px-2 py-1 text-xs font-semibold text-amber-200"
                >
                  <option value="SCOUT_ADJACENT_RING">Scout Adjacent Hex Ring</option>
                  <option value="BRIBE_LOCAL_BAILIFF">
                    Bribe Red Ford Toll-Keeper
                  </option>
                  <option value="SECRET_FACTION_PARLEY">
                    Secret Faction Parley
                  </option>
                  <option value="SPREAD_RIVAL_SLANDER">
                    Sow Rival Company Slander
                  </option>
                </select>
                <p className="text-[10px] text-stone-400 truncate">
                  {orderCompany.dailyOrders.shadowOrder.note}
                </p>
              </div>
            </div>

            {/* Lock-In Seal Button */}
            <button
              onClick={() => {
                soundEngine.playWaxSealCrack();
                onTriggerGreathelmClash();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-stone-950 shadow-lg cursor-pointer transition"
            >
              <Swords className="h-4 w-4" /> Resolve Red Ford Collision (6v6 Greathelm)
            </button>
          </div>
        </div>
      </div>

      {/* ALL 4 POLITICAL CLOCKS + INTERLOCKING CONTRACTS SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 forged-iron-frame rounded-xl p-4 space-y-3">
          <h3
            className="text-sm font-bold text-amber-200 flex items-center gap-2 uppercase tracking-wider"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            <Flame className="h-4 w-4 text-amber-400" /> All Active Realm Progress Clocks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {world.clocks.map((clock: PoliticalClock) => {
              const owner = world.factions.find((f) => f.id === clock.factionId);
              return (
                <div
                  key={clock.id}
                  className="flex items-start gap-3 rounded-lg border border-[#4a3f31] bg-stone-950/80 p-3"
                >
                  <SegmentedClockSvg
                    segments={clock.segments}
                    filled={clock.filled}
                    color={owner?.color || '#f59e0b'}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-800">
                      {clock.category} • Hex {clock.targetHexId}
                    </span>
                    <h4 className="font-bold text-xs text-stone-100 mt-1 truncate">
                      {clock.title}
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2">
                      {clock.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 forged-iron-frame rounded-xl p-4 space-y-3">
          <h3
            className="text-sm font-bold text-amber-200 flex items-center gap-2 uppercase tracking-wider"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            <Users className="h-4 w-4 text-red-400" /> Active Named Nemeses &amp; Grudges
          </h3>
          <div className="space-y-2.5">
            {world.nemeses.map((nem) => (
              <div
                key={nem.id}
                className="rounded-lg border border-red-500/30 bg-gradient-to-r from-red-950/30 to-stone-950 p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold text-red-300"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {nem.name} — {nem.title}
                  </span>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-mono text-red-200">
                    Hex {nem.hexId}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300">{nem.originStory}</p>
                <div className="text-[10px] text-amber-300 font-medium">
                  ★ {nem.signatureTrait}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
