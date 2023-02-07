import PostPreviewer from "@/components/post-previewer"
import PostDataContext from "@/contexts/post-data-context"
import { getCategories, getPostList } from "@/data/post-data"
import { MainLayout } from "@/layouts/main-layout"
import { Category } from "@/models/category"
import { Post } from "@/models/post"
import { GetStaticPaths, GetStaticProps } from "next"
import styles from "@/styles/post-list.module.scss"

export interface CategoryPostListProps {
    categoryId?: string
    categoryTitle?: string
    posts?: Post[],
    categories?: Category[]
}

const CategoryPostList = (props: CategoryPostListProps) => {
    if (!props.posts || !props.categories) {
        return
    }

    return <PostDataContext.Provider value={props.categories}>
        <MainLayout>
            <div className={styles.postList}>
                {props.posts.map((post, i) => <PostPreviewer key={i} post={post} />)}
            </div>
        </MainLayout>
    </PostDataContext.Provider>
}

export const getStaticPaths: GetStaticPaths = async () => {
    const categories = await getCategories()
    return {
        paths: categories.map(category => ({
            params: { categoryId: category.id }
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
            posts: await getPostList(urlParams.params.categoryId as string)
        }
    }
}

export default CategoryPostList
