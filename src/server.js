import express from 'express';
import cors from 'cors';
import router from './router/index.js';

var app = express();

app.use(cors());
app.use('/', router);

export default app;