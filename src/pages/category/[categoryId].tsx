import PostList from "@/components/post-list"
import PostPreviewer from "@/components/post-previewer"
import PostDataContext from "@/contexts/post-data-context"
import { getCategories, getPostList } from "@/data/post-data"
import { MainLayout } from "@/layouts/main-layout"
import { Category } from "@/models/category"
import { Post } from "@/models/post"
import { GetStaticPaths, GetStaticProps } from "next"

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
            <PostList posts={props.posts} />
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
