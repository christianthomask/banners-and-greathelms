import React from 'react';
import { ArenaKnightState } from '../engine/greathelmEngine';

interface DetailedKnightPuppetProps {
  knight: ArenaKnightState;
  isSelected: boolean;
  isCurrentActor: boolean;
  isCurrentTarget: boolean;
  inRiver: boolean;
  onClick: () => void;
}

function getKnightSpriteHref(k: ArenaKnightState): string {
  const isChr = k.side === 'CHRISTIAN';
  if (isChr) {
    if (k.role === 'BANNERMAN' || k.role === 'CAPTAIN') {
      return '/assets/sprite-knight-iron-vultures-2.webp';
    }
    if (k.role === 'BREAKER' || k.role === 'CHAMPION') {
      return '/assets/sprite-knight-iron-vultures-3.webp';
    }
    return '/assets/sprite-knight-iron-vultures-1.webp';
  } else {
    if (k.role === 'BANNERMAN' || k.role === 'HALBERDIER') {
      return '/assets/sprite-knight-red-lance-2.webp';
    }
    if (k.role === 'BREAKER' || k.role === 'CAPTAIN') {
      return '/assets/sprite-knight-red-lance-3.webp';
    }
    return '/assets/sprite-knight-red-lance-1.webp';
  }
}

