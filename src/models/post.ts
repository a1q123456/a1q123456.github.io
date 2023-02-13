import { ReactElement } from "react"

export interface Post {
    id: string
    categoryId: string
    title: string
    subtitle?: string
    content: string
    date: number
}
