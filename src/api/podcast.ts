import { searchPlaylists, getPlaylistVideos } from './youtube';
import type { Podcast, Episode } from '../types';

export class PodcastService {
    static async getTopPodcasts(query = 'khmer podcast'): Promise<Podcast[]> {
        // Search for specific topics, defaulting to Khmer Podcasts
        // We can add more specific queries or randomize to keep it fresh
        const results = await searchPlaylists(query);

        return results.map((p: any) => ({
            id: p.id,
            title: p.title,
            artist: p.artist,
            image: p.image,
            description: p.description,
            feedUrl: '' // Not used for YouTube
        }));
    }

    static async getPodcastDetails(_id: string): Promise<Podcast | null> {
        // For YouTube, retrieval is usually done via search or passing the object.
        // We might implement a getPlaylistDetails in youtube.ts if needed later.
        return null;
    }

    static async getEpisodes(playlistId: string): Promise<Episode[]> {
        const songs = await getPlaylistVideos(playlistId);
        return songs.map((song: any) => ({
            id: song.id, // videoId
            title: song.title,
            description: '', // Playlist item snippet doesn't have full desc without another call
            audioUrl: '', // Not used for YouTube playback (handled by player)
            publishedAt: '',
            duration: '',
            image: song.thumbnail
        }));
    }
}
