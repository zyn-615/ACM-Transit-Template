/**
 * ACM中转站 - 比赛横条显示管理器
 * 类似xcpcio.com的ICPC风格比赛面板
 * 提供静态的比赛结果展示和手动数据录入
 */

class ContestBoardManager {
    constructor() {
        this.contestants = [];
        this.problems = [];
        this.boardData = null;
        this.sortBy = 'rank';
        this.showOnlyAC = false;
        
        // 初始化默认数据
        this.initializeDefaultData();
    }

    /**
     * 初始化默认比赛数据
     */
    initializeDefaultData() {
        // 默认题目列表 (A-O)
        this.problems = [
            { id: 'A', title: '题目A', index: 0 },
            { id: 'B', title: '题目B', index: 1 },
            { id: 'C', title: '题目C', index: 2 },
            { id: 'D', title: '题目D', index: 3 },
            { id: 'E', title: '题目E', index: 4 }
        ];

        // 示例参赛者数据
        this.contestants = [
            {
                rank: 1,
                teamName: "我的队伍",
                solved: 4,
                penalty: 315,
                problems: {
                    'A': { status: 'solved', time: 15, attempts: 1 },
                    'B': { status: 'solved', time: 45, attempts: 2 },
                    'C': { status: 'solved', time: 120, attempts: 1 },
                    'D': { status: 'solved', time: 135, attempts: 3 },
                    'E': { status: 'failed', time: 0, attempts: 2 }
                },
                isCurrentUser: true
            },
            {
                rank: 2,
                teamName: "队伍2",
                solved: 4,
                penalty: 420,
                problems: {
                    'A': { status: 'solved', time: 25, attempts: 1 },
                    'B': { status: 'solved', time: 65, attempts: 1 },
                    'C': { status: 'solved', time: 180, attempts: 2 },
                    'D': { status: 'solved', time: 150, attempts: 1 },
                    'E': { status: 'unattempted', time: 0, attempts: 0 }
                }
            },
            {
                rank: 3,
                teamName: "队伍3",
                solved: 3,
                penalty: 285,
                problems: {
                    'A': { status: 'solved', time: 35, attempts: 1 },
                    'B': { status: 'solved', time: 75, attempts: 1 },
                    'C': { status: 'solved', time: 175, attempts: 1 },
                    'D': { status: 'failed', time: 0, attempts: 3 },
                    'E': { status: 'unattempted', time: 0, attempts: 0 }
                }
            }
        ];
    }

