/**
 * ACM中转站 - 数据存储管理器
 * 负责比赛和题目数据的加载、保存、验证和备份操作
 * 支持localStorage缓存和File System Access API导入导出
 */

class DataStorage {
    constructor() {
        this.contestsFile = './data/contests.json';
        this.problemsFile = './data/problems.json';
        this.settingsFile = './data/settings.json';
        this.version = '1.0';
        
        // localStorage键名
        this.contestsKey = 'acm-contests';
        this.problemsKey = 'acm-problems';
        this.settingsKey = 'acm-settings';
    }

    /**
     * 加载比赛数据 - 优先使用localStorage，然后尝试文件
     */
    async loadContests() {
        try {
            // 优先从localStorage加载
            const cached = localStorage.getItem(this.contestsKey);
            if (cached) {
                const contests = JSON.parse(cached);
                console.log('从缓存加载比赛数据:', contests.length, '场比赛');
                return contests;
            }
            
            // 从文件加载
            const response = await fetch(this.contestsFile);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // 验证数据结构
            if (this.validateContestsData(data)) {
                const contests = data.contests || [];
                // 缓存到localStorage
                this.saveToLocalStorage(this.contestsKey, contests);
                console.log('从文件加载比赛数据:', contests.length, '场比赛');
                return contests;
            } else {
                console.warn('比赛数据格式不正确，使用空数组');
                return [];
            }
        } catch (error) {
            console.warn('加载比赛数据失败，使用空数组:', error.message);
            return [];
        }
    }

    /**
     * 加载题目数据
     */
    async loadProblems() {
        try {
            // 优先从localStorage加载
            const cached = localStorage.getItem(this.problemsKey);
            if (cached) {
                const problems = JSON.parse(cached);
                console.log('从缓存加载题目数据:', problems.length, '道题目');
                return problems;
            }
            
            // 从文件加载
            const response = await fetch(this.problemsFile);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // 验证数据结构
            if (this.validateProblemsData(data)) {
                const problems = data.problems || [];
                // 缓存到localStorage
                this.saveToLocalStorage(this.problemsKey, problems);
                console.log('从文件加载题目数据:', problems.length, '道题目');
                return problems;
            } else {
                console.warn('题目数据格式不正确，使用空数组');
                return [];
            }
        } catch (error) {
            console.warn('加载题目数据失败，使用空数组:', error.message);
            return [];
        }
    }

    /**
     * 加载应用设置
     */
    async loadSettings() {
        try {
            // 优先从localStorage加载
            const cached = localStorage.getItem(this.settingsKey);
            if (cached) {
                return JSON.parse(cached);
            }
            
            // 从文件加载
            const response = await fetch(this.settingsFile);
            if (!response.ok) throw new Error('Settings file not found');
            const settings = await response.json();
            
            // 缓存到localStorage
            this.saveToLocalStorage(this.settingsKey, settings);
            console.log('应用设置加载成功');
            return settings;
        } catch (error) {
            console.warn('加载设置失败，使用默认设置:', error.message);
            return this.getDefaultSettings();
        }
    }

