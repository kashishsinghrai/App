import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "@educonnect_onboarding_completed";

const SLIDES = [
  {
    id: "1",
    title: "One Platform,\nEvery Role",
    description:
      "Unite schools, vendors, and students in a seamless digital ecosystem.",
    icon: "grid",
  },
  {
    id: "2",
    title: "Instant\nConnection",
    description:
      "Bridge institutions and service providers with zero friction.",
    icon: "zap",
  },
  {
    id: "3",
    title: "Students\nFirst",
    description:
      "Digital credentials, results, and resources at their fingertips.",
    icon: "heart",
  },
];

const ROLES = [
  {
    id: "school",
    icon: "briefcase",
    label: "School Admin",
    description: "Manage your institution",
  },
  {
    id: "shop",
    icon: "package",
    label: "Vendor",
    description: "Offer your services",
  },
  {
    id: "student",
    icon: "book",
    label: "Student",
    description: "Access your resources",
  },
  {
    id: "user",
    icon: "compass",
    label: "Explorer",
    description: "Discover the platform",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState("onboarding");
  const flatListRef = useRef(null);
  const router = useRouter();

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.log("Error saving onboarding:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setView("roles");
    }
  };

  const handleDotPress = (index) => {
    flatListRef.current?.scrollToIndex({ index });
    setCurrentIndex(index);
  };

  const handleSkip = () => {
    setView("roles");
  };

  const handleRoleSelect = async (roleId) => {
    await completeOnboarding();
    router.push({ pathname: "/login", params: { role: roleId } });
  };

  const handleBack = () => {
    setView("onboarding");
  };

  if (view === "roles") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View style={styles.roleHeader}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.6}
          >
            <Feather name="arrow-left" size={22} color="#0a0a0a" />
          </TouchableOpacity>
        </View>

        <View style={styles.roleContent}>
          <View style={styles.roleTitleSection}>
            <Text style={styles.roleTitle}>Choose your role</Text>
            <Text style={styles.roleSubtitle}>
              Select how you'll be using EduConnect
            </Text>
          </View>

          <View style={styles.roleCards}>
            {ROLES.map((role, index) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  index === ROLES.length - 1 && styles.roleCardLast,
                ]}
                onPress={() => handleRoleSelect(role.id)}
                activeOpacity={0.7}
              >
                <View style={styles.roleCardContent}>
                  <View style={styles.roleIconContainer}>
                    <Feather name={role.icon} size={22} color="#0a0a0a" />
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleDesc}>{role.description}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#999999" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
        </View>
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slidesContainer}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.slideContent}>
                <View style={styles.iconWrapper}>
                  <Feather name={item.icon} size={40} color="#0a0a0a" />
                </View>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          {currentIndex + 1} of {SLIDES.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0a0a0a",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#666666",
    letterSpacing: -0.2,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  slideTitle: {
    fontSize: 40,
    fontWeight: "600",
    color: "#0a0a0a",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  slideDescription: {
    fontSize: 17,
    color: "#666666",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: "center",
    gap: 24,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: "#0a0a0a",
  },
  continueButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#0a0a0a",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  footerHint: {
    fontSize: 13,
    color: "#999999",
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  roleHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  roleContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  roleTitleSection: {
    marginBottom: 40,
  },
  roleTitle: {
    fontSize: 38,
    fontWeight: "600",
    color: "#0a0a0a",
    marginBottom: 12,
    letterSpacing: -1.4,
    lineHeight: 44,
  },
  roleSubtitle: {
    fontSize: 17,
    color: "#666666",
    fontWeight: "400",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  roleCards: {
    gap: 0,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  roleCardLast: {
    borderBottomWidth: 0,
  },
  roleCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: "500",
    color: "#0a0a0a",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  roleDesc: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "400",
    letterSpacing: -0.1,
  },
});
