import React from 'react';
import {
  BookOpen,
  Clock,
  Cpu,
  Layers,
  Shield,
  Swords,
  Users,
} from 'lucide-react';

export const GddView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* HERO PITCH */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#1a1612] via-[#211c15] to-[#1a1612] p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded bg-amber-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
          <BookOpen className="h-3.5 w-3.5" /> One-Page Game Design Document (GDD) • Christian &amp;
          Hunter
        </div>
        <h2
          className="text-xl sm:text-2xl font-bold text-stone-100 mt-2"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Banners &amp; Greathelms — The 15-Minute Daily Mercenary Campaign
        </h2>
        <p className="text-sm text-stone-300 mt-2 leading-relaxed max-w-4xl">
          An asynchronous, always-available multiplayer campaign where each player commands an
          independent <strong>Mercenary Company</strong> across a shared hex map. Politics and
          world progression run on a <strong>Daily Dawn Heartbeat</strong> powered by an{' '}
          <strong>MCP Agentic Director</strong>, while tactical collisions zoom into{' '}
          <strong>8.5&quot; × 11&quot; Greathelm (6v6 Knight)</strong> micro-skirmishes playable
          live or via <strong>Standing Tactical Doctrine Auto-Resolve</strong>.
        </p>
      </div>

      {/* 4 PILLARS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-stone-800 bg-[#14120f] p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Clock className="h-4 w-4" /> 1. The Daily Loop (15 Mins Play, 24 Hours Scheming)
          </div>
          <ul className="space-y-2 text-xs text-stone-300 leading-relaxed">
            <li>
              <strong className="text-stone-100">06:00 AM Dawn Tick:</strong> Engine resolves
              marches, upkeep, and auto-resolved battles. The MCP Agent reads the event ledger and
              publishes <em>The Dawn Broadsheet</em> + secret Raven Whispers.
            </li>
            <li>
              <strong className="text-stone-100">The 3 Daily Command Orders:</strong> Each captain
              gets exactly 3 Order Pips per day:
              <div className="mt-1 pl-3 border-l-2 border-amber-500/40 space-y-1 text-[11px] text-stone-400">
                <div>• <strong>1 March Order:</strong> Fast March, Cautious Patrol, Ambush Ford, or Forage.</div>
                <div>• <strong>1 Company Order:</strong> Sign Contract, Repair/Heal, Fortify, or Ransom Parley.</div>
                <div>• <strong>1 Shadow Order:</strong> Scout Ring, Bribe Bailiff, Secret Parley, or Slander Rival.</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-stone-800 bg-[#14120f] p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Users className="h-4 w-4" /> 2. Politics: Progress Clocks + Faction Assets
          </div>
          <ul className="space-y-2 text-xs text-stone-300 leading-relaxed">
            <li>
              <strong className="text-stone-100">Blades-in-the-Dark Clocks (4/6/8 Segments):</strong>{' '}
              Every siege, trade embargo, or inquisition is a visible progress clock. Player
              contracts and skirmishes tick clocks forward or backward.
            </li>
            <li>
              <strong className="text-stone-100">Worlds Without Number Faction Turn:</strong> Noble
              Houses, Guilds, and Bishoprics have <em>Force, Cunning, Wealth</em> and physical
              assets on hexes (Bombard Trains, Toll Barricades).
            </li>
            <li>
              <strong className="text-stone-100">Interlocking Asymmetric Contracts:</strong> Factions
              hire Christian and Hunter for colliding or uneasy cooperative objectives (e.g., Escort
              VIP vs. Ambush Ledger; or Joint Siege with spoils split by Prestige).
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-stone-800 bg-[#14120f] p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Swords className="h-4 w-4" /> 3. Greathelm 6v6 Combat + Doctrine Auto-Resolve
          </div>
          <ul className="space-y-2 text-xs text-stone-300 leading-relaxed">
            <li>
              <strong className="text-stone-100">One Lance = 6 Knights on an 8.5&quot;×11&quot; Arena:</strong>{' '}
              Roll 1d6 per standing knight into your Initiative Pool (grouped 6s down to 1s). Spend
              dice to Sprint (+Momentum), Shift, Shield Bash (strip Momentum / push off bridges!),
              or Clash.
            </li>
            <li>
              <strong className="text-stone-100">Live Window + Ghost Commander Fallback:</strong>{' '}
              When companies collide, the defender gets a ping to play live. If unavailable, the
              engine runs a deterministic Greathelm sim using each player’s{' '}
              <strong>Standing Tactical Doctrine</strong> (including a Mercenary Retreat Threshold
              so an auto-resolve never wipes your roster) and saves a <strong>60s visual replay</strong>.
            </li>
            <li>
              <strong className="text-stone-100">Chivalric Ransom &amp; Vendetta Economy:</strong>{' '}
              Downed knights rarely die outright—they suffer Battered Plate, swear a Blood Vendetta,
              or are <strong>Captured for Ransom</strong>.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-stone-800 bg-[#14120f] p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Cpu className="h-4 w-4" /> 4. MCP Pre-Generation &amp; Technical Stack
          </div>
          <ul className="space-y-2 text-xs text-stone-300 leading-relaxed">
            <li>
              <strong className="text-stone-100">Engine Owns Math; Agent Owns Consequences:</strong>{' '}
              Shared TypeScript + <strong>Zod</strong> schemas (<code className="text-amber-300">src/schema/worldSchema.ts</code>)
              validate both the UI and the <code className="text-amber-300">@modelcontextprotocol/sdk</code> tools.
            </li>
            <li>
              <strong className="text-stone-100">1-Ring Ahead Hex Buffer:</strong> Unexplored hexes
              1 ring ahead of company movement are pre-populated during the daily MCP tick so map
              movement is always instant.
            </li>
            <li>
              <strong className="text-stone-100">Nemesis Promotion:</strong> Enemy knights who
              survive a clash against Christian or Hunter are promoted by the MCP agent into
              recurring Named Nemeses with custom grudge traits.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
