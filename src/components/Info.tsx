import React from 'react'
import * as spec from '../spec'
import { Session } from './Session'

export const Info = (props: { info: string }) => {
    const session: spec.Session = { questions: [{ content: [{ text: props.info }] }] }
    return <Session session={session} submit={{ enabled: false, text: '' }} onSubmit={() => {}} />
}
