import express from 'express';
import publicRoutes from './public.routes';
import userRoutes from './user.routes';

const router = express.Router();

router.use(publicRoutes);
router.use('/user', userRoutes);

export default router;