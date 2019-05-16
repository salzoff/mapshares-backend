import express from 'express';
import bodyParser from 'body-parser';
import BoxService from '../service/BoxService';
import AuthService from '../service/AuthService';
import config from '../config';
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
        if (authService.checkForFraud(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude))) {
            next();
        } else {
            res.json({ error: 'Too much distance covered: Potential fraud'}).status(400).end();
        }
    }
});
boxRouter.get('/formap', (req, res) => {
    boxService.getObjectsForLocation(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude), config.mapQueryRadius, [2, 3, 4]).then(result => {
        res.json(result);
    });
});

boxRouter.get('/nearby', (req, res) => {
    boxService.getObjectsForLocation(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude), config.boxQueryDistance, [2, 4]).then(result => {
        res.json(result);
    });
});

boxRouter.get('/list', (req, res) => {
    boxService.getBoxList(req.session.user, parseFloat(req.query.latitude), parseFloat(req.query.longitude), req.query.start ? req.query.start : 0, req.query.limit ? req.query.limit : 10).then(result => {
        res.json(result);
    });
});

boxRouter.get('/:id', (req, res) => {
    boxService.getBoxById(req.params.id, req.session.user).then(result => {
        res.json(result);
    }).catch((e) => {
        console.log(e);
        res.json({ error: e.message }).status(400);
    });
});

export default boxRouter;