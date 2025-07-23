/**
 * ACM中转站 - 新文件管理系统
 * 负责比赛与题目的独立文件存储架构，支持多作者题解管理
 * 实现虚拟文件夹创建和路径管理功能
 */

class NewFileManager {
    constructor() {
        this.baseContestPath = './files/contests/';
        this.baseProblemPath = './files/problems/';
        this.fileExtensions = {
            pdf: ['.pdf'],
            solution: ['.md', '.txt', '.cpp', '.py', '.java']
        };
        
        // 文件状态缓存
        this.fileStatusCache = new Map();
        this.cacheTimeout = 30000; // 30秒缓存过期
    }

    /**
     * 创建比赛文件夹结构
     * @param {string} contestId - 比赛ID
     * @returns {Object} 生成的路径结构
     */
    createContestStructure(contestId) {
        const basePath = `${this.baseContestPath}${contestId}/`;
        return {
            statement: `${basePath}statement/contest.pdf`,
            solution: `${basePath}solution/editorial.pdf`, 
            summary: `${basePath}summary/review.pdf`
        };
    }

    /**
     * 创建题目文件夹结构
     * @param {string} problemId - 题目ID
     * @returns {Object} 生成的路径结构
     */
    createProblemStructure(problemId) {
        const basePath = `${this.baseProblemPath}${problemId}/`;
        return {
            statement: `${basePath}statement/problem.pdf`,
            solutions: {
                official: `${basePath}solution/official/solution.pdf`
            }
        };
    }

    /**
     * 添加题解作者
     * @param {string} problemId - 题目ID
     * @param {string} authorName - 作者名称
     * @param {string} displayName - 显示名称
     * @returns {string} 新作者的解题路径
     */
    addSolutionAuthor(problemId, authorName, displayName) {
        const authorFolder = this.sanitizeAuthorName(authorName);
        const basePath = `${this.baseProblemPath}${problemId}/solution/`;
        return `${basePath}${authorFolder}/solution.pdf`;
    }

    /**
     * 清理作者名称为文件夹名
     * @param {string} authorName - 原始作者名
     * @returns {string} 清理后的文件夹名
     */
    sanitizeAuthorName(authorName) {
        return authorName
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 文件存在状态
     */
    async checkFileStatus(filePath) {
        try {
            // 检查缓存
            const cached = this.fileStatusCache.get(filePath);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.exists;
            }

            const response = await fetch(filePath, { method: 'HEAD' });
            const exists = response.ok;
            
            // 更新缓存
            this.fileStatusCache.set(filePath, {
                exists: exists,
                timestamp: Date.now()
            });
            
            return exists;
        } catch (error) {
            console.warn(`文件检查失败: ${filePath}`, error);
            return false;
        }
    }

    /**
     * 生成文件上传指导
     * @param {string} targetPath - 目标路径
     * @param {string} fileType - 文件类型
     * @returns {Object} 上传指导信息
     */
    generateUploadGuidance(targetPath, fileType = 'pdf') {
        const absolutePath = this.convertToAbsolutePath(targetPath);
        return {
            targetPath,
            absolutePath,
            instructions: [
                `请将您的 ${fileType} 文件复制到以下位置:`,
                `相对路径: ${targetPath}`,
                `绝对路径: ${absolutePath}`,
                `注意: 请确保文件夹存在，如不存在请手动创建`
            ],
            folderPath: targetPath.substring(0, targetPath.lastIndexOf('/')),
            fileName: targetPath.substring(targetPath.lastIndexOf('/') + 1),
            createFolderCommand: this.generateCreateFolderCommand(targetPath)
        };
    }

    /**
     * 转换相对路径为绝对路径（用于指导）
     * @param {string} relativePath - 相对路径
     * @returns {string} 绝对路径
     */
    convertToAbsolutePath(relativePath) {
        // 获取当前工作目录
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        return relativePath.replace('./files/', `${basePath}/files/`);
    }

    /**
     * 生成创建文件夹的命令
     * @param {string} targetPath - 目标文件路径
     * @returns {string} 创建文件夹的命令
     */
    generateCreateFolderCommand(targetPath) {
        const folderPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
        const absoluteFolderPath = this.convertToAbsolutePath(folderPath);
        return `mkdir -p "${absoluteFolderPath}"`;
    }

    /**
     * 扫描比赛文件
     * @param {string} contestId - 比赛ID
     * @returns {Promise<Object>} 比赛文件状态
     */
    async scanContestFiles(contestId) {
        const structure = this.createContestStructure(contestId);
        const fileStatus = {};
        
        console.log(`扫描比赛文件: ${contestId}`);
        
        for (const [type, path] of Object.entries(structure)) {
            console.log(`检查文件: ${path}`);
            const exists = await this.checkFileStatus(path);
            fileStatus[type] = {
                path,
                exists,
                lastChecked: new Date().toISOString(),
                status: exists ? 'uploaded' : 'pending'
            };
        }
        
        console.log(`比赛文件扫描结果:`, fileStatus);
        return fileStatus;
    }

