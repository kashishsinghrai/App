import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    // Validation
    if (!fullName.trim()) {
      setError("Please enter your full name");
      shakeError();
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      shakeError();
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      shakeError();
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      shakeError();
      return;
    }

    if (!password) {
      setError("Please enter a password");
      shakeError();
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      shakeError();
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      shakeError();
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms and Privacy Policy");
      shakeError();
      return;
    }

    setError("");
    setLoading(true);

    try {
      // TODO: Replace with your actual registration API endpoint
      const API_URL = "https://your-api.com/auth/register";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      // Auto-login after registration
      await login(data.token, data.user);
      router.replace(`(${role})/Dashboard`);
    } catch (err) {
      let errorMessage = "Unable to create account. Please try again.";

      if (
        err.message.includes("already exists") ||
        err.message.includes("duplicate")
      ) {
        errorMessage = "An account with this email already exists";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { text: "", color: "#e4e4e7", width: 0 };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { text: "Weak", color: "#dc2626", width: 33 };
    if (strength <= 3) return { text: "Medium", color: "#f59e0b", width: 66 };
    return { text: "Strong", color: "#10b981", width: 100 };
  };

  const passwordStrength = getPasswordStrength();
  const isFormValid =
    fullName.trim().length >= 2 &&
    email.trim() &&
    validateEmail(email.trim()) &&
    password.length >= 8 &&
    password === confirmPassword &&
    agreeToTerms;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.6}
          >
            <Feather name="arrow-left" size={20} color="#18181b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.brandSection}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>EC</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join EduConnect today</Text>
            </View>

            <Animated.View
              style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
            >
              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View
                  style={[
                    styles.fieldInput,
                    nameFocused && styles.fieldInputFocused,
                    error && !nameFocused && styles.fieldInputError,
                  ]}
                >
                  <Feather
                    name="user"
                    size={18}
                    color={nameFocused ? "#18181b" : "#a1a1aa"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#a1a1aa"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View
                  style={[
                    styles.fieldInput,
                    emailFocused && styles.fieldInputFocused,
                    error && !emailFocused && styles.fieldInputError,
                  ]}
                >
                  <Feather
                    name="mail"
                    size={18}
                    color={emailFocused ? "#18181b" : "#a1a1aa"}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#a1a1aa"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View
                  style={[
                    styles.fieldInput,
                    passwordFocused && styles.fieldInputFocused,
                    error && !passwordFocused && styles.fieldInputError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={passwordFocused ? "#18181b" : "#a1a1aa"}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Min. 8 characters"
                    placeholderTextColor="#a1a1aa"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      confirmPasswordInputRef.current?.focus()
                    }
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    activeOpacity={0.6}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#71717a"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${passwordStrength.width}%`,
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        { color: passwordStrength.color },
                      ]}
                    >
                      {passwordStrength.text}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.fieldInput,
                    confirmPasswordFocused && styles.fieldInputFocused,
                    error && !confirmPasswordFocused && styles.fieldInputError,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={confirmPasswordFocused ? "#18181b" : "#a1a1aa"}
                  />
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#a1a1aa"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleRegister}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                    activeOpacity={0.6}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#71717a"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms Agreement */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeToTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeToTerms && (
                    <Feather name="check" size={14} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  (!isFormValid || loading) && styles.signUpButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={!isFormValid || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text style={styles.footerLink} onPress={() => router.back()}>
                  Sign in
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#18181b",
    marginBottom: 6,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 15,
    color: "#71717a",
    fontWeight: "400",
  },
  form: {
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
    fontWeight: "500",
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#18181b",
    letterSpacing: -0.1,
    marginBottom: 8,
  },
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  fieldInputFocused: {
    borderColor: "#18181b",
  },
  fieldInputError: {
    borderColor: "#dc2626",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#18181b",
    fontWeight: "400",
  },
  passwordInput: {
    paddingRight: 0,
  },
  eyeButton: {
    padding: 4,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    backgroundColor: "#e4e4e7",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 60,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#18181b",
    borderColor: "#18181b",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#52525b",
    lineHeight: 20,
  },
  termsLink: {
    color: "#18181b",
    fontWeight: "600",
  },
  signUpButton: {
    height: 50,
    backgroundColor: "#18181b",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  signUpButtonDisabled: {
    opacity: 0.5,
  },
  signUpButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#71717a",
  },
  footerLink: {
    color: "#18181b",
    fontWeight: "600",
  },
});
