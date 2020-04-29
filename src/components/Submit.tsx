import axios from 'axios'
import React from 'react'
import * as spec from '../spec'
import { Session } from './Session'

export const Submit = (props: {
    submission: spec.Form['submission']
    answers: { [id: string]: string }
    sessionOrder: number[]
    times: { [session: string]: number }
}) => {
    const submitting = '# Submitting response\n#### Please wait until the confirmation.'
    const success = '# Submission successful &#x1F49A;\n#### Your submission has been recorded.'
    const fail = '# Submission failed &#x1F534;\n#### Contact the form provider.\n\n'
    const [message, setMessage] = React.useState(submitting)
    const session: spec.Session = { questions: [{ content: [{ text: message }] }] }

    const data = {
        answers: props.answers,
        times: props.times,
        sessionOrder: props.sessionOrder,
        ...(props.submission.uniqueAnswer != undefined ? { uniqueAnswer: props.submission.uniqueAnswer } : {})
    }

    React.useEffect(() => {
        axios
            .post(props.submission.url, data)
            .then(message => setMessage(`${success}\n\n${message.data}`))
            .catch(error => setMessage(`${fail}\n\n${error.toString()}`))
    }, [])

    return <Session session={session} submit={{ enabled: false, text: '' }} onSubmit={() => {}} />
}
