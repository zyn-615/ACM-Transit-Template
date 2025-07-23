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
        this.eventListeners = new Map();
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化仪表板管理器 - 使用Promise.all()防止竞态条件
     */
    async initialize() {
        try {
            console.log('仪表板管理器初始化中...');
            
            // 关键修复：并行加载数据防止竞态条件
            const [contests, problems] = await Promise.all([
                this.storage.loadContests(),
                this.storage.loadProblems()
            ]);
            
            // 验证并设置数据
            this.contests = Array.isArray(contests) ? contests : [];
            this.problems = Array.isArray(problems) ? problems : [];
            
            // 计算统计信息
            this.calculateStatistics();
            
            // 渲染仪表板
            this.renderDashboard();
            
            this.initialized = true;
            console.log('仪表板管理器初始化完成', {
                contests: this.contests.length,
                problems: this.problems.length
            });
            
            this.emit('initialized', { 
                contestCount: this.contests.length,
                problemCount: this.problems.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('仪表板初始化失败:', error);
            this.renderErrorState(error.message);
            this.initialized = false;
        }
    }

    /**
     * 计算统计信息
     */
    calculateStatistics() {
        // 比赛统计
        const contestStats = this.calculateContestStats();
        
        // 题目统计
        const problemStats = this.calculateProblemStats();
        
        // 最近活动
        const recentActivity = this.getRecentActivity();
        
        this.statistics = {
            contests: contestStats,
            problems: problemStats,
            recent: recentActivity,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 计算比赛统计
     */
    calculateContestStats() {
        const totalContests = this.contests.length;
        if (totalContests === 0) {
            return {
                total: 0,
                thisMonth: 0,
                totalSolved: 0,
                averageRank: 'N/A',
                platforms: {}
            };
        }

        // 本月比赛数
        const thisMonth = new Date().toISOString().substring(0, 7);
        const monthlyContests = this.contests.filter(contest => 
            contest.date && contest.date.substring(0, 7) === thisMonth
        ).length;

        // 总解题数
        const totalSolved = this.contests.reduce((sum, contest) => 
            sum + (parseInt(contest.solved) || 0), 0
        );

        // 平台分布
        const platforms = {};
        this.contests.forEach(contest => {
            platforms[contest.platform] = (platforms[contest.platform] || 0) + 1;
        });

        // 平均排名计算
        const rankedContests = this.contests.filter(contest => 
            contest.rank && contest.rank.includes('/')
        );
        
        let averageRank = 'N/A';
        if (rankedContests.length > 0) {
            const avgPercentile = rankedContests.reduce((sum, contest) => {
                try {
                    const [rank, total] = contest.rank.split('/').map(n => parseInt(n));
                    return sum + (rank / total);
                } catch {
                    return sum;
                }
            }, 0) / rankedContests.length;
            
            averageRank = Math.round(avgPercentile * 100) + '%';
        }

        return {
            total: totalContests,
            thisMonth: monthlyContests,
            totalSolved: totalSolved,
            averageRank: averageRank,
            platforms: platforms
        };
    }

    /**
     * 计算题目统计
     */
    calculateProblemStats() {
        const totalProblems = this.problems.length;
        if (totalProblems === 0) {
            return {
                total: 0,
                solved: 0,
                reviewing: 0,
                todo: 0,
                byDifficulty: {},
                byPlatform: {},
                tags: {}
            };
        }

        // 按状态统计
        const byStatus = {
            solved: 0,
            review: 0,
            todo: 0
        };

        // 按难度统计
        const byDifficulty = {};
        
        // 按平台统计  
        const byPlatform = {};
        
        // 标签统计
        const tags = {};

        this.problems.forEach(problem => {
            // 状态统计
            const status = problem.status || 'todo';
            byStatus[status] = (byStatus[status] || 0) + 1;

            // 难度统计
            const difficulty = problem.difficulty || 'unknown';
            byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;

            // 平台统计
            const platform = problem.platform || 'unknown';
            byPlatform[platform] = (byPlatform[platform] || 0) + 1;

            // 标签统计
            if (Array.isArray(problem.tags)) {
                problem.tags.forEach(tag => {
                    tags[tag] = (tags[tag] || 0) + 1;
                });
            }
        });

        return {
            total: totalProblems,
            solved: byStatus.solved || 0,
            reviewing: byStatus.review || 0,
            todo: byStatus.todo || 0,
            byDifficulty: byDifficulty,
            byPlatform: byPlatform,
            tags: tags
        };
    }

    /**
     * 获取最近活动
     */
    getRecentActivity() {
        const recentContests = [...this.contests]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const recentProblems = [...this.problems]
            .sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
            .slice(0, 5);

        return {
            contests: recentContests,
            problems: recentProblems
        };
    }

    /**
     * 渲染仪表板
     */
    renderDashboard() {
        if (!this.statistics) {
            console.warn('统计数据未准备好');
            return;
        }

        try {
            this.renderOverviewCards();
            this.renderRecentActivity();
            this.renderCharts();
        } catch (error) {
            console.error('渲染仪表板失败:', error);
            this.renderErrorState('渲染失败: ' + error.message);
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

    /**
     * 渲染最近活动
     */
    renderRecentActivity() {
        this.renderRecentContests();
        this.renderRecentProblems();
        this.renderPopularTags();
        this.renderPlatformDistribution();
    }

    /**
     * 渲染最近比赛
     */
    renderRecentContests() {
        const container = document.getElementById('recent-contests-list');
        if (!container) return;

        const recentContests = this.statistics.recent.contests;
        if (recentContests.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无比赛记录</p>';
            return;
        }

        container.innerHTML = recentContests.map(contest => `
            <div class="recent-item">
                <div class="recent-title">
                    <a href="contest-detail.html?id=${contest.id}">${this.escapeHtml(contest.name)}</a>
                </div>
                <div class="recent-meta">
                    <span class="tag">${this.escapeHtml(contest.platform)}</span>
                    <span class="date">${this.formatDate(contest.date)}</span>
                    <span class="stats">${contest.solved}/${contest.totalProblems || 0}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染最近题目
     */
    renderRecentProblems() {
        const container = document.getElementById('recent-problems-list');
        if (!container) return;

        const recentProblems = this.statistics.recent.problems;
        if (recentProblems.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无题目记录</p>';
            return;
        }

        container.innerHTML = recentProblems.map(problem => `
            <div class="recent-item">
                <div class="recent-title">
                    <a href="problem-detail.html?id=${problem.id}">${this.escapeHtml(problem.title)}</a>
                </div>
                <div class="recent-meta">
                    <span class="tag">${this.escapeHtml(problem.platform)}</span>
                    <span class="status-${problem.status}">${this.getStatusText(problem.status)}</span>
                    ${problem.difficulty ? `<span class="difficulty">${problem.difficulty}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染热门标签
     */
    renderPopularTags() {
        const container = document.getElementById('popular-tags-list');
        if (!container) return;

        const tags = Object.entries(this.statistics.problems.tags)
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
     * 渲染平台分布
     */
    renderPlatformDistribution() {
        const container = document.getElementById('platform-distribution');
        if (!container) return;

        const platforms = Object.entries(this.statistics.contests.platforms)
            .sort((a, b) => b[1] - a[1]);

        if (platforms.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无数据</p>';
            return;
        }

        container.innerHTML = platforms.map(([platform, count]) => `
            <div class="platform-item">
                <span class="platform-name">${this.escapeHtml(platform)}</span>
                <span class="platform-count">${count} 场</span>
            </div>
        `).join('');
    }

    /**
     * 渲染图表（简化版）
     */
    renderCharts() {
        // 这里可以添加简单的图表渲染
        // 当前保持简单，只显示基础统计
        console.log('图表数据准备完成:', {
            contests: this.statistics.contests,
            problems: this.statistics.problems
        });
    }

    /**
     * 渲染错误状态
     */
    renderErrorState(message) {
        const containers = ['dashboard-overview', 'dashboard-content'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h3>加载失败</h3>
                        <p>${this.escapeHtml(message)}</p>
                        <button onclick="location.reload()" class="btn btn-primary">重新加载</button>
                    </div>
                `;
            }
        });
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