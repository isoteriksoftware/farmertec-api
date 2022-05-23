import express from 'express';
import { getFilesDir } from '../util/commons';

const router = express.Router();

/* static files */
router.use('/files', express.static(getFilesDir('avatars')));

// Protected routes

export default router;