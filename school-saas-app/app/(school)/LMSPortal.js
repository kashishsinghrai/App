import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

const LMSPortal = () => {
  const { user } = useAuth();

  // --- States ---
  const [content, setContent] = useState([]); // Starts empty
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Videos");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Form State ---
  const [form, setForm] = useState({
    title: "",
    targetClass: "",
    sourceLink: "",
    subject: "",
  });

  /**
   * 1. FETCH LIVE CONTENT FROM ATLAS
   */
  const fetchLMSContent = useCallback(async () => {
    try {
      setLoading(true);
      // Route: GET /api/school/lms/:schoolId
      const res = await apiClient.get(`/school/lms/${user.id}`);
      setContent(res.data);
    } catch (err) {
      console.error("LMS Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchLMSContent();
  }, [fetchLMSContent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLMSContent();
  };

  /**
   * 2. UPLOAD NEW CONTENT LOGIC
   */
  const handlePublish = async () => {
    const { title, targetClass, sourceLink, subject } = form;
    if (!title || !targetClass || !sourceLink) {
      return Alert.alert("Required", "Please fill all the mandatory fields.");
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        type: activeTab, // Videos or Study Notes
        schoolId: user.id,
      };

      const res = await apiClient.post("/school/lms/upload", payload);

      setContent([res.data.asset, ...content]); // Add to list instantly
      setModalVisible(false);
      setForm({ title: "", targetClass: "", sourceLink: "", subject: "" });
      Alert.alert(
        "Published! 🚀",
        "Learning material is now live for students."
      );
    } catch (err) {
      Alert.alert("Upload Failed", "Could not sync with cloud storage.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 3. DELETE CONTENT
   */
  const handleDelete = (id) => {
    Alert.alert(
      "Delete Asset",
      "Are you sure you want to remove this from the portal?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/school/lms/${id}`);
              setContent(content.filter((item) => item._id !== id));
            } catch (err) {
              Alert.alert("Error", "Delete operation failed.");
            }
          },
        },
      ]
    );
  };

  const renderLMSItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
      <BlurView intensity={80} tint="light" style={styles.contentCard}>
        <View style={styles.cardMain}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: activeTab === "Videos" ? "#fee2e2" : "#e0e7ff",
              },
            ]}
          >
            <Ionicons
              name={activeTab === "Videos" ? "play" : "document-text"}
              size={22}
              color={activeTab === "Videos" ? "#ef4444" : "#4f46e5"}
            />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {item.targetClass || item.class}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{item.subject || "General"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id)}
          >
            <Feather name="trash-2" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* MESH BACKGROUND */}
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#fdf2f8"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Digital Library</Text>
            <Text style={styles.headerSub}>
              {content.filter((i) => i.type === activeTab).length} Assets Listed
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* GLASS TABS */}
        <View style={styles.tabWrapper}>
          <BlurView intensity={100} tint="light" style={styles.tabGlass}>
            {["Videos", "Study Notes"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>

        {/* LIST SECTION */}
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 100 }}
          />
        ) : (
          <FlatList
            data={content.filter((i) => i.type === activeTab)}
            renderItem={renderLMSItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Feather name="folder-plus" size={50} color="#cbd5e1" />
                <Text style={styles.emptyTxt}>
                  No {activeTab} found in Atlas cloud.
                </Text>
              </View>
            }
          />
        )}

        {/* PREMIUM FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient
            colors={["#1e293b", "#334155"]}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={24} color="#fff" />
            <Text style={styles.fabText}>New Asset</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* UPLOAD MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalFlex}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalIndicator} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Upload to {activeTab}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#cbd5e1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.glassInput}
                    placeholder="Asset Title"
                    onChangeText={(t) => setForm({ ...form, title: t })}
                  />
                  <TextInput
                    style={styles.glassInput}
                    placeholder="Target Class (e.g. 12-B)"
                    onChangeText={(t) => setForm({ ...form, targetClass: t })}
                  />
                  <TextInput
                    style={styles.glassInput}
                    placeholder="Subject (e.g. Physics)"
                    onChangeText={(t) => setForm({ ...form, subject: t })}
                  />
                  <TextInput
                    style={styles.glassInput}
                    placeholder={
                      activeTab === "Videos" ? "YouTube / S3 Link" : "PDF URL"
                    }
                    onChangeText={(t) => setForm({ ...form, sourceLink: t })}
                  />
                </View>

                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={handlePublish}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.publishText}>Publish to Students</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </BlurView>
        </Modal>
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
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -1,
  },
  headerSub: { fontSize: 13, color: "#94a3b8", fontWeight: "700" },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  tabWrapper: { paddingHorizontal: 25, marginBottom: 15 },
  tabGlass: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 15 },
  activeTab: { backgroundColor: "#fff", elevation: 3 },
  tabText: { fontSize: 13, fontWeight: "800", color: "#94a3b8" },
  activeTabText: { color: "#4f46e5" },

  listContent: { paddingHorizontal: 22, paddingBottom: 150 },
  contentCard: {
    padding: 18,
    borderRadius: 28,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },
  cardMain: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  metaText: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 8,
  },
  deleteBtn: { padding: 8 },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 25,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#1e293b",
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  fabText: { color: "#fff", fontWeight: "900", marginLeft: 10, fontSize: 14 },

  emptyWrap: { alignItems: "center", marginTop: 80 },
  emptyTxt: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 15,
  },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalFlex: { justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingBottom: 50,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  inputGroup: { gap: 15, marginBottom: 25 },
  glassInput: {
    backgroundColor: "#f8fafc",
    padding: 18,
    borderRadius: 18,
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  publishBtn: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  publishText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});

export default LMSPortal;
