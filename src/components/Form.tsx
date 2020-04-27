import { css } from 'emotion'
import React from 'react'
import * as spec from '../spec'
import { Session } from './Session'
import { Submit } from './Submit'

const classes = {
    container: 'd-flex justify-content-center vw-100',
    content: `d-flex flex-column m-4 ${css({ width: 640 })}`
}

document.body.style.background = '#ede7f6'

export const Form = (props: { form: spec.Form }) => {
    const { sessions = [] } = props.form
    const [currentSession, setCurrentSession] = React.useState(0)
    const answers = React.useRef<{ [id: string]: string }>({})
    const times = React.useRef<{ [session: string]: number }>({})

    const next = (sessionAnswers: { [id: string]: string }, sessionTime: number) => {
        console.log(sessionAnswers, sessionTime)
        answers.current = { ...answers.current, ...sessionAnswers }
        times.current[currentSession] = sessionTime
        setCurrentSession(currentSession + 1)
    }

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                {currentSession < sessions.length && (
                    <Session
                        key={currentSession}
                        session={sessions[currentSession]}
                        submit={{ enabled: true, text: currentSession < sessions.length - 1 ? 'Next' : 'Submit' }}
                        onSubmit={next}
                    />
                )}
                {sessions.length > 0 && currentSession === sessions.length && (
                    <Submit data={{ answers: answers.current, times: times.current }} url={''} /> // TODO add url support
                )}
            </div>
        </div>
    )
}
