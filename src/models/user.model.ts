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
        full_name: joi.string().min(2).max(100),
        phone: joi.string().min(11).max(15),
        address: joi.string().max(500),
        password: joi.string().min(6),
    }),
    initiatePasswordReset: joi.object({
        email: joi.string().email().max(50).required(),
    }),
    finalizePasswordReset: joi.object({
        new_password: joi.string().min(6).required(),
        confirm_password: joi.string().required().valid(joi.ref('new_password')),
        verification_code: joi.string().required(),
    }),
};

export const User = mongoose.model('User', schema);