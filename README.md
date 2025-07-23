# ACM中转站 - Contest & Problem Management System

一个简单实用的ACM竞赛记录和题目管理工具，专注于手动数据录入和基于JSON的本地存储，支持Git同步进行多人协作。

## 🌟 功能特色

- **比赛记录管理**: 记录比赛表现、排名、解题情况
- **题目练习跟踪**: 管理题目状态、标签、难度等级
- **统计分析**: 实时统计和进度可视化
- **数据同步**: 基于Git的多人协作和跨设备同步
- **离线优先**: 无需网络连接即可正常使用
- **响应式设计**: 支持桌面和移动设备

## 📁 项目结构

```
acm-transit/
├── index.html              # 仪表板 - 统计概览
├── contests.html           # 比赛管理页面
├── problems.html           # 题目管理页面
├── data/
│   ├── contests.json      # 比赛记录数据
│   ├── problems.json      # 题目记录数据
│   └── settings.json      # 应用配置
├── files/                 # 文件存储目录
│   ├── contest-pdfs/      # 比赛PDF文件 (Git同步)
│   ├── summaries/         # 比赛总结文档 (Git同步)
│   └── solutions/         # 个人解题代码 (Git忽略)
├── css/
│   └── style.css          # 统一样式文件
└── js/
    ├── main.js            # 主应用控制器
    ├── storage.js         # 数据存储层
    ├── contests.js        # 比赛管理逻辑
    └── problems.js        # 题目管理逻辑
```

## 🚀 快速开始

### 本地运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd acm-transit
   ```

2. **启动本地服务器**
   ```bash
   # 使用Python
   python3 -m http.server 8000
   
   # 或使用Node.js
   npx serve .
   
   # 或使用任何静态文件服务器
   ```

3. **访问应用**
   打开浏览器访问 `http://localhost:8000`

### 多人协作设置

1. **初始化Git仓库** (如果还没有)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ACM Transit System"
   ```

2. **设置远程仓库**
   ```bash
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

3. **团队成员加入**
   ```bash
   git clone <github-repo-url>
   cd acm-transit
   ```

## 📊 使用指南

### 比赛记录管理

1. **添加比赛记录**
   - 访问"比赛管理"页面
   - 填写比赛名称、平台、日期等信息
   - 记录排名、解题数、Rating变化等

2. **上传比赛PDF**
   - 将比赛PDF文件放入 `files/contest-pdfs/` 目录
   - 在比赛记录中填写PDF路径，如 `./files/contest-pdfs/cf-round-900.pdf`
   - PDF文件会被Git追踪，团队成员可以共享

3. **编写比赛总结**
   - 在 `files/summaries/` 目录创建Markdown总结文档
   - 在比赛记录中填写总结路径
   - 总结文档会被Git同步，便于知识共享

### 题目练习管理

1. **添加题目记录**
   - 访问"题目管理"页面  
   - 填写题目标题、平台、难度等信息
   - 添加算法标签和状态跟踪

2. **状态管理**
   - `待解决`: 计划要做的题目
   - `尝试中`: 正在思考或调试的题目
   - `已解决`: 成功AC的题目

3. **标签系统**
   - 使用标签对题目进行分类：`dp`、`greedy`、`graph`等
   - 支持多标签和标签筛选功能

### 数据同步和协作

1. **保存更改到Git**
   ```bash
   git add data/
   git commit -m "Add contest records and problem solutions"
   git push origin main
   ```

2. **同步团队更新**
   ```bash
   git pull origin main
   ```

3. **导出备份数据**
   - 使用应用中的"导出数据"功能
   - 生成包含所有记录的JSON备份文件

## 🤝 团队协作最佳实践

### PDF文件管理

- **✅ 推荐做法**:
  - 将比赛官方PDF上传到 `files/contest-pdfs/`
  - 使用清晰的命名规范：`cf-round-900-div2.pdf`
  - 在比赛记录中正确填写PDF路径
  - 定期清理过期的PDF文件

- **❌ 避免做法**:
  - 不要上传过大的PDF文件 (>10MB)
  - 不要上传个人练习截图
  - 不要在PDF文件名中使用中文字符

### 总结文档协作

- **团队总结**: 在 `files/summaries/` 中创建共享的比赛总结
- **知识积累**: 记录解题思路、易错点、知识点
- **模板使用**: 使用应用生成的总结模板保持格式一致

### 分支管理

```bash
# 为重要更新创建分支
git checkout -b feature/add-regional-contest-data

# 完成修改后合并
git checkout main
git merge feature/add-regional-contest-data
```

## 🛠️ 技术特性

- **纯前端实现**: HTML + CSS + JavaScript，无需后端服务器
- **本地优先**: localStorage缓存，离线可用
- **现代浏览器支持**: File System Access API + 传统下载兜底
- **响应式设计**: 移动设备友好
- **数据验证**: 表单验证和数据完整性检查
- **Git友好**: JSON数据结构适合版本控制

## 📝 数据格式

### 比赛记录示例
```json
{
  "id": "cf-round-900",
  "name": "Codeforces Round 900 (Div. 2)",
  "platform": "Codeforces",
  "date": "2024-01-15",
  "url": "https://codeforces.com/contest/1878",
  "pdfPath": "./files/contest-pdfs/cf-900.pdf",
  "summaryPath": "./files/summaries/cf-900.md",
  "rank": "347/12000",
  "solved": 3,
  "totalProblems": 5,
  "ratingChange": "+45",
  "notes": "表现不错，C题卡了很久"
}
```

### 题目记录示例
```json
{
  "id": "cf-1878c",
  "title": "Vasilije in Cacak", 
  "platform": "Codeforces",
  "difficulty": 1300,
  "tags": ["math", "constructive"],
  "status": "solved",
  "url": "https://codeforces.com/problem/1878/C",
  "notes": "组合数学题，需要考虑边界情况"
}
```

## 🔧 自定义配置

编辑 `data/settings.json` 自定义应用行为：

```json
{
  "contestPlatforms": ["Codeforces", "AtCoder", "ICPC", "自定义"],
  "problemTags": ["dp", "greedy", "graph", "math", "string"],
  "difficultyLevels": [800, 1000, 1200, 1400, 1600, 1800, 2000],
  "theme": "light",
  "itemsPerPage": 20
}
```

## 🐛 问题排查

### 常见问题

1. **数据没有保存**
   - 检查浏览器是否支持localStorage
   - 确认没有在隐身模式下使用

2. **PDF文件无法访问**
   - 检查文件路径是否正确
   - 确认文件确实存在于指定目录

3. **导出功能不工作**
   - 现代浏览器支持File System Access API
   - 旧版浏览器会自动下载文件

### 浏览器兼容性

- ✅ Chrome/Edge: 完整功能支持
- ✅ Firefox/Safari: 核心功能支持，导出为下载
- ✅ 移动浏览器: 响应式界面支持

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

**开始使用ACM中转站，让你的竞赛学习更加系统化！** 🚀# ACM-Transit-Template
