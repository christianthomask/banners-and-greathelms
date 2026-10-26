import { z } from 'zod';

/**
 * 1. BLADES-IN-THE-DARK STYLE POLITICAL PROGRESS CLOCKS
 */
export const PoliticalClockSchema = z.object({
  id: z.string(),
  title: z.string(),
  factionId: z.string(),
  opposingFactionId: z.string().optional(),
  segments: z.union([z.literal(4), z.literal(6), z.literal(8)]),
  filled: z.number().int().min(0).max(8),
  category: z.enum(['SIEGE', 'SUCCESSION', 'TRADE_WAR', 'INQUISITION', 'VENDETTA']),
  description: z.string(),
  completionEffect: z.string(),
  targetHexId: z.string(),
});
export type PoliticalClock = z.infer<typeof PoliticalClockSchema>;

/**
 * 2. WORLDS-WITHOUT-NUMBER STYLE FACTION STATS & HEX ASSETS
 */
export const FactionAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['FORCE', 'CUNNING', 'WEALTH']),
  hexId: z.string(),
  hp: z.number().int().min(1).max(10),
  maxHp: z.number().int().min(1).max(10),
  description: z.string(),
});
export type FactionAsset = z.infer<typeof FactionAssetSchema>;

export const FactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  color: z.string(),
  bannerIcon: z.string(),
  stats: z.object({
    force: z.number().int().min(1).max(8),
    cunning: z.number().int().min(1).max(8),
    wealth: z.number().int().min(1).max(8),
  }),
  activeGoal: z.string(),
  standingWithChristian: z.number().int().min(-3).max(3),
  standingWithHunter: z.number().int().min(-3).max(3),
  assets: z.array(FactionAssetSchema),
});
export type Faction = z.infer<typeof FactionSchema>;

/**
 * 3. GREATHELM 6v6 KNIGHT & STANDING DOCTRINE SCHEMAS
 */
export const StandingDoctrineSchema = z.object({
  formation: z.enum(['SHIELDWALL', 'FLYING_WEDGE', 'REFUSED_FLANK', 'ENVELOPMENT']),
  highDicePriority: z.enum([
    'HEAVY_CLASH_EXECUTE',
    'MOMENTUM_FLANK_CHARGE',
    'GUARD_BANNERMAN',
  ]),
  lowDicePriority: z.enum([
    'SHIELD_BASH_STRIP_MOMENTUM',
    'TACTICAL_SHIFT_STEP',
    'BRACE_ARMOR_STANCE',
  ]),
  targetFocus: z.enum([
    'ENEMY_CAPTAIN_VIP',
    'WEAKEST_WOUNDED_KNIGHT',
    'ISOLATED_FLANKER',
  ]),
  retreatThreshold: z.enum([
    'WITHDRAW_AT_2_DOWNED',
    'WITHDRAW_AT_3_DOWNED',
    'NO_RETREAT_FIGHT_TO_LAST',
  ]),
});
export type StandingDoctrine = z.infer<typeof StandingDoctrineSchema>;

export const GreathelmKnightSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  role: z.enum([
    'CAPTAIN',
    'BANNERMAN',
    'CHAMPION',
    'BREAKER',
    'HALBERDIER',
    'SQUIRE',
  ]),
  weapon: z.string(),
  armorRating: z.number().int().min(2).max(5), // Target roll threshold / mitigation
  maxWounds: z.number().int().min(2).max(4),
  currentWounds: z.number().int().min(0).max(4),
  clashSkill: z.number().int().min(1).max(3),
  bashBonus: z.number().int().min(0).max(2),
  traits: z.array(z.string()),
  grudgeAgainstKnightId: z.string().optional(),
  status: z.enum(['READY', 'BATTERED_ARMOR', 'CAPTURED_FOR_RANSOM', 'SCARRED_VENDETTA']),
});
export type GreathelmKnight = z.infer<typeof GreathelmKnightSchema>;

/**
 * 4. PLAYER MERCENARY COMPANY & DAILY 3-ORDER BUDGET
 */
export const DailyCommandOrdersSchema = z.object({
  marchOrder: z.object({
    type: z.enum(['FAST_MARCH', 'CAUTIOUS_PATROL', 'AMBUSH_FORD', 'FORAGE_CAMP']),
    targetHexId: z.string(),
    note: z.string(),
  }),
  companyOrder: z.object({
    type: z.enum([
      'ACCEPT_CONTRACT',
      'REPAIR_ARMOR_AND_HEAL',
      'FORTIFY_FIELD_CAMP',
      'DEMAND_RANSOM_PARLEY',
    ]),
    referenceId: z.string(),
    note: z.string(),
  }),
  shadowOrder: z.object({
    type: z.enum([
      'SCOUT_ADJACENT_RING',
      'BRIBE_LOCAL_BAILIFF',
      'SECRET_FACTION_PARLEY',
      'SPREAD_RIVAL_SLANDER',
    ]),
    targetId: z.string(),
    note: z.string(),
  }),
  lockedIn: z.boolean(),
});
export type DailyCommandOrders = z.infer<typeof DailyCommandOrdersSchema>;

