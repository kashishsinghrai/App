import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { apiLogin } from "../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_EMAIL_KEY = "@educonnect_saved_email";

export default function CleanLoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const passwordInputRef = useRef(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.log("Error loading saved email:", error);
    }
  };

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

  const handleLogin = async () => {
    Keyboard.dismiss();

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
      setError("Please enter your password");
      shakeError();
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      shakeError();
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await apiLogin({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (rememberMe) {
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
      }

      await login(data.token, data.user);
      router.replace(`(${role})/Dashboard`);
    } catch (err) {
      let errorMessage = "Unable to sign in. Please try again.";

      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Invalid email or password";
            break;
          case 403:
            errorMessage = "Account is suspended. Contact support.";
            break;
          case 404:
            errorMessage = "No account found with this email";
            break;
          case 429:
            errorMessage = "Too many attempts. Please try again later.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "No internet connection. Please check your network.";
      }

      setError(errorMessage);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim() && validateEmail(email.trim()) && password.length >= 6;

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

        <View style={styles.content}>
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>EC</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
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

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TouchableOpacity activeOpacity={0.6}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
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
                  placeholder="Enter your password"
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
                  autoComplete="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
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
            </View>

            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              >
                {rememberMe && (
                  <Feather name="check" size={14} color="#ffffff" />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signInButton,
                (!isFormValid || loading) && styles.signInButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don &apos;t have an account?{" "}
              <Text
                style={styles.footerLink}
                onPress={() =>
                  router.push({ pathname: "/register", params: { role } })
                }
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 40,
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
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#18181b",
    letterSpacing: -0.1,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: "500",
    color: "#18181b",
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
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  checkboxChecked: {
    backgroundColor: "#18181b",
    borderColor: "#18181b",
  },
  rememberText: {
    fontSize: 14,
    color: "#52525b",
    fontWeight: "500",
  },
  signInButton: {
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
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
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
