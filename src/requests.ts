import axios from 'axios'
import YAML from 'yaml'
import * as spec from './schema'

export async function* fetchForm(url: string, onForm: (form: spec.Form) => void): AsyncGenerator<string> {
    yield 'fetching form'
    yield `url: ${url}`
    let response: string = undefined
    try {
        response = (await axios.get(url, { transformResponse: data => data })).data as string
        console.log(response)
        yield `success`
    } catch (error) {
        console.log(error.toString())
        yield `failed`
        throw new Error()
    }
    try {
        yield 'parsing as json'
        const form = JSON.parse(response) as spec.Form
        yield 'success'
        onForm(form)
        return
    } catch (error) {
        console.log(error.toString())
        yield 'failed'
    }
    try {
        yield 'parsing as yaml'
        const form = YAML.parse(response) as spec.Form
        yield 'success'
        onForm(form)
        return
    } catch (error) {
        console.log(error.toString())
        yield 'failed'
    }
    throw new Error()
}

export async function* fetchResources(
    form: spec.Form,
    onResources: (resources: { [name: string]: string }) => void
): AsyncGenerator<string> {
    yield 'fetching resources'
    yield `\`\`\`json\n${JSON.stringify(form.resources, undefined, 4)}\n\`\`\``
    const entries = Object.entries(form.resources ?? {})
    const promises = entries.map(([name, url]) => axios.get<string>(url, { transformResponse: data => data }))
    const results = await Promise.allSettled(promises)
    const successful: [string, string][] = []
    const failed: [string, string][] = []
    for (let i = 0; i < entries.length; i++) {
        const resource = entries[i][0]
        const result = results[i]
        if (result.status === 'fulfilled') successful.push([resource, result.value.data])
        else failed.push([resource, result.reason.toString()])
    }
    if (failed.length > 0) {
        const failedEntries = Object.fromEntries(failed)
        yield 'failed'
        yield `\`\`\`json\n${JSON.stringify(failedEntries, undefined, 4)}\n\`\`\``
        throw new Error()
    }
    yield 'success'
    const successfulEntries = Object.fromEntries(successful)
    onResources(successfulEntries)
}

export async function* fetchGroupsFrequencies(
    form: spec.Form,
    onGroupsFrequencies: (frequencies: { [id: string]: number }) => void
): AsyncGenerator<string> {
    yield `fetching groups frequencies`
    const frequencies = Object.fromEntries(Object.keys(form.groups.names).map(name => [name, 0]))
    if (form.groups.url == undefined) {
        yield 'url not provided, using empty frequencies'
        onGroupsFrequencies(frequencies)
        return
    }
    try {
        const serverFrequencies = (await axios.get(form.groups.url)).data as { [id: string]: number }
        console.log(JSON.stringify(serverFrequencies))
        yield 'success'
        onGroupsFrequencies({ ...frequencies, ...serverFrequencies })
        return
    } catch (error) {
        console.log(error.toString())
        yield 'failed'
        throw new Error()
    }
}

export async function* submitAnswers(
    form: spec.Form,
    data: {
        answers: { [id: string]: string }
        times: { [session: string]: number }
        group: string
        uniqueAnswer?: string
    }
): AsyncGenerator<string> {
    console.log(JSON.stringify(data, undefined, 4))
    if (form.submission.url == undefined) {
        yield '# Submission URL not provided\n#### Check console to get your answers.'
        return
    }
    yield '# Submitting response\n#### Please wait until the confirmation.'
    try {
        const message = (await axios.post(form.submission.url, data)).data
        yield `# Submission successful &#x1F49A;\n#### Your submission has been recorded.\n\n${message}`
    } catch (error) {
        console.log(error.toString())
        yield `# Submission failed &#x1F534;\n#### Contact the form provider.\n\n${error.toString()}`
        throw new Error()
    }
}
