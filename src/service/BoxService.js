import admin from 'firebase-admin';
import moment from 'moment';
import { boxCollection, geoCollection, firestore, storage } from '../../firebaseConfig.js';
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
                            if (false && user.permissions.includes('SHOW_BOX_LOCATION')) {
                                responseObj.box.push(entryData);
                            } else {
                                const distance = geoDistance(userLocation, {
                                    lat: entryData.coordinates.latitude,
                                    lng: entryData.coordinates.longitude
                                });
                                console.log(distance);
                                if (distance <= config.boxLocationMaxDistance) {
                                    if (!responseObj.box) {
                                        responseObj.box = [];                                
                                    }
                                    responseObj.box.push({
                                        position: {
                                            latitude: entryData.coordinates.latitude,
                                            longitude: entryData.coordinates.longitude
                                        },
                                        id: entryData.id
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
                let box = {
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
                this.completeUserData(box, boxData).then(box => {
                    if (userData.permissions.includes('SHOW_BOX_LOCATION')) {
                        resolve(box);
                    } else {
                        const distance = geoDistance({
                            lat: boxData.position.latitude,
                            lng: boxData.position.longitude
                        }, {
                            lat: userData.lastLocation.latitude,
                            lng: userData.lastLocation.longitude
                        });
                        if (distance < config.boxLocationMaxDistance || boxData.foundBy) {
                            console.log('test1');
                            resolve(box);
                        } else {
                            console.log('test2');
                            box.maxDistance = calculateApproximateNumber(distance, 50);
                            delete box.position;
                            delete box.value;
                            console.log(box);
                            resolve(box);
                        }
                    }
                });
            }).catch((e) => {
                console.log(e);
                reject(new Error('Box not found'));
            });
        });
    }

    completeUserData(box, boxData) {
        return new Promise((resolve, reject) => {
            if (boxData.foundBy) {
                boxData.foundBy.get().then(user => {
                    const userData = user.data();
                    box.foundBy = userData.username;
                    if (userData.imageUrl) {
                        const fileRef = storage.bucket().file(userData.imageUrl);
                        fileRef.getSignedUrl({ action: 'read', expires: moment().add(7, 'days').toDate() }).then(urls => {
                            if (urls.length > 0) {
                                box.foundByImage = urls[0];
                            }
                            resolve(box);
                        });
                    }
                });
            } else {
                resolve(box);
            }

        });
    }
}