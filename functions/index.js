const firebase = require('firebase-admin')
const functions = require('firebase-functions')

firebase.initializeApp()
const db = firebase.firestore()

const verifySubmission = submission => {
    if (typeof submission !== 'object') return ['submission is not an object', false]
    if (typeof submission.answers !== 'object') return ['submission.answers is not an object', false]
    if (typeof submission.times !== 'object') return ['submission.times is not an object', false]
    if (typeof submission.sessionOrder !== 'object' || !(submission.sessionOrder instanceof Array))
        return ['submission.sessionOrder is not an array', false]
    const validAnswers = Object.values(submission.answers).reduce(
        (acc, answer) => acc && (answer == undefined || typeof answer === 'string'),
        true
    )
    const validTimes = Object.values(submission.times).reduce(
        (acc, elapsedTime) => acc && typeof elapsedTime === 'number',
        true
    )
    const validSessionOrder = Object.values(submission.sessionOrder).reduce(
        (acc, order) => acc && typeof order === 'number',
        true
    )
    if (!validAnswers) return ['Some submission answer is not null/undefined or string', false]
    if (!validTimes) return ['Some submission time is not number', false]
    if (!validSessionOrder) return ['Some submission session order is not number', false]
    return ['', true]
}

const checkAlreadyExists = async submission => {
    if (submission.answers['email'] == undefined) return ['Email answer not found', false]
    const collection = await db.collection('submissions').get()
    const email = submission.answers['email'].trim()
    let emailExists = false
    collection.forEach(document => {
        const data = document.data()
        if (data.answers == undefined || data.answers['email'] == undefined) return
        emailExists = emailExists || email == data.answers['email'].trim()
    })
    if (emailExists) return ['Email already exists', false]
    return ['', true]
}

const getSessionOrder = async () => {
    const order1 = [0, 1, 2, 3, 4, 5, 6, 7]
    const order2 = [0, 4, 2, 3, 1, 5, 6, 7]
    const equals = (a, b) => {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
        return true
    }
    const collection = await db.collection('submissions').get()
    let equalsOrder1 = 0
    let equalsOrder2 = 0
    collection.forEach(document => {
        const data = document.data()
        if (equals(data.sessionOrder, order1)) equalsOrder1++
        else equalsOrder2++
    })
    if (equalsOrder1 <= equalsOrder2) return order1
    else return order2
}

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send('Hello from Firebase!')
})

exports.listSubmissions = functions.https.onRequest(async (request, response) => {
    const collection = await db.collection('submissions').get()
    const documents = {}
    collection.forEach(document => (documents[document.id] = document.data()))
    response.send(JSON.stringify(documents, undefined, 4))
})

exports.acceptSubmission = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') return response.status(400).send('Illegal method, POST method expected')
    try {
        const submission = request.body
        let [error, isValid] = verifySubmission(submission)
        if (!isValid) return response.status(400).send(`${error}\n${JSON.stringify(submission, undefined, 4)}`)
        const [emailError, emailIsValid] = await checkAlreadyExists(submission)
        if (!emailIsValid)
            return response.status(400).send(`${emailError}\n${JSON.stringify(submission, undefined, 4)}`)
        await db.collection('submissions').add(submission)
        response.send('submission accepted')
    } catch (error) {
        response.status(400).send(`${error.toString()}\n${error.stack}`)
    }
})

exports.sessionOrder = functions.https.onRequest(async (request, response) => {
    try {
        const order = await getSessionOrder()
        response.status(200).send(order)
    } catch (error) {
        response.status(400).send(`${error.toString()}\n${error.stack}`)
    }
})
