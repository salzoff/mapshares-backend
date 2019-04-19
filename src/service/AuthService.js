import axios from 'axios';
import admin from 'firebase-admin';
import { userCollection, userProfileCollection } from '../../firebaseConfig';
import { extractPlainValuesAndArrays } from '../helper/basic';
import { geoDistance } from '../helper/location';

let instance = false;
const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyDqHeavSoFvMB0VtZDBMfqNwC1VLW7A2PY';
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
                    const user = {
                        id: result.data.users[0].localId,
                        eMail: result.data.users[0].email
                    };
                    this.getUserProfile(user.id).then(userProfile => {
                        Object.assign(user, userProfile);
                        resolve(user);
                    });
                }).catch(e => {
                    console.error('error', e);
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
                    resolve(extractPlainValuesAndArrays(userData));
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
}