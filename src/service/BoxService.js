import { boxCollection, geoCollection, firestore } from '../../firebaseConfig.js';
import { geoDistance } from '../helper/location';
import config from '../config';
let instance = false;

export default class BoxService {
    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;
    }

    getBoxesForLocation(latitude, longitude) {
        console.log(firestore.collection('box'));
        console.log(boxCollection);
        return boxCollection.doc('PqcQav50relKB12KarGL').get().then(result => {
            return result;
        });
    }

    getBoxById(id, userData) {
        return boxCollection.doc(id).get().then(result => {
            const boxData = result.data();
            if (userData.permissions.includes('SHOW_BOX_LOCATION')) {
                return boxData;
            } else {
                const distance = geoDistance({
                    lat: boxData.position.latitude,
                    lng: boxData.position.longitude
                }, {
                    lat: userData.lastLocation.latitude,
                    lng: userData.lastLocation.longitude
                });
                console.log(distance);
                if (distance < config.boxLocationMaxDistance) {
                    return boxData;
                } else {
                    throw new Error('Box not found');
                }
            }
        }).catch(() => {
            throw new Error('Box not found');
        });
    }
}