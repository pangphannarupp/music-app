import axios from 'axios';

export interface SponsorBlockSegment {
    category: string;
    actionType: string;
    segment: [number, number]; // [startTime, endTime]
    UUID: string;
}

const BASE_URL = 'https://sponsor.ajay.app/api/skipSegments';

// Categories to automatically skip
const DEFAULT_CATEGORIES = [
    'sponsor',
    'selfpromo',
    'interaction',
    'intro',
    'outro',
    'music_offtopic'
];

export const getSkipSegments = async (videoId: string): Promise<SponsorBlockSegment[]> => {
    try {
        const response = await axios.get<SponsorBlockSegment[]>(BASE_URL, {
            params: {
                videoID: videoId,
                categories: JSON.stringify(DEFAULT_CATEGORIES),
                actionTypes: JSON.stringify(['skip'])
            }
        });
        return response.data;
    } catch (error) {
        // 404 means no segments found, which is normal
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return [];
        }
        console.warn('SponsorBlock API failed:', error);
        return [];
    }
};
