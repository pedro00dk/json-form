import axios from 'axios'
import { css } from 'emotion'
import React from 'react'
import YAML from 'yaml'
import * as spec from '../spec'
import { Info } from './Info'
import { Session } from './Session'
import { Submit } from './Submit'

const classes = {
    container: 'd-flex justify-content-center vw-100',
    content: `d-flex flex-column m-4 ${css({ width: 640 })}`
}

document.body.style.background = '#ede7f6'

export const Form = (props: { url: string }) => {
    const [form, setForm] = React.useState<spec.Form>()
    const [loaded, setLoaded] = React.useState(false)
    const [info, setInfo] = React.useState('')
    const answers = React.useRef<{ [id: string]: string }>({})
    const times = React.useRef<{ [session: string]: number }>({})
    const resolvedSessionOrder = React.useRef<number[]>([])
    const remainingSessionOrder = React.useRef<number[]>([])
    const [currentSession, setCurrentSession] = React.useState(undefined)
    const { submission, sessionOrder, sessions = [] } = form ?? {}

    React.useEffect(() => {
        ;(async () => {
            let localInfo = 'Loading...'
            try {
                setInfo((localInfo = `${localInfo}\n\nForm url: ${props.url}\n\nFetching...`))
                const response = (await axios.get(props.url, { transformResponse: data => data })).data as string
                setInfo((localInfo = `${localInfo}\n\nForm content fetched\n\nTry reading as JSON\n\n`))
                let form: spec.Form = undefined
                if (form == undefined) {
                    try {
                        form = JSON.parse(response)
                        await undefined
                        setInfo((localInfo = `${localInfo}\n\nSuccessfully read as JSON\n\n`))
                    } catch (error) {
                        await undefined
                        setInfo((localInfo = `${localInfo}\n\nFailed to read as JSON\n\n${error.toString()}\n\n`))
                    }
                }
                if (form == undefined) {
                    try {
                        form = YAML.parse(response)
                        await undefined
                        setInfo((localInfo = `${localInfo}\n\nSuccessfully read as YAML\n\n`))
                    } catch (error) {
                        await undefined
                        setInfo((localInfo = `${localInfo}\n\nFailed to read as YAML\n\n${error.toString()}\n\n`))
                    }
                }
                if (form == undefined) return setInfo(`${localInfo}\n\n## The form could not be loaded.\n\n`)
                setForm(form)
            } catch (error) {}
        })()
    }, [])

    React.useEffect(() => {
        if (form == undefined) return
        ;(async () => {
            try {
                if (
                    sessionOrder == undefined ||
                    (sessionOrder.static == undefined && sessionOrder.dynamic == undefined)
                )
                    resolvedSessionOrder.current = [...Array(sessions.length).keys()]
                else if (sessionOrder.static != undefined) {
                    resolvedSessionOrder.current = sessionOrder.static
                } else if (sessionOrder.dynamic != undefined) {
                    const requestedSessionOrder = (
                        await axios.post(sessionOrder.dynamic.url, sessionOrder.dynamic.orders)
                    ).data as number[]
                    resolvedSessionOrder.current = requestedSessionOrder
                }
                for (let index of resolvedSessionOrder.current) {
                    if (index < 0 || index >= sessions.length)
                        throw new Error(`Invalid session order, illegal index range.\n${resolvedSessionOrder.current}`)
                }
                const uniqueIndices = Object.keys(
                    resolvedSessionOrder.current.reduce((acc, index) => ((acc[index] = index), acc), {} as any)
                )
                if (uniqueIndices.length !== resolvedSessionOrder.current.length)
                    throw new Error(`Invalid session order, repeated indices.\n${resolvedSessionOrder.current}`)
                remainingSessionOrder.current = [...resolvedSessionOrder.current]
                setCurrentSession(remainingSessionOrder.current.shift())
                setLoaded(true)
            } catch (error) {
                setInfo(`${info}\n\nError in session order resolution\n\n${error.toString()}\n\n`)
            }
        })()
    }, [form])

    const next = (sessionAnswers: { [id: string]: string }, sessionTime: number) => {
        answers.current = { ...answers.current, ...sessionAnswers }
        times.current[currentSession] = sessionTime
        setCurrentSession(remainingSessionOrder.current.shift())
    }

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                {!loaded && <Info info={info} />}
                {loaded && currentSession == undefined && resolvedSessionOrder.current.length === 0 && (
                    <Info info={'## This form does not contain any sessions'} />
                )}
                {loaded && currentSession != undefined && (
                    <Session
                        key={currentSession}
                        session={sessions[currentSession]}
                        submit={{ enabled: true, text: currentSession < sessions.length - 1 ? 'Next' : 'Submit' }}
                        onSubmit={next}
                    />
                )}
                {loaded && currentSession == undefined && sessions.length > 0 && (
                    <Submit
                        submission={submission}
                        answers={answers.current}
                        times={times.current}
                        sessionOrder={resolvedSessionOrder.current}
                    />
                )}
            </div>
        </div>
    )
}
