import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const PaymentTracker = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [finance, setFinance] = useState({
    totalEarnings: 0,
    outstandingBalance: 0,
    history: [],
  });

  const fetchPaymentRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/payments/${user.id}`);
      setFinance({
        totalEarnings: res.data.totalEarnings || 0,
        outstandingBalance: res.data.outstandingBalance || 0,
        history: res.data.history || [],
      });
    } catch (err) {
      console.error("Payment Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentRecords();
  };

  const handleRemindSchools = async () => {
    if (finance.outstandingBalance === 0) {
      return Alert.alert("Settled", "All your school dues are cleared!");
    }

    try {
      await apiClient.post("/shop/remind-dues", { shopId: user.id });
      Alert.alert(
        "Sent",
        "Payment reminder has been sent to your client schools.",
      );
    } catch (err) {
      Alert.alert("Error", "Could not send reminders at this time.");
    }
  };

  const renderTransaction = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(600)}>
      <View style={styles.transactionCard}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>
            {new Date(item.createdAt).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(item.createdAt)
              .toLocaleString("default", { month: "short" })
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.schoolName} numberOfLines={1}>
            {item.schoolName || "Walk-in Order"}
          </Text>
          <Text style={styles.invoiceNumber}>
            INV #{item.invoiceNo || "N/A"}
          </Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amount}>+₹{item.amount}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isSettled ? "#000" : "#f57c00" },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSubtitle}>
              {finance.history.length}{" "}
              {finance.history.length === 1 ? "transaction" : "transactions"}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Feather name="refresh-cw" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={finance.history}
            keyExtractor={(item) => item._id}
            renderItem={renderTransaction}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryLabel}>Outstanding Dues</Text>
                    <Feather name="alert-circle" size={20} color="#000" />
                  </View>
                  <Text style={styles.summaryAmount}>
                    ₹{finance.outstandingBalance.toLocaleString("en-IN")}
                  </Text>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryFooter}>
                    <View>
                      <Text style={styles.footerLabel}>Total Earned</Text>
                      <Text style={styles.footerValue}>
                        ₹{finance.totalEarnings.toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.remindButton}
                      onPress={handleRemindSchools}
                    >
                      <Text style={styles.remindButtonText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Transaction History</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="credit-card" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Payments from schools will appear here automatically
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  remindButton: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  remindButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Transaction Card
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  dateDay: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: "600",
    color: "#999",
    marginTop: 2,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666",
  },
  amountSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PaymentTracker;
