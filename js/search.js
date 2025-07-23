/**
 * ACM中转站 - 全局搜索管理器
 * 实现实时搜索、键盘导航和结果缓存功能
 */

class GlobalSearchManager {
    constructor(storage) {
        this.storage = storage;
        this.contests = [];
        this.problems = [];
        this.searchResults = [];
        this.isSearching = false;
        this.searchCache = new Map();
        this.selectedIndex = -1;
        this.initialized = false;
        
        this.initializeSearch();
    }

    async initializeSearch() {
        try {
            console.log('Initializing global search...');
            
            // Load data with Promise.allSettled for graceful degradation
            const [contestsResult, problemsResult] = await Promise.allSettled([
                this.storage.loadContests(),
                this.storage.loadProblems()
            ]);
            
            this.contests = contestsResult.status === 'fulfilled' && Array.isArray(contestsResult.value) 
                ? contestsResult.value 
                : [];
            this.problems = problemsResult.status === 'fulfilled' && Array.isArray(problemsResult.value) 
                ? problemsResult.value 
                : [];
            
            console.log(`Search data loaded: ${this.contests.length} contests, ${this.problems.length} problems`);
            
            this.setupSearchUI();
            this.bindSearchEvents();
            
            this.initialized = true;
            console.log('Global search initialized successfully');
        } catch (error) {
            console.error('Search initialization failed:', error);
        }
    }

    setupSearchUI() {
        const navbar = document.querySelector('.navbar .container');
        if (navbar && !document.getElementById('global-search')) {
            const searchHTML = `
                <div class="search-container" id="global-search">
                    <div class="search-input-wrapper">
                        <input type="text" 
                               id="search-input" 
                               placeholder="搜索题目、比赛..." 
                               autocomplete="off"
                               class="search-input">
                        <div class="search-icon">🔍</div>
                    </div>
                    <div class="search-results" id="search-results"></div>
                </div>
            `;
            navbar.insertAdjacentHTML('beforeend', searchHTML);
            
            // Add search styles
            this.addSearchStyles();
        }
    }

