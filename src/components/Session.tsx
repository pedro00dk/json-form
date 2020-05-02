import { css } from 'emotion'
import React from 'react'
import * as spec from '../spec'
import { Question } from './Question'

const classes = {
    container: 'd-flex flex-column',
    submit: 'btn btn-info border rounded mt-2',
    timer: `d-flex align-items-center justify-content-center mb-2 ${css({ height: 50, fontSize: '2rem' })}`
}

export const Session = (props: {
    session: spec.Session
    submit: { enabled: boolean; text: string }
    onSubmit: (answers: { [id: string]: string }, time: number) => void
}) => {
    const answerTracker = React.useRef<{ [id: string]: { required: boolean; ref$: HTMLElement; answer: string } }>({})
    const timeTracker = React.useRef(0)

    const createAnswer = (id: string, required: boolean, ref$: HTMLDivElement) =>
        (answerTracker.current[id] = { required, ref$: ref$, answer: '' })

    const onAnswer = (id: string, answer: string) => (answerTracker.current[id].answer = answer ?? '')

    const submit = () => {
        const missing = Object.entries(answerTracker.current).filter(([, { required, answer }]) => required && !answer)
        if (missing.length > 0) {
            Object.values(answerTracker.current).forEach(({ ref$ }) => (ref$.style.border = 'none'))
            missing.forEach(([, { ref$ }]) => (ref$.style.border = '2px solid red'))
            const firstMissing = missing[0][1].ref$
            window.scrollTo(0, firstMissing.offsetTop - 20)
        } else {
            const answers: { [id: string]: string } = Object.fromEntries(
                Object.entries(answerTracker.current).map(([id, { answer }]) => [id, answer])
            )
            const time = timeTracker.current
            return props.onSubmit(answers, time)
        }
    }

    return (
        <div className={classes.container}>
            <Timer timer={props.session.timer} onElapsed={e => (timeTracker.current = e)} />
            {props.session.questions.map((question, i) => (
                <Question key={i} question={question} createAnswer={createAnswer} onAnswer={onAnswer} />
            ))}
            {props.submit.enabled && (
                <input className={classes.submit} type='button' value={props.submit.text} onClick={submit} />
            )}
        </div>
    )
}

const Timer = (props: { timer: number; onElapsed: (elapsed: number) => void }) => {
    const container$ = React.useRef<HTMLDivElement>()
    const elapsedTime = React.useRef(0)

    React.useEffect(() => {
        elapsedTime.current = 0
        const startTime = Date.now()
        const handler = setInterval(() => {
            elapsedTime.current = (Date.now() - startTime) / 1000
            props.onElapsed(elapsedTime.current)
            const remaining = props.timer - elapsedTime.current
            const minutes = Math.abs(Math.trunc(remaining / 60))
            const seconds = Math.abs(Math.trunc(remaining % 60))
            const formattedTime = `${remaining < 0 ? '-' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
            const remainingLabel = remaining >= 0 ? 'remaining' : 'overtime (you can still submit)'
            const percent = Math.max((remaining / props.timer) * 100, 0)
            container$.current.textContent = `${formattedTime} ${remainingLabel}`
            container$.current.style.background = `linear-gradient(1.8rad, orange ${percent}%, red ${percent}%)`
        }, 200)
        return () => clearInterval(handler)
    }, [])

    return props.timer > 0 && <div ref={container$} className={classes.timer} />
}
