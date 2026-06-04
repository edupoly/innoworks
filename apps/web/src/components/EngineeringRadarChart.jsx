import { motion } from "framer-motion";

// Custom SVG Radar Chart component for professional grade engineering metrics
export const EngineeringRadarChart = ({ stats, size = 320 }) => {
  const {
    collaborationScore = 0,
    innovationScore = 0,
    consistencyScore = 0,
    communicationScore = 0,
    perfectionScore = 0,
    adaptabilityScore = 0
  } = stats || {};

  const metrics = [
    { label: "Collaboration", value: collaborationScore },
    { label: "Innovation", value: innovationScore },
    { label: "Consistency", value: consistencyScore },
    { label: "Communication", value: communicationScore },
    { label: "Perfection", value: perfectionScore },
    { label: "Adaptability", value: adaptabilityScore },
  ];

  const center = size / 2;
  const radius = size * 0.35;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    const r = (radius * value) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = metrics.map((m, i) => {
    const coords = getCoordinates(i, m.value);
    return `${coords.x},${coords.y}`;
  }).join(" ");

  return (
    <div className="relative group p-6 bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl">
      <svg width={size} height={size} className="drop-shadow-2xl overflow-visible">
        {/* Grid circles */}
        {[20, 40, 60, 80, 100].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={(radius * r) / 100}
            fill="none"
            stroke="currentColor"
            className="text-white/5"
            strokeWidth="1"
          />
        ))}
        
        {/* Axis lines */}
        {metrics.map((_, i) => {
          const coords = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={coords.x}
              y2={coords.y}
              stroke="currentColor"
              className="text-white/5"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          points={points}
          fill="url(#radarGradient)"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-out"
        />

        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Data points */}
        {metrics.map((m, i) => {
          const coord = getCoordinates(i, m.value);
          return (
            <circle
              key={i}
              cx={coord.x}
              cy={coord.y}
              r={4}
              className="fill-primary stroke-background transition-all duration-300 group-hover:r-5"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Metric labels */}
        {metrics.map((m, i) => {
          const coords = getCoordinates(i, 125);
          const textAnchor = coords.x > center ? "start" : coords.x < center ? "end" : "middle";
          return (
            <text
              key={i}
              x={coords.x}
              y={coords.y}
              textAnchor={textAnchor}
              className="text-[9px] font-black uppercase tracking-widest fill-muted-foreground transition-colors group-hover:fill-primary"
              dy="0.35em"
            >
              {m.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
