import path from "path";
import { promises as fs } from "fs"
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeFormat from "rehype-format";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import rehypeHighlight from "rehype-highlight";
import { matter } from 'vfile-matter'


const BLOG_DIR = path.join(process.cwd(), "blogs")
const PREVIEW_FILE_LINES = 30

interface MarkdownMetadata {
    title: string
}

const renderMd = async (mdContent: string, fullData: boolean) => {
    const result = await remark()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter, ['yaml', 'toml'])
        .use(() => (_, file) => { matter(file) })
        .use(remarkRehype)
        .use(rehypeFormat)
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .process(fullData ? mdContent : mdContent.split('\n').slice(0, PREVIEW_FILE_LINES).join('\n'))
    return {
        title: (result.data.matter as MarkdownMetadata).title,
        content: result.value
    }
}

export const getCategories = async () => {
    const categoryFolders = (await fs.readdir(BLOG_DIR)).map(folder => path.join(BLOG_DIR, folder))

    return Promise.all(categoryFolders
        .map(async categoryFolder => ({
            id: path.basename(categoryFolder),
            title: JSON.parse(await fs.readFile(path.join(categoryFolder, "metadata.json"), 'utf-8'))['title']
        })))
}

const getPostListForCategory = async (categoryId: string) => {
    const categoryFolder = path.join(BLOG_DIR, categoryId)

    const fileNames = (await fs.readdir(categoryFolder, 'utf-8'))
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => path.join(categoryFolder, fileName))

    const postList = await Promise.all(fileNames.map(async mdFile => {
        const { content, title } = await renderMd(await fs.readFile(mdFile, 'utf-8'), false)

        return {
            categoryId: path.basename(path.dirname(mdFile)),
            title,
            id: path.parse(mdFile).name,
            createdDateTime: (await fs.stat(mdFile)).ctime.getTime(),
            content
        }
    }))

    return postList.filter(post => post.categoryId == categoryId)
}

export const getPost = async (categoryId: string, postId: string) => {
    const mdFile = path.join(BLOG_DIR, categoryId, `${postId}.md`)
    const { content, title } = await renderMd(await fs.readFile(mdFile, 'utf-8'), true)
    return {
        categoryId: path.basename(path.dirname(mdFile)),
        title,
        id: path.parse(mdFile).name,
        createdDateTime: (await fs.stat(mdFile)).ctime.getTime(),
        content
    }
}

export const getPostList = async (categoryId?: string) => {
    if (categoryId) {
        return getPostListForCategory(categoryId)
    }
    const posts = await Promise.all((await getCategories())
        .map(async category => await getPostListForCategory(category.id)))

    return posts.flat()
}