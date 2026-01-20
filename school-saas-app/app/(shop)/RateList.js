import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const RateList = () => {
  const { user } = useAuth();

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceName: "",
    standardPrice: "",
    bulkPrice: "",
    unit: "pc",
  });

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/profile/${user.id}`);
      setRates(res.data.rateList || []);
    } catch (err) {
      console.error("Rate Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const handleAddService = async () => {
    if (!form.serviceName || !form.standardPrice) {
      return Alert.alert(
        "Required",
        "Please provide service name and standard price.",
      );
    }

    setSubmitting(true);
    try {
      const res = await apiClient.put(`/shop/profile/${user.id}`, {
        rateList: [...rates, form],
      });

      setRates(res.data.shop.rateList);
      setModalVisible(false);
      setForm({
        serviceName: "",
        standardPrice: "",
        bulkPrice: "",
        unit: "pc",
      });
      Alert.alert("Success", "Rate list updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to sync pricing with cloud.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Service", "Remove this from your rate list?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedRates = rates.filter((r) => r._id !== id);
            await apiClient.put(`/shop/profile/${user.id}`, {
              rateList: updatedRates,
            });
            setRates(updatedRates);
          } catch (err) {
            Alert.alert("Error", "Operation failed.");
          }
        },
      },
    ]);
  };

  const renderRateItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(600)}>
      <View style={styles.rateCard}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceIcon}>
            <Feather name="tag" size={18} color="#000" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.serviceUnit}>per {item.unit}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item._id)}>
            <Feather name="trash-2" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Standard</Text>
            <Text style={styles.priceValue}>₹{item.standardPrice}</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Bulk</Text>
            <Text style={styles.priceValue}>
              ₹{item.bulkPrice || item.standardPrice}
            </Text>
          </View>
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
            <Text style={styles.headerTitle}>Rate List</Text>
            <Text style={styles.headerSubtitle}>
              {rates.length} {rates.length === 1 ? "service" : "services"}{" "}
              listed
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Feather name="refresh-cw" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Main List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={rates}
            renderItem={renderRateItem}
            keyExtractor={(item) => item._id || Math.random().toString()}
            contentContainerStyle={styles.listContent}
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
                <Feather name="tag" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No services listed</Text>
                <Text style={styles.emptySubtext}>
                  Add your first service to start managing rates
                </Text>
              </View>
            }
          />
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Add Service Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboard}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Service</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Service name (e.g., PVC ID Card)"
                    placeholderTextColor="#999"
                    value={form.serviceName}
                    onChangeText={(t) => setForm({ ...form, serviceName: t })}
                  />

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, styles.inputHalf]}
                      placeholder="Standard price (₹)"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={form.standardPrice}
                      onChangeText={(t) =>
                        setForm({ ...form, standardPrice: t })
                      }
                    />
                    <TextInput
                      style={[styles.input, styles.inputHalf]}
                      placeholder="Bulk price (₹)"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={form.bulkPrice}
                      onChangeText={(t) => setForm({ ...form, bulkPrice: t })}
                    />
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Unit (e.g., pc, set)"
                    placeholderTextColor="#999"
                    value={form.unit}
                    onChangeText={(t) => setForm({ ...form, unit: t })}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddService}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add Service</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 150,
  },
  rateCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceDetails: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  serviceUnit: {
    fontSize: 12,
    color: "#666",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceItem: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  priceDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },

  // Add Button
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
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
    paddingHorizontal: 40,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboard: {
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  formContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#000",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default RateList;
