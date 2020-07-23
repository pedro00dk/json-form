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
        response.status(204).send()
        return true
    }
    return false
}

exports.getSubmissions = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'GET')) return
        const collection = await db.collection('submissions').get()
        const documents = {}
        collection.forEach(document => (documents[document.id] = document.data()))
        response.send(JSON.stringify(documents, undefined, 4))
    })
})

exports.getDuplicates = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'GET')) return
        const collection = await db.collection('duplicates').get()
        const documents = {}
        collection.forEach(document => (documents[document.id] = document.data()))
        response.send(JSON.stringify(documents, undefined, 4))
    })
})

exports.getGroupsFrequencies = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'GET')) return
        const collection = await db.collection('groups').get()
        const frequencies = {}
        collection.forEach(document => (frequencies[document.id] = document.data().frequency))
        response.send(JSON.stringify(frequencies, undefined, 4))
    })
})

exports.submitAnswer = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'POST')) return
        const submission = request.body
        validateSubmission(submission)
        const isUnique = await checkUniqueSubmission(submission)
        await db.collection(isUnique ? 'submissions' : 'duplicates').add(submission)
        if (isUnique)
            await db
                .collection('groups')
                .doc(submission.group)
                .update({ frequency: firebase.firestore.FieldValue.increment(1) })
        if (isUnique && submission.uniqueAnswer != undefined)
            await db
                .collection('uniques')
                .doc('uniques')
                .update({
                    uniques: firebase.firestore.FieldValue.arrayUnion(
                        submission.answers[submission.unique].trim().toLowerCase()
                    )
                })
        response
            .status(200)
            .send(
                `Submission accepted.\n${
                    !isUnique
                        ? 'A previous submission with the same answer for ' +
                          submission.uniqueAnswer +
                          ' was already received. This submission is being saved as a duplicate.'
                        : ''
                }`
            )
    })
})

const validateSubmission = submission => {
    if (typeof submission !== 'object') throw new Error('submission is not an object')
    if (typeof submission.answers !== 'object') throw new Error('submission.answers is not an object')
    if (typeof submission.times !== 'object') throw new Error('submission.times is not an object')
    if (typeof submission.group !== 'string') throw new Error('submission.group is not a string')
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
    if (!validTimes) throw new Error('Some submission time is not a number')
}

const checkUniqueSubmission = async submission => {
    const uniqueAnswer = submission.uniqueAnswer
    if (uniqueAnswer == undefined) return true
    const uniqueAnswerValue = submission.answers[unique] ? submission.answers[unique].trim().toLowerCase() : undefined
    const uniquesDocument = await db.collection('uniques').doc('uniques').get()
    let submittedUniquesArray = uniquesDocument.data().unique
    submittedUniquesArray = submittedUniquesArray != undefined ? submittedUniquesArray : []
    let isUnique = true
    submittedUniquesArray.forEach(
        submittedUniqueAnswerValue => (isUnique = isUnique && submittedUniqueAnswerValue !== uniqueAnswerValue)
    )
    return isUnique
}
