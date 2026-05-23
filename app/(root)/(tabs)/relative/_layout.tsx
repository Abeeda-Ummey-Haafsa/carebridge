import React from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { icons } from "@/constants";

import { ImageSourcePropType } from "react-native";

interface TabIconProps {
  icon: ImageSourcePropType;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon = ({ icon, color, name, focused }: TabIconProps) => {
  return (
    <View style={styles.tabIconContainer}>
      <Image
        source={icon}
        resizeMode="contain"
        style={{ tintColor: color, width: 24, height: 24 }}
      />
      <Text
        style={[
          styles.tabIconText,
          { color: color, fontWeight: focused ? "600" : "400" },
        ]}
      >
        {name}
      </Text>
    </View>
  );
};

const RelativeTabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#1fb299",
        tabBarInactiveTintColor: "#7d9194",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: 84,
          borderRadius: 22,
          marginHorizontal: 12,
          marginBottom: 10,
          position: "absolute",
          left: 12,
          right: 12,
          shadowColor: "#0d5c63",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 8,
        },
      }}
    >
      {/* HOME PAGE */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Home"
              focused={focused}
            />
          ),
        }}
      />
      {/* BROWSE CAREGIVERS */}
      <Tabs.Screen
        name="find-care"
        options={{
          title: "Find Care",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.findCare}
              color={color}
              name="Session"
              focused={focused}
            />
          ),
        }}
      />
      {/* CHAT TAB */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.chat}
              color={color}
              name="Chat"
              focused={focused}
            />
          ),
        }}
      />
      {/* BOOKING HISTORY + ACTIVE SESSION*/}
      <Tabs.Screen
        name="session-history"
        options={{
          title: "Sessions",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon
                icon={icons.history}
                color={color}
                name="Session"
                focused={focused}
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
            </View>
          ),
        }}
      />
      {/* SETTINGS + ELDER MANAGEMENT */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              color={color}
              name="Profile"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIconText: {
    fontSize: 12,
  },
  notificationBadge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default RelativeTabLayout;
