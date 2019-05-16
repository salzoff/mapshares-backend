import axios from 'axios';
import admin from 'firebase-admin';
import { userCollection, userProfileCollection } from '../../firebaseConfig';
import { extractPlainValuesAndArrays } from '../helper/basic';
import { geoDistance } from '../helper/location';
import { UserRefreshClient } from 'google-auth-library';

let instance = false;
const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyDmDzfawPIvp3LG6g2WWzcJX9MHZZmLrLM';
const authRequest = axios.create({
    baseURL: url
});
export default class AuthService {
    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;
    }

    getUserData(idToken) {
        return new Promise((resolve, reject) => {
            authRequest.post('', { idToken })
                .then(result => {
                    let user = {
                        id: result.data.users[0].localId,
                        eMail: result.data.users[0].email
                    };
                    this.getUserProfile(user.id).then(userProfile => {
                        Object.assign(user, userProfile);
                        user = this.prepareUser(user);
                        resolve(user);
                    });
                }).catch(e => {
                    console.error('auth request error', e.message);
                    reject();
                });
        });
    }

    getUserProfile(userId) {
        return new Promise((resolve, reject) => {
            userCollection.doc(userId).get().then(user => {
                const userData = user.data();
                userData.userRole.get().then(userRole => {
                    const userRoleData = userRole.data();
                    userData.role = userRoleData.name;
                    userData.permissions = userRoleData.permissions;
                    resolve(userData);
                });
            });
        });
    }

    updateUserLocation(user, latitude, longitude) {
        const distance = geoDistance({
            lat: user.lastLocation.latitude,
            lng: user.lastLocation.longitude
        }, {
            lat: latitude,
            lng: longitude
        });
        user.coveredDistance += distance;
        user.lastLocation = {
            latitude,
            longitude
        };
        user.lastLocationAt = new Date();
        return userCollection.doc(user.id).update({
            lastLocation: new admin.firestore.GeoPoint(user.lastLocation.latitude, user.lastLocation.longitude),
            lastLocationAt: user.lastLocationAt,
            coveredDistance: user.coveredDistance
        });
    }

    checkForFraud(user, latitude, longitude) {
        if (!user.temporaryLocations) {
            user.temporaryLocations = [];
        }
        const newEntry = {
            location: {
                lat: latitude,
                lng: longitude
            },
            timestamp: Date.now()
        };
        if (user.temporaryLocations.length > 0) {
            newEntry.distanceToPrevious = geoDistance(newEntry.location, user.temporaryLocations[user.temporaryLocations.length - 1].location);
        }
        user.temporaryLocations.push(newEntry);
        const now = Date.now();
        user.temporaryLocations = user.temporaryLocations.filter(entry => now - entry.timestamp < 3600000);
        user.temporaryLocations[0].distanceToPrevious = 0;
        user.checkDistance = user.temporaryLocations.reduce((sum, entry) => {
            sum += entry.distanceToPrevious;
            return sum;
        }, 0);
        return user.checkDistance < 6000;
    }

    prepareUser(user) {
        const newUser = {
            coveredDistance: user.coveredDistance ? user.coveredDistance : 0,
            createdAt: user.createdAt,
            email: user.email,
            firstName: user.firstName,
            homepage: user.homepage,
            imageUrl: user.imageUrl,
            lastLocation: user.lastLocation,
            lastLocationAt: user.lastLocationAt,
            lastLogin: user.lastLogin,
            name: user.name,
            permissions: user.permissions,
            id: user.id
        };
        if (user.createdBoxes) {
            newUser.createdBoxes = user.createdBoxes.map(box => box.ref);
        }
        if (user.foundBoxes) {
            newUser.foundBoxes = user.foundBoxes.map(box => box.ref);
        }
        return newUser;
    }
}