import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { BlurView } from "expo-blur";

/**
 * SUPREME ADMIN NAVIGATION LAYOUT - (admin)/_layout.js
 * Features: Dark Glassmorphism, Floating Navigation, and Authority-based UI.
 * Sync: Dashboard, EntityManagement, Analytics, and Global Broadcasts.
 */
export default function AdminLayout() {
  return (
    <>
      {/* Light icons for the dark-themed command center */}
      <StatusBar style="light" />

      <Tabs
        screenOptions={{
          // 1. GLOBAL HEADER STYLING (The Command Bar)
          headerTransparent: true,
          headerBackground: () => (
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ),
          headerStyle: {
            backgroundColor: "rgba(15, 23, 42, 0.5)", // Semi-transparent Navy
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 18,
            letterSpacing: 1,
          },
          headerTitleAlign: "center",
          headerShadowVisible: false,

          // 2. TAB BAR STYLING (The Floating Glass Pill)
          tabBarActiveTintColor: "#6366f1", // Indigo accent for active
          tabBarInactiveTintColor: "#64748b", // Muted slate for inactive
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,

          // 3. TAB BAR GLASS EFFECT (Dark Frost)
          tabBarBackground: () => (
            <BlurView intensity={30} tint="dark" style={styles.tabBlur} />
          ),

          // Smooth native transition
          animation: "fade",
        }}
      >
        {/* --- MAIN ADMIN TABS --- */}

        {/* Dashboard: System KPI and Revenue Overview */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: "Control Room",
            headerShown: false, // Custom greeting header inside component
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Entity Management: Verification Queue */}
        <Tabs.Screen
          name="EntityManagement"
          options={{
            title: "Verification Hub",
            tabBarLabel: "Verify",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "shield-check" : "shield-check-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* System Analytics: Platform Growth (Hidden from bar if needed, or kept for BI) */}
        <Tabs.Screen
          name="SystemAnalytics"
          options={{
            title: "Platform BI",
            tabBarLabel: "Analytics",
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome5
                name={focused ? "chart-line" : "chart-line"}
                size={20}
                color={color}
              />
            ),
          }}
        />

        {/* --- HIDDEN UTILITY ROUTES --- */}
        {/* These function in the background but stay out of the bottom bar */}

        <Tabs.Screen
          name="GlobalNotice"
          options={{
            href: null,
            title: "Broadcast Hub",
          }}
        />

        <Tabs.Screen
          name="SystemLogs"
          options={{
            href: null,
            title: "Security Logs",
          }}
        />

        <Tabs.Screen
          name="SystemSettings"
          options={{
            href: null,
            title: "Platform Config",
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Subtle border for dark mode
    backgroundColor: "rgba(15, 23, 42, 0.8)", // Dark base
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    overflow: "hidden",
  },
  tabBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Platform.OS === "ios" ? 0 : 8,
  },
});
