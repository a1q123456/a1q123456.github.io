import { Category } from "@/models/category";
import { createContext } from "react";

const PostDataContext = createContext<Category[]>([])

export default PostDataContext
