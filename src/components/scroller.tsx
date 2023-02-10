import { ReactNode } from "react"
import styles from "@/styles/scroller.module.scss"

const Scroller = (props: { children?: ReactNode | undefined, className?: string | undefined }) => {

    return <div className={`${styles.scroller} ${props.className}`}>
        {props.children}
    </div>
}

export default Scroller
