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
    
    const response = await ofetch(`${baseUrl}/hky/open/resources/api/v1/articles`, {
        method: 'POST',
        headers: {
            ...getSignedHeaders(),
            Cookie: `XSRF-TOKEN=${uuid}`,
            'X-XSRF-TOKEN': uuid,
        },
        body: {
            page: 1,
            size: 30, // 获取最新 30 条
            order_field: 'date',
            order_direction: 'desc',
            user_id: md5(Date.now().toString()),
            lang: 'zh',
            strategy: null,
            orderField: 'default',
        },
    });

    const items = (response.content || []).map((item) => {
        // 关键点：尝试获取学科分类（通常是 keywords 的第一个，或者自带的 subject 字段）
        let category = '学术前沿';
        if (item.keywords && item.keywords.length > 0) {
            category = item.keywords[0];
        } else if (item.subject) {
            category = item.subject;
        }

        // 拼接成类似于：【材料科学】金属基产氢治疗系统综述...
        const finalTitle = `【${category}】${item.title || '无标题'}`;

        return {
            title: finalTitle,
            link: item.id ? `${baseUrl}/headlines/${item.id}` : baseUrl,
            // description 里可以放摘要，ClassIsland 如果支持滚动也能看到
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
