// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: string[];
}

// 사용자 타입
export interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    fullName?: string;
  };
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// 게시물 타입
export interface Post {
  _id: string;
  title: string;
  content: string;
  author: User | string;
  category: string;
  tags: string[];
  images?: string[];
  likes: {
    count: number;
    users: string[];
  };
  comments: Comment[];
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// 댓글 타입
export interface Comment {
  _id: string;
  content: string;
  author: User | string;
  post: string;
  createdAt: string;
  updatedAt: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// 회원가입 데이터 타입
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
}

// 로그인 데이터 타입
export interface LoginData {
  email: string;
  password: string;
}

// Socket.io 이벤트 타입
export interface SocketEvents {
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
  
  new_message: (data: {
    id: string;
    message: string;
    type: 'text' | 'image' | 'file';
    author: User;
    roomId: string;
    timestamp: string;
  }) => void;
  private_message: (data: {
    id: string;
    message: string;
    type: 'text' | 'image' | 'file';
    author: User;
    targetUserId: string;
    timestamp: string;
  }) => void;
  user_joined: (data: { user: User; roomId: string }) => void;
  user_left: (data: { user: User; roomId: string }) => void;
  user_typing: (data: { user: User; roomId: string }) => void;
  user_stopped_typing: (data: { user: User; roomId: string }) => void;
  notification: (data: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
  }) => void;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  message: string;
  type: 'text' | 'image' | 'file';
  author: User;
  roomId: string;
  timestamp: string;
  isOwn?: boolean;
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  name: string;
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

// Socket 컨텍스트 타입
export interface SocketContextType {
  socket: any;
  connected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string, type?: 'text' | 'image' | 'file') => void;
  sendPrivateMessage: (targetUserId: string, message: string, type?: 'text' | 'image' | 'file') => void;
}
