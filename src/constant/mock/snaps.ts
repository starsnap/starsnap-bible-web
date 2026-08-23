export type Snap = {
    id: string
    author: string
    /** Author profile image key/url */
    authorImageKey?: string | null
    /** width / height of the photo, used to reserve card space before the image loads */
    aspectRatio: number
    liked?: boolean
    /** S3 file key for thumbnail image */
    photoKey?: string
}

export type Star = {
    id: string
    name: string
}

export type StarProfile = {
    id: string
    name: string
    group: string
    role: string
    birth: string
    hometown: string
    debut: string
    stats: {
        snaps: string
        fans: string
        likes: string
    }
}

const names = ['민지', '하니', '다니엘', '해린', '혜인', '지수', '카리나', '닝닝', '유나', '윈터', '로제', '사쿠라']

/** width / height ratios used when a photo's real dimensions aren't known yet (e.g. skeleton placeholders) */
const FALLBACK_ASPECT_RATIOS = [0.93, 1.17, 0.78, 1.4, 0.88, 1, 1.27, 0.82, 1.08, 0.93]

export const getFallbackAspectRatio = (index: number) =>
    FALLBACK_ASPECT_RATIOS[index % FALLBACK_ASPECT_RATIOS.length]

/** derives a photo's real width/height ratio, falling back to a cycling placeholder ratio when unknown */
export const getPhotoAspectRatio = (
    photo: { width?: number | null; height?: number | null } | undefined,
    fallbackIndex: number,
): number => {
    if (photo?.width && photo.height) {
        return photo.width / photo.height
    }
    return getFallbackAspectRatio(fallbackIndex)
}

export const makeSnaps = (count: number, seed = 0): Snap[] =>
    Array.from({ length: count }, (_, i) => ({
        id: `snap-${seed}-${i}`,
        author: names[(i + seed) % names.length],
        aspectRatio: getFallbackAspectRatio(i * 3 + seed),
        liked: (i + seed) % 5 === 0,
    }))

export const followedStars: Star[] = [
    { id: 's1', name: '민지' },
    { id: 's2', name: '해린' },
    { id: 's3', name: '윈터' },
    { id: 's4', name: '카리나' },
]

export const starProfiles: StarProfile[] = [
    {
        id: 's1',
        name: '민지',
        group: 'NewJeans',
        role: '리더, 메인댄서',
        birth: '2004.05.07',
        hometown: '춘천',
        debut: '2022',
        stats: { snaps: '1,204', fans: '45.2k', likes: '312k' },
    },
    {
        id: 's2',
        name: '해린',
        group: 'NewJeans',
        role: '리드보컬',
        birth: '2006.05.15',
        hometown: '김해',
        debut: '2022',
        stats: { snaps: '996', fans: '39.8k', likes: '267k' },
    },
    {
        id: 's3',
        name: '윈터',
        group: 'aespa',
        role: '리드보컬, 리드댄서',
        birth: '2001.01.01',
        hometown: '양산',
        debut: '2020',
        stats: { snaps: '1,482', fans: '58.1k', likes: '401k' },
    },
    {
        id: 's4',
        name: '카리나',
        group: 'aespa',
        role: '리더, 메인댄서',
        birth: '2000.04.11',
        hometown: '수원',
        debut: '2020',
        stats: { snaps: '1,713', fans: '67.3k', likes: '489k' },
    },
    {
        id: 's5',
        name: '로제',
        group: 'BLACKPINK',
        role: '메인보컬',
        birth: '1997.02.11',
        hometown: '오클랜드',
        debut: '2016',
        stats: { snaps: '2,104', fans: '82.4k', likes: '701k' },
    },
    {
        id: 's6',
        name: '사쿠라',
        group: 'LE SSERAFIM',
        role: '서브보컬',
        birth: '1998.03.19',
        hometown: '가고시마',
        debut: '2022',
        stats: { snaps: '1,056', fans: '47.6k', likes: '344k' },
    },
]

export const categories = ['전체']
