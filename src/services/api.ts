import { File, UploadType, type UploadResult } from "expo-file-system";
import { StorageService } from "./storage";

// export const DEFAULT_API_URL = 'http://10.0.2.2:8000/api/v1';
export const DEFAULT_API_URL =
  "https://hris-humify-production.up.railway.app/api/v1";

export interface UserEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  address: string;
  photo_url: string | null;
  face_registered: boolean;
  department: { id: number; name: string };
  position: { id: number; name: string };
  supervisor: { id: string; full_name: string } | null;
  employment_type: string;
  employee_status: string;
  is_shift_worker: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  role: "karyawan" | "manager" | "admin_hr" | "super_admin";
  employee: UserEmployee;
}

export interface AssignedShift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  category: "regular" | "shifting";
}

export interface TodayAttendance {
  id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  status:
    | "hadir"
    | "terlambat"
    | "pulang_cepat"
    | "izin"
    | "sakit"
    | "cuti"
    | "alpha"
    | "libur"
    | null;
  late_minutes: number;
  review_status: "pending" | "disetujui" | "ditolak" | null;
  check_in_face_verified: boolean;
  check_in_face_score: number;
}

export interface TodayStatusResponse {
  date: string;
  has_checked_in: boolean;
  has_checked_out: boolean;
  assigned_shift: AssignedShift;
  attendance: TodayAttendance | null;
}

export interface LeaveType {
  id: number;
  name: string;
  is_paid: boolean;
  max_days_per_year: number | null;
  requires_attachment: boolean;
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: number;
  leave_type: { id: number; name: string };
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url: string | null;
  status: "pending" | "disetujui" | "ditolak" | "dibatalkan";
  rejection_reason: string | null;
  created_at: string;
}

export interface ManagerAttendanceItem {
  attendance_id: number;
  employee: {
    id: string;
    employee_code: string;
    full_name: string;
  };
  attendance_date: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
  face_score: number;
  photo_url: string | null;
  review_status: "pending" | "disetujui" | "ditolak";
  distance_meters?: number;
}

export interface ManagerLeaveApprovalItem {
  request_id: number;
  employee: {
    id: string;
    employee_code: string;
    full_name: string;
  };
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url: string | null;
  status: "pending" | "disetujui" | "ditolak";
  remaining_balance: number;
}

export interface OfficeLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  updated_at?: string | null;
}

// -------------------------------------------------------------
// DEMO / MOCK DATA FOR LOCAL TESTING
// -------------------------------------------------------------
const DEMO_USERS: Record<
  string,
  { role: "karyawan" | "manager" | "admin_hr"; employee: UserEmployee }
