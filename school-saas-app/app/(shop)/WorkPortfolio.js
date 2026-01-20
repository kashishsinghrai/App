import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

const WorkPortfolio = () => {
  const { user } = useAuth();

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/profile/${user.id}`);
      setSamples(res.data.portfolio || []);
    } catch (err) {
      console.error("Portfolio Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleAddSample = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert(
        "Permission Required",
        "Allow access to upload photos.",
      );

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0]);
    }
  };

  const uploadFile = async (asset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("portfolioImage", {
        uri: asset.uri,
        name: `sample_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      formData.append("title", "New Work Sample");

      await apiClient.post(`/shop/portfolio/upload/${user.id}`, formData);

      Alert.alert("Success", "Your work sample has been uploaded.");
      fetchPortfolio();
    } catch (err) {
      Alert.alert("Upload Failed", "Could not sync image with cloud storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (sampleId) => {
    Alert.alert("Delete Sample", "Remove this work from your portfolio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/shop/portfolio/${user.id}/${sampleId}`);
            setSamples((prev) => prev.filter((s) => s._id !== sampleId));
          } catch (err) {
            Alert.alert("Error", "Could not delete file from server.");
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const renderSample = ({ item, index }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(600)}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        <Image
          source={{
            uri: item.imageUrl.startsWith("/")
              ? `http://10.0.2.2:5000${item.imageUrl}`
              : item.imageUrl,
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
          >
            <Feather name="trash-2" size={14} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Portfolio</Text>
            <Text style={styles.headerSubtitle}>
              {samples.length} {samples.length === 1 ? "sample" : "samples"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleAddSample}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="plus" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            numColumns={2}
            data={samples}
            renderItem={renderSample}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="image" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No samples yet</Text>
                <Text style={styles.emptySubtext}>
                  Upload your best work to showcase your skills
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddSample}
                >
                  <Text style={styles.emptyButtonText}>Add Sample</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  uploadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#e0e0e0",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
    marginRight: 8,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default WorkPortfolio;
