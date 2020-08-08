import { css } from 'emotion'
import React from 'react'
import { fetchForm, fetchGroupsFrequencies, fetchResources, submitAnswers } from '../requests'
import * as schema from '../schema'
import { Info } from './Info'
import { Session } from './Session'

const classes = {
    container: `d-flex justify-content-center ${css({width: '99vw'})}`,
    content: `d-flex flex-column m-4 ${css({ width: 640 })}`
}

document.body.style.background = '#ede7f6'

export const Form = (props: { url?: string; form?: schema.Form }) => {
    const [status, setStatus] = React.useState<
        'loading' | 'loaded' | 'failed' | 'submit' | 'submitFinished' | 'submitFailed'
    >('loading')
    const infoRef = React.useRef('')
    const [info, setInfo] = React.useState('')
    const appendInfo = (text: string) => setInfo((infoRef.current = `${infoRef.current}\n\n${text}`))
    //
    const form = React.useRef<schema.Form>()
    const resources = React.useRef<{ [name: string]: string }>()
    const groupsFrequencies = React.useRef<{ [id: string]: number }>()
    const group = React.useRef<string>('')
    //
    const remainingSessions = React.useRef<number[]>()
    const [currentSession, setCurrentSession] = React.useState(0)
    //
    const answers = React.useRef<{ [id: string]: string }>({})
    const times = React.useRef<{ [session: string]: number }>({})
    //

    // effect that fetches all resources, show all logs and preset loaded state
    React.useEffect(() => {
        ;(async () => {
            await setStatus('loading')
            await appendInfo('# Loading form content.')
            try {
                form.current = props.form
                if (form.current == undefined)
                    for await (const message of fetchForm(props.url, f => (form.current = f))) await appendInfo(message)
                for await (const message of fetchResources(form.current, r => (resources.current = r)))
                    await appendInfo(message)
                for await (const message of fetchGroupsFrequencies(form.current, o => (groupsFrequencies.current = o)))
                    await appendInfo(message)
                const candidateOrders = Object.entries(groupsFrequencies.current)
                    .filter(([name, _]) => form.current.groups.names[name] != undefined)
                    .reduce(
                        (acc, next) => (next[1] < acc[0][1] ? [next] : next[1] === acc[0][1] ? [...acc, next] : acc),
                        [[undefined as string, Infinity] as const]
                    )
                await appendInfo('candidate orders')
                await appendInfo(`\`\`\`json\n${JSON.stringify(candidateOrders, undefined, 4)}\n\`\`\``)
                group.current = candidateOrders[Math.floor(Math.random() * candidateOrders.length)][0]
                await appendInfo(`selected order: ${group.current}`)
                await appendInfo(`order: ${JSON.stringify(form.current.groups.names[group.current])}`)
                remainingSessions.current = form.current.groups.names[group.current]
                console.log(groupsFrequencies.current, group.current, remainingSessions.current)
                for (const sessionIndex of remainingSessions.current) {
                    if (sessionIndex < 0 || sessionIndex >= form.current.sessions.length)
                        throw new Error(
                            `order name (${group.current}) contains session index out of range (${sessionIndex}). ` +
                                `They must be in the range [0, ${form.current.sessions.length})`
                        )
                }
                await setCurrentSession(remainingSessions.current.shift())
                await setStatus('loaded')
            } catch (error) {
                await appendInfo(error.toString())
                await setStatus('failed')
            }
        })()
    }, [])

    React.useEffect(() => {
        window.scrollTo(0, 0)
    }, [status, currentSession])

    React.useEffect(() => {
        window.onbeforeunload = (event: BeforeUnloadEvent) =>
            status === 'loading'
                ? 'The form is still loading.'
                : status === 'loaded'
                ? 'Your filled data will be lost.'
                : status === 'submit'
                ? 'Please wait until the submission confirmation.'
                : undefined
    })

    const next = (sessionAnswers: { [id: string]: string }, time: number) => {
        answers.current = { ...answers.current, ...sessionAnswers }
        times.current[currentSession] = time
        const nextSession = remainingSessions.current.shift()
        setCurrentSession(nextSession)
        if (nextSession == undefined) submit()
    }

    const submit = async () => {
        const data = {
            answers: answers.current,
            times: times.current,
            group: group.current,
            ...(form.current.submission.uniqueAnswer != undefined
                ? { uniqueAnswer: form.current.submission.uniqueAnswer }
                : {})
        }
        try {
            await setStatus('submit')
            infoRef.current = ''
            const submitter = submitAnswers(form.current, data)
            for await (const message of submitter) await appendInfo(message)
            await setStatus('submitFinished')
        } catch (error) {
            await appendInfo(error.toString())
            await setStatus('submitFailed')
        }
    }

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                {status !== 'loaded' ? (
                    <Info form={form.current} markdown={info} />
                ) : (
                    <Session
                        key={Math.random()}
                        form={form.current}
                        session={form.current.sessions[currentSession]}
                        resources={resources.current}
                        answers={{ ...answers.current }}
                        next={{ enabled: true, text: remainingSessions.current.length > 0 ? 'Next' : 'Submit' }}
                        onNext={next}
                    />
                )}
            </div>
        </div>
    )
}
