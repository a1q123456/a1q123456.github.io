import type { AppProps } from 'next/app'
import 'normalize.css'
import '@/styles/globals.scss'
import 'highlight.js/styles/github.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
