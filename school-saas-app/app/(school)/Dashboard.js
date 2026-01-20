// app/(school)/Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { apiFetchSchoolStats } from "../../api/apiClient";
import Animated, { FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");
const GAP = 12;

const SchoolDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    completionRate: 0,
    verified: 0,
    pending: 0,
    newInquiries: 0,
    pendingResults: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await apiFetchSchoolStats(user.id);
      setStats({
        totalStudents: data.totalStudents || 0,
        attendanceToday: Math.round(data.attendanceToday || 0),
        completionRate: Math.round(data.completionRate || 0),
        verified: data.verified || 0,
        pending: data.pending || 0,
        newInquiries: data.activeInquiries || 0,
        pendingResults: data.pendingResults || 0,
      });
    } catch (err) {
      console.log("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profile}
            onPress={() => router.push("/(school)/Settings")}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri:
                  user?.logo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "School",
                  )}&background=0a0a0a&color=fff`,
              }}
              style={styles.avatar}
            />
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName} numberOfLines={1}>
                {user?.name || "Your School"}
              </Text>
              <Text style={styles.role}>Admin Dashboard</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notification}
            activeOpacity={0.7}
            onPress={() => router.push("/(school)/Notifications")}
          >
            <Feather name="bell" size={22} color="#0a0a0a" />
            {stats.newInquiries > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0a0a0a"]}
              tintColor="#0a0a0a"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.attendanceToday}%</Text>
              <Text style={styles.statLabel}>Present Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completionRate}%</Text>
              <Text style={styles.statLabel}>ID Complete</Text>
            </View>
          </View>

          {/* Pending Tasks */}
          {(stats.pending > 0 || stats.pendingResults > 0) && (
            <View style={styles.taskSection}>
              <Text style={styles.sectionTitle}>Pending</Text>

              {stats.pending > 0 && (
                <TouchableOpacity
                  style={styles.taskItem}
                  onPress={() => router.push("/(school)/ManageStudents")}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskLeft}>
                    <View
                      style={[styles.taskIcon, { backgroundColor: "#fee2e2" }]}
                    >
                      <Feather name="user-check" size={18} color="#dc2626" />
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>Student Verification</Text>
                      <Text style={styles.taskDescription}>
                        {stats.pending} profile{stats.pending > 1 ? "s" : ""}{" "}
                        awaiting review
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#999999" />
                </TouchableOpacity>
              )}

              {stats.pendingResults > 0 && (
                <TouchableOpacity
                  style={styles.taskItem}
                  onPress={() => router.push("/(school)/ManageResults")}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskLeft}>
                    <View
                      style={[styles.taskIcon, { backgroundColor: "#fef3c7" }]}
                    >
                      <Feather name="file-text" size={18} color="#d97706" />
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>Result Upload</Text>
                      <Text style={styles.taskDescription}>
                        {stats.pendingResults} result
                        {stats.pendingResults > 1 ? "s" : ""} pending upload
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#999999" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Quick Access */}
          <View style={styles.moduleSection}>
            <Text style={styles.sectionTitle}>Manage</Text>
            <View style={styles.grid}>
              {[
                {
                  title: "Students",
                  icon: "users",
                  route: "/(school)/ManageStudents",
                },
                {
                  title: "Staff",
                  icon: "user",
                  route: "/(school)/ManageStaff",
                },
                {
                  title: "Attendance",
                  icon: "calendar",
                  route: "/(school)/Attendance",
                },
                {
                  title: "LMS",
                  icon: "book-open",
                  route: "/(school)/LMSPortal",
                },
                {
                  title: "Notices",
                  icon: "volume-2",
                  route: "/(school)/NoticeBoard",
                },
                {
                  title: "Results",
                  icon: "file-text",
                  route: "/(school)/ManageResults",
                },
                {
                  title: "Admit Cards",
                  icon: "credit-card",
                  route: "/(school)/ManageAdmitCards",
                },
                {
                  title: "ID Designer",
                  icon: "edit-3",
                  route: "/(school)/TemplateDesigner",
                },
                {
                  title: "Find Shop",
                  icon: "shopping-bag",
                  route: "/(school)/FindShop",
                },
              ].map((item, i) => (
                <Animated.View
                  key={item.title}
                  entering={FadeInUp.duration(400).delay(i * 40)}
                >
                  <TouchableOpacity
                    style={styles.moduleCard}
                    onPress={() => router.push(item.route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleIcon}>
                      <Feather name={item.icon} size={24} color="#0a0a0a" />
                    </View>
                    <Text style={styles.moduleText}>{item.title}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  schoolInfo: {
    marginLeft: 14,
    flex: 1,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0a0a0a",
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "400",
    letterSpacing: -0.1,
  },
  notification: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  scrollContent: {
    padding: 24,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "600",
    color: "#0a0a0a",
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "400",
    letterSpacing: -0.1,
    textAlign: "center",
  },

  taskSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0a0a0a",
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0a0a0a",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "400",
    letterSpacing: -0.1,
  },

  moduleSection: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  moduleCard: {
    width: (width - 48 - GAP * 2) / 3,
    aspectRatio: 1,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  moduleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0a0a0a",
    letterSpacing: -0.2,
    textAlign: "center",
  },
});

export default SchoolDashboard;
