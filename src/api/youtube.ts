import axios from 'axios';
import type { YouTubeSearchResult, Song } from '../types';

// Load keys from env (comma-separated) or use a default list
const ENV_KEYS = import.meta.env.VITE_YOUTUBE_API_KEY
    ? import.meta.env.VITE_YOUTUBE_API_KEY.split(',').map((k: string) => k.trim())
    : ['AIzaSyAK5EkjnJEy76Pw_4PGMn9e4KMJHrwxQzA', 'AIzaSyA1OUIx2VVEwv6xeynOhsLxDcNdVfr8l6A', 'AIzaSyCyj5v5KY880vAKak-Vg4uW3DiXcIai6q0', 'AIzaSyBhStNP9ZwGV-s3KXN25pVFWLr8wtobvcI', 'AIzaSyDGCmiXiutZ9LIq5p5HrMfi7hcgXUCjoU0', 'AIzaSyDJOegZDsS-vsWZY3ma240RPAJINTmlhkc'];

// Add more backup keys here if needed
const API_KEYS = [...ENV_KEYS,
    'AIzaSyAK5EkjnJEy76Pw_4PGMn9e4KMJHrwxQzA',
    'AIzaSyC28iL-2d_gQXB-3hD-4jF_1jH-5kL-6m', // Extra backup
    'AIzaSyD-7nO-8pQ-9rS-0tU-1vW-2xY-3zA-4b'  // Extra backup
];



const BASE_URL = 'https://www.googleapis.com/youtube/v3';

let currentKeyIndex = 0;

const getApiKey = () => {
    return API_KEYS[currentKeyIndex % API_KEYS.length];
};

const rotateKey = () => {
    currentKeyIndex++;
    console.log(`Switching to API Key #${currentKeyIndex % API_KEYS.length}`);
};

// Generic retry wrapper for API calls
const fetchWithRotation = async <T>(requestFn: (key: string) => Promise<T>): Promise<T> => {
    let attempts = 0;
    while (attempts < API_KEYS.length) {
        try {
            const result = await requestFn(getApiKey());
            return result;
        } catch (error: any) {
            attempts++;
            // Check for quota (403), rate limit (429), or invalid key (400) errors
            if (axios.isAxiosError(error) && (
                error.response?.status === 403 ||
                error.response?.status === 429 ||
                error.response?.status === 400
            )) {
                console.warn(`API Key ${getApiKey()} exhausted, limited, or invalid. Rotating...`);
                rotateKey();
            } else {
                // If it's another error (e.g. network), throw immediately or decide logic
                // For now, let's assume we proceed to throw if it's not a key issue
                // But typically we only rotate on auth/quota errors.
                throw error;
            }
        }
    }
    // Dispatch global event for UI to catch
    window.dispatchEvent(new CustomEvent('YT_API_EXHAUSTED'));
    throw new Error('All API keys exhausted.');
};

// Mock data to prevent API quota usage during dev if no key provided
const MOCK_RESULTS: YouTubeSearchResult[] = [
    // {
    //     kind: 'youtube#searchResult',
    //     etag: 'etag1',
    //     id: { kind: 'youtube#video', videoId: 'MQn7Kw6v93Y' },
    //     snippet: {
    //         publishedAt: '2022-07-12T10:00:00Z',
    //         channelId: 'UC-1',
    //         title: 'បញ្ចប់សន្យាស្នេហ៍ - ព្រាប សុវត្ថិ',
    //         description: 'Listen to the best lofi hip hop beats for studying, sleeping, or relaxing.',
    //         thumbnails: {
    //             default: { url: 'https://img.youtube.com/vi/MQn7Kw6v93Y/default.jpg', width: 120, height: 90 },
    //             medium: { url: 'https://img.youtube.com/vi/MQn7Kw6v93Y/mqdefault.jpg', width: 320, height: 180 },
    //             high: { url: 'https://img.youtube.com/vi/MQn7Kw6v93Y/hqdefault.jpg', width: 480, height: 360 },
    //         },
    //         channelTitle: 'Lofi Girl',
    //         liveBroadcastContent: 'live',
    //     },
    // },
    // {
    //     kind: 'youtube#searchResult',
    //     etag: 'etag2',
    //     id: { kind: 'youtube#video', videoId: '5qap5aO4i9A' },
    //     snippet: {
    //         publishedAt: '2020-02-22T00:00:00Z',
    //         channelId: 'UC-2',
    //         title: 'lofi hip hop radio - beats to sleep/chill to',
    //         description: 'Beats to sleep and chill to.',
    //         thumbnails: {
    //             default: { url: 'https://img.youtube.com/vi/5qap5aO4i9A/default.jpg', width: 120, height: 90 },
    //             medium: { url: 'https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg', width: 320, height: 180 },
    //             high: { url: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg', width: 480, height: 360 },
    //         },
    //         channelTitle: 'Lofi Girl',
    //         liveBroadcastContent: 'live',
    //     },
    // },
];

