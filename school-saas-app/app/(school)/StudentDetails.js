import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import apiClient from "../../api/apiClient";

const StudentDetails = () => {
  const { studentId } = useLocalSearchParams();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        const res = await apiClient.get(`/student/profile/${studentId}`);
        setStudent(res?.data || null);
      } catch (err) {
        console.error("Profile fetch error:", err);
        Alert.alert("Error", "Could not load student profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [studentId]);

  const handleToggleLock = async () => {
    if (student?.isLocked) {
      return Alert.alert("Locked", "Profile is already verified and locked");
    }

    Alert.alert(
      "Verify Profile",
      "Lock this profile? Student won't be able to edit after verification.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify & Lock",
          onPress: async () => {
            setUpdating(true);
            try {
              const res = await apiClient.put(`/student/lock/${studentId}`, {
                isLocked: true,
              });
              setStudent(res?.data?.student || student);
              Alert.alert("Success", "Profile verified and locked");
            } catch (err) {
              console.error("Lock error:", err);
              Alert.alert("Error", "Failed to lock profile");
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Feather name="user-x" size={40} color="#cbd5e1" />
        </View>
        <Text style={styles.errorTitle}>Student not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: student.photo
                    ? `http://10.0.2.2:5000${student.photo}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        student.name || "Student",
                      )}&background=6366f1&color=fff`,
                }}
                style={styles.avatar}
              />
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: student.isLocked ? "#10b981" : "#f59e0b",
                  },
                ]}
              />
            </View>

            <Text style={styles.studentName}>{student.name || "Unknown"}</Text>
            <Text style={styles.studentMeta}>
              Class {student.class || "N/A"} • Roll {student.rollNo || "N/A"}
            </Text>

            <View style={styles.badges}>
              {student.bloodGroup && (
                <View style={styles.badge}>
                  <Feather name="droplet" size={12} color="#6366f1" />
                  <Text style={styles.badgeText}>{student.bloodGroup}</Text>
                </View>
              )}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      student.isActive !== false ? "#dcfce7" : "#fee2e2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: student.isActive !== false ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {student.isActive !== false ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>

          {/* Lock Control */}
          <View style={styles.lockCard}>
            <View style={styles.lockInfo}>
              <Feather
                name={student.isLocked ? "lock" : "unlock"}
                size={18}
                color={student.isLocked ? "#10b981" : "#64748b"}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.lockTitle}>Verification Status</Text>
                <Text style={styles.lockDesc}>
                  {student.isLocked
                    ? "Profile verified and locked"
                    : "Profile can be edited"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.lockButton,
                student.isLocked && styles.lockedButton,
              ]}
              onPress={handleToggleLock}
              disabled={updating || student.isLocked}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.lockButtonText,
                    student.isLocked && styles.lockedButtonText,
                  ]}
                >
                  {student.isLocked ? "Locked" : "Verify"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="user"
              label="Father/Guardian"
              value={student.fatherName || "Not provided"}
            />
            <InfoRow
              icon="phone"
              label="Emergency Contact"
              value={student.emergencyContact || "N/A"}
            />
            <InfoRow
              icon="map-pin"
              label="Address"
              value={student.address || "No address"}
            />
          </View>

          {/* Academic Stats */}
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              label="Attendance"
              value={student.attendance || "0%"}
              color="#6366f1"
            />
            <StatCard
              icon="credit-card"
              label="Fee Status"
              value={student.feeStatus || "Pending"}
              color="#10b981"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Info Row Component
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Feather name={icon} size={16} color="#6366f1" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
      <Feather name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Center States
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  errorLink: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  // Content
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    borderWidth: 4,
    borderColor: "#fff",
  },
  statusDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },
  studentName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  studentMeta: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
  },

  // Lock Card
  lockCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  lockDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  lockButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  lockedButton: {
    backgroundColor: "#f1f5f9",
  },
  lockButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  lockedButtonText: {
    color: "#94a3b8",
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

  // Info Card
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
});

export default StudentDetails;