    addSearchStyles() {
        if (document.getElementById('search-styles')) return;
        
        const styles = `
            <style id="search-styles">
                .search-container {
                    position: relative;
                    margin-left: auto;
                    width: 300px;
                }

                .search-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-input {
                    width: 100%;
                    padding: 0.5rem 2.5rem 0.5rem 1rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    background: white;
                    transition: all 0.2s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .search-icon {
                    position: absolute;
                    right: 0.75rem;
                    color: #6b7280;
                    pointer-events: none;
                }

                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #d1d5db;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                }

                .search-result-item {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.15s ease;
                }

                .search-result-item:hover,
                .search-result-item.selected {
                    background-color: #f9fafb;
                }

                .search-result-item:last-child {
                    border-bottom: none;
                }

                .search-result-title {
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 0.25rem;
                }

                .search-result-meta {
                    font-size: 0.75rem;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .search-result-type {
                    background: #f3f4f6;
                    padding: 0.125rem 0.375rem;
                    border-radius: 4px;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .search-result-type.contest {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .search-result-type.problem {
                    background: #dcfce7;
                    color: #166534;
                }

                .search-no-results {
                    padding: 1rem;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .search-loading {
                    padding: 1rem;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                @media (max-width: 768px) {
                    .search-container {
                        width: 200px;
                    }
                    
                    .search-input {
                        font-size: 0.8rem;
                        padding: 0.4rem 2rem 0.4rem 0.8rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput || !searchResults) return;

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            this.selectedIndex = -1;
            
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value.trim());
            }, 300);
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Focus/blur handling
        searchInput.addEventListener('focus', () => {
            if (this.searchResults.length > 0) {
                searchResults.style.display = 'block';
            }
        });

        searchInput.addEventListener('blur', () => {
            // Delay hiding to allow clicking on results
            setTimeout(() => {
                searchResults.style.display = 'none';
            }, 200);
        });

        // Click outside to hide
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    async performSearch(query) {
        if (!query) {
            this.hideSearchResults();
            return;
        }

        // Check cache first
        if (this.searchCache.has(query)) {
            this.displaySearchResults(this.searchCache.get(query));
            return;
        }

        this.isSearching = true;
        this.showLoadingState();
        
        try {
            const results = this.searchItems(query);
            this.searchResults = results;
            this.searchCache.set(query, results);
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showErrorState('搜索失败');
        } finally {
            this.isSearching = false;
        }
    }

    searchItems(query) {
        const queryLower = query.toLowerCase();
        const results = [];

        // Search contests
        this.contests.forEach(contest => {
            const score = this.calculateSearchScore(contest, queryLower, 'contest');
            if (score > 0) {
                results.push({
                    type: 'contest',
                    item: contest,
                    score: score,
                    url: `contest-detail.html?id=${contest.id}`,
                    title: contest.name,
                    subtitle: `${contest.platform} • ${this.formatDate(contest.date)}`
                });
            }
        });

        // Search problems
        this.problems.forEach(problem => {
            const score = this.calculateSearchScore(problem, queryLower, 'problem');
            if (score > 0) {
                results.push({
                    type: 'problem',
                    item: problem,
                    score: score,
                    url: `problem-detail.html?id=${problem.id}`,
                    title: problem.title,
                    subtitle: `${problem.platform} • ${this.getStatusText(problem.status)}`
                });
            }
        });

        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    calculateSearchScore(item, query, type) {
        let score = 0;
        
        // Title matching (highest weight)
        if (item.title && item.title.toLowerCase().includes(query)) {
            score += item.title.toLowerCase() === query ? 100 : 50;
        }
        
        // Platform matching
        if (item.platform && item.platform.toLowerCase().includes(query)) {
            score += 30;
        }
        
        // Tag matching (problems only)
        if (type === 'problem' && item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                if (tag.toLowerCase().includes(query)) {
                    score += 20;
                }
            });
        }
        
        // ID matching
        if (item.id && item.id.toLowerCase().includes(query)) {
            score += 15;
        }
        
        // Contest-specific matching
        if (type === 'contest') {
            // Match contest name parts
            if (item.name && item.name.toLowerCase().split(' ').some(word => word.includes(query))) {
                score += 25;
            }
        }
        
        // Problem-specific matching
        if (type === 'problem') {
            // Match problem letter for contest problems
            if (item.problemLetter && item.problemLetter.toLowerCase() === query) {
                score += 40;
            }
            
            // Match contest ID
            if (item.contestId && item.contestId.toLowerCase().includes(query)) {
                score += 15;
            }
        }
        
        return score;
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    没有找到匹配的结果
                </div>
            `;
        } else {
            searchResults.innerHTML = results.map((result, index) => `
                <div class="search-result-item" 
                     data-index="${index}"
                     onclick="window.location.href='${result.url}'">
                    <div class="search-result-title">${this.escapeHtml(result.title)}</div>
                    <div class="search-result-meta">
                        <span class="search-result-type ${result.type}">${result.type === 'contest' ? '比赛' : '题目'}</span>
                        <span>${this.escapeHtml(result.subtitle)}</span>
                    </div>
                </div>
            `).join('');
        }

        searchResults.style.display = 'block';
        this.selectedIndex = -1;
    }

    showLoadingState() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="search-loading">
                    搜索中...
                </div>
            `;
            searchResults.style.display = 'block';
        }
    }

    showErrorState(message) {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    ${this.escapeHtml(message)}
                </div>
            `;
            searchResults.style.display = 'block';
        }
    }

    hideSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        this.selectedIndex = -1;
    }

    handleKeyboardNavigation(e) {
        const results = document.querySelectorAll('.search-result-item');
        if (results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
                this.updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && results[this.selectedIndex]) {
                    results[this.selectedIndex].click();
                }
                break;
                
            case 'Escape':
                this.hideSearchResults();
                e.target.blur();
                break;
        }
    }

    updateSelection() {
        const results = document.querySelectorAll('.search-result-item');
        results.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Utility methods
    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('zh-CN');
        } catch {
            return dateString || '';
        }
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public methods for external use
    refresh() {
        this.searchCache.clear();
        this.initializeSearch();
    }

    destroy() {
        // Clean up event listeners and DOM elements
        const searchContainer = document.getElementById('global-search');
        if (searchContainer) {
            searchContainer.remove();
        }
        
        const searchStyles = document.getElementById('search-styles');
        if (searchStyles) {
            searchStyles.remove();
        }
        
        this.searchCache.clear();
        console.log('Global search destroyed');
    }
}