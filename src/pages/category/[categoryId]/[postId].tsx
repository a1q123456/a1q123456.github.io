import PostViewer from "@/components/post-viewer"
import { getCategories, getPost, getPostList } from "@/data/post-data"
import { MainLayout } from "@/layouts/main-layout"
import { Category } from "@/models/category"
import { Post } from "@/models/post"
import { GetStaticPaths, GetStaticProps } from "next"
import styles from '@/styles/post.module.scss'
import Scroller from "@/components/scroller"

export interface PostPageProps {
    categoryId?: string
    post: Post,
    categories?: Category[]
}

const PostPage = (props: PostPageProps) => {
    if (!props.post || !props.categories) {
        return
    }

    return <MainLayout categories={props.categories}>
        <Scroller className={styles.postWrapper}>
            <PostViewer post={props.post} />
        </Scroller>
    </MainLayout>
}

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getPostList()
    return {
        paths: posts.map(post => ({
            params: { categoryId: post.categoryId, postId: post.id }
        })),
        fallback: false
    }
}

export const getStaticProps: GetStaticProps = async urlParams => {
    if (!urlParams.params) {
        return { props: {} }
    }

    return {
        props: {
            categories: await getCategories(),
            post: await getPost(urlParams.params.categoryId as string, urlParams.params.postId as string)
        }
    }
}

export default PostPage
