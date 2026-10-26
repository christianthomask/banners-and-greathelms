import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Play,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { WorldState } from '../engine/initialWorldState';
import { McpWorldTickOutput } from '../schema/worldSchema';

interface McpDirectorViewProps {
  world: WorldState;
  lastMcpOutput: McpWorldTickOutput | null;
  onExecuteDawnTick: (customDirective?: string) => void;
}

export const McpDirectorView: React.FC<McpDirectorViewProps> = ({
  world,
  lastMcpOutput,
  onExecuteDawnTick,
}) => {
  const [customDirective, setCustomDirective] = useState<string>('');
  const unprocessed = world.eventLedger.filter((e) => !e.processedByMcp);

  return (
    <div className="space-y-6">
      {/* TOP BANNER: MCP WORLD DIRECTOR OVERVIEW */}
      <div className="rounded-xl border border-amber-500/30 bg-[#171410] p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                <Cpu className="h-3.5 w-3.5" /> Model Context Protocol (MCP) Backend
              </span>
              <span className="text-xs font-mono text-emerald-400">
                ● Zod Schema Validation Active
              </span>
            </div>
            <h2
              className="text-lg sm:text-xl font-bold text-stone-100 mt-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              The Daily Dawn Tick &amp; Agentic Story Engine
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-3xl">
              Point Rowan (<code className="text-amber-300">agy</code> /{' '}
              <code className="text-amber-300">codex</code>) or Claude at the MCP Server once a day.
              The agent reads the unprocessed <strong>Event Ledger</strong>, ticks{' '}
              <strong>Blades-style Political Clocks</strong>, spawns{' '}
              <strong>Interlocking Contracts</strong>, and promotes surviving knights into{' '}
              <strong>Named Nemeses</strong>—validated strictly by Zod so it populates into the
              game seamlessly.
            </p>
          </div>
        </div>

        {/* INTERACTIVE DAWN TICK SIMULATOR */}
        <div className="mt-4 pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={customDirective}
            onChange={(e) => setCustomDirective(e.target.value)}
            placeholder="Optional GM Director Note (e.g., 'An early winter blizzard freezes the Blackwater River...')"
            className="flex-1 rounded-lg bg-stone-900/90 border border-stone-700 px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => {
              onExecuteDawnTick(customDirective.trim() || undefined);
              setCustomDirective('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-950 shadow cursor-pointer shrink-0"
          >
            <Sparkles className="h-4 w-4" /> Run Daily MCP Dawn Tick (Day {world.day} → Day{' '}
            {world.day + 1})
          </button>
        </div>
      </div>

      {/* MIDDLE GRID: UNPROCESSED EVENT LEDGER (INPUT) + VALIDATED ZOD OUTPUT (OUTPUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: EVENT LEDGER RESOURCE */}
        <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" /> MCP Resource:{' '}
                <code className="text-amber-300 font-mono text-xs">
                  world://ledger/unprocessed-events
                </code>
              </h3>
              <p className="text-[11px] text-stone-400">
                Append-only action log fed to the MCP agent at Dawn cutoff.
              </p>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
              {unprocessed.length} Unprocessed
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {world.eventLedger.map((evt) => (
              <div
                key={evt.id}
                className={`rounded-lg border p-3 text-xs space-y-1 ${
                  evt.processedByMcp
                    ? 'border-stone-800/80 bg-stone-900/40 text-stone-400'
                    : 'border-amber-500/40 bg-amber-950/20 text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-stone-800 text-amber-300">
                    {evt.type}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {evt.timestamp} • {evt.processedByMcp ? '✓ Processed' : '● Pending MCP'}
                  </span>
                </div>
                <div className="font-semibold text-stone-200">
                  {evt.actor} (Hex {evt.hexId})
                </div>
                <p className="text-[11px] leading-relaxed">{evt.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: ZOD-VALIDATED MCP WORLD TICK OUTPUT */}
        <div className="lg:col-span-7 rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" /> Zod-Validated Tool Output:{' '}
                <code className="text-emerald-300 font-mono text-xs">
                  McpWorldTickOutputSchema
                </code>
              </h3>
              <p className="text-[11px] text-stone-400">
                If the agent’s response passes <code className="font-mono">.parse()</code>, the War
                Table populates automatically with zero human cleanup.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Schema Valid
            </span>
          </div>

          <pre className="rounded-lg border border-stone-800 bg-[#0b0a08] p-3.5 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-[420px] overflow-y-auto">
            {JSON.stringify(
              lastMcpOutput || {
                info: 'Click "Run Daily MCP Dawn Tick" above to execute a full cycle and inspect the validated JSON payload.',
                sampleToolsExposed: [
                  'run_daily_gm_tick({ directorNote? })',
                  'advance_political_clock({ clockId, delta, reason })',
                  'spawn_interlocking_contract({ contract })',
                  'promote_nemesis_knight({ nemesis })',
                ],
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {/* BOTTOM SECTION: HOW TO CONNECT ROWAN / CLAUDE CODE / CODEX TO THIS MCP SERVER */}
      <div className="rounded-xl border border-stone-800 bg-[#14120f] p-4 shadow-xl space-y-3">
        <h3
          className="text-sm font-bold text-amber-200 flex items-center gap-2"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          <Terminal className="h-4 w-4 text-amber-400" /> Connect Rowan (`agy` / `codex`) or Claude
          to the Included MCP Server (`mcp/server.ts`)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-stone-800 bg-stone-900/70 p-3 space-y-2">
            <div className="font-bold text-stone-200">1. MCP Client Configuration (JSON)</div>
            <pre className="rounded bg-stone-950 p-2.5 text-[11px] font-mono text-amber-200 overflow-x-auto">
{`{
  "mcpServers": {
    "banners-and-greathelms": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/home/ctk/Projects/banners-and-greathelms"
    }
  }
}`}
            </pre>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900/70 p-3 space-y-2">
            <div className="font-bold text-stone-200">
              2. Exposed MCP Resources &amp; Tools (`@modelcontextprotocol/sdk`)
            </div>
            <ul className="space-y-1.5 text-[11px] text-stone-300 font-mono">
              <li>
                <span className="text-sky-400">RESOURCE</span> world://guidelines/tone-and-rules
              </li>
              <li>
                <span className="text-sky-400">RESOURCE</span> world://state/factions-and-clocks
              </li>
              <li>
                <span className="text-sky-400">RESOURCE</span> world://ledger/unprocessed-events
              </li>
              <li>
                <span className="text-amber-400">TOOL</span> run_daily_gm_tick(directorNote?)
              </li>
              <li>
                <span className="text-amber-400">TOOL</span> advance_political_clock(clockId,
                delta, reason)
              </li>
              <li>
                <span className="text-amber-400">TOOL</span> spawn_interlocking_contract(contract)
              </li>
              <li>
                <span className="text-amber-400">TOOL</span> promote_nemesis_knight(nemesis)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
