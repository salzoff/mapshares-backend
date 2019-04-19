import express from 'express';
import bodyParser from 'body-parser';
import BoxService from '../service/BoxService';
import AuthService from '../service/AuthService';

const authService = new AuthService();
const boxService = new BoxService();
const boxRouter = express.Router();
boxRouter.use(bodyParser.json());
boxRouter.use(bodyParser.urlencoded({ extended: true }));
boxRouter.use((req, res, next) => {
    if (!req.session.user.permissions.includes('SHOW_BOX_LOCATION') && (!req.query.latitude || !req.query.longitude)) {
        res.json({ error: 'User needs to have SHOW_BOX_LOCATION permission or send position data to perform this request' }).status(403).end();
    } else {
        next();
    }
});
boxRouter.use((req, res, next) => {
    if (req.query.latitude && req.query.longitude) {
        authService.updateUserLocation(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude));
        next();
    }
});
boxRouter.get('/boxesforlocation', (req, res) => {
    boxService.getBoxesNearby(req.session.user).then(result => {
        res.json(result);
    });
});

boxRouter.get('/box/:id', (req, res) => {
    boxService.getBoxById(req.params.id, req.session.user).then(result => {
        res.json(result);
    }).catch((e) => {
        console.log(e);
        res.json({ error: e.message }).status(400);
    });
});

export default boxRouter;