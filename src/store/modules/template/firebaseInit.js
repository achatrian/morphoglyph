import firebase from 'firebase'
import 'firebase/firestore'
import firebaseConifg from "./firebaseConifg"
const firebaseApp = firebase.initializeApp(firebaseConifg)
export default firebaseApp.firestore()