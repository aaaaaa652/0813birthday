import fetch from 'node-fetch';

interface Card {
  id: number;
  image: string;
  lyric: string[];
  blessing: string;
  status: 'enabled' | 'disabled';
}

async function getSession(): Promise<string | null> {
  const res = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: '8132024' }),
  });
  
  if (res.ok) {
    const cookies = res.headers.get('set-cookie');
    if (cookies) {
      const match = cookies.match(/session=([^;]+)/);
      return match ? match[1] : null;
    }
  }
  return null;
}

async function testDisabledCard() {
  console.log('=== 测试停用卡片功能 ===');
  console.log('');
  
  const session = await getSession();
  if (!session) {
    console.log('❌ 登录失败');
    return;
  }
  console.log('✅ 登录成功');
  console.log('');
  
  console.log('1. 获取当前启用的卡片列表');
  const listRes = await fetch('http://localhost:3000/api/admin/cards', {
    headers: {
      'Cookie': `session=${session}`,
    },
  });
  
  if (!listRes.ok) {
    console.log(`❌ 获取卡片列表失败: ${listRes.status}`);
    return;
  }
  
  const cards = await listRes.json() as Card[];
  console.log(`当前启用卡片数量: ${cards.filter(c => c.status === 'enabled').length}`);
  console.log(`所有卡片 ID: [${cards.map(c => c.id).join(', ')}]`);
  console.log('');
  
  if (cards.length === 0) {
    console.log('❌ 没有卡片可测试');
    return;
  }
  
  const targetCard = cards[0];
  console.log(`2. 停用卡片 ID: ${targetCard.id}`);
  
  const disableRes = await fetch(`http://localhost:3000/api/admin/cards/${targetCard.id}`, {
    method: 'PUT',
    headers: {
      'Cookie': `session=${session}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...targetCard, status: 'disabled' }),
  });
  
  if (disableRes.ok) {
    console.log(`✅ 成功停用卡片 ${targetCard.id}`);
  } else {
    console.log(`❌ 停用卡片失败: ${disableRes.status}`);
    return;
  }
  
  console.log('');
  console.log('3. 连续请求10次随机卡片，确认停用卡片不再出现');
  const results: number[] = [];
  let disabledCardAppeared = false;
  
  for (let i = 1; i <= 10; i++) {
    const res = await fetch('http://localhost:3000/api/cards/random', {
      headers: { 'Cache-Control': 'no-store' },
    });
    const card = await res.json() as Card | null;
    if (card && card.id) {
      results.push(card.id);
      if (card.id === targetCard.id) {
        disabledCardAppeared = true;
      }
    }
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`返回的卡片 ID: [${results.join(', ')}]`);
  
  if (disabledCardAppeared) {
    console.log('❌ 测试失败：停用的卡片仍被返回');
  } else {
    console.log('✅ 测试通过：停用卡片未出现');
  }
  
  console.log('');
  console.log('4. 恢复卡片状态');
  const enableRes = await fetch(`http://localhost:3000/api/admin/cards/${targetCard.id}`, {
    method: 'PUT',
    headers: {
      'Cookie': `session=${session}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...targetCard, status: 'enabled' }),
  });
  
  if (enableRes.ok) {
    console.log(`✅ 成功恢复卡片 ${targetCard.id}`);
  }
  
  console.log('');
  console.log('=== 测试完成 ===');
}

testDisabledCard().catch(console.error);