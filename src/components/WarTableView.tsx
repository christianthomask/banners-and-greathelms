import React, { useState } from 'react';
import {
  Compass,
  Crown,
  Eye,
  Flame,
  Lock,
  MapPin,
  ScrollText,
  Shield,
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

interface WarTableViewProps {
  world: WorldState;
  selectedPerspective: 'BOTH' | 'CHRISTIAN' | 'HUNTER';
  setSelectedPerspective: (p: 'BOTH' | 'CHRISTIAN' | 'HUNTER') => void;
  onUpdateOrders: (
    companyKey: 'christian' | 'hunter',
    orders: DailyCommandOrders
  ) => void;
  onTriggerGreathelmClash: () => void;
  onRunDawnTick: () => void;
  onAdjustClock: (clockId: string, delta: number) => void;
}

/**
 * Renders a circular segmented Blades-in-the-Dark style Progress Clock
 */
const SegmentedClockSvg: React.FC<{
  segments: number;
  filled: number;
  color: string;
}> = ({ segments, filled, color }) => {
  const size = 56;
  const cx = size / 2;
  const cy = size / 2;
  const r = 22;

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
        fill={isFilled ? color : '#181613'}
        stroke="#3f382e"
        strokeWidth="1.5"
      />
    );
  }

  return (
    <svg width={size} height={size} className="shrink-0 drop-shadow">
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="#574c3d" strokeWidth="1" />
      {slices}
    </svg>
  );
};

