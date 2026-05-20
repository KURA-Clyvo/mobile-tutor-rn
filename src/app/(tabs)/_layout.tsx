import { Tabs } from 'expo-router';
import { KTabBar } from '../../components/layout/KTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <KTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="pets"   options={{ title: 'Pets'   }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="saude"  options={{ title: 'Saúde'  }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
