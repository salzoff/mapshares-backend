import express from 'express';
import bodyParser from 'body-parser';
import AuthService from '../service/AuthService';

const authService = new AuthService();
const userRouter = new express.Router();
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: true }));

userRouter.get('/updateLocation', (req, res) => {
    if (req.query.latitude && req.query.longitude) {
        if (authService.checkForFraud(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude))) {
            authService.updateUserLocation(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude));
            res.status(200).end();
        }
    } else {
        res.json({ error: 'Missing location data' }).status(403).end();
    }
});

export default userRouter;