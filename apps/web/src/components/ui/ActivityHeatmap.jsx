const ActivityHeatmap = ({ activities = [] }) => {
  // Generate last 12 weeks of dates
  const weeks = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7 + (6 - j)));
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = activities.find(a => a.date === dateStr);
      const intensity = activity ? Math.min(Math.ceil(activity.score / 2), 4) : 0;
      
      week.push({ date: dateStr, intensity });
    }
    weeks.unshift(week);
  }

  const colorMap = [
    'bg-muted/30',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/70',
    'bg-primary'
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1.5">
          {week.map((day, di) => (
            <div
              key={di}
              title={`${day.date}`}
              className={`w-3 h-3 rounded-sm ${colorMap[day.intensity]} transition-colors hover:ring-1 hover:ring-primary/50`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ActivityHeatmap;
