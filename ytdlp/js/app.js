import firebase from "firebase/app";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Sign up example:
firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(user => {
    console.log('User signed up', user);
  })
  .catch(error => {
    console.error('Error signing up', error);
  });
