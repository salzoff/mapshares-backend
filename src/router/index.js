import express from 'express';
import boxRouter from '../controller/box';
import userRouter from '../controller/user';

const router = express.Router();

router.use('/', boxRouter);
router.use('/', userRouter);
export default router;