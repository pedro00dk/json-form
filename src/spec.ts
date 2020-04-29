export type Form = {
    submission: {
        url: string
        uniqueAnswer?: string
    }
    sessionOrder?: {
        static?: number[]
        dynamic?: {
            url: string
            orders: number[][]
        }
    }
    sessions: Session[]
}

export type Session = {
    timeLimit?: number
    questions: Question[]
}

export type Question = {
    content: {
        text?: Text
        video?: Video
        answer?: Answer
    }[]
}

export type Text = string

export type Video = string

export type Answer = {
    id: string
    required: boolean
    type: {
        short?: Short
        long?: Long
        multi?: Multi
        likert?: Likert
    }
}

export type Short = { placeholder: string }
export type Long = { placeholder: string }
export type Multi = { options: string[] }
export type Likert = { first: string; last: string; size: number }
