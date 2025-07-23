/**
 * ACM中转站 - 题解管理器
 * 支持题目和比赛的多篇题解管理
 * 提供题解的添加、编辑、删除和展示功能
 */

class SolutionManager {
    constructor(storage) {
        this.storage = storage;
        this.eventListeners = new Map();
        
        // 题解类型配置
        this.solutionTypes = {
            'official': { label: '官方题解', color: '#007bff', icon: '🏛️' },
            'personal': { label: '个人题解', color: '#28a745', icon: '👤' },
            'alternative': { label: '备选方案', color: '#ffc107', icon: '💡' },
            'video': { label: '视频题解', color: '#dc3545', icon: '🎥' },
            'summary': { label: '比赛总结', color: '#6f42c1', icon: '📝' },
            'analysis': { label: '深度分析', color: '#fd7e14', icon: '🔍' }
        };

        // 编程语言配置
        this.languages = [
            'cpp', 'python', 'java', 'javascript', 'go', 'rust', 
            'c', 'csharp', 'kotlin', 'swift', 'markdown', 'multiple'
        ];
    }

    /**
     * 为题目添加题解
     */
    async addSolutionToProblem(problemId, solutionData) {
        try {
            // 从ProblemManager获取题目
            const problemManager = window.problemManager;
            if (!problemManager) {
                throw new Error('ProblemManager未初始化');
            }

            const problem = problemManager.findProblemById(problemId);
            if (!problem) {
                throw new Error('题目不存在');
            }

            // 初始化题解数组
            if (!problem.solutions) {
                problem.solutions = [];
            }

            // 创建新题解
            const newSolution = this.createSolution(solutionData);
            problem.solutions.push(newSolution);

            // 保存更改
            await problemManager.updateProblem(problemId, { solutions: problem.solutions });
            
            this.emit('solutionAdded', { problemId, solution: newSolution });
            console.log('题解已添加到题目:', problemId, newSolution.title);
            
            return newSolution;

        } catch (error) {
            console.error('添加题目题解失败:', error);
            throw error;
        }
    }

    /**
     * 为比赛添加题解
     */
    async addSolutionToContest(contestId, solutionData) {
        try {
            // 从ContestManager获取比赛
            const contestManager = window.contestManager;
            if (!contestManager) {
                throw new Error('ContestManager未初始化');
            }

            const contest = contestManager.findContestById(contestId);
            if (!contest) {
                throw new Error('比赛不存在');
            }

            // 初始化题解数组
            if (!contest.solutions) {
                contest.solutions = [];
            }

            // 创建新题解
            const newSolution = this.createSolution(solutionData);
            contest.solutions.push(newSolution);

            // 保存更改
            await contestManager.updateContest(contestId, { solutions: contest.solutions });
            
            this.emit('solutionAdded', { contestId, solution: newSolution });
            console.log('题解已添加到比赛:', contestId, newSolution.title);
            
            return newSolution;

        } catch (error) {
            console.error('添加比赛题解失败:', error);
            throw error;
        }
    }

    /**
     * 创建题解对象
     */
    createSolution(solutionData) {
        return {
            id: this.generateSolutionId(),
            title: solutionData.title || '未命名题解',
            path: solutionData.path || '',
            type: solutionData.type || 'personal',
            language: solutionData.language || 'cpp',
            author: solutionData.author || '匿名',
            description: solutionData.description || '',
            addedTime: new Date().toISOString(),
            tags: Array.isArray(solutionData.tags) ? solutionData.tags : []
        };
    }

    /**
     * 删除题解
     */
    async removeSolution(parentId, solutionId, isContest = false) {
        try {
            const manager = isContest ? window.contestManager : window.problemManager;
            const parent = isContest ? 
                manager.findContestById(parentId) : 
                manager.findProblemById(parentId);

            if (!parent || !parent.solutions) {
                throw new Error('父项目或题解不存在');
            }

            const oldSolutions = [...parent.solutions];
            parent.solutions = parent.solutions.filter(s => s.id !== solutionId);

            if (parent.solutions.length === oldSolutions.length) {
                throw new Error('题解不存在');
            }

            // 保存更改
            const updateData = { solutions: parent.solutions };
            if (isContest) {
                await manager.updateContest(parentId, updateData);
            } else {
                await manager.updateProblem(parentId, updateData);
            }

            this.emit('solutionRemoved', { parentId, solutionId, isContest });
            console.log('题解已删除:', solutionId);

        } catch (error) {
            console.error('删除题解失败:', error);
            throw error;
        }
    }

