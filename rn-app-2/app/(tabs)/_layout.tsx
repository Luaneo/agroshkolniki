import React, { useEffect } from "react";

import { lightAccent } from "@/constants/theme";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  useEffect(() => {
    if (AsyncStorage.getItem("responses") === null) {
      AsyncStorage.setItem("responses", `[{"name":"foo"}]`);
    }
  }, []);

  // return (
  //   <Tabs
  //     screenOptions={{
  //       tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
  //       headerShown: false,
  //       tabBarButton: HapticTab,
  //     }}>
  //     <Tabs.Screen
  //       name="index"
  //       options={{
  //         title: 'Home',
  //         tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="explore"
  //       options={{
  //         title: 'Explore',
  //         tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
  //       }}
  //     />
  //   </Tabs>
  // );
  return (
    <NativeTabs iconColor={lightAccent}>
      {/* <NativeTabs.Trigger name="index">
        <Label>Главная</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger> */}
      <NativeTabs.Trigger name="home">
        <Label>Главная</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="records">
        <Label>Отчеты</Label>
        <Icon sf="list.bullet.clipboard.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
