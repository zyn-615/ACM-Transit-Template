/**
 * ACM中转站 - 主应用控制器
 * 应用程序启动器和导航处理器
 * 协调比赛和题目管理器之间的交互
 */

class MainApp {
    constructor() {
        this.storage = null;
        this.contestManager = null;
        this.problemManager = null;
        this.currentPage = null;
        this.initialized = false;
        
        // 绑定方法
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        
        // 开始初始化
        this.initialize();
    }

    /**
     * 应用程序初始化
     */
    async initialize() {
        try {
            console.log('ACM中转站启动中...');
            
            // 检测当前页面
            this.currentPage = this.detectCurrentPage();
            
            // 初始化存储层
            this.storage = new DataStorage();
            
            // 初始化管理器（根据页面需要）
            await this.initializeManagers();
            
            // 设置全局事件监听器
            this.setupGlobalEventListeners();
            
            // 设置导航高亮
            this.updateNavigation();
            
            // 应用程序初始化完成
            this.initialized = true;
            console.log('ACM中转站启动完成，当前页面:', this.currentPage);
            
            // 触发初始化完成事件
            this.emitGlobalEvent('appInitialized', {
                page: this.currentPage,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.showGlobalError('应用程序启动失败: ' + error.message);
        }
    }

    /**
     * 检测当前页面类型
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        
        // 检测比赛详情页面
        if (filename.includes('contest-detail')) return 'contest-detail';
        // 检测比赛管理页面
        if (filename.includes('contest')) return 'contests';
        // 检测题目管理页面
        if (filename.includes('problem')) return 'problems';
        // 默认为仪表板页面
        return 'dashboard';
    }

    /**
     * 根据当前页面初始化相应的管理器
     */
    async initializeManagers() {
        switch (this.currentPage) {
            case 'contests':
                // 比赛页面需要比赛管理器
                this.contestManager = new ContestManager(this.storage);
                await this.waitForManagerInitialization(this.contestManager, 'Contest Manager');
                console.log('比赛管理器初始化完成');
                break;
                
            case 'problems':
                // 题目页面需要题目管理器
                this.problemManager = new ProblemManager(this.storage);
                await this.waitForManagerInitialization(this.problemManager, 'Problem Manager');
                console.log('题目管理器初始化完成');
                break;
                
            case 'contest-detail':
                // 比赛详情页面需要比赛详情管理器
                // 注意：ContestDetailManager在页面脚本中直接初始化，这里不需要处理
                console.log('比赛详情页面检测到，管理器将在页面脚本中初始化');
                break;
                
            case 'dashboard':
                // 仪表板使用专用管理器解决数据加载竞态条件
                this.dashboardManager = new DashboardManager(this.storage);
                await this.waitForManagerInitialization(this.dashboardManager, 'Dashboard Manager');
                console.log('仪表板管理器初始化完成');
                break;
                
            default:
                console.warn('未知页面类型:', this.currentPage);
        }
    }

    /**
     * 等待管理器初始化完成
     */
    waitForManagerInitialization(manager, name) {
        return new Promise((resolve, reject) => {
            if (manager.initialized) {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error(`${name} initialization timeout`));
            }, 10000); // 10秒超时

            const onInitialized = () => {
                clearTimeout(timeout);
                manager.off('initialized', onInitialized);
                resolve();
            };

            manager.on('initialized', onInitialized);
        });
    }

    /**
     * 设置全局事件监听器
     */
    setupGlobalEventListeners() {
        // 导航链接点击处理
        document.addEventListener('click', this.handleNavigation);
        
        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeyboard);
        
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        
        // 窗口大小变化处理
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // 在线/离线状态检测
        window.addEventListener('online', () => {
            this.showGlobalMessage('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            this.showGlobalMessage('网络连接已断开，数据将保存在本地', 'warning');
        });
    }

    /**
     * 处理导航点击事件
     */
    handleNavigation(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // 只处理内部导航链接
        if (href.startsWith('http') || href.startsWith('#')) {
            return;
        }

        // 更新导航状态
        this.updateActiveNavigation(link);
    }

