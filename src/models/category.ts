import { Post } from "./post"

export interface Category {
    id: string
    title: string
    posts: Post[]
}
