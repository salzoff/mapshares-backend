import firebaseAdmin from 'firebase-admin';
import { GeoFirestore } from 'geofirestore';
import session from 'express-session';
const FirestoreStore = require('firestore-store')(session);
import * as firebaseAdminCreds from './firebaseAdminCreds.json';

const config = {
    apiKey: 'AIzaSyDmDzfawPIvp3LG6g2WWzcJX9MHZZmLrLM',
    authDomain: 'snoopo.firebaseapp.com',
    databaseURL: 'https://snoopo.firebaseio.com',
    projectId: 'snoopo',
    storageBucket: 'snoopo.appspot.com',
    messagingSenderId: '389656714226',
    credential: firebaseAdmin.credential.cert(firebaseAdminCreds)
};

firebaseAdmin.initializeApp(config);

const firestore = firebaseAdmin.firestore();
const firestoreStore = new FirestoreStore({ database: firestore});
const storage = firebaseAdmin.storage();
const sessionInstance = session({
    store: firestoreStore,
    secret: 'mysecret',
    resave: true,
    saveUninitialized: false
})
let boxCollection = firestore.collection('box');
const userCollection = firestore.collection('userProfile');
const userRoleCollection = firestore.collection('userRole');
const geoFirestore = new GeoFirestore(firestore);
const geoCollection = geoFirestore.collection('geoLocation');

export {
    firestore,
    firestoreStore,
    storage,
    sessionInstance,
    boxCollection,
    userCollection,
    geoCollection
};
