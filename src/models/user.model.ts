import mongoose from 'mongoose';
import joi from 'joi';

const schema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER',
    },
    email: {
        type: String,
        unique: true,
        required: true,
        max: 50,
    },
    full_name: {
        type: String,
        max: 100,
        default: '',
    },
    phone: {
        type: String,
        default: '',
        max: 20,
    },
    address: {
        type: String,
        max: 500,
        default: '',
    },
    avatar: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        required: true,
    },
    id_token: {
        type: String,
        required: true,
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const validationRules = {
    create: joi.object({
        email: joi.string().email().max(50).required(),
        full_name: joi.string().min(2).max(100).required(),
        phone: joi.string().min(11).max(15).required(),
        address: joi.string().max(500).required(),
        password: joi.string().min(6).required(),
    }),
    update: joi.object({
        email: joi.string().email().max(50),
        full_name: joi.string().max(100),
        phone: joi.string().min(11).max(15),
        password: joi.string().min(6),
        confirm_password: joi.string().valid(joi.ref('password')),
        gender: joi.string().valid('Male', 'Female'),
        relationship: joi.string().valid('Single', 'Married', 'Divorced', 'Rather not say'),
    }),
    initiatePasswordReset: joi.object({
        email: joi.string().email().max(50).required(),
    }),
    finalizePasswordReset: joi.object({
        new_password: joi.string().min(6).required(),
        confirm_password: joi.string().required().valid(joi.ref('new_password')),
        verification_code: joi.string().required(),
    }),
    updateNextOfKin: joi.object({
        full_name: joi.string().max(100),
        phone: joi.string().min(11).max(15),
        gender: joi.string().valid('Male', 'Female'),
    }),
    updateNotificationsSettings: joi.object({
        allow_transaction_notifications: joi.boolean().valid(true, false),
        allow_pool_notifications: joi.boolean().valid(true, false),
    }),
    transferTokens: joi.object({
        token_type: joi.string().valid('FMB', 'BUSD').required(),
        address: joi.string().required(),
        amount: joi.number().greater(0).required(),
    }),
};

export const User = mongoose.model('User', schema);