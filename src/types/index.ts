export interface VideoSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
        default: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
        high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
}

export interface VideoId {
    kind: string;
    videoId: string;
}

export interface YouTubeSearchResult {
    kind: string;
    etag: string;
    id: VideoId;
    snippet: VideoSnippet;
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
    audioUrl?: string;
    isLocal?: boolean;
    localPath?: string;
}

export interface Playlist {
    id: string;
    name: string;
    songs: Song[];
    folderId?: string;
    createdAt: number;
}
