import PostDataContext from "@/contexts/post-data-context"
import getPostData from "@/data/post-data"
import { Category } from "@/models/category"
import { ReactNode } from "react"

const PostDataContextProvider = (props: { children?: ReactNode | undefined, categories?: Category[] }) => {
    if (!props.categories) {
        return null
    }
    return <PostDataContext.Provider value={props.categories}>
        {props.children}
    </PostDataContext.Provider>
}

const getStaticProps = async () => {
    const postData = await getPostData()

    const categories = postData.categories.map(category => ({
        ...category,
        posts: postData.postList
            .filter(post => post.categoryId == category.id)
    }))

    return {
        props: {
            categories,
        },
    }
}

export default PostDataContextProvider
export {
    getStaticProps
}
