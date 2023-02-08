import { Post } from "@/models/post"
import PostPreviewer from "./post-previewer"
import styles from "@/styles/post-list.module.scss"

export interface PostListProps {
    posts: Post[]
}

const PostList = (props: PostListProps) => <div className={styles.postList}>
    {props.posts.map((post, i) => <PostPreviewer key={i} post={post} />)}
</div>

export default PostList
