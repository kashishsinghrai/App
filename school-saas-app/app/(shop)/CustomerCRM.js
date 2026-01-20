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
  Linking,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const CustomerCRM = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/linked-schools/${user.id}`);
      setCustomers(res.data || []);
    } catch (err) {
      console.error("CRM Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else alert("Contact number not provided by school.");
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, customers]);

  const renderCustomer = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
      <View style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Revenue: </Text>
              <Text style={styles.revenueValue}>
                ₹{item.totalRevenue || "0"}
              </Text>
            </View>
          </View>
          <View style={styles.ordersBadge}>
            <Text style={styles.ordersCount}>{item.totalOrders || 0}</Text>
            <Text style={styles.ordersLabel}>orders</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.lastOrderInfo}>
            <Feather name="clock" size={12} color="#999" />
            <Text style={styles.lastOrderText}>
              Last: {item.lastOrderDate || "No data"}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(item.phone)}
            >
              <Feather name="phone" size={16} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="message-circle" size={16} color="#000" />
            </TouchableOpacity>
          </View>
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
            <Text style={styles.headerTitle}>Clients</Text>
            <Text style={styles.headerSubtitle}>
              {customers.length} {customers.length === 1 ? "school" : "schools"}{" "}
              linked
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Feather name="refresh-cw" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Customer List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item._id}
            renderItem={renderCustomer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="users" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No clients yet</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? "No schools match your search"
                    : "Linked schools will appear here"}
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

  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  revenueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  revenueValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  ordersBadge: {
    alignItems: "center",
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
  },
  ordersCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  ordersLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastOrderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastOrderText: {
    fontSize: 11,
    color: "#999",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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

export default CustomerCRM;
