import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
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
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width, height } = Dimensions.get("window");

// Canvas proportions optimized for ID Card standard (2:3)
const CANVAS_WIDTH = width - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.4;

const TemplateDesigner = () => {
  const router = useRouter();
  const { user } = useAuth();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bgImage, setBgImage] = useState(null); // Cloud URL or local URI

  // --- Shared Values for Positioning (Ratios 0.0 - 1.0) ---
  const photoX = useSharedValue(0.1);
  const photoY = useSharedValue(0.1);
  const nameX = useSharedValue(0.1);
  const nameY = useSharedValue(0.5);
  const qrX = useSharedValue(0.7);
  const qrY = useSharedValue(0.8);

  /**
   * 1. LOAD EXISTING TEMPLATE
   * Syncs with MongoDB Atlas to restore previous mappings
   */
  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/school/profile/${user.id}`);
      const template = res.data.idCardTemplate;

      if (template) {
        setBgImage(template.backgroundImage);
        // Convert ratios back to pixels for the UI display
        photoX.value = template.config.photo.x * CANVAS_WIDTH;
        photoY.value = template.config.photo.y * CANVAS_HEIGHT;
        nameX.value = template.config.name.x * CANVAS_WIDTH;
        nameY.value = template.config.name.y * CANVAS_HEIGHT;
        qrX.value = template.config.qrCode.x * CANVAS_WIDTH;
        qrY.value = template.config.qrCode.y * CANVAS_HEIGHT;
      }
    } catch (err) {
      console.error("Template Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  /**
   * 2. PICK & UPLOAD FRAME
   */
  const pickDesign = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setBgImage(result.assets[0].uri);
    }
  };

  /**
   * 3. SAVE LOGIC
   * Converts pixels to ratios and pushes to the cloud
   */
  const saveTemplate = async () => {
    if (!bgImage)
      return Alert.alert("Required", "Please upload a background frame first.");

    setSaving(true);
    try {
      const formData = new FormData();

      // Coordinate Data (Ratios for backend PDF scaling)
      const config = {
        photo: {
          x: photoX.value / CANVAS_WIDTH,
          y: photoY.value / CANVAS_HEIGHT,
        },
        name: { x: nameX.value / CANVAS_WIDTH, y: nameY.value / CANVAS_HEIGHT },
        qrCode: { x: qrX.value / CANVAS_WIDTH, y: qrY.value / CANVAS_HEIGHT },
      };

      formData.append("config", JSON.stringify(config));

      // Append image only if it's a new local pick
      if (bgImage && !bgImage.startsWith("http")) {
        formData.append("backgroundImage", {
          uri: bgImage,
          name: "id_frame.jpg",
          type: "image/jpeg",
        });
      }

      await apiClient.put(`/school/template/update/${user.id}`, formData);

      Alert.alert(
        "Success ✨",
        "Template mapping synchronized with cloud storage."
      );
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to save template. Check network connection."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Ambient Mesh Background */}
        <LinearGradient
          colors={["#f8fafc", "#eef2ff", "#fdf2f8"]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* TOOLBAR */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.toolbarTitle}>ID Card Designer</Text>
            <TouchableOpacity
              onPress={saveTemplate}
              style={styles.saveAction}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <Text style={styles.hint}>
              Drag elements to their intended print positions
            </Text>

            {/* THE CANVAS */}
            <BlurView
              intensity={20}
              tint="light"
              style={[
                styles.canvasFrame,
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
                    style={styles.uploadPlaceholder}
                    onPress={pickDesign}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={50}
                      color="#cbd5e1"
                    />
                    <Text style={styles.uploadLabel}>Upload Base Frame</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <DraggableItem
                      translateX={photoX}
                      translateY={photoY}
                      label="PORTRAIT"
                      color="#4f46e5"
                      icon="user"
                    />
                    <DraggableItem
                      translateX={nameX}
                      translateY={nameY}
                      label="NAME FIELD"
                      color="#1e293b"
                      icon="font"
                    />
                    <DraggableItem
                      translateX={qrX}
                      translateY={qrY}
                      label="SECURITY QR"
                      color="#059669"
                      icon="qrcode"
                    />
                  </>
                )}
              </ImageBackground>
            </BlurView>

            <TouchableOpacity style={styles.changeBtn} onPress={pickDesign}>
              <Feather name="refresh-cw" size={16} color="#64748b" />
              <Text style={styles.changeBtnText}>Change Background Frame</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
};

/**
 * DRAGGABLE ELEMENT COMPONENT
 * Logic: Restricted within canvas bounds
 */
const DraggableItem = ({ translateX, translateY, label, color, icon }) => {
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Logic to keep items inside the canvas
      let newX = contextX.value + event.translationX;
      let newY = contextY.value + event.translationY;

      // Bounds Checking
      if (newX < 0) newX = 0;
      if (newX > CANVAS_WIDTH - 90) newX = CANVAS_WIDTH - 90;
      if (newY < 0) newY = 0;
      if (newY > CANVAS_HEIGHT - 40) newY = CANVAS_HEIGHT - 40;

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
      <Animated.View
        style={[styles.dragBox, animatedStyle, { borderColor: color }]}
      >
        <View style={[styles.dragHandle, { backgroundColor: color }]}>
          <FontAwesome5 name={icon} size={10} color="#fff" />
        </View>
        <Text style={[styles.dragText, { color: color }]}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  closeBtn: { padding: 5 },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  saveAction: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveText: { color: "#4f46e5", fontWeight: "900", fontSize: 14 },

  scroll: { alignItems: "center", paddingVertical: 30 },
  hint: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 25,
  },

  // Canvas
  canvasFrame: {
    borderRadius: 25,
    backgroundColor: "#fff",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  canvasBg: { flex: 1 },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadLabel: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: "800",
    color: "#cbd5e1",
  },

  // Draggable
  dragBox: {
    position: "absolute",
    padding: 6,
    paddingRight: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  dragHandle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dragText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  changeBtnText: {
    marginLeft: 10,
    color: "#64748b",
    fontWeight: "800",
    fontSize: 13,
  },
});

export default TemplateDesigner;
