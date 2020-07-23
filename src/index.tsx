import '@babel/polyfill' // regeneratorRuntime
import React from 'react'
import ReactDom from 'react-dom'
import testForm from '../test/test.yaml'
import { Form } from './components/Form'
import * as schema from './schema'

const test = process.env['TESTING'] === 'true'
const url = window.location.hash.substring(1)

console.log('testing mode:', test)
console.log('test form:', test ? testForm : undefined)
console.log('hash url:', url)

ReactDom.render(
    <Form url={url.length > 0 ? url : undefined} form={(test ? testForm : undefined) as schema.Form} />,
    document.getElementById('root')
)
