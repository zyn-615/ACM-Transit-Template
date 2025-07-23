/**
 * ACM中转站 - 简化版题目管理器
 * 专注多人协作，去除复杂统计，使用绿勾/红叉状态
 */

class ProblemManager {
    constructor(storage) {
        this.problems = [];
        this.storage = storage;
        this.eventListeners = new Map();
        this.initialized = false;
        this.allTags = new Set();
        
        // 初始化新文件管理器
        this.fileManager = new NewFileManager();
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化题目管理器
     */
    async initialize() {
        try {
            this.problems = await this.storage.loadProblems();
            this.updateTagsSet();
            this.initialized = true;
            console.log('题目管理器初始化完成，加载了', this.problems.length, '道题目');
            this.emit('initialized', { problemCount: this.problems.length });
        } catch (error) {
            console.error('题目管理器初始化失败:', error);
            this.initialized = false;
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `problem_${timestamp}_${random}`;
    }

    /**
     * 添加题目记录
     */
    addProblem(problemData) {
        try {
            // 验证必要字段
            if (!problemData.title || !problemData.platform) {
                throw new Error('题目标题和平台是必填字段');
            }

            // 检查是否已存在相同题目
            if (this.findProblemByTitleAndPlatform(problemData.title, problemData.platform)) {
                throw new Error(`题目 "${problemData.title}" 在平台 "${problemData.platform}" 上已存在`);
            }

            // 处理标签
            const tags = this.processTags(problemData.tags || []);

            // 创建新题目对象 - 简化版
            const newProblem = {
                id: this.generateId(),
                title: problemData.title.trim(),
                platform: problemData.platform,
                difficulty: problemData.difficulty ? parseInt(problemData.difficulty) : null,
                status: problemData.status || 'unsolved', // unsolved | solved
                tags: tags,
                url: problemData.url?.trim() || '',
                contestId: problemData.contestId?.trim() || '',
                problemIndex: problemData.problemIndex?.trim() || '', // A, B, C, etc.
                
                // 使用相对路径（向后兼容）
                pdfPath: this.normalizeRelativePath(problemData.pdfPath?.trim() || ''),
                solutionPath: this.normalizeRelativePath(problemData.solutionPath?.trim() || ''),
                
                notes: problemData.notes?.trim() || '',
                addedTime: new Date().toISOString(),
                solvedTime: problemData.status === 'solved' ? new Date().toISOString() : null
            };

            // 生成独立的题目文件结构
            const fileStructure = this.fileManager.createProblemStructure(newProblem.id);
            
            // 扩展题目数据结构以支持新文件架构
            newProblem.files = {
                statement: {
                    path: fileStructure.statement,
                    status: 'pending'
                },
                solutions: {
                    official: {
                        path: fileStructure.solutions.official,
                        author: 'official',
                        status: 'pending',
                        uploadTime: null
                    }
                }
            };

            // 验证难度值（如果提供）
            if (newProblem.difficulty && !this.validateDifficulty(newProblem.difficulty)) {
                throw new Error('难度值无效，请输入800-3500之间的有效难度');
            }

            // 添加到题目列表
            this.problems.push(newProblem);
            
            // 更新标签集合
            this.updateTagsSet();
            
            // 保存数据
            this.saveData();
            
            // 显示文件上传指导
            this.showProblemFileGuidance(newProblem.id, fileStructure);
            
            // 触发事件
            this.emit('problemAdded', { problem: newProblem });
            
            console.log('题目添加成功:', newProblem.title);
            return newProblem.id;
            
        } catch (error) {
            console.error('添加题目失败:', error);
            throw error;
        }
    }

    /**
     * 更新题目记录
     */
    updateProblem(id, updates) {
        try {
            const problemIndex = this.problems.findIndex(problem => problem.id === id);
            if (problemIndex === -1) {
                throw new Error('题目记录不存在');
            }

            const originalProblem = { ...this.problems[problemIndex] };
            
            // 验证必要字段
            if (updates.title !== undefined && !updates.title.trim()) {
                throw new Error('题目标题不能为空');
            }
            if (updates.platform !== undefined && !updates.platform.trim()) {
                throw new Error('平台不能为空');
            }

            // 验证难度值
            if (updates.difficulty !== undefined && updates.difficulty !== null && !this.validateDifficulty(updates.difficulty)) {
                throw new Error('难度值无效');
            }

            // 处理标签
            if (updates.tags !== undefined) {
                updates.tags = this.processTags(updates.tags);
            }

            // 处理路径 - 使用相对路径
            if (updates.pdfPath !== undefined) {
                updates.pdfPath = this.normalizeRelativePath(updates.pdfPath);
            }
            if (updates.solutionPath !== undefined) {
                updates.solutionPath = this.normalizeRelativePath(updates.solutionPath);
            }

            // 处理数字字段
            if (updates.difficulty !== undefined && updates.difficulty !== '') {
                updates.difficulty = parseInt(updates.difficulty) || null;
            }

            // 如果状态改为已解决，设置解决时间
            if (updates.status === 'solved' && originalProblem.status !== 'solved') {
                updates.solvedTime = new Date().toISOString();
            } else if (updates.status === 'unsolved') {
                updates.solvedTime = null;
            }

            // 更新题目信息
            this.problems[problemIndex] = {
                ...this.problems[problemIndex],
                ...updates,
                id: originalProblem.id, // 保持ID不变
                addedTime: originalProblem.addedTime, // 保持添加时间不变
                modifiedTime: new Date().toISOString() // 更新修改时间
            };

            // 更新标签集合
            this.updateTagsSet();

            // 保存数据
            this.saveData();

            // 触发事件
            this.emit('problemUpdated', { 
                problem: this.problems[problemIndex], 
                originalProblem: originalProblem 
            });

            console.log('题目更新成功:', this.problems[problemIndex].title);
            return true;

        } catch (error) {
            console.error('更新题目失败:', error);
            throw error;
        }
    }

    /**
     * 删除题目记录
     */
    deleteProblem(id) {
        try {
            const problemIndex = this.problems.findIndex(problem => problem.id === id);
            if (problemIndex === -1) {
                throw new Error('题目记录不存在');
            }

            const deletedProblem = this.problems[problemIndex];
            this.problems.splice(problemIndex, 1);

            // 更新标签集合
            this.updateTagsSet();

            // 保存数据
            this.saveData();

            // 触发事件
            this.emit('problemDeleted', { problem: deletedProblem });

            console.log('题目删除成功:', deletedProblem.title);
            return true;

        } catch (error) {
            console.error('删除题目失败:', error);
            throw error;
        }
    }

    /**
     * 添加题解作者
     * @param {string} problemId - 题目ID
     * @param {string} authorName - 作者姓名 (用作文件夹名)
     * @param {string} displayName - 显示名称
     * @returns {Promise<string>} 新作者的解题路径
     */
    async addSolutionAuthor(problemId, authorName, displayName) {
        try {
            const problem = this.findProblemById(problemId);
            if (!problem) {
                throw new Error('题目不存在');
            }

            // 确保题目有新的文件结构
            if (!problem.files || !problem.files.solutions) {
                throw new Error('题目数据结构不完整，请重新创建题目');
            }

            // 检查作者是否已存在
            const authorKey = this.fileManager.sanitizeAuthorName(authorName);
            if (problem.files.solutions[authorKey]) {
                throw new Error('该作者已存在');
            }

            // 生成新作者的题解路径
            const solutionPath = this.fileManager.addSolutionAuthor(problemId, authorName, displayName);
            
            // 添加到题目数据结构
            problem.files.solutions[authorKey] = {
                path: solutionPath,
                author: displayName || authorName,
                status: 'pending',
                uploadTime: null
            };

            // 更新修改时间
            problem.modifiedTime = new Date().toISOString();

            // 保存数据
            this.saveData();
            
            // 显示上传指导
            const guidance = this.fileManager.generateUploadGuidance(solutionPath, 'pdf');
            this.showSolutionUploadGuidance(guidance, displayName || authorName);
            
            // 触发事件
            this.emit('solutionAuthorAdded', {
                problemId,
                authorKey,
                authorName: displayName || authorName,
                solutionPath,
                problem
            });
            
            console.log(`题解作者添加成功: ${displayName || authorName} -> ${solutionPath}`);
            return solutionPath;
        } catch (error) {
            console.error('添加题解作者失败:', error);
            throw error;
        }
    }

    /**
     * 显示题目文件上传指导界面
     * @param {string} problemId - 题目ID
     * @param {Object} fileStructure - 文件结构对象
     */
    showProblemFileGuidance(problemId, fileStructure) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'problem-file-guidance-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <h3 style="margin: 0 0 20px 0; color: #333; display: flex; align-items: center;">
                    📝 题目文件夹已创建
                </h3>
                <p style="margin: 0 0 20px 0; color: #666;">
                    题目 ID: <strong style="color: #2196f3;">${problemId}</strong>
                </p>
                <div class="file-paths">
                    <h4 style="margin: 0 0 15px 0; color: #333;">请手动复制文件到以下位置:</h4>
                    <div class="path-item" style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #e91e63;">
                        <strong style="color: #333;">题目描述 (problem.pdf):</strong><br>
                        <code style="background: #fff; padding: 5px 8px; border-radius: 3px; font-size: 12px; color: #e91e63; word-break: break-all; display: block; margin-top: 5px;">
                            ${fileStructure.statement}
                        </code>
                        <button onclick="navigator.clipboard.writeText('${fileStructure.statement}')" style="
                            margin-top: 8px;
                            padding: 4px 8px;
                            background: #e91e63;
                            color: white;
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        ">复制路径</button>
                    </div>
                    <div class="path-item" style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #4caf50;">
                        <strong style="color: #333;">官方题解 (solution.pdf):</strong><br>
                        <code style="background: #fff; padding: 5px 8px; border-radius: 3px; font-size: 12px; color: #e91e63; word-break: break-all; display: block; margin-top: 5px;">
                            ${fileStructure.solutions.official}
                        </code>
                        <button onclick="navigator.clipboard.writeText('${fileStructure.solutions.official}')" style="
                            margin-top: 8px;
                            padding: 4px 8px;
                            background: #4caf50;
                            color: white;
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        ">复制路径</button>
                    </div>
                    <div style="padding: 15px; background: #e8f5e8; border-radius: 6px; margin-top: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #2e7d32;">💡 多作者支持:</h5>
                        <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
                            <li>后续可以添加更多作者的题解</li>
                            <li>每个作者都有独立的文件夹</li>
                            <li>在题目详情页点击"添加题解作者"</li>
                        </ul>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        padding: 10px 20px;
                        background: #2196f3;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">了解，关闭指导</button>
                </div>
            </div>
        `;
        
        // 添加到页面并处理点击关闭
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 显示题解上传指导界面
     * @param {Object} guidance - 上传指导信息
     * @param {string} authorName - 作者名称
     */
    showSolutionUploadGuidance(guidance, authorName) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'solution-upload-guidance-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <h3 style="margin: 0 0 20px 0; color: #333; display: flex; align-items: center;">
                    ✨ 题解作者已添加
                </h3>
                <p style="margin: 0 0 20px 0; color: #666;">
                    作者: <strong style="color: #4caf50;">${authorName}</strong>
                </p>
                <div class="guidance-content">
                    <h4 style="margin: 0 0 15px 0; color: #333;">请复制题解文件到:</h4>
                    <div class="path-item" style="padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #4caf50;">
                        <code style="background: #fff; padding: 5px 8px; border-radius: 3px; font-size: 12px; color: #e91e63; word-break: break-all; display: block;">
                            ${guidance.targetPath}
                        </code>
                        <button onclick="navigator.clipboard.writeText('${guidance.targetPath}')" style="
                            margin-top: 8px;
                            padding: 4px 8px;
                            background: #4caf50;
                            color: white;
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        ">复制路径</button>
                    </div>
                    <div style="padding: 15px; background: #e3f2fd; border-radius: 6px; margin-top: 15px;">
                        <h5 style="margin: 0 0 10px 0; color: #1976d2;">📁 创建文件夹命令:</h5>
                        <code style="background: #fff; padding: 8px; border-radius: 3px; font-size: 11px; color: #333; display: block;">
                            ${guidance.createFolderCommand}
                        </code>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        padding: 10px 20px;
                        background: #4caf50;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">明白了</button>
                </div>
            </div>
        `;
        
        // 添加到页面并处理点击关闭
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 扫描题目文件状态
     * @param {string} problemId - 题目ID
     * @returns {Promise<Object>} 文件状态信息
     */
    async scanProblemFiles(problemId) {
        const problem = this.findProblemById(problemId);
        if (!problem || !problem.files) {
            return null;
        }

        // 获取所有作者列表
        const authorList = Object.keys(problem.files.solutions || {});
        return await this.fileManager.scanProblemFiles(problemId, authorList);
    }

    /**
     * 更新题目文件状态
     * @param {string} problemId - 题目ID
     * @param {string} fileType - 文件类型 (statement 或 solution)
     * @param {string} authorKey - 作者键名 (仅当fileType为solution时需要)
     * @param {string} status - 新状态 (pending, uploaded)
     */
    updateProblemFileStatus(problemId, fileType, authorKey, status) {
        const problem = this.findProblemById(problemId);
        if (!problem || !problem.files) return;

        if (fileType === 'statement' && problem.files.statement) {
            problem.files.statement.status = status;
        } else if (fileType === 'solution' && authorKey && problem.files.solutions[authorKey]) {
            problem.files.solutions[authorKey].status = status;
            problem.files.solutions[authorKey].uploadTime = status === 'uploaded' ? new Date().toISOString() : null;
        }

        problem.modifiedTime = new Date().toISOString();
        this.saveData();

        // 触发文件状态更新事件
        this.emit('problemFileStatusUpdated', {
            problemId,
            fileType,
            authorKey,
            status,
            problem
        });
    }

    /**
     * 获取题目的所有作者列表
     * @param {string} problemId - 题目ID
     * @returns {Array} 作者信息列表
     */
    getProblemAuthors(problemId) {
        const problem = this.findProblemById(problemId);
        if (!problem || !problem.files || !problem.files.solutions) {
            return [];
        }

        return Object.entries(problem.files.solutions).map(([key, solution]) => ({
            key,
            author: solution.author,
            path: solution.path,
            status: solution.status,
            uploadTime: solution.uploadTime
        }));
    }

    /**
     * 删除题解作者
     * @param {string} problemId - 题目ID
     * @param {string} authorKey - 作者键名
     * @returns {boolean} 删除是否成功
     */
    removeSolutionAuthor(problemId, authorKey) {
        try {
            const problem = this.findProblemById(problemId);
            if (!problem || !problem.files || !problem.files.solutions) {
                throw new Error('题目不存在或数据结构不完整');
            }

            // 不允许删除官方题解
            if (authorKey === 'official') {
                throw new Error('不能删除官方题解');
            }

            if (!problem.files.solutions[authorKey]) {
                throw new Error('作者不存在');
            }

            // 删除作者
            delete problem.files.solutions[authorKey];
            problem.modifiedTime = new Date().toISOString();
            this.saveData();

            // 触发事件
            this.emit('solutionAuthorRemoved', {
                problemId,
                authorKey,
                problem
            });

            console.log(`题解作者删除成功: ${authorKey}`);
            return true;
        } catch (error) {
            console.error('删除题解作者失败:', error);
            throw error;
        }
    }

    /**
     * 标准化相对路径
     */
    normalizeRelativePath(path) {
        if (!path) return '';
        
        // 移除可能的绝对路径前缀，统一使用相对路径
        path = path.replace(/^.*[\/\\]files[\/\\]/, './files/');
        
        // 确保使用正斜杠（Unix风格，Git友好）
        path = path.replace(/\\/g, '/');
        
        // 确保以./开头
        if (!path.startsWith('./') && !path.startsWith('/')) {
            path = './' + path;
        }
        
        return path;
    }

    /**
     * 根据ID查找题目 - 增强版本，支持多种查找策略
     */
    findProblemById(id) {
        if (!id) return null;
        
        // Strategy 1: Direct ID match
        let problem = this.problems.find(p => p.id === id);
        
        if (!problem) {
            // Strategy 2: Contest-generated pattern match
            // 支持 "contestId-problemLetter" 格式
            problem = this.problems.find(p => {
                if (p.contestId && p.problemIndex) {
                    const generatedId = `${p.contestId}-${p.problemIndex.toLowerCase()}`;
                    return generatedId === id;
                }
                return false;
            });
        }
        
        if (!problem) {
            // Strategy 3: Legacy ID format support
            // 支持遗留的ID格式匹配
            problem = this.problems.find(p => {
                return p.id.includes(id) || id.includes(p.id);
            });
        }
        
        if (!problem) {
            // Strategy 4: Fuzzy match for debugging
            console.warn(`题目ID "${id}" 未找到，可用题目:`, 
                this.problems.map(p => ({ 
                    id: p.id, 
                    title: p.title,
                    contestId: p.contestId,
                    problemIndex: p.problemIndex
                }))
            );
        }
        
        return problem;
    }

    /**
     * 根据标题和平台查找题目
     */
    findProblemByTitleAndPlatform(title, platform) {
        return this.problems.find(problem => 
            problem.title.toLowerCase() === title.toLowerCase() && 
            problem.platform === platform
        );
    }

    /**
     * 获取所有题目
     */
    getAllProblems() {
        return [...this.problems];
    }

    /**
     * 按条件筛选题目
     */
    filterProblems(criteria = {}) {
        return this.problems.filter(problem => {
            // 平台筛选
            if (criteria.platform && problem.platform !== criteria.platform) {
                return false;
            }

            // 状态筛选
            if (criteria.status && problem.status !== criteria.status) {
                return false;
            }

            // 难度范围筛选
            if (criteria.minDifficulty !== undefined || criteria.maxDifficulty !== undefined) {
                const difficulty = problem.difficulty;
                if (difficulty === null || difficulty === undefined) {
                    return false;
                }
                if (criteria.minDifficulty !== undefined && difficulty < criteria.minDifficulty) {
                    return false;
                }
                if (criteria.maxDifficulty !== undefined && difficulty > criteria.maxDifficulty) {
                    return false;
                }
            }

            // 标签筛选
            if (criteria.tags && criteria.tags.length > 0) {
                const problemTags = problem.tags || [];
                if (!criteria.tags.some(tag => problemTags.includes(tag))) {
                    return false;
                }
            }

            // 比赛筛选
            if (criteria.contestId && problem.contestId !== criteria.contestId) {
                return false;
            }

            // 文本搜索（标题、标签、备注）
            if (criteria.search && criteria.search.trim()) {
                const searchText = criteria.search.toLowerCase();
                const searchFields = [
                    problem.title,
                    problem.platform,
                    ...(problem.tags || []),
                    problem.notes || '',
                    problem.problemIndex || ''
                ].join(' ').toLowerCase();
                
                if (!searchFields.includes(searchText)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * 排序题目
     */
    sortProblems(sortBy = 'addedTime', order = 'desc') {
        return [...this.problems].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // 处理日期类型
            if (sortBy === 'addedTime' || sortBy === 'modifiedTime' || sortBy === 'solvedTime') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            // 处理数字类型（难度）
            if (sortBy === 'difficulty') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            }

            // 处理字符串类型
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const result = aValue.localeCompare(bValue, 'zh-CN');
                return order === 'desc' ? -result : result;
            }

            // 处理数字和日期类型
            if (aValue < bValue) return order === 'desc' ? 1 : -1;
            if (aValue > bValue) return order === 'desc' ? -1 : 1;
            return 0;
        });
    }

    /**
     * 获取简化统计信息
     */
    getStatistics() {
        const stats = {
            total: this.problems.length,
            solved: this.problems.filter(p => p.status === 'solved').length,
            byPlatform: {},
            tagStats: {}
        };

        // 按平台统计
        this.problems.forEach(problem => {
            stats.byPlatform[problem.platform] = (stats.byPlatform[problem.platform] || 0) + 1;
            
            // 标签统计
            if (problem.tags) {
                problem.tags.forEach(tag => {
                    stats.tagStats[tag] = (stats.tagStats[tag] || 0) + 1;
                });
            }
        });

        return stats;
    }

    /**
     * 获取所有标签
     */
    getAllTags() {
        return Array.from(this.allTags).sort();
    }

    /**
     * 更新标签集合
     */
    updateTagsSet() {
        this.allTags.clear();
        this.problems.forEach(problem => {
            if (problem.tags) {
                problem.tags.forEach(tag => this.allTags.add(tag));
            }
        });
    }

    /**
     * 处理标签输入
     */
    processTags(tagsInput) {
        if (!tagsInput) return [];
        
        let tags = [];
        if (Array.isArray(tagsInput)) {
            tags = tagsInput;
        } else if (typeof tagsInput === 'string') {
            // 支持多种分隔符
            tags = tagsInput.split(/[,，\s]+/).filter(tag => tag.trim());
        }

        return tags
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0 && tag.length <= 20)
            .slice(0, 10); // 限制最多10个标签
    }

    /**
     * 验证难度值
     */
    validateDifficulty(difficulty) {
        const diff = parseInt(difficulty);
        return !isNaN(diff) && diff >= 800 && diff <= 3500;
    }

    /**
     * 导出题目数据
     */
    async exportProblems(filename) {
        const success = await this.storage.exportProblems(this.problems, filename);
        if (success) {
            this.emit('dataExported', { problemCount: this.problems.length });
        }
        return success;
    }

    /**
     * 保存数据到存储
     */
    saveData() {
        if (!this.initialized) {
            console.warn('题目管理器未初始化，无法保存数据');
            return false;
        }

        const success = this.storage.saveProblems(this.problems);
        if (success) {
            this.emit('dataSaved', { problemCount: this.problems.length });
        }
        return success;
    }

    /**
     * 重新加载数据
     */
    async reloadData() {
        this.problems = await this.storage.loadProblems();
        this.updateTagsSet();
        this.emit('dataReloaded', { problemCount: this.problems.length });
        return this.problems;
    }

    /**
     * 清空所有数据
     */
    clearAllProblems() {
        const problemCount = this.problems.length;
        this.problems = [];
        this.allTags.clear();
        this.saveData();
        this.emit('dataCleared', { problemCount });
        console.log('已清空所有题目记录');
        return true;
    }

    /**
     * 事件监听器管理
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('事件处理器执行失败:', error);
                }
            });
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        this.problems = [];
        this.eventListeners.clear();
        this.allTags.clear();
        this.initialized = false;
    }
}