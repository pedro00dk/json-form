import React from 'react'
import * as schema from '../schema'
import { Session } from './Session'

export const Info = (props: { markdown: string; form: schema.Form }) => {
    const session: schema.Session = { questions: [{ content: [{ markdownText: props.markdown }] }] }
    return (
        <Session
            form={props.form}
            session={session}
            resources={{}}
            answers={{}}
            next={{ enabled: false, text: '' }}
            onNext={() => {}}
        />
    )
}
