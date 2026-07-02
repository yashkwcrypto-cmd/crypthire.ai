import Joi from 'joi';

export const candidateSubmissionSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name must not exceed 255 characters',
    'any.required': 'Full name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]{10,}$/).optional().allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  resumeUrl: Joi.string().required().messages({
    'any.required': 'Resume URL is required',
  }),
});
