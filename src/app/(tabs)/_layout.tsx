import { Tabs } from 'expo-router';
import { KTabBar } from '../../components/layout/KTabBar';
import { useAgendamentoBadgeCount } from '../../hooks/useAgendamentos';

export default function TabsLayout() {
  const badgeCount = useAgendamentoBadgeCount();
  return (
    <Tabs
      tabBar={(props) => <KTabBar {...props} agendaBadgeCount={badgeCount} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="pets"   options={{ title: 'Pets'   }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="saude"  options={{ title: 'Saúde'  }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
