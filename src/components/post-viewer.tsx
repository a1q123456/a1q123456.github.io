import { Post } from "@/models/post"

export interface PostViewerProps {
    post: Post
}

const PostViewer = (props: PostViewerProps) => {
    return <div dangerouslySetInnerHTML={{ __html: props.post.content }} />
}

export default PostViewer
