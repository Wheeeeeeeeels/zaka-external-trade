import { YiwugoPlatform } from '../platforms/yiwugo';

async function testYiwugoCrawler() {
  try {
    const platform = new YiwugoPlatform();
    await platform.initialize();

    // 测试搜索功能
    console.log('测试搜索功能...');
    const searchResults = await platform.searchProducts('玩具');
    console.log('搜索结果:', searchResults);

    // 测试获取产品详情
    if (searchResults.length > 0) {
      console.log('\n测试获取产品详情...');
      const productDetail = await platform.getProductDetail(searchResults[0].id);
      console.log('产品详情:', productDetail);
    }

    // 测试获取产品列表
    console.log('\n测试获取产品列表...');
    const productList = await platform.getProductList({
      keyword: '玩具',
      page: '1'
    });
    console.log('产品列表:', productList);

    await platform.close();
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testYiwugoCrawler(); 