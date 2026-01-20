import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

/**
 * PREMIUM STUDENT NAVIGATION LAYOUT
 * Features: Floating Glassmorphism Tab Bar, Indigo Academic Theme.
 * Sync: Dashboard, Profile, Result, Admit Card, ApplyService.
 */
export default function StudentLayout() {
  return (
    <>
      {/* Light icons for the indigo/blue themed portal */}
      <StatusBar style="light" />

      <Tabs
        screenOptions={{
          // 1. GLOBAL HEADER STYLING
          headerStyle: { backgroundColor: "#1e40af" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 18,
            letterSpacing: -0.5,
          },
          headerTitleAlign: "center",
          headerShadowVisible: false,

          // 2. TAB BAR STYLING (The Floating Glass Pill)
          tabBarActiveTintColor: "#1e40af",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,

          // 3. TAB BAR GLASS EFFECT
          tabBarBackground: () => (
            <BlurView
              intensity={95}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ),

          animation: "fade",
        }}
      >
        {/* --- MAIN VISIBLE TABS --- */}

        {/* Home: Digital Hub */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: "Student Hub",
            headerShown: false, // Custom greeting header used inside component
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Academics: Results & Performance */}
        <Tabs.Screen
          name="ResultScreen"
          options={{
            title: "My Results",
            tabBarLabel: "Results",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Profile: Identity & Account Hub */}
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Identity Portal",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome5
                name={focused ? "user-graduate" : "user-graduate"}
                size={20}
                color={color}
              />
            ),
          }}
        />

        {/* --- HIDDEN SCREEN REGISTRY (Functional Only) --- */}

        {/* Admit Card: Usually seasonal, accessible via Dashboard */}
        <Tabs.Screen
          name="AdmitCard"
          options={{
            href: null,
            title: "Exam Pass",
          }}
        />

        {/* ID Application Form: Accessible via Profile/Dashboard */}
        <Tabs.Screen
          name="ApplyService"
          options={{
            href: null,
            title: "ID Application",
            tabBarStyle: { display: "none" }, // Hides bar during form filling
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
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    overflow: "hidden",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Platform.OS === "ios" ? 0 : 8,
  },
});
