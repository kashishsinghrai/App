import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "../context/AuthContext";

/**
 * GLOBAL SUPPORT & GUIDANCE MODAL
 * Provides dynamic instructions based on the user's role (Admin, School, Shop, Student, or General User).
 */
export default function ModalScreen() {
  const router = useRouter();
  const { user } = useAuth();

  /**
   * Helper: Resolves theme colors and icons based on the current user session
   */
  const getRoleTheme = () => {
    switch (user?.role) {
      case "admin":
        return {
          color: "#0f172a",
          icon: "user-shield",
          label: "System Master",
        };
      case "school":
        return { color: "#4f46e5", icon: "university", label: "Institution" };
      case "shop":
        return { color: "#059669", icon: "store", label: "Business" };
      case "student":
        return { color: "#1e40af", icon: "user-graduate", label: "Academic" };
      case "user":
        return { color: "#ec4899", icon: "compass", label: "Discovery" };
      default:
        return { color: "#64748b", icon: "info-circle", label: "Portal" };
    }
  };

  const theme = getRoleTheme();

  return (
    <ThemedView style={styles.container}>
      {/* 1. VISUAL CUE: iOS Style Drag Handle */}
      <View style={styles.dragHandle} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. DYNAMIC BRANDING ICON */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme.color}15` },
          ]}
        >
          <FontAwesome5 name={theme.icon} size={50} color={theme.color} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Support Center
        </ThemedText>

        {/* 3. DYNAMIC ROLE STATUS PILL */}
        <View style={[styles.roleBadge, { backgroundColor: theme.color }]}>
          <ThemedText style={styles.roleText}>
            {theme.label.toUpperCase()} ACCESS
          </ThemedText>
        </View>

        {/* 4. GUIDANCE BOX: Role-Specific Instructions */}
        <View style={styles.infoBox}>
          <ThemedText style={styles.instructionTitle}>
            How to use your portal:
          </ThemedText>

          <ThemedText style={styles.description}>
            {user?.role === "admin" &&
              "As a Super Admin, you have full oversight. Verify new school registrations, approve marketplace vendors, and monitor platform-wide security logs."}

            {user?.role === "school" &&
              "Manage your student directory, verify ID card applications before sending them to vendors, and publish results or notices to the student portal."}

            {user?.role === "shop" &&
              "Process incoming print orders from schools, manage your digital ledger for walk-in customers, and showcase your work in the public marketplace."}

            {user?.role === "student" &&
              "Fill your identity details for ID card production, download your results and admit cards, and access digital study materials from the LMS library."}

            {user?.role === "user" &&
              "Explore local schools and colleges, discover printing and stationery shops in the marketplace, and send admission inquiries directly to institutes."}
          </ThemedText>
        </View>

        {/* 5. INTERACTIVE SUPPORT LINK */}
        <TouchableOpacity style={styles.supportLink}>
          <View style={[styles.miniCircle, { backgroundColor: theme.color }]}>
            <MaterialIcons name="headset-mic" size={16} color="#fff" />
          </View>
          <ThemedText style={[styles.supportLinkText, { color: theme.color }]}>
            Connect with Technical Support
          </ThemedText>
        </TouchableOpacity>

        {/* 6. DISMISS BUTTON */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.color }]}
        >
          <ThemedText style={styles.closeBtnText}>Got it, Thanks!</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.footer}>
          EduConnect Ecosystem v1.2.4 • Secure Cloud
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    alignItems: "center",
    padding: 30,
    paddingTop: 60,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    position: "absolute",
    top: 15,
    alignSelf: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
    color: "#1e293b",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 25,
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 24,
    borderRadius: 30,
    width: "100%",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    textAlign: "left",
    color: "#475569",
    lineHeight: 24,
    fontWeight: "600",
  },
  supportLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 35,
    backgroundColor: "#f1f5f9",
    padding: 12,
    paddingRight: 20,
    borderRadius: 15,
  },
  miniCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  supportLinkText: {
    fontWeight: "800",
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 18,
    borderRadius: 22,
    width: "100%",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: "#cbd5e1",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
