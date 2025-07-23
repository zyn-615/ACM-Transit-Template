/**
 * ACM中转站 - ICPC风格比赛面板渲染器
 * 实现水平团队布局和彩色题目状态显示
 */

class ICPCBoardRenderer {
    constructor(contestData, contestRecord) {
        this.contestData = contestData;
        this.contestRecord = contestRecord || { problemResults: {} };
        this.problems = this.getContestProblems();
        this.boardData = this.calculateBoardData();
        this.initialized = false;
    }

    /**
     * 获取比赛题目列表
     */
    getContestProblems() {
        // 如果比赛有关联的题目，获取题目列表
        if (this.contestData.problems && Array.isArray(this.contestData.problems)) {
            return this.contestData.problems.map((problemId, index) => ({
                id: problemId,
                letter: String.fromCharCode(65 + index), // A, B, C, ...
                index: index
            }));
        }
        
        // 否则根据totalProblems生成默认题目
        const totalProblems = this.contestData.totalProblems || 5;
        const problems = [];
        for (let i = 0; i < totalProblems; i++) {
            problems.push({
                id: `${this.contestData.id}-${String.fromCharCode(97 + i)}`, // contest1-a, contest1-b, ...
                letter: String.fromCharCode(65 + i), // A, B, C, ...
                index: i
            });
        }
        return problems;
    }

    /**
     * 计算面板数据
     */
    calculateBoardData() {
        const problemStatus = {};
        let solvedCount = 0;
        let totalPenalty = 0;

        // 为每个题目计算状态
        this.problems.forEach(problem => {
            const result = this.contestRecord.problemResults?.[problem.letter] || {
                status: 'UNATTEMPTED',
                attempts: 0,
                acTime: null,
                penalty: 0
            };

            problemStatus[problem.letter] = {
                letter: problem.letter,
                status: result.status,
                attempts: result.attempts || 0,
                acTime: result.acTime,
                penalty: result.penalty || 0,
                score: result.score,
                title: this.getProblemStatusTitle(result)
            };

            if (result.status === 'AC') {
                solvedCount++;
                totalPenalty += (result.acTime || 0) + (result.penalty || 0);
            }
        });

        return {
            contestName: this.contestData.name || '未命名比赛',
            platform: this.contestData.platform || '未知平台',
            date: this.contestData.date,
            rank: this.contestData.finalRank || this.contestData.rank || 'N/A',
            solvedCount: solvedCount,
            totalProblems: this.problems.length,
            totalPenalty: totalPenalty,
            problemStatus: problemStatus
        };
    }

    /**
     * 获取题目状态的提示文本
     */
    getProblemStatusTitle(result) {
        switch (result.status) {
            case 'AC':
                return `通过 (${result.acTime || 0}分钟, ${result.attempts || 1}次尝试)`;
            case 'WA':
                return `答案错误 (${result.attempts || 0}次尝试)`;
            case 'TLE':
                return `超时 (${result.attempts || 0}次尝试)`;
            case 'PARTIAL':
                return `部分分 (${result.score || 0}分, ${result.attempts || 0}次尝试)`;
            default:
                return '未尝试';
        }
    }

    /**
     * 渲染ICPC风格的比赛面板
     */
    renderBoard() {
        return `
            <div class="icpc-board">
                ${this.renderBoardHeader()}
                ${this.renderBoardBody()}
                ${this.renderLegend()}
            </div>
        `;
    }

