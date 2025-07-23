/**
 * ACM中转站 - 仪表板管理器
 * 解决仪表板数据加载的竞态条件问题
 * 使用Promise.all()并行加载比赛和题目数据，确保统计信息准确显示
 */

class DashboardManager {
    constructor(storage) {
        this.storage = storage;
        this.contests = [];
        this.problems = [];
        this.statistics = null;
        this.initialized = false;
        this.loading = false;
        this.currentRequestId = 0;
        this.eventListeners = new Map();
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化仪表板管理器 - 使用Promise.allSettled()防止竞态条件
     */
    async initialize() {
        if (this.loading) {
            console.log('Dashboard loading in progress, skipping duplicate request');
            return;
        }

        try {
            this.loading = true;
            const requestId = ++this.currentRequestId;
            console.log(`Dashboard initialization started: request ${requestId}`);
            
            // Race condition fix: Use Promise.allSettled
            const [contestsResult, problemsResult] = await Promise.allSettled([
                this.storage.loadContests(),
                this.storage.loadProblems()
            ]);
            
            // Abort if newer request started
            if (requestId !== this.currentRequestId) {
                console.log(`Request ${requestId} superseded, aborting`);
                return;
            }
            
            // Safe data assignment with validation
            this.contests = contestsResult.status === 'fulfilled' && Array.isArray(contestsResult.value) 
                ? contestsResult.value 
                : [];
            this.problems = problemsResult.status === 'fulfilled' && Array.isArray(problemsResult.value) 
                ? problemsResult.value 
                : [];
            
            console.log(`Data loaded: ${this.contests.length} contests, ${this.problems.length} problems`);
            
            // Calculate and render
            this.calculateStatistics();
            this.renderDashboard();
            
            this.initialized = true;
            this.loading = false;
            
            this.emit('initialized', this.statistics);
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.loading = false;
            this.renderErrorState(error.message);
        }
    }

    calculateStatistics() {
        const now = new Date();
        const thisMonth = now.toISOString().substring(0, 7);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 基础统计 - 增强版本
        const totalContests = this.contests.length;
        const totalProblems = this.problems.length;
        const solvedProblems = this.problems.filter(p => p.status === 'solved').length;
        
        // 时间统计 - 增强版本
        const thisMonthContests = this.contests.filter(c => 
            c.date && c.date.substring(0, 7) === thisMonth
        ).length;
        
        const thisWeekSolved = this.problems.filter(p => 
            p.status === 'solved' && 
            p.solvedTime && 
            new Date(p.solvedTime) >= oneWeekAgo
        ).length;

        // 平均难度计算 - 新增
        const solvedWithDifficulty = this.problems.filter(p => 
            p.status === 'solved' && p.difficulty && !isNaN(p.difficulty)
        );
        const averageDifficulty = solvedWithDifficulty.length > 0
            ? Math.round(solvedWithDifficulty.reduce((sum, p) => sum + Number(p.difficulty), 0) / solvedWithDifficulty.length)
            : 0;

        // 平均排名计算 - 新增
        const rankedContests = this.contests.filter(c => 
            c.finalRank && c.finalRank.includes('/')
        );
        let averageRank = 'N/A';
        if (rankedContests.length > 0) {
            const avgPercentile = rankedContests.reduce((sum, c) => {
                try {
                    const [rank, total] = c.finalRank.split('/').map(n => parseInt(n));
                    return sum + (rank / total);
                } catch {
                    return sum;
                }
            }, 0) / rankedContests.length;
            averageRank = Math.round(avgPercentile * 100) + '%';
        }

        // 统计数据结构 - 完整版本
        this.statistics = {
            // 基础统计
            totalContests,
            totalProblems,
            solvedProblems,
            solveRate: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0,
            
            // 时间统计
            thisMonthContests,
            thisWeekSolved,
            averageDifficulty,
            averageRank,
            
            // 最近活动
            recentContests: this.getRecentContests(),
            recentProblems: this.getRecentProblems(),
            
            // 平台分布
            contestPlatforms: this.getContestPlatformStats(),
            problemTags: this.getProblemTagStats(),
            
            // 元数据
            lastUpdated: new Date().toISOString()
        };

        console.log('统计数据计算完成:', this.statistics);
    }

    // 新增：获取比赛平台统计
    getContestPlatformStats() {
        const platforms = {};
        this.contests.forEach(contest => {
            const platform = contest.platform || 'Unknown';
            platforms[platform] = (platforms[platform] || 0) + 1;
        });
        return platforms;
    }

    // 新增：获取题目标签统计
    getProblemTagStats() {
        const tags = {};
        this.problems.forEach(problem => {
            if (problem.tags && Array.isArray(problem.tags)) {
                problem.tags.forEach(tag => {
                    tags[tag] = (tags[tag] || 0) + 1;
                });
            }
        });
        return tags;
    }

    getRecentContests() {
        return [...this.contests]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }

    getRecentProblems() {
        return [...this.problems]
            .sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
            .slice(0, 5);
    }

    /**
     * 刷新数据
     */
    async refreshData() {
        try {
            console.log('刷新仪表板数据...');
            this.initialized = false;
            await this.initialize();
            this.emit('dataRefreshed', { timestamp: new Date().toISOString() });
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.renderErrorState('刷新失败: ' + error.message);
        }
    }

    renderDashboard() {
        if (!this.statistics) {
            console.warn('统计数据未准备好');
            return;
        }
        
        try {
            // 更新基础统计卡片
            this.updateElement('total-contests', this.statistics.totalContests);
            this.updateElement('total-problems', this.statistics.totalProblems);
            this.updateElement('solved-problems', this.statistics.solvedProblems);
            this.updateElement('solve-rate', `解决率 ${this.statistics.solveRate}%`);
            
            // 更新活动统计
            this.updateElement('this-month-contests', this.statistics.thisMonthContests);
            this.updateElement('this-week-solved', this.statistics.thisWeekSolved);
            this.updateElement('average-difficulty', this.statistics.averageDifficulty || '-');
            this.updateElement('average-rank', this.statistics.averageRank);
            
            // 渲染最近活动
            this.renderRecentActivities();
            this.renderPlatformDistribution();
            this.renderPopularTags();
            
            console.log('仪表盘渲染完成');
        } catch (error) {
            console.error('渲染仪表盘失败:', error);
            this.renderErrorState('渲染失败: ' + error.message);
        }
    }

    // 安全更新DOM元素 - 增强版本
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`更新元素 ${id}: ${value}`);
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }

    /**
     * 渲染概览卡片
     */
    renderOverviewCards() {
        const containers = [
            { id: 'total-contests', value: this.statistics.contests.total },
            { id: 'total-problems', value: this.statistics.problems.total },
            { id: 'solved-problems', value: this.statistics.problems.solved },
            { id: 'monthly-contests', value: this.statistics.contests.thisMonth }
        ];

        containers.forEach(container => {
            const element = document.getElementById(container.id);
            if (element) {
                element.textContent = container.value;
            }
        });

        // 平均排名
        const avgRankElement = document.getElementById('average-rank');
        if (avgRankElement) {
            avgRankElement.textContent = this.statistics.contests.averageRank;
        }
    }

    renderRecentActivities() {
        this.renderRecentContests();
        this.renderRecentProblems();
    }

    renderRecentContests() {
        const container = document.getElementById('recent-contests');
        if (!container) {
            console.warn('Recent contests container not found');
            return;
        }

        const recentContests = this.statistics.recentContests || [];
        if (recentContests.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 p-4">
                    <p>暂无比赛记录</p>
                    <a href="contests.html" class="btn btn-primary btn-sm mt-2">添加第一场比赛</a>
                </div>
            `;
            return;
        }

        container.innerHTML = recentContests.map(contest => `
            <div class="recent-item p-3 border-b border-gray-200 last:border-b-0">
                <div class="recent-title">
                    <a href="contest-detail.html?id=${contest.id}" class="font-medium text-blue-600 hover:text-blue-800">
                        ${this.escapeHtml(contest.name)}
                    </a>
                </div>
                <div class="recent-meta text-sm text-gray-500 mt-1">
                    <span class="tag">${this.escapeHtml(contest.platform)}</span>
                    <span class="date">${this.formatDate(contest.date)}</span>
                    <span class="stats">${contest.solved || 0}/${contest.totalProblems || 0}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentProblems() {
        const container = document.getElementById('recent-problems');
        if (!container) {
            console.warn('Recent problems container not found');
            return;
        }

        const recentProblems = this.statistics.recentProblems || [];
        if (recentProblems.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 p-4">
                    <p>暂无题目记录</p>
                    <a href="problems.html" class="btn btn-success btn-sm mt-2">添加第一道题目</a>
                </div>
            `;
            return;
        }

        container.innerHTML = recentProblems.map(problem => `
            <div class="recent-item p-3 border-b border-gray-200 last:border-b-0">
                <div class="recent-title">
                    <a href="problem-detail.html?id=${problem.id}" class="font-medium text-blue-600 hover:text-blue-800">
                        ${this.escapeHtml(problem.title)}
                    </a>
                </div>
                <div class="recent-meta text-sm text-gray-500 mt-1">
                    <span class="tag bg-gray-200 px-2 py-1 rounded text-xs">${this.escapeHtml(problem.platform)}</span>
                    <span class="status-badge status-${problem.status} ml-2">${this.getStatusText(problem.status)}</span>
                    ${problem.difficulty ? `<span class="difficulty ml-2">难度: ${problem.difficulty}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染热门标签 - 更新版本
     */
    renderPopularTags() {
        const container = document.getElementById('popular-tags-list');
        if (!container) return;

        const tags = Object.entries(this.statistics.problemTags || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (tags.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无标签</p>';
            return;
        }

        container.innerHTML = tags.map(([tag, count]) => `
            <span class="tag-item">
                ${this.escapeHtml(tag)} <span class="tag-count">${count}</span>
            </span>
        `).join('');
    }

    /**
     * 渲染平台分布 - 更新版本
     */
    renderPlatformDistribution() {
        const container = document.getElementById('platform-distribution');
        if (!container) return;

        const platforms = Object.entries(this.statistics.contestPlatforms || {})
            .sort((a, b) => b[1] - a[1]);

        if (platforms.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无数据</p>';
            return;
        }

        container.innerHTML = platforms.map(([platform, count]) => `
            <div class="platform-item flex justify-between items-center py-2">
                <span class="platform-name font-medium">${this.escapeHtml(platform)}</span>
                <span class="platform-count text-gray-600">${count} 场</span>
            </div>
        `).join('');
    }

    renderErrorState(message) {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="error-state">
                    <h3>⚠️ 数据加载失败</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">重新加载</button>
                </div>
            `;
        }
    }

    /**
     * 获取统计数据
     */
    getStatistics() {
        return this.statistics;
    }

    /**
     * 工具方法
     */
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

    getStatusText(status) {
        const statusMap = {
            solved: '已解决',
            review: '复习中', 
            todo: '待解决',
            unattempted: '未尝试'
        };
        return statusMap[status] || status;
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
        this.contests = [];
        this.problems = [];
        this.statistics = null;
        this.eventListeners.clear();
        this.initialized = false;
        console.log('仪表板管理器已清理');
    }
}