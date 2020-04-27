import { css } from 'emotion'
import React from 'react'
import { Question } from '../Form'
import * as spec from '../spec'

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
    const { questions = [], timeLimit = undefined } = props.session
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
            {timeLimit > 0 && <Timer timeLimit={timeLimit} onElapsed={e => (timeTracker.current = e)} />}
            {questions.map((question, i) => (
                <Question key={i} question={question} createAnswer={createAnswer} onAnswer={onAnswer} />
            ))}
            {props.submit.enabled && (
                <input className={classes.submit} type='button' value={props.submit.text} onClick={submit} />
            )}
        </div>
    )
}

const Timer = (props: { timeLimit: number; onElapsed: (elapsed: number) => void }) => {
    const container$ = React.useRef<HTMLDivElement>()
    const elapsedTime = React.useRef(0)

    React.useEffect(() => {
        elapsedTime.current = 0
        const startTime = Date.now()
        const handler = setInterval(() => {
            elapsedTime.current = (Date.now() - startTime) / 1000
            props.onElapsed(elapsedTime.current)
            const remaining = props.timeLimit - elapsedTime.current
            const minutes = Math.abs(Math.trunc(remaining / 60))
            const seconds = Math.abs(Math.trunc(remaining % 60))
            const formattedTime = `${remaining < 0 ? '-' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
            const remainingLabel = minutes >= 0 ? 'remaining' : 'overtime (you can still submit)'
            const percent = Math.max((remaining / props.timeLimit) * 100, 0)
            container$.current.textContent = `${formattedTime} ${remainingLabel}`
            container$.current.style.background = `linear-gradient(1.8rad, orange ${percent}%, red ${percent}%)`
        }, 200)
        return () => clearInterval(handler)
    }, [])

    return <div ref={container$} className={classes.timer} />
}
