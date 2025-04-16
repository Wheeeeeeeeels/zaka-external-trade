import { YiwugoPlatform } from '../platforms/yiwugo';
import { PlatformConfig, ProductInfo } from '../types';

async function main() {
    // 配置爬虫
    const config: PlatformConfig = {
        name: 'yiwugo',
        baseUrl: 'https://www.yiwugo.com',
        apiEndpoints: {
            search: '/search.html',
            product: '/product/',
            category: '/category/'
        }
    };

    console.log('初始化义乌购爬虫...');
    const platform = new YiwugoPlatform(config);
    
    try {
        await platform.initialize();
        console.log('爬虫初始化成功');

        // 定义要搜索的产品类别
        const categories = [
            '手机壳',
            '电子产品',
            '服装',
            '玩具',
            '家居用品'
        ];

        for (const category of categories) {
            console.log(`\n正在搜索${category}相关产品...`);
            console.log(`搜索URL: https://www.yiwugo.com/search/s.html?keyword=${encodeURIComponent(category)}`);
            
            let retries = 3;
            let products: ProductInfo[] = [];
            
            while (retries > 0 && products.length === 0) {
                try {
                    console.log(`尝试获取产品列表 (剩余重试次数: ${retries})...`);
                    products = await platform.getProductList(category);
                    console.log(`找到${products.length}个${category}产品`);
                    
                    if (products.length === 0) {
                        console.log('未找到产品，等待后重试...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        retries--;
                    }
                } catch (error) {
                    console.error(`获取产品列表失败: ${error}`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    retries--;
                }
            }

            if (products.length === 0) {
                console.log(`无法获取${category}产品列表，跳过...`);
                continue;
            }

            // 获取前5个产品的详细信息
            for (let i = 0; i < Math.min(5, products.length); i++) {
                const product = products[i];
                console.log(`\n获取第${i + 1}个产品详情: ${product.title}`);
                console.log(`产品URL: ${product.url}`);
                
                let retries = 3;
                while (retries > 0) {
                    try {
                        const detail = await platform.getProductDetail(product.id);
                        console.log('产品详情:', {
                            title: detail.title,
                            price: detail.price,
                            description: detail.description?.substring(0, 100) + '...',
                            imageCount: detail.images?.length || 0,
                            specifications: detail.specifications,
                            seller: detail.seller
                        });
                        break;
                    } catch (error) {
                        console.error(`获取产品详情失败: ${error}`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        retries--;
                    }
                }
                
                // 随机延迟1-3秒
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
            }
        }
    } catch (error: any) {
        console.error('爬取过程中出现错误:', error?.message || '未知错误');
        console.error('错误堆栈:', error?.stack);
    } finally {
        await platform.close();
        console.log('\n爬虫任务完成');
    }
}

main().catch(error => {
    console.error('程序执行错误:', error?.message || '未知错误');
    console.error('错误堆栈:', error?.stack);
}); 