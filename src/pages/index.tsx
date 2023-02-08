import PostDataContext from '@/contexts/post-data-context'
import { Category } from '@/models/category'
import { MainLayout } from '@/layouts/main-layout'
import { getCategories, getPostList } from '@/data/post-data'
import PostList from '@/components/post-list'
import { Post } from '@/models/post'

interface HomeProps {
    categories: Category[]
    latestPosts: Post[]
}

export default function Home(props: HomeProps) {
    return <PostDataContext.Provider value={props.categories}>
        <MainLayout>
            <PostList posts={props.latestPosts} />
        </MainLayout>
    </PostDataContext.Provider>
}

export const getStaticProps = async () => {
    return {
        props: {
            categories: await getCategories(),
            latestPosts: await getPostList(),
        },
    }
}