/** Tiny animated SVG previews per simulation (cheap, CSS-animated). */
export function SimPreview({ id }: { id: string }) {
  const common = "absolute inset-0 size-full";
  switch (id) {
    case "stellar-evolution":
    case "hr-diagram":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <defs>
            <radialGradient id={`g-${id}`}>
              <stop offset="0" stopColor="oklch(0.95 0.05 80)" />
              <stop offset="1" stopColor="oklch(0.7 0.18 40)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="50" r="30" fill={`url(#g-${id})`} className="animate-pulse-soft" />
          <circle cx="100" cy="50" r="12" fill="oklch(0.95 0.08 80)" />
          <path
            d="M20 85 L60 60 L100 50 L140 30 L180 15"
            stroke="var(--primary)"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="2 2"
          />
        </svg>
      );
    case "black-hole":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <ellipse
            cx="100"
            cy="50"
            rx="70"
            ry="14"
            fill="none"
            stroke="var(--amber)"
            strokeWidth="6"
            opacity="0.6"
          />
          <ellipse
            cx="100"
            cy="50"
            rx="55"
            ry="10"
            fill="none"
            stroke="var(--rose)"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle
            cx="100"
            cy="50"
            r="18"
            fill="oklch(0.05 0 0)"
            stroke="var(--primary)"
            strokeWidth="0.6"
          />
          <circle
            cx="100"
            cy="50"
            r="27"
            fill="none"
            stroke="var(--violet)"
            strokeWidth="0.4"
            strokeDasharray="1 2"
          />
        </svg>
      );
    case "orbital-mechanics":
    case "kepler":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <ellipse
            cx="100"
            cy="50"
            rx="70"
            ry="35"
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.6"
          />
          <circle cx="75" cy="50" r="6" fill="var(--amber)" />
          <circle r="3" fill="var(--primary)">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="M170,50 A70,35 0 1,1 30,50 A70,35 0 1,1 170,50"
            />
          </circle>
        </svg>
      );
    case "exoplanet-transit":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <circle cx="60" cy="50" r="28" fill="oklch(0.9 0.1 80)" />
          <circle cy="50" r="5" fill="oklch(0.15 0.02 260)">
            <animate attributeName="cx" from="20" to="100" dur="4s" repeatCount="indefinite" />
          </circle>
          <path
            d="M115 30 L135 30 L140 45 L160 45 L165 30 L190 30"
            stroke="var(--primary)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );
    case "gravitational-waves":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path
            d="M0 50 Q10 30 20 50 T40 50 T60 50 Q65 20 70 50 T80 50 Q83 10 86 50 T92 50 Q94 5 96 50 T100 50 L200 50"
            stroke="var(--primary)"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="150" cy="50" r="4" fill="var(--violet)">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path="M0,0 a12,6 0 1,1 -24,0 a12,6 0 1,1 24,0"
            />
          </circle>
          <circle cx="150" cy="50" r="3" fill="var(--cyan)">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path="M0,0 a12,6 0 1,0 24,0 a12,6 0 1,0 -24,0"
            />
          </circle>
        </svg>
      );
    case "spectroscopy":
    case "chem-spectroscopy":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <defs>
            <linearGradient id={`s-${id}`} x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.55 0.25 300)" />
              <stop offset="0.5" stopColor="oklch(0.85 0.2 145)" />
              <stop offset="1" stopColor="oklch(0.6 0.25 25)" />
            </linearGradient>
          </defs>
          <rect x="10" y="35" width="180" height="30" fill={`url(#s-${id})`} opacity="0.85" />
          {[40, 62, 95, 130, 158].map((x) => (
            <rect key={x} x={x} y="33" width="1.5" height="34" fill="oklch(0.1 0 0)" />
          ))}
        </svg>
      );
    case "galaxy-formation":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <g className="origin-center animate-spin-slow" style={{ transformOrigin: "100px 50px" }}>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d="M100 50 q30 -5 50 -30"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.4"
                fill="none"
                transform={`rotate(${i * 120} 100 50)`}
              />
            ))}
          </g>
          <circle cx="100" cy="50" r="6" fill="oklch(0.95 0.05 80)" />
        </svg>
      );
    case "cosmology":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          {[1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M10 90 Q 100 ${90 - i * 22} 190 ${90 - i * 30}`}
              stroke={i === 2 ? "var(--primary)" : "var(--border)"}
              strokeWidth="1"
              fill="none"
            />
          ))}
        </svg>
      );
    case "reaction-kinetics":
    case "reaction-mechanisms":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <circle
              key={i}
              r="3"
              fill={i % 3 ? "var(--primary)" : "var(--rose)"}
              cx={15 + ((i * 37) % 170)}
              cy={15 + ((i * 53) % 70)}
            >
              <animate
                attributeName="cx"
                values={`${15 + ((i * 37) % 170)};${15 + ((i * 61) % 170)};${15 + ((i * 37) % 170)}`}
                dur={`${3 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      );
    case "chemical-equilibrium":
    case "thermochemistry":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path
            d="M10 20 C 60 20, 60 70, 190 70"
            stroke="var(--primary)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M10 80 C 60 80, 60 40, 190 40"
            stroke="var(--violet)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );
    case "titration":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path
            d="M10 85 L80 80 L95 75 L100 20 L110 12 L190 8"
            stroke="var(--primary)"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="100" cy="48" r="2" fill="var(--rose)" />
        </svg>
      );
    case "gas-laws":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <rect x="40" y="20" width="120" height="60" fill="none" stroke="var(--border)" />
          <rect x="130" y="20" width="4" height="60" fill="var(--primary)">
            <animate attributeName="x" values="130;90;130" dur="4s" repeatCount="indefinite" />
          </rect>
          {Array.from({ length: 10 }).map((_, i) => (
            <circle
              key={i}
              r="2"
              fill="var(--cyan)"
              cx={50 + ((i * 23) % 70)}
              cy={30 + ((i * 17) % 40)}
            />
          ))}
        </svg>
      );
    case "molecular-structure":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <line x1="100" y1="50" x2="70" y2="75" stroke="var(--border)" strokeWidth="2" />
          <line x1="100" y1="50" x2="130" y2="75" stroke="var(--border)" strokeWidth="2" />
          <circle cx="100" cy="50" r="12" fill="var(--rose)" />
          <circle cx="70" cy="75" r="7" fill="oklch(0.9 0 0)" />
          <circle cx="130" cy="75" r="7" fill="oklch(0.9 0 0)" />
        </svg>
      );
    case "periodic-trends":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => (
            <rect
              key={i}
              x={20 + (i % 12) * 14}
              y={20 + Math.floor(i / 12) * 20}
              width="12"
              height="16"
              fill="var(--primary)"
              opacity={0.15 + ((i % 12) / 12) * 0.7}
            />
          ))}
        </svg>
      );
    case "electrochemistry":
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <rect x="30" y="40" width="50" height="45" fill="var(--primary)" opacity="0.2" />
          <rect x="120" y="40" width="50" height="45" fill="var(--amber)" opacity="0.2" />
          <line x1="55" y1="20" x2="55" y2="80" stroke="var(--foreground)" strokeWidth="3" />
          <line x1="145" y1="20" x2="145" y2="80" stroke="var(--foreground)" strokeWidth="3" />
          <path d="M55 20 L55 10 L145 10 L145 20" stroke="var(--primary)" fill="none" />
        </svg>
      );
    default:
      return <div className={`${common} grid-bg`} />;
  }
}
