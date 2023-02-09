import { Category } from '@/models/category'
import { MainLayout } from '@/layouts/main-layout'
import { getCategories, getPostList } from '@/data/post-data'
import PostList from '@/components/post-list'
import { Post } from '@/models/post'
import Scroller from '@/components/scroller'

interface HomeProps {
    categories: Category[]
    latestPosts: Post[]
}

export default function Home(props: HomeProps) {
    return <MainLayout categories={props.categories}>
        <Scroller>
            <PostList posts={props.latestPosts} />
        </Scroller>
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