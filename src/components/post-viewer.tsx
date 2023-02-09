import { Post } from "@/models/post"
import styles from "@/styles/post-viewer.module.scss"
import { formatDateTime } from "@/utils/format-datetime"

export interface PostViewerProps {
    post: Post
    previewMode?: boolean
}

const PostViewer = (props: PostViewerProps) => {
    return <div className={`${styles.postViewer} ${props.previewMode ? styles.preview : ''}`}>
        <h1>{props.post.title}</h1>
        {props.post.subtitle ? <h2>{props.post.subtitle}</h2> : null}
        <h6 className={styles.postDate}>{formatDateTime(props.post.date)}</h6>
        <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
        {props.previewMode ? <div className={styles.mask} /> : null}
    </div>
}

export default PostViewer
