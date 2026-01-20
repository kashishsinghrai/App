import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

/**
 * SCHOOL NAVIGATION LAYOUT
 * Minimal, refined design for school administration
 */
export default function SchoolLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#0a0a0a",
          tabBarInactiveTintColor: "#999999",
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          animation: "shift",
        }}
      >
        {/* Main Tabs */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: "Dashboard",
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Feather
                name="home"
                size={focused ? 23 : 22}
                color={color}
                style={{ marginBottom: focused ? 1 : 0 }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="ManageStudents"
          options={{
            title: "Students",
            tabBarLabel: "Students",
            tabBarIcon: ({ color, focused }) => (
              <Feather
                name="users"
                size={focused ? 23 : 22}
                color={color}
                style={{ marginBottom: focused ? 1 : 0 }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="ManageStaff"
          options={{
            title: "Staff",
            tabBarLabel: "Staff",
            tabBarIcon: ({ color, focused }) => (
              <Feather
                name="user"
                size={focused ? 23 : 22}
                color={color}
                style={{ marginBottom: focused ? 1 : 0 }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Settings"
          options={{
            title: "Settings",
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Feather
                name="settings"
                size={focused ? 23 : 22}
                color={color}
                style={{ marginBottom: focused ? 1 : 0 }}
              />
            ),
          }}
        />

        {/* Hidden Screens */}
        <Tabs.Screen
          name="ManageResults"
          options={{ href: null, title: "Results" }}
        />
        <Tabs.Screen
          name="ManageAdmitCards"
          options={{ href: null, title: "Admit Cards" }}
        />
        <Tabs.Screen
          name="Attendance"
          options={{ href: null, title: "Attendance" }}
        />
        <Tabs.Screen
          name="FeeManagement"
          options={{ href: null, title: "Fees" }}
        />
        <Tabs.Screen
          name="FindShop"
          options={{ href: null, title: "Find Shop" }}
        />
        <Tabs.Screen
          name="NoticeBoard"
          options={{ href: null, title: "Notices" }}
        />
        <Tabs.Screen name="LMSPortal" options={{ href: null, title: "LMS" }} />
        <Tabs.Screen
          name="LMSContent"
          options={{ href: null, title: "LMS Content" }}
        />
        <Tabs.Screen
          name="StudentDetails"
          options={{ href: null, title: "Student Details" }}
        />
        <Tabs.Screen
          name="TemplateDesigner"
          options={{
            href: null,
            title: "Designer",
            tabBarStyle: { display: "none" },
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 0,
    shadowColor: "transparent",
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: -0.1,
  },
});
