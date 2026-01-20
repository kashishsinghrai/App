import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const ManageResults = () => {
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    rollNo: "",
    examName: "Final Term",
    maths: "",
    science: "",
    english: "",
    grade: "",
  });

  const fetchResults = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiClient.get(`/school/results/${user.id}`);
      setResults(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch results error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchResults();
    }
  }, [fetchResults, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const handlePublish = async () => {
    const { rollNo, maths, grade } = form;
    if (!rollNo.trim() || !maths.trim() || !grade.trim()) {
      return Alert.alert("Required", "Fill roll number, maths marks and grade");
    }

    setSubmitting(true);
    try {
      await apiClient.post("/school/results/publish", {
        ...form,
        schoolId: user.id,
      });

      Alert.alert("Success", `Result for Roll ${rollNo} published`);
      setForm({
        rollNo: "",
        examName: "Final Term",
        maths: "",
        science: "",
        english: "",
        grade: "",
      });
      fetchResults();
    } catch (err) {
      console.error("Publish error:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteResult = (id, rollNo) => {
    Alert.alert("Delete Result", `Remove result for Roll ${rollNo}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/school/results/${id}`);
            setResults((prev) => prev.filter((r) => r._id !== id));
            Alert.alert("Deleted", "Result removed");
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const renderResultItem = ({ item }) => (
    <View style={styles.resultCard}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {item.studentName || "Student"}
          </Text>
          <Text style={styles.rollNumber}>Roll {item.rollNo || "N/A"}</Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{item.grade || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.marksRow}>
        <MarkBox label="Maths" value={item.maths} />
        <MarkBox label="Science" value={item.science} />
        <MarkBox label="English" value={item.english} />
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteResult(item._id, item.rollNo)}
        activeOpacity={0.7}
      >
        <Feather name="trash-2" size={14} color="#ef4444" />
        <Text style={styles.deleteText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Results Manager</Text>
            <Text style={styles.subtitle}>Publish student scores</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Publish Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Publish New Result</Text>

            <TextInput
              style={styles.input}
              placeholder="Student Roll Number"
              value={form.rollNo}
              onChangeText={(v) => setForm({ ...form, rollNo: v })}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Maths"
                keyboardType="numeric"
                value={form.maths}
                onChangeText={(v) => setForm({ ...form, maths: v })}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Science"
                keyboardType="numeric"
                value={form.science}
                onChangeText={(v) => setForm({ ...form, science: v })}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="English"
                keyboardType="numeric"
                value={form.english}
                onChangeText={(v) => setForm({ ...form, english: v })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Grade (e.g. A+)"
              value={form.grade}
              onChangeText={(v) => setForm({ ...form, grade: v })}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.publishButton, submitting && styles.disabled]}
              onPress={handlePublish}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="upload-cloud" size={18} color="#fff" />
                  <Text style={styles.publishText}>Publish Result</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Results List */}
          <Text style={styles.sectionTitle}>Published Results</Text>

          {loading && !refreshing ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="file-text" size={40} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No results published</Text>
              <Text style={styles.emptyDesc}>
                Published results will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item._id}
              renderItem={renderResultItem}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6366f1"
                />
              }
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Mark Box Component
const MarkBox = ({ label, value }) => (
  <View style={styles.markBox}>
    <Text style={styles.markLabel}>{label}</Text>
    <Text style={styles.markValue}>{value || "0"}</Text>
  </View>
);

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

  // Content
  content: {
    padding: 20,
  },

  // Form Card
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
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
  row: {
    flexDirection: "row",
    gap: 10,
  },
  inputSmall: {
    flex: 1,
  },
  publishButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  publishText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Result Card
  resultCard: {
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  rollNumber: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
  },
  marksRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  markBox: {
    flex: 1,
    alignItems: "center",
  },
  markLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  markValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },

  // Empty State
  center: {
    paddingVertical: 40,
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
});

export default ManageResults;
