// app/(school)/Settings.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

const Settings = () => {
  const { user, logout, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
    logo: "",
  });

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data } = await apiClient.get(`/school/profile/${user.id}`);

        setForm({
          name: data.name || "",
          email: data.email || "",
          contactNumber: data.contactNumber || "",
          address: data.address || "",
          logo: data.logo || "",
        });
      } catch (err) {
        console.log("Settings load error:", err);
        Alert.alert("Connection Issue", "Couldn't load school profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // Request media library permission once on mount
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photos to update the school logo."
        );
      }
    })();
  }, []);

  const pickAndUploadLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      // Compress image before upload (good practice)
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      setSaving(true);

      const formData = new FormData();
      formData.append("logo", {
        uri: compressed.uri,
        name: `school-logo-${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const res = await apiClient.put(
        `/school/update-logo/${user.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newLogo = res.data.logo;
      setForm((prev) => ({ ...prev, logo: newLogo }));
      updateUser({ logo: newLogo });

      Alert.alert("Success", "School logo updated successfully.");
    } catch (err) {
      console.log("Logo upload failed:", err);
      Alert.alert(
        "Upload Failed",
        "Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      return Alert.alert(
        "Required Fields",
        "School Name and Email are mandatory."
      );
    }

    setSaving(true);
    try {
      const { data } = await apiClient.put(`/school/profile/${user.id}`, form);
      updateUser(data.school || data);
      Alert.alert("Saved", "School profile updated successfully.");
    } catch (err) {
      Alert.alert("Save Failed", "Couldn't update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const avatarUri = form.logo
    ? {
        uri: form.logo.startsWith("http")
          ? form.logo
          : `http://10.0.2.2:5000${form.logo}`,
      }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          form.name || "School"
        )}&background=4f46e5&color=fff`,
      };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading school profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInUp.duration(600)}>
              {/* Profile Header */}
              <View style={styles.headerSection}>
                <View style={styles.avatarContainer}>
                  <Image source={avatarUri} style={styles.avatar} />
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={pickAndUploadLogo}
                    disabled={saving}
                  >
                    <Feather name="camera" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.schoolTitle} numberOfLines={1}>
                  {form.name || "Your School"}
                </Text>

                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#4f46e5" />
                  <Text style={styles.verifiedText}>Verified Institution</Text>
                </View>
              </View>

              {/* Main Information */}
              <Text style={styles.sectionHeader}>School Information</Text>
              <View style={styles.formCard}>
                <InputField
                  label="School / Institute Name"
                  icon="home"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Official school name"
                />

                <InputField
                  label="Admin Email"
                  icon="mail"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="admin@school.edu.in"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <InputField
                  label="Contact Number"
                  icon="phone"
                  value={form.contactNumber}
                  onChange={(v) => setForm({ ...form, contactNumber: v })}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                />

                <InputField
                  label="School Address"
                  icon="map-pin"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  placeholder="Full address with pin code"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Security & Subscription Section */}
              <Text style={styles.sectionHeader}>Security & Subscription</Text>
              <View style={styles.formCard}>
                <ActionItem
                  icon="security" // ← valid MaterialIcons name
                  label="Change Password / 2FA"
                  color="#6366f1"
                  onPress={() =>
                    Alert.alert(
                      "Coming Soon",
                      "Password management will be available soon."
                    )
                  }
                />
                <ActionItem
                  icon="receipt-long" // ← valid and more suitable
                  label="View Invoices & Plan"
                  color="#059669"
                  onPress={() =>
                    Alert.alert(
                      "Subscription",
                      "Contact support for plan details."
                    )
                  }
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>Sign Out</Text>
                <Feather name="log-out" size={18} color="#ef4444" />
              </TouchableOpacity>

              <View style={{ height: 80 }} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ────────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────────

const InputField = ({ label, icon, value, onChange, ...props }) => (
  <View style={styles.inputWrapper}>
    <View style={styles.inputLabelRow}>
      <Feather name={icon} size={16} color="#4f46e5" />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  </View>
);

const ActionItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionText}>{label}</Text>
    <Feather name="chevron-right" size={18} color="#d1d5db" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6b7280", fontSize: 15 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  headerSection: { alignItems: "center", marginBottom: 32 },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4f46e5",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  schoolTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: "#0369a1",
    fontWeight: "600",
    marginLeft: 6,
  },

  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    marginTop: 8,
  },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
    overflow: "hidden",
  },
  inputWrapper: { padding: 16 },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
    marginLeft: 8,
  },
  input: {
    fontSize: 16,
    color: "#111827",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionText: { flex: 1, fontSize: 15, color: "#374151", fontWeight: "500" },

  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: { color: "#dc2626", fontSize: 15, fontWeight: "600" },
});

export default Settings;
