import { Post } from "@/models/post"
import styles from "@/styles/post-list.module.scss"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import PostViewer from "./post-viewer"

export interface PostListProps {
    posts: Post[]
}

const PostList = (props: PostListProps) => {
    const router = useRouter()
    const itemsRef = useRef<HTMLDivElement[]>([]);
    const [activePost, setActivePost] = useState<[string, string]>()

    useEffect(() => {
       itemsRef.current = itemsRef.current.slice(0, props.posts.length);
    }, [props.posts]);

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
            ref={r => r ? itemsRef.current[i] = r : null}
            className={`${styles.postLinkButton}  ${isActive(post.categoryId, post.id) ? styles.active : ''}`}
            onClick={e => navigateToPost(itemsRef.current[i], post.categoryId, post.id)}>
            <PostViewer post={post} previewMode />
        </div>)
        }
        <div className={styles.mask} />
    </div>
}

export default PostList
