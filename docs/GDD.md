# Banners & Greathelms — One-Page Game Design Document (GDD)
**Authors:** Christian & Hunter  
**Core Pitch:** *An asynchronous, "15 minutes of daily play, 24 hours of scheming" chivalric mercenary campaign combining a **Mount & Blade / Battle Brothers** hexcrawl & faction politics layer with **Greathelm** (6v6 micro-skirmish) tactical combat and an **MCP-powered Daily AI Game Master**.*

---

## 1. Core Pillars

1. **15 Minutes of Action, 24 Hours of Scheming:**
   - Rather than requiring 4-hour live tabletop sessions, the campaign runs on a **Daily Heartbeat**.
   - Every player commands their own independent **Mercenary Company** on a shared hex map (*Christian's Iron Vultures* vs. *Hunter's Red Lance*).
   - You spend **10–15 minutes** each day reading the morning broadsheet, negotiating contracts, adjusting your knights' tactical doctrines, and locking in **3 Daily Command Orders**. The rest of the day, the strategic tension lives rent-free in your head.
2. **Interlocking Mercenary Politics (Rivals, Allies, or Profiteers):**
   - Warring Noble Houses, Merchant Leagues, and Bishoprics operate on a hybrid of **Blades in the Dark Progress Clocks** (4, 6, or 8 segments) and **Worlds Without Number Faction Turns** (*Force*, *Cunning*, *Wealth*, and physical Hex Assets).
   - Factions generate **asymmetric, interlocking contracts**—putting player companies on collision courses, uneasy joint sieges, or shadow bidding wars without forcing immediate campaign-ending annihilation.
3. **Zoomed-In *Greathelm* 6v6 Micro-Skirmishes + Doctrine Auto-Resolve:**
   - When companies or faction warbands collide on a hex, combat zooms into an **8.5" × 11" Greathelm Arena**: **6 heavily armored knights per side**, rolled **Initiative Dice Pools** (grouped 6s down to 1s), Momentum tokens, Bashes, and Melee Clashes.
   - **Live or Doctrine Auto-Resolve:** Defending players are notified when a battle triggers. If both players can jump in during the resolution window, they play it live (or turn-by-turn). If not, the engine runs a **deterministic round-by-round Greathelm simulation** governed by each captain's custom **Standing Tactical Doctrine** and saves a **60-second visual replay**.
4. **The MCP World Director (Schema-Constrained Agentic GM):**
   - The deterministic game engine owns all math, hex movement, gold, and combat rolls.
   - Once a day (at the Dawn Tick), an MCP Agent reads the unprocessed **Event Ledger** and uses strict **Zod-validated MCP tools** to advance political clocks, write the *Dawn Broadsheet*, whisper private raven offers, populate unexplored hex rings ahead of player movement, and promote surviving enemy knights into recurring **Named Nemeses**.

---

## 2. The Daily Gameplay Loop

| Phase | Timing | What Happens |
| :--- | :--- | :--- |
| **I. The Dawn Tick** | **06:00 AM Daily** | Deterministic engine resolves yesterday's marches, wages, and any auto-resolved Greathelm skirmishes. The **MCP Agent** inspects the event log, ticks Faction Clocks, spawns new contracts, and publishes *The Dawn Chronicle*. |
| **II. Morning Coffee** | **5 Mins (Async)** | Open the web/mobile war table. Watch 60-second replays of any overnight skirmishes, read public rumors & private raven dispatches, ransom captured knights, and rotate injured knights out of your active 6-man Lance. |
| **III. The 3 Daily Orders** | **5–10 Mins (Async)** | Lock in your **3 Command Pips** before cutoff:<br>1. **March Order:** *Fast March (2 hexes)*, *Cautious Patrol (1 hex)*, *Set Ambush*, or *Forage*.<br>2. **Company Order:** *Sign Contract*, *Recruit/Repair at Settlement*, *Fortify Camp*, or *Demand Ransom*.<br>3. **Shadow / Political Order:** *Scout Hex Ring*, *Bribe Bailiff*, *Secret Parley*, or *Spread Slander*. |
| **IV. Clash Window** | **Evening / On Trigger** | If orders trigger a hex collision or siege assault, players get a ping to play live Greathelm—or let their **Standing Tactical Doctrine** execute automatically at cutoff. |

---

## 3. Mercenary Company & Chivalric Economy

- **Company Roster (12–16 Named Knights & Squires):** You only deploy **6 knights** (*One Lance*) into any single Greathelm scene. Battered armor and wounds force you to rotate your roster across multi-scene campaigns.
- **The Ransom & Vendetta Code:** In medieval mercenary warfare, dead nobles pay no coin. Downed knights in Greathelm roll on the **Chivalric Post-Battle Table**:
  - *1–2: Battered Plate* (Requires 50c Armor Repair or enters next battle with -1 Armor).
  - *3–4: Flesh Wound & Vendetta* (Knight gains a permanent Scar/Grudge trait against the knight who downed them).
  - *5: Captured for Ransom!* (Captor can demand Gold, Equipment, or a 2-Day Non-Aggression Pact).
  - *6: Glorious or Grim Demise* (Rare permanent death; triggers a Momento/Banner trait for the company).

---

## 4. Technical Stack & MCP Integration

- **Shared Schema Layer (`src/schema/worldSchema.ts`):** TypeScript + **Zod** schemas shared between the UI, the simulation engine, and the `@modelcontextprotocol/sdk` server.
- **Frontend (`Vite + React + HTML5 Canvas`):** Zero-friction web/mobile PWA featuring the Hex War Table, Faction Clocks, and the interactive 8.5"×11" Greathelm 6v6 Arena + Replay Viewer.
- **MCP Server (`mcp/server.ts` & `/api/mcp`):** Point Rowan (`agy`/`codex`) or Claude at the MCP server to inspect `world://ledger/unprocessed-events` and execute validated world-progression tool calls.
