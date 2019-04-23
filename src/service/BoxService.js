import admin from 'firebase-admin';
import { boxCollection, geoCollection, firestore } from '../../firebaseConfig.js';
import { geoDistance } from '../helper/location';
import config from '../config';
import { calculateApproximateNumber } from '../helper/basic';

let instance = false;

export default class BoxService {
    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;
    }

    getObjectsForLocation(user, latitude, longitude, radius, itemTypes = [1, 2, 3 ,4]) {
        const userLocation = {
            lat: latitude,
            lng: longitude
        };
        return new Promise((resolve, reject) => {
            geoCollection.near({
                center: new admin.firestore.GeoPoint(latitude, longitude),
                radius: radius
            }).get().then(result => {
                const responseObj = {};
                let entryObjects = [];
                result.forEach(entry => {
                    entryObjects.push(Object.assign({ id: entry.id }, entry.data()));
                });
                entryObjects = entryObjects.filter(entry => itemTypes.includes(entry.objectType));
                entryObjects.forEach(entryData => {
                    switch (entryData.objectType) {
                        case 1:
                            if (user.permissions.includes('SHOW_USER_LOCATION')) {
                                if (!responseObj.user) {
                                    responseObj.user = [];
                                }
                                responseObj.user.push(entryData);
                            }
                            break;
                        case 2:
                            if (!responseObj.box) {
                                responseObj.box = [];                                
                            }
                            if (false && user.permissions.includes('SHOW_BOX_LOCATION')) {
                                responseObj.box.push(entryData);
                            } else {
                                const distance = geoDistance(userLocation, {
                                    lat: entryData.coordinates.latitude,
                                    lng: entryData.coordinates.longitude
                                });
                                if (distance <= config.boxLocationMaxDistance) {
                                    responseObj.box.push({
                                        position: {
                                            latitude: entryData.coordinates.latitude,
                                            longitude: entryData.coordinates.longitude
                                        },
                                        id: entryData.id
                                    });
                                } else if (distance <= config.boxQueryDistance) {
                                    if (!responseObj.boxNearby) {
                                        responseObj.boxNearby = [];
                                    }
                                    responseObj.boxNearby.push({
                                        id: entryData.id,
                                        maxDistance: calculateApproximateNumber(distance, 50)
                                    });
                                }
                            }
                            break;
                        case 3:
                            if (user.permissions.includes('SHOW_HINT')) {
                                if (!responseObj.hint) {
                                    responseObj.hint = [];                                
                                }
                                responseObj.hint.push({
                                    position: {
                                        latitude: entryData.coordinates.latitude,
                                        longitude: entryData.coordinates.longitude
                                    },
                                    radius: entryData.distanceRange,
                                    id: entryData.id
                                });
                            }
                            break;
                        case 4:
                            if (user.permissions.includes('SHOW_FOUND_BOX')) {
                                if (!responseObj.foundBox) {
                                    responseObj.foundBox = [];                                
                                }
                                responseObj.foundBox.push({
                                    position: {
                                        latitude: entryData.coordinates.latitude,
                                        longitude: entryData.coordinates.longitude
                                    },
                                    id: entryData.id
                                });
                            }
                            break;
                        default:
                            break;
                    }
                });
                resolve(responseObj);
            });
        });
    }

    getBoxList(user, latitude, longitude, start = 0, limit = 10) {
        const userLocation = {
            lat: latitude,
            lng: longitude
        };
        return new Promise((resolve, reject) => {
            geoCollection.near({
                center: new admin.firestore.GeoPoint(latitude, longitude),
                radius: 20000
            }).get().then(result => {
                let boxWithDistances = [];
                result.forEach(entry => {
                    const entryData = entry.data();
                    if (entryData.objectType !== 2) {
                        return;
                    }
                    const distance = geoDistance(userLocation, {
                        lat: entryData.coordinates.latitude,
                        lng: entryData.coordinates.longitude
                    });
                    const box = {
                        id: entry.id,
                        maxDistance: calculateApproximateNumber(distance, 50)
                    };
                    boxWithDistances.push(box);
                });
                boxWithDistances = boxWithDistances.sort((a, b) => {
                    return a.maxDistance - b.maxDistance
                });
                resolve(boxWithDistances.slice(start, limit));
            });
        });
    }

    getBoxById(id, userData) {
        return new Promise((resolve, reject) => {       
            return boxCollection.doc(id).get().then(result => {
                const boxData = result.data();
                const box = {
                    id: boxData.id,
                    title: boxData.title,
                    description: boxData.description,
                    images: boxData.images,
                    value: boxData.value,
                    createdAt: boxData.createdAt.toDate(),
                    position: {
                        latitude: boxData.position.latitude,
                        longitude: boxData.position.longitude
                    }
                };
                if (userData.permissions.includes('SHOW_BOX_LOCATION')) {
                    if (boxData.foundBy) {
                        boxData.foundBy.get().then(user => {
                            box.foundBy = user.data().username;
                            resolve(box);
                        });
                    } else {
                        resolve(box);
                    }
                } else {
                    const distance = geoDistance({
                        lat: boxData.position.latitude,
                        lng: boxData.position.longitude
                    }, {
                        lat: userData.lastLocation.latitude,
                        lng: userData.lastLocation.longitude
                    });
                    if (distance < config.boxLocationMaxDistance) {
                        if (boxData.foundBy) {
                            boxData.foundBy.get().then(user => {
                                console.log(user);
                                box.foundBy = user.username;
                                resolve(box);
                            });
                        } else {
                            resolve(box);
                        }
                    } else {
                        throw new Error('Box not found');
                    }
                }
            }).catch((e) => {
                throw new Error('Box not found');
            });
        });
    }
}