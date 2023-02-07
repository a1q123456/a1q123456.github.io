import PostDataContext from "@/contexts/post-data-context"
import { Category } from "@/models/category"
import Link from 'next/link'
import styles from "@/styles/category-header.module.scss"

const CategoriesHeader = () => {
    const renderPostHeader = (categories: Category[]) => {
        return <div className={styles.header}>
            <p className={styles.headerTitle}><code>{"TechBlog();"}</code></p>
            <div className={styles.headerItemList}>
                <Link className={`${styles.headerItem}`} href='/'><span>Home</span></Link>
                {
                    categories.map(category => <Link className={`${styles.headerItem}`} key={category.id} href={{
                        pathname: '/category/[categoryId]',
                        query: { categoryId: category.id }
                    }}><span>{category.title}</span></Link>)
                }
                <Link className={`${styles.headerItem}`} href='/all'><span>All Posts</span></Link>
            </div>
        </div>
    }

    return <PostDataContext.Consumer>
        {value => renderPostHeader(value)}
    </PostDataContext.Consumer>
}

export default CategoriesHeader
