// kura-shared.jsx — Shared widgets used across all screens.

// ─── Kura logo ────────────────────────────────────────────────
function KuraLogo({ size = 28, color }) {
  const c = color || 'var(--sage)';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 40C24 40 8 30 8 18C8 12 12 8 16 8C19 8 21.5 10 24 13C26.5 10 29 8 32 8C36 8 40 12 40 18C40 30 24 40 24 40Z"
            stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="2.5" fill={c} opacity="0.85"/>
      <circle cx="28" cy="20" r="2.5" fill={c} opacity="0.85"/>
      <circle cx="24" cy="26" r="3" fill={c}/>
    </svg>
  );
}

// ─── iOS-style status bar (Kura-themed) ───────────────────────
function KStatusBar({ time = '9:41' }) {
  return (
    <div className="k-statusbar">
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>{time}</span>
      <div className="icons">
        <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 3C10 3 11.8 3.8 13.2 5L14.2 4C12.6 2.4 10.4 1.4 8 1.4C5.6 1.4 3.4 2.4 1.8 4L2.8 5C4.2 3.8 6 3 8 3Z" fill="currentColor"/><path d="M8 6.4C9.2 6.4 10.3 6.8 11.1 7.6L12.1 6.6C10.9 5.5 9.5 4.8 8 4.8C6.5 4.8 5.1 5.5 3.9 6.6L4.9 7.6C5.7 6.8 6.8 6.4 8 6.4Z" fill="currentColor"/><circle cx="8" cy="9.5" r="1.4" fill="currentColor"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="19" height="8" rx="1.6" fill="currentColor"/><path d="M24 4V8C24.7 7.7 25.2 7.1 25.2 6C25.2 4.9 24.7 4.3 24 4Z" fill="currentColor" fillOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

// ─── Home indicator ───────────────────────────────────────────
function KHomeIndicator() {
  return <div className="k-home-indicator" />;
}

// ─── Bottom tab bar ───────────────────────────────────────────
function KTabBar({ active = 'pets' }) {
  const items = [
    { id: 'pets',   label: 'Pets',     icon: <path d="M12 5c-1.5 0-2.7 1.4-2.7 3.1S10.5 11.2 12 11.2s2.7-1.4 2.7-3.1S13.5 5 12 5zm-5.5 1c-1.2 0-2.2 1.2-2.2 2.6s1 2.6 2.2 2.6 2.2-1.2 2.2-2.6S7.7 6 6.5 6zm11 0c-1.2 0-2.2 1.2-2.2 2.6s1 2.6 2.2 2.6 2.2-1.2 2.2-2.6S18.7 6 17.5 6zM12 12.5c-3 0-6 1.5-6 4 0 1.4 1 2.5 2.5 2.5h7c1.5 0 2.5-1.1 2.5-2.5 0-2.5-3-4-6-4z"/> },
    { id: 'agenda', label: 'Agenda',   icon: <><rect x="4" y="5" width="16" height="15" rx="2" strokeWidth="1.7" stroke="currentColor" fill="none"/><path d="M8 3v4M16 3v4M4 10h16" strokeWidth="1.7" stroke="currentColor" fill="none" strokeLinecap="round"/></> },
    { id: 'doc',    label: 'Saúde',    icon: <><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"/></> },
    { id: 'me',     label: 'Perfil',   icon: <><circle cx="12" cy="8" r="3.4" strokeWidth="1.7" stroke="currentColor" fill="none"/><path d="M5 20c1-3.4 4-5 7-5s6 1.6 7 5" strokeWidth="1.7" stroke="currentColor" fill="none" strokeLinecap="round"/></> },
  ];
  return (
    <div className="k-tabbar">
      {items.map(it => (
        <button key={it.id} className={`k-tab ${active === it.id ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill={active === it.id ? 'currentColor' : 'none'}>{it.icon}</svg>
          {it.label}
        </button>
      ))}
      <div style={{ gridColumn: '1 / -1', height: 0 }} />
    </div>
  );
}

// ─── Pet avatar ───────────────────────────────────────────────
function KPetAvatar({ tier = 'emoji', emoji = '🐶', photo, badge, size = 56, style = {} }) {
  const cls = tier === 'photo' ? 'tier-photo' : tier === 'detected' ? 'tier-detected' : '';
  const bg = photo ? `url(${photo})` : undefined;
  return (
    <div className={`k-pet-avatar ${cls}`} style={{
      width: size, height: size, fontSize: size * 0.46,
      backgroundImage: bg,
      ...style,
    }}>
      {!photo && emoji}
      {badge && <div className="k-pet-avatar-badge">{badge}</div>}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────
function KChip({ tone = 'sage', children, dot }) {
  return (
    <span className={`k-chip k-chip-${tone}`}>
      {dot && <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'currentColor', display: 'inline-block',
      }} />}
      {children}
    </span>
  );
}

// ─── Section kicker ───────────────────────────────────────────
function KKicker({ children, color }) {
  return <div className="k-kicker" style={{ color: color || 'var(--text-mute)' }}>{children}</div>;
}

// ─── Photo placeholder block (for pet "photos" via gradient) ──
function KPetPhoto({ palette = 'lab', size = 56 }) {
  // Pseudo-photo: layered radial gradients evoking a pet portrait without
  // ever pretending to be one. Different palettes for different pets.
  const palettes = {
    lab: { bg: '#C9A876', a: '#8B6F45', b: '#F2E0C0', c: '#1B1006' },   // Bóbi - labrador
    siam: { bg: '#E8DDC8', a: '#4A3418', b: '#FFFCF7', c: '#6B8AA8' },  // Luna - siamese
    pup: { bg: '#3D2B18', a: '#6B4A2B', b: '#C9A876', c: '#F2E0C0' },   // Thor - dark pup
  };
  const p = palettes[palette] || palettes.lab;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `
        radial-gradient(circle at 30% 35%, ${p.b} 0%, transparent 22%),
        radial-gradient(circle at 70% 35%, ${p.b} 0%, transparent 22%),
        radial-gradient(circle at 30% 38%, ${p.c} 0%, ${p.c} 4%, transparent 5%),
        radial-gradient(circle at 70% 38%, ${p.c} 0%, ${p.c} 4%, transparent 5%),
        radial-gradient(circle at 50% 65%, ${p.a} 0%, transparent 30%),
        radial-gradient(ellipse at 50% 95%, ${p.a} 0%, ${p.bg} 40%),
        ${p.bg}
      `,
      border: '2px solid var(--sage)',
      flexShrink: 0,
    }} />
  );
}

Object.assign(window, {
  KuraLogo, KStatusBar, KHomeIndicator, KTabBar,
  KPetAvatar, KChip, KKicker, KPetPhoto,
});
