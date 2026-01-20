import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

const InquiryForm = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    grade: "",
    message: "",
  });

  const sendInquiry = () => {
    Alert.alert("Request Sent!", "The school admin will contact you shortly.");
    // Logic: Send this data to API /crm/new-inquiry
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admission Inquiry</Text>
      <Text style={styles.sub}>
        Fill this form to get a call back from the institute.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Parent/Student Name"
        onChangeText={(t) => setForm({ ...form, name: t })}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Seeking Admission for Class (e.g. 9th)"
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Any specific questions?"
        multiline
      />

      <TouchableOpacity style={styles.submitBtn} onPress={sendInquiry}>
        <Text style={styles.btnTxt}>Send Inquiry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 25 },
  title: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 5, marginBottom: 30 },
  input: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

export default InquiryForm;