    /**
     * 渲染横条显示面板
     */
    renderHorizontalBoard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('比赛面板容器未找到:', containerId);
            return;
        }

        const boardHtml = `
            <div class="contest-board-horizontal">
                <div class="board-controls">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-weight-600">比赛排行榜</h3>
                        <div class="board-actions">
                            <button class="btn btn-sm btn-outline" onclick="contestBoardManager.toggleACOnly()">
                                ${this.showOnlyAC ? '显示全部' : '仅显示AC'}
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="contestBoardManager.showEditModal()">
                                编辑数据
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="board-table-container">
                    <table class="board-table">
                        <thead>
                            <tr>
                                <th class="rank-col">排名</th>
                                <th class="team-col">队伍</th>
                                <th class="solved-col">解题数</th>
                                <th class="penalty-col">罚时</th>
                                ${this.problems.map(p => `<th class="problem-col">${p.id}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderBoardRows()}
                        </tbody>
                    </table>
                </div>
                
                <div class="board-legend mt-4">
                    <div class="flex flex-wrap gap-4 text-sm">
                        <div class="legend-item">
                            <span class="problem-cell solved" style="display: inline-block; width: 30px; height: 20px; margin-right: 5px;"></span>
                            已解决
                        </div>
                        <div class="legend-item">
                            <span class="problem-cell failed" style="display: inline-block; width: 30px; height: 20px; margin-right: 5px;"></span>
                            失败
                        </div>
                        <div class="legend-item">
                            <span class="problem-cell pending" style="display: inline-block; width: 30px; height: 20px; margin-right: 5px;"></span>
                            评测中
                        </div>
                        <div class="legend-item">
                            <span class="problem-cell unattempted" style="display: inline-block; width: 30px; height: 20px; margin-right: 5px;"></span>
                            未尝试
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = boardHtml;
    }

    /**
     * 渲染面板行
     */
    renderBoardRows() {
        let visibleContestants = [...this.contestants];
        
        if (this.showOnlyAC) {
            visibleContestants = visibleContestants.filter(c => c.solved > 0);
        }

        return visibleContestants.map(contestant => {
            const rowClass = contestant.isCurrentUser ? 'board-row user-row' : 'board-row';
            
            return `
                <tr class="${rowClass}">
                    <td class="rank-col">${contestant.rank}</td>
                    <td class="team-col">
                        ${contestant.isCurrentUser ? '👤 ' : ''}${this.escapeHtml(contestant.teamName)}
                    </td>
                    <td class="solved-col">${contestant.solved}</td>
                    <td class="penalty-col">${contestant.penalty}</td>
                    ${this.problems.map(problem => this.renderProblemCell(contestant, problem)).join('')}
                </tr>
            `;
        }).join('');
    }

    /**
     * 渲染题目单元格
     */
    renderProblemCell(contestant, problem) {
        const problemData = contestant.problems[problem.id];
        if (!problemData) {
            return `<td class="problem-cell unattempted">
                <div class="cell-content">-</div>
            </td>`;
        }

        let cellClass = `problem-cell ${problemData.status}`;
        let cellContent = '';

        switch (problemData.status) {
            case 'solved':
                cellContent = `
                    <div class="cell-content">
                        <div class="cell-time">${problemData.time}</div>
                        ${problemData.attempts > 1 ? `<div class="cell-attempts">${problemData.attempts - 1}</div>` : ''}
                    </div>
                `;
                break;
            case 'failed':
                cellContent = `
                    <div class="cell-content">
                        <div class="cell-attempts">${problemData.attempts}</div>
                    </div>
                `;
                break;
            case 'pending':
                cellContent = `
                    <div class="cell-content">
                        <div class="cell-time">评测中</div>
                    </div>
                `;
                break;
            default:
                cellContent = `<div class="cell-content">-</div>`;
        }

        return `<td class="${cellClass}" onclick="contestBoardManager.editProblemCell('${contestant.teamName}', '${problem.id}')">
            ${cellContent}
        </td>`;
    }

    /**
     * 切换仅显示AC
     */
    toggleACOnly() {
        this.showOnlyAC = !this.showOnlyAC;
        this.renderHorizontalBoard('contest-board-container');
    }

    /**
     * 显示编辑模态框
     */
    showEditModal() {
        const modalHtml = `
            <div id="board-edit-modal" class="modal show">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>编辑比赛数据</h3>
                        <button class="close-btn" onclick="contestBoardManager.closeEditModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="board-edit-form" onsubmit="contestBoardManager.handleEditSubmit(event)">
                            <div class="form-group">
                                <label class="form-label">队伍名称</label>
                                <input type="text" id="edit-team-name" class="form-control" value="${this.contestants[0]?.teamName || '我的队伍'}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">排名</label>
                                <input type="number" id="edit-rank" class="form-control" value="${this.contestants[0]?.rank || 1}" min="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">解题数</label>
                                <input type="number" id="edit-solved" class="form-control" value="${this.contestants[0]?.solved || 0}" min="0" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">总罚时</label>
                                <input type="number" id="edit-penalty" class="form-control" value="${this.contestants[0]?.penalty || 0}" min="0" required>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="submit" class="btn btn-primary">保存更改</button>
                                <button type="button" class="btn btn-outline" onclick="contestBoardManager.closeEditModal()">取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * 编辑题目单元格
     */
    editProblemCell(teamName, problemId) {
        const contestant = this.contestants.find(c => c.teamName === teamName);
        if (!contestant) return;

        const problem = contestant.problems[problemId] || { status: 'unattempted', time: 0, attempts: 0 };
        
        const modalHtml = `
            <div id="problem-edit-modal" class="modal show">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>编辑题目 ${problemId} - ${teamName}</h3>
                        <button class="close-btn" onclick="contestBoardManager.closeProblemModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="problem-edit-form" onsubmit="contestBoardManager.handleProblemSubmit(event, '${teamName}', '${problemId}')">
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select id="problem-status" class="form-control" required>
                                    <option value="unattempted" ${problem.status === 'unattempted' ? 'selected' : ''}>未尝试</option>
                                    <option value="solved" ${problem.status === 'solved' ? 'selected' : ''}>已解决</option>
                                    <option value="failed" ${problem.status === 'failed' ? 'selected' : ''}>失败</option>
                                    <option value="pending" ${problem.status === 'pending' ? 'selected' : ''}>评测中</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">解题时间 (分钟)</label>
                                <input type="number" id="problem-time" class="form-control" value="${problem.time}" min="0">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">尝试次数</label>
                                <input type="number" id="problem-attempts" class="form-control" value="${problem.attempts}" min="0">
                            </div>
                            
                            <div class="modal-actions">
                                <button type="submit" class="btn btn-primary">保存</button>
                                <button type="button" class="btn btn-outline" onclick="contestBoardManager.closeProblemModal()">取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * 处理编辑提交
     */
    handleEditSubmit(event) {
        event.preventDefault();
        
        const teamName = document.getElementById('edit-team-name').value;
        const rank = parseInt(document.getElementById('edit-rank').value);
        const solved = parseInt(document.getElementById('edit-solved').value);
        const penalty = parseInt(document.getElementById('edit-penalty').value);

        // 更新当前用户数据
        const userContestant = this.contestants.find(c => c.isCurrentUser);
        if (userContestant) {
            userContestant.teamName = teamName;
            userContestant.rank = rank;
            userContestant.solved = solved;
            userContestant.penalty = penalty;
        }

        this.closeEditModal();
        this.renderHorizontalBoard('contest-board-container');
        
        if (typeof showNotification === 'function') {
            showNotification('比赛数据更新成功', 'success');
        }
    }

    /**
     * 处理题目编辑提交
     */
    handleProblemSubmit(event, teamName, problemId) {
        event.preventDefault();
        
        const status = document.getElementById('problem-status').value;
        const time = parseInt(document.getElementById('problem-time').value) || 0;
        const attempts = parseInt(document.getElementById('problem-attempts').value) || 0;

        const contestant = this.contestants.find(c => c.teamName === teamName);
        if (contestant) {
            contestant.problems[problemId] = { status, time, attempts };
            
            // 重新计算解题数和罚时
            this.recalculateContestantStats(contestant);
        }

        this.closeProblemModal();
        this.renderHorizontalBoard('contest-board-container');
        
        if (typeof showNotification === 'function') {
            showNotification('题目状态更新成功', 'success');
        }
    }

    /**
     * 重新计算参赛者统计信息
     */
    recalculateContestantStats(contestant) {
        let solved = 0;
        let penalty = 0;

        Object.values(contestant.problems).forEach(problem => {
            if (problem.status === 'solved') {
                solved++;
                penalty += problem.time + (problem.attempts - 1) * 20; // 假设每次错误尝试罚时20分钟
            }
        });

        contestant.solved = solved;
        contestant.penalty = penalty;
    }

    /**
     * 关闭编辑模态框
     */
    closeEditModal() {
        const modal = document.getElementById('board-edit-modal');
        if (modal) modal.remove();
    }

    /**
     * 关闭题目编辑模态框
     */
    closeProblemModal() {
        const modal = document.getElementById('problem-edit-modal');
        if (modal) modal.remove();
    }

    /**
     * 工具方法
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 导出数据
     */
    exportData() {
        return {
            contestants: this.contestants,
            problems: this.problems,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 导入数据
     */
    importData(data) {
        if (data.contestants) this.contestants = data.contestants;
        if (data.problems) this.problems = data.problems;
        this.renderHorizontalBoard('contest-board-container');
    }
}

// 全局实例
window.contestBoardManager = new ContestBoardManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('contest-board-container')) {
        window.contestBoardManager.renderHorizontalBoard('contest-board-container');
    }
}); 