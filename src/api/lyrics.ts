export interface SyncedLine {
    time: number; // in seconds
    text: string;
}

export interface LyricsData {
    plainLyrics: string;
    syncedLyrics?: string;
    syncedLines?: SyncedLine[];
}

const LRCLIB_API = 'https://lrclib.net/api/get';
const LRCLIB_SEARCH_API = 'https://lrclib.net/api/search';

/**
 * Fetch lyrics from Lrclib.net
 */
export async function fetchLyrics(
    artist: string,
    title: string,
    duration?: number
): Promise<LyricsData | null> {
    try {
        // Helper to perform the fetch
        const doFetch = async (queryTitle: string) => {
            const params = new URLSearchParams({
                artist_name: artist,
                track_name: queryTitle,
            });
            if (duration) params.append('duration', duration.toString());

            const response = await fetch(`${LRCLIB_API}?${params.toString()}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`Lyrics API Error: ${response.status}`);
            }
            return response.json();
        };

        // 1. Try exact match
        let data = await doFetch(title);

        // 2. If not found, try cleaning the title
        if (!data) {
            const cleanedTitle = cleanTitle(title);
            if (cleanedTitle !== title) {
                console.log(`Lyrics not found for "${title}", retrying with "${cleanedTitle}"...`);
                data = await doFetch(cleanedTitle);
            }

            // 3. Last resort: Search API
            if (!data) {
                console.log('Still not found, trying fuzzy search...');
                const q = `${artist} ${cleanedTitle}`;
                const searchParams = new URLSearchParams({ q });
                const searchResp = await fetch(`${LRCLIB_SEARCH_API}?${searchParams.toString()}`);
                if (searchResp.ok) {
                    const searchData = await searchResp.json();
                    if (Array.isArray(searchData) && searchData.length > 0) {
                        // Pick the first one that has lyrics
                        data = searchData.find((item: any) => item.syncedLyrics || item.plainLyrics);
                        if (data) console.log('Found match via search:', data.trackName);
                    }
                }
            }
        }

        if (!data) return null;

        // ... (process data)
        if (data.instrumental) {
            return { plainLyrics: '[Instrumental]', syncedLyrics: undefined, syncedLines: [] };
        }

        if (!data.plainLyrics && !data.syncedLyrics) {
            return null;
        }

        const result: LyricsData = {
            plainLyrics: data.plainLyrics || '',
            syncedLyrics: data.syncedLyrics,
        };

        if (data.syncedLyrics) {
            result.syncedLines = parseLrc(data.syncedLyrics);
        }

        return result;

    } catch (error) {
        console.error('Failed to fetch lyrics:', error);
        return null;
    }
}

function cleanTitle(title: string): string {
    // 1. Remove stuff in brackets/parentheses e.g. (Official Video), [HQ]
    let cleaned = title.replace(/[\[\(].*?[\]\)]/g, '');

    // 2. Remove common separators and everything after them if they likely denote artist or extra info
    // Logic: Split by '|', taking the first part. 
    // Note: '-' is risky as it might be part of the song title, but '|' usually separates Title | Artist
    if (cleaned.includes('|')) {
        cleaned = cleaned.split('|')[0];
    }

    // 3. Remove "ft." or "feat." and afterwards? 
    // No, lrclib might want the full title. But usually artist is passed separately.
    // Let's safe-clean: remove specific keywords
    const keywords = ['Official Video', 'Official Audio', 'Lyrics', 'MV', 'Music Video'];
    keywords.forEach(k => {
        const reg = new RegExp(k, 'gi');
        cleaned = cleaned.replace(reg, '');
    });

    return cleaned.trim();
}

/**
 * Parse LRC string into array of {time, text} objects
 * Format: [mm:ss.xx] Lyrics text
 */
function parseLrc(lrc: string): SyncedLine[] {
    const lines = lrc.split('\n');
    const result: SyncedLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = parseInt(match[3].padEnd(3, '0'), 10); // standardize to ms

            const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();

            if (text) {
                result.push({ time: timeInSeconds, text });
            }
        }
    }

    return result.sort((a, b) => a.time - b.time);
}
