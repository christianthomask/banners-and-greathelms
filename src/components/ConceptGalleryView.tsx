import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Palette,
  Sparkles,
  X,
} from 'lucide-react';

interface ConceptSlide {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  inspiration: string;
  highlights: string[];
  mapsToTab: {
    label: string;
    tabKey: 'WAR_TABLE' | 'GREATHELM_ARENA' | 'PAVILION' | 'MCP_DIRECTOR' | 'GDD';
  };
}

const CONCEPT_SLIDES: ConceptSlide[] = [
  {
    id: 'broadsheet-menu',
    number: '01',
    title: 'The Dawn Chronicle Broadsheet & War-Tent Desk',
    subtitle: 'Morning 5-Minute Session: News, Private Ravens & 3 Daily Command Orders',
    imageUrl: '/concepts/01-dawn-broadsheet-menu.png',
    inspiration: 'Stronghold Campaign Table • Age of Empires II • Pentiment Woodcuts',
    highlights: [
      'Diegetic candlelit oak war-table overlooking a besieged keep at dawn instead of flat web cards.',
      'MCP-generated "THE DAWN CHRONICLE" broadsheet rendered with medieval woodcut illustrations.',
      'Private Raven Dispatches sealed in amber and crimson wax for asymmetric secret contracts.',
      'Forged-iron & timber sidebar on the right housing your 3 Daily Command Orders (March, Company, Shadow).',
    ],
    mapsToTab: {
      label: 'Try the Interactive War Table Prototype →',
      tabKey: 'WAR_TABLE',
    },
  },
  {
    id: 'hexcrawl-map',
    number: '02',
    title: 'The Iron Marches — 2.5D Isometric Hexcrawl & Clocks',
    subtitle: 'Shared Campaign Map with Faction Siege Assets & Interlocking March Vectors',
    imageUrl: '/concepts/02-hexcrawl-iron-marches.png',
    inspiration: 'Age of Empires II: Definitive Edition • Medieval II: Total War',
    highlights: [
      'Lush 2.5D painted isometric terrain with crisp subtle gold hexagonal borders.',
      'Living landmarks: Oakhaven burning under bombard siege in the mud, Red Ford stone bridge, Salt Quarry, and Ruined Abbey.',
      'Heraldic mounted captain miniatures for Christian’s Iron Vultures (Amber/Black) and Hunter’s Red Lance (Crimson/Silver) converging on Red Ford.',
      'Ornate brass & iron top-right HUD housing segmented Blades-in-the-Dark Political Progress Clocks (4/6 & 3/4).',
    ],
    mapsToTab: {
      label: 'Try the Interactive Hex Map & Clocks →',
      tabKey: 'WAR_TABLE',
    },
  },
  {
    id: 'greathelm-bridge',
    number: '03',
    title: 'Greathelm 6v6 Micro-Skirmish on Red Ford Bridge',
    subtitle: 'Zoomed-In 8.5"×11" Tabletop Scale Diorama with Initiative Dice Pools & Doctrines',
    imageUrl: '/concepts/03-greathelm-bridge-clash.png',
    inspiration: 'Stronghold Castle Combat • Age of Empires II • Greathelm Tabletop Rules',
    highlights: [
      'Tight 6-knight vs. 6-knight chivalric clash on the narrow cobbled stone bridge over the Blackwater River.',
      'Iron Vultures locked in a Shieldwall with pollaxes & kite shields vs. The Red Lance charging in a Flying Wedge.',
      'Dynamic environmental hazards: a crimson knight being shield-bashed over the broken stone parapet into the foaming river!',
      'Carved-wood bottom console displaying grouped Initiative Dice Pools (6s down to 1s), glowing gold Momentum orbs, and woodcut Standing Tactical Doctrine cards.',
    ],
    mapsToTab: {
      label: 'Play or Auto-Resolve on the 6v6 Arena →',
      tabKey: 'GREATHELM_ARENA',
    },
  },
  {
    id: 'company-armory',
    number: '04',
    title: 'Mercenary Pavilion, Plate Paperdoll & Ransom Ledger',
    subtitle: 'Roster Rotation, Ghost Commander Doctrines & Chivalric Ransom Economy',
    imageUrl: '/concepts/04-company-roster-and-ransom.png',
    inspiration: 'Battle Brothers • Stronghold • Mount & Blade',
    highlights: [
      'Full-height centerpiece knight paperdoll in weathered Milanese plate armor and greathelm holding a masterwork pollaxe.',
      'Active 6-Knight Lance roster cards on the left (Sir Aldric, Sir Bertram, Sir Cedric, Sir Oswin, Sir Roland, Sir Wulfric) with armor/weapon status.',
      'Heavy cast-iron mechanical sliders on top-right for your Standing Tactical Doctrine (Formation: Shieldwall, Retreat at 2 Downed).',
      'Parchment Chivalric Ransom & Blood Vendetta Ledger on bottom-right showing a captured rival knight held for 180 Gold Crowns.',
    ],
    mapsToTab: {
      label: 'Open Playable Pavilion, Paperdoll & Ransom Ledger →',
      tabKey: 'PAVILION',
    },
  },
];

interface ConceptGalleryViewProps {
  onNavigateTab: (
    tab: 'WAR_TABLE' | 'GREATHELM_ARENA' | 'PAVILION' | 'MCP_DIRECTOR' | 'GDD'
  ) => void;
}

