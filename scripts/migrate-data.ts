import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(process.cwd(), 'data-backups');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupFile(sourcePath: string): void {
  ensureBackupDir();
  const fileName = path.basename(sourcePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${fileName}.backup.${timestamp}`);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`📦 已备份 ${fileName} 到 ${backupPath}`);
  }
}

const cardsData = [
  {
    id: 1,
    image: "/cards/card1.jpg",
    imagePosition: "center 35%",
    lyric: ["锦鸡飞翔画眉唱", "春风送暖百花香", "铜鼓声声山河舞", "芦笙阵阵人欢畅"],
    blessing: "愿你明艳",
    source: "《苗岭飞歌》"
  },
  {
    id: 2,
    image: "/cards/card2.jpg",
    imagePosition: "center 40%",
    lyric: ["踏平了山路唱山歌", "撒开了渔网唱鱼歌"],
    blessing: "愿你踏歌而行",
    source: "《大地飞歌》"
  },
  {
    id: 3,
    image: "/cards/card3.jpg",
    imagePosition: "center 50%",
    lyric: ["在这安安静静的黄昏", "轻推开吱吱呀呀的门", "把我牵牵挂挂的问询", "托付给飘飘荡荡的云"],
    blessing: "愿你内心宁静",
    source: "《你好吗》"
  },
  {
    id: 4,
    image: "/cards/card4.jpg",
    imagePosition: "center 45%",
    lyric: ["今夜万家灯火", "温暖情怀弥漫", "天空为我倾倒", "世界如此美好", "雪花自在飘"],
    blessing: "愿你明月相邀",
    source: "《万家灯火》"
  },
  {
    id: 5,
    image: "/cards/card5.jpg",
    imagePosition: "center 35%",
    lyric: ["风云变幻平常事", "从容在险峰"],
    blessing: "愿你自在从容",
    source: "《日出黄山》"
  },
  {
    id: 6,
    image: "/cards/card6.jpg",
    imagePosition: "center 55%",
    lyric: ["梦啊，乘上那祝福的翅膀", "让美丽的心情飞跃星空", "歌啊，撒向那多彩的画屏", "让美丽的心情赞美成功"],
    blessing: "愿你破浪逐梦",
    source: "《美丽的心情》"
  },
  {
    id: 7,
    image: "/cards/card7.jpg",
    imagePosition: "center 45%",
    lyric: ["今天是你的生日我的中国", "清晨我放飞一群白鸽", "为你衔来一枚橄榄叶", "鸽子在崇山峻岭飞过"],
    blessing: "愿你平安喜乐",
    source: "《今天是你的生日》"
  },
  {
    id: 8,
    image: "/cards/card8.jpg",
    imagePosition: "center 30%",
    lyric: ["桃花在水一方", "荷花在水中央", "迎来百鸟朝凤", "伴随金凤朝阳"],
    blessing: "愿你向阳而生",
    source: "《天下美凤凰》"
  },
  {
    id: 9,
    image: "/cards/card9.jpg",
    imagePosition: "center 50%",
    lyric: ["最美是你", "像星辰缀满天空", "花瓣落小溪"],
    blessing: "愿你清澈明亮",
    source: "《最美是你》"
  },
  {
    id: 10,
    image: "/cards/card10.jpg",
    imagePosition: "center 40%",
    lyric: ["登高山走百川天高地宽", "云水近孤帆远爱在心间", "山一重水一湾花明柳暗", "红胜火绿如蓝好梦缠绵"],
    blessing: "愿你登高望远",
    source: "《美丽中华》"
  },
  {
    id: 11,
    image: "/cards/card11.jpg",
    imagePosition: "center 30%",
    lyric: ["水潺潺淡泊致远", "山叠翠千仞无言", "清风明月梦相伴", "坚强一颗心，人在天地间"],
    blessing: "愿你勇敢向前",
    source: "《爱在山川》"
  },
  {
    id: 12,
    image: "/cards/card12.jpg",
    imagePosition: "center 50%",
    lyric: ["幽幽清香飘过我的家", "疑是天上飞雨花", "谁能听清风儿在说话", "多少人间故事留下"],
    blessing: "愿你芬芳天涯",
    source: "《盛开的牡丹》"
  },
  {
    id: 13,
    image: "/cards/card13.jpg",
    imagePosition: "center 40%",
    lyric: ["从远古到如今，春秋几度", "登高处捧起那，黄山日出", "从自然到心灵，有爱有梦", "蜀道上马铃响，风雨无阻"],
    blessing: "愿你一路阳光",
    source: "《北纬三十度》"
  },
  {
    id: 14,
    image: "/cards/card14.jpg",
    imagePosition: "center 35%",
    lyric: ["远远的湖泊圆得像月亮", "美妙的风光美得像月亮", "远远的湖泊圆得像月亮", "美妙的风光美得像月亮"],
    blessing: "愿你明月相伴",
    source: "《月亮妹妹》"
  },
  {
    id: 15,
    image: "/cards/card15.jpg",
    imagePosition: "center 35%",
    lyric: ["苗山月色好", "苗家爱月圆", "月随人意走", "梦随月儿圆"],
    blessing: "愿你好梦成真",
    source: "《苗山明月》"
  },
  {
    id: 16,
    image: "/cards/card16.jpg",
    imagePosition: "center 35%",
    lyric: ["谁是我知音", "谁解我情怀", "一片冰心等君来"],
    blessing: "愿你高山流水",
    source: "《梅花引》"
  },
  {
    id: 17,
    image: "/cards/card17.jpg",
    imagePosition: "center 35%",
    lyric: ["星儿闪闪", "月儿圆圆", "你的微笑", "陪着我作伴"],
    blessing: "愿你安宁自得",
    source: "《期盼》"
  },
  {
    id: 18,
    image: "/cards/card18.jpg",
    imagePosition: "center 35%",
    lyric: ["回首黄沙古道", "风雨飘渺", "聆听莽原峡谷", "龙吟虎啸"],
    blessing: "愿你意气风发",
    source: "《数风流人物》"
  },
  {
    id: 19,
    image: "/cards/card19.jpg",
    imagePosition: "center 35%",
    lyric: ["今天我突然被陶醉", "看见一丛三角梅", "你这枚可爱的故乡花", "竟和我突然来相会"],
    blessing: "愿你惊喜常伴",
    source: "《三角梅》"
  },
];

const quizData = [
  { id: 1, question: "宋祖英的丈夫是哪位著名科学家？", answers: ["罗浩"], hint: "他是一位航天专家" },
  { id: 2, question: "宋祖英出生于哪个省份？", answers: ["湖南省", "湖南"], hint: "毛主席的故乡" },
  { id: 3, question: "宋祖英在春晚上演唱次数最多的歌曲是哪一首？", answers: ["好日子"], hint: "耳熟能详的经典祝福歌曲" },
  { id: 4, question: "宋祖英是哪个少数民族的歌唱家？", answers: ["苗族", "苗"], hint: "一个能歌善舞的民族" },
  { id: 5, question: "宋祖英的代表作品《辣妹子》描写的是哪个地方的女孩？", answers: ["湖南", "湖南妹子", "湘妹子"], hint: "鱼米之乡" },
  { id: 6, question: "宋祖英获得过几次中国音乐最高奖项\"金钟奖\"？", answers: ["2次", "两次"], hint: "一个小于10的偶数" },
  { id: 7, question: "宋祖英曾担任哪个重要的社会职务？", answers: ["全国政协委员", "政协委员"], hint: "参政议政的职务" },
  { id: 8, question: "宋祖英演唱的《爱我中华》歌词里提到了多少个民族？", answers: ["56个", "五十六个"], hint: "我国民族总数" },
  { id: 9, question: "宋祖英毕业于哪所著名的音乐院校？", answers: ["中国音乐学院", "中国音院"], hint: "位于北京的国家级音乐学院" },
  { id: 10, question: "宋祖英在2006年获得了什么重要的国际荣誉？", answers: ["肯尼迪艺术中心金奖", "肯尼迪金奖"], hint: "美国的最高艺术奖项之一" },
];

function migrateCards() {
  console.log('=== 开始迁移卡片数据 ===');
  
  const cardsFile = path.join(DATA_DIR, 'cards.json');
  
  if (fs.existsSync(cardsFile)) {
    const existingContent = fs.readFileSync(cardsFile, 'utf-8');
    try {
      const existingCards = JSON.parse(existingContent);
      if (existingCards.length > 0) {
        console.log('⚠️ cards.json 已存在数据，备份后跳过迁移');
        backupFile(cardsFile);
        return;
      }
    } catch {
      console.log('⚠️ cards.json 文件格式异常，备份后重新创建');
      backupFile(cardsFile);
    }
  }

  const migratedCards = cardsData.map((card: any, index: number) => ({
    id: card.id || index + 1,
    image: card.image,
    imagePosition: card.imagePosition || 'center center',
    lyric: card.lyric || [],
    blessing: card.blessing || '',
    source: card.source || '',
    status: 'enabled' as const,
    sortOrder: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  }));

  ensureDataDir();
  fs.writeFileSync(cardsFile, JSON.stringify(migratedCards, null, 2));
  console.log(`✅ 成功迁移 ${migratedCards.length} 张卡片`);
}

function migrateQuestions() {
  console.log('=== 开始迁移题目数据 ===');
  
  const questionsFile = path.join(DATA_DIR, 'questions.json');
  
  if (fs.existsSync(questionsFile)) {
    const existingContent = fs.readFileSync(questionsFile, 'utf-8');
    try {
      const existingQuestions = JSON.parse(existingContent);
      if (existingQuestions.length > 0) {
        console.log('⚠️ questions.json 已存在数据，备份后跳过迁移');
        backupFile(questionsFile);
        return;
      }
    } catch {
      console.log('⚠️ questions.json 文件格式异常，备份后重新创建');
      backupFile(questionsFile);
    }
  }

  const migratedQuestions = quizData.map((q: any, index: number) => ({
    id: q.id || index + 1,
    question: q.question || '',
    correctAnswer: q.answers?.[0] || '',
    otherAnswers: q.answers?.slice(1) || [],
    hint: q.hint || '',
    status: 'enabled' as const,
    sortOrder: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  }));

  ensureDataDir();
  fs.writeFileSync(questionsFile, JSON.stringify(migratedQuestions, null, 2));
  console.log(`✅ 成功迁移 ${migratedQuestions.length} 道题目`);
}

function runMigration() {
  console.log('=== 数据迁移脚本 ===');
  console.log('');
  console.log('⚠️ 注意：此脚本仅用于首次部署时初始化数据');
  console.log('⚠️ 已有数据会自动备份并跳过迁移');
  console.log('');
  
  migrateCards();
  console.log('');
  migrateQuestions();
  
  console.log('');
  console.log('=== 数据迁移完成 ===');
  console.log('');
  console.log('📝 后续代码更新时，请不要再次执行此脚本');
  console.log('📝 如需手动更新数据，请通过后台管理界面操作');
}

runMigration();