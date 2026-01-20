import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

/**
 * AUTH PROVIDER - Global State Management for Authentication
 * Handles Session Persistence, JWT Synchronization, and Role-Based Navigation state.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * APP HYDRATION
     * Runs on every app launch to check if a user session exists in local storage.
     */
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUser = await AsyncStorage.getItem("userData");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Synchronize the API Client with the saved JWT token for all future requests
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error("Auth Hydration Error:", e);
      } finally {
        // App is ready to navigate after hydration check
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  /**
   * LOGIN HANDLER
   * Called during successful authentication from LoginScreen.
   * @param {string} newToken - JWT token from backend
   * @param {object} userData - Full user profile object
   */
  const login = async (newToken, userData) => {
    try {
      // 1. Persist session data to Device Storage
      await AsyncStorage.multiSet([
        ["userToken", newToken],
        ["userData", JSON.stringify(userData)],
      ]);

      // 2. Update global API headers for secured routes
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      // 3. Update application-wide state
      setToken(newToken);
      setUser(userData);
    } catch (e) {
      console.error("Login Persistence Error:", e);
      throw new Error("Session could not be established locally.");
    }
  };

  /**
   * UPDATE USER DATA
   * Use this to update profile info (like photo, name, or blood group)
   * without requiring the user to re-login.
   * @param {object} updatedFields - Only the fields that changed
   */
  const updateUser = async (updatedFields) => {
    try {
      const newUserObj = { ...user, ...updatedFields };
      await AsyncStorage.setItem("userData", JSON.stringify(newUserObj));
      setUser(newUserObj);
    } catch (e) {
      console.error("User Update Error:", e);
    }
  };

  /**
   * LOGOUT HANDLER
   * Clears all local storage and resets state to redirect user to Login Screen.
   */
  const logout = async () => {
    try {
      // 1. Wipe local data
      await AsyncStorage.multiRemove(["userToken", "userData"]);

      // 2. Remove token from API client
      delete apiClient.defaults.headers.common["Authorization"];

      // 3. Clear state to trigger RootLayout navigation redirect
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser, // Added for real-time profile/status updates
        isLoading: loading,
        isAuthenticated: !!token,
        role: user?.role, // Directly expose 'admin', 'school', 'shop', 'student', or 'user'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook for accessing Auth context safely
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider wrapper");
  }
  return context;
};