export const ConceptGalleryView: React.FC<ConceptGalleryViewProps> = ({
  onNavigateTab,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<ConceptSlide | null>(null);

  const activeSlide = CONCEPT_SLIDES[activeIndex];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#1a1612] via-[#211c15] to-[#1a1612] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
              <Palette className="h-3.5 w-3.5" /> Full-Game Visual Target • AoE2 / Stronghold /
              Total War Aesthetic
            </div>
            <h2
              className="text-lg sm:text-xl font-bold text-stone-100 mt-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Finished Asset &amp; UI Vision Gallery
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
              Concept mockups showing how the War Table, Hexcrawl Map, 6v6 Greathelm Battles, and
              Mercenary Pavilion look when polished to classic PC strategy game standards. Tap any
              screen to zoom in full-res on your phone.
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE-FRIENDLY CAROUSEL SELECTOR PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {CONCEPT_SLIDES.map((slide, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={slide.id}
              onClick={() => setActiveIndex(idx)}
              className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-md'
                  : 'border-stone-800 bg-[#14120f] hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span
                  className={`font-bold ${
                    isSelected ? 'text-amber-300' : 'text-stone-400'
                  }`}
                >
                  SCREEN {slide.number}
                </span>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                )}
              </div>
              <div className="text-xs font-bold text-stone-100 mt-1 line-clamp-1">
                {slide.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* FEATURED CONCEPT SHOWCASE */}
      <div className="rounded-xl border border-stone-800 bg-[#14120f] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 xl:grid-cols-12">
          {/* IMAGE CONTAINER (8 COLS) */}
          <div className="xl:col-span-8 relative bg-[#090807] flex items-center justify-center group">
            <img
              src={activeSlide.imageUrl}
              alt={activeSlide.title}
              onClick={() => setLightboxImage(activeSlide)}
              className="w-full h-auto object-contain cursor-zoom-in"
            />

            {/* Tap to Expand Badge */}
            <button
              onClick={() => setLightboxImage(activeSlide)}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-stone-950/85 hover:bg-stone-900 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 shadow-lg backdrop-blur cursor-pointer"
            >
              <Expand className="h-3.5 w-3.5" /> Tap for Full-Res Zoom
            </button>

            {/* Prev / Next Overlay Buttons */}
            <button
              onClick={() =>
                setActiveIndex(
                  (i) => (i - 1 + CONCEPT_SLIDES.length) % CONCEPT_SLIDES.length
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-stone-950/80 hover:bg-amber-500 hover:text-stone-950 border border-stone-700 p-2 text-stone-200 shadow-lg transition cursor-pointer"
              aria-label="Previous Concept"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setActiveIndex((i) => (i + 1) % CONCEPT_SLIDES.length)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-stone-950/80 hover:bg-amber-500 hover:text-stone-950 border border-stone-700 p-2 text-stone-200 shadow-lg transition cursor-pointer"
              aria-label="Next Concept"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* DESIGN BREAKDOWN SIDEBAR (4 COLS) */}
          <div className="xl:col-span-4 p-5 flex flex-col justify-between space-y-4 border-t xl:border-t-0 xl:border-l border-stone-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                  CONCEPT {activeSlide.number} OF 04
                </span>
                <span className="text-[11px] text-stone-400">1536 × 1024 HD</span>
              </div>

              <h3
                className="text-lg font-bold text-amber-200"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                {activeSlide.title}
              </h3>
              <p className="text-xs font-medium text-stone-300">
                {activeSlide.subtitle}
              </p>

              <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-2.5 text-[11px] text-stone-300">
                <strong className="text-amber-300">Visual DNA:</strong>{' '}
                {activeSlide.inspiration}
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Key UI &amp; Art Details
                </div>
                {activeSlide.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-stone-300 leading-relaxed"
                  >
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
              <button
                onClick={() => onNavigateTab(activeSlide.mapsToTab.tabKey)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 px-4 py-2.5 text-xs font-bold text-stone-950 shadow transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> {activeSlide.mapsToTab.label}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALL 4 THUMBNAIL GRID FOR QUICK SCROLLING ON PHONE */}
      <div className="space-y-3">
        <h3
          className="text-sm font-bold text-stone-200 uppercase tracking-wider"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          All 4 Target Screens (Side-by-Side Overview)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONCEPT_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => {
                setActiveIndex(idx);
                setLightboxImage(slide);
              }}
              className="group rounded-xl border border-stone-800 hover:border-amber-500/50 bg-[#14120f] overflow-hidden shadow-lg cursor-pointer transition"
            >
              <div className="relative overflow-hidden bg-stone-950">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 rounded bg-stone-950/85 border border-stone-700 px-2 py-0.5 text-[10px] font-mono text-amber-200">
                  Tap to Zoom
                </span>
              </div>
              <div className="p-3">
                <div className="text-[10px] font-mono text-amber-400 font-bold">
                  SCREEN {slide.number} • {slide.inspiration}
                </div>
                <div className="text-sm font-bold text-stone-100 mt-0.5">
                  {slide.title}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULLSCREEN MOBILE PINCH-ZOOM LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-2 sm:p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div className="w-full max-w-6xl flex items-center justify-between pb-3 px-2">
            <div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                SCREEN {lightboxImage.number}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {lightboxImage.title}
              </h4>
            </div>
            <button
              onClick={() => setLightboxImage(null)}
              className="rounded-lg bg-stone-800 hover:bg-stone-700 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
          <div
            className="w-full max-w-6xl overflow-auto rounded-lg border border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.title}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
