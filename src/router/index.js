import express from 'express';
import boxRouter from '../controller/box';
import userRouter from '../controller/user';

const router = express.Router();

router.use('/box', boxRouter);
router.use('/user', userRouter);
export default router;