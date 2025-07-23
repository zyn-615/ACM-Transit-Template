/**
 * ACM中转站 - 比赛详情管理器
 * 处理单个比赛的详情页面，支持罚时记录和题目状态管理
 * 提供简单的手动编辑功能，类似xcpcio.com的比赛面板
 */

class ContestDetailManager {
    constructor(storage) {
        this.storage = storage;
        this.contestId = null;
        this.contest = null;
        this.problems = [];
        this.contestRecord = null;
        this.eventListeners = new Map();
        this.initialized = false;
    }

    /**
     * 初始化比赛详情管理器
     */
    async initialize(contestId) {
        try {
            if (!contestId) {
                throw new Error('比赛ID不能为空');
            }

            this.contestId = contestId;
            console.log('初始化比赛详情页面，比赛ID:', contestId);

            // 加载比赛数据
            await this.loadContestData();
            
            // 加载相关题目
            await this.loadRelatedProblems();
            
            // 初始化比赛记录
            this.initializeContestRecord();
            
            // 渲染页面
            this.renderContestDetail();
            
            this.initialized = true;
            console.log('比赛详情管理器初始化完成');
            this.emit('initialized', { contestId: this.contestId });

        } catch (error) {
            console.error('比赛详情初始化失败:', error);
            this.renderError(error.message);
            throw error;
        }
    }

    /**
     * 加载比赛数据
     */
    async loadContestData() {
        try {
            const contests = await this.storage.loadContests();
            this.contest = contests.find(c => c.id === this.contestId);
            
            if (!this.contest) {
                throw new Error('找不到指定的比赛记录');
            }

            console.log('成功加载比赛数据:', this.contest.name);

        } catch (error) {
            console.error('加载比赛数据失败:', error);
            throw new Error('加载比赛数据失败: ' + error.message);
        }
    }

    /**
     * 加载相关题目
     */
    async loadRelatedProblems() {
        try {
            const allProblems = await this.storage.loadProblems();
            
            // 查找与比赛相关的题目
            this.problems = allProblems.filter(problem => 
                problem.contestId === this.contestId || 
                (this.contest.generatedProblems && this.contest.generatedProblems.includes(problem.id))
            );

            // 按题目字母排序
            this.problems.sort((a, b) => {
                const letterA = a.problemLetter || 'Z';
                const letterB = b.problemLetter || 'Z';
                return letterA.localeCompare(letterB);
            });

            console.log(`加载了 ${this.problems.length} 道相关题目`);

        } catch (error) {
            console.error('加载相关题目失败:', error);
            this.problems = [];
        }
    }

    /**
     * 初始化比赛记录
     */
    initializeContestRecord() {
        // 如果比赛已有记录，使用现有记录；否则创建默认记录
        this.contestRecord = this.contest.contestRecord || this.createDefaultRecord();
        
        // 确保所有题目都有记录
        this.problems.forEach(problem => {
            const letter = problem.problemLetter;
            if (letter && !this.contestRecord.problemResults[letter]) {
                this.contestRecord.problemResults[letter] = {
                    status: 'UNATTEMPTED',
                    attempts: 0,
                    acTime: null,
                    penalty: 0,
                    notes: ''
                };
            }
        });
    }

