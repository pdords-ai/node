// 필요한 라이브러리들을 가져옵니다
import express, { Request, Response, Router } from 'express';        // 웹 서버를 만드는 도구
import jwt from 'jsonwebtoken';       // 사용자 인증을 위한 토큰을 만드는 도구
import Joi from 'joi';               // 입력 데이터를 검증하는 도구
import User from '../models/User';    // 사용자 데이터 모델
import { authenticateToken } from '../middleware/auth'; // 사용자 인증 미들웨어
import { IAuthenticatedRequest, IApiResponse, IUser } from '../types';

// Express 라우터를 만듭니다 (URL 경로별로 다른 기능을 실행할 수 있게 해주는 도구)
const router: Router = express.Router();

// 회원가입 데이터 유효성 검사 스키마 (사용자가 입력한 정보가 올바른지 확인하는 규칙)
// 마치 신분증을 발급받을 때 필요한 정보들을 확인하는 것과 같아요
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(20).required()
    .messages({
      'string.alphanum': '사용자명은 영문자와 숫자만 사용 가능합니다.',
      'string.min': '사용자명은 최소 3자 이상이어야 합니다.',
      'string.max': '사용자명은 최대 20자까지 가능합니다.',
      'any.required': '사용자명은 필수입니다.'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': '올바른 이메일 형식이 아닙니다.',
      'any.required': '이메일은 필수입니다.'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': '비밀번호는 최소 6자 이상이어야 합니다.',
      'any.required': '비밀번호는 필수입니다.'
    }),
  profile: Joi.object({
    firstName: Joi.string().max(50).optional(),  // 이름 (선택사항, 최대 50자)
    lastName: Joi.string().max(50).optional(),   // 성 (선택사항, 최대 50자)
    bio: Joi.string().max(500).optional()        // 자기소개 (선택사항, 최대 500자)
  }).optional()
});

// 로그인 데이터 유효성 검사 스키마 (로그인할 때 필요한 정보를 확인하는 규칙)
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': '올바른 이메일 형식이 아닙니다.',
      'any.required': '이메일은 필수입니다.'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': '비밀번호는 필수입니다.'
    })
});

// JWT 토큰 생성 함수
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 회원가입
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // 입력 데이터 유효성 검사
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      const response: IApiResponse = {
        success: false,
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      };
      res.status(400).json(response);
      return;
    }

    const { username, email, password, profile } = value;

    // 이메일 중복 확인
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const response: IApiResponse = {
        success: false,
        error: '이미 사용 중인 이메일 또는 사용자명입니다.',
        code: 'USER_EXISTS'
      };
      res.status(409).json(response);
      return;
    }

    // 새 사용자 생성
    const user = new User({
      username,
      email,
      password,
      profile: profile || {}
    });

    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);

    const response: IApiResponse<{ token: string; user: IUser }> = {
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role
        }
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('회원가입 에러:', error);
    const response: IApiResponse = {
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.',
      code: 'REGISTRATION_ERROR'
    };
    res.status(500).json(response);
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // 입력 데이터 유효성 검사
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      const response: IApiResponse = {
        success: false,
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      };
      res.status(400).json(response);
      return;
    }

    const { email, password } = value;

    // 사용자 조회 (비밀번호 포함)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const response: IApiResponse = {
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_CREDENTIALS'
      };
      res.status(401).json(response);
      return;
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      const response: IApiResponse = {
        success: false,
        error: '비활성화된 계정입니다.',
        code: 'ACCOUNT_INACTIVE'
      };
      res.status(401).json(response);
      return;
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const response: IApiResponse = {
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_CREDENTIALS'
      };
      res.status(401).json(response);
      return;
    }

    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);

    const response: IApiResponse<{ token: string; user: IUser }> = {
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('로그인 에러:', error);
    const response: IApiResponse = {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.',
      code: 'LOGIN_ERROR'
    };
    res.status(500).json(response);
  }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const response: IApiResponse<{ user: IUser }> = {
      success: true,
      data: {
        user: req.user!
      }
    };
    res.json(response);
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    const response: IApiResponse = {
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.',
      code: 'USER_INFO_ERROR'
    };
    res.status(500).json(response);
  }
});

// 토큰 검증
router.post('/verify', authenticateToken, (req: IAuthenticatedRequest, res: Response): void => {
  const response: IApiResponse<{ valid: boolean; user: IUser }> = {
    success: true,
    data: {
      valid: true,
      user: req.user!
    }
  };
  res.json(response);
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', authenticateToken, (req: IAuthenticatedRequest, res: Response): void => {
  const response: IApiResponse = {
    success: true,
    message: '로그아웃되었습니다.'
  };
  res.json(response);
});

// 비밀번호 변경
router.put('/change-password', authenticateToken, async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const response: IApiResponse = {
        success: false,
        error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        code: 'MISSING_PASSWORDS'
      };
      res.status(400).json(response);
      return;
    }

    if (newPassword.length < 6) {
      const response: IApiResponse = {
        success: false,
        error: '새 비밀번호는 최소 6자 이상이어야 합니다.',
        code: 'PASSWORD_TOO_SHORT'
      };
      res.status(400).json(response);
      return;
    }

    // 현재 사용자 조회 (비밀번호 포함)
    const user = await User.findById(req.user!._id).select('+password');
    
    if (!user) {
      const response: IApiResponse = {
        success: false,
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      };
      res.status(404).json(response);
      return;
    }
    
    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      const response: IApiResponse = {
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_CURRENT_PASSWORD'
      };
      res.status(401).json(response);
      return;
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();

    const response: IApiResponse = {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    };

    res.json(response);

  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    const response: IApiResponse = {
      success: false,
      error: '비밀번호 변경 중 오류가 발생했습니다.',
      code: 'PASSWORD_CHANGE_ERROR'
    };
    res.status(500).json(response);
  }
});

export default router;
