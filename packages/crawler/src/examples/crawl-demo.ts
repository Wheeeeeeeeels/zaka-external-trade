import { AlibabaPlatform } from '../platforms/alibaba';
import { PlatformConfig } from '../types';

async function main() {
    // 配置爬虫
    const config: PlatformConfig = {
        name: 'alibaba',
        baseUrl: 'https://www.alibaba.com',
        apiEndpoints: {
            search: '/trade/search',
            product: '/product/',
            category: '/category/'
        }
    };

    console.log('初始化爬虫...');
    const platform = new AlibabaPlatform(config);
    await platform.initialize();

    try {
        // 搜索手机相关产品
        console.log('正在搜索手机相关产品...');
        const products = await platform.searchProducts('mobile phone');
        console.log(`找到 ${products.length} 个产品`);

        // 获取第一个产品的详细信息
        if (products.length > 0) {
            console.log('\n获取第一个产品的详细信息：');
            const detail = await platform.getProductDetail(products[0].id);
            console.log('产品详情：');
            console.log('- 标题:', detail.title);
            console.log('- 价格:', detail.price);
            console.log('- 描述:', detail.description?.substring(0, 200) + '...');
            console.log('- 图片数量:', detail.images?.length || 0);
            console.log('- 规格数量:', Object.keys(detail.specifications || {}).length);
        }

        // 获取电子产品类别的产品
        console.log('\n获取电子产品类别的产品...');
        const categoryProducts = await platform.getProductList({
            category: 'Electronics',
            page: 1,
            pageSize: 10
        });
        console.log(`找到 ${categoryProducts.length} 个电子产品`);
        categoryProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title}`);
            console.log(`   价格: ${product.price}`);
        });

    } catch (error) {
        console.error('爬取过程中出现错误:', error);
    } finally {
        await platform.close();
        console.log('\n爬虫任务完成');
    }
}

main().catch(console.error); 