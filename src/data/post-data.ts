import { promises as fs } from "fs"
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "blogs")

const getPostData = async () => {
    const categoryFolders = (await fs.readdir(BLOG_DIR)).map(folderName => path.join(BLOG_DIR, folderName))

    const mdTitleParser = (mdContent: string) => {
        const titleLine = mdContent.split('\n').filter(line => line.trimStart().startsWith('#'))[0]
        return titleLine.split('#')[1].trim()
    }

    const fileNames = (await Promise.all(categoryFolders
        .map(async categoryFolder => {
            const files = await fs.readdir(categoryFolder, 'utf-8')
            return files.filter(fileName => fileName.endsWith('.md'))
                .map(fileName => path.join(categoryFolder, fileName))
        }))).flat()

    const postList = await Promise.all(fileNames.map(async mdFile => ({
        categoryId: path.basename(path.dirname(mdFile)),
        title: mdTitleParser(await fs.readFile(mdFile, { encoding: 'utf-8' })),
        id: path.basename(mdFile),
        createdDateTime: (await fs.stat(mdFile)).ctime,
        content: await fs.readFile(mdFile, 'utf-8')
    })))

    const categories = await Promise.all(categoryFolders
        .map(async categoryFolder => ({
            id: path.basename(categoryFolder),
            title: JSON.parse(await fs.readFile(path.join(categoryFolder, "metadata.json"), 'utf-8'))['title']
        })))

    return {
        categories,
        postList,
    }
}

export default getPostData
