import React, { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import BottomNav from '../../components/BottomNav/BottomNav'
import AppHeader from '../../components/layout/AppHeader'

const MainLayout: React.FC = () => {
    const [sidebarMode, setSidebarMode] = useState<'full' | 'compact'>('full')

    const mainMarginClass = useMemo(() => {
        return sidebarMode === 'compact' ? 'lg:ml-20' : 'lg:ml-60'
    }, [sidebarMode])

    return (
        <div className="min-h-screen bg-surface">
            <a
                href="#main-content"
                className="fixed left-4 top-3 z-50 inline-flex min-h-11 -translate-y-20 items-center rounded-lg bg-emphasis px-4 py-2 text-sm font-bold text-on-emphasis focus:translate-y-0"
            >
                본문으로 건너뛰기
            </a>
            <AppHeader />

            <div className="hidden lg:block">
                <Sidebar
                    mode={sidebarMode}
                    onToggleCompact={() =>
                        setSidebarMode((prev) => (prev === 'compact' ? 'full' : 'compact'))
                    }
                />
            </div>

            <main
                id="main-content"
                className={`${mainMarginClass} min-h-screen min-w-0 overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] pt-16 transition-[margin] duration-200 lg:pb-0`}
            >
                <Outlet />
            </main>
            <BottomNav />
        </div>
    )
}

export default MainLayout
