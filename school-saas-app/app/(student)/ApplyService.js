import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

/**
 * LIVE ID CARD APPLICATION HUB
 * Logic: Fetches real student data from Atlas, handles GridFS image uploads,
 * and locks the UI if the school has verified the data.
 */
const ApplyService = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [photo, setPhoto] = useState(null); // Local URI for preview

  // --- Form State (Syncs with Atlas) ---
  const [form, setForm] = useState({
    bloodGroup: "",
    emergencyContact: "",
    address: "",
    name: "",
    rollNo: "",
    className: "",
  });

  /**
   * 1. CLOUD SYNC: Load existing data from MongoDB Atlas
   */
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/student/profile/${user.id}`);
        const data = res.data;

        setForm({
          name: data.name || "",
          rollNo: data.rollNo || "",
          className: data.class || "",
          bloodGroup: data.bloodGroup || "",
          emergencyContact: data.emergencyContact || "",
          address: data.address || "",
        });

        setIsLocked(data.isLocked || false);

        if (data.photo) {
          // Standard streaming URL for MongoDB GridFS
          setPhoto(`http://10.0.2.2:5000${data.photo}`);
        }
      } catch (err) {
        console.error("Sync Error:", err.message);
        Alert.alert("Cloud Error", "Failed to sync identity data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user.id]);

  /**
   * 2. IMAGE HANDLER: Picks portrait photo for ID
   */
  const handlePickImage = async () => {
    if (isLocked)
      return Alert.alert("Locked", "Official data cannot be modified.");

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Portrait aspect for ID Cards
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  /**
   * 3. SUBMISSION LOGIC: Uploads to GridFS and updates MongoDB record
   */
  const handleSubmit = async () => {
    if (isLocked) return;
    if (!form.bloodGroup || !form.emergencyContact || !form.address || !photo) {
      return Alert.alert(
        "Missing Data",
        "Please complete all fields and upload a photo."
      );
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("bloodGroup", form.bloodGroup);
      formData.append("emergencyContact", form.emergencyContact);
      formData.append("address", form.address);
      formData.append("submitForVerification", "true");

      // Handle new local image upload
      if (photo && !photo.startsWith("http")) {
        const filename = photo.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append("photo", { uri: photo, name: filename, type });
      }

      const res = await apiClient.put(`/student/profile/${user.id}`, formData);

      // Update global context to reflect the new photo link immediately
      updateUser({ photo: res.data.student.photo });

      Alert.alert("Submitted! ✨", "Data sent for School Verification.", [
        {
          text: "Dashboard",
          onPress: () => router.replace("/(student)/Dashboard"),
        },
      ]);
    } catch (err) {
      Alert.alert("Error", "Submission failed. Please check your network.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* LAYER 1: MESH BACKGROUND (Removes White DX) */}
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#fdf2f8"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <Animated.View entering={FadeInUp.duration(800)}>
              {/* STATUS INDICATOR BAR */}
              <BlurView
                intensity={80}
                tint="light"
                style={[
                  styles.statusBanner,
                  { backgroundColor: isLocked ? "#d1fae5" : "#fee2e2" },
                ]}
              >
                <Ionicons
                  name={isLocked ? "shield-checkmark" : "warning"}
                  size={18}
                  color={isLocked ? "#059669" : "#ef4444"}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isLocked ? "#059669" : "#ef4444" },
                  ]}
                >
                  {isLocked
                    ? "Verified & Ready for Printing"
                    : "Pending Submission / Draft"}
                </Text>
              </BlurView>

              {/* DYNAMIC ID CARD PREVIEW (Live Updates) */}
              <Text style={styles.sectionHeader}>Identity Preview</Text>
              <BlurView
                intensity={100}
                tint="light"
                style={styles.idPreviewCard}
              >
                <View style={styles.idHeader}>
                  <Text style={styles.idSchoolName}>GLOBAL ACADEMY PORTAL</Text>
                </View>
                <View style={styles.idContent}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                    style={styles.photoContainer}
                  >
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.idImage} />
                    ) : (
                      <Feather name="camera" size={24} color="#94a3b8" />
                    )}
                    {!isLocked && (
                      <View style={styles.editBadge}>
                        <MaterialIcons name="edit" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.idInfoCol}>
                    <Text style={styles.idNameText}>
                      {form.name.toUpperCase()}
                    </Text>
                    <Text style={styles.idSubText}>Roll: {form.rollNo}</Text>
                    <Text style={styles.idSubText}>
                      Class: {form.className}
                    </Text>
                    <View style={styles.bloodChip}>
                      <Text style={styles.bloodText}>
                        {form.bloodGroup || "O+"}
                      </Text>
                    </View>
                  </View>
                </View>
              </BlurView>

              {/* FORM FIELDS */}
              <Text style={styles.sectionHeader}>Verification Details</Text>
              <BlurView intensity={90} tint="light" style={styles.formCard}>
                <FieldInput
                  label="Blood Group"
                  placeholder="e.g. B+"
                  value={form.bloodGroup}
                  onChangeText={(v) => setForm({ ...form, bloodGroup: v })}
                  editable={!isLocked}
                />

                <FieldInput
                  label="Emergency Phone"
                  placeholder="Parent/Guardian Contact"
                  keyboardType="phone-pad"
                  value={form.emergencyContact}
                  onChangeText={(v) =>
                    setForm({ ...form, emergencyContact: v })
                  }
                  editable={!isLocked}
                />

                <FieldInput
                  label="Full Address"
                  placeholder="Enter home address"
                  multiline
                  value={form.address}
                  onChangeText={(v) => setForm({ ...form, address: v })}
                  editable={!isLocked}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (submitting || isLocked) && { opacity: 0.7 },
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting || isLocked}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>
                        {isLocked
                          ? "Application Locked"
                          : "Apply for Production"}
                      </Text>
                      <Ionicons
                        name="arrow-forward-circle"
                        size={22}
                        color="#fff"
                        style={{ marginLeft: 10 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
            <View style={{ height: 120 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// Reusable Field Input
const FieldInput = ({ label, editable, ...props }) => (
  <View style={styles.inputItem}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, !editable && styles.disabledInput]}
      placeholderTextColor="#94a3b8"
      editable={editable}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  scroll: { paddingHorizontal: 22, paddingTop: 10 },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 10,
    letterSpacing: 0.5,
  },

  sectionHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: "#475569",
    marginBottom: 15,
    marginLeft: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // ID Preview Card (The High-Fidelity UI)
  idPreviewCard: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    marginBottom: 30,
    elevation: 8,
    shadowOpacity: 0.1,
  },
  idHeader: { backgroundColor: "#1e40af", padding: 12 },
  idSchoolName: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 2,
  },
  idContent: { flexDirection: "row", padding: 25, alignItems: "center" },
  photoContainer: {
    width: 95,
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  idImage: { width: "100%", height: "100%" },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#1e40af",
    padding: 4,
    borderRadius: 8,
  },
  idInfoCol: { flex: 1, marginLeft: 20 },
  idNameText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  idSubText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
    marginTop: 2,
  },
  bloodChip: {
    backgroundColor: "#fee2e2",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
  },
  bloodText: { color: "#ef4444", fontSize: 11, fontWeight: "900" },

  // Form
  formCard: {
    padding: 10,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  inputItem: { padding: 15 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  textInput: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  disabledInput: { color: "#94a3b8" },

  submitBtn: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 15,
    elevation: 10,
  },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});

export default ApplyService;
