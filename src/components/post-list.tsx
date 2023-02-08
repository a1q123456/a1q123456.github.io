import { Post } from "@/models/post"
import PostPreviewer from "./post-previewer"
import styles from "@/styles/post-list.module.scss"
import { useRouter } from "next/router"
import { useState } from "react"

export interface PostListProps {
    posts: Post[]
}

const PostList = (props: PostListProps) => {
    const router = useRouter()
    const [activePost, setActivePost] = useState<[string, string]>()

    const isActive = (categoryId: string, postId: string) => {
        if (!activePost) {
            return false
        }
        const [currentCategoryId, currentPostId] = activePost
        return currentCategoryId === categoryId && currentPostId === postId
    }

    const navigateToPost = async (target: HTMLElement, categoryId: string, postId: string) => {
        if (activePost) {
            return
        }

        setActivePost([categoryId, postId])
        target.style.transform = `translateY(-${target.getBoundingClientRect().top - 150}px)`
        target.style.zIndex = '11'

        await new Promise(resolve => setTimeout(resolve, 500))
        router.push(`/category/${categoryId}/${postId}`)
    }

    return <div className={styles.postList}>
        {props.posts.map((post, i) => <div
            key={i}
            className={`${styles.postLinkButton}  ${isActive(post.categoryId, post.id) ? styles.active : ''}`}
            onClick={e => navigateToPost(e.target as HTMLElement, post.categoryId, post.id)}>
            <PostPreviewer post={post} />
        </div>)
        }
    </div>
}

export default PostList