export const WarTableView: React.FC<WarTableViewProps> = ({
  world,
  selectedPerspective,
  setSelectedPerspective,
  onUpdateOrders,
  onTriggerGreathelmClash,
  onRunDawnTick,
  onAdjustClock,
}) => {
  const [selectedHexId, setSelectedHexId] = useState<string>('03,02');
  const selectedHex: HexTile =
    world.hexes.find((h) => h.id === selectedHexId) || world.hexes[6];

  const chr = world.companies.christian;
  const hun = world.companies.hunter;

  const bothConvergingOnRedFord =
    chr.dailyOrders.marchOrder.targetHexId === hun.dailyOrders.marchOrder.targetHexId;

  // Convert axial/offset (q, r) to SVG pixel coordinates
  const getHexPixel = (q: number, r: number) => {
    const hexRadius = 46;
    const xOffset = r % 2 === 0 ? 40 : 0;
    const x = q * 92 + xOffset + 35;
    const y = r * 78 + 25;
    return { x, y, hexRadius };
  };

  const getPolygonPoints = (cx: number, cy: number, radius: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  const terrainColors: Record<HexTile['terrain'], string> = {
    KEEP: '#3b2f24',
    RIVER_FORD: '#172b36',
    SALT_MINE: '#2f3237',
    FOREST_ROAD: '#1e2b1e',
    ABBEY_RUINS: '#2d2036',
    HIGH_MOOR: '#2a2621',
    MARKET_TOWN: '#382c1e',
  };

  return (
    <div className="space-y-6">
      {/* TOP BANNER: THE DAWN CHRONICLE BROADSHEET */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#1a1612] via-[#211c15] to-[#1a1612] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 border border-amber-500/30">
              <ScrollText className="h-3.5 w-3.5" /> Dawn Broadsheet • Day {world.chronicle.day}
            </span>
            <span className="text-xs text-stone-400">
              Generated at 06:00 AM by MCP World Director
            </span>
          </div>

          {/* PERSPECTIVE SWITCHER (TEST ASYNC FOG / RAVEN WHISPERS) */}
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-900/90 p-1 border border-stone-700/70">
            <span className="px-2 text-[11px] font-medium text-stone-400 flex items-center gap-1">
              <Eye className="h-3 w-3" /> View As:
            </span>
            {(['BOTH', 'CHRISTIAN', 'HUNTER'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedPerspective(mode)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  selectedPerspective === mode
                    ? mode === 'CHRISTIAN'
                      ? 'bg-amber-600 text-stone-950'
                      : mode === 'HUNTER'
                      ? 'bg-red-600 text-white'
                      : 'bg-stone-200 text-stone-950'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {mode === 'BOTH'
                  ? 'Co-GM (Both)'
                  : mode === 'CHRISTIAN'
                  ? 'Christian (Vultures)'
                  : 'Hunter (Red Lance)'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 space-y-2">
            <h2
              className="text-lg sm:text-xl font-bold tracking-wide text-amber-200"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {world.chronicle.headline}
            </h2>
            <p className="text-sm text-stone-300">{world.chronicle.subhead}</p>
            <div className="pt-1 space-y-1">
              {world.chronicle.publicRumors.map((rumor, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-400">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rumor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVATE RAVEN DISPATCHES (INTERLOCKING MOTIVATIONS) */}
          <div className="lg:col-span-5 space-y-2.5">
            {(selectedPerspective === 'BOTH' || selectedPerspective === 'CHRISTIAN') && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/25 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                  <span>Private Raven → Christian (Iron Vultures)</span>
                  <Lock className="h-3 w-3" />
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed italic">
                  {world.chronicle.christianRavenWhisper}
                </p>
              </div>
            )}

            {(selectedPerspective === 'BOTH' || selectedPerspective === 'HUNTER') && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/25 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-red-300 mb-1">
                  <span>Private Raven → Hunter (The Red Lance)</span>
                  <Lock className="h-3 w-3" />
                </div>
                <p className="text-xs text-red-100/90 leading-relaxed italic">
                  {world.chronicle.hunterRavenWhisper}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLLISION ALERT BANNER WHEN ORDERS INTERSECT */}
      {bothConvergingOnRedFord && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-red-500/60 bg-gradient-to-r from-red-950/60 via-amber-950/50 to-red-950/60 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 border border-red-400/40 text-red-300">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-300">
                  Hex Collision Detected • Hex {chr.dailyOrders.marchOrder.targetHexId}
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  Opposing Contracts!
                </span>
              </div>
              <p className="text-sm text-stone-200">
                <strong>Christian’s Iron Vultures</strong> ({chr.dailyOrders.marchOrder.type}) and{' '}
                <strong>Hunter’s Red Lance</strong> ({hun.dailyOrders.marchOrder.type}) are both
                converging on <strong>The Red Ford Bridge</strong>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onTriggerGreathelmClash}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-950 shadow hover:brightness-110 transition cursor-pointer"
            >
              <Swords className="h-4 w-4" /> Zoom into Greathelm 6v6 Clash (Live or Auto-Resolve)
            </button>
          </div>
        </div>
      )}

      {/* MAIN GRID: LEFT HEXCRAWL MAP (7 COLS) + RIGHT DAILY ORDERS & INSPECTOR (5 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* HEXCRAWL MAP OF THE IRON MARCHES */}
        <div className="xl:col-span-7 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3
                className="text-base font-bold text-stone-100 flex items-center gap-2"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                <Compass className="h-4 w-4 text-amber-400" /> Hexcrawl Map: {world.regionName}
              </h3>
              <p className="text-xs text-stone-400">
                Click any hex to inspect Faction Assets, Rumors, or plot your Daily March Order.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" /> Iron Vultures
                ({chr.currentHexId})
              </span>
              <span className="flex items-center gap-1.5 text-red-300 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Red Lance (
                {hun.currentHexId})
              </span>
            </div>
          </div>

          {/* INTERACTIVE SVG HEX MAP */}
          <div className="relative w-full overflow-x-auto rounded-lg border border-stone-800/90 bg-[#0d0c09] p-2">
            <svg viewBox="0 0 560 310" className="w-full h-auto min-w-[480px] select-none">
              <defs>
                <marker
                  id="arrow-chr"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrow-hun"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
              </defs>

              {/* Blackwater River decorative curve through the river ford hexes */}
              <path
                d="M 310 15 Q 325 140 350 180 T 320 300"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="12"
                strokeOpacity="0.18"
                strokeLinecap="round"
              />

              {/* RENDER HEX TILES */}
              {world.hexes.map((hex) => {
                const { x, y, hexRadius } = getHexPixel(hex.q, hex.r);
                const isSelected = hex.id === selectedHexId;
                const faction = world.factions.find((f) => f.id === hex.controllingFactionId);
                const hasChristian = chr.currentHexId === hex.id;
                const hasHunter = hun.currentHexId === hex.id;
                const isTargetConflict =
                  chr.dailyOrders.marchOrder.targetHexId === hex.id &&
                  hun.dailyOrders.marchOrder.targetHexId === hex.id;

                const hexAssets = world.factions.flatMap((f) =>
                  f.assets
                    .filter((a) => a.hexId === hex.id)
                    .map((a) => ({ ...a, factionColor: f.color }))
                );

                return (
                  <g
                    key={hex.id}
                    onClick={() => setSelectedHexId(hex.id)}
                    className="cursor-pointer transition-opacity hover:opacity-95"
                  >
                    <polygon
                      points={getPolygonPoints(x, y, hexRadius - 2)}
                      fill={
                        hex.fogState === 'UNEXPLORED_BUFFER'
                          ? '#141311'
                          : terrainColors[hex.terrain]
                      }
                      stroke={
                        isSelected
                          ? '#fbbf24'
                          : isTargetConflict
                          ? '#ef4444'
                          : faction
                          ? faction.color
                          : '#3f3a32'
                      }
                      strokeWidth={isSelected ? 3 : isTargetConflict ? 2.5 : 1.5}
                      strokeDasharray={hex.fogState === 'UNEXPLORED_BUFFER' ? '4 3' : undefined}
                    />

                    {/* Hex Coordinate & Terrain Tag */}
                    <text
                      x={x}
                      y={y - 24}
                      textAnchor="middle"
                      fill="#a8a29e"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {hex.id} • {hex.terrain.replace('_', ' ')}
                    </text>

                    {/* Hex Name */}
                    <text
                      x={x}
                      y={y - 11}
                      textAnchor="middle"
                      fill={isSelected ? '#fde68a' : '#e7e5e4'}
                      fontSize="9.5"
                      fontWeight="700"
                    >
                      {hex.name.length > 18 ? hex.name.slice(0, 17) + '…' : hex.name}
                    </text>

                    {/* Faction Asset Pill */}
                    {hexAssets.map((asset, idx) => (
                      <g key={asset.id} transform={`translate(${x - 32}, ${y + 12 + idx * 12})`}>
                        <rect
                          width="64"
                          height="11"
                          rx="3"
                          fill="#0c0a09"
                          stroke={asset.factionColor}
                          strokeWidth="0.9"
                        />
                        <text
                          x="32"
                          y="8"
                          textAnchor="middle"
                          fill="#f5f5f4"
                          fontSize="7"
                          fontWeight="600"
                        >
                          ⚔ {asset.name.slice(0, 14)}
                        </text>
                      </g>
                    ))}

                    {/* Christian's Iron Vultures Token */}
                    {hasChristian && (
                      <g transform={`translate(${x - 22}, ${y - 2})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="11"
                          fill="#f59e0b"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#0c0a09"
                          fontSize="8.5"
                          fontWeight="800"
                        >
                          IV
                        </text>
                      </g>
                    )}

                    {/* Hunter's Red Lance Token */}
                    {hasHunter && (
                      <g transform={`translate(${x + 22}, ${y - 2})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="11"
                          fill="#ef4444"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8.5"
                          fontWeight="800"
                        >
                          RL
                        </text>
                      </g>
                    )}

                    {/* Flashpoint / Contested Target Marker */}
                    {isTargetConflict && (
                      <g transform={`translate(${x}, ${y + 2})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="10"
                          fill="#7f1d1d"
                          stroke="#fca5a5"
                          strokeWidth="1.5"
                        />
                        <text x="0" y="3.5" textAnchor="middle" fill="#fef2f2" fontSize="9">
                          ⚔
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* MARCH ORDER ARROWS FOR CHRISTIAN & HUNTER */}
              {(() => {
                const chrFrom = world.hexes.find((h) => h.id === chr.currentHexId);
                const chrTo = world.hexes.find(
                  (h) => h.id === chr.dailyOrders.marchOrder.targetHexId
                );
                const hunFrom = world.hexes.find((h) => h.id === hun.currentHexId);
                const hunTo = world.hexes.find(
                  (h) => h.id === hun.dailyOrders.marchOrder.targetHexId
                );

                return (
                  <>
                    {chrFrom && chrTo && chrFrom.id !== chrTo.id && (
                      <line
                        x1={getHexPixel(chrFrom.q, chrFrom.r).x - 10}
                        y1={getHexPixel(chrFrom.q, chrFrom.r).y}
                        x2={getHexPixel(chrTo.q, chrTo.r).x - 12}
                        y2={getHexPixel(chrTo.q, chrTo.r).y - 4}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        markerEnd="url(#arrow-chr)"
                      />
                    )}
                    {hunFrom && hunTo && hunFrom.id !== hunTo.id && (
                      <line
                        x1={getHexPixel(hunFrom.q, hunFrom.r).x + 10}
                        y1={getHexPixel(hunFrom.q, hunFrom.r).y}
                        x2={getHexPixel(hunTo.q, hunTo.r).x + 12}
                        y2={getHexPixel(hunTo.q, hunTo.r).y - 4}
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        markerEnd="url(#arrow-hun)"
                      />
                    )}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* SELECTED HEX INSPECTOR */}
          <div className="mt-3 rounded-lg border border-stone-800 bg-stone-900/70 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-sm text-amber-200">
                  Hex {selectedHex.id} — {selectedHex.name}
                </span>
                <span className="rounded bg-stone-800 px-2 py-0.5 text-[11px] font-mono text-stone-300">
                  {selectedHex.terrain}
                </span>
                <span className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-400">
                  {selectedHex.fogState}
                </span>
              </div>
              <span className="text-xs text-stone-400">
                Garrison: <strong className="text-stone-200">{selectedHex.garrisonStrength}</strong>
              </span>
            </div>
            <p className="mt-1.5 text-xs text-stone-300">{selectedHex.rumorHook}</p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  onUpdateOrders('christian', {
                    ...chr.dailyOrders,
                    marchOrder: {
                      ...chr.dailyOrders.marchOrder,
                      targetHexId: selectedHex.id,
                      note: `March Iron Vultures to ${selectedHex.name} (${selectedHex.id})`,
                    },
                  })
                }
                className="rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-200 transition cursor-pointer"
              >
                Plot Christian’s March → Hex {selectedHex.id}
              </button>
              <button
                onClick={() =>
                  onUpdateOrders('hunter', {
                    ...hun.dailyOrders,
                    marchOrder: {
                      ...hun.dailyOrders.marchOrder,
                      targetHexId: selectedHex.id,
                      note: `March Red Lance to ${selectedHex.name} (${selectedHex.id})`,
                    },
                  })
                }
                className="rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-200 transition cursor-pointer"
              >
                Plot Hunter’s March → Hex {selectedHex.id}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE 3 DAILY ORDERS BUDGET (10-15 MINS A DAY) */}
        <div className="xl:col-span-5 space-y-4">
          {/* CHRISTIAN'S COMPANY & 3 DAILY ORDERS */}
          {(selectedPerspective === 'BOTH' || selectedPerspective === 'CHRISTIAN') && (
            <div className="rounded-xl border border-amber-500/30 bg-[#16130f] p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <h4 className="font-bold text-amber-200 text-sm">
                      {chr.companyName} ({chr.commanderName})
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-400 italic">{chr.motto}</p>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="text-amber-300 font-bold">{chr.crowns} Crowns</div>
                  <div className="text-stone-400">
                    {chr.suppliesDays}d Supply • {chr.renown} Renown
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                  <span>Daily 3-Order Budget (Day {world.day})</span>
                  <span className="text-emerald-400">3 / 3 Pips Committed</span>
                </div>

                {/* Order 1: March */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-300">
                    <span>1. March Order → Hex {chr.dailyOrders.marchOrder.targetHexId}</span>
                    <select
                      value={chr.dailyOrders.marchOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('christian', {
                          ...chr.dailyOrders,
                          marchOrder: {
                            ...chr.dailyOrders.marchOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="CAUTIOUS_PATROL">CAUTIOUS_PATROL</option>
                      <option value="FAST_MARCH">FAST_MARCH</option>
                      <option value="AMBUSH_FORD">AMBUSH_FORD</option>
                      <option value="FORAGE_CAMP">FORAGE_CAMP</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {chr.dailyOrders.marchOrder.note}
                  </p>
                </div>

                {/* Order 2: Company */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-300">
                    <span>2. Company Order</span>
                    <select
                      value={chr.dailyOrders.companyOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('christian', {
                          ...chr.dailyOrders,
                          companyOrder: {
                            ...chr.dailyOrders.companyOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="ACCEPT_CONTRACT">ACCEPT_CONTRACT</option>
                      <option value="REPAIR_ARMOR_AND_HEAL">REPAIR_ARMOR_AND_HEAL</option>
                      <option value="FORTIFY_FIELD_CAMP">FORTIFY_FIELD_CAMP</option>
                      <option value="DEMAND_RANSOM_PARLEY">DEMAND_RANSOM_PARLEY</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {chr.dailyOrders.companyOrder.note}
                  </p>
                </div>

                {/* Order 3: Shadow / Political */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-300">
                    <span>3. Shadow / Political Order</span>
                    <select
                      value={chr.dailyOrders.shadowOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('christian', {
                          ...chr.dailyOrders,
                          shadowOrder: {
                            ...chr.dailyOrders.shadowOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="SCOUT_ADJACENT_RING">SCOUT_ADJACENT_RING</option>
                      <option value="BRIBE_LOCAL_BAILIFF">BRIBE_LOCAL_BAILIFF</option>
                      <option value="SECRET_FACTION_PARLEY">SECRET_FACTION_PARLEY</option>
                      <option value="SPREAD_RIVAL_SLANDER">SPREAD_RIVAL_SLANDER</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {chr.dailyOrders.shadowOrder.note}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HUNTER'S COMPANY & 3 DAILY ORDERS */}
          {(selectedPerspective === 'BOTH' || selectedPerspective === 'HUNTER') && (
            <div className="rounded-xl border border-red-500/30 bg-[#171111] p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <h4 className="font-bold text-red-200 text-sm">
                      {hun.companyName} ({hun.commanderName})
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-400 italic">{hun.motto}</p>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="text-red-300 font-bold">{hun.crowns} Crowns</div>
                  <div className="text-stone-400">
                    {hun.suppliesDays}d Supply • {hun.renown} Renown
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                  <span>Daily 3-Order Budget (Day {world.day})</span>
                  <span className="text-emerald-400">3 / 3 Pips Committed</span>
                </div>

                {/* Order 1: March */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-red-300">
                    <span>1. March Order → Hex {hun.dailyOrders.marchOrder.targetHexId}</span>
                    <select
                      value={hun.dailyOrders.marchOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('hunter', {
                          ...hun.dailyOrders,
                          marchOrder: {
                            ...hun.dailyOrders.marchOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="AMBUSH_FORD">AMBUSH_FORD</option>
                      <option value="FAST_MARCH">FAST_MARCH</option>
                      <option value="CAUTIOUS_PATROL">CAUTIOUS_PATROL</option>
                      <option value="FORAGE_CAMP">FORAGE_CAMP</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {hun.dailyOrders.marchOrder.note}
                  </p>
                </div>

                {/* Order 2: Company */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-red-300">
                    <span>2. Company Order</span>
                    <select
                      value={hun.dailyOrders.companyOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('hunter', {
                          ...hun.dailyOrders,
                          companyOrder: {
                            ...hun.dailyOrders.companyOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="ACCEPT_CONTRACT">ACCEPT_CONTRACT</option>
                      <option value="REPAIR_ARMOR_AND_HEAL">REPAIR_ARMOR_AND_HEAL</option>
                      <option value="FORTIFY_FIELD_CAMP">FORTIFY_FIELD_CAMP</option>
                      <option value="DEMAND_RANSOM_PARLEY">DEMAND_RANSOM_PARLEY</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {hun.dailyOrders.companyOrder.note}
                  </p>
                </div>

                {/* Order 3: Shadow */}
                <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-red-300">
                    <span>3. Shadow / Political Order</span>
                    <select
                      value={hun.dailyOrders.shadowOrder.type}
                      onChange={(e) =>
                        onUpdateOrders('hunter', {
                          ...hun.dailyOrders,
                          shadowOrder: {
                            ...hun.dailyOrders.shadowOrder,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="rounded bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200 border border-stone-700"
                    >
                      <option value="BRIBE_LOCAL_BAILIFF">BRIBE_LOCAL_BAILIFF</option>
                      <option value="SCOUT_ADJACENT_RING">SCOUT_ADJACENT_RING</option>
                      <option value="SECRET_FACTION_PARLEY">SECRET_FACTION_PARLEY</option>
                      <option value="SPREAD_RIVAL_SLANDER">SPREAD_RIVAL_SLANDER</option>
                    </select>
                  </div>
                  <p className="text-stone-400 mt-1 text-[11px]">
                    {hun.dailyOrders.shadowOrder.note}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POLITICS SECTION: BLADES PROGRESS CLOCKS & FACTION STANDINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4 POLITICAL CLOCKS */}
        <div className="lg:col-span-7 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3
                className="text-base font-bold text-stone-100 flex items-center gap-2"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                <Flame className="h-4 w-4 text-amber-400" /> Active Political Progress Clocks
              </h3>
              <p className="text-xs text-stone-400">
                Blades-in-the-Dark style clocks ticked daily by player contracts & the MCP World
                Director.
              </p>
            </div>
            <button
              onClick={onRunDawnTick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-200 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Advance to Day {world.day + 1} (MCP Tick)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {world.clocks.map((clock: PoliticalClock) => {
              const owner = world.factions.find((f) => f.id === clock.factionId);
              return (
                <div
                  key={clock.id}
                  className="flex items-start gap-3 rounded-lg border border-stone-800 bg-stone-900/75 p-3"
                >
                  <SegmentedClockSvg
                    segments={clock.segments}
                    filled={clock.filled}
                    color={owner?.color || '#f59e0b'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                        {clock.category} • Hex {clock.targetHexId}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {clock.filled}/{clock.segments}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-stone-100 mt-1 truncate">
                      {clock.title}
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2">
                      {clock.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-amber-200/80 truncate max-w-[170px]">
                        Full: {clock.completionEffect}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onAdjustClock(clock.id, -1)}
                          className="h-5 w-5 rounded bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 cursor-pointer"
                          title="Tick Clock -1"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onAdjustClock(clock.id, 1)}
                          className="h-5 w-5 rounded bg-stone-800 hover:bg-stone-700 text-xs font-bold text-amber-300 cursor-pointer"
                          title="Tick Clock +1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FACTION LEDGER & INTERLOCKING STANDINGS */}
        <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
          <div>
            <h3
              className="text-base font-bold text-stone-100 flex items-center gap-2"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <Crown className="h-4 w-4 text-amber-400" /> Realm Factions & Standing (-3 to +3)
            </h3>
            <p className="text-xs text-stone-400">
              Worlds Without Number stats (Force / Cunning / Wealth) + asymmetric company favor.
            </p>
          </div>

          <div className="space-y-2.5">
            {world.factions.map((fac) => (
              <div
                key={fac.id}
                className="rounded-lg border border-stone-800 bg-stone-900/75 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: fac.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-100">{fac.name}</h4>
                      <p className="text-[10px] text-stone-400">{fac.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 text-[10px] font-mono">
                    <span className="rounded bg-stone-800 px-1.5 py-0.5 text-red-300">
                      FRC {fac.stats.force}
                    </span>
                    <span className="rounded bg-stone-800 px-1.5 py-0.5 text-purple-300">
                      CUN {fac.stats.cunning}
                    </span>
                    <span className="rounded bg-stone-800 px-1.5 py-0.5 text-emerald-300">
                      WLT {fac.stats.wealth}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-300">
                  <strong className="text-stone-400">Active Goal:</strong> {fac.activeGoal}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80 text-[11px]">
                  <div className="flex items-center justify-between rounded bg-amber-950/20 px-2 py-1 border border-amber-500/20">
                    <span className="text-stone-300">Christian:</span>
                    <span
                      className={`font-mono font-bold ${
                        fac.standingWithChristian > 0
                          ? 'text-emerald-400'
                          : fac.standingWithChristian < 0
                          ? 'text-red-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {fac.standingWithChristian > 0
                        ? `+${fac.standingWithChristian}`
                        : fac.standingWithChristian}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-red-950/20 px-2 py-1 border border-red-500/20">
                    <span className="text-stone-300">Hunter:</span>
                    <span
                      className={`font-mono font-bold ${
                        fac.standingWithHunter > 0
                          ? 'text-emerald-400'
                          : fac.standingWithHunter < 0
                          ? 'text-red-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {fac.standingWithHunter > 0
                        ? `+${fac.standingWithHunter}`
                        : fac.standingWithHunter}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: INTERLOCKING MERCENARY CONTRACT BOARD & NAMED NEMESES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl">
          <h3
            className="text-base font-bold text-stone-100 flex items-center gap-2 mb-3"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            <Shield className="h-4 w-4 text-amber-400" /> Interlocking Mercenary Contracts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {world.contracts.map((c) => {
              const emp = world.factions.find((f) => f.id === c.employerFactionId);
              const isChr = c.visibility === 'EXCLUSIVE_CHRISTIAN_RAVEN';
              const isHun = c.visibility === 'EXCLUSIVE_HUNTER_RAVEN';

              return (
                <div
                  key={c.id}
                  className={`rounded-lg border p-3.5 space-y-2 ${
                    isChr
                      ? 'border-amber-500/40 bg-amber-950/15'
                      : isHun
                      ? 'border-red-500/40 bg-red-950/15'
                      : 'border-stone-800 bg-stone-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isChr
                          ? 'bg-amber-500/20 text-amber-300'
                          : isHun
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {c.visibility.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {c.rewardCrowns} Crowns
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-stone-100">{c.title}</h4>
                  <p className="text-xs text-stone-300">{c.objectiveSummary}</p>
                  <div className="rounded bg-stone-950/70 p-2 text-[11px] text-stone-400 space-y-1">
                    <div>
                      <strong className="text-stone-300">Employer:</strong> {emp?.name} •{' '}
                      <strong className="text-stone-300">Target:</strong> Hex {c.targetHexId}
                    </div>
                    <div>
                      <strong className="text-amber-300">Greathelm Scene:</strong>{' '}
                      {c.greathelmSceneName} ({c.greathelmSceneHazard})
                    </div>
                    <div>
                      <strong className="text-emerald-300">Political Clock Impact:</strong>{' '}
                      {c.politicalImpactSummary}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECURRING NAMED NEMESES */}
        <div className="lg:col-span-4 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
          <h3
            className="text-base font-bold text-stone-100 flex items-center gap-2"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            <Users className="h-4 w-4 text-red-400" /> Active Named Nemeses
          </h3>
          <p className="text-xs text-stone-400">
            Enemy knights who survive a Greathelm skirmish are promoted by the MCP Director with
            scars & vendettas.
          </p>
          <div className="space-y-3">
            {world.nemeses.map((nem) => (
              <div
                key={nem.id}
                className="rounded-lg border border-red-500/30 bg-gradient-to-b from-red-950/25 to-stone-900/90 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-300">{nem.name}</span>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-mono text-red-200">
                    Hex {nem.hexId}
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/90 font-medium">{nem.title}</div>
                <p className="text-[11px] text-stone-300">{nem.originStory}</p>
                <div className="rounded bg-stone-950/80 p-2 text-[10px] text-red-200 border border-red-500/20">
                  <strong>Vendetta Trait:</strong> {nem.signatureTrait}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
