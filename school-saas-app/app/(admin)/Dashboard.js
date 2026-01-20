import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { apiAdminGetStats } from "../../api/apiClient"; // Real API Call
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

/**
 * SUPER ADMIN CONSOLE - Live Edition
 * Logic: Synchronizes with the entire Atlas Cluster (Schools, Shops, Students).
 * Theme: Dark Navy Authority (#0f172a).
 */
const SuperAdminDashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();

  // --- Live Data States (No Dummy Data) ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalVendors: 0,
    activeStudents: 0,
    platformRevenue: "₹0",
    pendingVerifications: 0,
  });

  /**
   * 1. CLOUD AGGREGATION LOGIC
   * Pulls platform-wide metrics from the backend
   */
  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true);
      // Actual Route: GET /api/admin/analytics
      const data = await apiAdminGetStats();

      setStats({
        totalSchools: data.stats.schools || 0,
        totalVendors: data.stats.shops || 0,
        activeStudents: data.stats.students || 0,
        platformRevenue: data.revenue || "₹0",
        pendingVerifications:
          data.verificationQueue.pendingSchools +
            data.verificationQueue.pendingShops || 0,
      });
    } catch (err) {
      console.error("Admin Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemStats();
  }, [fetchSystemStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSystemStats();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER SECTION */}
      <SafeAreaView style={styles.safeHeader} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>SYSTEM CONTROLLER</Text>
            <Text style={styles.headerTitle}>Platform Hub</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Feather name="log-out" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        <Animated.View entering={FadeInUp.duration(800)}>
          {/* 2. LIVE KPI GRID */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Institutes"
              value={stats.totalSchools}
              icon="school"
              color="#6366f1"
            />
            <StatCard
              label="Merchants"
              value={stats.totalVendors}
              icon="store"
              color="#10b981"
            />
            <StatCard
              label="Users"
              value={stats.activeStudents}
              icon="users"
              color="#f59e0b"
            />
            <StatCard
              label="Platform Earnings"
              value={stats.platformRevenue}
              icon="wallet"
              color="#ef4444"
            />
          </View>

          {/* 3. VERIFICATION QUEUE ALERT (Real-time Count) */}
          <TouchableOpacity
            style={[
              styles.alertCard,
              { opacity: stats.pendingVerifications > 0 ? 1 : 0.6 },
            ]}
            onPress={() => router.push("/(admin)/EntityManagement")}
          >
            <View style={styles.alertIconBg}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.alertTitle}>
                {stats.pendingVerifications} Pending Authorizations
              </Text>
              <Text style={styles.alertSub}>
                New schools & vendors require manual audit
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>

          {/* 4. SYSTEM MODULES */}
          <Text style={styles.sectionTitle}>System Governance</Text>

          <View style={styles.moduleRow}>
            <ModuleItem
              title="Audit Entities"
              sub="Verify & Monitor"
              icon="verified-user"
              color="#4f46e5"
              onPress={() => router.push("/(admin)/EntityManagement")}
            />
            <ModuleItem
              title="Revenue Audit"
              sub="Platform Tax/Subs"
              icon="bar-chart"
              color="#059669"
              onPress={() => {}}
            />
          </View>

          <View style={styles.moduleRow}>
            <ModuleItem
              title="Security Logs"
              sub="Track IP & Access"
              icon="security"
              color="#64748b"
              onPress={() => {}}
            />
            <ModuleItem
              title="Global Post"
              sub="System-wide News"
              icon="campaign"
              color="#ec4899"
              onPress={() => {}}
            />
          </View>

          {loading && (
            <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// --- Reusable Components ---

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
      <FontAwesome5 name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ModuleItem = ({ title, sub, icon, color, onPress }) => (
  <TouchableOpacity style={styles.moduleCard} onPress={onPress}>
    <View style={[styles.moduleIcon, { backgroundColor: color }]}>
      <MaterialIcons name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.moduleTitle}>{title}</Text>
    <Text style={styles.moduleSub}>{sub}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  safeHeader: {
    backgroundColor: "#1e293b",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ef444430",
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: { padding: 20 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  statVal: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 5,
    textTransform: "uppercase",
  },

  alertCard: {
    backgroundColor: "#4f46e5",
    padding: 22,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    elevation: 12,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.4,
  },
  alertIconBg: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  alertTitle: { color: "#fff", fontSize: 15, fontWeight: "900" },
  alertSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 35,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginLeft: 5,
  },
  moduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  moduleCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#334155",
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  moduleTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  moduleSub: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default SuperAdminDashboard;