    /**
     * 更新题解
     */
    async updateSolution(parentId, solutionId, updates, isContest = false) {
        try {
            const manager = isContest ? window.contestManager : window.problemManager;
            const parent = isContest ? 
                manager.findContestById(parentId) : 
                manager.findProblemById(parentId);

            if (!parent || !parent.solutions) {
                throw new Error('父项目或题解不存在');
            }

            const solutionIndex = parent.solutions.findIndex(s => s.id === solutionId);
            if (solutionIndex === -1) {
                throw new Error('题解不存在');
            }

            // 更新题解
            parent.solutions[solutionIndex] = {
                ...parent.solutions[solutionIndex],
                ...updates,
                modifiedTime: new Date().toISOString()
            };

            // 保存更改
            const updateData = { solutions: parent.solutions };
            if (isContest) {
                await manager.updateContest(parentId, updateData);
            } else {
                await manager.updateProblem(parentId, updateData);
            }

            this.emit('solutionUpdated', { 
                parentId, 
                solutionId, 
                solution: parent.solutions[solutionIndex], 
                isContest 
            });

        } catch (error) {
            console.error('更新题解失败:', error);
            throw error;
        }
    }

    /**
     * 渲染题解列表
     */
    renderSolutionsList(solutions, containerId, parentId, isContest = false) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('题解容器未找到:', containerId);
            return;
        }

        solutions = solutions || [];

        if (solutions.length === 0) {
            container.innerHTML = `
                <div class="no-solutions">
                    <div class="text-center text-gray-500 p-4">
                        <p>暂无题解</p>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddSolutionModal('${parentId}', ${isContest})">
                            添加${isContest ? '比赛' : '题目'}题解
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const solutionsHtml = solutions.map(solution => this.renderSolutionItem(solution, parentId, isContest)).join('');

        container.innerHTML = `
            <div class="solutions-header">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-weight-600">题解列表 (${solutions.length})</h3>
                    <button class="btn btn-primary btn-sm" onclick="showAddSolutionModal('${parentId}', ${isContest})">
                        添加题解
                    </button>
                </div>
            </div>
            <div class="solutions-list">
                ${solutionsHtml}
            </div>
        `;
    }

    /**
     * 渲染单个题解项目
     */
    renderSolutionItem(solution, parentId, isContest) {
        const typeConfig = this.solutionTypes[solution.type] || this.solutionTypes['personal'];
        
        return `
            <div class="solution-item" data-solution-id="${solution.id}">
                <div class="solution-header">
                    <div class="solution-title-area">
                        <div class="solution-title">
                            <span class="solution-icon">${typeConfig.icon}</span>
                            <h4>${this.escapeHtml(solution.title)}</h4>
                        </div>
                        <div class="solution-type-badge" style="background-color: ${typeConfig.color}">
                            ${typeConfig.label}
                        </div>
                    </div>
                    <div class="solution-actions">
                        ${solution.path ? `<a href="${solution.path}" target="_blank" class="btn btn-sm btn-outline">查看</a>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="editSolution('${parentId}', '${solution.id}', ${isContest})">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSolution('${parentId}', '${solution.id}', ${isContest})">删除</button>
                    </div>
                </div>
                <div class="solution-meta">
                    <span class="solution-author">作者: ${this.escapeHtml(solution.author)}</span>
                    <span class="solution-language">${solution.language.toUpperCase()}</span>
                    <span class="solution-time">${this.formatDate(solution.addedTime)}</span>
                </div>
                ${solution.description ? `
                    <div class="solution-description">
                        ${this.escapeHtml(solution.description)}
                    </div>
                ` : ''}
                ${solution.tags && solution.tags.length > 0 ? `
                    <div class="solution-tags">
                        ${solution.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 生成题解ID
     */
    generateSolutionId() {
        return 'sol-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取题解类型选项HTML
     */
    getSolutionTypeOptions(selectedType = '') {
        return Object.entries(this.solutionTypes).map(([value, config]) => 
            `<option value="${value}" ${value === selectedType ? 'selected' : ''}>
                ${config.icon} ${config.label}
            </option>`
        ).join('');
    }

    /**
     * 获取编程语言选项HTML
     */
    getLanguageOptions(selectedLang = '') {
        return this.languages.map(lang => 
            `<option value="${lang}" ${lang === selectedLang ? 'selected' : ''}>
                ${lang.toUpperCase()}
            </option>`
        ).join('');
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

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('zh-CN');
        } catch {
            return dateString || 'N/A';
        }
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
                    console.error('题解管理器事件处理失败:', error);
                }
            });
        }
    }
}

