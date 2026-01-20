import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * API CONFIGURATION
 * Note: Change 10.0.2.2 to your Local IP if testing on a Physical Device.
 */
const BASE_URL = "https://school-saas-backend-ac4d.onrender.com/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR: Automatically attaches JWT and handles File Uploads
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically detect FormData for Cloud GridFS uploads
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR: Handles Auto-Logout on Session Expiry
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired. Clearing local storage...");
      await AsyncStorage.multiRemove(["userToken", "userData"]);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. AUTHENTICATION (Unified)
// ==========================================
export const apiLogin = async (credentials) => {
  const res = await apiClient.post("/auth/login", credentials);
  return res.data;
};

export const apiRegister = async (userData) => {
  const res = await apiClient.post("/auth/register", userData);
  return res.data;
};

// ==========================================
// 2. SUPER ADMIN (System Governance)
// ==========================================
export const apiAdminGetStats = async () => {
  const res = await apiClient.get("/admin/analytics");
  return res.data;
};

export const apiAdminVerifyEntity = async (id, type) => {
  const res = await apiClient.patch(`/admin/verify/${id}`, { type });
  return res.data;
};

export const apiAdminToggleStatus = async (id, type, isActive) => {
  const res = await apiClient.patch(`/admin/toggle-status/${id}`, {
    type,
    isActive,
  });
  return res.data;
};

// ==========================================
// 3. SCHOOL ADMIN (ERP, CRM, LMS, Designer)
// ==========================================
export const apiFetchSchoolStats = async (schoolId) => {
  const res = await apiClient.get(`/school/stats/${schoolId}`);
  return res.data;
};

// Student & Staff Management
export const apiCreateStudent = async (data) => {
  const res = await apiClient.post("/school/create-student", data);
  return res.data;
};

export const apiFetchStudents = async (schoolId) => {
  const res = await apiClient.get(`/school/students/${schoolId}`);
  return res.data;
};

export const apiBulkLockStudents = async (studentIds) => {
  const res = await apiClient.put("/school/bulk-lock", { studentIds });
  return res.data;
};

// Attendance & Results
export const apiSubmitAttendance = async (payload) => {
  const res = await apiClient.post("/school/attendance/submit", payload);
  return res.data;
};

export const apiPublishResult = async (data) => {
  const res = await apiClient.post("/school/results/publish", data);
  return res.data;
};

// LMS & Notices
export const apiPostNotice = async (data) => {
  const res = await apiClient.post("/school/notice", data);
  return res.data;
};

export const apiUploadLMS = async (data) => {
  const res = await apiClient.post("/school/lms/upload", data);
  return res.data;
};

// Template Designer (Mapping Coordinates)
export const apiSaveTemplate = async (schoolId, templateData) => {
  const res = await apiClient.post(
    `/school/template/save/${schoolId}`,
    templateData
  );
  return res.data;
};

// ==========================================
// 4. STUDENT PORTAL (Identity & Learning)
// ==========================================
export const apiGetStudentProfile = async (id) => {
  const res = await apiClient.get(`/student/profile/${id}`);
  return res.data;
};

export const apiSubmitIDForm = async (id, formData) => {
  const res = await apiClient.put(`/student/profile/${id}`, formData);
  return res.data;
};

export const apiGetAcademics = async (id) => {
  const res = await apiClient.get(`/student/academics/${id}`);
  return res.data;
};

// ==========================================
// 5. SHOP / VENDOR (Fulfillment & Ledger)
// ==========================================
export const apiFetchLinkedSchools = async (shopId) => {
  const res = await apiClient.get(`/shop/linked-schools/${shopId}`);
  return res.data;
};

export const apiFetchLockedData = async (schoolId, className) => {
  const res = await apiClient.get(
    `/shop/locked-students/${schoolId}?className=${className}`
  );
  return res.data;
};

// Digital Ledger (Khata) for local customers
export const apiAddLedgerEntry = async (data) => {
  const res = await apiClient.post("/shop/ledger/add", data);
  return res.data;
};

export const apiExportCSV = async (studentIds) => {
  const res = await apiClient.post("/shop/export-csv", { studentIds });
  return res.data;
};

// ==========================================
// 6. PUBLIC (Discovery Hub)
// ==========================================
export const apiPublicSearch = async (query) => {
  const res = await apiClient.get(`/public/schools?query=${query}`);
  return res.data;
};

export const apiSubmitPublicInquiry = async (data) => {
  const res = await apiClient.post("/public/inquiry", data);
  return res.data;
};

export default apiClient;
