import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const LocalBusinessLedger = () => {
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    work: "",
    amount: "",
    paid: "",
  });

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/ledger/${user.id}`);
      setEntries(res.data || []);
    } catch (err) {
      console.error("Ledger Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const addNewEntry = async () => {
    if (!form.name || !form.amount)
      return Alert.alert("Required", "Please enter Customer Name and Amount.");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        shopId: user.id,
        amount: Number(form.amount),
        paid: Number(form.paid || 0),
        status:
          Number(form.paid) >= Number(form.amount)
            ? "Paid"
            : Number(form.paid) > 0
              ? "Partial"
              : "Unpaid",
      };

      const res = await apiClient.post("/shop/ledger/add", payload);
      setEntries([res.data.entry, ...entries]);
      setModalVisible(false);
      setForm({ name: "", phone: "", work: "", amount: "", paid: "" });
      Alert.alert("Saved", "Record added to your ledger.");
    } catch (err) {
      Alert.alert("Error", "Failed to save entry. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReminder = (item) => {
    const balance = item.amount - item.paid;
    const message = `Hi ${item.name}, this is a reminder from ${user.name} regarding your pending payment of ₹${balance} for "${item.work}". Kindly settle at your earliest. Thanks!`;
    Linking.openURL(`whatsapp://send?phone=91${item.phone}&text=${message}`);
  };

  const totals = useMemo(() => {
    let earned = 0;
    let pending = 0;
    entries.forEach((e) => {
      earned += Number(e.paid);
      pending += Number(e.amount) - Number(e.paid);
    });
    return { earned, pending };
  }, [entries]);

  const filteredData = useMemo(() => {
    return entries.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search);
      const matchesFilter = filter === "All" ? true : item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(600)}>
      <View style={styles.entryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.workText}>{item.work}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "Paid"
                    ? "#f5f5f5"
                    : item.status === "Partial"
                      ? "#fff3e0"
                      : "#ffebee",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === "Paid"
                      ? "#000"
                      : item.status === "Partial"
                        ? "#f57c00"
                        : "#d32f2f",
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.amountRow}>
            <AmountColumn label="Total" value={`₹${item.amount}`} />
            <AmountColumn label="Paid" value={`₹${item.paid}`} />
            <AmountColumn
              label="Balance"
              value={`₹${item.amount - item.paid}`}
              highlight={item.amount - item.paid > 0}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt || Date.now()).toLocaleDateString("en-GB")}{" "}
            • {item.phone}
          </Text>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => sendReminder(item)}
          >
            <Feather name="message-circle" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Business Ledger</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Collection</Text>
              <Text style={styles.summaryValue}>
                ₹{totals.earned.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, styles.summaryValueDanger]}>
                ₹{totals.pending.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {["All", "Paid", "Unpaid", "Partial"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  filter === f && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ledger List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item._id || item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="book" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No entries found</Text>
                <Text style={styles.emptySubtext}>
                  {filter !== "All"
                    ? `No ${filter.toLowerCase()} entries`
                    : "Add your first entry to get started"}
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

        {/* Add Entry Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboard}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Entry</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.formContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Customer name"
                      placeholderTextColor="#999"
                      value={form.name}
                      onChangeText={(t) => setForm({ ...form, name: t })}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone number"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={form.phone}
                      onChangeText={(t) => setForm({ ...form, phone: t })}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Work description"
                      placeholderTextColor="#999"
                      value={form.work}
                      onChangeText={(t) => setForm({ ...form, work: t })}
                    />
                    <View style={styles.amountRow}>
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="Total amount (₹)"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={form.amount}
                        onChangeText={(t) => setForm({ ...form, amount: t })}
                      />
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="Paid amount (₹)"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={form.paid}
                        onChangeText={(t) => setForm({ ...form, paid: t })}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={addNewEntry}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>Save Entry</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const AmountColumn = ({ label, value, highlight }) => (
  <View style={styles.amountColumn}>
    <Text style={styles.amountLabel}>{label}</Text>
    <Text
      style={[styles.amountValue, highlight && styles.amountValueHighlight]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  summaryValueDanger: {
    color: "#d32f2f",
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  filterChips: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#000",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  entryCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  workText: {
    fontSize: 13,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountColumn: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  amountValueHighlight: {
    color: "#d32f2f",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  whatsappButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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
    maxHeight: "90%",
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
  inputHalf: {
    flex: 1,
    marginRight: 8,
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
  },
});

export default LocalBusinessLedger;
