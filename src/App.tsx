import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Cpu,
  Palette,
  RotateCcw,
  Shield,
  Swords,
  Tent,
  Volume2,
  VolumeX,
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
  GreathelmKnight,
  McpWorldTickOutput,
  StandingDoctrine,
} from './schema/worldSchema';
import { WarTableView } from './components/WarTableView';
import { GreathelmArenaView } from './components/GreathelmArenaView';
import { CompanyPavilionView } from './components/CompanyPavilionView';
import { McpDirectorView } from './components/McpDirectorView';
import { GddView } from './components/GddView';
import { ConceptGalleryView } from './components/ConceptGalleryView';
import { soundEngine } from './utils/soundEngine';

export function App() {
  const [activeTab, setActiveTab] = useState<
    | 'WAR_TABLE'
    | 'GREATHELM_ARENA'
    | 'PAVILION'
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
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  const toggleSound = () => {
    const nextMuted = !soundMuted;
    soundEngine.muted = nextMuted;
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playIronClick();
    }
  };

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
    const sim = simulateDoctrineGreathelmBattle(
      nextCompanies.christian,
      nextCompanies.hunter,
      Date.now()
    );
    setLastSimulation(sim);
  };

  const handleUpdateKnight = (
    companyKey: 'christian' | 'hunter',
    knightId: string,
    updater: (k: GreathelmKnight) => GreathelmKnight,
    crownCost = 0,
    ledgerNote?: string
  ) => {
    const comp = world.companies[companyKey];
    const nextCompanies = {
      ...world.companies,
      [companyKey]: {
        ...comp,
        crowns: Math.max(0, comp.crowns - crownCost),
        lanceRoster: comp.lanceRoster.map((k) =>
          k.id === knightId ? updater(k) : k
        ),
      },
    };
    setWorld((prev) => ({
      ...prev,
      companies: nextCompanies,
      eventLedger: ledgerNote
        ? [
            {
              id: `evt-armory-${Date.now()}`,
              day: prev.day,
              timestamp: 'Just now',
              type: 'KNIGHT_RANSOMED_OR_SCARRED',
              actor: comp.companyName,
              hexId: comp.currentHexId,
              summary: ledgerNote,
              processedByMcp: false,
            },
            ...prev.eventLedger,
          ]
        : prev.eventLedger,
    }));
    setLastSimulation(
      simulateDoctrineGreathelmBattle(
        nextCompanies.christian,
        nextCompanies.hunter,
        Date.now()
      )
    );
  };

  const handleExecuteRansomAction = (
    companyKey: 'christian' | 'hunter',
    actionType: 'COLLECT_180_CROWNS' | 'SIGN_TRUCE_WRIT',
    summary: string
  ) => {
    const rivalKey = companyKey === 'christian' ? 'hunter' : 'christian';
    const crownGain = actionType === 'COLLECT_180_CROWNS' ? 180 : 0;

    setWorld((prev) => ({
      ...prev,
      companies: {
        ...prev.companies,
        [companyKey]: {
          ...prev.companies[companyKey],
          crowns: prev.companies[companyKey].crowns + crownGain,
        },
        [rivalKey]: {
          ...prev.companies[rivalKey],
          crowns: Math.max(0, prev.companies[rivalKey].crowns - crownGain),
        },
      },
      eventLedger: [
        {
          id: `evt-ransom-${Date.now()}`,
          day: prev.day,
          timestamp: 'Just now',
          type: 'KNIGHT_RANSOMED_OR_SCARRED',
          actor: prev.companies[companyKey].companyName,
          hexId: '03,02',
          summary,
          processedByMcp: false,
        },
        ...prev.eventLedger,
      ],
    }));
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
    soundEngine.playParchmentRustle();
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
      {/* TOP FORGED-IRON & CARVED-OAK NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 border-b-2 border-amber-500/30 bg-[#120f0b]/95 backdrop-blur shadow-2xl">
        <div className="mx-auto max-w-[1840px] px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-800 text-stone-950 shadow-lg border border-amber-300/60">
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
                <span className="hidden sm:inline-block rounded bg-stone-900 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                  Day {world.day} • Iron Marches Campaign
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                2.5D Hexcrawl • Greathelm Bridge Diorama • Milanese Armory &amp; Ransom • MCP World Director
              </p>
            </div>
          </div>

          {/* NAVIGATION TABS + FOLEY AUDIO TOGGLE */}
          <nav className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                soundEngine.playIronClick();
                setActiveTab('WAR_TABLE');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'WAR_TABLE'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Compass className="h-3.5 w-3.5" /> 1. War Table &amp; Map
            </button>

            <button
              onClick={() => {
                soundEngine.playIronClick();
                setActiveTab('GREATHELM_ARENA');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'GREATHELM_ARENA'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Swords className="h-3.5 w-3.5" /> 2. 6v6 Bridge Clash
            </button>

            <button
              onClick={() => {
                soundEngine.playParchmentRustle();
                setActiveTab('PAVILION');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'PAVILION'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-amber-200 hover:bg-stone-800 border border-amber-500/30'
              }`}
            >
              <Tent className="h-3.5 w-3.5" /> 3. Pavilion &amp; Ransom
            </button>

            <button
              onClick={() => {
                soundEngine.playIronClick();
                setActiveTab('MCP_DIRECTOR');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'MCP_DIRECTOR'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> 4. MCP Director
            </button>

            <button
              onClick={() => {
                soundEngine.playParchmentRustle();
                setActiveTab('GDD');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'GDD'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> 5. GDD
            </button>

            <button
              onClick={() => {
                soundEngine.playParchmentRustle();
                setActiveTab('CONCEPT_GALLERY');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'CONCEPT_GALLERY'
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow border border-amber-200'
                  : 'bg-stone-900 text-amber-300 hover:bg-stone-800 border border-amber-500/40'
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> 6. Concept Art
            </button>

            <button
              onClick={toggleSound}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs transition cursor-pointer ${
                soundMuted
                  ? 'bg-stone-950 border-stone-800 text-stone-500'
                  : 'bg-stone-900 border-amber-500/40 text-amber-300 hover:bg-stone-800'
              }`}
              title={soundMuted ? 'Unmute Medieval Foley Audio' : 'Mute Medieval Foley Audio'}
            >
              {soundMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
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

      {/* MAIN WIDESCREEN LANDSCAPE CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-[1840px] flex-1 px-3 sm:px-6 py-5">
        {activeTab === 'WAR_TABLE' && (
          <WarTableView
            world={world}
            selectedPerspective={selectedPerspective}
            setSelectedPerspective={setSelectedPerspective}
            onUpdateOrders={handleUpdateOrders}
            onTriggerGreathelmClash={() => setActiveTab('GREATHELM_ARENA')}
            onOpenPavilion={() => setActiveTab('PAVILION')}
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

        {activeTab === 'PAVILION' && (
          <CompanyPavilionView
            christian={world.companies.christian}
            hunter={world.companies.hunter}
            nemeses={world.nemeses}
            onUpdateDoctrine={handleUpdateDoctrine}
            onUpdateKnight={handleUpdateKnight}
            onExecuteRansomAction={handleExecuteRansomAction}
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
