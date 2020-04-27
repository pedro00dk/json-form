import '@babel/polyfill' // regeneratorRuntime
import React from 'react'
import ReactDom from 'react-dom'
import { Form } from './components/Form'

const init = async () => {
    const formAddress = window.location.hash.substring(1)
    console.log('form address:', formAddress)
    const response = await fetch(formAddress).catch(() => console.log('failed to fetch form'))
    const form = response && (await response.json().catch(() => console.log('failed to parse form')))
    console.log('form content:', form)
    ReactDom.render(<Form form={form} />, document.getElementById('root'))
}

init()
