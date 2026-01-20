import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const Attendance = () => {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const absentReasons = [
    "Sick / Illness",
    "Family Emergency",
    "Out of Station",
    "Religious Occasion",
    "Other",
  ];

  const fetchClasses = useCallback(async () => {
    const mockClasses = [
      "6-A",
      "6-B",
      "7-A",
      "7-B",
      "8-A",
      "9-A",
      "10-A",
      "11-SCI",
      "12-SCI",
    ];
    setClasses(mockClasses);
    if (!selectedClass && mockClasses.length > 0) {
      setSelectedClass(mockClasses[0]);
    }
  }, [selectedClass]);

  const fetchStudents = useCallback(async () => {
    if (!user?.id || !selectedClass) return;

    setLoading(true);
    try {
      const { data } = await apiClient.get(
        `/school/students/${user.id}?class=${selectedClass}`,
      );

      const enriched = (Array.isArray(data) ? data : []).map((student) => ({
        ...student,
        isPresent: true,
        absentReason: "",
      }));

      setStudents(enriched);
      setFilteredStudents(enriched);
    } catch (err) {
      console.error("Fetch students error:", err);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedClass]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass && user?.id) {
      fetchStudents();
    }
  }, [fetchStudents, selectedClass, user?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.rollNo?.toLowerCase().includes(query),
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const toggleAttendance = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s._id === id
          ? {
              ...s,
              isPresent: !s.isPresent,
              absentReason: !s.isPresent ? "" : s.absentReason,
            }
          : s,
      ),
    );
  };

  const markAll = (status) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        isPresent: status,
        absentReason: status ? "" : s.absentReason,
      })),
    );
  };

  const setReason = (reason) => {
    if (selectedStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s._id === selectedStudent._id ? { ...s, absentReason: reason } : s,
        ),
      );
    }
    setShowReasonModal(false);
    setSelectedStudent(null);
  };

  const handleSubmit = async () => {
    if (!filteredStudents.length) {
      return Alert.alert("No Students", "This class has no students");
    }

    const present = filteredStudents.filter((s) => s.isPresent).length;
    const absent = filteredStudents.length - present;

    Alert.alert(
      "Confirm Attendance",
      `Class: ${selectedClass}\nPresent: ${present}\nAbsent: ${absent}\n\nSubmit?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setSubmitting(true);
            try {
              const payload = {
                schoolId: user.id,
                className: selectedClass,
                date: new Date().toISOString().split("T")[0],
                records: filteredStudents.map((s) => ({
                  studentId: s._id,
                  status: s.isPresent ? "Present" : "Absent",
                  absentReason: !s.isPresent ? s.absentReason : undefined,
                })),
              };

              await apiClient.post("/attendance/submit", payload);
              Alert.alert("Success", "Attendance recorded");
            } catch (err) {
              console.error("Submit error:", err);
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to save",
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const stats = useMemo(() => {
    const present = filteredStudents.filter((s) => s.isPresent).length;
    return {
      total: filteredStudents.length,
      present,
      absent: filteredStudents.length - present,
      percentage: filteredStudents.length
        ? Math.round((present / filteredStudents.length) * 100)
        : 0,
    };
  }, [filteredStudents]);

  const renderStudent = ({ item }) => (
    <View style={styles.studentCard}>
      <TouchableOpacity
        style={styles.studentInfo}
        onPress={() => toggleAttendance(item._id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: item.isPresent ? "#dcfce7" : "#fee2e2" },
          ]}
        >
          <Text style={styles.avatarText}>
            {item.name?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.nameSection}>
          <Text style={styles.studentName}>{item.name || "Unknown"}</Text>
          <Text style={styles.rollNumber}>Roll {item.rollNo || "N/A"}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.isPresent ? styles.presentButton : styles.absentButton,
          ]}
          onPress={() => toggleAttendance(item._id)}
          activeOpacity={0.7}
        >
          <Feather
            name={item.isPresent ? "check-circle" : "x-circle"}
            size={24}
            color={item.isPresent ? "#10b981" : "#ef4444"}
          />
        </TouchableOpacity>

        {!item.isPresent && (
          <TouchableOpacity
            style={styles.reasonButton}
            onPress={() => {
              setSelectedStudent(item);
              setShowReasonModal(true);
            }}
            activeOpacity={0.7}
          >
            <Feather name="file-text" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
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
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </Text>
            <Text style={styles.title}>Attendance</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Class Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classScroll}
        >
          {classes.map((cls) => {
            const isActive = selectedClass === cls;
            return (
              <TouchableOpacity
                key={cls}
                style={[styles.classChip, isActive && styles.classActive]}
                onPress={() => setSelectedClass(cls)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.classText, isActive && styles.classTextActive]}
                >
                  {cls}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: "#10b981" }]}>
              {stats.present}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: "#ef4444" }]}>
              {stats.absent}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.percentage}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student..."
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

        {/* Student List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="users" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No students found</Text>
                <Text style={styles.emptyDesc}>
                  Add students in Class {selectedClass}
                </Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366f1"
              />
            }
          />
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => markAll(true)}
            activeOpacity={0.7}
          >
            <Feather name="check-square" size={18} color="#10b981" />
            <Text style={styles.quickActionText}>All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => markAll(false)}
            activeOpacity={0.7}
          >
            <Feather name="x-square" size={18} color="#ef4444" />
            <Text style={styles.quickActionText}>All Absent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Reason Modal */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Absence Reason</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStudent?.absentReason || ""}
                onValueChange={setReason}
                style={styles.picker}
              >
                <Picker.Item
                  label="Select reason..."
                  value=""
                  color="#94a3b8"
                />
                {absentReasons.map((r) => (
                  <Picker.Item key={r} label={r} value={r} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowReasonModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => setShowReasonModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  date: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Class Selector
  classScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  classActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  classText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  classTextActive: {
    color: "#fff",
  },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  // Student Card
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
  },
  nameSection: {
    marginLeft: 12,
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  presentButton: {
    backgroundColor: "#dcfce7",
  },
  absentButton: {
    backgroundColor: "#fee2e2",
  },
  reasonButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
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
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  submitButton: {
    flex: 1.5,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 150,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalCancel: {
    padding: 12,
  },
  modalCancelText: {
    color: "#64748b",
    fontWeight: "600",
  },
  modalSave: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default Attendance;
