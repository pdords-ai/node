// 프로젝트 전체에서 사용할 공통 타입 정의들

// 사용자 관련 타입
export interface IUser {
  _id: string;
  username: string;
  email: string;
  password?: string; // 비밀번호는 보통 응답에서 제외
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    fullName?: string; // 가상 필드
  };
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 게시물 관련 타입
export interface IPost {
  _id: string;
  title: string;
  content: string;
  author: IUser | string; // 사용자 객체 또는 ID
  category: string;
  tags: string[];
  images?: string[];
  likes: {
    count: number;
    users: string[]; // 사용자 ID 배열
  };
  comments: IComment[];
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 댓글 관련 타입
export interface IComment {
  _id: string;
  content: string;
  author: IUser | string;
  post: string; // 게시물 ID
  createdAt: Date;
  updatedAt: Date;
}

// JWT 페이로드 타입
export interface IJWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// API 응답 타입
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: string[];
}

// 페이지네이션 타입
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

// 페이지네이션 응답 타입
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 파일 업로드 타입
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  url: string;
}

// Socket.io 이벤트 타입
export interface ISocketEvents {
  // 클라이언트에서 서버로 보내는 이벤트
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: {
    roomId: string;
    message: string;
    type: 'text' | 'image' | 'file';
  }) => void;
  send_private_message: (data: {
    targetUserId: string;
    message: string;
    type: 'text' | 'image' | 'file';
  }) => void;
  typing_start: (data: { roomId: string }) => void;
  typing_stop: (data: { roomId: string }) => void;
  
  // 서버에서 클라이언트로 보내는 이벤트
  new_message: (data: {
    id: string;
    message: string;
    type: 'text' | 'image' | 'file';
    author: IUser;
    roomId: string;
    timestamp: Date;
  }) => void;
  private_message: (data: {
    id: string;
    message: string;
    type: 'text' | 'image' | 'file';
    author: IUser;
    targetUserId: string;
    timestamp: Date;
  }) => void;
  user_joined: (data: { user: IUser; roomId: string }) => void;
  user_left: (data: { user: IUser; roomId: string }) => void;
  user_typing: (data: { user: IUser; roomId: string }) => void;
  user_stopped_typing: (data: { user: IUser; roomId: string }) => void;
  notification: (data: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
  }) => void;
}

// Express Request 확장 타입
export interface IAuthenticatedRequest extends Express.Request {
  user?: IUser;
  file?: IUploadedFile;
  files?: IUploadedFile[];
}

// 환경 변수 타입
export interface IEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
}

// 유효성 검사 스키마 타입
export interface IValidationSchema {
  [key: string]: any;
}

// 에러 타입
export interface IAppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

// 로그 레벨 타입
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// 데이터베이스 연결 상태 타입
export type DatabaseConnectionState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';
