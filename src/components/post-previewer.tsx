import { Post } from "@/models/post"
import styles from "@/styles/post-previewer.module.scss"
import { formatDateTime } from "@/utils/format-datetime"

export interface PostPreviewerProps {
    post: Post
}

const PostPreviewer = (props: PostPreviewerProps) => {

    return <div className={styles.postItem}>
        <div className={styles.postPresenter}>
            <h1>{props.post.title}</h1>
        {props.post.subtitle ? <h2>{props.post.subtitle}</h2> : null}
            <h6 className={styles.postDate}>{formatDateTime(props.post.date)}</h6>
            <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
        </div>
    </div>
}

export default PostPreviewer
