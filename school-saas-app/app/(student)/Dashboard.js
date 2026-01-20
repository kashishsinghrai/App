import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

/**
 * LIVE STUDENT DASHBOARD
 * Logic: Synchronizes with Atlas Cloud for personal stats, ID production, and LMS.
 * Theme: Premium Indigo Glassmorphism (No white boxes).
 */
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  // --- Live Data States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null); // Real-time stats & status
  const [lmsMaterials, setLmsMaterials] = useState([]); // Real-time study assets

  /**
   * 1. CLOUD SYNC LOGIC
   * Fetches profile (stats) and learning assets in parallel
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, lmsRes] = await Promise.all([
        apiClient.get(`/student/profile/${user.id}`),
        apiClient.get(`/student/learning/${user.id}`),
      ]);

      setProfile(profileRes.data);
      setLmsMaterials(lmsRes.data);
    } catch (err) {
      console.error("Dashboard Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loaderText}>Connecting to Academic Cloud...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* GLOBAL MESH BACKGROUND (Unified glass look) */}
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#e0e7ff"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e40af"
          />
        }
      >
        {/* 2. PREMIUM DYNAMIC HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => router.push("/(student)/Profile")}
            >
              <Image
                source={{
                  uri: profile?.photo
                    ? `http://10.0.2.2:5000${profile.photo}`
                    : `https://ui-avatars.com/api/?name=${user.name}&background=fff&color=1e40af`,
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Academic Session 2026</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
            <TouchableOpacity style={styles.notifIcon}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {lmsMaterials.length > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>

          {/* REAL STATS ROW */}
          <View style={styles.statRow}>
            <HeaderStat
              label="Attendance"
              value={profile?.attendance || "0%"}
            />
            <View style={styles.vDivider} />
            <HeaderStat label="Overall Grade" value={profile?.grade || "-"} />
            <View style={styles.vDivider} />
            <HeaderStat label="Fees" value={profile?.feeStatus || "Syncing"} />
          </View>
        </View>

        <View style={styles.content}>
          {/* 3. ACADEMIC SUITE GRID */}
          <Text style={styles.sectionTitle}>Academic Suite</Text>
          <View style={styles.academicGrid}>
            <AcademicAction
              icon="document-text-outline"
              label="Exam Result"
              color="#8b5cf6"
              onPress={() => router.push("/(student)/ResultScreen")}
            />
            <AcademicAction
              icon="card-outline"
              label="Admit Card"
              color="#f43f5e"
              onPress={() => router.push("/(student)/AdmitCard")}
            />
            <AcademicAction
              icon="calendar-outline"
              label="Time Table"
              color="#0ea5e9"
              onPress={() => {}}
            />
            <AcademicAction
              icon="receipt-outline"
              label="Fee History"
              color="#10b981"
              onPress={() => {}}
            />
          </View>

          {/* 4. DIGITAL IDENTITY STATUS (Real-time tracking) */}
          <Text style={styles.sectionTitle}>Digital Identity</Text>
          <TouchableOpacity
            style={[
              styles.statusCard,
              { borderColor: profile?.isLocked ? "#10b981" : "#f59e0b" },
            ]}
            onPress={() => router.push("/(student)/Profile")}
          >
            <BlurView intensity={80} tint="light" style={styles.statusBlur}>
              <View
                style={[
                  styles.statusIconBg,
                  {
                    backgroundColor: profile?.isLocked ? "#d1fae5" : "#fef3c7",
                  },
                ]}
              >
                <FontAwesome5
                  name="id-card"
                  size={18}
                  color={profile?.isLocked ? "#059669" : "#d97706"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.statusMainTitle}>
                  {profile?.isLocked ? "Identity Verified" : "Data Pending"}
                </Text>
                <Text style={styles.statusSubTitle}>
                  {profile?.isLocked
                    ? "Digital ID finalized."
                    : "Update your profile for printing."}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
            </BlurView>
          </TouchableOpacity>

          {/* 5. LIVE LMS SECTION (Study Material from Cloud) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Latest Study Material</Text>
            <TouchableOpacity onPress={() => router.push("/(student)/LMSHub")}>
              <Text style={styles.viewAll}>Library →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.lmsScroll}
          >
            {lmsMaterials.length > 0 ? (
              lmsMaterials.map((item) => (
                <LMSCard
                  key={item._id}
                  title={item.title}
                  sub={item.subject}
                  type={item.type}
                />
              ))
            ) : (
              <View style={styles.emptyLMS}>
                <Text style={styles.emptyLMSTxt}>No resources assigned.</Text>
              </View>
            )}
          </ScrollView>

          {/* 6. ECOSYSTEM MARKETPLACE */}
          <Text style={styles.sectionTitle}>Campus Marketplace</Text>
          <View style={styles.marketplaceGrid}>
            <ServiceChip icon="print" label="Cyber Cafe" color="#10b981" />
            <ServiceChip icon="book" label="Book Depot" color="#6366f1" />
            <ServiceChip icon="shirt" label="Uniforms" color="#f59e0b" />
            <ServiceChip icon="bus" label="Transport" color="#ef4444" />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Feather name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sign Out Securely</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

