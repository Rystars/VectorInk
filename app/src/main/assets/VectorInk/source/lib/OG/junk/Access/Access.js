class base{
    constructor(){
        this.Firebase = require('firebase')
        this.Admin = require('firebase-admin')
    }
    
    register(email, password, callback){
        this.auth.onAuthStateChanged((user) => {
            if(user){
                callback()
            }
        })
            
        this.auth.createUserWithEmailAndPassword(email, password).catch((error) => {
            console.log('-createUserWithEmailAndPassword-', error);
        });
    }
    collection(name){
        return this.store.collection(name)
    }

    get auth(){
        return this.Firebase.auth()
    }

    get store(){
        return this.Admin.firestore()
    }
}

class Session{
    
}

class Auth{
    constructor(){
        
    }

    register(email, password){
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('onAuthStateChanged...user')
                addUser(user.uid, {name: req.email.split('@')[0], email: req.email}, () =>{
                    callback(user.uid);
                });
            }
        });
        firebase.auth().createUserWithEmailAndPassword(email, password).catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorMessage);
            callback();
        });
    }
}

class Access{
    constructor(){
        this.Session = new Session()
        this.Auth = new Auth()
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = new Access()
}

/*
function FirebaseDB(){
    var firebase = require("firebase");
    var admin = require('firebase-admin');
    var serviceAccount = require('./firebase-ks.json');

    var config = {
        apiKey: "AIzaSyCHN2m7ksRSoAeh9Av5yCsAlNu87zbJi0M",
        authDomain: "taskit-ebc7d.firebaseapp.com",
        databaseURL: "https://taskit-ebc7d.firebaseio.com",
        projectId: "taskit-ebc7d",
        storageBucket: "taskit-ebc7d.appspot.com",
        messagingSenderId: "542539674215"
    };
    firebase.initializeApp(config);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://taskit-ebc7d.firebaseio.com'
    });

    this.signup = function(req, callback){
        var email = req.email;
        var password = req.password;
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('onAuthStateChanged...user');
                addUser(user.uid, {name: req.email.split('@')[0], email: req.email}, () =>{
                    callback(user.uid);
                });
            }
        });
        firebase.auth().createUserWithEmailAndPassword(email, password).catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorMessage);
            callback();
        });
    }

    this.getUser = function(req, callback){
        getUserInfo(req.uid, (response) => {
            callback(response);
        });
    }

    function addUser(uid, props, callback){
        var ref = collection('users');
        //new firebase.firestore.GeoPoint(latitude, longitude)
        ref.add({
            uid: uid,
            name: props.name,
            email: props.email,
          }).then(ref => {
            callback();
          });
    }

    function getUserInfo(uid, callback){
        var ref = collection('users');
        ref = ref.where('uid', '==', uid);
        ref.get().then((querySnapshot) => {
            var response = [];
            querySnapshot.forEach((doc) => {
                response.push(doc.data());
            });
            callback(response);
        });
    }

    function collection(name){
        return admin.firestore().collection(name);
    }
}
module.exports = new FirebaseDB();
*/