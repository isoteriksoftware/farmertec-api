import mongoose from 'mongoose';
import joi from 'joi';
import { BusinessStatus, BusinessType } from '../util/enums';

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(BusinessType),
  },
  banner: {
    type: String,
    unique: true,
    required: true,
  },
  logo: {
    type: String,
    unique: true,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  account_name: {
    type: String,
    required: true,
  },
  account_number: {
    type: String,
    unique: true,
    required: true,
  },
  bank_name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  twitter: {
    type: String,
    default: null,
  },
  facebook: {
    type: String,
    default: null,
  },
  instagram: {
    type: String,
    default: null,
  },
  linkedin: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(BusinessStatus),
    default: BusinessStatus.INACTIVE,
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const validationRules = {
  create: joi.object({
    name: joi.string().max(100).required(),
    description: joi.string().max(5000).required(),
    type: joi.string().valid(...Object.values(BusinessType)).required(),
    address: joi.string().max(200).required(),
    country: joi.string().max(30).required(),
    city: joi.string().max(30).required(),
    state: joi.string().max(30).required(),
    account_name: joi.string().required(),
    account_number: joi.string().length(10).required(),
    bank_name: joi.string().required(),
    twitter: joi.string().required(),
    facebook: joi.string().required(),
    instagram: joi.string().required(),
    linkedin: joi.string().required(),
  }),
  update: joi.object({
    name: joi.string().max(100),
    description: joi.string().max(5000),
    address: joi.string().max(200),
    country: joi.string().max(30),
    city: joi.string().max(30),
    state: joi.string().max(30),
    account_name: joi.string(),
    account_number: joi.string().length(10),
    bank_name: joi.string(),
    twitter: joi.string(),
    facebook: joi.string(),
    instagram: joi.string(),
    linkedin: joi.string(),
  }),
};

export const Business = mongoose.model('Business', schema);