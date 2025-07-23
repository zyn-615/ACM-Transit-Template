/**
 * 文件管理器 - 处理比赛相关文件的查询和显示
 */
class FileManager {
    constructor() {
        this.basePath = './assets/pdfs';
    }
    
    /**
     * 检查文件是否存在
     */
    async fileExists(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    /**
     * 扫描题面文件
     */
    async scanProblemFiles(folderPath) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        const problems = {};
        
        for (const letter of letters) {
            const path = `${folderPath}${letter}.pdf`;
            if (await this.fileExists(path)) {
                problems[letter] = path;
            }
        }
        
        return problems;
    }
    
    /**
     * 扫描题解文件（支持.pdf和.md）
     */
    async scanSolutionFiles(folderPath) {
        const extensions = ['.pdf', '.md'];
        const patterns = [
            'official', 'solution', 'editorial', 'approach', 'analysis',
            'contest-summary', 'contest-editorial', 'writeup'
        ];
        
        const found = [];
        
        // 扫描单个文件
        for (const pattern of patterns) {
            for (const ext of extensions) {
                const fileName = `${pattern}${ext}`;
                const path = `${folderPath}${fileName}`;
                if (await this.fileExists(path)) {
                    found.push({
                        path: path,
                        name: pattern,
                        type: ext.slice(1),
                        displayName: fileName,
                        author: this.extractAuthor(fileName)
                    });
                }
            }
        }
        
        // 扫描带作者名的文件 (pattern-author.ext)
        const authors = ['zhang', 'li', 'wang', 'chen', 'liu', 'admin', 'team'];
        for (const pattern of ['solution', 'editorial', 'writeup']) {
            for (const author of authors) {
                for (const ext of extensions) {
                    const fileName = `${pattern}-${author}${ext}`;
                    const path = `${folderPath}${fileName}`;
                    if (await this.fileExists(path)) {
                        found.push({
                            path: path,
                            name: pattern,
                            type: ext.slice(1),
                            displayName: fileName,
                            author: author
                        });
                    }
                }
            }
        }
        
        return found;
    }
    
    /**
     * 从文件名提取作者信息
     */
    extractAuthor(fileName) {
        const match = fileName.match(/-(\\w+)\\.(pdf|md)$/);
        return match ? match[1] : 'official';
    }
    
    /**
     * 查找比赛相关的所有文件
     */
    async findContestFiles(contestId) {
        const contestPath = `${this.basePath}/${contestId}`;
        
        // 扫描题面PDF
        const problems = await this.scanProblemFiles(`${contestPath}/problems/`);
        
        // 扫描题解文件
        const solutions = {
            byProblem: {},
            contestSummary: []
        };
        
        // 扫描各题目的题解
        const letters = Object.keys(problems);
        for (const letter of letters) {
            const problemSolutions = await this.scanSolutionFiles(`${contestPath}/solutions/${letter}/`);
            if (problemSolutions.length > 0) {
                solutions.byProblem[letter] = problemSolutions;
            }
        }
        
        // 扫描整场比赛的题解
        const contestSolutions = await this.scanSolutionFiles(`${contestPath}/solutions/`);
        solutions.contestSummary = contestSolutions.filter(f => 
            f.name.includes('contest') || f.name.includes('summary') || f.name.includes('editorial')
        );
        
        // 扫描比赛PDF
        const contestPdf = await this.fileExists(`${contestPath}/contest.pdf`) 
            ? `${contestPath}/contest.pdf` : null;
        
        return { 
            problems, 
            solutions, 
            contestPdf,
            contestPath 
        };
    }
    
    /**
     * 生成文件链接HTML
     */
    generateFileLink(file, options = {}) {
        const { showIcon = true, target = '_blank' } = options;
        const icon = this.getFileIcon(file.type);
        const iconHtml = showIcon ? `${icon} ` : '';
        
        if (file.type === 'pdf') {
            // PDF直接在新窗口打开
            return `<a href="${file.path}" target="${target}" class="file-link file-link-${file.type}" title="查看${file.displayName}">${iconHtml}${file.displayName}</a>`;
        } else {
            // Markdown使用文件查看器
            const viewerUrl = `file-viewer.html?file=${encodeURIComponent(file.path)}&name=${encodeURIComponent(file.displayName)}`;
            return `<a href="${viewerUrl}" target="${target}" class="file-link file-link-${file.type}" title="查看${file.displayName}">${iconHtml}${file.displayName}</a>`;
        }
    }
    
    /**
     * 获取文件类型图标
     */
    getFileIcon(type) {
        const icons = {
            'pdf': '📄',
            'md': '📝'
        };
        return icons[type] || '📁';
    }
    
