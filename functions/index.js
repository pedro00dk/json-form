const firebase = require('firebase-admin')
const functions = require('firebase-functions')

firebase.initializeApp()
const db = firebase.firestore()

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send('Hello from Firebase!')
})

exports.listSubmissions = functions.https.onRequest(async (request, response) => {
    const collection = await db.collection('submissions').get()
    const documents = {}
    collection.forEach(document => (documents[document.id] = document.data()))
    response.send(JSON.stringify(documents, undefined, 4))
})
