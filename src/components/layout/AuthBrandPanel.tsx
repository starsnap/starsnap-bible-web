import React from 'react'
import { StarIcon } from '../icons'

type Props = {
    /** index of the active carousel dot (0-2) */
    active?: number
}

const AuthBrandPanel: React.FC<Props> = ({ active = 0 }) => {
    return (
        <div className="relative hidden lg:flex flex-col w-[42%] max-w-[640px] bg-ink text-white p-12 overflow-hidden">
            <div className="flex items-center gap-2">
                <StarIcon size={28} className="text-brand" fill="currentColor" stroke="none" />
                <span className="text-2xl font-semibold tracking-tight">StarSnap</span>
            </div>

            {/* floating card mockups */}
            <div className="relative flex-1 my-8">
                <div className="absolute left-[42%] top-[6%] w-44 h-56 rounded-2xl bg-white/[0.06] border border-white/10" />
                <div className="absolute left-[22%] top-[24%] w-36 h-44 rounded-2xl bg-white/[0.08] border border-white/10" />
                <div className="absolute left-[46%] top-[40%] w-40 h-44 rounded-2xl bg-brand/10 border border-brand/20" />
            </div>

            <div className="relative">
                <h2 className="text-4xl leading-tight font-bold">
                    최애의 모든 순간을
                    <br />한 곳에서, 스타스냅
                </h2>
                <p className="mt-4 text-white/60 leading-relaxed">
                    좋아하는 스타의 스냅을 모으고
                    <br />팬들과 함께 나누는 공간
                </p>

                <div className="mt-8 flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i === active ? 'w-5 bg-brand' : 'w-1.5 bg-white/25'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AuthBrandPanel
