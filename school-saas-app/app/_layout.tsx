import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context"; // FIXED: Resolves SafeArea warnings
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../context/AuthContext";

/**
 * ROOT NAVIGATION GATEKEEPER
 * Manages global authentication state, role-based redirection,
 * and secures protected routes across all 5 user roles.
 */
function RootLayoutNav() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 1. Wait until Auth state is finished loading from AsyncStorage
    if (isLoading) return;

    // 2. Define protected folders
    const protectedGroups = [
      "(school)",
      "(shop)",
      "(student)",
      "(admin)",
      "(user)",
    ];

    // Check if the current route is inside a protected folder
    const inProtectedGroup = protectedGroups.includes(segments[0]);

    // 3. AUTHENTICATION REDIRECTION LOGIC

    // CASE A: User is NOT logged in but trying to access a dashboard
    if (!isAuthenticated && inProtectedGroup) {
      router.replace("/");
    }

    // CASE B: User IS logged in
    else if (isAuthenticated) {
      const role = user?.role; // admin, school, shop, student, user
      const targetGroup = `(${role})`;

      // B1: If user is on Landing/Login page, send them to their specific dashboard
      const isAtEntry =
        segments.length === 0 ||
        segments[0] === "index" ||
        segments[0] === "login";

      if (isAtEntry || segments[0] !== targetGroup) {
        switch (role) {
          case "admin":
            router.replace("/(admin)/Dashboard");
            break;
          case "school":
            router.replace("/(school)/Dashboard");
            break;
          case "shop":
            router.replace("/(shop)/Dashboard");
            break;
          case "student":
            router.replace("/(student)/Dashboard");
            break;
          case "user":
            router.replace("/(user)/Dashboard");
            break;
          default:
            router.replace("/");
            break;
        }
      }
    }
  }, [isAuthenticated, isLoading, user?.role, segments]);

  // 5. GLOBAL INITIALIZATION UI
  // Renders a high-end loader while the app verifies session integrity
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        {/* PUBLIC ACCESS ROUTES */}
        <Stack.Screen name="index" options={{ title: "Get Started" }} />
        <Stack.Screen
          name="login"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />

        {/* ROLE-BASED PORTAL GROUPS */}
        <Stack.Screen name="(school)" options={{ animation: "fade" }} />
        <Stack.Screen name="(shop)" options={{ animation: "fade" }} />
        <Stack.Screen name="(student)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="(admin)"
          options={{ animation: "fade_from_bottom" }}
        />
        <Stack.Screen name="(user)" options={{ animation: "fade" }} />

        {/* SYSTEM MODALS (Help, Support, etc.) */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}

/**
 * MAIN ENTRY WRAPPER
 * SafeAreaProvider is placed at the top level to fix global layout warnings.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc", // Soft Slate-50 background for premium look
  },
});
