import axios from 'axios'
import React from 'react'
import * as spec from '../spec'
import { Session } from './Session'

export const Submit = (props: { data: any; url: string }) => {
    const submitting = '# Submitting response\n#### Please wait until the confirmation.'
    const success = '# Submission successful &#x1F49A;\n#### Your submission has been recorded.'
    const fail = '# Submission failed &#x1F534;\n#### Contact the form provider.\n\n'
    const [message, setMessage] = React.useState(submitting)
    const session: spec.Session = { questions: [{ content: [{ text: message }] }] }

    React.useEffect(() => {
        axios
            .post(props.url, props.data)
            .then(() => setMessage(success))
            .catch(error => setMessage(fail + error.toString()))
    }, [])

    return <Session session={session} submit={{ enabled: false, text: '' }} onSubmit={() => {}} />
}
