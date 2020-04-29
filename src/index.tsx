import '@babel/polyfill' // regeneratorRuntime
import React from 'react'
import ReactDom from 'react-dom'
import { Form } from './components/Form'

const init = async () => {
    const url = window.location.hash.substring(1)
    ReactDom.render(<Form url={url} />, document.getElementById('root'))
}

init()
