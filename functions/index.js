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
        response.set('Access-Control-Allow-Credentials', 'true')
        response.set('Access-Control-Max-Age', '3600')
        response.status(200).send()
        return true
    }
    return false
}

exports.listSubmissions = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'GET')) return
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
    if (typeof submission.order !== 'object' || !(submission.order instanceof Array))
        throw new Error('submission.order is not an array')
    if (submission.unique != undefined && typeof submission.unique !== 'string')
        throw new Error('submission.unique must be undefined or string')

    const validAnswers = Object.values(submission.answers).reduce(
        (acc, answer) => acc && (answer == undefined || typeof answer === 'string'),
        true
    )
    if (!validAnswers) throw new Error('Some submission answer is not null/undefined or string')
    const validTimes = Object.values(submission.times).reduce(
        (acc, elapsedTime) => acc && typeof elapsedTime === 'number',
        true
    )
    if (!validTimes) throw new Error('Some submission time is not a number')
    const validOrder = Object.values(submission.order).reduce((acc, order) => acc && typeof order === 'number', true)
    if (!validOrder) throw new Error('Some submission session order is not a number')
}

const checkUniqueSubmission = async submission => {
    const unique = submission.unique
    if (unique == undefined) return true
    const uniqueValue = submission.answers[unique] ? submission.answers[unique].trim().toLowerCase() : undefined

    const collection = await db.collection('submissions').get()
    let isUnique = true
    collection.forEach(document => {
        if (!isUnique) return
        const data = document.data()
        const documentUniqueValue = data.answers[unique] ? data.answers[unique].trim().toLowerCase() : undefined
        if (uniqueValue === documentUniqueValue) isUnique = isUnique && false
    })
    return isUnique
}

exports.acceptSubmission = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'POST')) return
        const submission = request.body
        validateSubmission(submission)
        const isUnique = await checkUniqueSubmission(submission)
        await db.collection(isUnique ? 'submissions' : 'duplicates').add(submission)
        response
            .status(200)
            .send(
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

const validateOrders = orders => {
    if (!(orders instanceof Array)) throw new Error('orders is not an array')
    for (let order of orders) if (!(order instanceof Array)) throw new Error('orders contains non array order')
}

const getLessFrequentOrder = async orders => {
    const orderEquals = (orderA, orderB) => {
        if (orderA.length !== orderB.length) return false
        for (let i = 0; i < orderA.length; i++) if (orderA[i] !== orderB[i]) return false
        return true
    }

    const collection = await db.collection('submissions').get()
    const frequencies = orders.map(order => 0)
    collection.forEach(document => {
        const data = document.data()
        const documentOrder = data.order
        for (let i = 0; i < orders.length; i++) {
            if (orderEquals(orders[i], documentOrder)) {
                frequencies[i]++
                break
            }
        }
    })

    let lessFrequent = 0
    for (let i = 0; i < frequencies.length; i++)
        if (
            frequencies[i] < frequencies[lessFrequent] ||
            (frequencies[i] === frequencies[lessFrequent] && Math.random() < 0.5)
        )
            lessFrequent = i

    const lessFrequentOrder = orders[lessFrequent] ? orders[lessFrequent] : []
    return lessFrequentOrder
}

exports.getOrder = functions.https.onRequest((request, response) =>
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'POST')) return
        const orders = request.body
        validateOrders(orders)
        response.status(200).send(await getLessFrequentOrder(orders))
    })
)
