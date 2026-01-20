import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

// Canvas dimensions
const CANVAS_WIDTH = Math.min(width - 48, 400);
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.4;

const TemplateDesigner = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const photoX = useSharedValue(0.1 * CANVAS_WIDTH);
  const photoY = useSharedValue(0.1 * CANVAS_HEIGHT);
  const nameX = useSharedValue(0.1 * CANVAS_WIDTH);
  const nameY = useSharedValue(0.5 * CANVAS_HEIGHT);
  const qrX = useSharedValue(0.7 * CANVAS_WIDTH);
  const qrY = useSharedValue(0.8 * CANVAS_HEIGHT);

  const fetchTemplate = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiClient.get(`/school/profile/${user.id}`);
      const template = res.data?.idCardTemplate;

      if (template) {
        if (template.backgroundImage) {
          setBgImage(template.backgroundImage);
        }
        if (template.config) {
          photoX.value = (template.config.photo?.x || 0.1) * CANVAS_WIDTH;
          photoY.value = (template.config.photo?.y || 0.1) * CANVAS_HEIGHT;
          nameX.value = (template.config.name?.x || 0.1) * CANVAS_WIDTH;
          nameY.value = (template.config.name?.y || 0.5) * CANVAS_HEIGHT;
          qrX.value = (template.config.qrCode?.x || 0.7) * CANVAS_WIDTH;
          qrY.value = (template.config.qrCode?.y || 0.8) * CANVAS_HEIGHT;
        }
      }
    } catch (err) {
      console.error("Template fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchTemplate();
    }
  }, [fetchTemplate, user?.id]);

  const pickDesign = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setBgImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const saveTemplate = async () => {
    if (!bgImage) {
      Alert.alert("Background Required", "Please upload a background image.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();

      const config = {
        photo: {
          x: photoX.value / CANVAS_WIDTH,
          y: photoY.value / CANVAS_HEIGHT,
        },
        name: {
          x: nameX.value / CANVAS_WIDTH,
          y: nameY.value / CANVAS_HEIGHT,
        },
        qrCode: {
          x: qrX.value / CANVAS_WIDTH,
          y: qrY.value / CANVAS_HEIGHT,
        },
      };

      formData.append("config", JSON.stringify(config));

      if (bgImage && !bgImage.startsWith("http")) {
        formData.append("backgroundImage", {
          uri: bgImage,
          name: "id_frame.jpg",
          type: "image/jpeg",
        });
      }

      await apiClient.put(`/school/template/update/${user.id}`, formData);
      Alert.alert("Success", "Template saved successfully");
      router.back();
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-back" size={24} color="#202124" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>ID Card Designer</Text>

          <TouchableOpacity
            onPress={saveTemplate}
            style={[styles.headerButton, saving && styles.headerButtonDisabled]}
            activeOpacity={0.6}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#1a73e8" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.instructions}>
            Drag elements to position them on your ID card
          </Text>

          {/* Canvas */}
          <View style={styles.canvasContainer}>
            <View
              style={[
                styles.canvas,
                { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
              ]}
            >
              <ImageBackground
                source={bgImage ? { uri: bgImage } : null}
                style={styles.canvasBg}
                resizeMode="cover"
              >
                {!bgImage ? (
                  <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={pickDesign}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadIcon}>
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color="#5f6368"
                      />
                    </View>
                    <Text style={styles.uploadText}>Upload Background</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <DraggableItem
                      translateX={photoX}
                      translateY={photoY}
                      label="Photo"
                      icon="person-outline"
                    />
                    <DraggableItem
                      translateX={nameX}
                      translateY={nameY}
                      label="Name"
                      icon="text-outline"
                    />
                    <DraggableItem
                      translateX={qrX}
                      translateY={qrY}
                      label="QR Code"
                      icon="qr-code-outline"
                    />
                  </>
                )}
              </ImageBackground>
            </View>
          </View>

          {/* Change Background Button */}
          {bgImage && (
            <TouchableOpacity
              style={styles.changeButton}
              onPress={pickDesign}
              activeOpacity={0.6}
            >
              <Feather name="image" size={16} color="#5f6368" />
              <Text style={styles.changeButtonText}>Change Background</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Draggable Item Component
const DraggableItem = ({ translateX, translateY, label, icon }) => {
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      let newX = contextX.value + event.translationX;
      let newY = contextY.value + event.translationY;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - 80));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - 32));

      translateX.value = newX;
      translateY.value = newY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.draggable, animatedStyle]}>
        <Ionicons name={icon} size={14} color="#1a73e8" />
        <Text style={styles.draggableText}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#202124",
    letterSpacing: -0.2,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a73e8",
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  instructions: {
    fontSize: 13,
    color: "#5f6368",
    marginBottom: 32,
    textAlign: "center",
  },

  // Canvas
  canvasContainer: {
    alignItems: "center",
  },
  canvas: {
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dadce0",
  },
  canvasBg: {
    flex: 1,
  },

  // Upload Area
  uploadArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f3f4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 14,
    color: "#5f6368",
    fontWeight: "500",
  },

  // Draggable Items
  draggable: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a73e8",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  draggableText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#202124",
  },

  // Change Button
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dadce0",
    gap: 8,
  },
  changeButtonText: {
    fontSize: 13,
    color: "#5f6368",
    fontWeight: "500",
  },
});

export default TemplateDesigner;
