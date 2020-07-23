import { css } from 'emotion'
import React from 'react'
import * as schema from '../schema'

const classes = {
    input: {
        container: 'd-flex flex-column w-100',
        required: 'text-danger'
    },
    short: { input: 'w-75' },
    long: { input: `w-100 ${css({ height: '300px' })}` },
    multi: { container: 'd-flex flex-column' },
    likert: { container: 'd-flex justify-content-between' }
}

export const Input = (props: {
    input: schema.Input
    trackInput: (id: string, required: boolean, ref$: HTMLDivElement) => void
    onInput: (id: string, answer: string) => void
}) => {
    const container$ = React.useRef<HTMLDivElement>()
    const { id, required = false, type } = props.input
    const { short, long, multi, likert } = type

    React.useEffect(() => {
        props.trackInput(id, required, container$.current)
    }, [])

    const onInput = (value: string) => {
        if (value == undefined) return
        props.onInput(id, value)
    }

    return (
        <div ref={container$} className={classes.input.container}>
            {short && <Short short={short} onInput={onInput} />}
            {long && <Long long={long} onInput={onInput} />}
            {multi && <Multi multi={multi} onInput={onInput} />}
            {likert && <Likert likert={likert} onInput={onInput} />}
            {required && <span className={classes.input.required}>{'* required'}</span>}
        </div>
    )
}

const Short = (props: { short: schema.Short; onInput: (answer: string) => void }) => {
    const { placeholder = 'short answer' } = props.short
    return (
        <input
            className={classes.short.input}
            type='text'
            placeholder={placeholder}
            onChange={event => props.onInput(event.target.value)}
        />
    )
}

const Long = (props: { long: schema.Long; onInput: (answer: string) => void }) => {
    const { placeholder = 'long answer' } = props.long
    return (
        <textarea
            className={classes.long.input}
            placeholder={placeholder}
            onChange={event => props.onInput(event.target.value)}
        />
    )
}

const Multi = (props: { multi: schema.Multi; onInput: (answer: string) => void }) => {
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
                            onChange={event => props.onInput(event.target.id)}
                        />
                        <label htmlFor={option}>{option}</label>
                    </div>
                )
            })}
        </div>
    )
}

const Likert = (props: { likert: schema.Likert; onInput: (answer: string) => void }) => {
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
                                onChange={event => props.onInput(event.target.value)}
                            />
                            <label htmlFor={i.toString()}>{(i + 1).toString()}</label>
                        </span>
                    )
                })}
            <span>{last}</span>
        </div>
    )
}
