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
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const ManageAdmitCards = () => {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    targetClass: "",
    examName: "Annual Examination 2026",
    centerName: "",
    startDate: "",
  });

  const fetchBatches = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiClient.get(`/school/admit-cards/batches/${user.id}`);
      setBatches(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch batches error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchBatches();
    }
  }, [fetchBatches, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBatches();
  };

  const handleGenerate = async () => {
    if (
      !form.targetClass.trim() ||
      !form.centerName.trim() ||
      !form.startDate.trim()
    ) {
      return Alert.alert("Required", "Fill all fields to generate admit cards");
    }

    setSubmitting(true);
    try {
      await apiClient.post("/school/admit-cards/generate", {
        ...form,
        schoolId: user.id,
      });

      Alert.alert(
        "Success",
        `Admit cards for ${form.targetClass} are now live`,
      );
      setModalVisible(false);
      setForm({
        targetClass: "",
        examName: "Annual Examination 2026",
        centerName: "",
        startDate: "",
      });
      fetchBatches();
    } catch (err) {
      console.error("Generate error:", err);
      Alert.alert("Error", "Failed to generate admit cards");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBatchItem = ({ item }) => (
    <View style={styles.batchCard}>
      <View style={styles.cardHeader}>
        <View style={styles.classTag}>
          <Text style={styles.classText}>{item.targetClass || "N/A"}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.examName}>{item.examName || "Examination"}</Text>
      <View style={styles.infoRow}>
        <Feather name="map-pin" size={14} color="#64748b" />
        <Text style={styles.centerName}>{item.centerName || "Center"}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>Starts: {item.startDate || "TBD"}</Text>
        <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
          <Feather name="download" size={14} color="#6366f1" />
          <Text style={styles.downloadText}>Bulk PDF</Text>
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
          <View style={styles.headerContent}>
            <Text style={styles.title}>Admit Cards</Text>
            <Text style={styles.subtitle}>Manage exam hall tickets</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={batches}
          keyExtractor={(item) => item._id}
          renderItem={renderBatchItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Action Card */}
              <View style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <Feather name="file-text" size={32} color="#6366f1" />
                </View>
                <Text style={styles.actionTitle}>Generate Admit Cards</Text>
                <Text style={styles.actionDesc}>
                  Create and publish hall tickets for any class
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Configure Exam</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Published Batches</Text>
            </View>
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="layers" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No batches published</Text>
                <Text style={styles.emptyDesc}>
                  Generated admit cards will appear here
                </Text>
              </View>
            )
          }
        />

        {loading && !refreshing && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}

        {/* Configuration Modal */}
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
                <Text style={styles.modalTitle}>Admit Card Settings</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Target Class</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10-A"
                    value={form.targetClass}
                    onChangeText={(v) => setForm({ ...form, targetClass: v })}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Exam Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Annual Examination 2026"
                    value={form.examName}
                    onChangeText={(v) => setForm({ ...form, examName: v })}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Examination Center</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Block-A, School Campus"
                    value={form.centerName}
                    onChangeText={(v) => setForm({ ...form, centerName: v })}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Exam Start Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 15 Feb 2026"
                    value={form.startDate}
                    onChangeText={(v) => setForm({ ...form, startDate: v })}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabled]}
                onPress={handleGenerate}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Generate & Publish</Text>
                )}
              </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
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
  headerContent: {
    flex: 1,
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

  // List
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Action Card
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  actionDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Section Title
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Batch Card
  batchCard: {
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
  classTag: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  classText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
  },
  examName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  centerName: {
    fontSize: 12,
    color: "#64748b",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  downloadText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
  },

  // Empty State
  center: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
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

export default ManageAdmitCards;
