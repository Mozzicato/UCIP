// Inline SVG icon set — Heroicons-style outline, stroke-width 1.75.
// One file so additions stay consistent.

const PATHS = {
  home:   <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9z" />,
  pin:    <><path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  map:    <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v16M15 6v16" /></>,
  chart:  <><path d="M3 21V5" /><path d="M3 17l4-4 4 3 6-7 4 3" /></>,
  flame:  <path d="M12 3c0 3-3 4-3 8a3 3 0 0 0 6 0c0-1.5-1-2.5-1-3.5C14 9 13 8 14.5 6c.5 3.5 3.5 4.5 3.5 9a6 6 0 1 1-12 0c0-3 2-4 3-6.5C9.5 6 12 5 12 3z" />,
  drop:   <path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z" />,
  leaf:   <><path d="M20 4s-7 0-12 5-3 11-3 11 6 0 11-5 4-11 4-11z" /><path d="M5 19c2-4 6-8 10-10" /></>,
  alert:  <><path d="M12 9v4" /><path d="M12 17.01l.01-.011" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>,
  bolt:   <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  bell:   <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  download:<><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  close:  <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  arrow_right: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  chevron_right: <path d="M9 6l6 6-6 6" />,
  filter: <path d="M3 5h18l-7 9v5l-4 2v-7L3 5z" />,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 18l9 5 9-5" /></>,
  refresh:<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" /></>,
  cash:   <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9.01L6.01 9M18 15.01l.01-.01" /></>,
  pulse:  <path d="M3 12h4l2-7 4 14 2-7h6" />,
  building:<><path d="M3 21V7l9-4 9 4v14" /><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" /><path d="M9 21v-4h6v4" /></>,
  handshake:<path d="M14 9l-3 3-2-2-4 4 2 2a2 2 0 0 0 3 0l1-1 4 4a2 2 0 0 0 3-3l-1-1 3-3-3-3-3 3z" />,
  sparkles:<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 17l.7 2L22 19.7l-2.3.7L19 23l-.7-2.6L16 19.7l2.3-.7L19 17zM5 17l.7 2L8 19.7l-2.3.7L5 23l-.7-2.6L2 19.7l2.3-.7L5 17z" />,
  thermometer:<><path d="M14 4a2 2 0 0 0-4 0v10.5a4 4 0 1 0 4 0V4z" /><path d="M12 9v6" /></>,
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.75 }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      {path}
    </svg>
  );
}

// Kind → Icon mapping for heat / flood / clearing
export const kindIcon = (kind) => {
  switch (kind) {
    case 'heat': return 'flame';
    case 'flood': return 'drop';
    case 'clearing':
    case 'ndvi': return 'leaf';
    default: return 'pulse';
  }
};