    /**
     * 渲染面板头部
     */
    renderBoardHeader() {
        return `
            <div class="icpc-board-header">
                <div class="contest-info">
                    <h2 class="contest-name">${this.escapeHtml(this.boardData.contestName)}</h2>
                    <div class="contest-meta">
                        <span class="platform">${this.escapeHtml(this.boardData.platform)}</span>
                        <span class="date">${this.formatDate(this.boardData.date)}</span>
                    </div>
                </div>
                <div class="rank-info">
                    <div class="rank-display">排名: ${this.boardData.rank}</div>
                    <div class="solve-info">${this.boardData.solvedCount}/${this.boardData.totalProblems}</div>
                    <div class="penalty-info">总时间: ${this.boardData.totalPenalty}分钟</div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染面板主体
     */
    renderBoardBody() {
        return `
            <div class="icpc-board-body">
                <div class="team-row">
                    <div class="team-info">
                        <div class="team-rank">${this.boardData.rank}</div>
                        <div class="team-name">我的表现</div>
                        <div class="team-stats">
                            <span class="solved">${this.boardData.solvedCount}</span>
                            <span class="penalty">${this.boardData.totalPenalty}</span>
                        </div>
                    </div>
                    <div class="problems-row">
                        ${this.renderProblemsRow()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染题目行
     */
    renderProblemsRow() {
        return this.problems.map(problem => {
            const status = this.boardData.problemStatus[problem.letter];
            const statusClass = this.getStatusClass(status.status);
            const cellContent = this.getCellContent(status);
            
            return `
                <div class="problem-cell ${statusClass}" 
                     title="${status.title}"
                     data-letter="${status.letter}"
                     onclick="editProblemStatus('${status.letter}')">
                    <div class="problem-letter">${status.letter}</div>
                    <div class="problem-info">${cellContent}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * 获取状态样式类
     */
    getStatusClass(status) {
        const classMap = {
            'AC': 'status-ac',
            'WA': 'status-wa', 
            'TLE': 'status-tle',
            'PARTIAL': 'status-partial',
            'UNATTEMPTED': 'status-unattempted'
        };
        return classMap[status] || 'status-unattempted';
    }

    /**
     * 获取单元格内容
     */
    getCellContent(status) {
        switch (status.status) {
            case 'AC':
                return `
                    <div class="ac-time">${status.acTime || 0}</div>
                    ${status.attempts > 1 ? `<div class="attempts">-${status.attempts - 1}</div>` : ''}
                `;
            case 'WA':
            case 'TLE':
                return `<div class="attempts">-${status.attempts || 0}</div>`;
            case 'PARTIAL':
                return `
                    <div class="partial-score">${status.score || 0}</div>
                    <div class="attempts">-${status.attempts || 0}</div>
                `;
            default:
                return '<div class="no-attempt">-</div>';
        }
    }

    /**
     * 渲染图例说明
     */
    renderLegend() {
        return `
            <div class="icpc-legend">
                <h4 class="legend-title">状态说明</h4>
                <div class="legend-items">
                    <div class="legend-item">
                        <div class="legend-color status-ac"></div>
                        <span>AC - 已通过</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color status-wa"></div>
                        <span>WA - 答案错误</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color status-tle"></div>
                        <span>TLE - 超时</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color status-partial"></div>
                        <span>PARTIAL - 部分分</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color status-unattempted"></div>
                        <span>UNATTEMPTED - 未尝试</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染到容器
     */
    renderToContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return false;
        }

        try {
            container.innerHTML = this.renderBoard();
            this.initialized = true;
            console.log('ICPC board rendered successfully');
            return true;
        } catch (error) {
            console.error('Failed to render ICPC board:', error);
            container.innerHTML = `
                <div class="error-state">
                    <h3>⚠️ 比赛面板加载失败</h3>
                    <p>${this.escapeHtml(error.message)}</p>
                    <button onclick="location.reload()" class="btn btn-primary">重新加载</button>
                </div>
            `;
            return false;
        }
    }

    /**
     * 更新比赛记录
     */
    updateContestRecord(contestRecord) {
        this.contestRecord = contestRecord || { problemResults: {} };
        this.boardData = this.calculateBoardData();
        
        if (this.initialized) {
            // 重新渲染面板
            const container = document.querySelector('.icpc-board');
            if (container && container.parentElement) {
                container.parentElement.innerHTML = this.renderBoard();
            }
        }
    }

    /**
     * 更新单个题目状态
     */
    updateProblemStatus(problemLetter, statusData) {
        if (!this.contestRecord.problemResults) {
            this.contestRecord.problemResults = {};
        }
        
        this.contestRecord.problemResults[problemLetter] = {
            ...this.contestRecord.problemResults[problemLetter],
            ...statusData
        };
        
        // 重新计算面板数据
        this.boardData = this.calculateBoardData();
        
        // 更新对应的单元格
        const problemCell = document.querySelector(`[data-letter="${problemLetter}"]`);
        if (problemCell) {
            const status = this.boardData.problemStatus[problemLetter];
            problemCell.className = `problem-cell ${this.getStatusClass(status.status)}`;
            problemCell.title = status.title;
            problemCell.querySelector('.problem-info').innerHTML = this.getCellContent(status);
        }
        
        // 更新头部统计信息
        this.updateHeaderStats();
    }

    /**
     * 更新头部统计信息
     */
    updateHeaderStats() {
        const rankInfo = document.querySelector('.rank-info');
        if (rankInfo) {
            rankInfo.innerHTML = `
                <div class="rank-display">排名: ${this.boardData.rank}</div>
                <div class="solve-info">${this.boardData.solvedCount}/${this.boardData.totalProblems}</div>
                <div class="penalty-info">总时间: ${this.boardData.totalPenalty}分钟</div>
            `;
        }
    }

    /**
     * 获取比赛统计信息
     */
    getStatistics() {
        return {
            contestName: this.boardData.contestName,
            platform: this.boardData.platform,
            solvedCount: this.boardData.solvedCount,
            totalProblems: this.boardData.totalProblems,
            totalPenalty: this.boardData.totalPenalty,
            rank: this.boardData.rank,
            solveRate: this.boardData.totalProblems > 0 ? 
                Math.round((this.boardData.solvedCount / this.boardData.totalProblems) * 100) : 0
        };
    }

    /**
     * 导出比赛数据
     */
    exportData() {
        return {
            contestData: this.contestData,
            contestRecord: this.contestRecord,
            boardData: this.boardData,
            exportTime: new Date().toISOString()
        };
    }

    // 工具方法
    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('zh-CN');
        } catch {
            return dateString || '';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 清理资源
     */
    destroy() {
        this.contestData = null;
        this.contestRecord = null;
        this.problems = [];
        this.boardData = null;
        this.initialized = false;
        console.log('ICPC board renderer destroyed');
    }
}

/**
 * 编辑题目状态的全局函数
 */
function editProblemStatus(problemLetter) {
    // 这个函数将在contest-detail.html中实现
    // 用于打开编辑模态框
    if (typeof showEditProblemModal === 'function') {
        showEditProblemModal(problemLetter);
    } else {
        console.log(`Edit problem ${problemLetter} status`);
    }
}