    /**
     * 更新导航高亮状态
     */
    updateNavigation() {
        const navLinks = document.querySelectorAll('.navbar-nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active');
            
            // 根据当前页面设置活动状态
            if ((this.currentPage === 'dashboard' && href.includes('index.html')) ||
                (this.currentPage === 'contests' && href.includes('contests.html')) ||
                (this.currentPage === 'contest-detail' && href.includes('contests.html')) ||
                (this.currentPage === 'problems' && href.includes('problems.html'))) {
                link.classList.add('active');
            }
        });
    }

    /**
     * 更新活动导航链接
     */
    updateActiveNavigation(clickedLink) {
        // 移除所有活动状态
        document.querySelectorAll('.navbar-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // 设置点击的链接为活动状态
        clickedLink.classList.add('active');
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboard(event) {
        // 全局快捷键
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 's':
                    // Ctrl+S: 快速保存/导出
                    event.preventDefault();
                    this.quickSave();
                    break;
                    
                case '/':
                    // Ctrl+/: 搜索框聚焦
                    event.preventDefault();
                    this.focusSearchBox();
                    break;
                    
                case 'n':
                    // Ctrl+N: 新建记录
                    event.preventDefault();
                    this.quickAdd();
                    break;
            }
        }

        // ESC键：关闭模态框
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    /**
     * 页面卸载前处理
     */
    handleBeforeUnload(event) {
        // 检查是否有未保存的数据
        if (this.hasUnsavedChanges()) {
            const message = '您有未保存的更改，确定要离开吗？';
            event.returnValue = message;
            return message;
        }
    }

    /**
     * 窗口大小变化处理
     */
    handleResize() {
        // 触发全局调整大小事件
        this.emitGlobalEvent('windowResize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    /**
     * 快速保存功能
     */
    async quickSave() {
        try {
            if (this.currentPage === 'contests' && this.contestManager) {
                const success = await this.contestManager.exportContests(`contests-${this.getDateString()}.json`);
                if (success) {
                    this.showGlobalMessage('比赛数据导出成功', 'success');
                }
            } else if (this.currentPage === 'problems' && this.problemManager) {
                const success = await this.problemManager.exportProblems(`problems-${this.getDateString()}.json`);
                if (success) {
                    this.showGlobalMessage('题目数据导出成功', 'success');
                }
            } else {
                this.showGlobalMessage('当前页面不支持快速保存', 'warning');
            }
        } catch (error) {
            this.showGlobalError('快速保存失败: ' + error.message);
        }
    }

    /**
     * 搜索框聚焦
     */
    focusSearchBox() {
        const searchInput = document.querySelector('#search-query, input[placeholder*="搜索"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * 快速添加功能
     */
    quickAdd() {
        if (this.currentPage === 'contests') {
            const nameInput = document.getElementById('contest-name');
            if (nameInput) {
                nameInput.focus();
                this.showGlobalMessage('快捷键：Ctrl+S 保存，ESC 取消', 'info');
            }
        } else if (this.currentPage === 'problems') {
            const titleInput = document.getElementById('problem-title');
            if (titleInput) {
                titleInput.focus();
                this.showGlobalMessage('快捷键：Ctrl+S 保存，ESC 取消', 'info');
            }
        }
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    /**
     * 检查是否有未保存的更改
     */
    hasUnsavedChanges() {
        // 检查表单是否有内容
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                if (value.toString().trim()) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 获取统计数据（仪表板使用）
     */
    getStatistics() {
        const stats = {
            contests: { total: 0, thisMonth: 0 },
            problems: { total: 0, solved: 0 },
            lastUpdated: new Date().toISOString()
        };

        // 优先使用DashboardManager的统计数据
        if (this.dashboardManager && this.dashboardManager.initialized) {
            const dashboardStats = this.dashboardManager.getStatistics();
            if (dashboardStats) {
                stats.contests.total = dashboardStats.contests.total;
                stats.contests.thisMonth = dashboardStats.contests.thisMonth;
                stats.problems.total = dashboardStats.problems.total;
                stats.problems.solved = dashboardStats.problems.solved;
                stats.lastUpdated = dashboardStats.lastUpdated;
            }
        } else {
            // 降级处理：分别从管理器获取数据
            if (this.contestManager) {
                const contestStats = this.contestManager.getStatistics();
                stats.contests.total = contestStats.total;
                stats.contests.thisMonth = contestStats.recentContests?.length || 0;
            }

            if (this.problemManager) {
                const problemStats = this.problemManager.getStatistics();
                stats.problems.total = problemStats.total;
                stats.problems.solved = problemStats.byStatus.solved || 0;
            }
        }

        return stats;
    }

    /**
     * 数据同步功能
     */
    async syncData() {
        try {
            this.showGlobalMessage('开始数据同步...', 'info');
            
            // 重新加载所有数据
            const promises = [];
            if (this.contestManager) {
                promises.push(this.contestManager.reloadData());
            }
            if (this.problemManager) {
                promises.push(this.problemManager.reloadData());
            }
            if (this.dashboardManager) {
                promises.push(this.dashboardManager.refreshData());
            }

            await Promise.all(promises);
            
            this.showGlobalMessage('数据同步完成', 'success');
            this.emitGlobalEvent('dataSynced', { timestamp: new Date().toISOString() });
            
        } catch (error) {
            this.showGlobalError('数据同步失败: ' + error.message);
        }
    }

    /**
     * 应用程序重置
     */
    async resetApp() {
        if (!confirm('确定要重置所有数据吗？此操作不可撤销！')) {
            return;
        }

        try {
            // 清空localStorage
            if (this.storage) {
                this.storage.clearCache();
            }

            // 清空管理器数据
            if (this.contestManager) {
                this.contestManager.clearAllContests();
            }
            if (this.problemManager) {
                this.problemManager.clearAllProblems();
            }
            if (this.dashboardManager) {
                this.dashboardManager.refreshData();
            }

            this.showGlobalMessage('应用程序已重置', 'success');
            
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            this.showGlobalError('重置失败: ' + error.message);
        }
    }

    /**
     * 显示全局消息
     */
    showGlobalMessage(message, type = 'info') {
        if (this.storage && this.storage.showNotification) {
            this.storage.showNotification(message, type);
        } else {
            // 回退到控制台
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 显示全局错误
     */
    showGlobalError(message) {
        this.showGlobalMessage(message, 'error');
        console.error('Global Error:', message);
    }

    /**
     * 触发全局事件
     */
    emitGlobalEvent(eventName, data) {
        const event = new CustomEvent(`acm-${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
        console.log('Global Event:', eventName, data);
    }

    /**
     * 监听全局事件
     */
    onGlobalEvent(eventName, callback) {
        document.addEventListener(`acm-${eventName}`, callback);
    }

    /**
     * 工具方法：防抖
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 工具方法：获取日期字符串
     */
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 获取应用程序信息
     */
    getAppInfo() {
        return {
            name: 'ACM中转站',
            version: '1.0.0',
            currentPage: this.currentPage,
            initialized: this.initialized,
            managers: {
                storage: !!this.storage,
                contests: !!this.contestManager,
                problems: !!this.problemManager,
                dashboard: !!this.dashboardManager
            },
            features: {
                localStorage: typeof Storage !== 'undefined',
                fileSystemAccess: 'showSaveFilePicker' in window,
                offline: !navigator.onLine
            }
        };
    }

    /**
     * 清理资源
     */
    destroy() {
        // 移除事件监听器
        document.removeEventListener('click', this.handleNavigation);
        document.removeEventListener('keydown', this.handleKeyboard);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);

        // 清理管理器
        if (this.contestManager) {
            this.contestManager.destroy();
        }
        if (this.problemManager) {
            this.problemManager.destroy();
        }
        if (this.dashboardManager) {
            this.dashboardManager.destroy();
        }

        // 重置状态
        this.storage = null;
        this.contestManager = null;
        this.problemManager = null;
        this.dashboardManager = null;
        this.initialized = false;
        
        console.log('ACM中转站应用程序已清理');
    }
}

// 全局应用实例
let app;

// 页面加载完成后启动应用程序
document.addEventListener('DOMContentLoaded', function() {
    app = new MainApp();
    
    // 将应用实例暴露到全局作用域（用于调试）
    if (typeof window !== 'undefined') {
        window.ACMTransit = app;
    }
});

// 导出应用类（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}