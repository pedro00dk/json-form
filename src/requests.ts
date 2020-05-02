import axios from 'axios'
import YAML from 'yaml'
import * as spec from './spec'

export const loadForm = async (
    url: string,
    onStep: (message: string) => Promise<void>,
    onSuccess: (form: spec.Form) => Promise<void>,
    onError: (message: string) => Promise<void>
) => {
    await onStep(`Loading form: ${url}`)
    let response: string
    try {
        response = (await axios.get(url, { transformResponse: data => data })).data as string
    } catch (error) {
        return onError(error.toString())
    }
    await onStep('Form content fetched')
    let form: spec.Form = undefined
    if (form == undefined) {
        try {
            form = JSON.parse(response)
            await onStep('Successfully read as JSON')
        } catch (error) {
            await 'Failed to read as JSON'
        }
    }
    if (form == undefined) {
        try {
            form = YAML.parse(response)
            await onStep('Successfully read as YAML')
        } catch (error) {
            await onStep('Failed to read as YAML')
        }
    }
    if (form == undefined) return onError('Form content could not be read')
    onSuccess(form)
}

export const loadOrder = async (
    order: spec.Form['order'],
    sessions: spec.Form['sessions'],
    onStep: (message: string) => Promise<void>,
    onSuccess: (order: number[]) => Promise<void>,
    onError: (message: string) => Promise<void>
) => {
    await onStep('Loading session order')
    const orders = order.orders
    const url = order.url
    let chosen: number[]
    if (url == undefined) chosen = orders[Math.floor(Math.random() * orders.length)]
    else
        try {
            await onStep('Using url provider')
            chosen = (await axios.post(url, orders)).data as number[]
        } catch (error) {
            return onError(`Error in session order resolution:\n\n\t${error.toString()}`)
        }
    if (chosen.length > sessions.length)
        return onError(`Order ${JSON.stringify(chosen)} contains more sessions than available, (${sessions.length})`)
    const frequencies: { [index: string]: number } = {}
    for (const index of chosen) {
        if (index < 0 || index >= sessions.length)
            return onError(`Order ${JSON.stringify(chosen)} contains illegal index, (0-${sessions.length - 1})`)
        if (frequencies[index] == undefined) frequencies[index] = 0
        frequencies[index] += 1
    }
    for (const index in frequencies) {
        const frequency = frequencies[index]
        if (frequency > 1) return onError(`Order ${JSON.stringify(order)} has repeated indices, (${index})`)
    }
    onSuccess(chosen)
}

export const sendSubmission = async (
    submission: spec.Form['submission'],
    data: { answers: { [id: string]: string }; times: { [session: string]: number }; order: number[]; unique?: string },
    onStep: (message: string) => Promise<void>,
    onSuccess: (message: string) => Promise<void>,
    onError: (message: string) => Promise<void>
) => {
    await onStep('# Submitting response\n#### Please wait until the confirmation.')
    try {
        const message = (await axios.post(submission.url, data)).data
        return onSuccess(`# Submission successful &#x1F49A;\n#### Your submission has been recorded.\n\n${message}`)
    } catch (error) {
        console.log(error, error.toString(), error.stack)
        return onError(`# Submission failed &#x1F534;\n#### Contact the form provider.\n\n${error.toString()}`)
    }
}