    /**
     * 创建默认比赛记录
     */
    createDefaultRecord() {
        return {
            problemResults: {},
            totalPenalty: 0,
            solvedCount: 0,
            finalRank: this.contest.rank || '',
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 渲染比赛详情页面
     */
    renderContestDetail() {
        try {
            this.renderContestInfo();
            this.renderProblemBoard();
            this.renderStatsSummary();
            
        } catch (error) {
            console.error('渲染比赛详情失败:', error);
            this.renderError('渲染页面失败: ' + error.message);
        }
    }

    /**
     * 渲染比赛基本信息
     */
    renderContestInfo() {
        const infoContainer = document.getElementById('contest-info');
        if (!infoContainer) return;

        const totalPenalty = this.calculateTotalPenalty();
        const solvedCount = this.calculateSolvedCount();

        infoContainer.innerHTML = `
            <div class="contest-header">
                <h1 class="contest-title">${this.escapeHtml(this.contest.name)}</h1>
                <div class="contest-meta">
                    <span class="contest-platform">${this.escapeHtml(this.contest.platform)}</span>
                    <span class="contest-date">${this.formatDate(this.contest.date)}</span>
                    ${this.contest.url ? `<a href="${this.contest.url}" target="_blank" class="contest-link">比赛链接</a>` : ''}
                </div>
            </div>
            <div class="contest-stats">
                <div class="stat-item">
                    <div class="stat-value">${this.contestRecord.finalRank || this.contest.rank || 'N/A'}</div>
                    <div class="stat-label">最终排名</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${solvedCount}/${this.problems.length}</div>
                    <div class="stat-label">解题数量</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalPenalty}</div>
                    <div class="stat-label">总罚时(分钟)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.problems.length}</div>
                    <div class="stat-label">题目总数</div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染题目面板
     */
    renderProblemBoard() {
        const boardContainer = document.getElementById('problems-board');
        if (!boardContainer) return;

        if (this.problems.length === 0) {
            boardContainer.innerHTML = `
                <div class="empty-board">
                    <p>此比赛暂无关联题目</p>
                    <a href="contests.html" class="btn btn-primary">返回比赛列表</a>
                </div>
            `;
            return;
        }

        const problemCards = this.problems.map(problem => {
            const letter = problem.problemLetter || '?';
            const record = this.contestRecord.problemResults[letter] || {
                status: 'UNATTEMPTED',
                attempts: 0,
                acTime: null,
                penalty: 0
            };

            return `
                <div class="problem-card status-${record.status.toLowerCase()}" data-problem-letter="${letter}">
                    <div class="problem-header">
                        <div class="problem-letter">${letter}</div>
                        <div class="problem-status">${this.getStatusText(record.status)}</div>
                    </div>
                    <div class="problem-title">
                        ${problem.url ? 
                            `<a href="${problem.url}" target="_blank">${this.escapeHtml(problem.title)}</a>` :
                            this.escapeHtml(problem.title)
                        }
                    </div>
                    <div class="problem-stats">
                        <div class="stat-row">
                            <span>通过时间:</span>
                            <span>${record.acTime ? record.acTime + '分钟' : '未通过'}</span>
                        </div>
                        <div class="stat-row">
                            <span>尝试次数:</span>
                            <span>${record.attempts}</span>
                        </div>
                        <div class="stat-row">
                            <span>罚时:</span>
                            <span>${record.penalty}分钟</span>
                        </div>
                    </div>
                    <div class="problem-actions">
                        <button class="btn btn-sm btn-primary" onclick="editProblemRecord('${letter}')">编辑</button>
                        ${problem.url ? `<a href="${problem.url}" target="_blank" class="btn btn-sm btn-outline">题目</a>` : ''}
                    </div>
                    ${record.notes ? `<div class="problem-notes">${this.escapeHtml(record.notes)}</div>` : ''}
                </div>
            `;
        }).join('');

        boardContainer.innerHTML = `
            <div class="board-header">
                <h3>题目详情</h3>
                <div class="board-actions">
                    <button class="btn btn-outline btn-sm" onclick="refreshContestData()">刷新数据</button>
                    <button class="btn btn-secondary btn-sm" onclick="exportContestRecord()">导出记录</button>
                </div>
            </div>
            <div class="problems-grid">
                ${problemCards}
            </div>
        `;
    }

    /**
     * 渲染统计摘要
     */
    renderStatsSummary() {
        const summaryContainer = document.getElementById('contest-summary');
        if (!summaryContainer) return;

        const statusCounts = this.getStatusCounts();
        
        summaryContainer.innerHTML = `
            <div class="summary-section">
                <h4>题目状态统计</h4>
                <div class="status-stats">
                    <div class="status-item">
                        <span class="status-indicator status-ac"></span>
                        <span>已通过: ${statusCounts.AC}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-indicator status-wa"></span>
                        <span>未通过: ${statusCounts.WA}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-indicator status-unattempted"></span>
                        <span>未尝试: ${statusCounts.UNATTEMPTED}</span>
                    </div>
                </div>
            </div>
            <div class="summary-section">
                <h4>时间分析</h4>
                <div class="time-analysis">
                    <p>平均解题时间: ${this.calculateAverageTime()}分钟</p>
                    <p>最快解题: ${this.getFastestSolve()}分钟</p>
                    <p>最慢解题: ${this.getSlowestSolve()}分钟</p>
                </div>
            </div>
            ${this.contest.notes ? `
            <div class="summary-section">
                <h4>比赛备注</h4>
                <div class="contest-notes">${this.escapeHtml(this.contest.notes).replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
        `;
    }

    /**
     * 更新题目记录
     */
    async updateProblemRecord(letter, updates) {
        try {
            if (!this.contestRecord.problemResults[letter]) {
                this.contestRecord.problemResults[letter] = {
                    status: 'UNATTEMPTED',
                    attempts: 0,
                    acTime: null,
                    penalty: 0,
                    notes: ''
                };
            }

            // 更新记录
            Object.assign(this.contestRecord.problemResults[letter], updates);
            
            // 重新计算统计数据
            this.recalculateStats();
            
            // 保存到比赛记录
            await this.saveContestRecord();
            
            // 重新渲染
            this.renderContestDetail();
            
            this.emit('problemRecordUpdated', { letter, updates });
            console.log(`题目 ${letter} 记录已更新`);

        } catch (error) {
            console.error('更新题目记录失败:', error);
            throw error;
        }
    }

    /**
     * 重新计算统计数据
     */
    recalculateStats() {
        this.contestRecord.totalPenalty = this.calculateTotalPenalty();
        this.contestRecord.solvedCount = this.calculateSolvedCount();
        this.contestRecord.lastUpdated = new Date().toISOString();
    }

    /**
     * 保存比赛记录
     */
    async saveContestRecord() {
        try {
            // 更新比赛对象的contestRecord字段
            const contests = await this.storage.loadContests();
            const contestIndex = contests.findIndex(c => c.id === this.contestId);
            
            if (contestIndex === -1) {
                throw new Error('找不到比赛记录');
            }

            contests[contestIndex].contestRecord = this.contestRecord;
            
            // 保存到存储
            const success = this.storage.saveContests(contests);
            if (!success) {
                throw new Error('保存到本地存储失败');
            }

            console.log('比赛记录已保存');

        } catch (error) {
            console.error('保存比赛记录失败:', error);
            throw error;
        }
    }

    /**
     * 刷新数据
     */
    async refreshData() {
        try {
            console.log('刷新比赛详情数据...');
            await this.loadContestData();
            await this.loadRelatedProblems();
            this.initializeContestRecord();
            this.renderContestDetail();
            
            this.emit('dataRefreshed', { contestId: this.contestId });

        } catch (error) {
            console.error('刷新数据失败:', error);
            throw error;
        }
    }

    /**
     * 计算总罚时
     */
    calculateTotalPenalty() {
        return Object.values(this.contestRecord.problemResults).reduce((total, result) => 
            total + (result.penalty || 0), 0
        );
    }

    /**
     * 计算已解决题目数量
     */
    calculateSolvedCount() {
        return Object.values(this.contestRecord.problemResults).filter(result => 
            result.status === 'AC'
        ).length;
    }

    /**
     * 获取状态统计
     */
    getStatusCounts() {
        const counts = { AC: 0, WA: 0, UNATTEMPTED: 0 };
        Object.values(this.contestRecord.problemResults).forEach(result => {
            counts[result.status] = (counts[result.status] || 0) + 1;
        });
        return counts;
    }

    /**
     * 计算平均解题时间
     */
    calculateAverageTime() {
        const solvedProblems = Object.values(this.contestRecord.problemResults)
            .filter(result => result.status === 'AC' && result.acTime);
        
        if (solvedProblems.length === 0) return 'N/A';
        
        const totalTime = solvedProblems.reduce((sum, result) => sum + result.acTime, 0);
        return Math.round(totalTime / solvedProblems.length);
    }

    /**
     * 获取最快解题时间
     */
    getFastestSolve() {
        const solvedTimes = Object.values(this.contestRecord.problemResults)
            .filter(result => result.status === 'AC' && result.acTime)
            .map(result => result.acTime);
        
        return solvedTimes.length > 0 ? Math.min(...solvedTimes) : 'N/A';
    }

    /**
     * 获取最慢解题时间
     */
    getSlowestSolve() {
        const solvedTimes = Object.values(this.contestRecord.problemResults)
            .filter(result => result.status === 'AC' && result.acTime)
            .map(result => result.acTime);
        
        return solvedTimes.length > 0 ? Math.max(...solvedTimes) : 'N/A';
    }

    /**
     * 渲染错误状态
     */
    renderError(message) {
        const containers = ['contest-info', 'problems-board', 'contest-summary'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h3>加载失败</h3>
                        <p>${this.escapeHtml(message)}</p>
                        <div class="error-actions">
                            <button onclick="location.reload()" class="btn btn-primary">重新加载</button>
                            <a href="contests.html" class="btn btn-outline">返回比赛列表</a>
                        </div>
                    </div>
                `;
            }
        });
    }

    /**
     * 工具方法
     */
    getStatusText(status) {
        const statusMap = {
            'AC': '通过',
            'WA': '未通过',
            'UNATTEMPTED': '未尝试'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('zh-CN');
        } catch {
            return dateString || 'N/A';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 事件系统
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
        this.contestId = null;
        this.contest = null;
        this.problems = [];
        this.contestRecord = null;
        this.eventListeners.clear();
        this.initialized = false;
        console.log('ContestDetailManager已清理');
    }
}