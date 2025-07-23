# ACM中转站文件上传指南

## 文件夹结构

```
files/
├── contest-pdfs/       # 比赛PDF文件
│   ├── atcoder/
│   ├── ccpc/
│   ├── codeforces/
│   ├── icpc/
│   ├── nowcoder/
│   └── others/
├── solutions/          # 题解文件
└── summaries/          # 总结报告
```

## 使用方法

### 1. 通过Web界面选择文件
- 在比赛管理或题目管理页面选择文件
- 系统会显示文件保存指导对话框
- 记录下显示的文件路径

### 2. 手动放置文件
由于浏览器安全限制，需要手动将文件复制到指定位置：

```bash
# 示例：将PDF文件复制到比赛PDF文件夹
cp "your_file.pdf" "/home/zyn/program/2025-Summer/ACM-Transit/Context-Engineering-Intro/acm-transit/files/contest-pdfs/your_file.pdf"

# 示例：将题解文件复制到solutions文件夹
cp "solution.md" "/home/zyn/program/2025-Summer/ACM-Transit/Context-Engineering-Intro/acm-transit/files/solutions/solution.md"
```

### 3. 文件命名规范
- 系统会自动标准化文件名（替换特殊字符为下划线）
- 建议使用英文文件名，避免中文和特殊字符
- 推荐格式：`比赛名-题目字母.pdf` 或 `problem-id-solution.md`

## 支持的文件类型

### 比赛PDF
- `.pdf` 格式
- 存放位置：`files/contest-pdfs/`

### 题解文件
- `.md`（Markdown）
- `.txt`（纯文本）
- `.cpp`, `.py`, `.java`（代码文件）
- 存放位置：`files/solutions/`

## 注意事项

1. **多人协作**：建议团队成员遵循统一的文件命名规范
2. **文件大小**：建议单个文件不超过10MB
3. **路径管理**：文件路径会保存在数据库中，移动文件后需要更新记录
4. **备份**：重要文件建议定期备份

## 自动化选项

如需自动化文件管理，可以考虑：
1. 使用本地脚本监听文件夹变化
2. 设置文件上传服务器（需要额外开发）
3. 使用云存储服务集成

---
*最后更新：2025年7月*