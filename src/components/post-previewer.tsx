import { Post } from "@/models/post"
import Link from "next/link"
import styles from "@/styles/post-previewer.module.scss"
import { formatDateTime } from "@/utils/format-datetime"

export interface PostPreviewerProps {
    post: Post
}

const PostPreviewer = (props: PostPreviewerProps) => {
    return <div className={styles.postItem}>
        <Link legacyBehavior href={{
            pathname: '/category/[categoryId]/[postId]',
            query: { categoryId: props.post.categoryId, postId: props.post.id }
        }}>
            <div className={styles.postPresenter}>
                <h1>{props.post.title}</h1>
                <h6 className={styles.postDate}>{formatDateTime(props.post.createdDateTime)}</h6>
                <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
            </div>
        </Link>
    </div>
}

export default PostPreviewer
