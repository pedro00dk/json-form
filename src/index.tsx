import '@babel/polyfill' // regeneratorRuntime
import React from 'react'
import ReactDom from 'react-dom'
import testSpec from '../spec/test.yaml'
import { Form } from './components/Form'
import * as spec from './spec'

const init = async () => {
    const url = window.location.hash.substring(1)
    ReactDom.render(
        <Form url={url} form={(process.env['MODE'] == 'test' ? testSpec : undefined) as spec.Form} />,
        document.getElementById('root')
    )
}

init()
