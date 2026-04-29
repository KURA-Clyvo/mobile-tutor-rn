// kura-screens-2.jsx — Screens 4-5: Pet Details, Add Pet

// ═══ SCREEN 4: PET DETAILS ══════════════════════════════════════
function ScreenPetDetails({ onBack }) {
  const [tab, setTab] = React.useState('overview');

  return (
    <div className="k-phone" data-screen-label="04 Detalhes do Pet">
      <KStatusBar/>
      <div className="k-orb" style={{ top: -80, left: -80, width: 280, height: 280, background: 'var(--sage)', opacity: 0.16 }}/>

      <div className="k-body" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header w/ back */}
        <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="k-header-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--text-mute)',
          }}>Pet · #BB-0421</div>
          <button className="k-header-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>
          </button>
        </div>

        {/* Hero */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <KPetPhoto palette="lab" size={92}/>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: 38, letterSpacing: '-0.02em',
            color: 'var(--text)', marginTop: 14, lineHeight: 1,
          }}>Bóbi</h1>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>Labrador · macho · 3 anos</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <KChip tone="sage" dot>Vacinado</KChip>
            <KChip tone="clay">⚠ Retorno em 2d</KChip>
            <KChip tone="ocean">Castrado</KChip>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '8px 24px 0', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 4 }}>
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 9999,
          }}>
            {[
              { id: 'overview', label: 'Visão' },
              { id: 'consultas', label: 'Consultas' },
              { id: 'vacinas', label: 'Vacinas' },
              { id: 'docs', label: 'Docs' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '8px 4px', border: 0, cursor: 'pointer',
                background: tab === t.id ? 'var(--sage)' : 'transparent',
                color: tab === t.id ? 'var(--text-on-sage)' : 'var(--text-mute)',
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                borderRadius: 9999, transition: 'all 200ms var(--ease)',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === 'overview' && <PetOverview/>}
        {tab === 'consultas' && <PetConsultasInline/>}
        {tab === 'vacinas' && <PetVacinasInline/>}
        {tab === 'docs' && <PetDocsInline/>}

        <div style={{ height: 90 }}/>
      </div>

      {/* FAB */}
      <button style={{
        position: 'absolute', bottom: 96, right: 20, zIndex: 10,
        height: 52, padding: '0 22px', borderRadius: 9999,
        background: 'var(--sage)', color: 'var(--text-on-sage)',
        border: 0, cursor: 'pointer',
        boxShadow: 'var(--shadow-sage)',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Agendar
      </button>

      <KTabBar active="pets"/>
      <KHomeIndicator/>
    </div>
  );
}

function PetOverview() {
  return (
    <div style={{ padding: '18px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { k: 'Peso', v: '28', sub: 'kg', tone: 'sage' },
          { k: 'Temp.', v: '38,5', sub: '°C', tone: 'sage' },
          { k: 'Score', v: '8.4', sub: '/10', tone: 'amber' },
        ].map((s, i) => (
          <div key={i} className="k-card" style={{ padding: 12, textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--text-mute)', marginBottom: 6,
            }}>{s.k}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 500,
              fontSize: 26, color: 'var(--text)', lineHeight: 1,
            }}>
              {s.v}
              <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 2 }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Próximo agendamento */}
      <div className="k-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <KKicker color="var(--sage)">Próximo</KKicker>
          <KChip tone="ocean">Tele</KChip>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 56, padding: '8px 0', textAlign: 'center',
              background: 'var(--sage-pale)', borderRadius: 12, flexShrink: 0,
              border: '1px solid rgba(74,105,68,0.18)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sage)' }}>Mai</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, color: 'var(--sage)', lineHeight: 1 }}>02</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>14:30</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', lineHeight: 1.15 }}>Retorno · dermatite</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>Dra. Ana Mendes · CRMV-SP 12345</div>
            </div>
          </div>
        </div>
      </div>

      {/* Atividade recente */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
          <KKicker>Últimas atividades</KKicker>
          <a style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sage)' }}>Tudo</a>
        </div>

        <div style={{ paddingLeft: 4 }}>
          {[
            { date: '27 ABR', tone: 'sage', kind: 'Pesagem', meta: '28,0 kg · +200g vs último', tag: 'Auto' },
            { date: '20 ABR', tone: 'ocean', kind: 'Teleorientação', meta: 'Dra. Ana · 22 min', tag: 'Tele' },
            { date: '14 ABR', tone: 'amber', kind: 'V10 reforço', meta: 'Lote 4A82B · Clínica PetLife', tag: 'Vacina' },
            { date: '02 ABR', tone: 'sage', kind: 'Consulta', meta: 'Dermatite alérgica · Dr. Paulo', tag: 'Presencial' },
          ].map((it, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 14, position: 'relative' }}>
              {i < arr.length - 1 && <div style={{ position: 'absolute', left: 5, top: 16, bottom: 0, width: 1, background: 'var(--border)' }}/>}
              <div style={{
                width: 11, height: 11, marginTop: 4, borderRadius: '50%',
                background: 'var(--bg)', border: `2px solid var(--${it.tone})`, flexShrink: 0,
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <span>{it.date}</span><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-mute)' }}/><span>{it.tag}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>{it.kind}</div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>{it.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PetConsultasInline() {
  return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Veja a tela 06 — Histórico de Consultas →</div>;
}
function PetVacinasInline() {
  return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Veja a tela 08 — Carteira de Vacinação →</div>;
}
function PetDocsInline() {
  return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Documentos em desenvolvimento.</div>;
}

// ═══ SCREEN 5: ADD PET ══════════════════════════════════════════
function ScreenAddPet() {
  const [species, setSpecies] = React.useState('cao');
  const [sex, setSex] = React.useState('M');
  const [name, setName] = React.useState('');

  const speciesOpts = [
    { id: 'cao', emoji: '🐶', label: 'Cão' },
    { id: 'gato', emoji: '🐱', label: 'Gato' },
    { id: 'coelho', emoji: '🐰', label: 'Coelho' },
    { id: 'ave', emoji: '🦜', label: 'Ave' },
  ];

  return (
    <div className="k-phone" data-screen-label="05 Novo Pet">
      <KStatusBar/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="k-header-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>Novo · 1 de 2</div>
        <button style={{
          background: 'transparent', border: 0, cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          color: 'var(--text-mute)',
        }}>Cancelar</button>
      </div>

      <div className="k-body">
        <div style={{ padding: '16px 24px 0' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>Novo <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>pet.</em></h1>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 8, marginBottom: 22 }}>
            Quanto mais detalhes, mais preciso o cuidado. Sem pressa — pode editar tudo depois.
          </div>

          {/* Photo upload */}
          <div style={{
            border: '1.5px dashed var(--border-strong)', borderRadius: 18,
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--surface)', marginBottom: 22, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--sage-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(74,105,68,0.18)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Foto do pet</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)', marginTop: 2 }}>Toque para escolher</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <KChip tone="sage" dot>✨ Câmera</KChip>
              <KChip tone="mute">Galeria</KChip>
            </div>
          </div>

          {/* Name */}
          <div className="k-field">
            <label className="k-field-label">Nome do pet</label>
            <input className="k-input" placeholder="Ex.: Bóbi, Luna, Thor…" value={name} onChange={e => setName(e.target.value)}/>
          </div>

          {/* Species */}
          <div className="k-field">
            <label className="k-field-label">Espécie</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {speciesOpts.map(s => (
                <button key={s.id} onClick={() => setSpecies(s.id)} style={{
                  padding: '14px 4px', cursor: 'pointer',
                  background: species === s.id ? 'var(--sage-pale)' : 'var(--surface)',
                  border: `1px solid ${species === s.id ? 'var(--sage)' : 'var(--border-strong)'}`,
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
                  transition: 'all 140ms var(--ease)',
                }}>
                  <span style={{ fontSize: 24 }}>{s.emoji}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    color: species === s.id ? 'var(--sage)' : 'var(--text-mute)',
                    fontWeight: 500,
                  }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Breed */}
          <div className="k-field">
            <label className="k-field-label">Raça</label>
            <input className="k-input" placeholder="Comece a digitar…" defaultValue=""/>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>Sugestões: Labrador · Golden · SRD</div>
          </div>

          {/* Date + sex */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
            <div className="k-field">
              <label className="k-field-label">Nascimento</label>
              <input className="k-input" placeholder="—" defaultValue="14 / 03 / 2023"/>
            </div>
            <div className="k-field">
              <label className="k-field-label">Sexo</label>
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 12 }}>
                {['M', 'F'].map(s => (
                  <button key={s} onClick={() => setSex(s)} style={{
                    flex: 1, padding: '10px 0', border: 0, cursor: 'pointer',
                    background: sex === s ? 'var(--sage)' : 'transparent',
                    color: sex === s ? 'var(--text-on-sage)' : 'var(--text-mute)',
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                    borderRadius: 8,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Obs */}
          <div className="k-field">
            <label className="k-field-label">Observações <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-mute)' }}>(opcional)</span></label>
            <textarea className="k-textarea" rows={3} placeholder="Alergias, manias, cuidados especiais…"/>
          </div>

          <button className="k-btn k-btn-primary k-btn-block" style={{ marginTop: 12, marginBottom: 18 }}>
            Cadastrar pet
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-mute)', textAlign: 'center', paddingBottom: 16,
          }}>
            ⌧ Dados cifrados · LGPD compliant
          </div>
        </div>
      </div>

      <KHomeIndicator/>
    </div>
  );
}

Object.assign(window, { ScreenPetDetails, ScreenAddPet });
