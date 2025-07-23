/**
 * ACM中转站 - 比赛题目自动生成器
 * 根据比赛信息自动生成A-O编号的题目，防止重名并支持后续编辑
 * 支持多平台URL模式和题目数量自定义（5-15题）
 */

class ContestGenerator {
    constructor(storage) {
        this.storage = storage;
        
        // 平台配置 - 支持不同平台的URL生成和默认难度
        this.platformConfigs = {
            'Codeforces': {
                urlPattern: 'https://codeforces.com/contest/{contestId}/problem/{letter}',
                defaultDifficulties: [800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3500],
                contestIdPattern: /contest\/(\d+)/,
                letterCase: 'upper'
            },
            'AtCoder': {
                urlPattern: 'https://atcoder.jp/contests/{contestId}/tasks/{contestId}_{letter}',
                defaultDifficulties: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
                contestIdPattern: /contests\/([^\/]+)/,
                letterCase: 'lower'
            },
            'CodeChef': {
                urlPattern: 'https://www.codechef.com/{contestId}/problems/{contestId}{letter}',
                defaultDifficulties: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800],
                contestIdPattern: /contests\/([^\/]+)/,
                letterCase: 'upper'
            },
            'ICPC': {
                urlPattern: '',  // ICPC通常没有标准URL模式
                defaultDifficulties: [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000],
                contestIdPattern: null,
                letterCase: 'upper'
            },
            'CCPC': {
                urlPattern: '',  // CCPC通常没有标准URL模式
                defaultDifficulties: [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000],
                contestIdPattern: null,
                letterCase: 'upper'
            },
            'NowCoder': {
                urlPattern: 'https://ac.nowcoder.com/acm/contest/{contestId}#{letter}',
                defaultDifficulties: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800],
                contestIdPattern: /contest\/(\d+)/,
                letterCase: 'upper'
            },
            '自定义': {
                urlPattern: '',
                defaultDifficulties: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800],
                contestIdPattern: null,
                letterCase: 'upper'
            }
        };
    }

    /**
     * 为比赛生成题目列表
     * @param {Object} contestData - 比赛数据
     * @param {number} problemCount - 题目数量 (5-15)
     * @returns {Array} 生成的题目列表
     */
    async generateProblemsForContest(contestData, problemCount) {
        try {
            // 参数验证
            if (!contestData || !contestData.name) {
                throw new Error('比赛数据不完整：缺少比赛名称');
            }

            if (!problemCount || problemCount < 5 || problemCount > 15) {
                throw new Error('题目数量必须在5-15之间');
            }

            console.log(`开始为比赛 "${contestData.name}" 生成 ${problemCount} 道题目`);

            // 获取平台配置
            const config = this.platformConfigs[contestData.platform] || this.platformConfigs['自定义'];
            
            // 生成题目
            const problems = [];
            const letters = 'ABCDEFGHIJKLMNO'.slice(0, problemCount);
            const contestId = this.extractContestId(contestData.url, contestData.platform);
            const contestPrefix = this.sanitizeContestName(contestData.name);

            for (let i = 0; i < problemCount; i++) {
                const letter = letters[i];
                const problem = this.createProblemTemplate(contestData, letter, config, contestId, contestPrefix, i);
                problems.push(problem);
            }

            // 检查重名并调整
            await this.ensureUniqueProblems(problems);

            // 保存到题目库
            await this.saveProblemsToLibrary(problems);

            console.log(`成功生成 ${problemCount} 道题目，已同步到题目库`);
            return problems;

        } catch (error) {
            console.error('生成题目失败:', error);
            throw error;
        }
    }

    /**
     * 创建题目模板
     */
    createProblemTemplate(contestData, letter, config, contestId, contestPrefix, index) {
        // 生成唯一ID：使用比赛前缀 + 题目字母
        const problemId = `${contestPrefix}-${letter.toLowerCase()}`;
        
        // 生成题目标题：比赛名称 + 题目字母
        const title = `${contestData.name} - ${letter}`;
        
        // 不自动生成URL，让用户手动填写 
        const url = '';
        
        // 获取默认难度
        const difficulty = config.defaultDifficulties[index] || 1000;
        
        // 生成标签
        const tags = this.generateDefaultTags(contestData);

        return {
            id: problemId,
            title: title,
            platform: contestData.platform,
            url: url,
            difficulty: difficulty,
            tags: tags,
            status: 'unattempted',
            notes: `来自比赛: ${contestData.name}，可在题库中编辑难度和标签`,
            addedDate: new Date().toISOString().split('T')[0],
            
            // 比赛关联信息
            contestId: contestData.id,
            problemLetter: letter,
            
            // 标记数据来源，便于后续管理
            source: 'contest',
            sourceContestName: contestData.name,
            
            // 可编辑字段标记
            editableInLibrary: true,
            autoGenerated: true,
            
            // 题目索引，用于横条显示
            problemIndex: letter
        };
    }

    /**
     * 清理比赛名称，生成URL安全的前缀
     */
    sanitizeContestName(contestName) {
        return contestName
            .replace(/[^\w\s\-]/g, '')      // 移除特殊字符，保留字母数字空格横线
            .replace(/\s+/g, '-')           // 空格转为横线
            .replace(/\-+/g, '-')           // 多个横线合并为一个
            .trim()                         // 去除首尾空格
            .toLowerCase()                  // 转为小写
            .substring(0, 30);              // 限制长度
    }

    /**
     * 生成题目URL
     */
    generateProblemUrl(config, contestId, letter) {
        if (!config.urlPattern || !contestId) {
            return '';
        }

        const letterToUse = config.letterCase === 'lower' ? letter.toLowerCase() : letter.toUpperCase();
        
        return config.urlPattern
            .replace('{contestId}', contestId)
            .replace('{letter}', letterToUse);
    }

    /**
     * 从比赛URL中提取比赛ID
     */
    extractContestId(url, platform) {
        if (!url) return 'unknown';

        try {
            const config = this.platformConfigs[platform];
            if (!config || !config.contestIdPattern) {
                return 'unknown';
            }

            const match = url.match(config.contestIdPattern);
            return match ? match[1] : 'unknown';
            
        } catch (error) {
            console.warn('提取比赛ID失败:', error);
            return 'unknown';
        }
    }

    /**
     * 生成默认标签
     */
    generateDefaultTags(contestData) {
        const tags = ['比赛题目'];
        
        // 添加平台标签
        if (contestData.platform) {
            tags.push(contestData.platform);
        }
        
        // 根据比赛名称添加特殊标签
        const contestName = contestData.name.toLowerCase();
        if (contestName.includes('div') || contestName.includes('division')) {
            if (contestName.includes('div. 1') || contestName.includes('division 1')) {
                tags.push('高难度');
            } else if (contestName.includes('div. 2') || contestName.includes('division 2')) {
                tags.push('中等难度');
            } else if (contestName.includes('div. 3') || contestName.includes('division 3')) {
                tags.push('入门难度');
            }
        }
        
        if (contestName.includes('educational')) {
            tags.push('教育题');
        }
        
        if (contestName.includes('global')) {
            tags.push('全球赛');
        }

        if (contestName.includes('icpc') || contestName.includes('ccpc')) {
            tags.push('ICPC风格');
        }

        return tags;
    }

    /**
     * 确保题目ID唯一性
     */
    async ensureUniqueProblems(problems) {
        try {
            // 加载现有题目
            const existingProblems = await this.storage.loadProblems();
            const existingIds = new Set(existingProblems.map(p => p.id));
            
            // 检查并修复重名
            for (let problem of problems) {
                let originalId = problem.id;
                let counter = 1;
                
                while (existingIds.has(problem.id)) {
                    problem.id = `${originalId}-${counter}`;
                    counter++;
                }
                
                // 如果ID被修改了，更新说明
                if (problem.id !== originalId) {
                    problem.notes += `（ID已调整为 ${problem.id} 以避免重复）`;
                }
                
                // 添加到已存在集合中，避免同批次内重复
                existingIds.add(problem.id);
            }
            
        } catch (error) {
            console.warn('检查题目唯一性失败，继续使用原ID:', error);
        }
    }

    /**
     * 保存题目到题目库
     */
    async saveProblemsToLibrary(problems) {
        try {
            // 加载现有题目
            const existingProblems = await this.storage.loadProblems();
            
            // 合并题目列表
            const updatedProblems = [...existingProblems, ...problems];
            
            // 保存到存储
            const success = this.storage.saveProblems(updatedProblems);
            
            if (!success) {
                throw new Error('保存题目到本地存储失败');
            }
            
            console.log(`已将 ${problems.length} 道题目同步到题目库`);
            
        } catch (error) {
            console.error('保存题目到题目库失败:', error);
            throw new Error('保存题目失败: ' + error.message);
        }
    }

    /**
     * 获取支持的题目数量选项
     */
    getSupportedProblemCounts() {
        return [
            { value: 5, label: '5题 (小型练习赛)' },
            { value: 6, label: '6题 (AtCoder常见)' },
            { value: 7, label: '7题 (Div.2常见)' },
            { value: 8, label: '8题' },
            { value: 9, label: '9题' },
            { value: 10, label: '10题' },
            { value: 11, label: '11题 (ICPC常见)' },
            { value: 12, label: '12题' },
            { value: 13, label: '13题 (ICPC World Finals)' },
            { value: 14, label: '14题' },
            { value: 15, label: '15题 (大型比赛)' }
        ];
    }

    /**
     * 获取平台信息
     */
    getPlatformInfo(platform) {
        return this.platformConfigs[platform] || this.platformConfigs['自定义'];
    }

    /**
     * 验证比赛数据
     */
    validateContestData(contestData) {
        const errors = [];
        
        if (!contestData.name || !contestData.name.trim()) {
            errors.push('比赛名称不能为空');
        }
        
        if (!contestData.platform) {
            errors.push('必须选择比赛平台');
        }
        
        if (!contestData.date) {
            errors.push('必须设置比赛日期');
        }
        
        // 验证日期格式
        if (contestData.date && isNaN(new Date(contestData.date).getTime())) {
            errors.push('比赛日期格式不正确');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 预览题目生成结果
     */
    previewProblems(contestData, problemCount) {
        try {
            const validation = this.validateContestData(contestData);
            if (!validation.isValid) {
                throw new Error('比赛数据验证失败: ' + validation.errors.join(', '));
            }

            const config = this.platformConfigs[contestData.platform] || this.platformConfigs['自定义'];
            const letters = 'ABCDEFGHIJKLMNO'.slice(0, problemCount);
            const contestId = this.extractContestId(contestData.url, contestData.platform);
            const contestPrefix = this.sanitizeContestName(contestData.name);

            const preview = letters.split('').map((letter, index) => ({
                letter: letter,
                title: `${contestData.name} - ${letter}`,
                id: `${contestPrefix}-${letter.toLowerCase()}`,
                url: this.generateProblemUrl(config, contestId, letter),
                difficulty: config.defaultDifficulties[index] || 1000,
                tags: this.generateDefaultTags(contestData)
            }));

            return {
                success: true,
                preview: preview,
                summary: {
                    contestName: contestData.name,
                    platform: contestData.platform,
                    problemCount: problemCount,
                    contestPrefix: contestPrefix,
                    hasUrls: preview.some(p => p.url)
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        // 清理引用
        this.storage = null;
        this.platformConfigs = null;
        console.log('ContestGenerator已清理');
    }
}