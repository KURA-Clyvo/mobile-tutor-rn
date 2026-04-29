// kura-screens-3.jsx — Screens 6-9: Consultas history, Consulta detail, Vacinas, Agendar

// ═══ SCREEN 6: HISTÓRICO DE CONSULTAS ═══════════════════════════
function ScreenConsultasHistory() {
  const [filter, setFilter] = React.useState('todas');
  const items = [
    { date: '20 ABR 2026', type: 'tele', vet: 'Dra. Ana Mendes', crmv: 'CRMV-SP 12345', resumo: 'Retorno · dermatite alérgica. Lesões em remissão; manter medicação tópica por mais 7 dias.' },
    { date: '14 ABR 2026', type: 'pres', vet: 'Dr. Paulo Ferraz', crmv: 'CRMV-SP 09812', resumo: 'V10 reforço anual. Pet em bom estado geral. Sem reações adversas observadas.' },
    { date: '02 ABR 2026', type: 'pres', vet: 'Dra. Ana Mendes', crmv: 'CRMV-SP 12345', resumo: 'Diagnóstico de dermatite alérgica. Iniciado tratamento com hidrocortisona 1% e dieta hipoalergênica.' },
    { date: '18 FEV 2026', type: 'pres', vet: 'Dr. Paulo Ferraz', crmv: 'CRMV-SP 09812', resumo: 'Check-up semestral. Peso, temperatura e frequência cardíaca dentro do esperado.' },
    { date: '06 NOV 2025', type: 'tele', vet: 'Dra. Ana Mendes', crmv: 'CRMV-SP 12345', resumo: 'Orientação sobre alimentação. Transição para ração premium recomendada.' },
  ];
  const filtered = items.filter(i => filter === 'todas' || (filter === 'pres' && i.type === 'pres') || (filter === 'tele' && i.type === 'tele'));

  return (
    <div className="k-phone" data-screen-label="06 Histórico Consultas">
      <KStatusBar/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="k-header-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KPetPhoto palette="lab" size={28}/>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Bóbi</div>
        </div>
        <button className="k-header-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
        </button>
      </div>

      <div className="k-body">
        <div style={{ padding: '12px 24px 4px' }}>
          <KKicker>05 · Visitas</KKicker>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text)', marginTop: 4,
          }}>Histórico de <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>consultas.</em></h1>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '12px 24px 8px', display: 'flex', gap: 6 }}>
          {[
            { id: 'todas', label: 'Todas', count: items.length },
            { id: 'pres', label: 'Presencial', count: items.filter(i => i.type === 'pres').length },
            { id: 'tele', label: 'Telemedicina', count: items.filter(i => i.type === 'tele').length },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '8px 14px', borderRadius: 9999, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              background: filter === f.id ? 'var(--sage)' : 'var(--surface)',
              color: filter === f.id ? 'var(--text-on-sage)' : 'var(--text-soft)',
              border: `1px solid ${filter === f.id ? 'var(--sage)' : 'var(--border)'}`,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {f.label}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                opacity: 0.7,
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ padding: '8px 24px 24px' }}>
          {filtered.map((it, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 16 : 0, position: 'relative' }}>
              {i < arr.length - 1 && <div style={{ position: 'absolute', left: 7, top: 24, bottom: 0, width: 1, background: 'var(--border)' }}/>}
              <div style={{
                width: 15, height: 15, marginTop: 8, borderRadius: '50%',
                background: it.type === 'tele' ? 'var(--ocean-pale)' : 'var(--sage-pale)',
                border: `2px solid ${it.type === 'tele' ? 'var(--ocean)' : 'var(--sage)'}`,
                flexShrink: 0,
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>{it.date}</div>
                  <KChip tone={it.type === 'tele' ? 'ocean' : 'sage'}>{it.type === 'tele' ? '📡 Tele' : 'Presencial'}</KChip>
                </div>
                <div className="k-card" style={{ padding: 14 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                    {it.vet}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.06em', marginBottom: 8 }}>{it.crmv}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.resumo}</div>
                  <button style={{
                    marginTop: 10, padding: 0, background: 'transparent', border: 0,
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'var(--sage)', cursor: 'pointer',
                  }}>Ver prontuário →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <KTabBar active="doc"/>
      <KHomeIndicator/>
    </div>
  );
}

// ═══ SCREEN 7: DETALHES DA CONSULTA ═════════════════════════════
function ScreenConsultaDetail() {
  return (
    <div className="k-phone" data-screen-label="07 Detalhes Consulta">
      <KStatusBar/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="k-header-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>Prontuário · #CONS-009</div>
        <button className="k-header-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 6l-4-4-4 4M12 2v14M5 18h14v4H5z"/></svg>
        </button>
      </div>

      <div className="k-body">
        <div style={{ padding: '12px 24px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <KChip tone="sage" dot>Presencial</KChip>
            <KChip tone="mute">2h 14min</KChip>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>02 de abril, <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>2026.</em></h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>
            Quarta · 14:32 — 16:46
          </div>
        </div>

        {/* Veterinário card */}
        <div style={{ padding: '0 24px 14px' }}>
          <div className="k-card" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--sage-pale), var(--ocean-pale))',
              border: '2px solid var(--sage)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
              color: 'var(--sage)', flexShrink: 0,
            }}>AM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 }}>Dra. Ana Mendes</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.06em', marginTop: 3 }}>CRMV-SP 12345 · Dermatologia</div>
            </div>
            <button style={{
              padding: '8px 14px', borderRadius: 9999, cursor: 'pointer',
              background: 'var(--sage-pale)', border: '1px solid rgba(74,105,68,0.18)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: 'var(--sage)', fontWeight: 500,
            }}>Contato</button>
          </div>
        </div>

        {/* Sections */}
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ConsultaSection label="Anamnese" tone="sage">
            <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Queixa:</strong> tutor relata coçeira intensa nas patas e abdômen, há ~10 dias. Piora à noite.<br/>
              <strong style={{ color: 'var(--text)' }}>Sintomas:</strong> eritema, alopecia leve, lambedura excessiva.
            </div>
          </ConsultaSection>

          <ConsultaSection label="Exame físico" tone="ocean">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { k: 'Peso', v: '27,8', sub: 'kg' },
                { k: 'Temp.', v: '38,5', sub: '°C' },
                { k: 'FC', v: '92', sub: 'bpm' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '8px 10px', background: 'var(--surface-2)',
                  borderRadius: 10, textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>{s.k}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>
                    {s.v}<span style={{ fontSize: 10, color: 'var(--text-mute)', marginLeft: 2 }}>{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
              Lesões eritematosas bilaterais em região abdominal e interdigital. Mucosas normocoradas. Linfonodos sem alterações.
            </div>
          </ConsultaSection>

          <ConsultaSection label="Diagnóstico" tone="amber">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Dermatite atópica
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>
              CID-10-VET · L20.9 · Não complicada
            </div>
          </ConsultaSection>

          <ConsultaSection label="Prescrição" tone="ocean" right={
            <button style={{
              padding: '6px 12px', borderRadius: 9999, cursor: 'pointer',
              background: 'var(--ocean)', border: 0, color: 'var(--text-on-ocean)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.10em',
              textTransform: 'uppercase', fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"/></svg>
              PDF
            </button>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Hidrocortisona 1%', dose: 'Tópico · 2x ao dia · 14 dias' },
                { name: 'Ração hipoalergênica', dose: 'Manutenção · contínuo' },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  background: 'var(--surface-2)', borderRadius: 10,
                  borderLeft: '2px solid var(--ocean)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{m.dose}</div>
                  </div>
                </div>
              ))}
            </div>
          </ConsultaSection>

          <ConsultaSection label="Retorno agendado" tone="sage">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                padding: '6px 12px', textAlign: 'center',
                background: 'var(--sage-pale)', borderRadius: 10,
                border: '1px solid rgba(74,105,68,0.18)',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sage)' }}>02 MAI</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--sage)', lineHeight: 1 }}>14:30</div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--text-soft)' }}>
                Teleorientação para avaliação da resposta ao tratamento.
              </div>
            </div>
          </ConsultaSection>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          <button className="k-btn k-btn-primary k-btn-block">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14"/></svg>
            Compartilhar prontuário (PDF)
          </button>
        </div>
      </div>

      <KHomeIndicator/>
    </div>
  );
}

