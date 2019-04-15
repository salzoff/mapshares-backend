import express from 'express';
import bodyParser from 'body-parser';

const boxRouter = express.Router();
boxRouter.use(bodyParser.json());
boxRouter.use(bodyParser.urlencoded({ extended: true }));

boxRouter.get('/boxesnearby', (req, res) => {
    console.log(req.query);
    res.json({ latitude: req.query.latitude, longitude: req.query.longitude });
});

export default boxRouter;