const firebase = require('firebase-admin')
const functions = require('firebase-functions')

firebase.initializeApp()
const db = firebase.firestore()

const respondErrors = async (request, response, handler) => {
    try {
        return await handler()
    } catch (error) {
        response.status(500).send(`${error.toString()}\n${error.stack}`)
    }
}

const enableCors = (request, response, origin = '*', methods = 'GET, POST') => {
    response.set('Access-Control-Allow-Origin', origin)
    response.set('Access-Control-Allow-Methods', methods)
    if (request.method === 'OPTIONS') {
        response.set('Access-Control-Allow-Headers', 'Content-Type')
        response.set('Access-Control-Max-Age', '3600')
    }
}

exports.listSubmissions = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        enableCors(request, response, '*', 'GET')
        const collection = await db.collection('submissions').get()
        const documents = {}
        collection.forEach(document => (documents[document.id] = document.data()))
        response.send(JSON.stringify(documents, undefined, 4))
    })
})

const validateSubmission = submission => {
    if (typeof submission !== 'object') throw new Error('submission is not an object')
    if (typeof submission.answers !== 'object') throw new Error('submission.answers is not an object')
    if (typeof submission.times !== 'object') throw new Error('submission.times is not an object')
    if (typeof submission.sessionOrder !== 'object' || !(submission.sessionOrder instanceof Array))
        throw new Error('submission.sessionOrder is not an array')
    if (submission.uniqueAnswer != undefined && typeof submission.uniqueAnswer !== 'string')
        throw new Error('submission.uniqueAnswer must be undefined or string')

    const validAnswers = Object.values(submission.answers).reduce(
        (acc, answer) => acc && (answer == undefined || typeof answer === 'string'),
        true
    )
    if (!validAnswers) throw new Error('Some submission answer is not null/undefined or string')
    const validTimes = Object.values(submission.times).reduce(
        (acc, elapsedTime) => acc && typeof elapsedTime === 'number',
        true
    )
    if (!validTimes) throw new Error('Some submission time is not number')
    const validSessionOrder = Object.values(submission.sessionOrder).reduce(
        (acc, order) => acc && typeof order === 'number',
        true
    )
    if (!validSessionOrder) throw new Error('Some submission session order is not number')
}

const checkUniqueSubmission = async submission => {
    const uniqueAnswer = submission.uniqueAnswer
    if (uniqueAnswer == undefined) return true
    const uniqueAnswerValue = submission.answers[uniqueAnswer]
        ? submission.answers[uniqueAnswer].trim().toLowerCase()
        : undefined

    const collection = await db.collection('submissions').get()
    let isUnique = true
    collection.forEach(document => {
        if (!isUnique) return
        const data = document.data()
        const documentUniqueAnswerValue = data.answers[uniqueAnswer]
            ? data.answers[uniqueAnswer].trim().toLowerCase()
            : undefined
        if (uniqueAnswerValue === documentUniqueAnswerValue) isUnique = isUnique && false
    })
    return isUnique
}

exports.acceptSubmission = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        enableCors(request, response, '*', 'POST')
        const submission = request.body
        validateSubmission(submission)
        const isUnique = await checkUniqueSubmission(submission)
        await db.collection(isUnique ? 'submissions' : 'duplicates').add(submission)
        response.send(
            `Submission accepted.\n${
                !isUnique
                    ? 'A previous submission with the same answer for [' +
                      submission.uniqueAnswer +
                      '] was already received. This submission is being saved as a duplicate.'
                    : ''
            }`
        )
    })
})

const validateSessionOrder = sessionOrders => {
    if (!(sessionOrders instanceof Array)) throw new Error('Session order is not an array')
    for (let sessionOrder of sessionOrders)
        if (!(sessionOrder instanceof Array)) throw new Error('Session order contains non array order')
}

const getLessFrequentSessionOrder = async sessionOrders => {
    const orderEquals = (orderA, orderB) => {
        if (orderA.length !== orderB.length) return false
        for (let i = 0; i < orderA.length; i++) if (orderA[i] !== orderB[i]) return false
        return true
    }

    const collection = await db.collection('submissions').get()
    const sessionOrderFrequencies = sessionOrders.map(sessionOrder => 0)
    collection.forEach(document => {
        const data = document.data()
        const documentSessionOrder = data.sessionOrder
        for (let i = 0; i < sessionOrders.length; i++) {
            const sessionOrder = sessionOrders[i]
            if (orderEquals(sessionOrder, documentSessionOrder)) {
                sessionOrderFrequencies[i]++
                break
            }
        }
    })

    let lessFrequent = 0
    for (let i = 0; i < sessionOrderFrequencies.length; i++)
        if (sessionOrderFrequencies[i] < sessionOrderFrequencies[lessFrequent]) lessFrequent = i

    const lessFrequentOrder = sessionOrders[lessFrequent] ? sessionOrders[lessFrequent] : []
    return lessFrequentOrder
}

exports.getSessionOrder = functions.https.onRequest((request, response) =>
    respondErrors(request, response, async () => {
        enableCors(request, response, '*', 'POST')
        const orders = request.body
        validateSessionOrder(orders)
        response.status(200).send(await getLessFrequentSessionOrder(orders))
    })
)
