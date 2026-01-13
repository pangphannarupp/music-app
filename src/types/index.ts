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
    isRadio?: boolean;
}

export interface EqualizerBand {
    frequency: number;
    gain: number;
    type: 'lowshelf' | 'peaking' | 'highshelf';
}

export interface AudioPreset {
    id: string;
    name: string;
    gains: number[]; // 5 bands
}

export interface Playlist {
    id: string;
    name: string;
    songs: Song[];
    folderId?: string;
    createdAt: number;
    coverImage?: string; // Base64 or URL
}

export interface Podcast {
    id: string; // collectionId
    title: string; // collectionName
    artist: string; // artistName
    image: string; // artworkUrl600
    feedUrl?: string; // feedUrl
    description?: string;
    genres?: string[];
}

export interface Episode {
    id: string; // guid
    title: string; // title
    description: string; // description
    audioUrl: string; // enclosure url
    publishedAt: string; // pubDate
    duration: string; // itunes:duration
    podcastTitle?: string;
    podcastImage?: string;
}
