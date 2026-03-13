import { parseUrl } from '../../../common/utils.js';

export const contentData = (data, formData) => {
    if (data.length > 0) {
        const content_title = {
            youtube: data.title || '',
            instagram: data.title || '',
            tiktok: data.title || '',
            x: data.title || '',
        };
        return {
            ...formData,
            post_id: data.post_id || '',
            title: content_title[parseUrl(formData.post_url)?.platform] || 'Title',
            platform: parseUrl(formData.post_url)?.platform || '',
            upload_dt: new Date(data.upload_dt) || new Date(),
            description: data.description || '',
            like_count: data?.like_count || '-',
            comment_count: data?.comment_count || '-',
            share_count: data?.share_count || '-',
            view_count: data?.view_count || '-',
            author_nm: data.author_nm || '',
            crawling_start_dt: new Date(formData.crawling_start_dt) || new Date(),
            crawling_end_dt: new Date(formData.crawling_end_dt) || new Date(),
            thumbnail_url: `${data.media_url[0]}`,
            media_url: data.media_url,
            seeding_cost: formData.seeding_cost ? parseFloat(formData.seeding_cost) : 0,
            user_id: formData.user_id || 'Unknown',
            seeding_cntry: formData.seeding_cntry || 'KR',
            user_nm: formData.user_nm || 'Unknown',
            second_crawling_start_dt:
                !!formData.second_crawling_start_dt && new Date(formData.second_crawling_start_dt),
            second_crwaling_end_dt: !!formData.second_crwaling_end_dt && new Date(formData.second_crwaling_end_dt),
        };
    } else {
        return {
            ...formData,
            post_id: parseUrl(formData.post_url)?.id || '',
            platform: parseUrl(formData.post_url)?.platform || '',
            keyword: formData.keyword || '',
            seeding_cost: formData.seeding_cost ? parseFloat(formData.seeding_cost) : 0,
            user_id: formData.user_id || 'Unknown',
            seeding_cntry: formData.seeding_cntry || 'KR',
            user_nm: formData.user_nm || 'Unknown',
        };
    }
};