function ConsultaSection({ label, tone = 'sage', right, children }) {
  return (
    <div className="k-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: `var(--${tone})`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 14, height: 1, background: `var(--${tone})` }}/>
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ═══ SCREEN 8: CARTEIRA DE VACINAÇÃO ════════════════════════════
function ScreenVacinas() {
  return (
    <div className="k-phone" data-screen-label="08 Carteira Vacinas">
      <KStatusBar/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="k-header-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KPetPhoto palette="lab" size={28}/>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Bóbi</div>
        </div>
        <button className="k-header-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 6l-4-4-4 4M12 2v14M5 18h14v4H5z"/></svg>
        </button>
      </div>

      <div className="k-body">
        <div style={{ padding: '12px 24px 8px' }}>
          <KKicker>04 · Imunização</KKicker>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text)', marginTop: 4,
          }}>Carteira de <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>vacinação.</em></h1>
        </div>

        {/* Status banner */}
        <div style={{ padding: '14px 24px' }}>
          <div style={{
            background: 'var(--sage-pale)',
            border: '1px solid rgba(74,105,68,0.22)',
            borderRadius: 16, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--sage)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-on-sage)', flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--sage)', lineHeight: 1.1 }}>Vacinação em dia</div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>Última: V10 reforço · há 13 dias</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--sage)', lineHeight: 1 }}>4/4</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)', marginTop: 2 }}>aplicadas</div>
            </div>
          </div>
        </div>

        {/* Aplicadas */}
        <div style={{ padding: '8px 24px 0' }}>
          <KKicker>Aplicadas</KKicker>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'V10 (Polivalente)', date: '14 ABR 2026', clinic: 'Clínica PetLife', vet: 'Dr. Paulo F.', lote: '4A82B-2026', status: 'sage', sLabel: 'Aplicada' },
              { name: 'Antirrábica', date: '14 NOV 2025', clinic: 'Clínica PetLife', vet: 'Dr. Paulo F.', lote: '7C91A-2025', status: 'sage', sLabel: 'Aplicada' },
              { name: 'Giárdia', date: '02 OUT 2025', clinic: 'Clyvo Vet · Centro', vet: 'Dra. Ana M.', lote: 'GD-552-25', status: 'sage', sLabel: 'Aplicada' },
              { name: 'Tosse dos canis', date: '15 JUN 2025', clinic: 'Clyvo Vet · Centro', vet: 'Dra. Ana M.', lote: 'KC-220-25', status: 'sage', sLabel: 'Aplicada' },
            ].map((v, i) => (
              <div key={i} className="k-card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--sage-pale)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(74,105,68,0.18)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2l-3 3 5 5 3-3z M8 5l-4 4 5 5 4-4M3 14l4 4M9 16l5 5"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 }}>{v.name}</div>
                    <KChip tone={v.status}>✓ {v.sLabel}</KChip>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>{v.clinic} · {v.vet}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>
                    <span>📅 {v.date}</span>
                    <span>🧪 lote {v.lote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas */}
        <div style={{ padding: '20px 24px 24px' }}>
          <KKicker>Próximas</KKicker>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'V10 reforço anual', when: 'ABR 2027', remaining: 'em 11 meses', tone: 'mute' },
              { name: 'Antirrábica', when: 'NOV 2026', remaining: 'em 7 meses', tone: 'mute' },
            ].map((v, i) => (
              <div key={i} className="k-card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--surface-2)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed var(--border-strong)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 }}>{v.name}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                    <span>{v.when}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-mute)' }}/>
                    <span>{v.remaining}</span>
                  </div>
                </div>
                <button style={{
                  padding: '8px 14px', borderRadius: 9999, cursor: 'pointer',
                  background: 'var(--sage)', border: 0, color: 'var(--text-on-sage)',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                }}>Agendar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <KTabBar active="doc"/>
      <KHomeIndicator/>
    </div>
  );
}

