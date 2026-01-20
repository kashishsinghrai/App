import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
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
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Print from "expo-print"; // For Direct Printing
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

const { width } = Dimensions.get("window");

/**
 * LIVE STUDENT ADMIT CARD WITH DIRECT PRINTING
 * Logic: Fetches metadata for preview and generates PDF stream for printing.
 */
const AdmitCard = () => {
  const { user } = useAuth();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [admitData, setAdmitData] = useState(null);

  /**
   * 1. CLOUD SYNC: Fetch metadata to show the preview on screen
   */
  const fetchAdmitCardMetadata = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/student/academics/${user.id}`);
      if (res.data.admitCard) {
        setAdmitData(res.data.admitCard);
      }
    } catch (err) {
      console.error("Admit Card Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAdmitCardMetadata();
  }, [fetchAdmitCardMetadata]);

  /**
   * 2. DIRECT PRINTING LOGIC
   * Connects to the backend PDF engine and opens the system print dialog.
   */
  const handleDirectPrint = async () => {
    setPrinting(true);
    try {
      // Endpoint that returns the PDF buffer/stream
      const pdfUrl = `${apiClient.defaults.baseURL}/student/admit-card/pdf/${user.id}`;

      // Open System Print Dialog (Android/iOS)
      // This allows 'Save as PDF' or 'Select WiFi Printer'
      await Print.printAsync({
        uri: pdfUrl,
      });
    } catch (err) {
      Alert.alert("Print Error", "Could not connect to the printing service.");
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingTxt}>Synchronizing Exam Pass...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Mesh Background */}
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#fdf2f8"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {admitData ? (
            <Animated.View entering={FadeInUp.duration(800)}>
              {/* THE DIGITAL TICKET HUB */}
              <BlurView intensity={100} tint="light" style={styles.ticketFrame}>
                <View style={styles.cardHeader}>
                  <View style={styles.logoContainer}>
                    <FontAwesome5 name="university" size={20} color="#1e40af" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.schoolName}>
                      {admitData.schoolName || "GLOBAL ACADEMY"}
                    </Text>
                    <Text style={styles.examName}>
                      {admitData.title || "Annual Examination 2026"}
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketDivider} />

                <View style={styles.studentSection}>
                  <Image
                    source={{
                      uri: user.photo
                        ? `http://10.0.2.2:5000${user.photo}`
                        : "https://via.placeholder.com/150",
                    }}
                    style={styles.studentImg}
                  />
                  <View style={styles.infoCol}>
                    <TicketInfo label="Name" value={user.name} />
                    <TicketInfo label="Roll No" value={user.rollNo} />
                    <TicketInfo label="Class" value={user.className || "N/A"} />
                  </View>
                </View>

                <View style={styles.scheduleTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.cell, { flex: 2 }]}>Subject</Text>
                    <Text style={styles.cell}>Date</Text>
                    <Text style={styles.cell}>Venue</Text>
                  </View>

                  {admitData.schedule?.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text
                        style={[
                          styles.cell,
                          { flex: 2, fontWeight: "800", color: "#1e293b" },
                        ]}
                      >
                        {item.subject}
                      </Text>
                      <Text style={styles.cell}>{item.date}</Text>
                      <Text style={styles.cell}>{item.room || "Hall-A"}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.qrContainer}>
                    <Ionicons name="qr-code" size={55} color="#1e293b" />
                  </View>
                  <View style={styles.signSection}>
                    <View style={styles.signLine} />
                    <Text style={styles.signLabel}>Controller of Exams</Text>
                  </View>
                </View>
              </BlurView>

              {/* ACTION BUTTON: DIRECT PRINT */}
              <TouchableOpacity
                style={styles.printBtn}
                onPress={handleDirectPrint}
                disabled={printing}
              >
                <LinearGradient
                  colors={["#1e293b", "#334155"]}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {printing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="printer" size={20} color="#fff" />
                      <Text style={styles.printBtnText}>
                        Direct Print Official PDF
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.instrBox}>
                <Text style={styles.instrTitle}>⚠️ Guidelines:</Text>
                <Text style={styles.instrText}>
                  • Use the print button to generate the high-res document.
                </Text>
                <Text style={styles.instrText}>
                  • Digital copies are valid only with the QR Code intact.
                </Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name="document-lock-outline"
                  size={60}
                  color="#cbd5e1"
                />
              </View>
              <Text style={styles.emptyTitle}>Not Released Yet</Text>
              <Text style={styles.emptySub}>
                Your digital admit card will be visible here once verified by
                the institution.
              </Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={fetchAdmitCardMetadata}
              >
                <Text style={styles.refreshText}>Sync Records</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const TicketInfo = ({ label, value }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.ticketLabel}>{label}</Text>
    <Text style={styles.ticketValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingTxt: {
    marginTop: 15,
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 13,
  },
  scroll: { padding: 22 },
  ticketFrame: {
    borderRadius: 35,
    padding: 25,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    elevation: 10,
    shadowOpacity: 0.1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logoContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1e40af",
    letterSpacing: -0.5,
  },
  examName: { fontSize: 11, color: "#64748b", fontWeight: "700", marginTop: 2 },
  ticketDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginVertical: 5,
  },
  studentSection: {
    flexDirection: "row",
    marginVertical: 20,
    alignItems: "center",
  },
  studentImg: {
    width: 90,
    height: 110,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoCol: { flex: 1, marginLeft: 25 },
  ticketLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "900",
    marginTop: 2,
  },
  scheduleTable: {
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 12,
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
  },
  cell: { flex: 1, fontSize: 11, color: "#64748b", fontWeight: "600" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 30,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  signSection: { alignItems: "center" },
  signLine: {
    width: 120,
    height: 1.5,
    backgroundColor: "#1e293b",
    marginBottom: 6,
  },
  signLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  printBtn: {
    marginTop: 30,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  printBtnText: {
    color: "#fff",
    fontWeight: "900",
    marginLeft: 12,
    fontSize: 15,
  },
  instrBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  instrTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ef4444",
    marginBottom: 10,
  },
  instrText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "600",
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1e293b",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontWeight: "600",
  },
  refreshBtn: {
    marginTop: 25,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#eef2ff",
  },
  refreshText: { color: "#1e40af", fontWeight: "900", fontSize: 14 },
});

export default AdmitCard;
