const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// 프로필 업데이트 스키마
const updateProfileSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    bio: Joi.string().max(500).optional()
  }).optional(),
  username: Joi.string().alphanum().min(3).max(20).optional()
});

// 사용자 역할 변경 스키마 (관리자용)
const updateRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin', 'moderator').required(),
  isActive: Joi.boolean().optional()
});

// 모든 사용자 조회 (관리자용)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    res.status(500).json({
      error: '사용자 목록 조회 중 오류가 발생했습니다.',
      code: 'USERS_FETCH_ERROR'
    });
  }
});

// 특정 사용자 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 본인 정보이거나 관리자인 경우에만 상세 정보 제공
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '이 사용자 정보에 대한 접근 권한이 없습니다.',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('사용자 조회 에러:', error);
    res.status(500).json({
      error: '사용자 조회 중 오류가 발생했습니다.',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// 내 프로필 업데이트
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      });
    }

    const { profile, username } = value;

    // 사용자명 중복 확인 (변경하는 경우)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          error: '이미 사용 중인 사용자명입니다.',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    const updateData = {};
    if (profile) {
      updateData.profile = { ...req.user.profile, ...profile };
    }
    if (username) {
      updateData.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: updatedUser
    });

  } catch (error) {
    console.error('프로필 업데이트 에러:', error);
    res.status(500).json({
      error: '프로필 업데이트 중 오류가 발생했습니다.',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// 사용자 역할 변경 (관리자용)
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      });
    }

    const { role, isActive } = value;

    // 본인의 역할은 변경할 수 없음
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        error: '본인의 역할은 변경할 수 없습니다.',
        code: 'CANNOT_CHANGE_OWN_ROLE'
      });
    }

    const updateData = { role };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: updatedUser
    });

  } catch (error) {
    console.error('사용자 역할 변경 에러:', error);
    res.status(500).json({
      error: '사용자 역할 변경 중 오류가 발생했습니다.',
      code: 'ROLE_UPDATE_ERROR'
    });
  }
});

// 계정 삭제 (본인 또는 관리자)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user._id.toString();

    // 본인 계정이거나 관리자인 경우에만 삭제 가능
    if (userId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '이 계정을 삭제할 권한이 없습니다.',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: userId === currentUserId 
        ? '계정이 성공적으로 삭제되었습니다.' 
        : '사용자 계정이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('계정 삭제 에러:', error);
    res.status(500).json({
      error: '계정 삭제 중 오류가 발생했습니다.',
      code: 'ACCOUNT_DELETE_ERROR'
    });
  }
});

// 사용자 통계 (관리자용)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const moderatorUsers = await User.countDocuments({ role: 'moderator' });
    
    // 최근 가입자 (최근 7일)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      moderatorUsers,
      regularUsers: totalUsers - adminUsers - moderatorUsers,
      recentUsers
    });

  } catch (error) {
    console.error('사용자 통계 조회 에러:', error);
    res.status(500).json({
      error: '사용자 통계 조회 중 오류가 발생했습니다.',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

module.exports = router;
