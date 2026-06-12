import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { color } from "../../src/ui/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.inkFaint,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border },
        sceneStyle: { backgroundColor: color.background },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color: c, size }) => <Ionicons name="sunny-outline" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: "Plans",
          tabBarIcon: ({ color: c, size }) => <Ionicons name="map-outline" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color: c, size }) => <Ionicons name="leaf-outline" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ color: c, size }) => <Ionicons name="chatbubble-ellipses-outline" color={c} size={size} />,
        }}
      />
    </Tabs>
  );
}
