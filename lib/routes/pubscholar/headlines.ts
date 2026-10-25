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
    
    // 我们直接请求它的后台数据接口，而不是去解析网页
    // 这个接口通常返回 JSON 数据，比解析 HTML 稳定一万倍
    const response = await ofetch(`${baseUrl}/hky/open/resources/api/v1/bulletins`, {
        method: 'POST',
        headers: {
            ...getSignedHeaders(),
            Cookie: `XSRF-TOKEN=${uuid}`,
            'X-XSRF-TOKEN': uuid,
        },
        body: {
            page: 1,
            size: 20,
            order_field: 'date',
            order_direction: 'desc',
            user_id: md5(Date.now().toString()),
            lang: 'zh',
            strategy: null,
            orderField: 'default',
        },
    });

    // 把接口返回的数据，转换成 RSS 格式
    const items = (response.content || []).map((item) => {
        return {
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
