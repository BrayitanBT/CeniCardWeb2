import { useState, useEffect } from 'react'
import MenuLateral from './Menu'
import Header from './Header'
import '../Style/Layout.css'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [screenSize, setScreenSize] = useState('desktop')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
      
      if (width >= 1024) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleToggleSidebar = () => {
    if (screenSize === 'mobile' || screenSize === 'tablet') {
      setSidebarOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => !prev)
    }
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  const isMobileOrTablet = screenSize === 'mobile' || screenSize === 'tablet'

  return (
    <div className="Layout">
      <MenuLateral 
        open={sidebarOpen} 
        collapsed={sidebarCollapsed && screenSize === 'desktop'}
        onClose={handleCloseSidebar}
      />
      
      <div className={`Layout_Content ${sidebarCollapsed && screenSize === 'desktop' ? 'collapsed' : ''}`}>
        {sidebarOpen && isMobileOrTablet && (
          <div className="Layout_Overlay" onClick={handleCloseSidebar} />
        )}
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="Layout_Main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
