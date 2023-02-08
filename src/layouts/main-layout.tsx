import CategoriesHeader from "@/components/categories-header";
import PostDataContext from "@/contexts/post-data-context";
import { Category } from "@/models/category";
import Head from "next/head";
import { ReactNode } from "react";

export interface MainLayoutProps {
    categories: Category[]
    children?: ReactNode | undefined
}

export const MainLayout = (props: MainLayoutProps) => {
    return <><Head>
        <title>TechBlog();</title>
        <meta name="description" content="A blog" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
    </Head>
        <PostDataContext.Provider value={props.categories}>
            <main>
                <CategoriesHeader></CategoriesHeader>
                {props.children}
            </main>
        </PostDataContext.Provider>
    </>
}