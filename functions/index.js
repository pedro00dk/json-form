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

exports.submitAnswers = functions.https.onRequest((request, response) => {
    respondErrors(request, response, async () => {
        if (enableCors(request, response, '*', 'POST')) return
        const submission = request.body
        validateSubmission(submission)
        const isUnique = await checkUniqueSubmission(submission)
        await db.collection(isUnique ? 'submissions' : 'duplicates').add(submission)
        if (isUnique) {
            await db
                .collection('groups')
                .doc(submission.group)
                .set({ frequency: firebase.firestore.FieldValue.increment(1) }, { merge: true })
        }
        if (isUnique && submission.answers[submission.uniqueAnswer] != undefined) {
            let uniqueAnswerValue = submission.answers[submission.uniqueAnswer].trim().toLowerCase()
            await db
                .collection('uniques')
                .doc('uniques')
                .set({ uniques: firebase.firestore.FieldValue.arrayUnion(uniqueAnswerValue) }, { merge: true })
        }
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
    if (submission.uniqueAnswer == undefined) return true
    const uniqueAnswerValue = submission.answers[submission.uniqueAnswer]
        ? submission.answers[submission.uniqueAnswer].trim().toLowerCase()
        : undefined
    const uniquesDocument = await db.collection('uniques').doc('uniques').get()
    const submittedUniquesDocument = uniquesDocument.data()
    submittedUniquesArray = submittedUniquesDocument != undefined ? submittedUniquesDocument.uniques : []
    let isUnique = true
    submittedUniquesArray.forEach(
        submittedUniqueAnswerValue => (isUnique = isUnique && submittedUniqueAnswerValue !== uniqueAnswerValue)
    )
    return isUnique
}
