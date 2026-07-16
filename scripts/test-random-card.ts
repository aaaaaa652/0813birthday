import fetch from 'node-fetch';

interface Card {
  id: number;
  image: string;
  lyric: string[];
  blessing: string;
}

async function testRandomCard() {
  console.log('=== 测试随机卡片接口 ===');
  console.log('');
  
  const results: number[] = [];
  
  for (let i = 1; i <= 20; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/cards/random', {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
      
      if (response.ok) {
        const card = await response.json() as Card | null;
        if (card && card.id) {
          results.push(card.id);
          console.log(`第 ${i} 次请求: 卡片 ID = ${card.id}`);
        } else {
          console.log(`第 ${i} 次请求: 无可用卡片`);
        }
      } else {
        console.log(`第 ${i} 次请求: 失败 (${response.status})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`第 ${i} 次请求: 错误 - ${error}`);
    }
  }
  
  console.log('');
  console.log('=== 测试结果统计 ===');
  console.log(`总请求次数: ${results.length}`);
  console.log(`返回的卡片 ID: [${results.join(', ')}]`);
  
  const uniqueIds = [...new Set(results)];
  console.log(`不同卡片数量: ${uniqueIds.length}`);
  console.log(`是否全部相同: ${uniqueIds.length === 1}`);
  
  if (uniqueIds.length > 1) {
    console.log('✅ 随机测试通过：返回了多种不同卡片');
  } else {
    console.log('❌ 随机测试失败：返回了相同卡片');
  }
}

testRandomCard().catch(console.error);