import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const FindShop = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [filterRating, setFilterRating] = useState(false);

  const categories = [
    { name: "All", icon: "grid" },
    { name: "ID Cards", icon: "credit-card" },
    { name: "Stationery", icon: "edit-3" },
    { name: "Uniforms", icon: "shopping-bag" },
    { name: "Books", icon: "book-open" },
  ];

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/shop/all-available");
      setShops(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Marketplace error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const onRefresh = () => {
    setRefreshing(true);
    loadShops();
  };

  const handleLinkShop = async (shopId, shopName) => {
    if (user?.assignedShop === shopId) {
      return Alert.alert("Already Linked", "This shop is already your partner");
    }

    Alert.alert("Link Partner", `Link ${shopName} as your service provider?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setLinkingId(shopId);
          try {
            const res = await apiClient.post("/school/allot-shop", {
              schoolId: user.id,
              shopId: shopId,
            });

            if (res?.data?.school?.assignedShop) {
              updateUser({ assignedShop: res.data.school.assignedShop });
            }

            Alert.alert("Success", "Partner linked successfully", [
              {
                text: "OK",
                onPress: () => router.replace("/(school)/Dashboard"),
              },
            ]);
          } catch (err) {
            console.error("Link error:", err);
            Alert.alert("Error", "Failed to link partner");
          } finally {
            setLinkingId(null);
          }
        },
      },
    ]);
  };

  const filteredShops = useMemo(() => {
    if (!Array.isArray(shops)) return [];

    return shops.filter((shop) => {
      const matchesSearch =
        shop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" || shop.category === activeCategory;

      const matchesRating = filterRating ? (shop.rating || 0) >= 4.5 : true;

      return matchesSearch && matchesCategory && matchesRating;
    });
  }, [shops, searchQuery, activeCategory, filterRating]);

  const renderShop = ({ item }) => {
    const isLinked = user?.assignedShop === item._id;
    const isLinking = linkingId === item._id;

    return (
      <View style={styles.shopCard}>
        <Image
          source={{
            uri:
              item.shopImage ||
              "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400",
          }}
          style={styles.shopImage}
        />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.name || "Shop"}
              </Text>
              <Text style={styles.shopCategory}>
                {item.category || "General"} • Verified
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={12} color="#fff" />
              <Text style={styles.ratingText}>{item.rating || "4.0"}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#6366f1" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address || "Location not provided"}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.contactButton} activeOpacity={0.7}>
              <Feather name="phone" size={16} color="#6366f1" />
              <Text style={styles.contactText}>Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.linkButton,
                (isLinked || isLinking) && styles.linkedButton,
              ]}
              onPress={() => handleLinkShop(item._id, item.name)}
              disabled={isLinked || isLinking}
              activeOpacity={0.8}
            >
              {isLinking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather
                    name={isLinked ? "check-circle" : "link"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.linkText}>
                    {isLinked ? "Linked" : "Link"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Find service providers</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[styles.categoryChip, isActive && styles.categoryActive]}
                onPress={() => setActiveCategory(cat.name)}
                activeOpacity={0.7}
              >
                <Feather
                  name={cat.icon}
                  size={16}
                  color={isActive ? "#fff" : "#64748b"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Shop List */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={filteredShops}
            renderItem={renderShop}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366f1"
              />
            }
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.resultsCount}>
                  {filteredShops.length} shops available
                </Text>
                <TouchableOpacity
                  style={[
                    styles.ratingFilter,
                    filterRating && styles.ratingFilterActive,
                  ]}
                  onPress={() => setFilterRating(!filterRating)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={filterRating ? "#fff" : "#6366f1"}
                  />
                  <Text
                    style={[
                      styles.ratingFilterText,
                      filterRating && styles.ratingFilterTextActive,
                    ]}
                  >
                    Top Rated
                  </Text>
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="shopping-bag" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No shops found</Text>
                <Text style={styles.emptyDesc}>
                  Try different search or category
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRefresh}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryText}>Reload</Text>
                </TouchableOpacity>
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
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },

  // Categories
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  categoryTextActive: {
    color: "#fff",
  },

  // List
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  ratingFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  ratingFilterActive: {
    backgroundColor: "#6366f1",
  },
  ratingFilterText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
  },
  ratingFilterTextActive: {
    color: "#fff",
  },

  // Shop Card
  shopCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f1f5f9",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  shopInfo: {
    flex: 1,
    marginRight: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  shopCategory: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#6366f1",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
  },
  linkButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  linkedButton: {
    backgroundColor: "#10b981",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  // Empty State
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});

export default FindShop;
