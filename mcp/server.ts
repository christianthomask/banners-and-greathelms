import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { INITIAL_WORLD_STATE, WorldState } from '../src/engine/initialWorldState.js';
import {
  InterlockingContractSchema,
  NamedNemesisSchema,
} from '../src/schema/worldSchema.js';
import { simulateDoctrineGreathelmBattle } from '../src/engine/greathelmEngine.js';
import {
  applyMcpDawnTickToWorld,
  generateMcpDawnTick,
} from '../src/engine/mcpDirectorEngine.js';

let worldState: WorldState = structuredClone(INITIAL_WORLD_STATE);

const server = new McpServer({
  name: 'banners-and-greathelms-mcp',
  version: '0.1.0',
});

/**
 * MCP RESOURCES — Read-only context for Rowan / Claude / Codex
 */
server.resource(
  'tone-and-rules',
  'world://guidelines/tone-and-rules',
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'text/markdown',
        text: `# Banners & Greathelms — MCP World Director Guidelines
1. **Low-Fantasy Chivalric Mercenary Tone:** Grounded feudal politics, muddy sieges, salt tariffs, ransom parleys, and scarred knights.
2. **Engine Owns Math; Agent Owns Consequences:** Never invent illegal stat blocks. Use Political Clocks (4/6/8 segments) and Faction Standing (-3 to +3).
3. **Interlocking Motivations:** Whenever spawning contracts for Christian's Iron Vultures and Hunter's Red Lance, create asymmetric hooks (e.g., Escort vs. Intercept, Joint Siege with Prestige Split, or Ransom Leverage).
4. **Greathelm 6v6 Scale:** Every combat scene takes place on an 8.5"x11" arena with 6 knights per side, Initiative Dice Pools (6s down to 1s), Momentum tokens, Shield Bashes, and Melee Clashes.`,
      },
    ],
  })
);

server.resource(
  'factions-and-clocks',
  'world://state/factions-and-clocks',
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(
          {
            day: worldState.day,
            clocks: worldState.clocks,
            factions: worldState.factions,
            companies: {
              christian: {
                companyName: worldState.companies.christian.companyName,
                hex: worldState.companies.christian.currentHexId,
                crowns: worldState.companies.christian.crowns,
                doctrine: worldState.companies.christian.doctrine,
                dailyOrders: worldState.companies.christian.dailyOrders,
              },
              hunter: {
                companyName: worldState.companies.hunter.companyName,
                hex: worldState.companies.hunter.currentHexId,
                crowns: worldState.companies.hunter.crowns,
                doctrine: worldState.companies.hunter.doctrine,
                dailyOrders: worldState.companies.hunter.dailyOrders,
              },
            },
          },
          null,
          2
        ),
      },
    ],
  })
);

server.resource(
  'unprocessed-events',
  'world://ledger/unprocessed-events',
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(
          worldState.eventLedger.filter((e) => !e.processedByMcp),
          null,
          2
        ),
      },
    ],
  })
);

/**
 * MCP TOOLS — Strict Zod-Validated World Progression Tools
 */
server.tool(
  'run_daily_gm_tick',
  'Executes the daily Dawn Tick: resolves pending Greathelm collisions via Standing Doctrines, advances Political Clocks, and publishes the new Dawn Chronicle.',
  {
    directorNote: z
      .string()
      .optional()
      .describe('Optional narrative twist or focus for today’s Dawn Chronicle'),
  },
  async ({ directorNote }) => {
    const battle = simulateDoctrineGreathelmBattle(
      worldState.companies.christian,
      worldState.companies.hunter
    );
    const tickOutput = generateMcpDawnTick(worldState, battle, directorNote);
    worldState = applyMcpDawnTickToWorld(worldState, tickOutput, battle);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'DAWN_TICK_COMMITTED',
              newDay: worldState.day,
              battleSummary: {
                winner: battle.winner,
                winReason: battle.winReason,
                casualties: battle.casualtyReports,
              },
              tickOutput,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  'advance_political_clock',
  'Ticks a Blades-in-the-Dark style Political Progress Clock forward or backward (-2 to +2).',
  {
    clockId: z.string(),
    delta: z.number().int().min(-2).max(2),
    reason: z.string(),
  },
  async ({ clockId, delta, reason }) => {
    const clock = worldState.clocks.find((c) => c.id === clockId);
    if (!clock) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Clock ${clockId} not found.` }],
      };
    }
    clock.filled = Math.max(0, Math.min(clock.segments, clock.filled + delta));
    worldState.eventLedger.unshift({
      id: `evt-clock-${Date.now()}`,
      day: worldState.day,
      timestamp: new Date().toISOString(),
      type: 'MCP_DAWN_TICK_EXECUTED',
      actor: 'MCP Agent Tool',
      hexId: clock.targetHexId,
      summary: `Clock [${clock.title}] adjusted by ${delta >= 0 ? `+${delta}` : delta} (${clock.filled}/${clock.segments}): ${reason}`,
      processedByMcp: true,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ updatedClock: clock, reason }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'spawn_interlocking_contract',
  'Populates a Zod-validated mercenary contract onto the War Table or dispatches it via private Raven.',
  {
    contract: InterlockingContractSchema,
  },
  async ({ contract }) => {
    worldState.contracts.unshift(contract);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { status: 'CONTRACT_SPAWNED', contract },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  'promote_nemesis_knight',
  'Promotes a surviving enemy knight into a recurring Named Nemesis with a personal grudge against Christian or Hunter.',
  {
    nemesis: NamedNemesisSchema,
  },
  async ({ nemesis }) => {
    worldState.nemeses.unshift(nemesis);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { status: 'NEMESIS_PROMOTED', nemesis },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Banners & Greathelms MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
