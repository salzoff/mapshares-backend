import express from 'express';
import boxRouter from '../controller/box';

const router = express.Router();

router.use('/', boxRouter);

export default boxRouter;