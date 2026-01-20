import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * SHOP NAVIGATION LAYOUT
 * Clean, minimal mobile-first design
 */
export default function ShopLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Tabs
        screenOptions={{
          // Header
          headerShown: false,

          // Tab Bar
          tabBarActiveTintColor: "#1a73e8",
          tabBarInactiveTintColor: "#5f6368",
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,

          // No animations for better performance
          animation: "none",
        }}
      >
        {/* Main Tabs */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: "Dashboard",
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

        <Tabs.Screen
          name="PrintPreview"
          options={{
            title: "Orders",
            tabBarLabel: "Orders",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="LocalBusinessLedger"
          options={{
            title: "Ledger",
            tabBarLabel: "Ledger",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "book" : "book-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="ProfileSettings"
          options={{
            title: "Settings",
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Hidden Screens */}
        <Tabs.Screen
          name="CustomerCRM"
          options={{ href: null, title: "Clients" }}
        />
        <Tabs.Screen
          name="PaymentTracker"
          options={{ href: null, title: "Payments" }}
        />
        <Tabs.Screen
          name="EarningsHu"
          options={{ href: null, title: "Earnings" }}
        />
        <Tabs.Screen
          name="WorkPortfolio"
          options={{ href: null, title: "Portfolio" }}
        />
        <Tabs.Screen
          name="RateList"
          options={{ href: null, title: "Pricing" }}
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
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8eaed",
    elevation: 0,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
});
