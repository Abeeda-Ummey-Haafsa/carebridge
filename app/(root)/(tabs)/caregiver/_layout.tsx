import React, { useEffect } from "react";
import { Image, View, Text, StyleSheet, Alert } from "react-native";
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

import { useSetAuthToken, fetchAPI } from "@/lib/fetch";
import { useCaregiverStore } from "@/store/caregiverStore";
import { useAuth } from "@clerk/clerk-expo";

const CaregiverTabLayout = () => {
  useSetAuthToken();
  const { isSignedIn } = useAuth();
  const setProfile = useCaregiverStore((s) => s.setProfile);

  useEffect(() => {
    if (!isSignedIn) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchAPI("/api/caregivers/me");
        if (mounted && res?.data) {
          setProfile(res.data);
        }
      } catch (e: any) {
        console.error("prefetch caregiver profile", e);
        try {
          Alert.alert("Failed to load profile");
        } catch {}
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, setProfile]);

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#007BFF",
        tabBarInactiveTintColor: "#6c757d",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 84,
          borderRadius: 20,
          margin: 10,
          position: "absolute",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
      }}
    >
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
      <Tabs.Screen
        name="active-session"
        options={{
          title: "Active Session",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.session}
              color={color}
              name="Session"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon
                icon={icons.chat}
                color={color}
                name="Chat"
                focused={focused}
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="session-history"
        options={{
          title: "Session History",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.history}
              color={color}
              name="History"
              focused={focused}
            />
          ),
        }}
      />
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
    backgroundColor: "red",
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

export default CaregiverTabLayout;
