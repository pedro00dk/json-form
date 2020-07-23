import { css } from 'emotion'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import * as schema from '../schema'
import { Input } from './Input'

const classes = {
    container: 'd-flex flex-column align-items-center bg-light border rounded my-2 p-4',
    split: 'd-flex border w-100 my-2',
    text: 'd-flex flex-column w-100',
    video: 'd-flex w-100',
    markdown: 'd-flex flex-column',
    image: `p-absolute w-100 ${css({ transition: 'transform 0.2s', ':hover': { transform: 'scale(1.5)' } })}`
}

export const Question = (props: {
    form: schema.Form
    session: schema.Session
    question: schema.Question
    resources: { [id: string]: string }
    answers: { [id: string]: string }
    trackInput: (id: string, required: boolean, ref$: HTMLDivElement) => void
    onInput: (id: string, answer: string) => void
}) => {
    return (
        <div className={classes.container}>
            {props.question.content.map((content, i) => (
                <React.Fragment key={i}>
                    {content.markdownText != undefined ? (
                        <MarkdownText
                            text={content.markdownText}
                            form={props.form}
                            session={props.session}
                            question={props.question}
                            resources={props.resources}
                            answers={props.answers}
                        />
                    ) : content.markdownResource != undefined ? (
                        <MarkdownText
                            text={
                                props.resources[content.markdownResource.trim()] ??
                                `## resource (${content.markdownResource.trim()}) not found`
                            }
                            {...props}
                        />
                    ) : content.video != undefined ? (
                        <Video video={content.video} />
                    ) : content.input != undefined ? (
                        <Input input={content.input} trackInput={props.trackInput} onInput={props.onInput} />
                    ) : `CONTENT NOT RECOGNIZED ${JSON.stringify(content)}`}
                    {i < props.question.content.length - 1 && <span className={classes.split} />}
                </React.Fragment>
            ))}
        </div>
    )
}

const MarkdownText = (props: {
    text: string
    form?: schema.Form // undefined when info
    session: schema.Session
    question: schema.Question
    resources: { [id: string]: string }
    answers: { [id: string]: string }
}) => {
    let processedText = props.text
    if (props.form?.transform != undefined) {
        let formTransformFunc = undefined as (text: string) => string
        eval(`formTransformFunc = ${props.form.transform}`)
        processedText = formTransformFunc(processedText)
    }
    if (props.session.transform != undefined) {
        let sessionTransformFunc = undefined as (text: string, answers: { [id: string]: string }) => string
        eval(`sessionTransformFunc = ${props.form.transform}`)
        processedText = sessionTransformFunc(processedText, props.answers)
    }

    return (
        <div className={classes.text}>
            <ReactMarkdown source={processedText} renderers={{ image: Image, link: Link }} />
        </div>
    )
}

const Video = (props: { video: string }) => {
    const container$ = React.useRef<HTMLIFrameElement>()

    React.useLayoutEffect(() => {
        const onResize = () => (container$.current.style.height = `${container$.current.clientWidth * (9 / 16)}px`)
        onResize()
        addEventListener('resize', onResize)
        return () => removeEventListener('resize', onResize)
    }, [container$.current])

    return <iframe ref={container$} className={classes.video} src={props.video} />
}

//

const Image = (props: { src: string }) => <img src={props.src} className={classes.image} />

const Link = (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href} target='_blank' rel='noopener noreferrer'>
        {props.children}
    </a>
)
