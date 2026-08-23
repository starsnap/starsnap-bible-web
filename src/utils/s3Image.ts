const encodeFileKey = (fileKey: string) =>
    fileKey
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')

const trimLeadingSlashes = (value: string) => value.replace(/^\/+/, '')

const STARSNAP_PUBLIC_IMAGE_BASE_URL = 'https://starsnap.kr'

const buildStarsnapImageUrlFromRaw = (raw?: string | null) => {
    if (!raw) return ''
    const value = raw.trim()
    if (!value) return ''

    if (value.startsWith('http://') || value.startsWith('https://')) {
        try {
            const url = new URL(value)
            const pathWithQuery = `${url.pathname}${url.search}`
            return `${STARSNAP_PUBLIC_IMAGE_BASE_URL}${pathWithQuery}`
        } catch {
            return ''
        }
    }

    const joinedPath = value.startsWith('/') ? value : `/${value}`
    return `${STARSNAP_PUBLIC_IMAGE_BASE_URL}${joinedPath}`
}


const buildS3Url = (baseUrl: string, fileKey?: string | null) => {
    if (!fileKey) return ''
    return `${baseUrl}/${encodeFileKey(trimLeadingSlashes(fileKey))}`
}

export const getImageCandidates = (fileKey?: string | null): string[] => {
    if (!fileKey) return []
    const raw = fileKey.trim()
    if (!raw) return []

    const candidate = buildStarsnapImageUrlFromRaw(raw)
    return candidate ? [candidate] : []
}

export const applyNextImageCandidate = (img: HTMLImageElement, candidates: string[]) => {
    const currentIndex = Number(img.dataset.imageCandidateIndex ?? '0')
    const nextIndex = currentIndex + 1
    if (nextIndex >= candidates.length) return
    img.dataset.imageCandidateIndex = String(nextIndex)
    img.src = candidates[nextIndex]
}
