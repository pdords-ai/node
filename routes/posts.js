const express = require('express');
const Joi = require('joi');
const Post = require('../models/Post');
const { authenticateToken, optionalAuth, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// 게시물 생성 스키마
const createPostSchema = Joi.object({
  title: Joi.string().max(200).required()
    .messages({
      'string.max': '제목은 최대 200자까지 가능합니다.',
      'any.required': '제목은 필수입니다.'
    }),
  content: Joi.string().max(5000).required()
    .messages({
      'string.max': '내용은 최대 5000자까지 가능합니다.',
      'any.required': '내용은 필수입니다.'
    }),
  category: Joi.string().valid('general', 'tech', 'lifestyle', 'travel', 'food', 'other').optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
  isPublished: Joi.boolean().optional()
});

// 게시물 업데이트 스키마
const updatePostSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(5000).optional(),
  category: Joi.string().valid('general', 'tech', 'lifestyle', 'travel', 'food', 'other').optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
  isPublished: Joi.boolean().optional()
});

// 댓글 생성 스키마
const createCommentSchema = Joi.object({
  content: Joi.string().max(1000).required()
    .messages({
      'string.max': '댓글은 최대 1000자까지 가능합니다.',
      'any.required': '댓글 내용은 필수입니다.'
    })
});

// 게시물 목록 조회
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      sort = 'newest',
      author 
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { isPublished: true };

    // 카테고리 필터
    if (category) {
      filter.category = category;
    }

    // 작성자 필터
    if (author) {
      filter.author = author;
    }

    // 검색 필터
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 정렬 설정
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { viewCount: -1, likesCount: -1 };
        break;
      case 'most_liked':
        sortOption = { likesCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await Post.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('게시물 목록 조회 에러:', error);
    res.status(500).json({
      error: '게시물 목록 조회 중 오류가 발생했습니다.',
      code: 'POSTS_FETCH_ERROR'
    });
  }
});

// 특정 게시물 조회
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('comments.author', 'username profile.firstName profile.lastName profile.avatar');

    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    // 비공개 게시물인 경우 작성자 또는 관리자만 접근 가능
    if (!post.isPublished) {
      if (!req.user || (req.user._id.toString() !== post.author._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({
          error: '이 게시물에 대한 접근 권한이 없습니다.',
          code: 'ACCESS_DENIED'
        });
      }
    }

    // 조회수 증가 (본인 게시물이 아닌 경우)
    if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
      await post.incrementViewCount();
    }

    res.json({ post });

  } catch (error) {
    console.error('게시물 조회 에러:', error);
    res.status(500).json({
      error: '게시물 조회 중 오류가 발생했습니다.',
      code: 'POST_FETCH_ERROR'
    });
  }
});

// 게시물 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      });
    }

    const { title, content, category, tags, isPublished } = value;

    const post = new Post({
      title,
      content,
      author: req.user._id,
      category: category || 'general',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true
    });

    await post.save();
    await post.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      message: '게시물이 성공적으로 생성되었습니다.',
      post
    });

  } catch (error) {
    console.error('게시물 생성 에러:', error);
    res.status(500).json({
      error: '게시물 생성 중 오류가 발생했습니다.',
      code: 'POST_CREATE_ERROR'
    });
  }
});

// 게시물 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updatePostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    // 권한 확인 (작성자 또는 관리자)
    if (req.user._id.toString() !== post.author.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '이 게시물을 수정할 권한이 없습니다.',
        code: 'EDIT_PERMISSION_DENIED'
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    ).populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: '게시물이 성공적으로 수정되었습니다.',
      post: updatedPost
    });

  } catch (error) {
    console.error('게시물 수정 에러:', error);
    res.status(500).json({
      error: '게시물 수정 중 오류가 발생했습니다.',
      code: 'POST_UPDATE_ERROR'
    });
  }
});

// 게시물 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    // 권한 확인 (작성자 또는 관리자)
    if (req.user._id.toString() !== post.author.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '이 게시물을 삭제할 권한이 없습니다.',
        code: 'DELETE_PERMISSION_DENIED'
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      message: '게시물이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('게시물 삭제 에러:', error);
    res.status(500).json({
      error: '게시물 삭제 중 오류가 발생했습니다.',
      code: 'POST_DELETE_ERROR'
    });
  }
});

// 좋아요 토글
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    const result = await post.toggleLike(req.user._id);

    res.json({
      message: result.liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.',
      liked: result.liked,
      likesCount: result.likesCount
    });

  } catch (error) {
    console.error('좋아요 토글 에러:', error);
    res.status(500).json({
      error: '좋아요 처리 중 오류가 발생했습니다.',
      code: 'LIKE_TOGGLE_ERROR'
    });
  }
});

// 댓글 추가
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.details.map(detail => detail.message)
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    const comment = {
      author: req.user._id,
      content: value.content
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.author', 'username profile.firstName profile.lastName profile.avatar');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: '댓글이 성공적으로 추가되었습니다.',
      comment: newComment
    });

  } catch (error) {
    console.error('댓글 추가 에러:', error);
    res.status(500).json({
      error: '댓글 추가 중 오류가 발생했습니다.',
      code: 'COMMENT_CREATE_ERROR'
    });
  }
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: '게시물을 찾을 수 없습니다.',
        code: 'POST_NOT_FOUND'
      });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        error: '댓글을 찾을 수 없습니다.',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    // 권한 확인 (댓글 작성자 또는 관리자)
    if (req.user._id.toString() !== comment.author.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '이 댓글을 삭제할 권한이 없습니다.',
        code: 'COMMENT_DELETE_PERMISSION_DENIED'
      });
    }

    comment.remove();
    await post.save();

    res.json({
      message: '댓글이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('댓글 삭제 에러:', error);
    res.status(500).json({
      error: '댓글 삭제 중 오류가 발생했습니다.',
      code: 'COMMENT_DELETE_ERROR'
    });
  }
});

// 인기 게시물 조회
router.get('/popular/list', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popularPosts = await Post.getPopularPosts(parseInt(limit));

    res.json({ posts: popularPosts });

  } catch (error) {
    console.error('인기 게시물 조회 에러:', error);
    res.status(500).json({
      error: '인기 게시물 조회 중 오류가 발생했습니다.',
      code: 'POPULAR_POSTS_ERROR'
    });
  }
});

// 카테고리별 게시물 조회
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.getPostsByCategory(category, parseInt(page), parseInt(limit));
    const total = await Post.countDocuments({ category, isPublished: true });

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('카테고리별 게시물 조회 에러:', error);
    res.status(500).json({
      error: '카테고리별 게시물 조회 중 오류가 발생했습니다.',
      code: 'CATEGORY_POSTS_ERROR'
    });
  }
});

module.exports = router;
