// kura-screens-1.jsx — Screens 1-3: Splash, Login, Home

// ═══ SCREEN 1: SPLASH ═══════════════════════════════════════════
function ScreenSplash() {
  return (
    <div className="k-phone" data-screen-label="01 Splash">
      <KStatusBar/>
      {/* Warm orbs */}
      <div className="k-orb" style={{ top: -80, right: -80, width: 280, height: 280, background: 'var(--amber)', opacity: 0.18 }}/>
      <div className="k-orb" style={{ bottom: 60, left: -80, width: 260, height: 260, background: 'var(--sage)', opacity: 0.18 }}/>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1, padding: '0 32px',
      }}>
        <div style={{
          animation: 'kFadeIn 1s var(--ease) both',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        }}>
          <KuraLogo size={88} />
          <div className="k-wordmark" style={{ fontSize: 76, fontWeight: 400 }}>
            Kura<em>.</em>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontWeight: 300, fontSize: 22, color: 'var(--text-soft)',
            letterSpacing: '-0.01em', marginTop: 8,
          }}>
            O cuidado registrado.
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 56, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 2, borderRadius: 2,
            background: 'var(--sage)', opacity: 0.6,
            animation: 'kPulse 1.4s ease-in-out infinite',
          }}/>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--text-mute)',
          }}>
            Clyvo Vet · v1.0
          </div>
        </div>
      </div>
      <KHomeIndicator/>
      <style>{`
        @keyframes kFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes kPulse { 0%,100% { opacity: 0.3; transform: scaleX(0.5); } 50% { opacity: 0.9; transform: scaleX(1); } }
      `}</style>
    </div>
  );
}

// ═══ SCREEN 2: LOGIN ════════════════════════════════════════════
function ScreenLogin() {
  const [showPwd, setShowPwd] = React.useState(false);
  const [email, setEmail] = React.useState('felipe@clyvovet.com');
  const [pwd, setPwd] = React.useState('cuidados2026');

  return (
    <div className="k-phone" data-screen-label="02 Login">
      <KStatusBar/>
      <div className="k-orb" style={{ top: -60, right: -100, width: 280, height: 280, background: 'var(--sage)', opacity: 0.18 }}/>
      <div className="k-orb" style={{ bottom: -40, left: -60, width: 220, height: 220, background: 'var(--amber)', opacity: 0.16 }}/>

      <div className="k-body" style={{ padding: '24px 24px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <KuraLogo size={36} />
          <div className="k-wordmark" style={{ fontSize: 32 }}>Kura<em>.</em></div>
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="k-kicker" style={{ color: 'var(--sage)', marginBottom: 14 }}>Bem-vindo(a) de volta</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: 10,
          }}>
            Cada consulta,<br/>cada vacina,<br/><em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>registrada.</em>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
            color: 'var(--text-soft)', maxWidth: 280,
          }}>
            Acesse o histórico do seu pet, agende consultas e receba lembretes da clínica.
          </p>
        </div>

        <div style={{ marginTop: 36 }}>
          <div className="k-field">
            <label className="k-field-label">E-mail</label>
            <input className="k-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="k-field">
            <label className="k-field-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input className="k-input" type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} style={{ paddingRight: 56 }} />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{
                position: 'absolute', right: 6, top: 6, bottom: 6,
                padding: '0 14px', background: 'transparent', border: 0,
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--sage)', cursor: 'pointer', borderRadius: 9,
              }}>{showPwd ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: -4, marginBottom: 22 }}>
            <a href="#" style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              color: 'var(--sage)', textDecoration: 'none',
            }}>Esqueci a senha</a>
          </div>

          <button className="k-btn k-btn-primary k-btn-block">
            Entrar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-mute)',
            }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          <button className="k-btn k-btn-secondary k-btn-block">Criar conta</button>
        </div>

        <div style={{
          marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--text-mute)', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>LGPD · AES-256</span>
          <span>Clyvo Vet</span>
        </div>
      </div>

      <KHomeIndicator/>
    </div>
  );
}