export const MercenaryCompanySchema = z.object({
  id: z.enum(['christian-company', 'hunter-company']),
  commanderName: z.enum(['Christian', 'Hunter']),
  companyName: z.string(),
  motto: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  currentHexId: z.string(),
  crowns: z.number().int(),
  suppliesDays: z.number().int(),
  renown: z.number().int(),
  reputationTags: z.array(z.string()),
  activeContractId: z.string().optional(),
  doctrine: StandingDoctrineSchema,
  lanceRoster: z.array(GreathelmKnightSchema).length(6),
  dailyOrders: DailyCommandOrdersSchema,
});
export type MercenaryCompany = z.infer<typeof MercenaryCompanySchema>;

/**
 * 5. INTERLOCKING MERCENARY CONTRACTS (PUBLIC & SECRET RAVEN OFFERS)
 */
export const InterlockingContractSchema = z.object({
  id: z.string(),
  title: z.string(),
  employerFactionId: z.string(),
  targetHexId: z.string(),
  visibility: z.enum(['PUBLIC_BOARD', 'EXCLUSIVE_CHRISTIAN_RAVEN', 'EXCLUSIVE_HUNTER_RAVEN']),
  rewardCrowns: z.number().int(),
  upfrontCrowns: z.number().int(),
  interlockingRivalContractId: z.string().optional(),
  objectiveSummary: z.string(),
  politicalImpactSummary: z.string(),
  greathelmSceneName: z.string(),
  greathelmSceneHazard: z.string(),
  enemyForceName: z.string(),
});
export type InterlockingContract = z.infer<typeof InterlockingContractSchema>;

/**
 * 6. HEX MAP TILE SCHEMA
 */
export const HexTileSchema = z.object({
  id: z.string(), // e.g., "02,02"
  q: z.number().int(),
  r: z.number().int(),
  name: z.string(),
  terrain: z.enum(['KEEP', 'RIVER_FORD', 'SALT_MINE', 'FOREST_ROAD', 'ABBEY_RUINS', 'HIGH_MOOR', 'MARKET_TOWN']),
  controllingFactionId: z.string().optional(),
  fogState: z.enum(['VISIBLE', 'SCOUTED_RING', 'UNEXPLORED_BUFFER']),
  rumorHook: z.string(),
  garrisonStrength: z.string(),
});
export type HexTile = z.infer<typeof HexTileSchema>;

/**
 * 7. EVENT LEDGER & MCP WORLD DIRECTOR PAYLOADS
 */
export const EventLedgerItemSchema = z.object({
  id: z.string(),
  day: z.number().int(),
  timestamp: z.string(),
  type: z.enum([
    'HEX_ORDER_COMMITTED',
    'CONTRACT_SIGNED',
    'GREATHELM_BATTLE_RESOLVED',
    'KNIGHT_RANSOMED_OR_SCARRED',
    'MCP_DAWN_TICK_EXECUTED',
  ]),
  actor: z.string(),
  hexId: z.string(),
  summary: z.string(),
  processedByMcp: z.boolean(),
});
export type EventLedgerItem = z.infer<typeof EventLedgerItemSchema>;

export const NamedNemesisSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  factionId: z.string(),
  grudgeTargetCompany: z.enum(['christian-company', 'hunter-company']),
  originStory: z.string(),
  signatureTrait: z.string(),
  hexId: z.string(),
});
export type NamedNemesis = z.infer<typeof NamedNemesisSchema>;

export const DawnChronicleSchema = z.object({
  day: z.number().int(),
  headline: z.string(),
  subhead: z.string(),
  publicRumors: z.array(z.string()),
  christianRavenWhisper: z.string(),
  hunterRavenWhisper: z.string(),
  factionMoveSummary: z.string(),
});
export type DawnChronicle = z.infer<typeof DawnChronicleSchema>;

export const McpWorldTickOutputSchema = z.object({
  newDay: z.number().int(),
  chronicle: DawnChronicleSchema,
  clockAdjustments: z.array(
    z.object({
      clockId: z.string(),
      delta: z.number().int().min(-2).max(2),
      reason: z.string(),
    })
  ),
  spawnedContracts: z.array(InterlockingContractSchema),
  promotedNemesis: NamedNemesisSchema.optional(),
});
export type McpWorldTickOutput = z.infer<typeof McpWorldTickOutputSchema>;
