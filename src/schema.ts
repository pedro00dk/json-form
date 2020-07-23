/**
 * Form type specification.
 *
 * - `resources`: object with urls to markdown content.
 * - `submission.unique`: unique input for each user that answers the form (the server takes care of it)
 * - `submission.url`: url to submit answer, if not provided the result is printed in the console
 * - `groups.names`: object with order names of the factorial design and the respective session orders
 * - `groups.url`: url to fetch current orders count from the server, if not provided, an order is chosen randomly
 * - `transform`: string of a javascript function to transform all questions markdown and texts and resources string.
 *      It has the following signature: `(text: string) => string`
 * - `session`: array containing form sessions
 *
 */
export type Form = {
    resources?: { [name: string]: string }
    submission: { uniqueAnswer?: string; url?: string }
    groups: { names: { [id: string]: number[] }; url?: string }
    transform?: string
    sessions: Session[]
}

/**
 * Session of the form.
 *
 * - `timer`: if provided, a timer will be displayed in the session, timers do not prevent users from submitting
 * - `transform`: string of a javascript function to transform all questions markdown and texts and resources string.
 *      It has the following signature: `(text: string, answers: {[id: string]: string}) => string`.
 *      This transform is applied after `form.transform`
 * - `questions`: list of questions of the session
 */
export type Session = {
    timer?: number
    transform?: string
    questions: Question[]
}

/**
 * Question specification.
 *
 * - `content`: array containing question contents
 * - `content.markdownText`: markdown text to be rendered
 * - `content.markdownResource`: markdown resource name, see Form.resources
 * - `content.video`: url to a youtube video (must be embed)
 * - `content.input`: inputs field specifications to collect user data
 */
export type Question = {
    content: { markdownText?: string; markdownResource?: string; video?: string; input?: Input }[]
}

/**
 * User input specification.
 *
 * - `id`: a unique input id
 * - `required`: if the input is required, if not provided, it is false by default
 * - `type`: object containing the structure of the input
 */
export type Input = {
    id: string
    required?: boolean
    type: { short?: Short; long?: Long; multi?: Multi; likert?: Likert }
}

/**
 * Input types.
 *
 * `Short`: single line inputs
 * `Short.placeholder`: placeholder for when the content is empty
 * `Short.validator`: function to validate the input, if not provided, always accept any input
 * `Long`: multi line inputs
 * `Long.placeholder`: placeholder for when the content is empty
 * `Long.validator`: function to validate the input, if not provided, always accept any input
 * `Multi`: radio input
 * `Multi.options`: array containing radio options
 * `Likert`: linear scale
 * `Likert.first`: first value
 * `Likert.last`: last value
 * `Likert.size`: number of options
 */
export type Short = { placeholder: string; validator?: string }
export type Long = { placeholder: string; validator?: string }
export type Multi = { options: string[] }
export type Likert = { first: string; last: string; size: number }
