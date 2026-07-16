# 正式部署指南

## 目录
1. [环境要求](#环境要求)
2. [首次部署](#首次部署)
3. [后续代码更新](#后续代码更新)
4. [数据备份](#数据备份)
5. [数据恢复](#数据恢复)
6. [权限设置说明](#权限设置说明)
7. [注意事项](#注意事项)

---

## 环境要求

- Node.js >= 20.x
- npm >= 10.x
- PM2（推荐用于生产环境进程管理）

---

## 首次部署

### 1. 克隆仓库

```bash
git clone <仓库地址>
cd <项目目录>
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置环境变量

创建 `.env.local` 文件：

```bash
# .env.local 文件内容
ADMIN_PASSWORD=your-admin-password-here
```

### 4. 创建数据目录并设置权限

#### 第一步：确认运行用户

```bash
# 如果使用 PM2，检查 PM2 运行用户
pm2 status

# 或者检查当前用户
whoami

# 常见的运行用户可能是: www-data, node, 或当前登录用户
```

#### 第二步：设置目录权限

```bash
# 创建必要目录
mkdir -p data uploads

# 设置目录所有者为实际运行用户（替换为你的运行用户）
# 例如：如果运行用户是 www-data
chown -R www-data:www-data data uploads

# 如果运行用户是当前用户（如使用 PM2 的用户）
# chown -R $(whoami):$(whoami) data uploads

# 设置权限（755 表示所有者有读写执行权限，其他用户有读执行权限）
chmod -R 755 data uploads
```

### 5. 初始化数据（仅首次部署）

```bash
# 执行数据迁移脚本（导入初始卡片和题目）
npx ts-node scripts/migrate-data.ts
```

> **注意**：迁移脚本会：
> - 检查目标文件是否已有数据
> - 如果已有数据，自动备份并跳过迁移
> - 只在空文件时导入初始数据

### 6. 构建项目

```bash
npm run build
```

### 7. 启动服务

#### 使用 PM2（推荐）

```bash
# 启动服务
pm2 start npm --name "birthday" -- run start

# 查看状态
pm2 status

# 查看日志
pm2 logs birthday
```

#### 使用 npm（开发环境）

```bash
npm run start
```

---

## 后续代码更新

### 更新流程

```bash
# 1. 停止服务
pm2 stop birthday

# 2. 拉取最新代码
git pull

# 3. 安装新依赖（如果 package.json 有变更）
npm install

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart birthday

# 6. 验证服务状态
pm2 status
```

### 重要提醒

**❌ 禁止再次执行数据迁移脚本**：

```bash
# 不要执行这个命令！
# npx ts-node scripts/migrate-data.ts  ← 会覆盖线上数据
```

> **原因**：迁移脚本包含初始测试数据，再次执行会覆盖线上已维护的数据。

---

## 数据备份

### 手动备份

```bash
# 创建备份目录（建议在项目目录外）
mkdir -p ~/birthday-backups

# 备份数据文件
tar -czf ~/birthday-backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz data uploads

# 查看备份文件
ls -la ~/birthday-backups/
```

### 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR=~/birthday-backups
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz data uploads
echo "备份完成: backup-$(date +%Y%m%d-%H%M%S).tar.gz"
```

设置定时任务：

```bash
# 每天凌晨 2 点自动备份
crontab -e

# 添加以下内容
0 2 * * * /path/to/backup.sh >> /var/log/birthday-backup.log 2>&1
```

---

## 数据恢复

### 从备份恢复

```bash
# 查看可用备份
ls -la ~/birthday-backups/

# 停止服务
pm2 stop birthday

# 恢复数据（替换为你的备份文件名）
tar -xzf ~/birthday-backups/backup-20240101-020000.tar.gz -C /path/to/project

# 重启服务
pm2 restart birthday
```

---

## 权限设置说明

### 权限原理

| 权限 | 含义 |
|------|------|
| `chmod 755` | 所有者：读(4)+写(2)+执行(1)=7；其他用户：读(4)+执行(1)=5 |
| `chmod 775` | 所有者和组：读+写+执行=7；其他用户：读+执行=5 |

### 正确的权限配置

```bash
# 方案一：目录所有者 = 运行用户
chown -R node:node data uploads
chmod -R 755 data uploads

# 方案二：运行用户属于目录组
chown -R root:node data uploads
chmod -R 775 data uploads

# 方案三：使用 ACL（更精细控制）
setfacl -R -m u:node:rwx data uploads
setfacl -R -m u:node:rwx data uploads
```

### 检查权限

```bash
# 检查目录权限
ls -la data/ uploads/

# 检查运行用户是否有写入权限
su - node -c "echo 'test' > /path/to/project/data/test.txt && rm /path/to/project/data/test.txt && echo '写入权限正常'"
```

---

## 注意事项

### 1. Git 不会覆盖数据

以下文件已在 `.gitignore` 中排除：

```
data/cards.json
data/questions.json
data/announcements.json
data/messages.json
data-backups/
/uploads
```

### 2. 数据文件不存在时的行为

| 文件 | 不存在时行为 | 说明 |
|------|-------------|------|
| `cards.json` | 返回空数组，服务端记录日志 | 留言成功后显示默认感谢提示 |
| `questions.json` | 返回空数组，禁止进入留言 | **必须至少有一道启用题目** |
| `announcements.json` | 返回空数组 | 无公告时不显示 |

### 3. 首次部署后检查

```bash
# 检查数据文件是否创建
ls -la data/

# 检查目录权限
ls -ld data/ uploads/

# 检查服务状态
pm2 status

# 测试随机卡片接口
curl http://localhost:3000/api/cards/random

# 测试题目接口
curl http://localhost:3000/api/questions/random
```

### 4. 部署清单

- [ ] 克隆仓库
- [ ] 安装依赖
- [ ] 创建 `.env.local`
- [ ] 创建并授权 `data/` 和 `uploads/` 目录
- [ ] 执行数据迁移（仅首次）
- [ ] 构建项目
- [ ] 启动服务
- [ ] 验证接口正常
- [ ] 设置定期备份

---

## 紧急恢复流程

如果服务异常：

```bash
# 1. 查看日志
pm2 logs birthday

# 2. 检查数据文件完整性
cat data/cards.json | head -c 100
cat data/questions.json | head -c 100

# 3. 从备份恢复
pm2 stop birthday
tar -xzf ~/birthday-backups/latest.tar.gz -C /path/to/project
pm2 restart birthday
```

---

**文档版本**: v1.0  
**最后更新**: 2024年8月  
**适用项目**: Birthday Message Wall