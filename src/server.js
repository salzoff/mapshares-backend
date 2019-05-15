import express from 'express';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import router from './router/index.js';
import { sessionInstance } from '../firebaseConfig';
import AuthService from './service/AuthService';

const authService = new AuthService();
const app = express();

app.use(cors());
app.use(bearerToken());
app.use(sessionInstance);
app.use((req, res, next) => {
    console.log('test');
    if (!req.session.user) {
        authService.getUserData(req.token)
            .then((user) => {
                if (!user.coveredDistance) {
                    user.coveredDistance = 0;
                }
                req.session.user = user;
                next();
            })
            .catch((e) => {
                res.status(403).end();
            });
    } else {
        next();
    }
});
app.use('/', router);

export default app;