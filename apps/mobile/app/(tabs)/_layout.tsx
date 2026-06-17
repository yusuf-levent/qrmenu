import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: "#047857" }}>
      <Tabs.Screen name="menu" options={{ title: "Menü" }} />
      <Tabs.Screen name="loyalty" options={{ title: "Sadakat" }} />
      <Tabs.Screen name="discover" options={{ title: "Keşfet" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

