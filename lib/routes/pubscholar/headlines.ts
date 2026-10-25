import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import md5 from '@/utils/md5';
import { baseUrl, getSignedHeaders, uuidv4 } from './utils';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/headlines',
    categories: ['new-media'],
    example: '/pubscholar/headlines',
    name: '科技头条',
    maintainers: ['YourName'],
    handler,
};

async function handler() {
    const uuid = uuidv4();
    
    // 请求 articles（论文）接口，拿到具体的单篇论文数据
    const response = await ofetch(`${baseUrl}/hky/open/resources/api/v1/articles`, {
        method: 'POST',
        headers: {
            ...getSignedHeaders(),
            Cookie: `XSRF-TOKEN=${uuid}`,
            'X-XSRF-TOKEN': uuid,
        },
        body: {
            page: 1,
            size: 50, // 把数量改大，一次多拿点
            order_field: 'date',
            order_direction: 'desc',
            user_id: md5(Date.now().toString()),
            lang: 'zh',
            strategy: null,
            orderField: 'default',
        },
    });

    // 将返回的数据转换为单篇的 RSS 条目
    const items = (response.content || []).map((item) => {
        return {
            // 这里的 title 就是单篇论文的具体标题（如“金属基产氢治疗系统综述...”）
            title: item.title || '无标题',
            link: item.id ? `${baseUrl}/headlines/${item.id}` : baseUrl,
            description: item.abstracts || item.description || '',
            pubDate: item.date ? parseDate(String(item.date), 'YYYY-MM-DD') : undefined,
            author: item.author ? item.author.join(', ') : '',
        };
    });

    return {
        title: 'PubScholar 科技头条',
        link: `${baseUrl}/headlines`,
        item: items,
    };
}
