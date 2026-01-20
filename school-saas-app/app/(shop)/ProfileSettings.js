import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    address: "",
    services: [],
    shopImage: null,
    status: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/profile/${user.id}`);
      const data = res.data;

      setFormData({
        name: data.name || "",
        contactNumber: data.contactNumber || "",
        address: data.address || "",
        services: data.services || [],
        shopImage: data.shopImage || null,
        status: data.status || "Verified",
      });
    } catch (err) {
      console.error("Fetch Error:", err.message);
      Alert.alert("Sync Failed", "Could not load your business records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6,
    });

    if (!result.canceled) {
      uploadShopPhoto(result.assets[0]);
    }
  };

  const uploadShopPhoto = async (asset) => {
    setSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append("shopImage", {
        uri: asset.uri,
        name: "vendor_logo.jpg",
        type: "image/jpeg",
      });

      const res = await apiClient.put(
        `/shop/update-photo/${user.id}`,
        uploadData,
      );
      setFormData({ ...formData, shopImage: res.data.shopImage });
      Alert.alert("Success", "Business logo updated.");
    } catch (err) {
      Alert.alert("Upload Error", "Failed to sync image with cloud.");
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (formData.services.includes(trimmed)) return;
    setFormData({ ...formData, services: [...formData.services, trimmed] });
    setNewService("");
  };

  const removeService = (index) => {
    const updated = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/shop/profile/${user.id}`, formData);
      updateUser(res.data.shop);
      Alert.alert("Success", "Your profile has been updated.");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Could not save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile Settings</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
          >
            <Animated.View entering={FadeInUp.duration(600)}>
              {/* Business Image */}
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={pickImage}
                  disabled={saving}
                >
                  {formData.shopImage ? (
                    <Image
                      source={{
                        uri: formData.shopImage.startsWith("/")
                          ? `http://10.0.2.2:5000${formData.shopImage}`
                          : formData.shopImage,
                      }}
                      style={styles.businessImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Feather name="image" size={32} color="#999" />
                      <Text style={styles.placeholderText}>
                        Add cover photo
                      </Text>
                    </View>
                  )}
                  <View style={styles.editIcon}>
                    <Feather name="edit-2" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>

                {formData.status && (
                  <View style={styles.verificationBadge}>
                    <Feather name="check-circle" size={14} color="#000" />
                    <Text style={styles.verificationText}>
                      {formData.status} Merchant
                    </Text>
                  </View>
                )}
              </View>

              {/* Business Details */}
              <Text style={styles.sectionTitle}>Business Details</Text>
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(v) => setFormData({ ...formData, name: v })}
                    placeholder="Enter business name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.contactNumber}
                    keyboardType="phone-pad"
                    onChangeText={(v) =>
                      setFormData({ ...formData, contactNumber: v })
                    }
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    multiline
                    numberOfLines={3}
                    onChangeText={(v) =>
                      setFormData({ ...formData, address: v })
                    }
                    placeholder="Enter full address"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Services */}
              <Text style={styles.sectionTitle}>Services Offered</Text>
              <View style={styles.card}>
                <View style={styles.serviceInputRow}>
                  <TextInput
                    style={styles.serviceInput}
                    value={newService}
                    onChangeText={setNewService}
                    placeholder="Add a service (e.g., PVC Printing)"
                    placeholderTextColor="#999"
                    onSubmitEditing={addService}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addService}
                  >
                    <Feather name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {formData.services.length > 0 ? (
                  <View style={styles.servicesContainer}>
                    {formData.services.map((service, index) => (
                      <View key={index} style={styles.serviceChip}>
                        <Text style={styles.serviceChipText}>{service}</Text>
                        <TouchableOpacity onPress={() => removeService(index)}>
                          <Feather name="x" size={14} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyServicesText}>
                    No services added yet
                  </Text>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveMainButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveMainButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  saveButton: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Image Section
  imageSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  imageContainer: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    position: "relative",
  },
  businessImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
  },
  editIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  verificationText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },

  // Services
  serviceInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  serviceInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  serviceChipText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
  emptyServicesText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },

  // Save Button
  saveMainButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveMainButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ProfileSettings;
