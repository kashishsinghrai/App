import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Image,
  TextInput,
  StatusBar,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Animated, { FadeInUp } from "react-native-reanimated";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 50) / 2;

const PrintPreview = () => {
  const { schoolId, schoolName } = useLocalSearchParams();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");

  const loadLockedStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/shop/locked-students/${schoolId}`);
      setStudents(res.data);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadLockedStudents();
  }, [loadLockedStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLockedStudents();
  };

  const classList = useMemo(() => {
    const classes = students.map((s) => s.class || s.className);
    return ["All", ...new Set(classes)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const cls = s.class || s.className;
      const matchesClass = selectedClass === "All" || cls === selectedClass;
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.includes(searchQuery);
      return matchesClass && matchesSearch;
    });
  }, [students, searchQuery, selectedClass]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredStudents.map((s) => s._id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedIds.includes(id),
    );

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleExport = async (type) => {
    if (selectedIds.length === 0)
      return Alert.alert("Required", "Please select students to export.");

    setExporting(type);
    try {
      const res = await apiClient.post("/shop/export-csv", {
        studentIds: selectedIds,
      });

      const fileName = `${schoolName.replace(/\s/g, "_")}_Print_Data.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, res.data, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        "Data Ready",
        "CSV file generated for " + selectedIds.length + " students.",
        [{ text: "Share to PC", onPress: () => Sharing.shareAsync(fileUri) }],
      );
    } catch (err) {
      Alert.alert("Error", "Cloud export failed. Check server connection.");
    } finally {
      setExporting(null);
    }
  };

  const renderStudent = ({ item, index }) => {
    const isSelected = selectedIds.includes(item._id);
    return (
      <Animated.View entering={FadeInUp.delay(index * 30)}>
        <TouchableOpacity
          style={[styles.card, isSelected && styles.selectedCard]}
          onPress={() => toggleSelect(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && <Feather name="check" size={14} color="#fff" />}
            </View>
          </View>

          <Image
            source={{
              uri: item.photo
                ? `http://10.0.2.2:5000${item.photo}`
                : "https://via.placeholder.com/150",
            }}
            style={styles.photo}
            resizeMode="cover"
          />

          <Text style={styles.studentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.studentInfo}>
            {item.rollNo} • {item.class || item.className}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={20} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {schoolName}
              </Text>
              <Text style={styles.headerSubtitle}>
                {students.length} students available
              </Text>
            </View>
            {selectedIds.length > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedCount}>{selectedIds.length}</Text>
              </View>
            )}
          </View>

          {/* Search & Select All */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllText}>
                {filteredStudents.length > 0 &&
                filteredStudents.every((s) => selectedIds.includes(s._id))
                  ? "Clear"
                  : "Select all"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Class Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {classList.map((cls) => (
              <TouchableOpacity
                key={cls}
                onPress={() => setSelectedClass(cls)}
                style={[
                  styles.filterChip,
                  selectedClass === cls && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedClass === cls && styles.filterChipTextActive,
                  ]}
                >
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Export Actions */}
        {selectedIds.length > 0 && (
          <View style={styles.actionsBar}>
            <ExportButton
              icon="file"
              label="PDF"
              onPress={() => handleExport("pdf")}
              loading={exporting === "pdf"}
            />
            <ExportButton
              icon="file-text"
              label="Excel"
              onPress={() => handleExport("excel")}
              loading={exporting === "excel"}
            />
            <ExportButton
              icon="image"
              label="Images"
              onPress={() => {}}
              loading={false}
            />
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="inbox" size={48} color="#e0e0e0" />
                <Text style={styles.emptyText}>No students found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedClass !== "All"
                    ? `No students in ${selectedClass}`
                    : "No verified records available"}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const ExportButton = ({ icon, label, onPress, loading }) => (
  <TouchableOpacity
    style={styles.exportButton}
    onPress={onPress}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#000" />
    ) : (
      <>
        <Feather name={icon} size={16} color="#000" />
        <Text style={styles.exportButtonText}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  selectedBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  selectAllButton: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 20,
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

  // Actions Bar
  actionsBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    gap: 6,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: "center",
  },
  selectedCard: {
    backgroundColor: "#000",
  },
  checkboxContainer: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: "#e0e0e0",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
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

export default PrintPreview;
