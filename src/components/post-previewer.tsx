import { Post } from "@/models/post"
import Link from "next/link"
import styles from "@/styles/post-previewer.module.scss"

export interface PostPReviewerProps {
    post: Post
}

const PostPreviewer = (props: PostPReviewerProps) => {
    return <Link legacyBehavior href={{
        pathname: '/category/[categoryId]/[postId]',
        query: { categoryId: props.post.categoryId, postId: props.post.id }
    }}>
        <div className={styles.postItem}>
            <h1>{props.post.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
        </div>
    </Link>
}

export default PostPreviewer
