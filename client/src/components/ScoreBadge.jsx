export function scoreTone(score) {
  if (score >= 7) return { dot: 'bg-heat-bright', text: 'text-heat-bright', bg: 'bg-heat-bright/10', border: 'border-heat-bright/20', label: 'High' };
  if (score >= 4) return { dot: 'bg-warn',        text: 'text-warn',        bg: 'bg-warn/10',        border: 'border-warn/20',        label: 'Moderate' };
  return                  { dot: 'bg-success',     text: 'text-success',     bg: 'bg-success/10',     border: 'border-success/20',     label: 'Low' };
}

export default function ScoreBadge({ score, label, size = 'md' }) {
  const tone = scoreTone(score);
  const sz = size === 'lg' ? 'text-sm px-3 py-1.5' : size === 'sm' ? 'text-2xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${tone.border} ${tone.bg} font-medium ${tone.text} ${sz}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {label || tone.label}
      <span className="font-mono opacity-90">{score.toFixed(1)}</span>
    </span>
  );
}
