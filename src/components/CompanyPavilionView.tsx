import React, { useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Coins,
  Hammer,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import {
  GreathelmKnight,
  MercenaryCompany,
  NamedNemesis,
  StandingDoctrine,
} from '../schema/worldSchema';
import { soundEngine } from '../utils/soundEngine';

interface CompanyPavilionViewProps {
  christian: MercenaryCompany;
  hunter: MercenaryCompany;
  nemeses: NamedNemesis[];
  onUpdateDoctrine: (
    companyKey: 'christian' | 'hunter',
    doctrine: StandingDoctrine
  ) => void;
  onUpdateKnight: (
    companyKey: 'christian' | 'hunter',
    knightId: string,
    updater: (k: GreathelmKnight) => GreathelmKnight,
    crownCost?: number,
    ledgerNote?: string
  ) => void;
  onExecuteRansomAction: (
    companyKey: 'christian' | 'hunter',
    actionType: 'COLLECT_180_CROWNS' | 'SIGN_TRUCE_WRIT',
    summary: string
  ) => void;
}

const PORTRAIT_MAP = [
  '/assets/portrait-k1.webp',
  '/assets/portrait-k2.webp',
  '/assets/portrait-k3.webp',
  '/assets/portrait-k4.webp',
  '/assets/portrait-k5.webp',
  '/assets/portrait-k6.webp',
];

const WEAPON_ARSENAL = [
  { name: 'Masterwork Pollaxe', clash: 3, bash: 1 },
  { name: 'Flamberge Zweihander', clash: 3, bash: 0 },
  { name: 'Flanged Mace & Heavy Pavise', clash: 2, bash: 2 },
  { name: 'Gilded Estoc & Heater Shield', clash: 3, bash: 1 },
  { name: 'Beaked Lucerne Halberd', clash: 2, bash: 2 },
  { name: 'Warhammer & Vulture Standard', clash: 2, bash: 1 },
];

const FORMATIONS: StandingDoctrine['formation'][] = [
  'SHIELDWALL',
  'FLYING_WEDGE',
  'REFUSED_FLANK',
  'ENVELOPMENT',
];

const RETREAT_THRESHOLDS: StandingDoctrine['retreatThreshold'][] = [
  'WITHDRAW_AT_2_DOWNED',
  'WITHDRAW_AT_3_DOWNED',
  'NO_RETREAT_FIGHT_TO_LAST',
];

const HIGH_DICE_OPTIONS: StandingDoctrine['highDicePriority'][] = [
  'HEAVY_CLASH_EXECUTE',
  'MOMENTUM_FLANK_CHARGE',
  'GUARD_BANNERMAN',
];

const LOW_DICE_OPTIONS: StandingDoctrine['lowDicePriority'][] = [
  'SHIELD_BASH_STRIP_MOMENTUM',
  'TACTICAL_SHIFT_STEP',
  'BRACE_ARMOR_STANCE',
];

export const CompanyPavilionView: React.FC<CompanyPavilionViewProps> = ({
  christian,
  hunter,
  nemeses,
  onUpdateDoctrine,
  onUpdateKnight,
  onExecuteRansomAction,
}) => {
  const [activeCompanyKey, setActiveCompanyKey] = useState<'christian' | 'hunter'>(
    'christian'
  );
  const [selectedKnightIdx, setSelectedKnightIdx] = useState<number>(0);
  const [ransomResolvedMessage, setRansomResolvedMessage] = useState<string | null>(
    null
  );

  const company = activeCompanyKey === 'christian' ? christian : hunter;
  const selectedKnight =
    company.lanceRoster[selectedKnightIdx] || company.lanceRoster[0];

  const cycleFormation = (dir: -1 | 1) => {
    soundEngine.playIronClick();
    const idx = FORMATIONS.indexOf(company.doctrine.formation);
    const next =
      FORMATIONS[(idx + dir + FORMATIONS.length) % FORMATIONS.length];
    onUpdateDoctrine(activeCompanyKey, { ...company.doctrine, formation: next });
  };

  const cycleRetreat = (dir: -1 | 1) => {
    soundEngine.playIronClick();
    const idx = RETREAT_THRESHOLDS.indexOf(company.doctrine.retreatThreshold);
    const next =
      RETREAT_THRESHOLDS[
        (idx + dir + RETREAT_THRESHOLDS.length) % RETREAT_THRESHOLDS.length
      ];
    onUpdateDoctrine(activeCompanyKey, {
      ...company.doctrine,
      retreatThreshold: next,
    });
  };

  const cycleHighDice = (dir: -1 | 1) => {
    soundEngine.playIronClick();
    const idx = HIGH_DICE_OPTIONS.indexOf(company.doctrine.highDicePriority);
    const next =
      HIGH_DICE_OPTIONS[
        (idx + dir + HIGH_DICE_OPTIONS.length) % HIGH_DICE_OPTIONS.length
      ];
    onUpdateDoctrine(activeCompanyKey, {
      ...company.doctrine,
      highDicePriority: next,
    });
  };

  const cycleLowDice = (dir: -1 | 1) => {
    soundEngine.playIronClick();
    const idx = LOW_DICE_OPTIONS.indexOf(company.doctrine.lowDicePriority);
    const next =
      LOW_DICE_OPTIONS[
        (idx + dir + LOW_DICE_OPTIONS.length) % LOW_DICE_OPTIONS.length
      ];
    onUpdateDoctrine(activeCompanyKey, {
      ...company.doctrine,
      lowDicePriority: next,
    });
  };

  const formatDoctrineLabel = (raw: string) =>
    raw
      .replace('WITHDRAW_AT_2_DOWNED', 'Retreat at 2 Downed')
      .replace('WITHDRAW_AT_3_DOWNED', 'Retreat at 3 Downed')
      .replace('NO_RETREAT_FIGHT_TO_LAST', 'Fight to the Last Man')
      .replace('SHIELDWALL', 'Formation: Shieldwall')
      .replace('FLYING_WEDGE', 'Formation: Flying Wedge')
      .replace('REFUSED_FLANK', 'Formation: Refused Flank')
      .replace('ENVELOPMENT', 'Formation: Envelopment')
      .replace(/_/g, ' ');

  const paperdollSrc =
    activeCompanyKey === 'christian'
      ? '/assets/knight-paperdoll-iron-vultures.png'
      : '/assets/knight-paperdoll-red-lance.png';

  return (
    <div className="space-y-6">
      {/* TOP PAVILION BANNER & COMPANY SWITCHER */}
      <div className="forged-iron-frame rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`h-12 w-12 rounded-lg border-2 flex items-center justify-center shadow-lg ${
              activeCompanyKey === 'christian'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-red-500/20 border-red-400 text-red-300'
            }`}
          >
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90">
                Mercenary Pavilion &amp; Armory • Milestone 3
              </span>
              <span className="rounded bg-stone-800 px-2 py-0.5 text-[11px] font-mono text-emerald-400 border border-stone-700">
                Treasury: {company.crowns} Gold Crowns
              </span>
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold text-amber-100 mt-0.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {company.companyName} — Captain {company.commanderName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playIronClick();
              setActiveCompanyKey('christian');
              setSelectedKnightIdx(0);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold border transition cursor-pointer ${
              activeCompanyKey === 'christian'
                ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-lg'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
          >
            Christian’s Iron Vultures
          </button>
          <button
            onClick={() => {
              soundEngine.playIronClick();
              setActiveCompanyKey('hunter');
              setSelectedKnightIdx(0);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold border transition cursor-pointer ${
              activeCompanyKey === 'hunter'
                ? 'bg-red-600 text-white border-red-400 shadow-lg'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
          >
            Hunter’s Red Lance
          </button>
        </div>
      </div>

      {/* 3-COLUMN PAVILION LAYOUT MATCHING CONCEPT #4 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (4 COLS): ACTIVE LANCE (6 NAMED KNIGHT PORTRAIT CARDS) */}
        <div className="xl:col-span-4 forged-iron-frame rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#574a36] pb-2.5 mb-3">
              <span className="text-amber-400 text-xs">⚜</span>
              <h3
                className="text-base font-bold tracking-wider text-amber-100 uppercase"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Active Lance (6 Knights)
              </h3>
              <span className="text-amber-400 text-xs">⚜</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {company.lanceRoster.map((k, idx) => {
                const isSelected = idx === selectedKnightIdx;
                return (
                  <div
                    key={k.id}
                    onClick={() => {
                      soundEngine.playIronClick();
                      setSelectedKnightIdx(idx);
                    }}
                    className={`group relative rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] scale-[1.01]'
                        : 'border-[#4a3f31] hover:border-amber-500/60'
                    }`}
                  >
                    <div className="relative h-28 bg-stone-950 overflow-hidden">
                      <img
                        src={PORTRAIT_MAP[idx % PORTRAIT_MAP.length]}
                        alt={k.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Heraldic Shield Overlay Top-Left */}
                      <div
                        className={`absolute top-1.5 left-1.5 h-6 w-5 rounded-b-full border flex items-center justify-center text-[10px] font-black shadow ${
                          activeCompanyKey === 'christian'
                            ? 'bg-amber-400 text-stone-950 border-stone-900'
                            : 'bg-red-600 text-white border-stone-900'
                        }`}
                      >
                        {k.role.slice(0, 1)}
                      </div>

                      {/* Armor & Weapon Status Pips Top-Right */}
                      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                        <span className="rounded bg-stone-950/90 border border-stone-700 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300">
                          🛡 {k.armorRating}+
                        </span>
                        <span className="rounded bg-stone-950/90 border border-stone-700 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
                          ♥ {k.currentWounds}/{k.maxWounds}
                        </span>
                      </div>
                    </div>

                    {/* Carved Nameplate Footer */}
                    <div className="bg-[#181410] border-t border-[#4a3f31] px-2 py-1.5 text-center">
                      <div
                        className="text-xs font-bold text-amber-100 truncate"
                        style={{ fontFamily: 'Cinzel, serif' }}
                      >
                        {k.name}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {k.weapon}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-stone-950/80 border border-stone-800 p-2.5 text-[11px] text-stone-400 text-center">
            Select any knight in your 6-man Greathelm Lance to refit their weapon or repair battered
            plate armor.
          </div>
        </div>

        {/* CENTER COLUMN (4 COLS): FULL-HEIGHT MILANESE PLATE PAPERDOLL & SMITHY LOADOUT */}
        <div className="xl:col-span-4 forged-iron-frame rounded-xl overflow-hidden flex flex-col justify-between relative">
          <div className="relative h-[430px] bg-[#120f0c] flex items-center justify-center overflow-hidden">
            <img
              src={paperdollSrc}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  '/concepts/04-company-roster-and-ransom.png';
              }}
              alt={selectedKnight.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120f0c] via-transparent to-black/40" />

            {/* Top Heraldic Title Plate */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between rounded-lg bg-stone-950/85 border border-amber-500/40 px-3 py-2 backdrop-blur-sm">
              <div>
                <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  {selectedKnight.role} • {selectedKnight.status.replace(/_/g, ' ')}
                </div>
                <div
                  className="text-base font-bold text-stone-100"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {selectedKnight.name}
                </div>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-amber-300 font-bold">
                  Armor {selectedKnight.armorRating}+
                </div>
                <div className="text-sky-300">
                  Clash +{selectedKnight.clashSkill} • Bash +{selectedKnight.bashBonus}
                </div>
              </div>
            </div>

            {/* Bottom Trait Ribbons */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              {selectedKnight.traits.map((tr, i) => (
                <span
                  key={i}
                  className="rounded bg-stone-950/90 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-200 shadow"
                >
                  ★ {tr}
                </span>
              ))}
            </div>
          </div>

          {/* INTERACTIVE ARMORER & WEAPON RACK CONTROLS */}
          <div className="p-4 bg-[#181410] border-t-2 border-[#574a36] space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                <Swords className="h-3.5 w-3.5 inline mr-1" /> Refit Primary Greathelm Weapon
              </label>
              <select
                value={selectedKnight.weapon}
                onChange={(e) => {
                  soundEngine.playSwordClash();
                  const chosen =
                    WEAPON_ARSENAL.find((w) => w.name === e.target.value) ||
                    WEAPON_ARSENAL[0];
                  onUpdateKnight(
                    activeCompanyKey,
                    selectedKnight.id,
                    (k) => ({
                      ...k,
                      weapon: chosen.name,
                      clashSkill: chosen.clash,
                      bashBonus: chosen.bash,
                    }),
                    0,
                    `Refitted ${selectedKnight.name} with [${chosen.name}].`
                  );
                }}
                className="w-full rounded-lg bg-stone-950 border border-[#6b5335] px-3 py-2 text-xs font-semibold text-amber-100"
              >
                {WEAPON_ARSENAL.map((w) => (
                  <option key={w.name} value={w.name}>
                    {w.name} (Clash +{w.clash}, Bash +{w.bash})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundEngine.playSwordClash();
                  onUpdateKnight(
                    activeCompanyKey,
                    selectedKnight.id,
                    (k) => ({
                      ...k,
                      armorRating: Math.min(5, k.armorRating + 1),
                      status: 'READY',
                    }),
                    45,
                    `Armorer tempered ${selectedKnight.name}'s Milanese plate (45c).`
                  );
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 px-3 py-2 text-xs font-bold text-amber-200 transition cursor-pointer"
              >
                <Hammer className="h-3.5 w-3.5" /> Temper Plate (45c)
              </button>

              <button
                onClick={() => {
                  soundEngine.playParchmentRustle();
                  onUpdateKnight(
                    activeCompanyKey,
                    selectedKnight.id,
                    (k) => ({
                      ...k,
                      currentWounds: k.maxWounds,
                    }),
                    30,
                    `Chirurgeon tended ${selectedKnight.name}'s wounds (30c).`
                  );
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 px-3 py-2 text-xs font-bold text-emerald-200 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> Tend Wounds (30c)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 COLS): CAST-IRON STANDING DOCTRINE SLIDERS + PARCHMENT RANSOM LEDGER */}
        <div className="xl:col-span-4 flex flex-col gap-5 justify-between">
          {/* TOP-RIGHT: CAST-IRON MECHANICAL STANDING TACTICAL DOCTRINE */}
          <div className="forged-iron-frame rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#574a36] pb-2">
              <span className="text-amber-400 text-xs">⚜</span>
              <h3
                className="text-sm sm:text-base font-bold tracking-wider text-amber-100 uppercase"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Standing Tactical Doctrine
              </h3>
              <span className="text-amber-400 text-xs">⚜</span>
            </div>

            {/* Cast-Iron Mechanical Slider 1: Formation */}
            <div className="cast-iron-slot rounded-lg p-2 flex items-center gap-2">
              <div className="h-10 w-10 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-300 shrink-0 font-bold text-xs">
                🛡
              </div>
              <div className="flex-1 flex items-center justify-between parchment-sheet rounded px-2.5 py-2">
                <button
                  onClick={() => cycleFormation(-1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-stone-900" />
                </button>
                <span
                  className="text-xs font-extrabold text-stone-900 tracking-wide"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {formatDoctrineLabel(company.doctrine.formation)}
                </span>
                <button
                  onClick={() => cycleFormation(1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-stone-900" />
                </button>
              </div>
            </div>

            {/* Cast-Iron Mechanical Slider 2: Retreat Threshold */}
            <div className="cast-iron-slot rounded-lg p-2 flex items-center gap-2">
              <div className="h-10 w-10 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-300 shrink-0 font-bold text-xs">
                📯
              </div>
              <div className="flex-1 flex items-center justify-between parchment-sheet rounded px-2.5 py-2">
                <button
                  onClick={() => cycleRetreat(-1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-stone-900" />
                </button>
                <span
                  className="text-xs font-extrabold text-stone-900 tracking-wide"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {formatDoctrineLabel(company.doctrine.retreatThreshold)}
                </span>
                <button
                  onClick={() => cycleRetreat(1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-stone-900" />
                </button>
              </div>
            </div>

            {/* Cast-Iron Mechanical Slider 3: High Dice Priority */}
            <div className="cast-iron-slot rounded-lg p-2 flex items-center gap-2">
              <div className="h-10 w-10 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-300 shrink-0 font-mono font-bold text-xs">
                [6]
              </div>
              <div className="flex-1 flex items-center justify-between parchment-sheet rounded px-2.5 py-1.5">
                <button
                  onClick={() => cycleHighDice(-1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-stone-900" />
                </button>
                <span className="text-[11px] font-bold text-stone-900">
                  High Dice: {formatDoctrineLabel(company.doctrine.highDicePriority)}
                </span>
                <button
                  onClick={() => cycleHighDice(1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-stone-900" />
                </button>
              </div>
            </div>

            {/* Cast-Iron Mechanical Slider 4: Low Dice Priority */}
            <div className="cast-iron-slot rounded-lg p-2 flex items-center gap-2">
              <div className="h-10 w-10 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-sky-300 shrink-0 font-mono font-bold text-xs">
                [1]
              </div>
              <div className="flex-1 flex items-center justify-between parchment-sheet rounded px-2.5 py-1.5">
                <button
                  onClick={() => cycleLowDice(-1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-stone-900" />
                </button>
                <span className="text-[11px] font-bold text-stone-900">
                  Low Dice: {formatDoctrineLabel(company.doctrine.lowDicePriority)}
                </span>
                <button
                  onClick={() => cycleLowDice(1)}
                  className="p-0.5 hover:bg-amber-900/20 rounded cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-stone-900" />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM-RIGHT: PARCHMENT CHIVALRIC RANSOM & BLOOD VENDETTA LEDGER */}
          <div className="parchment-sheet rounded-xl p-4 relative space-y-3">
            {/* Wax Seal Top-Right Corner */}
            <img
              src="/assets/wax-seal-crimson.webp"
              alt="Crimson Wax Seal"
              className="h-12 w-12 object-contain absolute -top-2 -right-2 drop-shadow-lg"
            />

            <div className="border-b-2 border-[#8c6d43] pb-2 pr-10">
              <h3
                className="text-sm font-extrabold text-[#2b1d0e]"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Chivalric Ransom &amp; Blood Vendetta Ledger
              </h3>
            </div>

            {/* Captured Rival Knight Feature Box */}
            <div className="flex items-center gap-3 bg-[#e6d0a7]/80 border border-[#8c6d43] rounded-lg p-2.5">
              <img
                src="/assets/portrait-captured-rival.webp"
                alt="Captured Knight"
                className="h-16 w-16 rounded border-2 border-[#5c4020] object-cover shrink-0 shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-900">
                  Held in Company Pavilion
                </div>
                <div
                  className="text-sm font-extrabold text-[#23170b]"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  Sir Lothar of Redwatch
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Coins className="h-4 w-4 text-amber-800" />
                  <span
                    className="text-base font-extrabold text-[#2b1d0e]"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    180 Gold Crowns
                  </span>
                </div>
              </div>
            </div>

            {ransomResolvedMessage && (
              <div className="rounded bg-emerald-950/90 text-emerald-200 px-3 py-2 text-xs font-semibold border border-emerald-600">
                ✓ {ransomResolvedMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundEngine.playWaxSealCrack();
                  const msg = `${company.companyName} ransomed Sir Lothar for 180 Gold Crowns!`;
                  setRansomResolvedMessage(msg);
                  onExecuteRansomAction(
                    activeCompanyKey,
                    'COLLECT_180_CROWNS',
                    msg
                  );
                }}
                className="rounded-lg bg-[#3b2612] hover:bg-[#52361b] text-amber-200 px-3 py-2 text-xs font-bold shadow cursor-pointer transition"
              >
                Collect 180c Ransom
              </button>
              <button
                onClick={() => {
                  soundEngine.playWaxSealCrack();
                  const msg = `${company.companyName} released Sir Lothar under a 2-Day Non-Aggression Writ (+2 Renown)!`;
                  setRansomResolvedMessage(msg);
                  onExecuteRansomAction(
                    activeCompanyKey,
                    'SIGN_TRUCE_WRIT',
                    msg
                  );
                }}
                className="rounded-lg bg-[#6e1c1c] hover:bg-[#872323] text-amber-100 px-3 py-2 text-xs font-bold shadow cursor-pointer transition"
              >
                Demand Truce Writ
              </button>
            </div>

            {/* Active Blood Vendetta Ledger Rows */}
            <div className="border-t border-[#8c6d43] pt-2 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5c4020]">
                Sworn Blood Vendettas ({nemeses.length})
              </div>
              {nemeses.slice(0, 2).map((nem) => (
                <div
                  key={nem.id}
                  className="flex items-center justify-between text-xs border-b border-[#8c6d43]/40 pb-1"
                >
                  <div>
                    <strong className="text-[#23170b]">{nem.name}</strong>{' '}
                    <span className="text-[11px] text-[#5c4020]">
                      ({nem.title})
                    </span>
                  </div>
                  <span className="rounded bg-red-900/20 border border-red-800/40 px-1.5 py-0.5 text-[10px] font-bold text-red-950">
                    Hex {nem.hexId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
