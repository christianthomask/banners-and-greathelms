import {
  McpWorldTickOutput,
  McpWorldTickOutputSchema,
} from '../schema/worldSchema';
import { WorldState } from './initialWorldState';
import { GreathelmSimulationResult } from './greathelmEngine';

/**
 * Generates a schema-validated Daily MCP World Tick based on player Daily Orders,
 * unprocessed Event Ledger entries, and optional Greathelm Skirmish outcome.
 */
export function generateMcpDawnTick(
  state: WorldState,
  lastBattle: GreathelmSimulationResult | null,
  customDirective?: string
): McpWorldTickOutput {
  const nextDay = state.day + 1;
  const chrWon = !lastBattle || lastBattle.winner === 'CHRISTIAN';

  const rawPayload: McpWorldTickOutput = {
    newDay: nextDay,
    chronicle: {
      day: nextDay,
      headline: chrWon
        ? `IRON VULTURES FORCE THE RED FORD! MAGISTRATE CORVO REACHES VANE LINES!`
        : `RED LANCE AMBUSH SHATTERS ESCORT AT RED FORD! SALT LEDGERS SEIZED!`,
      subhead: customDirective
        ? `Director Note integrated: "${customDirective}" — Factions realign across Westmark.`
        : chrWon
        ? `Duke VaneTightens the noose around Oakhaven while the Salt League puts a bounty on Christian’s vanguard.`
        : `Merchant Factors celebrate at Redwatch Cross as House Vane marshals heavy bombards for retaliation.`,
      publicRumors: [
        chrWon
          ? `Tavern talk says Christian’s Iron Vultures held the stone bridge against Hunter’s wedge, earning 380 Crowns and Duke Vane’s personal signet.`
          : `Rumor spreads that Hunter’s Red Lance sprung a portcullis trap at Red Ford, seizing the tariff books and earning 420 Crowns from the Salt League.`,
        `The Chantry of St. Jude has advanced its Reliquary Inquisition clock; penitent outriders were seen scouting Hex 03,03 (Weeping Fen).`,
        `Pre-Generated Hex Buffer (05,02 — Smuggler's Weir) is now scouted: three flat-bottom salt barges lie lightly guarded in the reeds.`,
      ],
      christianRavenWhisper: chrWon
        ? `[SEAL OF HOUSE VANE] "Well struck at the Ford, Captain Christian. Now we breach Oakhaven's walls. Bring your lance to the Muddy Siege Approach (02,01) tomorrow—or strike Hunter's supply wagons at Brine-Cart Road (04,03) for 450 Crowns."`
        : `[SEAL OF THE CHANTRY] "Bloodied at the river, Captain Christian? The Bishopric offers 460 Crowns if your Iron Vultures seize the Salt League's Smuggler Weir (05,02) while Hunter counts his coin."`,
      hunterRavenWhisper: chrWon
        ? `[SEAL OF THE SALT LEAGUE] "Corvo slipped through, Captain Hunter, but House Vane's Bombard Train at (02,01) is exposed! Spike their guns tomorrow for 480 Crowns—and take your revenge."`
        : `[SEAL OF THE SALT LEAGUE] "The tariff ledgers are ours, Captain Hunter! Hold Red Ford (03,02) for one more day or raid Castellan's Keep outriders—500 Crowns on the barrelhead."`,
      factionMoveSummary: chrWon
        ? `Faction Turn Day ${nextDay}: [House Vane's Siege of Oakhaven] advances +1 (5/6). [Gilded League Salt Monopoly] drops -1 (2/4). [Inquisition of Ashwood] advances +1 (3/6).`
        : `Faction Turn Day ${nextDay}: [Gilded League Salt Monopoly] advances +1 (4/4 — COMPLETED!). [House Vane's Siege of Oakhaven] stalls -1 (3/6). [Blood Contested at Red Ford] advances +1 (4/4).`,
    },
    clockAdjustments: [
      {
        clockId: 'clock-siege-oakhaven',
        delta: chrWon ? 1 : -1,
        reason: chrWon
          ? 'Christian delivered Magistrate Corvo with the siege tax rolls.'
          : 'Hunter intercepted the Magistrate, starving Vane’s siege treasury.',
      },
      {
        clockId: 'clock-salt-embargo',
        delta: chrWon ? -1 : 1,
        reason: chrWon
          ? 'Tariff ledger exposed the Salt League’s smuggling routes.'
          : 'Salt League secured complete control of the Blackwater river tolls.',
      },
      {
        clockId: 'clock-chantry-crusade',
        delta: 1,
        reason: 'Autonomous Faction Turn: Sir Morholt recruited zealous novices at the Abbey.',
      },
    ],
    spawnedContracts: [
      {
        id: `contract-day-${nextDay}-smugglers`,
        title: 'Raid the Barges at Smuggler’s Weir',
        employerFactionId: 'faction-chantry',
        targetHexId: '05,02',
        visibility: 'PUBLIC_BOARD',
        rewardCrowns: 460,
        upfrontCrowns: 90,
        interlockingRivalContractId: `contract-day-${nextDay}-defend-weir`,
        objectiveSummary:
          'Burn the contraband salt barges hidden in the reeds at Hex 05,02 before the League can move them.',
        politicalImpactSummary:
          'Reduces [Gilded League Salt Monopoly] by -2 and grants +1 Chantry Standing.',
        greathelmSceneName: 'The Plank-Walks of Smuggler’s Weir',
        greathelmSceneHazard: 'Narrow Timber Gangplanks & Deep Marsh',
        enemyForceName: 'League Barge Marines (or Rival Player Lance)',
      },
      {
        id: `contract-day-${nextDay}-defend-weir`,
        title: 'Guard the Contraband Fleet at Smuggler’s Weir',
        employerFactionId: 'faction-league',
        targetHexId: '05,02',
        visibility: 'EXCLUSIVE_HUNTER_RAVEN',
        rewardCrowns: 490,
        upfrontCrowns: 110,
        interlockingRivalContractId: `contract-day-${nextDay}-smugglers`,
        objectiveSummary:
          'Deploy 6 knights to the timber docks at Hex 05,02 and repel any raiders sent by the Chantry or House Vane.',
        politicalImpactSummary:
          'Locks in League Wealth +1 and awards a Masterwork Milanese Breastplate.',
        greathelmSceneName: 'The Plank-Walks of Smuggler’s Weir',
        greathelmSceneHazard: 'Narrow Timber Gangplanks & Deep Marsh',
        enemyForceName: 'Iron Vultures / Chantry Raiders',
      },
    ],
    promotedNemesis: {
      id: `nemesis-day-${nextDay}`,
      name: chrWon ? 'Bram the River-Drowned' : 'Sir Aldric the Bridge-Burner',
      title: chrWon ? 'Vengeful Red-Ford Survivor' : 'Bloodied Vulture Veteran',
      factionId: chrWon ? 'faction-league' : 'faction-vane',
      grudgeTargetCompany: chrWon ? 'christian-company' : 'hunter-company',
      originStory: chrWon
        ? `Washed down the Blackwater River after Day ${state.day}’s clash at Red Ford; fished out by salt smugglers and fitted with spiked river-plate.`
        : `Carried off the Red Ford bridge on a shattered shield on Day ${state.day}; swore a blood-oath against Hunter’s Flying Wedge.`,
      signatureTrait:
        'Bridge-Grudge (+1 Initiative Die reroll & +1 Bash push distance when fighting at River Fords)',
      hexId: '03,02',
    },
  };

  // Strict Zod Schema validation — guarantees MCP Agent output matches engine contract
  return McpWorldTickOutputSchema.parse(rawPayload);
}

