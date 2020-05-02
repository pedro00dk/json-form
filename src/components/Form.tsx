import { css } from 'emotion'
import React from 'react'
import { loadForm, loadOrder, sendSubmission } from '../requests'
import * as spec from '../spec'
import { Info } from './Info'
import { Session } from './Session'

const classes = {
    container: 'd-flex justify-content-center vw-100',
    content: `d-flex flex-column m-4 ${css({ width: 640 })}`
}

document.body.style.background = '#ede7f6'

export const Form = (props: { url: string; form?: spec.Form }) => {
    const [form, setForm] = React.useState<spec.Form>()
    const [info, setInfo] = React.useState('')
    const [status, setStatus] = React.useState<
        'loading' | 'loaded' | 'failed' | 'submitting' | 'submitted' | 'submitFailed'
    >('loading')
    //
    const order = React.useRef<number[]>()
    const [currentSession, setCurrentSession] = React.useState(undefined)
    const remainingSessions = React.useRef<number[]>()
    //
    const answers = React.useRef<{ [id: string]: string }>({})
    const times = React.useRef<{ [session: string]: number }>({})

    React.useEffect(() => {
        console.log(props.form)
        if (props.form != undefined) return setForm(props.form)
        const onStep = async (message: string) => await setInfo(`${info}\n\n${message}`)
        const onSuccess = async (form: spec.Form) => setForm(form)
        const onError = async (message: string) => {
            setInfo(`${info}\n\n${message}`)
            setStatus('failed')
        }
        loadForm(props.url, onStep, onSuccess, onError)
    }, [])

    React.useEffect(() => {
        if (form == undefined) return
        const onStep = async (message: string) => await setInfo(`${info}\n\n${message}`)
        const onSuccess = async (chosen: number[]) => {
            order.current = [...chosen]
            remainingSessions.current = [...order.current]
            setCurrentSession(remainingSessions.current.shift())
            setInfo(order.current.length > 0 ? '' : '## This form does not contain any sessions')
            setStatus(order.current.length > 0 ? 'loaded' : 'failed')
        }
        const onError = async (message: string) => {
            setInfo(`${info}\n\n${message}`)
            setStatus('failed')
        }
        loadOrder(form.order, form.sessions, onStep, onSuccess, onError)
    }, [form])

    React.useEffect(() => {
        window.onbeforeunload = (event: BeforeUnloadEvent) =>
            status === 'loading'
                ? 'The form is still loading.'
                : status === 'loaded'
                ? 'Your filled data will be lost.'
                : status === 'submitting'
                ? 'Please wait until the submission confirmation.'
                : undefined
    })

    const next = (sessionAnswers: { [id: string]: string }, sessionTime: number) => {
        answers.current = { ...answers.current, ...sessionAnswers }
        times.current[currentSession] = sessionTime
        const nextSession = remainingSessions.current.shift()
        setCurrentSession(nextSession)
        if (nextSession == undefined) submit()
    }

    const submit = async () => {
        const onStep = async (message: string) => {
            setInfo(message)
            await setStatus('submitting')
        }
        const onSuccess = async (message: string) => {
            setInfo(message)
            setStatus('submitted')
        }
        const onError = async (message: string) => {
            setInfo(message)
            setStatus('submitFailed')
        }
        const data = {
            answers: answers.current,
            times: times.current,
            order: order.current,
            ...(form.submission.unique != undefined ? { unique: form.submission.unique } : {})
        }
        sendSubmission(form.submission, data, onStep, onSuccess, onError)
    }

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                {status === 'loaded' ? (
                    <Session
                        key={currentSession}
                        session={form.sessions[currentSession]}
                        submit={{ enabled: true, text: remainingSessions.current.length > 0 ? 'Next' : 'Submit' }}
                        onSubmit={next}
                    />
                ) : (
                    <Info info={info} />
                )}
            </div>
        </div>
    )
}
