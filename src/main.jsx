import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import SharePage from './components/SharePage.jsx'
import './index.css'

const SHARE_HASH = '#share'

// Two pages: the main one, and the share page at #share. A hash needs no server
// set-up, so the share page works on any static host.
function Root() {
  const [isSharePage, setIsSharePage] = useState(window.location.hash === SHARE_HASH)

  useEffect(() => {
    const onHashChange = () => {
      setIsSharePage(window.location.hash === SHARE_HASH)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return isSharePage ? <SharePage /> : <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
