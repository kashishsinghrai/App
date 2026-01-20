import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

/**
 * PREMIUM FEE MANAGEMENT MODULE
 * Logic: Synchronizes financial summaries and transaction history with Atlas Cloud.
 * No dummy data. Features real-time refresh and clean Glass UI.
 */
const FeeManagement = () => {
  const { user } = useAuth();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [finance, setFinance] = useState({
    totalCollected: 0,
    pendingAmount: 0,
    pendingCount: 0,
    history: [], // Actual transaction array
  });

  /**
   * 1. FETCH FINANCIAL DATA
   * Pulls aggregate sums and transaction logs from the backend
   */
  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      // Assuming Backend Route: GET /api/school/finance/stats/:schoolId
      const res = await apiClient.get(`/school/finance/stats/${user.id}`);
      setFinance(res.data);
    } catch (err) {
      console.error("Finance Sync Error:", err.message);
      // Stats remain 0 if no data is found
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  /**
   * 2. SEND REMINDERS LOGIC
   * Triggers a push or SMS notification to all students with 'Pending' status
   */
  const sendReminders = async () => {
    if (finance.pendingCount === 0) return alert("No pending dues found.");

    try {
      await apiClient.post(`/school/finance/remind-bulk`, {
        schoolId: user.id,
      });
      alert(
        "Success! 🔔 Reminders have been sent to " +
          finance.pendingCount +
          " students."
      );
    } catch (err) {
      alert("Reminder service is currently busy.");
    }
  };

  const renderTransaction = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
      <BlurView intensity={70} tint="light" style={styles.transCard}>
        <View style={styles.transIconBg}>
          <Feather name="arrow-down-left" size={18} color="#10b981" />
        </View>
        <View style={styles.transDetails}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.transMeta}>
            {new Date(item.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}{" "}
            • {item.paymentMethod || "Online"}
          </Text>
        </View>
        <Text style={styles.amountText}>+₹{item.amount}</Text>
      </BlurView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- AMBIENT MESH BACKGROUND --- */}
      <LinearGradient
        colors={["#f8fafc", "#f1f5f9", "#eef2ff"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Finance Hub</Text>
            <Text style={styles.headerSub}>Account settlements & dues</Text>
          </View>
          <TouchableOpacity style={styles.configBtn}>
            <Ionicons name="options-outline" size={22} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 100 }}
          />
        ) : (
          <FlatList
            data={finance.history}
            keyExtractor={(item) => item._id}
            renderItem={renderTransaction}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                {/* 3. SUMMARY GLASS CARD */}
                <BlurView
                  intensity={100}
                  tint="light"
                  style={styles.summaryCard}
                >
                  <LinearGradient
                    colors={["rgba(79, 70, 229, 0.05)", "transparent"]}
                    style={styles.cardInternal}
                  >
                    <View style={styles.summaryTop}>
                      <View>
                        <Text style={styles.summaryLabel}>
                          Total Collection
                        </Text>
                        <Text style={styles.totalValue}>
                          ₹{finance.totalCollected.toLocaleString("en-IN")}
                        </Text>
                      </View>
                      <View style={styles.chartCircle}>
                        <FontAwesome5
                          name="chart-pie"
                          size={20}
                          color="#4f46e5"
                        />
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.pendingRow}>
                      <Ionicons name="warning" size={16} color="#f59e0b" />
                      <Text style={styles.pendingText}>
                        Outstanding: ₹
                        {finance.pendingAmount.toLocaleString("en-IN")} (
                        {finance.pendingCount} Students)
                      </Text>
                    </View>
                  </LinearGradient>
                </BlurView>

                {/* 4. ACTION BUTTONS */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={sendReminders}
                  >
                    <BlurView intensity={80} style={styles.actionBlur}>
                      <Feather name="bell" size={20} color="#4f46e5" />
                      <Text style={styles.actionBtnText}>Remind Dues</Text>
                    </BlurView>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <BlurView intensity={80} style={styles.actionBlur}>
                      <Feather name="file-text" size={20} color="#10b981" />
                      <Text style={styles.actionBtnText}>Fee Receipts</Text>
                    </BlurView>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionHeader}>Recent Transactions</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Feather name="database" size={50} color="#cbd5e1" />
                <Text style={styles.emptyTxt}>
                  No recent transactions found.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -1,
  },
  headerSub: { fontSize: 13, color: "#94a3b8", fontWeight: "700" },
  configBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  listContent: { paddingHorizontal: 22, paddingBottom: 150 },

  // Summary Card
  summaryCard: {
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    marginBottom: 25,
    elevation: 5,
    shadowOpacity: 0.05,
  },
  cardInternal: { padding: 25 },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1e293b",
    marginTop: 8,
    letterSpacing: -1,
  },
  chartCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
    marginVertical: 20,
  },
  pendingRow: { flexDirection: "row", alignItems: "center" },
  pendingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
  },

  // Action Grid
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  actionBlur: { padding: 18, alignItems: "center", justifyContent: "center" },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginTop: 8,
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },

  // Transaction Cards
  transCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 28,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },
  transIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  transDetails: { flex: 1, marginLeft: 15 },
  studentName: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  transMeta: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 3,
  },
  amountText: { fontSize: 16, fontWeight: "900", color: "#059669" },

  emptyWrap: { alignItems: "center", marginTop: 60 },
  emptyTxt: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 15,
  },
});

export default FeeManagement;