export const DetailedKnightPuppet: React.FC<DetailedKnightPuppetProps> = ({
  knight: k,
  isSelected,
  isCurrentActor,
  isCurrentTarget,
  inRiver,
  onClick,
}) => {
  const isChr = k.side === 'CHRISTIAN';
  const dir = isChr ? 1 : -1;
  const trimGold = isChr ? '#fde68a' : '#fca5a5';
  const spriteHref = getKnightSpriteHref(k);

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      filter="url(#miniatureDropShadow)"
    >
      {/* RIVER SPLASH RINGS IF KNOCKED INTO BLACKWATER RIVER */}
      {inRiver && (
        <g>
          <ellipse
            cx="0"
            cy="6"
            rx="62"
            ry="28"
            fill="#0284c7"
            fillOpacity="0.42"
            stroke="#7dd3fc"
            strokeWidth="2.8"
            strokeDasharray="8 4"
          />
          <ellipse
            cx="0"
            cy="6"
            rx="42"
            ry="18"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.2"
          />
          <path
            d="M -32 -6 Q -20 -34 -8 -8 M 12 -6 Q 26 -36 36 -4 M -6 -12 Q 0 -44 10 -10"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text
            x="0"
            y="-98"
            textAnchor="middle"
            fill="#7dd3fc"
            fontSize="13"
            fontWeight="900"
            stroke="#082f49"
            strokeWidth="0.8"
          >
            🌊 RIVER RING-OUT!
          </text>
        </g>
      )}

      {/* SELECTED / ACTIVE MELEE REACH HALO */}
      {(isSelected || isCurrentActor) && !k.downed && (
        <g>
          <ellipse
            cx="0"
            cy="6"
            rx="62"
            ry="28"
            fill={isChr ? '#f59e0b' : '#ef4444'}
            fillOpacity="0.16"
            stroke={isChr ? '#fbbf24' : '#f87171'}
            strokeWidth="3"
            strokeDasharray="8 4"
          />
          <ellipse
            cx="0"
            cy="6"
            rx="46"
            ry="20"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* TARGET IMPACT FLASH & STEEL SPARKS */}
      {isCurrentTarget && (
        <g>
          <ellipse
            cx="0"
            cy="4"
            rx="54"
            ry="25"
            fill="#ef4444"
            fillOpacity="0.32"
            stroke="#ef4444"
            strokeWidth="3.5"
          />
          <path
            d="M -26 -54 L 0 -30 L 26 -56 M -30 -30 L 30 -30 M -14 -64 L 14 -18"
            stroke="#fef08a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* GOLDEN MOMENTUM AURA UNDER FEET */}
      {!k.downed && k.momentum > 0 && (
        <ellipse
          cx="0"
          cy="5"
          rx="48"
          ry="22"
          fill="#f59e0b"
          fillOpacity="0.35"
          stroke="#fde047"
          strokeWidth="2.5"
          filter="url(#momentumGlow)"
        />
      )}

      {/* PAINTED 2.5D MINIATURE SPRITE (ALPHA-KEYED FROM CODEX SPRITE SHEET) */}
      <g
        opacity={k.downed ? 0.52 : 1}
        transform={k.downed ? `rotate(${68 * dir} 0 -10)` : undefined}
      >
        <image
          href={spriteHref}
          x="-68"
          y="-118"
          width="136"
          height="136"
          preserveAspectRatio="xMidYMax meet"
        />
      </g>

      {/* WOUND PIPS & MOMENTUM BADGE */}
      {!k.downed && (
        <g transform="translate(-18, -116)">
          {Array.from({ length: k.maxWounds }).map((_, wIdx) => (
            <circle
              key={wIdx}
              cx={wIdx * 12}
              cy="0"
              r="5.2"
              fill={wIdx < k.wounds ? '#22c55e' : '#292524'}
              stroke="#0c0a09"
              strokeWidth="1.8"
            />
          ))}
        </g>
      )}

      {!k.downed && k.momentum > 0 && (
        <g transform="translate(26, -116)">
          <rect
            x="-12"
            y="-9"
            width="28"
            height="16"
            rx="5"
            fill="#eab308"
            stroke="#0c0a09"
            strokeWidth="1.5"
          />
          <text
            x="2"
            y="3"
            textAnchor="middle"
            fill="#0c0a09"
            fontSize="10.5"
            fontWeight="900"
          >
            ⚡{k.momentum}
          </text>
        </g>
      )}

      {/* FORGED-IRON & BRASS KNIGHT NAMEPLATE */}
      <g transform="translate(0, 18)">
        <rect
          x="-58"
          y="-2"
          width="116"
          height="20"
          rx="4"
          fill="#0c0a09"
          fillOpacity="0.92"
          stroke={isSelected ? '#ffffff' : isChr ? '#d97706' : '#dc2626'}
          strokeWidth="1.8"
        />
        <circle cx="-51" cy="8" r="2.2" fill={trimGold} />
        <circle cx="51" cy="8" r="2.2" fill={trimGold} />
        <text
          x="0"
          y="11.5"
          textAnchor="middle"
          fill={isChr ? '#fde68a' : '#fecaca'}
          fontSize="10.5"
          fontWeight="800"
        >
          {k.downed ? '☠ ' : ''}
          {k.name.replace('Sir ', '').slice(0, 14)}
        </text>
      </g>
    </g>
  );
};

interface MountedCaptainMiniatureProps {
  side: 'CHRISTIAN' | 'HUNTER';
  label: string;
  sublabel: string;
}

export const MountedCaptainMiniature: React.FC<MountedCaptainMiniatureProps> = ({
  side,
  label,
  sublabel,
}) => {
  const isChr = side === 'CHRISTIAN';
  const primary = isChr ? '#d97706' : '#dc2626';
  const trim = isChr ? '#fde68a' : '#fca5a5';
  const spriteHref = isChr
    ? '/assets/sprite-captain-iron-vultures.webp'
    : '/assets/sprite-captain-red-lance.webp';

  return (
    <g filter="url(#miniatureShadow)" className="cursor-pointer">
      {/* FACTION COMMAND AURA RING UNDER CAVALRY BASE */}
      <ellipse
        cx="0"
        cy="8"
        rx="64"
        ry="24"
        fill={primary}
        fillOpacity="0.22"
        stroke={trim}
        strokeWidth="2.5"
        strokeDasharray="8 4"
      />

      {/* PAINTED 2.5D MOUNTED CAPTAIN MINIATURE SPRITE */}
      <image
        href={spriteHref}
        x="-86"
        y="-142"
        width="172"
        height="160"
        preserveAspectRatio="xMidYMax meet"
      />

      {/* FORGED-IRON CAPTAIN NAMEPLATE SCROLL */}
      <g transform="translate(0, 18)">
        <rect
          x="-78"
          y="0"
          width="156"
          height="30"
          rx="5"
          fill="#0c0a09"
          fillOpacity="0.92"
          stroke={primary}
          strokeWidth="2"
        />
        <circle cx="-70" cy="15" r="2.5" fill={trim} />
        <circle cx="70" cy="15" r="2.5" fill={trim} />
        <text
          x="0"
          y="13"
          textAnchor="middle"
          fill={trim}
          fontSize="11"
          fontWeight="900"
        >
          {label}
        </text>
        <text
          x="0"
          y="25"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="700"
        >
          {sublabel}
        </text>
      </g>
    </g>
  );
};
