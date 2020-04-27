import { css } from 'emotion'
import React, { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import * as spec from './spec'

const classes = {
    form: {
        container: 'd-flex justify-content-center vw-100',
        content: `d-flex flex-column m-4 ${css({ width: 640 })}`
    },
    session: {
        container: 'd-flex flex-column my-2',
        timer: `d-flex align-items-center justify-content-center ${css({ height: 50, fontSize: '2rem' })}`,
        button: 'btn btn-info border rounded mt-2'
    },
    question: {
        container: 'd-flex flex-column align-items-center bg-light border rounded my-2 p-4',
        split: 'd-flex border w-100 my-2'
    },
    text: {
        markdown: 'd-flex flex-column'
    },
    video: {},
    answer: {
        container: 'd-flex flex-column w-100',
        required: 'text-danger'
    },
    short: { input: 'w-75' },
    long: { input: `w-100 ${css({ height: '300px' })}` },
    multi: { container: 'd-flex flex-column' },
    likert: { container: 'd-flex justify-content-between' }
}

document.body.style.background = '#ede7f6'

export const Form = (props: { form: spec.Form }) => {
    const { sessions = [] } = props.form
    const [currentSession, setCurrentSession] = React.useState(0)
    const answers = React.useRef({})
    const times = React.useRef([])

    const next = (sessionAnswers: { [id: string]: string }, sessionTime: number) => {
        console.log(sessionAnswers, sessionTime)
        answers.current = { ...answers.current, sessionAnswers }
        times.current.push(sessionTime)
        setCurrentSession(currentSession + 1)
    }

    return (
        <div className={classes.form.container}>
            <div className={classes.form.content}>
                {currentSession < sessions.length && (
                    <Session key={currentSession} session={sessions[currentSession]} next={next} last={currentSession === sessions.length - 1} />
                )}
            </div>
        </div>
    )
}

const Session = (props: {
    session: spec.Session
    next: (answers: { [id: string]: string }, time: number) => void
    last: boolean
}) => {
    const timer$ = React.useRef<HTMLDivElement>()
    const { questions = [], timeLimit = undefined } = props.session
    const answerTracker = React.useRef<{ [id: string]: { required: boolean; ref$: HTMLElement; answer: string } }>({})
    const timeTracker = React.useRef(0)

    const createAnswer = (id: string, required: boolean, ref$: HTMLDivElement) =>
        (answerTracker.current[id] = { required, ref$: ref$, answer: '' })

    const onAnswer = (id: string, answer: string) => (answerTracker.current[id].answer = answer)

    const verifyAnswers = () => {
        const missingAnswers = Object.entries(answerTracker.current).filter(
            ([, { required, answer }]) => required && !answer
        )
        if (missingAnswers.length > 0) {
            Object.values(answerTracker.current).forEach(({ ref$ }) => (ref$.style.border = 'none'))
            missingAnswers.forEach(([, { ref$ }]) => (ref$.style.border = '2px solid red'))
            const firstAnswerElement$ = missingAnswers[0][1].ref$
            window.scrollTo(0, firstAnswerElement$.offsetTop - 20)
        } else {
            const answers: { [id: string]: string } = Object.fromEntries(
                Object.entries(answerTracker.current).map(([id, { answer }]) => [id, answer])
            )
            const time = timeTracker.current
            return props.next(answers, time)
        }
    }

    React.useEffect(() => {
        const startTime = Date.now()
        timeTracker.current = 0
        const handler = setInterval(() => (timeTracker.current = (Date.now() - startTime) / 1000), 200)
        return () => clearInterval(handler)
    }, [])

    React.useEffect(() => {
        if (timeLimit == undefined) return
        const handler = setInterval(() => {
            const remainingTime = timeLimit - timeTracker.current
            const proportion = remainingTime / timeLimit
            const minutes = remainingTime / 60
            const seconds = Math.trunc(Math.abs(minutes - Math.trunc(minutes)) * 60)
            const time = `${Math.abs(Math.trunc(minutes))}:${seconds < 10 ? '0' : ''}${seconds}`
            const remainingTimeString = `${minutes >= 0 ? '' : '-'}${time}`
            const remainingTimeLabel = minutes >= 0 ? 'remaining' : 'overtime (you can still submit)'
            timer$.current.textContent = `${remainingTimeString} ${remainingTimeLabel}`
            timer$.current.style.background =
                proportion >= 0
                    ? `linear-gradient(1.8rad, orange ${proportion * 100}%, yellow ${proportion * 100}%)`
                    : 'red'
        }, 200)
        return () => clearInterval(handler)
    }, [])

    return (
        <>
            {timeLimit > 0 && <div ref={timer$} className={classes.session.timer} />}
            <div className={classes.session.container}>
                {questions.map((question, i) => (
                    <Question key={i} question={question} createAnswer={createAnswer} onAnswer={onAnswer} />
                ))}
                <input
                    className={classes.session.button}
                    type='button'
                    value={props.last ? 'Submit' : 'Next'}
                    onClick={() => verifyAnswers()}
                />
            </div>
        </>
    )
}

const Question = (props: {
    question: spec.Question
    createAnswer: (id: string, required: boolean, ref$: HTMLDivElement) => void
    onAnswer: (id: string, answer: string) => void
}) => {
    const { content = [] } = props.question
    return (
        <div className={classes.question.container}>
            {content.map((part, i) => (
                <Fragment key={i}>
                    {i > 0 && <span className={classes.question.split} />}
                    {part.text != undefined ? (
                        <Text text={part.text} />
                    ) : part.video != undefined ? (
                        <Video video={part.video} />
                    ) : (
                        <Answer answer={part.answer} createAnswer={props.createAnswer} onAnswer={props.onAnswer} />
                    )}
                </Fragment>
            ))}
        </div>
    )
}

const Text = (props: { text: spec.Text }) => (
    <div className='d-flex flex-column w-100'>
        <ReactMarkdown source={props.text} />
    </div>
)

const Video = (props: { video: spec.Video }) => {
    const container$ = React.useRef<HTMLIFrameElement>()

    React.useLayoutEffect(() => {
        const onResize = () => (container$.current.style.height = `${container$.current.clientWidth * (9 / 16)}px`)
        onResize()
        addEventListener('resize', onResize)
        return () => removeEventListener('resize', onResize)
    }, [container$.current])

    return <iframe ref={container$} className='d-flex w-100' src={props.video} />
}

const Answer = (props: {
    answer: spec.Answer
    createAnswer: (id: string, required: boolean, ref$: HTMLDivElement) => void
    onAnswer: (id: string, answer: string) => void
}) => {
    const container$ = React.useRef<HTMLDivElement>()
    const { id, required, type } = props.answer
    const { short, long, multi, likert } = type

    React.useEffect(() => {
        props.createAnswer(id, required, container$.current)
    }, [])

    const onAnswer = (value: string) => {
        if (value == undefined) return
        props.onAnswer(id, value)
    }

    return (
        <div ref={container$} className={classes.answer.container}>
            {short && <Short short={short} onAnswer={onAnswer} />}
            {long && <Long long={long} onAnswer={onAnswer} />}
            {multi && <Multi multi={multi} onAnswer={onAnswer} />}
            {likert && <Likert likert={likert} onAnswer={onAnswer} />}
            {required && <span className={classes.answer.required}>{'* required'}</span>}
        </div>
    )
}

const Short = (props: { short: spec.Short; onAnswer: (answer: string) => void }) => {
    const { placeholder = 'short answer' } = props.short
    return (
        <input
            className={classes.short.input}
            type='text'
            placeholder={placeholder}
            onChange={event => props.onAnswer(event.target.value)}
        />
    )
}

const Long = (props: { long: spec.Long; onAnswer: (answer: string) => void }) => {
    const { placeholder = 'long answer' } = props.long
    return (
        <textarea
            className={classes.long.input}
            placeholder={placeholder}
            onChange={event => props.onAnswer(event.target.value)}
        />
    )
}

const Multi = (props: { multi: spec.Multi; onAnswer: (answer: string) => void }) => {
    const { options = [] } = props.multi
    const group = React.useMemo(() => Math.random().toString(), [])
    return (
        <div className={classes.multi.container}>
            {options.map((option, i) => {
                return (
                    <div key={i}>
                        <input
                            type='radio'
                            name={group}
                            id={option}
                            value={option}
                            onChange={event => props.onAnswer(event.target.id)}
                        />
                        <label htmlFor={option}>{option}</label>
                    </div>
                )
            })}
        </div>
    )
}

const Likert = (props: { likert: spec.Likert; onAnswer: (answer: string) => void }) => {
    const { first = 'fully disagree', last = 'fully agree', size = 5 } = props.likert
    const group = React.useMemo(() => Math.random().toString(), [])
    return (
        <div className={classes.likert.container}>
            <span>{first}</span>
            {Array(Math.min(Math.max(2, size), 10))
                .fill(undefined)
                .map((_, i) => {
                    return (
                        <span key={i}>
                            <input
                                type='radio'
                                name={group}
                                id={i.toString()}
                                value={(i + 1).toString()}
                                onChange={event => props.onAnswer(event.target.value)}
                            />
                            <label htmlFor={i.toString()}>{(i + 1).toString()}</label>
                        </span>
                    )
                })}
            <span>{last}</span>
        </div>
    )
}
