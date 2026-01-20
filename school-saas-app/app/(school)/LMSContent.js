import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

/**
 * LMS CONTENT HUB - Production Ready
 * Fetches real study materials, PDFs, and video links from Atlas Cloud.
 * No dummy data included.
 */
const LMSContent = () => {
  const { user } = useAuth();

  // --- States ---
  const [assets, setAssets] = useState([]); // Initialized empty
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  /**
   * 1. CLOUD SYNC LOGIC
   * Fetches data from MongoDB Atlas via backend API
   */
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      // Route: GET /api/school/lms/:schoolId
      const res = await apiClient.get(`/school/lms/${user.id}`);
      setAssets(res.data);
    } catch (err) {
      console.error("LMS Sync Error:", err.message);
      // Keep assets as empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  /**
   * Filter Logic based on Active Category chip
   */
  const filteredAssets = assets.filter((item) => {
    if (activeCategory === "All") return true;
    return item.type === activeCategory.toLowerCase(); // Expected types: 'pdf', 'video'
  });

  const renderAsset = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(800)}>
      <BlurView intensity={70} tint="light" style={styles.fileCard}>
        <View style={styles.cardMain}>
          <View
            style={[
              styles.fileIcon,
              { backgroundColor: item.type === "pdf" ? "#fee2e2" : "#d1fae5" },
            ]}
          >
            <MaterialIcons
              name={item.type === "pdf" ? "picture-as-pdf" : "play-circle-fill"}
              size={24}
              color={item.type === "pdf" ? "#ef4444" : "#059669"}
            />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {item.targetClass || item.class}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{item.subject || "General"}</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.moreBtn}>
            <Feather name="download-cloud" size={18} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* GLOBAL MESH BACKGROUND */}
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#fdf2f8"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Digital Assets</Text>
            <Text style={styles.headerSub}>
              {assets.length} Cloud Records Found
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* CONTENT FLATLIST */}
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 100 }}
          />
        ) : (
          <FlatList
            data={filteredAssets}
            keyExtractor={(item) => item._id}
            renderItem={renderAsset}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.scrollContent}
            ListHeaderComponent={
              <View>
                {/* PREMIUM UPLOAD CTA */}
                <TouchableOpacity activeOpacity={0.9} style={styles.uploadHero}>
                  <BlurView
                    intensity={90}
                    tint="light"
                    style={styles.uploadGlass}
                  >
                    <LinearGradient
                      colors={["rgba(79, 70, 229, 0.1)", "transparent"]}
                      style={styles.uploadGradient}
                    >
                      <View style={styles.uploadIconContainer}>
                        <Feather
                          name="upload-cloud"
                          size={32}
                          color="#4f46e5"
                        />
                      </View>
                      <View style={styles.uploadTexts}>
                        <Text style={styles.uploadTitle}>New Material</Text>
                        <Text style={styles.uploadSub}>
                          Sync PDFs or Videos
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={28} color="#4f46e5" />
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>

                {/* CATEGORY SELECTOR */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {["All", "PDF", "Video", "Assignment"].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chip,
                        activeCategory === cat && styles.activeChip,
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          activeCategory === cat && styles.activeChipText,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.sectionHeader}>Repository List</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="folder-open-outline"
                  size={60}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyText}>
                  No assets found in Atlas Cloud.
                </Text>
                <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                  <Text style={styles.retryTxt}>Reload Library</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -1,
  },
  headerSub: { fontSize: 13, color: "#94a3b8", fontWeight: "700" },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  uploadHero: {
    marginBottom: 25,
    borderRadius: 32,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.1,
  },
  uploadGlass: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  uploadGradient: { padding: 22, flexDirection: "row", alignItems: "center" },
  uploadIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  uploadTexts: { flex: 1, marginLeft: 15 },
  uploadTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  uploadSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "600",
  },

  chipScroll: { marginBottom: 25 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  activeChip: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  activeChipText: { color: "#fff" },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#475569",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 5,
  },

  fileCard: {
    padding: 16,
    borderRadius: 28,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },
  cardMain: { flexDirection: "row", alignItems: "center" },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: { flex: 1, marginLeft: 15 },
  fileName: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  metaText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 6,
  },
  moreBtn: { padding: 5 },

  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 15,
  },
  retryBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
  },
  retryTxt: { color: "#4f46e5", fontWeight: "800", fontSize: 13 },
});

export default LMSContent;
