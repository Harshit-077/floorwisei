import { motion } from 'framer-motion';
import { X, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room, FurnitureItem, DoorItem } from '@/types/editor';

interface Props {
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  onClose: () => void;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 50 50)" />
        <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor" style={{ fontFamily: 'Plus Jakarta Sans' }}>{score}</text>
      </svg>
      <span className="text-xs font-sans text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function analyzeLayout(rooms: Room[], furniture: FurnitureItem[], doors: DoorItem[]) {
  const roomCount = rooms.length;
  const furnCount = furniture.length;
  const doorCount = doors.length;
  const totalRoomArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const totalFurnArea = furniture.reduce((sum, f) => sum + f.width * f.height, 0);
  const furnDensity = totalRoomArea > 0 ? totalFurnArea / totalRoomArea : 0;

  let doorBlockCount = 0;
  doors.forEach(door => {
    const zone = { x: door.x - 20, y: door.y - 20, w: door.width + 40, h: door.height + 40 };
    furniture.forEach(f => {
      if (f.x < zone.x + zone.w && f.x + f.width > zone.x && f.y < zone.y + zone.h && f.y + f.height > zone.y) doorBlockCount++;
    });
  });

  let overlapCount = 0;
  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      const a = furniture[i], b = furniture[j];
      if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) overlapCount++;
    }
  }

  const circScore = Math.min(98, Math.max(15, 85 - doorBlockCount * 15 - overlapCount * 10 - furnDensity * 30 + roomCount * 3));
  const densityDiff = Math.abs(furnDensity - 0.35);
  const spaceScore = Math.min(98, Math.max(10, 90 - densityDiff * 200 + (roomCount > 0 ? 5 : -20)));
  const storageTypes = ['wardrobe', 'bookshelf', 'dresser', 'kitchen-counter'];
  const storageCount = furniture.filter(f => storageTypes.includes(f.type)).length;
  const storageScore = Math.min(95, Math.max(10, 30 + storageCount * 18 + (roomCount > 2 ? 10 : 0)));
  const tallItems = furniture.filter(f => f.height > 60 || f.width > 60);
  let lightPenalty = 0;
  tallItems.forEach(f => { rooms.forEach(r => { if (Math.abs(f.x - r.x) < 30 || Math.abs(f.x + f.width - r.x - r.width) < 30) lightPenalty += 8; }); });
  const lightScore = Math.min(98, Math.max(15, 80 - lightPenalty + doorCount * 3));
  const doorAccessScore = doorCount > 0 ? Math.min(95, Math.max(20, 90 - doorBlockCount * 20)) : roomCount > 0 ? 25 : 50;
  const overall = Math.round((circScore + spaceScore + storageScore + lightScore + doorAccessScore) / 5);

  const suggestions: string[] = [];
  if (doorBlockCount > 0) suggestions.push(`${doorBlockCount} door(s) have furniture blocking clearance — move items at least 0.6m away.`);
  if (overlapCount > 0) suggestions.push(`${overlapCount} furniture overlap(s) detected — separate items for better usability.`);
  if (furnDensity > 0.5) suggestions.push('Room utilization exceeds 50% — consider removing items to improve walkability.');
  if (furnDensity < 0.15 && furnCount > 0) suggestions.push('Rooms appear sparse — add functional furniture to improve space utility.');
  if (storageCount === 0 && roomCount > 0) suggestions.push('No storage units detected — add wardrobes or shelving for better organization.');
  if (lightPenalty > 10) suggestions.push('Tall furniture near room edges may block natural light — reposition away from walls.');
  if (doorCount === 0 && roomCount > 0) suggestions.push('No doors placed — add doors to properly define room access and flow.');
  if (furnCount === 0 && roomCount > 0) suggestions.push('Add furniture to get a complete spatial analysis.');
  if (roomCount === 0) suggestions.push('Add rooms to your layout before running a full analysis.');
  if (suggestions.length === 0) suggestions.push('Excellent layout! All metrics are within optimal range.');

  const risks: string[] = [];
  if (doorBlockCount > 1) risks.push('Multiple doors are obstructed — fire safety risk.');
  if (overlapCount > 2) risks.push('Significant furniture overlap — unusable zones detected.');
  if (furnDensity > 0.6) risks.push('Critical overcrowding — congestion likely in daily use.');
  if (roomCount > 0 && doorCount === 0) risks.push('Rooms have no doors — circulation path undefined.');

  return {
    scores: [
      { label: 'Circulation', score: Math.round(circScore), color: 'hsl(210 29% 35%)' },
      { label: 'Space Efficiency', score: Math.round(spaceScore), color: 'hsl(26 52% 64%)' },
      { label: 'Storage', score: Math.round(storageScore), color: 'hsl(210 29% 50%)' },
      { label: 'Natural Light', score: Math.round(lightScore), color: 'hsl(38 70% 50%)' },
      { label: 'Door Access', score: Math.round(doorAccessScore), color: 'hsl(152 55% 41%)' },
    ],
    overall, suggestions, risks,
  };
}

export default function AnalysisPanel({ rooms, furniture, doors, onClose }: Props) {
  const analysis = analyzeLayout(rooms, furniture, doors);

  return (
    <motion.div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border/50 overflow-y-auto z-20 shadow-xl"
      initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Layout Analysis</h3>
            <p className="text-xs text-muted-foreground font-sans">AI-powered evaluation</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Overall Score */}
        <div className="flex justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <motion.circle cx="60" cy="60" r="46" fill="none"
              stroke={analysis.overall >= 70 ? 'hsl(152 55% 41%)' : analysis.overall >= 50 ? 'hsl(30 30% 50%)' : 'hsl(0 60% 50%)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 46 - (analysis.overall / 100) * 2 * Math.PI * 46 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              transform="rotate(-90 60 60)" />
            <text x="60" y="56" textAnchor="middle" fontSize="28" fontWeight="800" fill="currentColor" style={{ fontFamily: 'Plus Jakarta Sans' }}>{analysis.overall}</text>
            <text x="60" y="72" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" style={{ fontFamily: 'Plus Jakarta Sans' }}>Livability</text>
          </svg>
        </div>

        {/* Individual Scores */}
        <div className="grid grid-cols-3 gap-3">
          {analysis.scores.map(s => <ScoreRing key={s.label} {...s} />)}
        </div>

        {/* Risk Alerts */}
        {analysis.risks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-display flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Risk Alerts</h4>
            {analysis.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <span className="text-xs font-sans text-foreground">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-display flex items-center gap-2"><Lightbulb className="w-4 h-4 text-secondary" />AI Suggestions</h4>
          {analysis.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/5 border border-secondary/10">
              <Lightbulb className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
              <span className="text-xs font-sans text-foreground">{s}</span>
            </div>
          ))}
        </div>

        {analysis.overall >= 70 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/10">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs font-sans text-foreground">Layout meets recommended livability standards.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
