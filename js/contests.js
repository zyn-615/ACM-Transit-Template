/**
 * ACM中转站 - 简化版比赛管理器  
 * 专注多人协作，去除Rating统计，使用相对路径
 */

class ContestManager {
    constructor(storage) {
        this.contests = [];
        this.storage = storage;
        this.eventListeners = new Map();
        this.initialized = false;
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化比赛管理器
     */
    async initialize() {
        try {
            this.contests = await this.storage.loadContests();
            this.initialized = true;
            console.log('比赛管理器初始化完成，加载了', this.contests.length, '场比赛');
            this.emit('initialized', { contestCount: this.contests.length });
        } catch (error) {
            console.error('比赛管理器初始化失败:', error);
            this.initialized = false;
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `contest_${timestamp}_${random}`;
    }

    /**
     * 添加比赛记录 - 简化版
     */
    addContest(contestData) {
        try {
            // 验证必要字段
            if (!contestData.name || !contestData.date) {
                throw new Error('比赛名称和日期是必填字段');
            }

            // 验证日期格式
            const contestDate = new Date(contestData.date);
            if (isNaN(contestDate.getTime())) {
                throw new Error('无效的日期格式');
            }

            // 检查是否已存在同名比赛
            if (this.findContestByName(contestData.name)) {
                throw new Error(`比赛 "${contestData.name}" 已存在`);
            }

            // 创建新比赛对象 - 简化版
            const newContest = {
                id: this.generateId(),
                name: contestData.name.trim(),
                platform: contestData.platform || '自定义',
                date: contestData.date,
                url: contestData.url?.trim() || '',
                
                // 使用相对路径
                pdfPath: this.normalizeRelativePath(contestData.pdfPath?.trim() || ''),
                summaryPath: this.normalizeRelativePath(contestData.summaryPath?.trim() || ''),
                
                rank: contestData.rank?.trim() || '',
                solved: parseInt(contestData.solved) || 0,
                totalProblems: parseInt(contestData.totalProblems) || 0,
                
                // 简化后的字段
                notes: contestData.notes?.trim() || '',
                addedTime: new Date().toISOString(),
                
                // 比赛题目列表 (A, B, C, ...)
                problems: this.generateProblemsList(parseInt(contestData.totalProblems) || 0)
            };

            // 验证排名格式（如果提供）
            if (newContest.rank && !this.validateRankFormat(newContest.rank)) {
                throw new Error('排名格式不正确，请使用 "排名/总人数" 格式，如: "100/2000"');
            }

            // 添加到比赛列表
            this.contests.push(newContest);
            
            // 保存数据
            this.saveData();
            
            // 触发事件
            this.emit('contestAdded', { contest: newContest });
            
            console.log('比赛添加成功:', newContest.name);
            return newContest.id;
            
        } catch (error) {
            console.error('添加比赛失败:', error);
            throw error;
        }
    }

    /**
     * 生成比赛题目列表
     */
    generateProblemsList(totalProblems) {
        if (totalProblems <= 0) return [];
        
        const problems = [];
        for (let i = 0; i < totalProblems; i++) {
            const letter = String.fromCharCode(65 + i); // A, B, C, ...
            problems.push({
                index: letter,
                title: '',
                status: 'unsolved', // unsolved | solved
                pdfPath: '',
                solutionPath: ''
            });
        }
        return problems;
    }

    /**
     * 更新比赛记录
     */
    updateContest(id, updates) {
        try {
            const contestIndex = this.contests.findIndex(contest => contest.id === id);
            if (contestIndex === -1) {
                throw new Error('比赛记录不存在');
            }

            const originalContest = { ...this.contests[contestIndex] };
            
            // 验证必要字段
            if (updates.name !== undefined && !updates.name.trim()) {
                throw new Error('比赛名称不能为空');
            }
            if (updates.date !== undefined && isNaN(new Date(updates.date).getTime())) {
                throw new Error('无效的日期格式');
            }

            // 验证排名格式
            if (updates.rank !== undefined && updates.rank && !this.validateRankFormat(updates.rank)) {
                throw new Error('排名格式不正确，请使用 "排名/总人数" 格式');
            }

            // 处理路径 - 使用相对路径
            if (updates.pdfPath !== undefined) {
                updates.pdfPath = this.normalizeRelativePath(updates.pdfPath);
            }
            if (updates.summaryPath !== undefined) {
                updates.summaryPath = this.normalizeRelativePath(updates.summaryPath);
            }

            // 处理数字字段
            if (updates.solved !== undefined) {
                updates.solved = parseInt(updates.solved) || 0;
            }
            if (updates.totalProblems !== undefined) {
                const newTotal = parseInt(updates.totalProblems) || 0;
                if (newTotal !== originalContest.totalProblems) {
                    updates.problems = this.generateProblemsList(newTotal);
                }
            }

            // 更新比赛信息
            this.contests[contestIndex] = {
                ...this.contests[contestIndex],
                ...updates,
                id: originalContest.id, // 保持ID不变
                addedTime: originalContest.addedTime, // 保持添加时间不变
                modifiedTime: new Date().toISOString() // 更新修改时间
            };

            // 保存数据
            this.saveData();

            // 触发事件
            this.emit('contestUpdated', { 
                contest: this.contests[contestIndex], 
                originalContest: originalContest 
            });

            console.log('比赛更新成功:', this.contests[contestIndex].name);
            return true;

        } catch (error) {
            console.error('更新比赛失败:', error);
            throw error;
        }
    }

    /**
     * 更新比赛中单个题目的状态
     */
    updateContestProblem(contestId, problemIndex, updates) {
        try {
            const contest = this.findContestById(contestId);
            if (!contest) {
                throw new Error('比赛记录不存在');
            }

            if (!contest.problems || !contest.problems[problemIndex]) {
                throw new Error('题目不存在');
            }

            // 更新题目信息
            contest.problems[problemIndex] = {
                ...contest.problems[problemIndex],
                ...updates
            };

            // 如果有路径，标准化为相对路径
            if (updates.pdfPath !== undefined) {
                contest.problems[problemIndex].pdfPath = this.normalizeRelativePath(updates.pdfPath);
            }
            if (updates.solutionPath !== undefined) {
                contest.problems[problemIndex].solutionPath = this.normalizeRelativePath(updates.solutionPath);
            }

            // 更新比赛的修改时间
            contest.modifiedTime = new Date().toISOString();

            // 重新计算解题数量
            contest.solved = contest.problems.filter(p => p.status === 'solved').length;

            // 保存数据
            this.saveData();

            // 触发事件
            this.emit('contestProblemUpdated', { 
                contest: contest, 
                problemIndex: problemIndex,
                problem: contest.problems[problemIndex]
            });

            return true;

        } catch (error) {
            console.error('更新比赛题目失败:', error);
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
     * 删除比赛记录
     */
    deleteContest(id) {
        try {
            const contestIndex = this.contests.findIndex(contest => contest.id === id);
            if (contestIndex === -1) {
                throw new Error('比赛记录不存在');
            }

            const deletedContest = this.contests[contestIndex];
            this.contests.splice(contestIndex, 1);

            // 保存数据
            this.saveData();

            // 触发事件
            this.emit('contestDeleted', { contest: deletedContest });

            console.log('比赛删除成功:', deletedContest.name);
            return true;

        } catch (error) {
            console.error('删除比赛失败:', error);
            throw error;
        }
    }

    /**
     * 根据ID查找比赛
     */
    findContestById(id) {
        return this.contests.find(contest => contest.id === id);
    }

    /**
     * 根据名称查找比赛
     */
    findContestByName(name) {
        return this.contests.find(contest => 
            contest.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * 获取所有比赛
     */
    getAllContests() {
        return [...this.contests];
    }

    /**
     * 按条件筛选比赛
     */
    filterContests(criteria = {}) {
        return this.contests.filter(contest => {
            // 平台筛选
            if (criteria.platform && contest.platform !== criteria.platform) {
                return false;
            }

            // 时间范围筛选
            if (criteria.dateFrom || criteria.dateTo) {
                const contestDate = new Date(contest.date);
                if (criteria.dateFrom && contestDate < new Date(criteria.dateFrom)) {
                    return false;
                }
                if (criteria.dateTo && contestDate > new Date(criteria.dateTo)) {
                    return false;
                }
            }

            // 文本搜索（名称、平台、备注）
            if (criteria.search && criteria.search.trim()) {
                const searchText = criteria.search.toLowerCase();
                const searchFields = [
                    contest.name,
                    contest.platform,
                    contest.notes || '',
                    contest.rank || ''
                ].join(' ').toLowerCase();
                
                if (!searchFields.includes(searchText)) {
                    return false;
                }
            }

            // 解题数量筛选
            if (criteria.minSolved !== undefined && contest.solved < criteria.minSolved) {
                return false;
            }

            return true;
        });
    }

    /**
     * 排序比赛
     */
    sortContests(sortBy = 'date', order = 'desc') {
        return [...this.contests].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // 处理日期类型
            if (sortBy === 'date' || sortBy === 'addedTime' || sortBy === 'modifiedTime') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // 处理字符串类型（中文支持）
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const result = aValue.localeCompare(bValue, 'zh-CN');
                return order === 'desc' ? -result : result;
            }

            // 处理数字类型
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
            total: this.contests.length,
            byPlatform: {},
            totalSolved: 0,
            recentContests: [],
            monthlyStats: {}
        };

        if (this.contests.length === 0) {
            return stats;
        }

        // 按平台统计
        this.contests.forEach(contest => {
            stats.byPlatform[contest.platform] = (stats.byPlatform[contest.platform] || 0) + 1;
            stats.totalSolved += contest.solved;
        });

        // 最近的比赛（按日期排序，最新5场）
        stats.recentContests = this.sortContests('date', 'desc').slice(0, 5);

        // 按月份统计
        this.contests.forEach(contest => {
            const month = contest.date.substring(0, 7); // YYYY-MM
            stats.monthlyStats[month] = (stats.monthlyStats[month] || 0) + 1;
        });

        return stats;
    }

    /**
     * 生成比赛总结模板
     */
    generateSummaryTemplate(contestId) {
        const contest = this.findContestById(contestId);
        if (!contest) return '';

        const problemsSummary = contest.problems.map(problem => `
### ${problem.index}题 - ${problem.title || '未命名'}
- **状态**: ${problem.status === 'solved' ? '✅ 已解决' : '❌ 未解决'}
- **题目链接**: ${problem.pdfPath || '无'}
- **题解**: ${problem.solutionPath || '无'}
- **解题思路**: 
- **注意事项**: 

`).join('');

        return `# ${contest.name} 比赛总结

## 基本信息
- **比赛时间**: ${contest.date}
- **比赛平台**: ${contest.platform}
- **最终排名**: ${contest.rank || '未记录'}
- **解题数量**: ${contest.solved}/${contest.totalProblems}
- **比赛链接**: ${contest.url || '无'}

## 题目解答情况
${problemsSummary}

## 时间分配
- **总用时**: 
- **各题用时**: 

## 总结反思

### 表现良好的方面
- 

### 需要改进的地方
- 

### 学到的知识点
- 

### 下次比赛目标
- 

## 备注
${contest.notes || '无'}

---
*总结创建时间: ${new Date().toLocaleString('zh-CN')}*
`;
    }

    /**
     * 验证排名格式
     */
    validateRankFormat(rank) {
        const rankPattern = /^\d+\/\d+$/;
        return rankPattern.test(rank.trim());
    }

    /**
     * 导出比赛数据
     */
    async exportContests(filename) {
        const success = await this.storage.exportContests(this.contests, filename);
        if (success) {
            this.emit('dataExported', { contestCount: this.contests.length });
        }
        return success;
    }

    /**
     * 导入比赛数据
     */
    async importContests(data) {
        try {
            if (!data.contests || !Array.isArray(data.contests)) {
                throw new Error('导入数据格式不正确');
            }

            // 验证每个比赛记录
            for (const contest of data.contests) {
                if (!contest.id || !contest.name || !contest.date) {
                    throw new Error('导入的比赛记录缺少必要字段');
                }
            }

            // 合并数据（避免重复）
            let addedCount = 0;
            for (const importContest of data.contests) {
                const exists = this.contests.find(c => 
                    c.id === importContest.id || 
                    (c.name === importContest.name && c.date === importContest.date)
                );
                
                if (!exists) {
                    this.contests.push(importContest);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                this.saveData();
                this.emit('dataImported', { contestCount: addedCount });
            }

            return { success: true, addedCount, totalCount: data.contests.length };

        } catch (error) {
            console.error('导入比赛数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存数据到存储
     */
    saveData() {
        if (!this.initialized) {
            console.warn('比赛管理器未初始化，无法保存数据');
            return false;
        }

        const success = this.storage.saveContests(this.contests);
        if (success) {
            this.emit('dataSaved', { contestCount: this.contests.length });
        }
        return success;
    }

    /**
     * 重新加载数据
     */
    async reloadData() {
        this.contests = await this.storage.loadContests();
        this.emit('dataReloaded', { contestCount: this.contests.length });
        return this.contests;
    }

    /**
     * 清空所有数据
     */
    clearAllContests() {
        const contestCount = this.contests.length;
        this.contests = [];
        this.saveData();
        this.emit('dataCleared', { contestCount });
        console.log('已清空所有比赛记录');
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
        this.contests = [];
        this.eventListeners.clear();
        this.initialized = false;
    }
}