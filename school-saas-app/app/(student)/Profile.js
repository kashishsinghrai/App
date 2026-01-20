import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiGetStudentProfile } from "../../api/apiClient"; // Real API Call
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

/**
 * LIVE STUDENT PROFILE PORTAL
 * Logic: Synchronizes student details, academic status, and ID verification from Atlas Cloud.
 * No dummy data used.
 */
const StudentProfile = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // Data from Atlas Cloud

  /**
   * 1. CLOUD SYNC LOGIC
   * Fetches real-time profile data on mount
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiGetStudentProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error("Profile Sync Error:", err.message);
        Alert.alert(
          "Cloud Error",
          "Failed to sync profile. Check your connection."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  /**
   * Helper: Resolves Status visual theme
   */
  const getStatusInfo = (status) => {
    const isVerified =
      status?.toLowerCase() === "verified" || profile?.isLocked;
    if (isVerified) {
      return {
        bg: "#dcfce7",
        text: "#15803d",
        icon: "verified",
        label: "VERIFIED",
      };
    }
    return {
      bg: "#fef3c7",
      text: "#b45309",
      icon: "history",
      label: "PENDING",
    };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>
          Synchronizing with Atlas Cloud...
        </Text>
      </View>
    );
  }

  // Handle empty state gracefully
  if (!profile) return null;

  const status = getStatusInfo(profile.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* 2. PROFILE HEADER - Dynamic Identity Card Style */}
        <View style={styles.headerCard}>
          <View style={styles.headerBg} />
          <View style={styles.profileInfo}>
            <View style={styles.photoContainer}>
              <Image
                source={{
                  uri: profile.photo
                    ? `http://10.0.2.2:5000${profile.photo}` // Streaming GridFS Image
                    : `https://ui-avatars.com/api/?name=${profile.name}&background=1e40af&color=fff`,
                }}
                style={styles.photo}
              />
              <TouchableOpacity
                style={styles.editPhotoBtn}
                onPress={() =>
                  !profile.isLocked && router.push("/(student)/ApplyService")
                }
              >
                <Ionicons
                  name={profile.isLocked ? "lock-closed" : "camera"}
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.schoolName}>
              {profile.schoolId?.name || "Global Academy"}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <MaterialIcons name={status.icon} size={14} color={status.text} />
              <Text style={[styles.statusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* 3. QUICK INFO STRIP - Real Metadata */}
          <View style={styles.quickInfoRow}>
            <InfoItem label="CLASS" value={profile.class || "N/A"} />
            <View style={styles.vDivider} />
            <InfoItem label="ROLL NO" value={profile.rollNo} />
            <View style={styles.vDivider} />
            <InfoItem label="BLOOD" value={profile.bloodGroup || "-"} />
          </View>
        </View>

        {/* 4. MANAGEMENT SECTIONS */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeader}>Digital Identity Hub</Text>
          <MenuButton
            icon="badge"
            title="Apply / Update ID"
            sub={
              profile.isLocked
                ? "Locked for Production"
                : "Update photo & details"
            }
            color="#1e40af"
            onPress={() => router.push("/(student)/ApplyService")}
            disabled={profile.isLocked}
          />
          <MenuButton
            icon="qr-code-2"
            title="Virtual ID Preview"
            sub="Show this at School Gate"
            color="#059669"
            onPress={() => {}}
          />

          <Text style={[styles.sectionHeader, { marginTop: 25 }]}>
            Academic Records
          </Text>
          <MenuButton
            icon="description"
            title="Term Result"
            sub="View subject-wise scores"
            color="#8b5cf6"
            onPress={() => router.push("/(student)/ResultScreen")}
          />
          <MenuButton
            icon="card-membership"
            title="Exam Admit Card"
            sub="Download Hall Ticket"
            color="#f43f5e"
            onPress={() => router.push("/(student)/AdmitCard")}
          />

          <Text style={[styles.sectionHeader, { marginTop: 25 }]}>
            Help & Security
          </Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <View style={styles.logoutIcon}>
              <MaterialIcons name="logout" size={20} color="#ef4444" />
            </View>
            <Text style={styles.logoutTxt}>Sign Out Securely</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          EduConnect Cloud Portal v1.2.0 • 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Reusable Sub-components ---

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoVal}>{value}</Text>
  </View>
);

const MenuButton = ({ icon, title, sub, color, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.menuItem, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.menuInfo}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSub}>{sub}</Text>
    </View>
    <Feather name="chevron-right" size={20} color="#cbd5e1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 13,
  },
  scroll: { paddingBottom: 40 },

  headerCard: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 5,
    shadowOpacity: 0.1,
    paddingBottom: 25,
  },
  headerBg: {
    height: 110,
    backgroundColor: "#1e40af",
    position: "absolute",
    width: "100%",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileInfo: { alignItems: "center", marginTop: 45 },
  photoContainer: {
    width: 115,
    height: 115,
    borderRadius: 38,
    backgroundColor: "#f1f5f9",
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    elevation: 12,
  },
  photo: { width: "100%", height: "100%" },
  editPhotoBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#1e40af",
    padding: 8,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e293b",
    marginTop: 15,
    letterSpacing: -0.5,
  },
  schoolName: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 1,
  },

  quickInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    paddingHorizontal: 20,
  },
  infoItem: { alignItems: "center" },
  infoLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1.2,
  },
  infoVal: { fontSize: 15, fontWeight: "900", color: "#1e293b", marginTop: 4 },
  vDivider: { width: 1.5, height: "70%", backgroundColor: "#f1f5f9" },

  menuContainer: { padding: 20 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 28,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowOpacity: 0.03,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  menuSub: { fontSize: 11, color: "#94a3b8", marginTop: 3, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: 10,
    borderRadius: 25,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  logoutIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutTxt: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: "800",
    color: "#ef4444",
  },

  versionText: {
    textAlign: "center",
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 30,
    fontWeight: "700",
  },
});

export default StudentProfile;
