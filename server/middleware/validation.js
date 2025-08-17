const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Validation rules for sending messages
const validateSendMessage = [
  body('conversationId')
    .isMongoId()
    .withMessage('Valid conversation ID is required'),

  // Allow sending with either content or attachment
  body('content')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters'),

  body('attachment')
    .optional()
    .custom((att) => {
      if (!att) return true;
      if (typeof att !== 'object') throw new Error('Invalid attachment');
      if (!att.url && !att.path) throw new Error('Attachment must include url or path');
      return true;
    }),

  body().custom((_, { req }) => {
    const hasContent = (req.body.content || '').trim().length > 0;
    const att = req.body.attachment || {};
    const hasAttachment = !!(att && (att.url || att.path));
    if (!hasContent && !hasAttachment) {
      throw new Error('Either content or attachment is required');
    }
    return true;
  }),

  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video'])
    .withMessage('Invalid message type'),

  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid message ID')
];

// Validation rules for creating private conversation
const validateCreatePrivateConversation = [
  body('participantId')
    .isMongoId()
    .withMessage('Valid participant ID is required')
];

// Validation rules for creating group conversation
const validateCreateGroupConversation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Group name must be between 2 and 50 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Group description cannot exceed 200 characters'),
    
  body('participantIds')
    .isArray({ min: 2 })
    .withMessage('At least 2 participants are required')
    .custom((value) => {
      if (!value.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('All participant IDs must be valid MongoDB ObjectIds');
      }
      return true;
    })
];

// Validation rules for updating group conversation
const validateUpdateGroupConversation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Group name must be between 2 and 50 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Group description cannot exceed 200 characters')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateSendMessage,
  validateCreatePrivateConversation,
  validateCreateGroupConversation,
  validateUpdateGroupConversation,
  checkValidation
};