// ═══ SCREEN 9: AGENDAR CONSULTA ═════════════════════════════════
function ScreenAgendar() {
  const [type, setType] = React.useState('pres');
  const [day, setDay] = React.useState(2);
  const [slot, setSlot] = React.useState('14:30');

  const days = [
    { d: 28, w: 'Seg', month: 'ABR' },
    { d: 29, w: 'Ter', month: 'ABR' },
    { d: 30, w: 'Qua', month: 'ABR' },
    { d: 1, w: 'Qui', month: 'MAI' },
    { d: 2, w: 'Sex', month: 'MAI' },
    { d: 3, w: 'Sáb', month: 'MAI' },
    { d: 5, w: 'Seg', month: 'MAI' },
  ];
  const slots = ['09:00', '10:30', '11:00', '14:00', '14:30', '15:30', '16:00', '17:30'];
  const unavailable = ['10:30', '15:30'];

  return (
    <div className="k-phone" data-screen-label="09 Agendar">
      <KStatusBar/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="k-header-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>Passo 2 de 3</div>
        <div style={{ width: 40 }}/>
      </div>

      <div className="k-body">
        <div style={{ padding: '12px 24px 8px' }}>
          <KKicker color="var(--sage)">Nova consulta</KKicker>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text)', marginTop: 4,
          }}>Agendar para <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>Bóbi.</em></h1>
        </div>

        {/* Pet selecionado */}
        <div style={{ padding: '12px 24px 0' }}>
          <div className="k-card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <KPetPhoto palette="lab" size={40}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 }}>Bóbi</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>Labrador · 3 anos</div>
            </div>
            <button style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--sage)', background: 'transparent', border: 0,
              fontWeight: 500, cursor: 'pointer',
            }}>Trocar</button>
          </div>
        </div>

        {/* Tipo */}
        <div style={{ padding: '18px 24px 0' }}>
          <div className="k-field-label" style={{ marginBottom: 8 }}>Tipo de atendimento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'pres', label: 'Presencial', sub: 'Clínica' },
              { id: 'tele', label: 'Telemedicina', sub: 'Vídeo' },
            ].map(t => (
              <button key={t.id} onClick={() => setType(t.id)} style={{
                padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
                background: type === t.id ? (t.id === 'tele' ? 'var(--ocean-pale)' : 'var(--sage-pale)') : 'var(--surface)',
                border: `1px solid ${type === t.id ? (t.id === 'tele' ? 'var(--ocean)' : 'var(--sage)') : 'var(--border-strong)'}`,
                borderRadius: 14,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500,
                  color: type === t.id ? (t.id === 'tele' ? 'var(--ocean)' : 'var(--sage)') : 'var(--text)',
                }}>{t.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clínica */}
        <div style={{ padding: '14px 24px 0' }}>
          <div className="k-field">
            <label className="k-field-label">{type === 'tele' ? 'Veterinário(a)' : 'Clínica'}</label>
            <div className="k-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontWeight: 500 }}>{type === 'tele' ? 'Dra. Ana Mendes · CRMV-SP 12345' : 'Clyvo Vet · Centro · 1,2km'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Calendário horizontal */}
        <div style={{ padding: '8px 0 0' }}>
          <div style={{ padding: '0 24px', marginBottom: 10 }}>
            <label className="k-field-label">Data</label>
          </div>
          <div style={{
            display: 'flex', gap: 8, padding: '0 24px 8px',
            overflowX: 'auto',
          }}>
            {days.map((d, i) => {
              const sel = day === d.d;
              return (
                <button key={i} onClick={() => setDay(d.d)} style={{
                  flexShrink: 0, width: 56, padding: '10px 0', cursor: 'pointer',
                  background: sel ? 'var(--sage)' : 'var(--surface)',
                  color: sel ? 'var(--text-on-sage)' : 'var(--text)',
                  border: `1px solid ${sel ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 140ms var(--ease)',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>{d.w}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, lineHeight: 1 }}>{d.d}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', opacity: 0.6 }}>{d.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div style={{ padding: '12px 24px 0' }}>
          <label className="k-field-label" style={{ marginBottom: 8, display: 'block' }}>Horário disponível</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {slots.map(s => {
              const u = unavailable.includes(s);
              const sel = slot === s;
              return (
                <button key={s} disabled={u} onClick={() => setSlot(s)} style={{
                  padding: '10px 0', cursor: u ? 'not-allowed' : 'pointer',
                  background: sel ? 'var(--sage)' : 'var(--surface)',
                  color: u ? 'var(--text-mute)' : sel ? 'var(--text-on-sage)' : 'var(--text)',
                  border: `1px solid ${sel ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 9999,
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.04em',
                  opacity: u ? 0.4 : 1,
                  textDecoration: u ? 'line-through' : 'none',
                }}>{s}</button>
              );
            })}
          </div>
        </div>

        {/* Motivo */}
        <div style={{ padding: '14px 24px 0' }}>
          <div className="k-field">
            <label className="k-field-label">Motivo da consulta</label>
            <textarea className="k-textarea" rows={2} placeholder="Ex.: avaliação da medicação prescrita…" defaultValue="Retorno · avaliação de dermatite"/>
          </div>
        </div>

        {/* Resumo */}
        <div style={{ padding: '8px 24px 0' }}>
          <div style={{
            background: 'var(--sage-pale)',
            border: '1px solid rgba(74,105,68,0.22)',
            borderRadius: 14, padding: 14,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 8 }}>Resumo do agendamento</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>
                  {String(day).padStart(2, '0')} mai · {slot}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginTop: 4 }}>
                  {type === 'tele' ? 'Telemedicina · Dra. Ana M.' : 'Clyvo Vet · Centro'}
                </div>
              </div>
              <KChip tone={type === 'tele' ? 'ocean' : 'sage'}>{type === 'tele' ? 'Tele' : 'Presencial'}</KChip>
            </div>
          </div>
        </div>

        <div style={{ padding: '18px 24px 24px' }}>
          <button className="k-btn k-btn-primary k-btn-block">
            Confirmar agendamento
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </div>

      <KHomeIndicator/>
    </div>
  );
}

Object.assign(window, { ScreenConsultasHistory, ScreenConsultaDetail, ScreenVacinas, ScreenAgendar });
