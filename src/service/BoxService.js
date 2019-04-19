import admin from 'firebase-admin';
import { boxCollection, geoCollection, firestore } from '../../firebaseConfig.js';
import { geoDistance } from '../helper/location';
import config from '../config';
import { deepStrictEqual } from 'assert';
let instance = false;

export default class BoxService {
    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;
    }

    getBoxesForLocation(user, latitude, longitude) {
        console.log(firestore.collection('box'));
        console.log(boxCollection);
        const userLocation = {
            lat: latitude,
            lng: longitude
        };
        geoCollection.near({
            center: new admin.firestore.GeoPoint(latitude, longitude),
            radius: config.boxQueryDistance
        }).get().then(result => {
            responseObj = {};
            result.forEach(entry => {
                const entryData = entry.data();
                switch (entryData.objectType) {
                    case 1:
                        if (user.permissions.includes('SHOW_USER_LOCATION')) {
                            responseObj.user.push(entryData);
                        }
                        break;
                    case 2:
                        if (user.permissions.includes('SHOW_BOX_LOCATION')) {
                            responseObj.box.push(entryData);
                        } else {
                            const distance = geoDistance(userLocation, {
                                lat: entryData.latitude,
                                lng: entryData.longitude
                            });
                            if (distance <= config.boxLocationMaxDistance) {
                                responseObj.box.push({
                                    position: entryData.position,
                                    id: entry.id,
                                    title: entryData.title,
                                    value: entryData.value
                                })
                            } else {
                                responseObj.boxNearby.push({
                                    id: entry.id,
                                    title: entryData.title,
                                    distance: distance
                                });
                            }
                        }
                    case 3:
                }
            })
        });
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