    /**
     * 扫描题目文件 (包括所有作者的题解)
     * @param {string} problemId - 题目ID
     * @param {Array} authorList - 已知作者列表
     * @returns {Promise<Object>} 题目文件状态
     */
    async scanProblemFiles(problemId, authorList = ['official']) {
        const basePath = `${this.baseProblemPath}${problemId}/`;
        const fileStatus = {
            statement: {
                path: `${basePath}statement/problem.pdf`,
                exists: false,
                status: 'pending'
            },
            solutions: {}
        };

        console.log(`扫描题目文件: ${problemId}`);

        // 检查题面文件
        fileStatus.statement.exists = await this.checkFileStatus(fileStatus.statement.path);
        fileStatus.statement.status = fileStatus.statement.exists ? 'uploaded' : 'pending';

        // 检查所有作者的题解
        for (const author of authorList) {
            const authorFolder = this.sanitizeAuthorName(author);
            const solutionPath = `${basePath}solution/${authorFolder}/solution.pdf`;
            const exists = await this.checkFileStatus(solutionPath);
            
            fileStatus.solutions[author] = {
                path: solutionPath,
                exists: exists,
                status: exists ? 'uploaded' : 'pending',
                author: author,
                authorFolder: authorFolder,
                lastChecked: new Date().toISOString()
            };
        }

        console.log(`题目文件扫描结果:`, fileStatus);
        return fileStatus;
    }

    /**
     * 批量检查文件状态
     * @param {Array} filePaths - 文件路径数组
     * @returns {Promise<Object>} 文件状态映射
     */
    async batchCheckFiles(filePaths) {
        const promises = filePaths.map(async (path) => {
            const exists = await this.checkFileStatus(path);
            return { path, exists };
        });

        const results = await Promise.all(promises);
        const statusMap = {};
        
        results.forEach(({ path, exists }) => {
            statusMap[path] = {
                exists,
                status: exists ? 'uploaded' : 'pending',
                lastChecked: new Date().toISOString()
            };
        });

        return statusMap;
    }

    /**
     * 清理文件状态缓存
     */
    clearFileStatusCache() {
        this.fileStatusCache.clear();
        console.log('文件状态缓存已清理');
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        const now = Date.now();
        let validCount = 0;
        let expiredCount = 0;

        for (const [path, cached] of this.fileStatusCache) {
            if ((now - cached.timestamp) < this.cacheTimeout) {
                validCount++;
            } else {
                expiredCount++;
            }
        }

        return {
            total: this.fileStatusCache.size,
            valid: validCount,
            expired: expiredCount,
            cacheTimeout: this.cacheTimeout
        };
    }

    /**
     * 验证路径安全性
     * @param {string} path - 路径
     * @returns {boolean} 是否安全
     */
    validatePathSecurity(path) {
        // 防止路径遍历攻击
        if (path.includes('..') || path.includes('~') || path.startsWith('/')) {
            console.warn('检测到不安全的路径:', path);
            return false;
        }

        // 确保路径以预期的前缀开始
        if (!path.startsWith('./files/contests/') && !path.startsWith('./files/problems/')) {
            console.warn('路径不符合预期格式:', path);
            return false;
        }

        return true;
    }

    /**
     * 标准化文件路径
     * @param {string} path - 原始路径
     * @returns {string} 标准化后的路径
     */
    normalizePath(path) {
        if (!path) return '';
        
        // 统一使用正斜杠
        path = path.replace(/\\/g, '/');
        
        // 确保以 ./ 开头
        if (!path.startsWith('./') && !path.startsWith('/')) {
            path = './' + path;
        }
        
        // 移除多余的斜杠
        path = path.replace(/\/+/g, '/');
        
        return path;
    }

    /**
     * 生成文件结构创建脚本
     * @param {string} contestId - 比赛ID (可选)
     * @param {string} problemId - 题目ID (可选)
     * @param {Array} authors - 作者列表 (可选)
     * @returns {string} Shell脚本内容
     */
    generateCreateFoldersScript(contestId = null, problemId = null, authors = []) {
        let script = '#!/bin/bash\n';
        script += '# ACM中转站文件夹结构创建脚本\n';
        script += '# 自动生成 - 请根据需要修改路径\n\n';

        if (contestId) {
            const contestStructure = this.createContestStructure(contestId);
            script += `# 创建比赛文件夹: ${contestId}\n`;
            for (const [type, path] of Object.entries(contestStructure)) {
                const folderPath = path.substring(0, path.lastIndexOf('/'));
                script += `mkdir -p "${folderPath}"\n`;
            }
            script += '\n';
        }

        if (problemId) {
            const problemStructure = this.createProblemStructure(problemId);
            script += `# 创建题目文件夹: ${problemId}\n`;
            
            // 创建题面文件夹
            const statementFolder = problemStructure.statement.substring(0, problemStructure.statement.lastIndexOf('/'));
            script += `mkdir -p "${statementFolder}"\n`;
            
            // 创建官方题解文件夹
            const officialFolder = problemStructure.solutions.official.substring(0, problemStructure.solutions.official.lastIndexOf('/'));
            script += `mkdir -p "${officialFolder}"\n`;
            
            // 创建其他作者文件夹
            for (const author of authors) {
                const authorPath = this.addSolutionAuthor(problemId, author, author);
                const authorFolder = authorPath.substring(0, authorPath.lastIndexOf('/'));
                script += `mkdir -p "${authorFolder}"\n`;
            }
            script += '\n';
        }

        script += 'echo "文件夹结构创建完成！"\n';
        return script;
    }
}

// 导出类供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewFileManager;
}