// ═══ SCREEN 3: HOME / MEUS PETS ═════════════════════════════════
function ScreenHome({ onPet }) {
  return (
    <div className="k-phone" data-screen-label="03 Home Meus Pets">
      <KStatusBar/>
      <div className="k-orb" style={{ top: -60, right: -100, width: 240, height: 240, background: 'var(--amber)', opacity: 0.14 }}/>

      <div className="k-body" style={{ position: 'relative', zIndex: 1 }}>
        {/* Greeting header */}
        <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KuraLogo size={28}/>
            <div className="k-wordmark" style={{ fontSize: 22 }}>Kura<em>.</em></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', cursor: 'pointer', position: 'relative',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', border: '1.5px solid var(--surface)' }}/>
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <div className="k-kicker" style={{ marginBottom: 6, color: 'var(--text-mute)' }}>
            <span>Boa tarde, Felipe</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: 8,
          }}>
            Meus <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>pets.</em>
          </h1>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--text-mute)',
          }}>3 pets · 1 alerta</div>
        </div>

        {/* Proactive alert */}
        <div style={{ padding: '18px 24px 10px' }}>
          <div style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            background: 'var(--clay-pale)',
            border: '1px solid rgba(217,98,74,0.22)',
            borderLeft: '3px solid var(--clay)',
            borderRadius: 14,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(217,98,74,0.15)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--clay)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 9v4M12 17h0"/><circle cx="12" cy="12" r="9"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay)', marginBottom: 2 }}>Bóbi · retorno em 2 dias</div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.4 }}>Avaliação da medicação prescrita para dermatite.</div>
            </div>
            <button style={{
              alignSelf: 'flex-start', background: 'transparent', border: 0,
              color: 'var(--clay)', fontFamily: 'var(--font-mono)',
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', fontWeight: 500,
            }}>Ver →</button>
          </div>
        </div>

        {/* Pet cards */}
        <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PetListCard
            tier="photo" palette="lab" name="Bóbi" meta="Labrador · 3 anos · 28 kg"
            stats={[
              { k: 'última', v: 'há 6 dias' },
              { k: 'próximo', v: 'Retorno', alert: true },
              { k: 'consultas', v: '12' },
            ]}
            chips={[{ tone: 'clay', label: '⚠ Retorno 2d', dot: false }, { tone: 'sage', label: 'Vacinado' }]}
            onClick={onPet}
          />
          <PetListCard
            tier="emoji" emoji="🐱" name="Luna" meta="Siamesa · 5 anos · 4,2 kg"
            stats={[
              { k: 'última', v: '3 sem.' },
              { k: 'próxima', v: '—' },
              { k: 'consultas', v: '8' },
            ]}
            chips={[{ tone: 'sage', label: 'Vacinado' }, { tone: 'mute', label: 'Siamesa' }]}
          />
          <PetListCard
            tier="detected" emoji="🐶" name="Thor" meta="SRD · ~2 anos · 14 kg"
            badge="✨"
            stats={[
              { k: 'última', v: 'nunca' },
              { k: 'próxima', v: '1ª visita' },
              { k: 'consultas', v: '0' },
            ]}
            chips={[{ tone: 'amber', label: '✨ Câmera Luna' }, { tone: 'mute', label: 'Em adaptação' }]}
          />

          <button className="k-btn k-btn-ghost k-btn-block" style={{ marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Adicionar pet
          </button>
        </div>
      </div>

      <KTabBar active="pets"/>
      <KHomeIndicator/>
    </div>
  );
}

function PetListCard({ tier, emoji, palette, photo, name, meta, stats, chips, badge, onClick }) {
  return (
    <div className="k-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', gap: 14, alignItems: 'center' }}>
        {tier === 'photo'
          ? <KPetPhoto palette={palette} size={56}/>
          : <KPetAvatar tier={tier} emoji={emoji} badge={badge} size={56}/>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: 26, letterSpacing: '-0.01em',
            color: 'var(--text)', lineHeight: 1.05,
          }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 3 }}>{meta}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {chips.map((c, i) => <KChip key={i} tone={c.tone}>{c.label}</KChip>)}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid var(--border)',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: '12px 12px',
            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--text-mute)', marginBottom: 4,
            }}>{s.k}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 500,
              fontSize: 16, color: s.alert ? 'var(--clay)' : 'var(--text)',
              lineHeight: 1,
            }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenSplash, ScreenLogin, ScreenHome });
