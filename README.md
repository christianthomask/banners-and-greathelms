# Banners & Greathelms

**An Asynchronous "15-Minutes-a-Day" Chivalric Mercenary Campaign combining a Hexcrawl & Faction Politics War Table with *Greathelm* (6v6 Knight Micro-Skirmish) Combat and an MCP-Powered Agentic World Director.**

Built for **Christian & Hunter**.

## Four Core Pillars

1. **The War Table (`src/components/WarTableView.tsx`)**
   - **15 Minutes of Action, 24 Hours of Scheming:** Each player commands an independent Mercenary Company (*Christian's Iron Vultures* vs. *Hunter's Red Lance*) and commits **3 Daily Command Orders** (*1 March Order*, *1 Company Order*, *1 Shadow/Political Order*).
   - **Hybrid Politics:** Combines **Blades in the Dark Progress Clocks** (4/6/8 segments) with **Worlds Without Number Faction Turns** (*Force*, *Cunning*, *Wealth*, and physical Hex Assets).
   - **Interlocking Motivations:** Factions issue public contracts and private Raven Whispers that put player companies on asymmetric collision courses or uneasy joint sieges.

2. **The Greathelm 6v6 Arena & Doctrine Auto-Resolve (`src/components/GreathelmArenaView.tsx` & `src/engine/greathelmEngine.ts`)**
   - Models an **8.5" × 11" Tabletop Skirmish Arena** with 6 heavily armored knights per side, rolled **Initiative Dice Pools** (grouped 6s down to 1s), Momentum tokens, Shield Bashes (including bridge/river ring-outs), and Melee Clashes.
   - **Play Live or Doctrine Auto-Resolve:** Players can fight turn-by-turn live OR let their custom **Standing Tactical Doctrine** (*Formation*, *High/Low Dice Priority*, *Target Focus*, and *Mercenary Retreat Threshold*) simulate the battle deterministically and watch the **60-second animated replay**.
   - **Chivalric Post-Battle Table:** Downed knights roll for *Battered Plate*, *Blood Vendetta Scars*, or *Capture for Ransom*.

3. **The MCP World Director & Zod Schemas (`mcp/server.ts` & `src/schema/worldSchema.ts`)**
   - Shared **Zod** schemas validate both the frontend state and the `@modelcontextprotocol/sdk` server tools.
   - Point Rowan (`agy` / `codex`) or Claude at `npm run mcp` to read `world://ledger/unprocessed-events` and execute `run_daily_gm_tick`, `advance_political_clock`, `spawn_interlocking_contract`, and `promote_nemesis_knight`.

4. **One-Page Game Design Document (`docs/GDD.md` & `src/components/GddView.tsx`)**

## Quickstart

```bash
npm install
npm run dev      # Launch Web War Table & Greathelm Arena
npm run mcp      # Run stdio MCP Server for Agentic GM turns
```
