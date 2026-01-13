import type { Song } from '../types';

export interface RadioStation {
    changeuuid: string;
    stationuuid: string;
    serveruuid: string;
    name: string;
    url: string;
    url_resolved: string;
    homepage: string;
    favicon: string;
    tags: string;
    country: string;
    countrycode: string;
    state: string;
    language: string;
    languagecodes: string;
    votes: number;
    lastchangetime: string;
    codec: string;
    bitrate: number;
    hls: number;
    lastcheckok: number;
    lastchecktime: string;
    lastcheckoktime: string;
    lastlocalchecktime: string;
    clicktimestamp: string;
    clickcount: number;
    clicktrend: number;
    ssl_error: number;
    geo_lat: number;
    geo_long: number;
    has_extended_info: boolean;
}

const BASE_URL = 'https://de1.api.radio-browser.info/json';

export class RadioService {
    static async getTopStations(limit = 20): Promise<RadioStation[]> {
        try {
            const response = await fetch(`${BASE_URL}/stations/topclick/${limit}`);
            if (!response.ok) throw new Error('Failed to fetch top stations');
            return await response.json();
        } catch (error) {
            console.error('RadioService Error:', error);
            return [];
        }
    }

    static async getStationsByCountry(countryCode: string, limit = 50): Promise<RadioStation[]> {
        try {
            const response = await fetch(`${BASE_URL}/stations/bycountrycodeexact/${countryCode}?limit=${limit}&order=clickcount&reverse=true`);
            if (!response.ok) throw new Error('Failed to fetch stations by country');
            return await response.json();
        } catch (error) {
            console.error('RadioService Error:', error);
            return [];
        }
    }

    static async searchStations(query: string, limit = 50): Promise<RadioStation[]> {
        try {
            // Enhanced search: Name, Tag, Country, AND Language
            const nameSearchUrl = `${BASE_URL}/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`;
            const tagSearchUrl = `${BASE_URL}/stations/search?tag=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`;
            const countrySearchUrl = `${BASE_URL}/stations/search?country=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`;
            const languageSearchUrl = `${BASE_URL}/stations/search?language=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`;

            const [byName, byTag, byCountry, byLanguage] = await Promise.all([
                fetch(nameSearchUrl).then(r => r.json()).catch(() => []),
                fetch(tagSearchUrl).then(r => r.json()).catch(() => []),
                fetch(countrySearchUrl).then(r => r.json()).catch(() => []),
                fetch(languageSearchUrl).then(r => r.json()).catch(() => [])
            ]);

            // Merge and Deduplicate by stationuuid
            const allStations = [...byName, ...byTag, ...byCountry, ...byLanguage];
            const uniqueStations = Array.from(new Map(allStations.map(s => [s.stationuuid, s])).values());

            // Sort merged results by votes/clickcount to keep relevance
            return uniqueStations.sort((a, b) => b.clickcount - a.clickcount).slice(0, limit);

        } catch (error) {
            console.error('RadioService Error:', error);
            return [];
        }
    }

    static async getCountries(): Promise<{ name: string; iso_3166_1: string; stationcount: number }[]> {
        try {
            const response = await fetch(`${BASE_URL}/countries`);
            if (!response.ok) throw new Error('Failed to fetch countries');
            const data = await response.json();
            return data.sort((a: any, b: any) => b.stationcount - a.stationcount);
        } catch (error) {
            console.error('RadioService Error:', error);
            return [];
        }
    }

    // Helper to convert RadioStation to Song for compatibility with PlayerContext
    static toSong(station: RadioStation): Song {
        return {
            id: station.stationuuid,
            title: station.name,
            artist: station.country || 'Radio',
            thumbnail: station.favicon || 'https://cdn-icons-png.flaticon.com/512/305/305108.png', // Fallback radio icon
            duration: 'Live',
            audioUrl: station.url_resolved || station.url,
            isLocal: false,
            isRadio: true,
        };
    }
}