/**
 * Applies the validated MCP World Tick output to the deterministic WorldState
 */
export function applyMcpDawnTickToWorld(
  state: WorldState,
  tick: McpWorldTickOutput,
  lastBattle: GreathelmSimulationResult | null
): WorldState {
  const chrWon = !lastBattle || lastBattle.winner === 'CHRISTIAN';

  const updatedClocks = state.clocks.map((clock) => {
    const adj = tick.clockAdjustments.find((a) => a.clockId === clock.id);
    if (!adj) return clock;
    const nextFilled = Math.max(0, Math.min(clock.segments, clock.filled + adj.delta));
    return { ...clock, filled: nextFilled };
  });

  const updatedHexes = state.hexes.map((h) => {
    if (h.id === '05,02') {
      return {
        ...h,
        fogState: 'SCOUTED_RING' as const,
        garrisonStrength: 'League Barge Marines (6 Knights)',
      };
    }
    return h;
  });

  const processedLedger = state.eventLedger.map((e) => ({
    ...e,
    processedByMcp: true,
  }));

  processedLedger.unshift({
    id: `evt-dawn-${tick.newDay}`,
    day: tick.newDay,
    timestamp: `Day ${tick.newDay} — 06:00 Dawn Tick`,
    type: 'MCP_DAWN_TICK_EXECUTED',
    actor: 'MCP World Director (Zod-Validated)',
    hexId: '03,02',
    summary: `${tick.chronicle.headline} | Spawned ${tick.spawnedContracts.length} new contracts & promoted Nemesis [${tick.promotedNemesis?.name}].`,
    processedByMcp: true,
  });

  return {
    ...state,
    day: tick.newDay,
    chronicle: tick.chronicle,
    clocks: updatedClocks,
    hexes: updatedHexes,
    companies: {
      christian: {
        ...state.companies.christian,
        currentHexId: '03,02',
        crowns: state.companies.christian.crowns + (chrWon ? 380 : 60) - 35,
        suppliesDays: Math.max(1, state.companies.christian.suppliesDays - 1),
        renown: state.companies.christian.renown + (chrWon ? 3 : 1),
      },
      hunter: {
        ...state.companies.hunter,
        currentHexId: '03,02',
        crowns: state.companies.hunter.crowns + (!chrWon ? 420 : 75) - 35,
        suppliesDays: Math.max(1, state.companies.hunter.suppliesDays - 1),
        renown: state.companies.hunter.renown + (!chrWon ? 3 : 1),
      },
    },
    contracts: [...tick.spawnedContracts, ...state.contracts.slice(0, 2)],
    nemeses: tick.promotedNemesis
      ? [tick.promotedNemesis, ...state.nemeses]
      : state.nemeses,
    eventLedger: processedLedger,
  };
}