// --- Reusable Logic-Rich Components ---

const AcademicAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.academicItem} onPress={onPress}>
    <View style={[styles.academicIcon, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.academicLabel}>{label}</Text>
  </TouchableOpacity>
);

const HeaderStat = ({ label, value }) => (
  <View style={{ alignItems: "center" }}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const LMSCard = ({ title, sub, type }) => (
  <TouchableOpacity style={styles.lmsCard}>
    <View
      style={[
        styles.lmsIconBg,
        { backgroundColor: type === "Videos" ? "#fee2e2" : "#e0e7ff" },
      ]}
    >
      <Ionicons
        name={type === "Videos" ? "play-circle" : "document-text"}
        size={24}
        color={type === "Videos" ? "#ef4444" : "#1e40af"}
      />
    </View>
    <Text style={styles.lmsTitle} numberOfLines={1}>
      {title}
    </Text>
    <Text style={styles.lmsSub}>{sub}</Text>
  </TouchableOpacity>
);

const ServiceChip = ({ icon, label, color }) => (
  <TouchableOpacity style={styles.serviceChip}>
    <BlurView intensity={40} style={styles.serviceBlur}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.serviceLabel}>{label}</Text>
    </BlurView>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loaderText: {
    marginTop: 15,
    fontSize: 13,
    fontWeight: "700",
    color: "#1e40af",
  },

  header: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowOpacity: 0.3,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  avatarWrapper: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatar: { width: 55, height: 55 },
  headerText: { flex: 1, marginLeft: 15 },
  welcomeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  notifIcon: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#1e40af",
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 18,
    borderRadius: 25,
  },
  statVal: { color: "#fff", fontSize: 16, fontWeight: "900" },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 4,
  },
  vDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  content: { paddingHorizontal: 22, paddingTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 15,
    marginTop: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: { color: "#1e40af", fontSize: 12, fontWeight: "800" },

  academicGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  academicItem: { width: (width - 60) / 4, alignItems: "center" },
  academicIcon: {
    width: 55,
    height: 55,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  academicLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    textAlign: "center",
  },

  statusCard: {
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: 25,
    borderWidth: 1.5,
  },
  statusBlur: { flexDirection: "row", padding: 20, alignItems: "center" },
  statusIconBg: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statusMainTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  statusSubTitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
    fontWeight: "600",
  },

  lmsScroll: { marginBottom: 25 },
  lmsCard: {
    backgroundColor: "#fff",
    width: 140,
    padding: 18,
    borderRadius: 28,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowOpacity: 0.03,
  },
  lmsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  lmsTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  lmsSub: { fontSize: 10, color: "#94a3b8", fontWeight: "700", marginTop: 3 },
  emptyLMS: { padding: 30, alignItems: "center" },
  emptyLMSTxt: { color: "#cbd5e1", fontWeight: "800" },

  marketplaceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },
  serviceChip: {
    borderRadius: 20,
    overflow: "hidden",
    width: (width - 55) / 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  serviceBlur: { flexDirection: "row", alignItems: "center", padding: 15 },
  serviceLabel: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },

  logoutBtn: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 25,
    elevation: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "900",
    marginLeft: 12,
    fontSize: 15,
  },
  versionText: {
    textAlign: "center",
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 30,
    fontWeight: "800",
    letterSpacing: 1,
  },
});

export default StudentDashboard;
