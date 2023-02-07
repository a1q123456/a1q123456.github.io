import CategoriesHeader from "@/components/categories-header";
import Head from "next/head";
import { ReactNode } from "react";

export const MainLayout = (props: { children?: ReactNode | undefined }) => <><Head>
    <title>Create Next App</title>
    <meta name="description" content="Generated by create next app" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.ico" />
</Head>
    <main>
        <CategoriesHeader></CategoriesHeader>
        {props.children}
    </main>
</>
