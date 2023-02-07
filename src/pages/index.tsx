import PostDataContext from '@/contexts/post-data-context'
import { Category } from '@/models/category'
import { MainLayout } from '@/layouts/main-layout'
import { getCategories } from '@/data/post-data'

export default function Home(props: { categories: Category[] }) {
    return <PostDataContext.Provider value={props.categories}>
        <MainLayout>

        </MainLayout>
    </PostDataContext.Provider>
}

export const getStaticProps = async () => {
    return {
        props: {
            categories: await getCategories(),
        },
    }
}