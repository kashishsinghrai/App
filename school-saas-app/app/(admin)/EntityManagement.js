import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

/**
 * LIVE ENTITY MANAGEMENT - Super Admin Edition
 * Logic: Synchronizes with Schools and Shops collections in Atlas Cloud.
 * Features: Approve pending requests, Block/Unblock entities, and Live Sync.
 */
const EntityManagement = () => {
  const { user } = useAuth();

  // --- States ---
  const [entities, setEntities] = useState([]); // Real data starts empty
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Track ID for specific button loading

  /**
   * 1. CLOUD SYNC: Fetch all verification requests and active entities
   * This logic combines pending schools and vendors from the cloud.
   */
  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      // Backend Route: GET /api/admin/verify-requests
      const res = await apiClient.get("/admin/verify-requests");

      // Merge pending schools and shops into one unified management list
      const combined = [
        ...res.data.pendingSchools.map((s) => ({ ...s, type: "School" })),
        ...res.data.pendingShops.map((s) => ({ ...s, type: "Vendor" })),
      ];
      setEntities(combined);
    } catch (err) {
      console.error("Admin Sync Error:", err.message);
      // Result remains empty if no pending requests found
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntities();
  };

  /**
   * 2. VERIFICATION LOGIC: Approve a School or Shop
   */
  const handleApprove = (id, type, name) => {
    Alert.alert(
      "Authorize Entity",
      `Are you sure you want to verify and publish ${name} to the platform?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve Now",
          onPress: async () => {
            setActionLoading(id);
            try {
              // API: PATCH /api/admin/verify/:id (body: { type })
              await apiClient.patch(`/admin/verify/${id}`, {
                type: type.toLowerCase(),
              });
              Alert.alert(
                "Verified! ✅",
                `${name} is now active in the marketplace.`
              );
              fetchEntities(); // Refresh list
            } catch (err) {
              Alert.alert("Error", "Verification failed. Check system logs.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  /**
   * 3. KILL SWITCH LOGIC: Block/Unblock Access
   */
  const toggleBlockStatus = async (id, type, currentIsActive) => {
    try {
      // API: PATCH /api/admin/toggle-status/:id (body: { type, isActive })
      await apiClient.patch(`/admin/toggle-status/${id}`, {
        type: type.toLowerCase(),
        isActive: !currentIsActive,
      });

      // Update UI locally for smooth experience
      setEntities((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isActive: !currentIsActive } : item
        )
      );
    } catch (err) {
      Alert.alert(
        "Sync Error",
        "Could not synchronize access status with cloud."
      );
    }
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(800)}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBg}>
            <MaterialCommunityIcons
              name={item.type === "School" ? "school-outline" : "store-outline"}
              size={26}
              color="#6366f1"
            />
          </View>

          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.typeTag}>{item.type}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isVerified ? "#10b98120" : "#f59e0b20" },
            ]}
          >
            <Text
              style={[
                styles.statusTxt,
                { color: item.isVerified ? "#10b981" : "#f59e0b" },
              ]}
            >
              {item.isVerified ? "VERIFIED" : "PENDING"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <View style={styles.blockControl}>
            <Text
              style={[
                styles.blockLabel,
                { color: item.isActive === false ? "#ef4444" : "#94a3b8" },
              ]}
            >
              {item.isActive === false ? "Suspended" : "Active Access"}
            </Text>
            <Switch
              value={item.isActive !== false}
              onValueChange={() =>
                toggleBlockStatus(item._id, item.type, item.isActive !== false)
              }
              trackColor={{ false: "#475569", true: "#6366f1" }}
              thumbColor={item.isActive === false ? "#94a3b8" : "#fff"}
            />
          </View>

          {!item.isVerified && (
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => handleApprove(item._id, item.type, item.name)}
              disabled={actionLoading === item._id}
            >
              {actionLoading === item._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={16} color="#fff" />
                  <Text style={styles.btnTxt}>Verify</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* 4. HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Entity Requests</Text>
          <Text style={styles.subHeader}>
            {entities.length} Pending Verifications
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshCircle} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MAIN LIST */}
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#6366f1"
          style={{ marginTop: 100 }}
        />
      ) : (
        <FlatList
          data={entities}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Feather name="check-circle" size={50} color="#334155" />
              </View>
              <Text style={styles.emptyTitle}>Queue Cleared</Text>
              <Text style={styles.emptySub}>
                No new schools or vendors are waiting for verification.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  subHeader: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },
  refreshCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 32,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBg: {
    width: 52,
    height: 52,
    backgroundColor: "#334155",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  typeTag: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTxt: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 18 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockControl: { flexDirection: "row", alignItems: "center" },
  blockLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginRight: 12,
    textTransform: "uppercase",
  },
  verifyBtn: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
  },
  btnTxt: { color: "#fff", fontSize: 13, fontWeight: "900", marginLeft: 8 },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  emptySub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    fontWeight: "600",
  },
});

export default EntityManagement;
