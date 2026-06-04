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
    { label: "Collaboration", value: collaborationScore, color: "text-blue-500" },
    { label: "Innovation", value: innovationScore, color: "text-purple-500" },
    { label: "Consistency", value: consistencyScore, color: "text-emerald-500" },
    { label: "Communication", value: communicationScore, color: "text-orange-500" },
    { label: "Perfection", value: perfectionScore, color: "text-red-500" },
    { label: "Adaptability", value: adaptabilityScore, color: "text-cyan-500" },
  ];

  const center = size / 2;
  const radius = size * 0.32;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    // Ensure value is at least 10 for visibility even if 0
    const normalizedValue = Math.max(10, value);
    const r = (radius * normalizedValue) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = metrics.map((m, i) => {
    const coords = getCoordinates(i, m.value);
    return `${coords.x},${coords.y}`;
  }).join(" ");

  const averageScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

  return (
    <div className="relative group p-8 bg-card border border-border/50 rounded-[3rem] shadow-2xl w-full max-w-[480px] aspect-square flex flex-col items-center justify-center mx-auto overflow-hidden transition-all duration-500 hover:border-primary/30">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
      
      <div className="text-center mb-6 z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Engineering_Performance</h3>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-black tracking-tighter text-foreground">{averageScore}%</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg border border-border/50">Stability Index</span>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          className="w-full h-full drop-shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-visible"
        >
          {/* Grid circles */}
          {[20, 40, 60, 80, 100].map((r) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={(radius * r) / 100}
              fill="none"
              stroke="currentColor"
              className="text-muted-foreground/10"
              strokeWidth="0.5"
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
                className="text-muted-foreground/5"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <motion.polygon
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            points={points}
            fill="url(#radarGradient)"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
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
                strokeWidth={2}
              />
            );
          })}

          {/* Metric labels */}
          {metrics.map((m, i) => {
            const coords = getCoordinates(i, 130);
            const textAnchor = coords.x > center ? "start" : coords.x < center ? "end" : "middle";
            return (
              <g key={i}>
                <text
                  x={coords.x}
                  y={coords.y}
                  textAnchor={textAnchor}
                  className={`text-[8px] font-black uppercase tracking-widest ${m.color} transition-all duration-300 group-hover:scale-110`}
                  dy="-0.5em"
                >
                  {m.label}
                </text>
                <text
                  x={coords.x}
                  y={coords.y}
                  textAnchor={textAnchor}
                  className="text-[10px] font-black fill-foreground tracking-tighter"
                  dy="0.8em"
                >
                  {m.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-8 flex gap-4 w-full">
         <div className="flex-1 p-4 bg-muted/30 rounded-2xl border border-border/50 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Peak_Attribute</p>
            <p className="text-xs font-black text-foreground">{[...metrics].sort((a,b) => b.value - a.value)[0].label}</p>
         </div>
         <div className="flex-1 p-4 bg-muted/30 rounded-2xl border border-border/50 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Growth_Vector</p>
            <p className="text-xs font-black text-foreground">Trending_Up</p>
         </div>
      </div>
    </div>
  );
};
