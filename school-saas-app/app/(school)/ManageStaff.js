import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const StaffManagement = () => {
  const { user } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Teacher",
    password: "",
    showPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const staffRoles = [
    "Principal",
    "Vice Principal",
    "Teacher",
    "Class Teacher",
    "Lab Assistant",
    "Librarian",
    "Office Staff",
    "Security",
    "PT Instructor",
    "Counselor",
    "Admin Assistant",
  ];

  const fetchStaff = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data } = await apiClient.get(`/school/staff/${user.id}`);
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Staff fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchStaff();
    }
  }, [fetchStaff, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const filteredStaff = useMemo(() => {
    if (!searchText.trim()) return staffList;
    const query = searchText.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.role?.toLowerCase().includes(query),
    );
  }, [staffList, searchText]);

  const handleAddStaff = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role) {
      return Alert.alert("Required", "Name, email, and role are required");
    }
    if (form.password.length < 6) {
      return Alert.alert("Password", "Password must be at least 6 characters");
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        schoolId: user.id,
      };
      const { data } = await apiClient.post("/school/add-staff", payload);

      if (data?.staff) {
        setStaffList((prev) => [data.staff, ...prev]);
      }

      setAddModalVisible(false);
      setForm({
        name: "",
        email: "",
        role: "Teacher",
        password: "",
        showPassword: false,
      });

      Alert.alert("Success", `${form.name} added successfully`);
    } catch (err) {
      console.error("Add staff error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to add staff",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (staffId, currentStatus) => {
    Alert.alert(
      currentStatus ? "Block Staff?" : "Activate Staff?",
      currentStatus ? "This will revoke access" : "This will restore access",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: currentStatus ? "Block" : "Activate",
          style: currentStatus ? "destructive" : "default",
          onPress: async () => {
            try {
              await apiClient.patch(`/school/staff/status/${staffId}`, {
                isActive: !currentStatus,
              });

              setStaffList((prev) =>
                prev.map((s) =>
                  s._id === staffId ? { ...s, isActive: !currentStatus } : s,
                ),
              );
            } catch (err) {
              console.error("Status update error:", err);
              Alert.alert("Error", "Failed to update status");
            }
          },
        },
      ],
    );
  };

  const deleteStaff = (staffId, name) => {
    Alert.alert("Delete Staff?", `Remove ${name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/school/staff/${staffId}`);
            setStaffList((prev) => prev.filter((s) => s._id !== staffId));
            Alert.alert("Removed", `${name} removed successfully`);
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete staff");
          }
        },
      },
    ]);
  };

  const renderStaffItem = ({ item }) => (
    <View style={styles.staffCard}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {item.name?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.name || "Unknown"}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{item.role || "N/A"}</Text>
          </View>
          <Text style={styles.email}>{item.email || "No email"}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              { color: item.isActive ? "#10b981" : "#ef4444" },
            ]}
          >
            {item.isActive ? "Active" : "Blocked"}
          </Text>
          <Switch
            value={item.isActive ?? true}
            onValueChange={() => toggleActiveStatus(item._id, item.isActive)}
            trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
            thumbColor={item.isActive ? "#10b981" : "#cbd5e1"}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => deleteStaff(item._id, item.name)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#ef4444" />
          <Text style={styles.actionText}>Remove</Text>
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
            <Text style={styles.title}>Staff Management</Text>
            <Text style={styles.subtitle}>{staffList.length} members</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search staff..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Feather name="x" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Staff List */}
        <View style={styles.listContainer}>
          {loading && !refreshing ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : (
            <FlatList
              data={filteredStaff}
              renderItem={renderStaffItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6366f1"
                />
              }
              ListEmptyComponent={() => (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Feather name="users" size={48} color="#cbd5e1" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchText ? "No matching staff" : "No staff yet"}
                  </Text>
                  <Text style={styles.emptyDesc}>
                    {searchText
                      ? "Try different keywords"
                      : "Add staff members to get started"}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Add Staff Modal */}
        <Modal
          visible={addModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Staff Member</Text>

              <ScrollView
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(v) => setForm({ ...form, name: v })}
                    placeholder="Enter name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => setForm({ ...form, email: v })}
                    placeholder="email@school.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Role</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={form.role}
                      onValueChange={(value) =>
                        setForm({ ...form, role: value })
                      }
                      style={styles.picker}
                    >
                      {staffRoles.map((role) => (
                        <Picker.Item key={role} label={role} value={role} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password (min 6 characters)</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={form.password}
                      onChangeText={(v) => setForm({ ...form, password: v })}
                      placeholder="••••••"
                      secureTextEntry={!form.showPassword}
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setForm({ ...form, showPassword: !form.showPassword })
                      }
                    >
                      <Feather
                        name={form.showPassword ? "eye" : "eye-off"}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setAddModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.disabled]}
                  onPress={handleAddStaff}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Add Staff</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Staff Card
  staffCard: {
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
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  roleTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  email: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  statusContainer: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },

  // Actions
  actions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
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
    textAlign: "center",
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
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  formScroll: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
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
  pickerContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#1e293b",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
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

export default StaffManagement;
