const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// 파일 필터
const fileFilter = (req, file, cb) => {
  // 이미지 파일만 허용
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

// Multer 인스턴스 생성
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5 // 최대 5개 파일
  }
});

// 단일 파일 업로드
router.post('/single', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '업로드할 파일을 선택해주세요.',
        code: 'NO_FILE'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    res.json({
      message: '파일이 성공적으로 업로드되었습니다.',
      file: fileInfo
    });

  } catch (error) {
    console.error('파일 업로드 에러:', error);
    res.status(500).json({
      error: '파일 업로드 중 오류가 발생했습니다.',
      code: 'UPLOAD_ERROR'
    });
  }
});

// 다중 파일 업로드
router.post('/multiple', authenticateToken, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '업로드할 파일을 선택해주세요.',
        code: 'NO_FILES'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));

    res.json({
      message: `${files.length}개의 파일이 성공적으로 업로드되었습니다.`,
      files: files
    });

  } catch (error) {
    console.error('다중 파일 업로드 에러:', error);
    res.status(500).json({
      error: '파일 업로드 중 오류가 발생했습니다.',
      code: 'UPLOAD_ERROR'
    });
  }
});

// 프로필 이미지 업로드
router.post('/profile', authenticateToken, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '업로드할 이미지를 선택해주세요.',
        code: 'NO_FILE'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    res.json({
      message: '프로필 이미지가 성공적으로 업로드되었습니다.',
      file: fileInfo
    });

  } catch (error) {
    console.error('프로필 이미지 업로드 에러:', error);
    res.status(500).json({
      error: '프로필 이미지 업로드 중 오류가 발생했습니다.',
      code: 'PROFILE_UPLOAD_ERROR'
    });
  }
});

// 파일 삭제
router.delete('/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: '파일을 찾을 수 없습니다.',
        code: 'FILE_NOT_FOUND'
      });
    }

    // 파일 삭제
    fs.unlinkSync(filePath);

    res.json({
      message: '파일이 성공적으로 삭제되었습니다.',
      filename: filename
    });

  } catch (error) {
    console.error('파일 삭제 에러:', error);
    res.status(500).json({
      error: '파일 삭제 중 오류가 발생했습니다.',
      code: 'FILE_DELETE_ERROR'
    });
  }
});

// 업로드된 파일 목록 조회
router.get('/list', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // 업로드 디렉토리의 파일 목록 조회
    const files = fs.readdirSync(uploadDir)
      .map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          size: stats.size,
          url: `/uploads/${filename}`,
          uploadedAt: stats.birthtime
        };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(skip, skip + parseInt(limit));

    const total = fs.readdirSync(uploadDir).length;

    res.json({
      files,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('파일 목록 조회 에러:', error);
    res.status(500).json({
      error: '파일 목록 조회 중 오류가 발생했습니다.',
      code: 'FILE_LIST_ERROR'
    });
  }
});

// 파일 정보 조회
router.get('/info/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: '파일을 찾을 수 없습니다.',
        code: 'FILE_NOT_FOUND'
      });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      size: stats.size,
      url: `/uploads/${filename}`,
      uploadedAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };

    res.json({ file: fileInfo });

  } catch (error) {
    console.error('파일 정보 조회 에러:', error);
    res.status(500).json({
      error: '파일 정보 조회 중 오류가 발생했습니다.',
      code: 'FILE_INFO_ERROR'
    });
  }
});

// 에러 핸들러
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: '파일 크기가 너무 큽니다.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: '업로드 가능한 파일 개수를 초과했습니다.',
        code: 'TOO_MANY_FILES'
      });
    }
  }

  if (error.message === '이미지 파일만 업로드 가능합니다.') {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  console.error('업로드 에러:', error);
  res.status(500).json({
    error: '파일 업로드 중 오류가 발생했습니다.',
    code: 'UPLOAD_ERROR'
  });
});

module.exports = router;