// List of API providers (Piped and Invidious) to try
// Prioritize instances that are known to be stable
const STREAM_PROVIDERS = [
    { url: 'https://pipedapi.kavin.rocks', type: 'piped' },
    { url: 'https://api.piped.ot.ax', type: 'piped' },
    { url: 'https://api.piped.r4fo.com', type: 'piped' },
    { url: 'https://pipedapi.drgns.space', type: 'piped' },
    { url: 'https://pa.il.ax', type: 'piped' },
    { url: 'https://p.euten.eu', type: 'piped' },
    { url: 'https://pipedapi.smnz.de', type: 'piped' },
    { url: 'https://api.piped.yt', type: 'piped' },
    // Invidious often has stricter CORS/Blocking, keep as backup
    { url: 'https://invidious.drgns.space', type: 'invidious' },
    { url: 'https://inv.tux.pizza', type: 'invidious' },
];

export const getStreamUrl = async (videoId: string): Promise<string | undefined> => {
    // CORS Proxy to bypass browser restrictions
    const CORS_PROXY = 'https://corsproxy.io/?';

    // 1. Try Electron Native yt-dlp first (Most Reliable)
    if (window.electron && window.electron.getAudioUrl) {
        console.log('Fetching audio via local yt-dlp...');
        try {
            const result = await window.electron.getAudioUrl(videoId);
            if (result.success && result.url) {
                console.log('Local yt-dlp success:', result.url);
                return result.url;
            } else {
                console.warn('Local yt-dlp failed:', result.error);
            }
        } catch (e) {
            console.warn('Local yt-dlp error:', e);
        }
    }

    // 2. Web Environment / Fallback logic (Restored per user request)
    for (const provider of STREAM_PROVIDERS) {
        try {
            const targetUrl = provider.type === 'piped'
                ? `${provider.url}/streams/${videoId}`
                : `${provider.url}/api/v1/videos/${videoId}`;

            let response;
            try {
                // Attempt 1: Direct Fetch
                // Some Piped instances support CORS. Trying direct first avoids Proxy blocklists.
                console.log(`Attempt 1 (Direct): ${provider.url}`);
                response = await axios.get(targetUrl, { timeout: 3000 });
            } catch (directError) {
                // Attempt 2: Via CORS Proxy
                // If direct fails (CORS or Network), try via Proxy.
                console.warn(`Direct fetch failed for ${provider.url}, trying proxy...`);
                try {
                    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
                    console.log(`Attempt 2 (Proxy): ${proxyUrl}`);
                    response = await axios.get(proxyUrl, { timeout: 5000 });
                } catch (proxyError) {
                    console.warn(`Proxy fetch also failed for ${provider.url}`);
                    continue; // Try next provider
                }
            }

            // Process Response (common for both methods)
            if (provider.type === 'piped') {
                const streams = response.data.audioStreams;
                const audioStream = streams.find((s: any) => s.mimeType === 'audio/mp4')
                    || streams.find((s: any) => s.mimeType === 'audio/webm');
                if (audioStream?.url) return audioStream.url;

            } else if (provider.type === 'invidious') {
                const formats = response.data.adaptiveFormats;
                const audioStream = formats.find((s: any) => s.type.includes('audio/mp4'))
                    || formats.find((s: any) => s.type.includes('audio/webm'));
                if (audioStream?.url) return audioStream.url;
            }
        } catch (error) {
            // console.warn(`Failed fetch from ${provider.url}`, error);
            // Try next provider
            continue;
        }
    }

    console.warn('All stream providers failed.');
    return undefined; // Do not return SoundHelix fallback
};

