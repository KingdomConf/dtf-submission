// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-Tpk_mlZ4Z7X1F_jRviBKSVHlISasfjY",
  authDomain: "dtf-submission.firebaseapp.com",
  projectId: "dtf-submission",
  storageBucket: "dtf-submission.firebasestorage.app",
  messagingSenderId: "1084618654185",
  appId: "1:1084618654185:web:a5eea9f15f9fc7aaba4b78",
  measurementId: "G-K5YRVPT4GG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);