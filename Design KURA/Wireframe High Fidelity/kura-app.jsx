// kura-app.jsx — Composes screens into design canvas

function App() {
  const A = (id, label, theme, ScreenEl) => (
    <DCArtboard id={id} label={label} width={375} height={812}>
      <div data-theme={theme} style={{ width: 375, height: 812, position: 'relative' }}>
        {ScreenEl}
      </div>
    </DCArtboard>
  );

  return (
    <DesignCanvas title="Kura · App Tutor" subtitle="High-fidelity prototypes · 9 screens · Light + Dark · 375×812">

      <DCSection id="onboarding" title="Bloco 1 · Onboarding" subtitle="Splash + Login (light & dark)">
        {A('splash-light', '01 · Splash · Light', 'light', <ScreenSplash/>)}
        {A('splash-dark',  '01 · Splash · Dark',  'dark',  <ScreenSplash/>)}
        {A('login-light',  '02 · Login · Light',  'light', <ScreenLogin/>)}
        {A('login-dark',   '02 · Login · Dark',   'dark',  <ScreenLogin/>)}
      </DCSection>

      <DCSection id="meus-pets" title="Bloco 2 · Meus Pets" subtitle="Home, detalhes e cadastro">
        {A('home-light',   '03 · Home · Light',          'light', <ScreenHome/>)}
        {A('home-dark',    '03 · Home · Dark',           'dark',  <ScreenHome/>)}
        {A('detail-light', '04 · Detalhes · Light',      'light', <ScreenPetDetails/>)}
        {A('detail-dark',  '04 · Detalhes · Dark',       'dark',  <ScreenPetDetails/>)}
        {A('add',          '05 · Novo Pet',              'light', <ScreenAddPet/>)}
      </DCSection>

      <DCSection id="consultas" title="Bloco 3 · Consultas" subtitle="Histórico + prontuário detalhado">
        {A('hist',         '06 · Histórico',             'light', <ScreenConsultasHistory/>)}
        {A('cdetail',      '07 · Prontuário',            'light', <ScreenConsultaDetail/>)}
      </DCSection>

      <DCSection id="vacinas" title="Bloco 4 · Vacinas" subtitle="Carteira completa">
        {A('vac',          '08 · Carteira de Vacinação', 'light', <ScreenVacinas/>)}
      </DCSection>

      <DCSection id="agendar" title="Bloco 5 · Agendamento" subtitle="Fluxo de marcação interativo">
        {A('agendar',      '09 · Agendar',               'light', <ScreenAgendar/>)}
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