export const searchVideos = async (query: string, pageToken?: string): Promise<{ songs: Song[], nextPageToken?: string }> => {
    if (!query) return { songs: [] };

    console.log('Searching for:', query);

    // 1. Try Google YouTube Data API First (Fastest & Reliable, uses Keys)
    if (API_KEYS.length > 0) {
        try {
            const response = await fetchWithRotation((key) =>
                axios.get<{ items: YouTubeSearchResult[], nextPageToken?: string }>(`${BASE_URL}/search`, {
                    params: {
                        part: 'snippet',
                        maxResults: 12,
                        q: query,
                        type: 'video',
                        key: key,
                        pageToken: pageToken
                    },
                })
            );

            const songs = response.data.items.map((item) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high.url,
            }));

            return { songs, nextPageToken: response.data.nextPageToken };
        } catch (error) {
            console.warn('Google API failed:', error);
        }
    }

    // 2. Fallback to Local yt-dlp Search (Unlimited, somewhat fast)
    if (window.electron && window.electron.searchVideos) {
        console.log('Falling back to local yt-dlp search...');
        try {
            const result = await window.electron.searchVideos(query);
            if (result.success && result.songs) {
                return { songs: result.songs };
            } else {
                console.warn('Local yt-dlp search failed:', result.error);
            }
        } catch (e) {
            console.warn('Local searching error:', e);
        }
    }

    // 3. Absolute Fallback to Mock Data
    console.warn('All search providers failed. Using mock data.');
    const start = 0;
    const results = MOCK_RESULTS.slice(start, start + 2).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    }));
    return { songs: results };
};

export const getRelatedVideos = async (videoId: string, artistName?: string): Promise<Song[]> => {
    if (!videoId && !artistName) return [];
    if (API_KEYS.length === 0) return []; // Should handle mock return here too if wanted

    try {
        // If we don't have artist name, we need to fetch video details first to get the channel
        let searchQuery = artistName;

        if (!searchQuery) {
            try {
                const videoResponse = await fetchWithRotation((key) =>
                    axios.get<{ items: Array<{ snippet: { channelTitle: string } }> }>(`${BASE_URL}/videos`, {
                        params: {
                            part: 'snippet',
                            id: videoId,
                            key: key,
                        },
                    })
                );

                if (videoResponse.data.items && videoResponse.data.items.length > 0) {
                    searchQuery = videoResponse.data.items[0].snippet.channelTitle;
                }
            } catch (error) {
                console.warn('Failed to fetch video details for artist name');
            }
        }

        // If we still don't have a search query, fall back to related videos
        if (!searchQuery) {
            const response = await fetchWithRotation((key) =>
                axios.get<{ items: YouTubeSearchResult[] }>(`${BASE_URL}/search`, {
                    params: {
                        part: 'snippet',
                        relatedToVideoId: videoId,
                        type: 'video',
                        maxResults: 10,
                        key: key,
                    },
                })
            );

            return response.data.items
                .filter(item => item.id.videoId !== videoId)
                .slice(0, 10)
                .map((item) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails.high.url,
                }));
        }

        // Search by artist/channel name
        const response = await fetchWithRotation((key) =>
            axios.get<{ items: YouTubeSearchResult[] }>(`${BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    q: searchQuery,
                    type: 'video',
                    maxResults: 11, // Get 11 to filter out current song
                    key: key,
                },
            })
        );

        return response.data.items
            .filter(item => item.id.videoId !== videoId) // Exclude current song
            .slice(0, 10) // Limit to 10 results
            .map((item) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high.url,
            }));
    } catch (error) {
        console.warn('API Error (All keys tried). Falling back to mock data.');
        return MOCK_RESULTS.slice(0, 10).map(item => ({
            id: item.id.videoId,
            title: `Related: ${item.snippet.title}`,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url,
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        }));
    }
};
