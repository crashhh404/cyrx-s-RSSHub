import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';
import * as cheerio from 'cheerio';

export const route: Route = {
    path: '/headlines',
    categories: ['new-media'],
    example: '/pubscholar/headlines',
    name: '科技头条',
    maintainers: ['YourName'],
    handler,
};

async function handler() {
    const baseUrl = 'https://pubscholar.cn';
    const url = `${baseUrl}/headlines`;

    const response = await ofetch(url);
    const $ = cheerio.load(response);

    const items = [];
    
    // 遍历每一个卡片 (a标签)
    $('.HeadlineItem').each((_, element) => {
        const $element = $(element);
        const link = $element.attr('href');
        const fullLink = link.startsWith('http') ? link : `${baseUrl}${link}`;
        const dateStr = $element.find('.HeadlineItem__date').text().trim();
        const category = $element.find('.HeadlineItem__title').text().trim().replace(/\s+/g, ' '); // 提取分类

        // 遍历卡片里的多条新闻标题 (subtitle)
        $element.find('.HeadlineItem__subtitle span').each((_, spanElement) => {
            const title = $(spanElement).text().trim();
            if (title) {
                items.push({
                    title: title,
                    link: fullLink, // 因为HTML里没给独立链接，只能指向同一个聚合页
                    description: `分类：${category} <br> 阅读全文请点击链接`,
                    pubDate: dateStr ? parseDate(dateStr, 'YYYY/MM/DD') : undefined,
                });
            }
        });
    });

    return {
        title: 'PubScholar 科技头条',
        link: url,
        item: items,
    };
}