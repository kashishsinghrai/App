import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function UserLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#1e293b",
          headerTitleStyle: { fontWeight: "800", fontSize: 18 },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Dashboard" options={{ headerShown: false }} />
        <Stack.Screen
          name="SchoolDiscovery"
          options={{ title: "Find Institutes" }}
        />
        <Stack.Screen
          name="InquiryForm"
          options={{ title: "Admission Inquiry", presentation: "modal" }}
        />
        <Stack.Screen
          name="PublicMarketplace"
          options={{ title: "Local Services" }}
        />
        <Stack.Screen name="OpenCourses" options={{ title: "Skill Academy" }} />
      </Stack>
    </>
  );
}
