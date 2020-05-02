import React from 'react'
import ReactMarkdown from 'react-markdown'
import * as spec from '../spec'
import { Answer } from './Answer'

const classes = {
    container: 'd-flex flex-column align-items-center bg-light border rounded my-2 p-4',
    split: 'd-flex border w-100 my-2',
    text: 'd-flex flex-column w-100',
    video: 'd-flex w-100',
    markdown: 'd-flex flex-column'
}

export const Question = (props: {
    question: spec.Question
    createAnswer: (id: string, required: boolean, ref$: HTMLDivElement) => void
    onAnswer: (id: string, answer: string) => void
}) => {
    return (
        <div className={classes.container}>
            {props.question.content.map((part, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className={classes.split} />}
                    {part.text != undefined ? (
                        <Text text={part.text} />
                    ) : part.video != undefined ? (
                        <Video video={part.video} />
                    ) : (
                        <Answer answer={part.answer} createAnswer={props.createAnswer} onAnswer={props.onAnswer} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

const Text = (props: { text: spec.Text }) => (
    <div className={classes.text}>
        <ReactMarkdown source={props.text} escapeHtml={true} />
    </div>
)

const Video = (props: { video: spec.Video }) => {
    const container$ = React.useRef<HTMLIFrameElement>()

    React.useLayoutEffect(() => {
        const onResize = () => (container$.current.style.height = `${container$.current.clientWidth * (9 / 16)}px`)
        onResize()
        addEventListener('resize', onResize)
        return () => removeEventListener('resize', onResize)
    }, [container$.current])

    return <iframe ref={container$} className={classes.video} src={props.video} />
}
