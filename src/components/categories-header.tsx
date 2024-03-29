import PostDataContext from "@/contexts/post-data-context"
import { Category } from "@/models/category"
import Link from 'next/link'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars } from '@fortawesome/free-solid-svg-icons'
import linkedInLogo from '@/images/LI-In-Bug.png'
import githubLogo from '@/images/github-mark.svg'
import Image from "next/image"
import styles from "@/styles/category-header.module.scss"

const CategoriesHeader = () => {

    const renderPostHeader = (categories: Category[]) => {
        return <div className={styles.header}>
            <input type="checkbox" hidden className={styles.headerExpandToggle} id="header-expand-toggle" />
            <p className={styles.headerTitle}>TechBlog()</p>
            <div className={styles.socalProfilesWrapper}>
                <a rel="noreferrer" target="_blank" className={styles.linkedIn} href="https://www.linkedin.com/in/jingchen-wu-95500213b/">
                    <Image src={linkedInLogo} alt="LinkedIn" />
                    <span>LinedIn</span>
                </a>
                <a rel="noreferrer" target="_blank" className={styles.github} href="https://github.com/a1q123456">
                    <Image src={githubLogo} alt="Github" />
                    <span>Github</span>
                </a>
            </div>
            <label htmlFor="header-expand-toggle" className={styles.headerItemButton}>
                <FontAwesomeIcon icon={faBars} />
            </label>
            <div className={styles.headerItemList}>
                <div className={styles.headerItemWrapper}>
                    <Link className={`${styles.headerItem}`} href='/'><span>Home</span></Link>
                    {
                        categories.map(category => <Link className={`${styles.headerItem}`} key={category.id} href={{
                            pathname: '/category/[categoryId]',
                            query: { categoryId: category.id }
                        }}><span>{category.title}</span></Link>)
                    }
                </div>
            </div>
        </div >
    }

    return <PostDataContext.Consumer>
        {value => renderPostHeader(value)}
    </PostDataContext.Consumer>
}

export default CategoriesHeader
