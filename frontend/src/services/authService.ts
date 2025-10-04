import axios from 'axios';
import { ApiResponse, User, RegisterData, LoginData } from '../types';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰을 자동으로 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // 회원가입
  async register(userData: RegisterData): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '회원가입에 실패했습니다.');
    }
  },

  // 로그인
  async login(credentials: LoginData): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '로그인에 실패했습니다.');
    }
  },

  // 현재 사용자 정보 조회
  async getMe(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '사용자 정보를 가져올 수 없습니다.');
    }
  },

  // 토큰 검증
  async verifyToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
    try {
      const response = await api.post('/auth/verify');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '토큰 검증에 실패했습니다.');
    }
  },

  // 로그아웃
  async logout(): Promise<ApiResponse> {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '로그아웃에 실패했습니다.');
    }
  },

  // 비밀번호 변경
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    }
  }
};