> = {
  "alex.morgan": {
    role: "karyawan",
    employee: {
      id: "c62cf0cb-d85c-4cc4-b588-3673d11cd9bd",
      employee_code: "EMP-001",
      full_name: "Alex Morgan",
      email: "alex.morgan@humify.test",
      phone: "081234567001",
      gender: "L",
      birth_place: "Bandung",
      birth_date: "1994-11-18",
      address: "Jl. Nakula 6",
      photo_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      face_registered: true,
      department: { id: 4, name: "Product Design" },
      position: { id: 6, name: "Product Designer" },
      supervisor: {
        id: "fca1a42e-d444-4e0a-9812-97ae47409eb2",
        full_name: "Maya Chen",
      },
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
  "budi.santoso": {
    role: "karyawan",
    employee: {
      id: "d73df1dc-e96d-5dd5-c699-4784e22de0ce",
      employee_code: "EMP-002",
      full_name: "Budi Santoso",
      email: "budi.santoso@humify.test",
      phone: "081234567002",
      gender: "L",
      birth_place: "Surabaya",
      birth_date: "1996-03-22",
      address: "Jl. Fatmawati No. 8, Jakarta Selatan",
      photo_url: null,
      face_registered: false, // For testing first time face registration!
      department: { id: 2, name: "Engineering Operations" },
      position: { id: 3, name: "Shift Technician" },
      supervisor: {
        id: "fca1a42e-d444-4e0a-9812-97ae47409eb2",
        full_name: "Maya Chen",
      },
      employment_type: "kontrak",
      employee_status: "aktif",
      is_shift_worker: true, // For testing shift selection!
    },
  },
  "maya.chen": {
    role: "manager",
    employee: {
      id: "fca1a42e-d444-4e0a-9812-97ae47409eb2",
      employee_code: "MGR-001",
      full_name: "Maya Chen",
      email: "maya.chen@humify.test",
      phone: "081298765432",
      gender: "P",
      birth_place: "Jakarta",
      birth_date: "1989-07-14",
      address: "Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan",
      photo_url:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      face_registered: true,
      department: { id: 4, name: "Product Design" },
      position: { id: 1, name: "Head of Product Design" },
      supervisor: null,
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
  "admin.hr": {
    role: "admin_hr",
    employee: {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      employee_code: "HR-001",
      full_name: "Dewi Lestari",
      email: "dewi.hr@humify.test",
      phone: "081388889999",
      gender: "P",
      birth_place: "Yogyakarta",
      birth_date: "1991-05-10",
      address: "Jl. Sudirman No. 100, Jakarta",
      photo_url: null,
      face_registered: true,
      department: { id: 1, name: "Human Resources" },
      position: { id: 2, name: "HR Manager" },
      supervisor: null,
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
  adminhr: {
    role: "admin_hr",
    employee: {
      id: "2e65ad1d-ed00-45c4-a79a-1796a676c217",
      employee_code: "HR-001",
      full_name: "Dewi Lestari",
      email: "adminhr@humify.test",
      phone: "081388889999",
      gender: "P",
      birth_place: "Yogyakarta",
      birth_date: "1991-05-10",
      address: "Jl. Sudirman No. 100, Jakarta",
      photo_url: null,
      face_registered: true,
      department: { id: 1, name: "Human Resources" },
      position: { id: 2, name: "HR Manager" },
      supervisor: null,
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
  "sarah.connor": {
    role: "karyawan",
    employee: {
      id: "ee86d41e-6886-4357-bb0c-596d5c0f0533",
      employee_code: "EMP-005",
      full_name: "Sarah Connor",
      email: "sarah.connor@humify.test",
      phone: "+62 812 3456 7005",
      gender: "P",
      birth_place: "Surabaya",
      birth_date: "1996-04-12",
      address: "Jl. Bangka IX No. 8, Jakarta Selatan",
      photo_url: null,
      face_registered: false,
      department: { id: 4, name: "Product Design" },
      position: { id: 6, name: "Product Designer" },
      supervisor: {
        id: "fca1a42e-d444-4e0a-9812-97ae47409eb2",
        full_name: "Maya Chen",
      },
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
  karyawan: {
    role: "karyawan",
    employee: {
      id: "7a03c9c7-0d5a-4636-9069-edfc1b72f964",
      employee_code: "EMP-003",
      full_name: "Budi Santoso",
      email: "karyawan@humify.test",
      phone: "081234567003",
      gender: "L",
      birth_place: "Surabaya",
      birth_date: "1995-05-15",
      address: "Jl. Fatmawati No. 8, Jakarta Selatan",
      photo_url: null,
      face_registered: false,
      department: { id: 2, name: "Engineering Operations" },
      position: { id: 3, name: "Shift Technician" },
      supervisor: {
        id: "fca1a42e-d444-4e0a-9812-97ae47409eb2",
        full_name: "Maya Chen",
      },
      employment_type: "tetap",
      employee_status: "aktif",
      is_shift_worker: false,
    },
  },
};

// In-memory demo state for mock persistence
let mockTodayAttendance: TodayAttendance | null = null;
let mockHasCheckedIn = false;
let mockHasCheckedOut = false;

let mockLeaveBalances: LeaveBalance[] = [
  {
    leave_type_id: 1,
    leave_type_name: "Annual leave",
    year: 2026,
    total_days: 12.0,
    used_days: 4.0,
    remaining_days: 8.0,
  },
  {
    leave_type_id: 2,
    leave_type_name: "Personal leave",
    year: 2026,
    total_days: 3.0,
    used_days: 1.0,
    remaining_days: 2.0,
  },
  {
    leave_type_id: 3,
    leave_type_name: "Sick",
    year: 2026,
    total_days: 14.0,
    used_days: 2.0,
    remaining_days: 12.0,
  },
  {
    leave_type_id: 4,
    leave_type_name: "Permission",
    year: 2026,
    total_days: 5.0,
    used_days: 0.0,
    remaining_days: 5.0,
  },
];

let mockLeaveRequests: LeaveRequest[] = [
  {
    id: 24,
    leave_type: { id: 1, name: "Annual leave" },
    start_date: "2026-11-10",
    end_date: "2026-11-12",
    total_days: 3.0,
    reason: "Family vacation in Bali",
    attachment_url: null,
    status: "pending",
    rejection_reason: null,
    created_at: "2026-11-05 10:20:00",
  },
  {
    id: 22,
    leave_type: { id: 3, name: "Sick" },
    start_date: "2026-10-18",
    end_date: "2026-10-19",
    total_days: 2.0,
    reason: "Demam tinggi dan flu",
    attachment_url:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80",
    status: "disetujui",
    rejection_reason: null,
    created_at: "2026-10-18 07:15:00",
  },
];

let mockManagerAttendanceReviews: ManagerAttendanceItem[] = [
  {
    attendance_id: 6,
    employee: {
      id: "ee86d41e-6886-4357-bb0c-596d5c0f0533",
      employee_code: "EMP-005",
      full_name: "Sarah Connor",
    },
    attendance_date: "2026-11-05",
    check_in_time: "08:55:00",
    check_out_time: null,
    status: "hadir",
    face_score: 94.0,
    photo_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    review_status: "pending",
    distance_meters: 35,
  },
  {
    attendance_id: 7,
    employee: {
      id: "c62cf0cb-d85c-4cc4-b588-3673d11cd9bd",
      employee_code: "EMP-001",
      full_name: "Alex Morgan",
    },
    attendance_date: "2026-11-05",
    check_in_time: "08:12:00",
    check_out_time: null,
    status: "terlambat",
    face_score: 95.5,
    photo_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    review_status: "pending",
    distance_meters: 18,
  },
];

let mockManagerLeaveApprovals: ManagerLeaveApprovalItem[] = [
  {
    request_id: 24,
    employee: {
      id: "c62cf0cb-d85c-4cc4-b588-3673d11cd9bd",
      employee_code: "EMP-001",
      full_name: "Alex Morgan",
    },
    leave_type_name: "Annual leave",
    start_date: "2026-11-10",
    end_date: "2026-11-12",
    total_days: 3.0,
    reason: "Family vacation in Bali",
    attachment_url: null,
    status: "pending",
    remaining_balance: 8.0,
  },
  {
    request_id: 25,
    employee: {
      id: "d73df1dc-e96d-5dd5-c699-4784e22de0ce",
      employee_code: "EMP-002",
      full_name: "Budi Santoso",
    },
    leave_type_name: "Sick",
    start_date: "2026-11-08",
    end_date: "2026-11-09",
    total_days: 2.0,
    reason: "Istirahat pasca tindakan medis",
    attachment_url:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80",
    status: "pending",
    remaining_balance: 12.0,
  },
];

class ApiClient {
  private async getHeaders(
    isMultipart = false,
  ): Promise<Record<string, string>> {
    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private async getBaseUrl(): Promise<string> {
    const custom = await StorageService.getApiUrl();
    return custom || DEFAULT_API_URL;
  }

  // 1.1 Ping
  async ping(): Promise<{ message: string }> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/ping`);
      return await res.json();
    } catch {
      return { message: "Humify Demo Mode (Offline Fallback Ready)" };
    }
  }

  // 1.2 Login
  async login(username: string, password: string): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        await StorageService.setToken(data.data.token);
        await StorageService.setUser(data.data.user);
        return data;
      }
      if (res.status === 401 || res.status === 422) {
        throw new Error(data?.message || "Username atau password salah.");
      }
      throw new Error(data?.message || `Login gagal (Status ${res.status}).`);
    } catch (networkErr: any) {
      if (
        networkErr.message &&
        !networkErr.message.includes("Network request failed") &&
        !networkErr.message.includes("Failed to fetch")
      ) {
        throw networkErr;
      }
      // Demo Fallback for offline testing only when network is down
      console.log(
        "Network request to backend failed, trying demo user accounts:",
        networkErr.message,
      );
      const demoUser = DEMO_USERS[username.toLowerCase().trim()];
      if (demoUser && password === "password123") {
        const mockResponse = {
          success: true,
          message: "Login berhasil (Demo Mode - Offline)",
          data: {
            token: `demo-jwt-token-${username}-${Date.now()}`,
            token_type: "Bearer",
            expires_in: 86400,
            user: {
              id: demoUser.employee.id,
              username,
              role: demoUser.role,
              employee: demoUser.employee,
            },
          },
        };
        await StorageService.setToken(mockResponse.data.token);
        await StorageService.setUser(mockResponse.data.user);
        return mockResponse;
      }

      throw networkErr;
    }
  }

  // 1.3 Logout
  async logout(): Promise<void> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers });
    } catch {
      // ignore
    } finally {
      await StorageService.clearAll();
    }
  }

  // 1.4 Get Profile / Me
  async getMe(): Promise<UserProfile> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/auth/me`, { headers });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // ignore
    }
    const cached = await StorageService.getUser();
    if (cached) return cached;
    return {
      id: DEMO_USERS["alex.morgan"].employee.id,
      username: "alex.morgan",
      role: "karyawan",
      employee: DEMO_USERS["alex.morgan"].employee,
    };
  }

  // 2.1 Update Profile
  async updateProfile(data: {
    phone?: string;
    email?: string;
    address?: string;
    birth_place?: string;
    birth_date?: string;
    gender?: string;
  }): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    // Update local cache
    const user = await StorageService.getUser();
    if (user && user.employee) {
      Object.assign(user.employee, data);
      await StorageService.setUser(user);
    }
    return {
      success: true,
      message: "Data personal berhasil diperbarui.",
      data,
    };
  }

  // 3.1 Get Today Attendance & Shift
  async getTodayAttendance(): Promise<TodayStatusResponse> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/attendances/today`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // fallback
    }

    const storedAtt = await StorageService.getTodayAttendance();
    if (storedAtt) {
      mockTodayAttendance = storedAtt;
      mockHasCheckedIn = !!storedAtt.check_in_time;
      mockHasCheckedOut = !!storedAtt.check_out_time;
    }

    const user = await StorageService.getUser();
    const isShiftWorker = user?.employee?.is_shift_worker ?? false;

    return {
      date: new Date().toISOString().split("T")[0],
      has_checked_in: mockHasCheckedIn,
      has_checked_out: mockHasCheckedOut,
      assigned_shift: isShiftWorker
        ? {
            id: 2,
            name: "Shift 1 (Pagi)",
            start_time: "07:00:00",
            end_time: "15:00:00",
            category: "shifting",
          }
        : {
            id: 1,
            name: "Regular",
            start_time: "08:00:00",
            end_time: "17:00:00",
            category: "regular",
          },
      attendance: mockTodayAttendance,
    };
  }

  // 3.2 Check-In
  async checkIn(params: {
    latitude: number;
    longitude: number;
    shift_id?: number;
    face_photo_uri: string;
    face_score: number;
  }): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const isRealFile =
      params.face_photo_uri &&
      (params.face_photo_uri.startsWith("file://") ||
        params.face_photo_uri.startsWith("content://") ||
        params.face_photo_uri.startsWith("/"));

    let json: any = null;
    let statusCode = 200;

    if (isRealFile) {
      try {
        const file = new File(params.face_photo_uri);
        const uploadResult = await file.upload(`${baseUrl}/attendances/check-in`, {
          httpMethod: "POST",
          uploadType: UploadType.MULTIPART,
          fieldName: "face_photo",
          mimeType: "image/jpeg",
          headers,
          parameters: {
            latitude: String(params.latitude),
            longitude: String(params.longitude),
            ...(params.shift_id ? { shift_id: String(params.shift_id) } : {}),
          },
        });
        statusCode = uploadResult.status;
        try {
          json = JSON.parse(uploadResult.body);
        } catch {
          // non-JSON response
        }
      } catch (err: any) {
        console.error("Network error during check-in upload:", err);
        throw new Error(
          `Koneksi ke server gagal: ${err.message || "Periksa jaringan internet Anda."}`
        );
      }
    } else {
      try {
        const res = await fetch(`${baseUrl}/attendances/check-in`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: params.latitude,
            longitude: params.longitude,
            ...(params.shift_id ? { shift_id: params.shift_id } : {}),
          }),
        });
        statusCode = res.status;
        try {
          json = await res.json();
        } catch {
          // non-JSON
        }
      } catch (err: any) {
        console.error("Network error during check-in fetch:", err);
        throw new Error(
          `Koneksi ke server gagal: ${err.message || "Periksa jaringan internet Anda."}`
        );
      }
    }

    if (statusCode >= 200 && statusCode < 300 && json?.success) {
      mockHasCheckedIn = true;
      mockTodayAttendance = {
        id: json.data?.attendance_id || 101,
        check_in_time: json.data?.check_in_time,
        check_out_time: null,
        status: json.data?.status || "hadir",
        late_minutes: json.data?.late_minutes || 0,
        review_status: json.data?.review_status || "pending",
        check_in_face_verified: true,
        check_in_face_score: params.face_score,
      };
      await StorageService.saveTodayAttendance(mockTodayAttendance);
      return json;
    }

    let errorMsg = json?.message || "Check-in gagal tercatat di server.";
    if (json?.errors) {
      const errList = Object.values(json.errors).flat();
      if (errList.length > 0) {
        errorMsg = `${errorMsg} (${errList.join(", ")})`;
      }
    }
    throw new Error(errorMsg);
  }

  // 3.3 Check-Out
  async checkOut(params: {
    latitude: number;
    longitude: number;
    face_photo_uri: string;
    face_score: number;
  }): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const isRealFile =
      params.face_photo_uri &&
      (params.face_photo_uri.startsWith("file://") ||
        params.face_photo_uri.startsWith("content://") ||
        params.face_photo_uri.startsWith("/"));

    let json: any = null;
    let statusCode = 200;

    if (isRealFile) {
      try {
        const file = new File(params.face_photo_uri);
        const uploadResult = await file.upload(`${baseUrl}/attendances/check-out`, {
          httpMethod: "POST",
          uploadType: UploadType.MULTIPART,
          fieldName: "face_photo",
          mimeType: "image/jpeg",
          headers,
          parameters: {
            latitude: String(params.latitude),
            longitude: String(params.longitude),
          },
        });
        statusCode = uploadResult.status;
        try {
          json = JSON.parse(uploadResult.body);
        } catch {
          // non-JSON response
        }
      } catch (err: any) {
        console.error("Network error during check-out upload:", err);
        throw new Error(
          `Koneksi ke server gagal: ${err.message || "Periksa jaringan internet Anda."}`
        );
      }
    } else {
      try {
        const res = await fetch(`${baseUrl}/attendances/check-out`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: params.latitude,
            longitude: params.longitude,
          }),
        });
        statusCode = res.status;
        try {
          json = await res.json();
        } catch {
          // non-JSON
        }
      } catch (err: any) {
        console.error("Network error during check-out fetch:", err);
        throw new Error(
          `Koneksi ke server gagal: ${err.message || "Periksa jaringan internet Anda."}`
        );
      }
    }

    if (statusCode >= 200 && statusCode < 300 && json?.success) {
      mockHasCheckedOut = true;
      if (mockTodayAttendance) {
        mockTodayAttendance.check_out_time = json.data?.check_out_time;
        await StorageService.saveTodayAttendance(mockTodayAttendance);
      }
      return json;
    }

    let errorMsg = json?.message || "Check-out gagal tercatat di server.";
    if (json?.errors) {
      const errList = Object.values(json.errors).flat();
      if (errList.length > 0) {
        errorMsg = `${errorMsg} (${errList.join(", ")})`;
      }
    }
    throw new Error(errorMsg);
  }

  // 3.4 History
  async getAttendanceHistory(month?: number, year?: number): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const q = new URLSearchParams();
      if (month) q.append("month", String(month));
      if (year) q.append("year", String(year));
      const res = await fetch(
        `${baseUrl}/attendances/history?${q.toString()}`,
        { headers },
      );
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    return {
      summary: {
        total_present: 18,
        total_late: 2,
        total_leave: 1,
        total_sick: 0,
      },
      history: [
        {
          id: 142,
          date: "2026-11-05",
          shift_name: "Regular (08:00 - 17:00)",
          check_in_time: "08:12:00",
          check_out_time: mockHasCheckedOut ? "17:05:00" : null,
          status: "terlambat",
          late_minutes: 12,
          review_status: "pending",
          review_note: null,
        },
        {
          id: 141,
          date: "2026-11-04",
          shift_name: "Regular (08:00 - 17:00)",
          check_in_time: "07:54:00",
          check_out_time: "17:02:00",
          status: "hadir",
          late_minutes: 0,
          review_status: "disetujui",
          review_note: "Presensi terverifikasi tepat waktu",
        },
        {
          id: 140,
          date: "2026-11-03",
          shift_name: "Regular (08:00 - 17:00)",
          check_in_time: "07:58:00",
          check_out_time: "17:15:00",
          status: "hadir",
          late_minutes: 0,
          review_status: "disetujui",
          review_note: null,
        },
        {
          id: 139,
          date: "2026-11-02",
          shift_name: "Regular (08:00 - 17:00)",
          check_in_time: "08:20:00",
          check_out_time: "17:10:00",
          status: "terlambat",
          late_minutes: 20,
          review_status: "disetujui",
          review_note: "Macet jalan arteri",
        },
      ],
    };
  }

  // 4.1 Master Leave Types
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/leaves/types`, { headers });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 1,
        name: "Annual leave",
        is_paid: true,
        max_days_per_year: 12,
        requires_attachment: false,
      },
      {
        id: 2,
        name: "Personal leave",
        is_paid: true,
        max_days_per_year: 3,
        requires_attachment: false,
      },
      {
        id: 3,
        name: "Sick",
        is_paid: true,
        max_days_per_year: null,
        requires_attachment: true,
      },
      {
        id: 4,
        name: "Permission",
        is_paid: true,
        max_days_per_year: null,
        requires_attachment: false,
      },
    ];
  }

  // 4.2 Leave Balances
  async getLeaveBalances(year?: number): Promise<LeaveBalance[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(
        `${baseUrl}/leaves/balances?year=${year || 2026}`,
        { headers },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          await StorageService.saveBalances(json.data);
          mockLeaveBalances = json.data;
          return json.data;
        }
      }
    } catch {
      // fallback
    }

    const storedBalances = await StorageService.getBalances();
    if (storedBalances && storedBalances.length > 0) {
      mockLeaveBalances = storedBalances;
      return storedBalances;
    }
    await StorageService.saveBalances(mockLeaveBalances);
    return mockLeaveBalances;
  }

  // 4.3 Leave Requests List
  async getLeaveRequests(
    status?: string,
    year?: number,
  ): Promise<LeaveRequest[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const q = new URLSearchParams();
      if (status) q.append("status", status);
      if (year) q.append("year", String(year));
      const res = await fetch(`${baseUrl}/leaves/requests?${q.toString()}`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // fallback
    }

    const storedLeaves = await StorageService.getLeaves();
    const allLeaves =
      storedLeaves && storedLeaves.length > 0
        ? storedLeaves
        : mockLeaveRequests;
    mockLeaveRequests = allLeaves;

    if (status && status !== "all") {
      return allLeaves.filter((r) => r.status === status);
    }
    return allLeaves;
  }

  // 4.4 Submit New Leave Request
  async submitLeaveRequest(data: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    attachment_uri?: string | null;
  }): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const token = await StorageService.getToken();

    const isRealFile =
      !!data.attachment_uri &&
      (data.attachment_uri.startsWith("file://") ||
        data.attachment_uri.startsWith("content://") ||
        data.attachment_uri.startsWith("/"));

    let json: any = null;
    let statusCode = 200;

    if (isRealFile) {
      try {
        let mimeType = "image/jpeg";
        const lower = data.attachment_uri!.toLowerCase();
        if (lower.endsWith(".png")) {
          mimeType = "image/png";
        } else if (lower.endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (lower.endsWith(".webp")) {
          mimeType = "image/webp";
        }

        const file = new File(data.attachment_uri!);
        const uploadResult = await file.upload(`${baseUrl}/leaves/requests`, {
          httpMethod: "POST",
          uploadType: UploadType.MULTIPART,
          fieldName: "attachment",
          mimeType,
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          parameters: {
            leave_type_id: String(data.leave_type_id),
            start_date: data.start_date,
            end_date: data.end_date,
            total_days: String(data.total_days),
            reason: data.reason,
          },
        });

        statusCode = uploadResult.status;
        try {
          json = JSON.parse(uploadResult.body);
        } catch {
          // non-JSON response
        }
      } catch (networkErr: any) {
        console.error("Network error during leave submission upload:", networkErr);
        throw new Error(
          `Koneksi ke server gagal: ${networkErr.message || "Periksa jaringan internet Anda."}`,
        );
      }
    } else {
      try {
        const res = await fetch(`${baseUrl}/leaves/requests`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            leave_type_id: data.leave_type_id,
            start_date: data.start_date,
            end_date: data.end_date,
            total_days: data.total_days,
            reason: data.reason,
          }),
        });

        statusCode = res.status;
        json = await res.json().catch(() => null);
      } catch (networkErr: any) {
        console.error("Network error during leave submission fetch:", networkErr);
        throw new Error(
          `Koneksi ke server gagal: ${networkErr.message || "Periksa jaringan internet Anda."}`,
        );
      }
    }

    if (statusCode >= 200 && statusCode < 300 && json?.success) {
      return json;
    }

    // Handle server error responses
    let errMsg = "Gagal mengirimkan pengajuan cuti ke server.";
    if (json?.message) {
      errMsg = json.message;
      if (json?.errors) {
        const errorDetails = Object.values(json.errors).flat().join(", ");
        if (errorDetails) errMsg += ` (${errorDetails})`;
      }
    } else if (statusCode === 401) {
      errMsg = "Sesi login kedaluwarsa atau token tidak valid. Silakan login ulang.";
    } else if (statusCode === 422) {
      errMsg = "Data pengajuan tidak valid. Mohon periksa kembali form pengajuan.";
    } else if (statusCode) {
      errMsg = `Server merespons error HTTP ${statusCode}.`;
    }

    throw new Error(errMsg);
  }

  // 4.5 Cancel Leave Request
  async cancelLeaveRequest(id: number): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/leaves/requests/${id}/cancel`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Safe fallback below
    }

    // Persistent Local Fallback
    const currentStoredLeaves =
      (await StorageService.getLeaves()) || mockLeaveRequests;
    const target = currentStoredLeaves.find((r) => r.id === id);
    if (!target) {
      throw new Error("Permohonan cuti tidak ditemukan.");
    }
    if (target.status !== "pending") {
      throw new Error(
        "Pengajuan ini tidak dapat dibatalkan karena sudah diproses.",
      );
    }

    target.status = "dibatalkan";
    await StorageService.saveLeaves(currentStoredLeaves);
    mockLeaveRequests = currentStoredLeaves;

    // Refund balances
    const currentStoredBalances =
      (await StorageService.getBalances()) || mockLeaveBalances;
    const updatedBalances = currentStoredBalances.map((b) => {
      if (b.leave_type_id === target.leave_type.id) {
        return {
          ...b,
          remaining_days: b.remaining_days + target.total_days,
          used_days: Math.max(0, b.used_days - target.total_days),
        };
      }
      return b;
    });
    await StorageService.saveBalances(updatedBalances);
    mockLeaveBalances = updatedBalances;

    return {
      success: true,
      message: "Pengajuan cuti berhasil dibatalkan.",
      data: { request_id: id, status: "dibatalkan" },
    };
  }

  // 5.1 Manager Attendance Reviews
  async getManagerAttendanceReviews(
    search?: string,
    date?: string,
  ): Promise<ManagerAttendanceItem[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (date) q.append("date", date);
      const res = await fetch(
        `${baseUrl}/manager/attendance-reviews?${q.toString()}`,
        { headers },
      );
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return mockManagerAttendanceReviews;
  }

  // 5.2 Manager Decide Attendance Review
  async decideAttendanceReview(
    id: number,
    action: "approve" | "reject",
    review_note?: string,
  ): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(
        `${baseUrl}/manager/attendance-reviews/${id}/decide`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ action, review_note }),
        },
      );
      const json = await res.json();
      if (res.ok) return json;
      throw new Error(json.message || "Gagal menyimpan review presensi.");
    } catch (networkErr: any) {
      if (
        networkErr.message &&
        !networkErr.message.includes("fetch") &&
        !networkErr.message.includes("Network")
      ) {
        throw networkErr;
      }
      // Mock update
      const item = mockManagerAttendanceReviews.find(
        (r) => r.attendance_id === id,
      );
      if (item) {
        item.review_status = action === "approve" ? "disetujui" : "ditolak";
      }
      return { success: true, message: "Review presensi berhasil disimpan." };
    }
  }

  // 5.3 Manager Leave Approvals
  async getManagerLeaveApprovals(
    status = "pending",
  ): Promise<ManagerLeaveApprovalItem[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(
        `${baseUrl}/manager/leave-approvals?status=${status}`,
        { headers },
      );
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    if (status && status !== "all") {
      return mockManagerLeaveApprovals.filter((r) => r.status === status);
    }
    return mockManagerLeaveApprovals;
  }

  // 5.4 Manager Decide Leave Approval
  async decideLeaveApproval(
    id: number,
    action: "approve" | "reject",
    rejection_reason?: string,
  ): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(
        `${baseUrl}/manager/leave-approvals/${id}/decide`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ action, rejection_reason }),
        },
      );
      if (res.ok) {
        const json = await res.json();
        return json;
      }
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Gagal memproses persetujuan (HTTP ${res.status}).`);
    } catch (networkOrApiErr: any) {
      if (networkOrApiErr?.message && !networkOrApiErr.message.includes("Network request failed")) {
        throw networkOrApiErr;
      }
      // Safe fallback below only for true network failure
    }

    const item = mockManagerLeaveApprovals.find((r) => r.request_id === id);
    if (item) {
      item.status = action === "approve" ? "disetujui" : "ditolak";
    }

    // Sync employee leave list as well
    const currentStoredLeaves =
      (await StorageService.getLeaves()) || mockLeaveRequests;
    const leaveItem = currentStoredLeaves.find((r) => r.id === id);
    if (leaveItem) {
      leaveItem.status = action === "approve" ? "disetujui" : "ditolak";
      if (action === "reject") {
        leaveItem.rejection_reason = rejection_reason || "Ditolak oleh atasan.";
        // Refund balances on rejection
        const currentStoredBalances =
          (await StorageService.getBalances()) || mockLeaveBalances;
        const updatedBalances = currentStoredBalances.map((b) => {
          if (b.leave_type_id === leaveItem.leave_type.id) {
            return {
              ...b,
              remaining_days: b.remaining_days + leaveItem.total_days,
              used_days: Math.max(0, b.used_days - leaveItem.total_days),
            };
          }
          return b;
        });
        await StorageService.saveBalances(updatedBalances);
        mockLeaveBalances = updatedBalances;
      }
      await StorageService.saveLeaves(currentStoredLeaves);
      mockLeaveRequests = currentStoredLeaves;
    }

    return {
      success: true,
      message: "Keputusan permohonan berhasil disimpan.",
    };
  }

  // Face Registration (First Time) via native FileSystem.uploadAsync (Bypasses FormData)
  async registerFacePhoto(photoUri: string): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const token = await StorageService.getToken();

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let uploadResult: UploadResult;
    try {
      const file = new File(photoUri);
      uploadResult = await file.upload(`${baseUrl}/profile/face-reference`, {
        httpMethod: "POST",
        uploadType: UploadType.MULTIPART,
        fieldName: "face_photo",
        mimeType: "image/jpeg",
        headers,
      });
    } catch (networkErr: any) {
      console.error("Network error during face photo upload:", networkErr);
      throw new Error(
        `Koneksi ke server gagal: ${networkErr.message || "Periksa jaringan internet Anda."}`,
      );
    }

    let json: any = null;
    try {
      json = JSON.parse(uploadResult.body);
    } catch {
      // non-JSON response
    }

    const isSuccess =
      uploadResult.status >= 200 && uploadResult.status < 300 && json?.success;

    if (isSuccess) {
      const serverPhotoUrl = json.data?.face_reference_photo_url || photoUri;

      const user = await StorageService.getUser();
      if (user && user.employee) {
        user.employee.face_registered = true;
        user.employee.photo_url = serverPhotoUrl;
        await StorageService.setUser(user);
        await StorageService.setFaceReference(serverPhotoUrl);
      }

      return json;
    }

    // FAKE-SUCCESS FALLBACK DIMATIKAN: Laporkan error sebenarnya
    let errMsg = "Gagal mendaftarkan wajah ke server.";
    if (json?.message) {
      errMsg = json.message;
      if (json?.errors) {
        const errorDetails = Object.values(json.errors).flat().join(", ");
        if (errorDetails) errMsg += ` (${errorDetails})`;
      }
    } else if (uploadResult.status === 401) {
      errMsg =
        "Sesi login kedaluwarsa atau token tidak valid. Silakan login ulang.";
    } else if (uploadResult.status === 422) {
      errMsg =
        "Format foto tidak diterima server. Pastikan foto berformat JPG/PNG.";
    } else if (uploadResult.status) {
      errMsg = `Server merespons error HTTP ${uploadResult.status}.`;
    }

    throw new Error(errMsg);
  }

  // 6.1 Office Location Configuration (Dynamic HR Geofence)
  async getOfficeLocation(): Promise<OfficeLocation> {
    try {
      const baseUrl = await this.getBaseUrl();
      const headers = await this.getHeaders();
      const res = await fetch(`${baseUrl}/office-location`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data as OfficeLocation;
      }
    } catch (e) {
      console.warn("Failed to fetch office location:", e);
    }

    return {
      name: "Humify Head Office",
      address: "Jl Nakula 6",
      latitude: -6.2087634,
      longitude: 106.845599,
      radius_meters: 100,
    };
  }

  // 6.2 Update Office Location (HR Role Only)
  async updateOfficeLocation(params: {
    latitude: number;
    longitude: number;
    radius_meters?: number;
    name?: string;
    address?: string;
  }): Promise<any> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();
    const res = await fetch(`${baseUrl}/office-location`, {
      method: "PUT",
      headers,
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }

    throw new Error(data.message || "Gagal memperbarui lokasi kantor.");
  }
}

export const api = new ApiClient();