// 全局题解管理器实例
window.solutionManager = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.DataStorage) {
        // 初始化题解管理器
        const storage = new DataStorage();
        window.solutionManager = new SolutionManager(storage);
        console.log('题解管理器初始化完成');
    }
});

/**
 * 全局函数 - 供HTML页面调用
 */

// 显示添加题解模态框
function showAddSolutionModal(parentId, isContest = false) {
    if (!window.solutionManager) {
        alert('题解管理器未初始化');
        return;
    }

    const modalHtml = `
        <div id="solution-modal" class="modal show">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加${isContest ? '比赛' : '题目'}题解</h3>
                    <button class="close-btn" onclick="closeSolutionModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="solution-form" onsubmit="handleAddSolution(event, '${parentId}', ${isContest})">
                        <div class="form-group">
                            <label class="form-label">题解标题 *</label>
                            <input type="text" id="solution-title" class="form-control" required placeholder="输入题解标题">
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">题解类型</label>
                                <select id="solution-type" class="form-control">
                                    ${window.solutionManager.getSolutionTypeOptions()}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">编程语言</label>
                                <select id="solution-language" class="form-control">
                                    ${window.solutionManager.getLanguageOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">作者</label>
                            <input type="text" id="solution-author" class="form-control" placeholder="题解作者" value="本人">
                        </div>
                        <div class="form-group">
                            <label class="form-label">文件路径</label>
                            <input type="text" id="solution-path" class="form-control" placeholder="./files/solutions/example.md">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea id="solution-description" class="form-control" placeholder="题解描述（可选）"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">标签</label>
                            <input type="text" id="solution-tags" class="form-control" placeholder="用逗号分隔，如: dp, greedy">
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">添加题解</button>
                            <button type="button" class="btn btn-outline" onclick="closeSolutionModal()">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 处理添加题解
async function handleAddSolution(event, parentId, isContest) {
    event.preventDefault();
    
    try {
        const solutionData = {
            title: document.getElementById('solution-title').value,
            type: document.getElementById('solution-type').value,
            language: document.getElementById('solution-language').value,
            author: document.getElementById('solution-author').value,
            path: document.getElementById('solution-path').value,
            description: document.getElementById('solution-description').value,
            tags: document.getElementById('solution-tags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        if (isContest) {
            await window.solutionManager.addSolutionToContest(parentId, solutionData);
        } else {
            await window.solutionManager.addSolutionToProblem(parentId, solutionData);
        }

        closeSolutionModal();
        
        // 刷新页面显示
        if (typeof loadProblemData === 'function') {
            loadProblemData();
        }
        if (typeof loadContestData === 'function') {
            loadContestData();
        }
        
        showNotification('题解添加成功', 'success');

    } catch (error) {
        console.error('添加题解失败:', error);
        showNotification('添加题解失败: ' + error.message, 'error');
    }
}

// 删除题解
async function deleteSolution(parentId, solutionId, isContest) {
    if (!confirm('确定要删除这个题解吗？')) {
        return;
    }

    try {
        await window.solutionManager.removeSolution(parentId, solutionId, isContest);
        
        // 刷新页面显示
        if (typeof loadProblemData === 'function') {
            loadProblemData();
        }
        if (typeof loadContestData === 'function') {
            loadContestData();
        }
        
        showNotification('题解删除成功', 'success');

    } catch (error) {
        console.error('删除题解失败:', error);
        showNotification('删除题解失败: ' + error.message, 'error');
    }
}

// 关闭题解模态框
function closeSolutionModal() {
    const modal = document.getElementById('solution-modal');
    if (modal) {
        modal.remove();
    }
} 