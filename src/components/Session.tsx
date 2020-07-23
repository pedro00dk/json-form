import { css } from 'emotion'
import React from 'react'
import * as schema from '../schema'
import { Question } from './Question'

const classes = {
    container: 'd-flex flex-column',
    submit: 'btn btn-info border rounded mt-2',
    timer: `d-flex align-items-center justify-content-center mb-2 ${css({ height: 50, fontSize: '2rem' })}`
}

export const Session = (props: {
    form: schema.Form
    session: schema.Session
    resources: { [id: string]: string }
    answers: { [id: string]: string }
    next: { enabled: boolean; text: string }
    onNext: (answers: { [id: string]: string }, time: number) => void
}) => {
    const inputs = React.useRef<{ [id: string]: { required: boolean; ref$: HTMLElement; answer: string } }>({})
    const time = React.useRef(0)

    const trackInput = (id: string, required: boolean, ref$: HTMLDivElement) => {
        inputs.current[id] = { required, ref$, answer: '' }
    }

    const onInput = (id: string, answer: string) => {
        inputs.current[id].answer = answer ?? ''
    }

    const next = () => {
        const missing = Object.entries(inputs.current).filter(([, { required, answer }]) => required && !answer)
        if (missing.length > 0) {
            Object.values(inputs.current).forEach(({ ref$ }) => (ref$.style.border = 'none'))
            missing.forEach(([, { ref$ }]) => (ref$.style.border = '2px solid red'))
            const firstMissing = missing[0][1].ref$
            window.scrollTo(0, Math.max(firstMissing.offsetTop - 20, 0))
            return
        }
        const answers: { [id: string]: string } = Object.fromEntries(
            Object.entries(inputs.current).map(([id, { answer }]) => [id, answer])
        )
        props.onNext(answers, time.current)
    }

    return (
        <div className={classes.container}>
            <Timer timer={props.session.timer} onElapsed={e => (time.current = e)} />
            {props.session.questions.map((question, i) => (
                <Question
                    key={i}
                    form={props.form}
                    session={props.session}
                    question={question}
                    resources={props.resources}
                    answers={props.answers}
                    trackInput={trackInput}
                    onInput={onInput}
                />
            ))}
            {props.next.enabled && (
                <input className={classes.submit} type='button' value={props.next.text} onClick={next} />
            )}
        </div>
    )
}

const Timer = (props: { timer?: number; onElapsed: (elapsed: number) => void }) => {
    const container$ = React.useRef<HTMLDivElement>()
    const elapsedTime = React.useRef(0)
    const timer = Math.abs(props.timer ?? 0)

    React.useEffect(() => {
        elapsedTime.current = 0
        const startTime = Date.now()
        const handler = setInterval(() => {
            elapsedTime.current = (Date.now() - startTime) / 1000
            props.onElapsed(elapsedTime.current)
            if (props.timer == undefined) return
            const remaining = timer - elapsedTime.current
            const minutes = Math.abs(Math.trunc(remaining / 60))
            const seconds = Math.abs(Math.trunc(remaining % 60))
            const formattedTime = `${remaining < 0 ? '-' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
            const remainingLabel = remaining >= 0 ? 'remaining' : 'overtime (you can still submit)'
            const percent = Math.max((remaining / timer) * 100, 0)
            container$.current.textContent = `${formattedTime} ${remainingLabel}`
            container$.current.style.background = `linear-gradient(1.8rad, orange ${percent}%, red ${percent}%)`
        }, 200)
        return () => clearInterval(handler)
    }, [])

    return props.timer != undefined && <div ref={container$} className={classes.timer} />
}
