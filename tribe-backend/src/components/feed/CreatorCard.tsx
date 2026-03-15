"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function CreatorCard({ creator }: any) {
    const name = creator.name || creator.displayName || 'Unknown';
    const avatar = creator.avatarUrl || creator.avatar || `https://ui-avatars.com/api/?name=${name}&background=E8E0D4&color=1C1917`;
    
    // Determine the score
    const scoreVal = creator.compatibilityScore ? creator.compatibilityScore : creator.score;
    const score = scoreVal !== undefined && scoreVal !== null ? Math.round(scoreVal) : null;
    
    // Extract tags
    let tags: string[] = [];
    if (Array.isArray(creator.sharedInterests)) {
        tags = creator.sharedInterests;
    } else if (Array.isArray(creator.interests)) {
        tags = creator.interests.map((i: any) => i.interest?.name || i?.name || i);
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative w-full"
        >
            <Link
                href={`/profile/${creator.id || creator.userId}`}
                className="flex flex-col h-full text-inherit no-underline"
            >
                {/* Header Area */}
                <div className="h-24 bg-gradient-to-r from-[#FDFBF7] to-[#F4F1EA] relative flex justify-center items-end border-b border-gray-50">
                    {/* Compatibility Circle */}
                    {score !== null && (
                        <div className="absolute top-3 right-3 w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 z-10">
                            <span className="text-[10px] font-bold text-[#8B7355] font-serif">{score}%</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90 rounded-full" viewBox="0 0 36 36">
                                <circle
                                    className="text-gray-100"
                                    fill="none"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    cx="18" cy="18" r="16"
                                />
                                <circle
                                    className="text-[#8B7355]"
                                    fill="none"
                                    strokeWidth="2.5"
                                    strokeDasharray={`${score}, 100`}
                                    stroke="currentColor"
                                    cx="18" cy="18" r="16"
                                    style={{ strokeLinecap: 'round' }}
                                />
                            </svg>
                        </div>
                    )}
                    
                    {/* Avatar */}
                    <img
                        src={avatar}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=E8E0D4&color=1C1917`; }}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white absolute -bottom-8 bg-white shadow-sm"
                        alt={name}
                    />
                </div>

                {/* Content Area */}
                <div className="px-5 pt-11 pb-6 mb-2 flex flex-col flex-grow items-center text-center">
                    <h3 className="text-base font-semibold font-serif text-gray-900 leading-tight">
                        {name}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 mb-4 italic font-serif">
                        {creator.role || 'Creative'} {creator.location ? `· ${creator.location}` : ''}
                    </p>

                    <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                        {tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-[#F9F8F6] text-[#6B5A45] rounded-full text-[10px] uppercase tracking-wider font-semibold border border-[#EFEBE4] whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="px-2.5 py-1 bg-[#F9F8F6] text-[#6B5A45] rounded-full text-[10px] font-semibold border border-[#EFEBE4] whitespace-nowrap">
                                +{tags.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