    /**
     * 渲染题目相关文件
     */
    async renderProblemFiles(contestId, problemLetter) {
        const files = await this.findContestFiles(contestId);
        let html = '';
        
        // 题面PDF
        if (files.problems[problemLetter]) {
            const problemFile = {
                path: files.problems[problemLetter],
                type: 'pdf',
                displayName: `${problemLetter}.pdf`,
                name: 'problem'
            };
            html += `<div class="file-section">
                <h4>题面</h4>
                ${this.generateFileLink(problemFile)}
            </div>`;
        }
        
        // 题解文件
        if (files.solutions.byProblem[problemLetter]) {
            html += '<div class="file-section"><h4>题解</h4>';
            files.solutions.byProblem[problemLetter].forEach(solution => {
                html += this.generateFileLink(solution) + '<br>';
            });
            html += '</div>';
        }
        
        return html;
    }
    
    /**
     * 渲染比赛相关文件
     */
    async renderContestFiles(contestId) {
        const files = await this.findContestFiles(contestId);
        let html = '';
        
        // 比赛PDF
        if (files.contestPdf) {
            const contestFile = {
                path: files.contestPdf,
                type: 'pdf',
                displayName: 'contest.pdf',
                name: 'contest'
            };
            html += `<div class="file-section">
                <h4>比赛题面</h4>
                ${this.generateFileLink(contestFile)}
            </div>`;
        }
        
        // 题面列表
        if (Object.keys(files.problems).length > 0) {
            html += '<div class="file-section"><h4>分题题面</h4>';
            Object.entries(files.problems).forEach(([letter, path]) => {
                const problemFile = {
                    path: path,
                    type: 'pdf',
                    displayName: `${letter}.pdf`,
                    name: 'problem'
                };
                html += this.generateFileLink(problemFile) + ' ';
            });
            html += '</div>';
        }
        
        // 整场题解
        if (files.solutions.contestSummary.length > 0) {
            html += '<div class="file-section"><h4>比赛题解</h4>';
            files.solutions.contestSummary.forEach(solution => {
                html += this.generateFileLink(solution) + '<br>';
            });
            html += '</div>';
        }
        
        return html;
    }
}

/**
 * 新版文件管理器 - 支持比赛和题目的独立文件管理
 */
class NewFileManager {
    constructor() {
        this.contestBasePath = './files/contests';
        this.problemBasePath = './files/problems';
    }
    
    // 比赛文件夹创建
    createContestFolders(contestId) {
        const contestPath = `${this.contestBasePath}/${contestId}`;
        return {
            statement: `${contestPath}/statement/`,
            solution: `${contestPath}/solution/`,
            summary: `${contestPath}/summary/`,
            files: {
                statement: `${contestPath}/statement/contest.pdf`,
                solution: `${contestPath}/solution/editorial.pdf`,
                summary: `${contestPath}/summary/review.pdf`
            }
        };
    }
    
    // 题目文件夹创建  
    createProblemFolders(problemId) {
        const problemPath = `${this.problemBasePath}/${problemId}`;
        return {
            statement: `${problemPath}/statement/`,
            solution: `${problemPath}/solution/`,
            files: {
                statement: `${problemPath}/statement/problem.pdf`,
                officialSolution: `${problemPath}/solution/official/solution.pdf`
            }
        };
    }
    
    // 添加题解作者
    addSolutionAuthor(problemId, authorName) {
        const authorFolder = authorName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const solutionPath = `${this.problemBasePath}/${problemId}/solution/${authorFolder}/solution.pdf`;
        return {
            authorFolder: authorFolder,
            filePath: solutionPath
        };
    }
    
    // 检查文件状态
    async checkFileStatus(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok ? 'uploaded' : 'pending';
        } catch {
            return 'pending';
        }
    }
    
    // 创建物理文件夹（通过Shell脚本执行）
    async createPhysicalFolders(contestId, type = 'contest') {
        try {
            let folders;
            if (type === 'contest') {
                folders = this.createContestFolders(contestId);
                // 需要创建三个文件夹
                const pathsToCreate = [
                    folders.statement,
                    folders.solution,
                    folders.summary
                ];
                
                // 这里只是返回需要创建的路径，实际创建需要通过其他方式
                return {
                    success: true,
                    paths: pathsToCreate,
                    files: folders.files
                };
            } else if (type === 'problem') {
                folders = this.createProblemFolders(contestId); // contestId作为problemId使用
                const pathsToCreate = [
                    folders.statement,
                    folders.solution,
                    `${folders.solution}official/`
                ];
                
                return {
                    success: true,
                    paths: pathsToCreate,
                    files: folders.files
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 创建全局实例
window.fileManager = new FileManager();
window.newFileManager = new NewFileManager();