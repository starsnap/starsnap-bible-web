export const queryKeys = {
    feedSnaps: (page: number, size: number) => ['feed-snaps', page, size] as const,
    starGroupSnaps: (starGroupId: string, page: number, size: number) =>
        ['star-group-snaps', starGroupId, page, size] as const,
    starSnaps: (starId: string, page: number, size: number) => ['star-snaps', starId, page, size] as const,
    trendingTags: (size: number) => ['trending-tags', size] as const,
    popularSearchKeywords: (size: number) => ['popular-search-keywords', size] as const,
    stars: (keyword: string, page: number, size: number) => ['stars', keyword, page, size] as const,
    starGroups: (keyword: string, page: number, size: number) =>
        ['star-groups', keyword, page, size] as const,
    users: (keyword: string, page: number, size: number) => ['users', keyword, page, size] as const,
    snapsByTitle: (title: string, page: number, size: number) => ['snaps-by-title', title, page, size] as const,
    myProfile: ['my-profile'] as const,
    myFriends: (size: number) => ['my-friends', size] as const,
    myReceivedFriendRequests: (size: number) => ['my-received-friend-requests', size] as const,
    mySentFriendRequests: (size: number) => ['my-sent-friend-requests', size] as const,
    myBlockedUsers: (size: number) => ['my-blocked-users', size] as const,
    myReportHistory: (sizePerType: number) => ['my-report-history', sizePerType] as const,
    myInquiries: (size: number) => ['my-inquiries', size] as const,
    mySnaps: (page: number, size: number) => ['my-snaps', page, size] as const,
    savedSnaps: ['saved-snaps'] as const,
    snapById: (snapId: string) => ['snap-by-id', snapId] as const,
}
