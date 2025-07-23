# PDF文件管理指南

这个目录存储比赛的PDF题目文件，支持多人协作和版本控制。

## 📁 目录结构

```
contest-pdfs/
├── codeforces/
│   ├── cf-round-900-div2.pdf
│   ├── cf-round-901-div1.pdf
│   └── cf-educational-160.pdf
├── atcoder/
│   ├── abc-330.pdf
│   └── arc-170.pdf
├── icpc/
│   ├── 2023-regional-beijing.pdf
│   └── 2023-world-finals.pdf
└── others/
    ├── ccpc-2023-final.pdf
    └── nowcoder-contest-66.pdf
```

## 📝 命名规范

### 推荐命名格式

1. **Codeforces**: `cf-round-{number}-{division}.pdf`
   - 例如: `cf-round-900-div2.pdf`
   - 例如: `cf-educational-160.pdf`

2. **AtCoder**: `{contest-type}-{number}.pdf`
   - 例如: `abc-330.pdf`
   - 例如: `arc-170.pdf`

3. **ICPC/CCPC**: `{year}-{region/type}-{location}.pdf`
   - 例如: `2023-regional-beijing.pdf`
   - 例如: `2023-world-finals.pdf`

4. **其他比赛**: `{platform}-{contest-name}.pdf`
   - 例如: `nowcoder-contest-66.pdf`

### 命名规则

- ✅ 使用小写英文字母和数字
- ✅ 使用连字符 `-` 分隔单词
- ✅ 包含比赛平台和编号信息
- ❌ 避免使用中文字符
- ❌ 避免使用空格和特殊符号

## 🔗 在应用中引用PDF

在添加比赛记录时，PDF路径应该这样填写：

```
./files/contest-pdfs/codeforces/cf-round-900-div2.pdf
```

## 🤝 协作指南

### 添加新PDF文件

1. **下载官方PDF**
   - 从比赛官方网站下载题目PDF
   - 确保文件大小合理（建议 < 5MB）

2. **按规范命名**
   - 遵循上述命名规范
   - 放置到对应的子目录中

3. **更新记录**
   - 在应用中添加比赛记录
   - 正确填写PDF路径

4. **提交到Git**
   ```bash
   git add files/contest-pdfs/
   git commit -m "Add contest PDF: CF Round 900 Div.2"
   git push origin main
   ```

### 文件大小管理

- **适中大小**: 单个PDF文件建议控制在5MB以内
- **压缩优化**: 可以使用PDF压缩工具减小文件体积
- **定期清理**: 定期移除过时的PDF文件

### 版本控制最佳实践

1. **有意义的提交信息**
   ```bash
   git commit -m "Add contest PDFs: CF Round 900-902"
   ```

2. **批量提交**
   - 避免为每个PDF创建单独的提交
   - 将相关的PDF文件一起提交

3. **冲突处理**
   ```bash
   git pull origin main  # 先获取最新更改
   # 解决冲突（如果有）
   git add .
   git commit -m "Merge and add new contest PDFs"
   ```

## 🗂️ 文件组织建议

### 按平台分类
- 每个主要平台创建独立子目录
- 便于查找和管理

### 按时间归档
- 可以考虑按年份进一步分类
- 例如: `codeforces/2023/`, `codeforces/2024/`

### 元数据记录
- 在提交信息中记录PDF的来源和日期
- 便于后续追踪和管理

## ⚠️ 注意事项

1. **版权尊重**
   - 仅用于学习目的
   - 不要用于商业用途
   - 尊重比赛主办方的版权

2. **存储限制**
   - GitHub有仓库大小限制
   - 定期评估PDF文件的必要性
   - 考虑使用Git LFS处理大文件

3. **团队约定**
   - 团队成员应遵循统一的命名规范
   - 避免重复上传相同的PDF文件
   - 及时清理无用或过期的文件

## 🔧 工具推荐

### PDF压缩工具
- [PDF Compressor](https://smallpdf.com/compress-pdf)
- [ILovePDF](https://www.ilovepdf.com/compress_pdf)
- 本地工具: `ghostscript`, `qpdf`

### 批量重命名工具
- Linux/Mac: `rename` 命令
- Windows: PowerRename (PowerToys)

---

遵循这些指南，可以确保团队的PDF文件管理井然有序，便于协作和学习！ 📚