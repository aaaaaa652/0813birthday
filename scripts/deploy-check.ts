import fs from 'fs';
import path from 'path';

console.log('=== 部署检查脚本 ===');
console.log('');

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const uploadsDir = path.join(rootDir, 'uploads');

// 检查目录是否存在
console.log('1. 目录检查');
const dirsToCheck = [
  { name: 'data', path: dataDir },
  { name: 'uploads', path: uploadsDir },
];

dirsToCheck.forEach(dir => {
  const exists = fs.existsSync(dir.path);
  console.log(`   ${dir.name} 目录: ${exists ? '✅ 存在' : '❌ 不存在'}`);
});

console.log('');

// 检查 .gitignore
console.log('2. .gitignore 检查');
const gitignorePath = path.join(rootDir, '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

const itemsToCheck = [
  'data/cards.json',
  'data/questions.json', 
  'data/announcements.json',
  'data/messages.json',
  '/uploads',
];

itemsToCheck.forEach(item => {
  const exists = gitignoreContent.includes(item);
  console.log(`   ${item}: ${exists ? '✅ 已排除' : '❌ 未排除'}`);
});

console.log('');

// 检查数据文件
console.log('3. 数据文件检查');
const dataFiles = [
  { name: 'cards.json', path: path.join(dataDir, 'cards.json') },
  { name: 'questions.json', path: path.join(dataDir, 'questions.json') },
  { name: 'announcements.json', path: path.join(dataDir, 'announcements.json') },
];

dataFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  console.log(`   ${file.name}: ${exists ? '✅ 存在' : '❌ 不存在（首次部署正常）'}`);
});

console.log('');
console.log('=== 部署建议 ===');
console.log('');
console.log('【正式服务器部署步骤】');
console.log('1. 克隆仓库');
console.log('   git clone <仓库地址>');
console.log('');
console.log('2. 安装依赖');
console.log('   npm install');
console.log('');
console.log('3. 设置环境变量（创建 .env.local）');
console.log('   ADMIN_PASSWORD=your-admin-password');
console.log('');
console.log('4. 创建必要目录并设置权限');
console.log('   mkdir -p data uploads');
console.log('   chown -R www-data:www-data data uploads');
console.log('   chmod -R 755 data uploads');
console.log('');
console.log('5. 构建项目');
console.log('   npm run build');
console.log('');
console.log('6. 启动服务（建议使用 PM2）');
console.log('   pm2 start npm --name "birthday" -- run start');
console.log('');
console.log('【首次部署初始化】');
console.log('如果数据文件不存在，系统会自动初始化空数组，无需手动创建');
console.log('可以使用迁移脚本导入初始数据（仅首次）：');
console.log('   npx ts-node scripts/migrate-data.ts');
console.log('');
console.log('【备份建议】');
console.log('定期备份 data/ 和 uploads/ 目录：');
console.log('   tar -czf backup-$(date +%Y%m%d).tar.gz data uploads');
console.log('');
console.log('【注意事项】');
console.log('- Git 拉取不会覆盖 data/ 和 uploads/ 目录（已在 .gitignore 中）');
console.log('- 重新构建不会影响数据文件');
console.log('- 重启服务不会丢失数据');
console.log('- 测试数据在 data/cards.ts 和 data/quiz.ts 中，不会自动迁移到正式环境');