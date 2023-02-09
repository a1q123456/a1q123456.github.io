import { Post } from "@/models/post"
import styles from "@/styles/post-viewer.module.scss"
import { formatDateTime } from "@/utils/format-datetime"

export interface PostViewerProps {
    post: Post
}

const PostViewer = (props: PostViewerProps) => {
    return <div className={styles.postViewer}>
        <h1>{props.post.title}</h1>
        {props.post.subtitle ? <h2>{props.post.subtitle}</h2> : null}
        <h6 className={styles.postDate}>{formatDateTime(props.post.date)}</h6>
        <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
    </div>
}

export default PostViewer