    /**
     * 保存比赛数据到localStorage
     */
    saveContests(contests) {
        try {
            this.saveToLocalStorage(this.contestsKey, contests);
            console.log('比赛数据已保存到缓存:', contests.length, '场比赛');
            return true;
        } catch (error) {
            console.error('保存比赛数据失败:', error);
            this.showNotification('保存比赛数据失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 保存题目数据到localStorage
     */
    saveProblems(problems) {
        try {
            this.saveToLocalStorage(this.problemsKey, problems);
            console.log('题目数据已保存到缓存:', problems.length, '道题目');
            return true;
        } catch (error) {
            console.error('保存题目数据失败:', error);
            this.showNotification('保存题目数据失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 保存设置到localStorage
     */
    saveSettings(settings) {
        try {
            this.saveToLocalStorage(this.settingsKey, settings);
            console.log('应用设置已保存');
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showNotification('保存设置失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 导出比赛数据为JSON文件
     */
    async exportContests(contests, filename = 'contests.json') {
        const data = {
            contests: contests,
            version: this.version,
            lastModified: new Date().toISOString(),
            metadata: {
                totalContests: contests.length,
                exportedBy: 'ACM中转站',
                description: 'ACM竞赛记录数据库导出',
                exportedAt: new Date().toLocaleString('zh-CN')
            }
        };
        
        return this.exportData(data, filename);
    }

    /**
     * 导出题目数据为JSON文件
     */
    async exportProblems(problems, filename = 'problems.json') {
        const data = {
            problems: problems,
            version: this.version,
            lastModified: new Date().toISOString(),
            metadata: {
                totalProblems: problems.length,
                exportedBy: 'ACM中转站',
                description: 'ACM题目记录数据库导出',
                exportedAt: new Date().toLocaleString('zh-CN')
            }
        };
        
        return this.exportData(data, filename);
    }

    /**
     * 导出数据 - 使用File System Access API或传统下载方式
     */
    async exportData(data, filename) {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            
            // 优先使用File System Access API
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'JSON files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(jsonStr);
                    await writable.close();
                    
                    console.log('数据导出成功 (File System Access API):', filename);
                    this.showNotification('数据导出成功', 'success');
                    return true;
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        throw error; // 如果不是用户取消，继续抛出错误
                    }
                    console.log('用户取消了文件保存');
                    return false;
                }
            } else {
                // 降级到传统下载方式
                const blob = new Blob([jsonStr], { 
                    type: 'application/json;charset=utf-8' 
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('数据导出成功 (传统下载):', filename);
                this.showNotification('数据导出成功', 'success');
                return true;
            }
        } catch (error) {
            console.error('导出数据失败:', error);
            this.showNotification('导出失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 从文件导入数据
     */
    async importData() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.multiple = false;
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                
                try {
                    const data = await this.readFileAsJSON(file);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    /**
     * 读取文件为JSON对象
     */
    async readFileAsJSON(file) {
        return new Promise((resolve, reject) => {
            if (!file.name.toLowerCase().endsWith('.json')) {
                reject(new Error('请选择JSON文件'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('JSON文件格式错误: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * 验证比赛数据结构
     */
    validateContestsData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.contests)) return false;
        
        // 验证每个比赛对象
        for (const contest of data.contests) {
            if (!this.validateContestObject(contest)) {
                console.warn('发现无效的比赛对象:', contest);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证题目数据结构
     */
    validateProblemsData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.problems)) return false;
        
        // 验证每个题目对象
        for (const problem of data.problems) {
            if (!this.validateProblemObject(problem)) {
                console.warn('发现无效的题目对象:', problem);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证单个比赛对象
     */
    validateContestObject(contest) {
        const requiredFields = ['id', 'name', 'platform', 'date'];
        
        for (const field of requiredFields) {
            if (!(field in contest)) {
                return false;
            }
        }
        
        // 验证日期格式
        if (!this.isValidDate(contest.date)) {
            return false;
        }
        
        return true;
    }

    /**
     * 验证单个题目对象
     */
    validateProblemObject(problem) {
        const requiredFields = ['id', 'title', 'platform'];
        
        for (const field of requiredFields) {
            if (!(field in problem)) {
                return false;
            }
        }
        
        // 验证标签是数组
        if (problem.tags && !Array.isArray(problem.tags)) {
            return false;
        }
        
        return true;
    }

    /**
     * 验证日期格式
     */
    isValidDate(dateString) {
        try {
            const date = new Date(dateString);
            return !isNaN(date.getTime());
        } catch {
            return false;
        }
    }

    /**
     * 保存到localStorage
     */
    saveToLocalStorage(key, data) {
        try {
            const jsonStr = JSON.stringify(data);
            localStorage.setItem(key, jsonStr);
            return true;
        } catch (error) {
            console.error('localStorage保存失败:', error);
            // 可能是存储空间不足
            if (error.name === 'QuotaExceededError') {
                throw new Error('存储空间不足，请清理浏览器缓存');
            }
            throw error;
        }
    }

    /**
     * 获取默认应用设置
     */
    getDefaultSettings() {
        return {
            defaultFilePath: './files/',
            autoSync: false,
            sortBy: 'date',
            sortOrder: 'desc',
            viewMode: 'table',
            theme: 'light',
            itemsPerPage: 20,
            language: 'zh-cn',
            enableNotifications: true,
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm:ss',
            contestPlatforms: ['Codeforces', 'AtCoder', 'CodeChef', 'ICPC', 'CCPC', 'NowCoder', '自定义'],
            problemTags: ['dp', 'greedy', 'graph', 'math', 'string', 'data-structure', 'implementation', 'brute-force', 'binary-search', 'sorting'],
            difficultyLevels: [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500],
            version: this.version
        };
    }

    /**
     * 创建备份
     */
    async createBackup(contests, problems, backupType = 'manual') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupData = {
            contests: contests,
            problems: problems,
            version: this.version,
            backupType: backupType,
            backupTime: new Date().toISOString(),
            metadata: {
                totalContests: contests.length,
                totalProblems: problems.length,
                createdBy: 'ACM中转站自动备份',
                description: `${backupType}备份 - ${new Date().toLocaleString('zh-CN')}`
            }
        };
        
        const filename = `acm-backup-${backupType}-${timestamp}.json`;
        return this.exportData(backupData, filename);
    }

    /**
     * 清理localStorage缓存
     */
    clearCache() {
        try {
            localStorage.removeItem(this.contestsKey);
            localStorage.removeItem(this.problemsKey);
            localStorage.removeItem(this.settingsKey);
            console.log('缓存已清理');
            this.showNotification('缓存清理完成', 'success');
            return true;
        } catch (error) {
            console.error('清理缓存失败:', error);
            this.showNotification('清理缓存失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            transform: 'translateX(100px)',
            maxWidth: '300px',
            wordBreak: 'break-word',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        });

        // 设置背景颜色
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // 添加到页面并显示动画
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 3.5秒后移除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3500);
    }
}