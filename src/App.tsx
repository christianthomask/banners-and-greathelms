import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Cpu,
  Palette,
  RotateCcw,
  Shield,
  Swords,
} from 'lucide-react';
import { INITIAL_WORLD_STATE, WorldState } from './engine/initialWorldState';
import {
  GreathelmSimulationResult,
  simulateDoctrineGreathelmBattle,
} from './engine/greathelmEngine';
import {
  applyMcpDawnTickToWorld,
  generateMcpDawnTick,
} from './engine/mcpDirectorEngine';
import {
  DailyCommandOrders,
  McpWorldTickOutput,
  StandingDoctrine,
} from './schema/worldSchema';
import { WarTableView } from './components/WarTableView';
import { GreathelmArenaView } from './components/GreathelmArenaView';
import { McpDirectorView } from './components/McpDirectorView';
import { GddView } from './components/GddView';
import { ConceptGalleryView } from './components/ConceptGalleryView';

export function App() {
  const [activeTab, setActiveTab] = useState<
    | 'WAR_TABLE'
    | 'GREATHELM_ARENA'
    | 'MCP_DIRECTOR'
    | 'GDD'
    | 'CONCEPT_GALLERY'
  >('WAR_TABLE');

  const [world, setWorld] = useState<WorldState>(() =>
    structuredClone(INITIAL_WORLD_STATE)
  );
  const [selectedPerspective, setSelectedPerspective] = useState<
    'BOTH' | 'CHRISTIAN' | 'HUNTER'
  >('BOTH');

  const [lastSimulation, setLastSimulation] =
    useState<GreathelmSimulationResult>(() =>
      simulateDoctrineGreathelmBattle(
        INITIAL_WORLD_STATE.companies.christian,
        INITIAL_WORLD_STATE.companies.hunter,
        140302
      )
    );

  const [lastMcpOutput, setLastMcpOutput] =
    useState<McpWorldTickOutput | null>(null);

  const handleUpdateOrders = (
    companyKey: 'christian' | 'hunter',
    orders: DailyCommandOrders
  ) => {
    setWorld((prev) => ({
      ...prev,
      companies: {
        ...prev.companies,
        [companyKey]: {
          ...prev.companies[companyKey],
          dailyOrders: orders,
        },
      },
      eventLedger: [
        {
          id: `evt-ord-${Date.now()}`,
          day: prev.day,
          timestamp: 'Just now',
          type: 'HEX_ORDER_COMMITTED',
          actor:
            companyKey === 'christian'
              ? 'The Iron Vultures (Christian)'
              : 'The Red Lance (Hunter)',
          hexId: orders.marchOrder.targetHexId,
          summary: `Updated Daily Orders: [${orders.marchOrder.type} → ${orders.marchOrder.targetHexId}], [${orders.companyOrder.type}], [${orders.shadowOrder.type}].`,
          processedByMcp: false,
        },
        ...prev.eventLedger,
      ],
    }));
  };

  const handleUpdateDoctrine = (
    companyKey: 'christian' | 'hunter',
    doctrine: StandingDoctrine
  ) => {
    const nextCompanies = {
      ...world.companies,
      [companyKey]: {
        ...world.companies[companyKey],
        doctrine,
      },
    };
    setWorld((prev) => ({
      ...prev,
      companies: nextCompanies,
    }));
    // Immediately re-simulate auto-resolve with the updated Standing Doctrine
    const sim = simulateDoctrineGreathelmBattle(
      nextCompanies.christian,
      nextCompanies.hunter,
      Date.now()
    );
    setLastSimulation(sim);
  };

  const handleRunNewSimulation = (seed = Date.now()) => {
    const sim = simulateDoctrineGreathelmBattle(
      world.companies.christian,
      world.companies.hunter,
      seed
    );
    setLastSimulation(sim);
  };

  const handleCommitBattleToLedger = (sim: GreathelmSimulationResult) => {
    setWorld((prev) => ({
      ...prev,
      eventLedger: [
        {
          id: `evt-battle-${Date.now()}`,
          day: prev.day,
          timestamp: 'Just now',
          type: 'GREATHELM_BATTLE_RESOLVED',
          actor:
            sim.winner === 'CHRISTIAN'
              ? 'The Iron Vultures (Christian)'
              : 'The Red Lance (Hunter)',
          hexId: '03,02',
          summary: `Greathelm 6v6 Clash at Red Ford resolved in ${sim.roundsFought} rounds: ${sim.winReason} (${sim.casualtyReports.length} knights rolled on Post-Battle Ransom/Scar Table).`,
          processedByMcp: false,
        },
        ...prev.eventLedger,
      ],
    }));
    setActiveTab('MCP_DIRECTOR');
  };

  const handleExecuteDawnTick = (customDirective?: string) => {
    const tick = generateMcpDawnTick(world, lastSimulation, customDirective);
    setLastMcpOutput(tick);
    setWorld((prev) => applyMcpDawnTickToWorld(prev, tick, lastSimulation));
  };

  const handleAdjustClock = (clockId: string, delta: number) => {
    setWorld((prev) => ({
      ...prev,
      clocks: prev.clocks.map((c) =>
        c.id === clockId
          ? {
              ...c,
              filled: Math.max(0, Math.min(c.segments, c.filled + delta)),
            }
          : c
      ),
    }));
  };

  const handleResetDemo = () => {
    const fresh = structuredClone(INITIAL_WORLD_STATE);
    setWorld(fresh);
    setLastSimulation(
      simulateDoctrineGreathelmBattle(
        fresh.companies.christian,
        fresh.companies.hunter,
        140302
      )
    );
    setLastMcpOutput(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0c0a] text-[#e7e0d0] flex flex-col">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 border-b border-stone-800/90 bg-[#12100d]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-700 text-stone-950 shadow-md">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-base sm:text-lg font-extrabold tracking-wider text-amber-200"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  BANNERS &amp; GREATHELMS
                </h1>
                <span className="hidden sm:inline-block rounded bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-stone-700">
                  Day {world.day} • Iron Marches Prototype
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Async Mercenary Hexcrawl • Blades Clocks • 6v6 Greathelm Combat • MCP World Director
              </p>
            </div>
          </div>

          {/* 4 PILLAR TABS */}
          <nav className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('WAR_TABLE')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'WAR_TABLE'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Compass className="h-3.5 w-3.5" /> 1. War Table &amp; Politics
            </button>

            <button
              onClick={() => setActiveTab('GREATHELM_ARENA')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'GREATHELM_ARENA'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Swords className="h-3.5 w-3.5" /> 2. Greathelm 6v6 Arena
            </button>

            <button
              onClick={() => setActiveTab('MCP_DIRECTOR')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'MCP_DIRECTOR'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> 3. MCP Director &amp; Schemas
            </button>

            <button
              onClick={() => setActiveTab('GDD')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'GDD'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> 4. One-Page GDD
            </button>

            <button
              onClick={() => setActiveTab('CONCEPT_GALLERY')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'CONCEPT_GALLERY'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-amber-300 hover:bg-stone-800 border border-amber-500/40'
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> 5. Target Art &amp; Vision
            </button>

            <button
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2.5 py-2 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer"
              title="Reset Campaign State to Day 14"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {activeTab === 'WAR_TABLE' && (
          <WarTableView
            world={world}
            selectedPerspective={selectedPerspective}
            setSelectedPerspective={setSelectedPerspective}
            onUpdateOrders={handleUpdateOrders}
            onTriggerGreathelmClash={() => setActiveTab('GREATHELM_ARENA')}
            onRunDawnTick={() => {
              handleExecuteDawnTick();
            }}
            onAdjustClock={handleAdjustClock}
          />
        )}

        {activeTab === 'GREATHELM_ARENA' && (
          <GreathelmArenaView
            christian={world.companies.christian}
            hunter={world.companies.hunter}
            lastSimulation={lastSimulation}
            onUpdateDoctrine={handleUpdateDoctrine}
            onRunNewSimulation={handleRunNewSimulation}
            onCommitBattleToLedger={handleCommitBattleToLedger}
          />
        )}

        {activeTab === 'MCP_DIRECTOR' && (
          <McpDirectorView
            world={world}
            lastMcpOutput={lastMcpOutput}
            onExecuteDawnTick={handleExecuteDawnTick}
          />
        )}

        {activeTab === 'GDD' && <GddView />}

        {activeTab === 'CONCEPT_GALLERY' && (
          <ConceptGalleryView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
      </main>
    </div>
  );
}
export default App;
