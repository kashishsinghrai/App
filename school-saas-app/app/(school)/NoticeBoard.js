import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const NoticeBoard = () => {
  const { user } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    isImportant: false,
  });

  const fetchNotices = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiClient.get(`/school/notices/${user.id}`);
      setNotices(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch notices error:", err);
      setNotices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotices();
    }
  }, [fetchNotices, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return Alert.alert("Required", "Fill in title and content");
    }

    setSubmitting(true);
    try {
      const payload = { ...form, schoolId: user.id };
      const res = await apiClient.post("/school/notice", payload);

      if (res?.data?.notice) {
        setNotices([res.data.notice, ...notices]);
      }

      setModalVisible(false);
      setForm({
        title: "",
        content: "",
        category: "General",
        isImportant: false,
      });
      Alert.alert("Success", "Notice published");
    } catch (err) {
      console.error("Create notice error:", err);
      Alert.alert("Error", "Failed to publish notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert("Delete Notice", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/school/notice/${id}`);
            setNotices(notices.filter((n) => n._id !== id));
            Alert.alert("Deleted", "Notice removed");
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || n.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const renderNotice = ({ item }) => (
    <View style={styles.noticeCard}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: item.isImportant ? "#fee2e2" : "#eef2ff" },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: item.isImportant ? "#ef4444" : "#6366f1" },
            ]}
          >
            {item.category?.toUpperCase() || "GENERAL"}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>

      <Text style={styles.noticeTitle}>{item.title || "Untitled"}</Text>
      <Text style={styles.noticeContent} numberOfLines={3}>
        {item.content || "No content"}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.authorRow}>
          <Feather name="user" size={14} color="#94a3b8" />
          <Text style={styles.authorText}>Admin</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item._id, item.title)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notice Board</Text>
            <Text style={styles.subtitle}>Announcements & updates</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search & Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notices..."
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {["All", "Holiday", "Event", "Finance", "Exam"].map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.chip, isActive && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Notice List */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={filteredNotices}
            renderItem={renderNotice}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366f1"
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="file-text" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No notices found</Text>
                <Text style={styles.emptyDesc}>
                  {searchQuery
                    ? "Try different keywords"
                    : "Create your first notice"}
                </Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.9}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Create Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Notice</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Notice Title"
                  value={form.title}
                  onChangeText={(t) => setForm({ ...form, title: t })}
                  placeholderTextColor="#94a3b8"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Category (e.g. Holiday)"
                  value={form.category}
                  onChangeText={(t) => setForm({ ...form, category: t })}
                  placeholderTextColor="#94a3b8"
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Content..."
                  multiline
                  numberOfLines={6}
                  value={form.content}
                  onChangeText={(t) => setForm({ ...form, content: t })}
                  placeholderTextColor="#94a3b8"
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.disabled]}
                  onPress={handleCreate}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Publish Notice</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Filter Section
  filterSection: {
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
    marginBottom: 12,
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
  chipScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  chipTextActive: {
    color: "#fff",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Notice Card
  noticeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  noticeContent: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
    paddingTop: 80,
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
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default NoticeBoard;
