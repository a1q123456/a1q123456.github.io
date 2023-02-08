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
    return <MainLayout categories={props.categories}>
        <PostList posts={props.latestPosts} />
    </MainLayout>
}

export const getStaticProps = async () => {
    return {
        props: {
            categories: await getCategories(),
            latestPosts: await getPostList(),
        },
    }
}