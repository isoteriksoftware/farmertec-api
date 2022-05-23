import express from 'express';
import {
  authenticateUser, checkJwt, createUser, finalizePasswordReset, getAccountAvailability, getNewTokens, getUserData, initiatePasswordReset,
  postAuthentication, updateUser,
} from '../controllers/user.controller';
import protectedRoutes from './protected.routes';

const router = express.Router();

router.post('/', createUser);
router.post('/availability', getAccountAvailability);
router.get('/authenticate', authenticateUser);
router.post('/password_reset/init', initiatePasswordReset);
router.post('/password_reset/finalize', finalizePasswordReset);

// Validate access/refresh token
router.use(checkJwt);

// Protected routes
router.get('/token', getNewTokens);
router.use(postAuthentication);
router.get('/', getUserData);
router.put('/', updateUser);

router.use(protectedRoutes);

export default router;