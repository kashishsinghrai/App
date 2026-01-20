import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Switch,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const ManageStudents = () => {
  const { user } = useAuth();
  const router = useRouter();

  // LIVE DATA STATE
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    name: "",
    rollNo: "",
    className: "",
  });

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/school/students/${user.id}`);
      setStudents(res.data);
    } catch (err) {
      console.log("Database Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAdmission = async () => {
    if (!admissionForm.name || !admissionForm.rollNo)
      return Alert.alert("Missing Fields");
    setSubmitting(true);
    try {
      const res = await apiClient.post("/school/create-student", {
        ...admissionForm,
        schoolId: user.id,
      });
      Alert.alert(
        "Admission Success",
        `ID: ${res.data.student.username}\nPass: ${res.data.generatedPassword}`
      );
      setModalVisible(false);
      loadStudents();
    } catch (err) {
      Alert.alert("Error", "Check if roll number is duplicate.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.includes(searchQuery)
    );
  }, [searchQuery, students]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Student Directory</Text>
            <Text style={styles.headerSub}>{students.length} Real Records</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or roll..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(index * 50)}>
                <BlurView
                  intensity={80}
                  tint="light"
                  style={styles.studentCard}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTxt}>{item.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentMeta}>
                        Roll: {item.rollNo} • {item.className}
                      </Text>
                    </View>
                    <Switch
                      value={item.isActive !== false}
                      onValueChange={() => {}}
                      thumbColor="#4f46e5"
                    />
                  </View>
                </BlurView>
              </Animated.View>
            )}
            contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
            ListEmptyComponent={
              <Text style={styles.empty}>No students found in Database.</Text>
            }
          />
        )}

        {/* ADMISSION MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Student Admission</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                onChangeText={(t) =>
                  setAdmissionForm({ ...admissionForm, name: t })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Roll Number"
                onChangeText={(t) =>
                  setAdmissionForm({ ...admissionForm, rollNo: t })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Class (e.g. 10-A)"
                onChangeText={(t) =>
                  setAdmissionForm({ ...admissionForm, className: t })
                }
              />
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAdmission}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Enrol Student</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ marginTop: 15, alignItems: "center" }}
              >
                <Text style={{ color: "#64748b" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#94a3b8", fontWeight: "700" },
  addBtn: {
    width: 50,
    height: 50,
    backgroundColor: "#4f46e5",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 25,
    paddingHorizontal: 15,
    borderRadius: 16,
    height: 55,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "600" },
  studentCard: {
    padding: 20,
    borderRadius: 32,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 20, fontWeight: "800", color: "#4f46e5" },
  studentName: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  studentMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    marginTop: 100,
    color: "#94a3b8",
    fontWeight: "700",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingBottom: 50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f8fafc",
    padding: 18,
    borderRadius: 18,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  submitBtn: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});

export default ManageStudents;
