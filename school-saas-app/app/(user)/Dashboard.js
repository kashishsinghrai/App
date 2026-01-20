import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const UserDashboard = () => {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. SEARCH HEADER */}
      <View style={styles.header}>
        <Text style={styles.welcomeTxt}>Find your future,</Text>
        <Text style={styles.brandTxt}>EduConnect Discovery</Text>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/(user)/SchoolDiscovery")}
        >
          <Ionicons name="search" size={20} color="#6366f1" />
          <Text style={styles.searchPlaceholder}>
            Search Schools, Colleges, or Coaching...
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 2. CATEGORIES GRID */}
        <View style={styles.catGrid}>
          <CategoryCard
            title="Schools"
            icon="school"
            color="#6366f1"
            onPress={() => router.push("/(user)/SchoolDiscovery")}
          />
          <CategoryCard
            title="Courses"
            icon="book-open"
            color="#ec4899"
            onPress={() => router.push("/(user)/OpenCourses")}
          />
          <CategoryCard
            title="Shops"
            icon="store"
            color="#10b981"
            onPress={() => router.push("/(user)/PublicMarketplace")}
          />
          <CategoryCard
            title="Tutors"
            icon="chalkboard-teacher"
            color="#f59e0b"
            onPress={() => {}}
          />
        </View>

        {/* 3. FEATURED SCHOOLS (Discovery UI) */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Top Institutes Nearby</Text>
          <TouchableOpacity
            onPress={() => router.push("/(user)/SchoolDiscovery")}
          >
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
        >
          <SchoolCard
            name="St. Xavier's"
            loc="Civil Lines"
            rating="4.8"
            img="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8XyH_iU4t5p3vWn5-T-1S_qE6Q"
          />
          <SchoolCard
            name="Modern Academy"
            loc="Metro Road"
            rating="4.5"
            img="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_6M_nNf_rE7Cw"
          />
        </ScrollView>

        {/* 4. OPEN SKILL COURSES (LMS Preview) */}
        <Text style={styles.sectionTitle}>Learn New Skills (Free)</Text>
        <View style={styles.courseBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle}>Digital Marketing 101</Text>
            <Text style={styles.courseSub}>By Master Academy • 12 Lessons</Text>
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => router.push("/(user)/OpenCourses")}
            >
              <Text style={styles.enrollTxt}>Start Learning</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/1995/1995531.png",
            }}
            style={styles.courseImg}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// Reusable Components
const CategoryCard = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={styles.catCard} onPress={onPress}>
    <View style={[styles.catIcon, { backgroundColor: color + "15" }]}>
      <FontAwesome5 name={icon} size={20} color={color} />
    </View>
    <Text style={styles.catTitle}>{title}</Text>
  </TouchableOpacity>
);

const SchoolCard = ({ name, loc, rating, img }) => (
  <TouchableOpacity style={styles.sCard}>
    <Image source={{ uri: img }} style={styles.sImg} />
    <View style={styles.sInfo}>
      <Text style={styles.sName}>{name}</Text>
      <Text style={styles.sLoc}>{loc}</Text>
      <View style={styles.rBadge}>
        <Ionicons name="star" size={10} color="#fff" />
        <Text style={styles.rTxt}>{rating}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    padding: 25,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  welcomeTxt: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  brandTxt: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginTop: 5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchPlaceholder: {
    marginLeft: 12,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },

  content: { padding: 20 },
  catGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  catCard: { width: (width - 70) / 4, alignItems: "center" },
  catIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  catTitle: { fontSize: 11, fontWeight: "700", color: "#475569" },

  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 15,
  },
  viewAll: { color: "#6366f1", fontSize: 12, fontWeight: "700" },

  horizontalList: { marginBottom: 30 },
  sCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 25,
    marginRight: 15,
    overflow: "hidden",
    elevation: 3,
    shadowOpacity: 0.05,
  },
  sImg: { width: "100%", height: 110 },
  sInfo: { padding: 15 },
  sName: { fontWeight: "800", color: "#1e293b", fontSize: 15 },
  sLoc: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  rBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  rTxt: { color: "#fff", fontSize: 10, fontWeight: "bold", marginLeft: 3 },

  courseBanner: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  courseTitle: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  courseSub: { fontSize: 11, color: "#64748b", marginTop: 4 },
  enrollBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  enrollTxt: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  courseImg: { width: 80, height: 80 },
});

export default UserDashboard;
