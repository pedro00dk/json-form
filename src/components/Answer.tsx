import { css } from 'emotion'
import React from 'react'
import * as spec from '../spec'

const classes = {
    answer: {
        container: 'd-flex flex-column w-100',
        required: 'text-danger'
    },
    short: { input: 'w-75' },
    long: { input: `w-100 ${css({ height: '300px' })}` },
    multi: { container: 'd-flex flex-column' },
    likert: { container: 'd-flex justify-content-between' }
}

export const Answer = (props: {
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
    const { options } = props.multi
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
    const { first, last, size = 5 } = props.likert
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
