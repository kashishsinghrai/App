import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
  Switch,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

const ShopDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);

  const [stats, setStats] = useState({
    totalEarnings: "₹0",
    printedCards: 0,
    activeInquiries: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [statsRes, schoolsRes] = await Promise.all([
        apiClient.get(`/shop/profile/${user.id}`),
        apiClient.get(`/shop/linked-schools/${user.id}`),
      ]);

      if (statsRes?.data) {
        setStats({
          totalEarnings: statsRes.data.totalEarnings || "₹0",
          printedCards: statsRes.data.totalJobsCompleted || 0,
          activeInquiries: statsRes.data.newInquiries || 0,
        });
        setIsOnline(statsRes.data.isOnline ?? true);
      }

      if (schoolsRes?.data) {
        setSchools(schoolsRes.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user?.id]);

  const toggleVisibility = async (value) => {
    if (!user?.id) return;

    const previousValue = isOnline;
    try {
      setIsOnline(value);
      await apiClient.put(`/shop/profile/${user.id}`, { isOnline: value });
      updateUser({ isOnline: value });
    } catch (err) {
      console.error("Toggle error:", err);
      Alert.alert("Error", "Could not update status");
      setIsOnline(previousValue);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", onPress: logout, style: "destructive" },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Gradient Header */}
        <View style={styles.gradientHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/(shop)/ProfileSettings")}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    user?.shopImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "User",
                    )}&background=fff&color=6366f1`,
                }}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || "Merchant"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Status Toggle */}
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View style={styles.statusIconContainer}>
                <Feather name="radio" size={16} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.statusLabel}>You are</Text>
                <Text style={styles.statusText}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleVisibility}
              trackColor={{ false: "#e2e8f0", true: "#a5b4fc" }}
              thumbColor={isOnline ? "#6366f1" : "#cbd5e1"}
              ios_backgroundColor="#e2e8f0"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="trending-up" size={18} color="#10b981" />
              </View>
              <Text style={styles.statLabel}>Total Earnings</Text>
              <Text style={styles.statValue}>{stats.totalEarnings}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="printer" size={18} color="#8b5cf6" />
              </View>
              <Text style={styles.statLabel}>Cards Printed</Text>
              <Text style={styles.statValue}>{stats.printedCards}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.paymentsLink}
            onPress={() => router.push("/(shop)/PaymentTracker")}
            activeOpacity={0.8}
          >
            <Feather name="credit-card" size={16} color="#6366f1" />
            <Text style={styles.paymentsLinkText}>View all payments</Text>
            <Feather name="chevron-right" size={16} color="#6366f1" />
          </TouchableOpacity>

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionCard
                icon="book-open"
                label="Ledger"
                color="#3b82f6"
                onPress={() => router.push("/(shop)/LocalBusinessLedger")}
              />
              <ActionCard
                icon="tag"
                label="Pricing"
                color="#f59e0b"
                onPress={() => router.push("/(shop)/RateList")}
              />
              <ActionCard
                icon="image"
                label="Portfolio"
                color="#ec4899"
                onPress={() => router.push("/(shop)/WorkPortfolio")}
              />
              <ActionCard
                icon="users"
                label="Clients"
                color="#10b981"
                onPress={() => router.push("/(shop)/CustomerCRM")}
              />
            </View>
          </View>

          {/* Template Designer Feature */}
          <TouchableOpacity
            style={styles.designerCard}
            onPress={() => router.push("/(shop)/TemplateDesigner")}
            activeOpacity={0.9}
          >
            <View style={styles.designerContent}>
              <View style={styles.designerIconContainer}>
                <Feather name="layout" size={24} color="#fff" />
              </View>
              <View style={styles.designerText}>
                <Text style={styles.designerTitle}>Template Designer</Text>
                <Text style={styles.designerDesc}>
                  Create stunning ID card layouts
                </Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Active Orders */}
          <View style={styles.section}>
            <View style={styles.ordersHeader}>
              <Text style={styles.sectionTitle}>Active Orders</Text>
              {schools.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{schools.length}</Text>
                </View>
              )}
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : schools.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Feather name="inbox" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No active orders</Text>
                <Text style={styles.emptyDesc}>
                  Orders from schools will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.ordersList}>
                {schools.map((school) => (
                  <OrderCard
                    key={school._id}
                    school={school}
                    onPress={() =>
                      router.push({
                        pathname: "/(shop)/PrintPreview",
                        params: {
                          schoolId: school._id,
                          schoolName: school.name,
                        },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Action Card Component
const ActionCard = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.actionIconBox, { backgroundColor: color }]}>
      <Feather name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Order Card Component
const OrderCard = ({ school, onPress }) => (
  <TouchableOpacity
    style={styles.orderCard}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View style={styles.orderLeft}>
      <View style={styles.orderIconBox}>
        <Feather name="briefcase" size={18} color="#6366f1" />
      </View>
      <View style={styles.orderInfo}>
        <Text style={styles.orderName} numberOfLines={1}>
          {school.name}
        </Text>
        <Text style={styles.orderMeta}>
          {school.type || "School"} • {school.lastSync || "Recent"}
        </Text>
      </View>
    </View>
    {school.pendingCount > 0 && (
      <View style={styles.orderBadge}>
        <Text style={styles.orderBadgeText}>{school.pendingCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Gradient Header
  gradientHeader: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "#fff",
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Status Card
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 2,
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },

  // Payments Link
  paymentsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentsLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  actionCard: {
    width: (width - 52) / 2,
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },

  // Designer Card
  designerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6366f1",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  designerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  designerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  designerText: {
    flex: 1,
  },
  designerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  designerDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },

  // Orders Header
  ordersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  badge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
  },

  // Orders List
  ordersList: {
    gap: 12,
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  orderMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  orderBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },

  // Loading
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
});

export default ShopDashboard;
