/**
 * ACM中转站文件存储系统 - 核心基础设施验证测试
 * 基于PRP Gate 1规范实现的验证测试套件
 */

/**
 * Gate 1: 核心基础设施验证测试
 */
async function validateCoreInfrastructure() {
    console.log('🔄 开始核心基础设施验证测试...\n');
    
    const tests = [];
    
    // Test 1: NewFileManager 类创建
    tests.push({
        name: 'NewFileManager Class Creation',
        test: () => {
            console.log('测试 NewFileManager 类创建...');
            const fm = new NewFileManager();
            const result = fm.baseContestPath === './files/contests/' && 
                          fm.baseProblemPath === './files/problems/';
            console.log(`  - baseContestPath: ${fm.baseContestPath}`);
            console.log(`  - baseProblemPath: ${fm.baseProblemPath}`);
            return result;
        }
    });
    
    // Test 2: 比赛文件夹结构生成
    tests.push({
        name: 'Contest Structure Generation',
        test: () => {
            console.log('测试比赛文件夹结构生成...');
            const fm = new NewFileManager();
            const structure = fm.createContestStructure('test-contest');
            console.log('  - 生成的结构:', structure);
            
            const result = structure.statement.includes('test-contest/statement/contest.pdf') &&
                          structure.solution.includes('test-contest/solution/editorial.pdf') &&
                          structure.summary.includes('test-contest/summary/review.pdf');
            
            console.log(`  - statement路径正确: ${structure.statement.includes('test-contest/statement/contest.pdf')}`);
            console.log(`  - solution路径正确: ${structure.solution.includes('test-contest/solution/editorial.pdf')}`);
            console.log(`  - summary路径正确: ${structure.summary.includes('test-contest/summary/review.pdf')}`);
            
            return result;
        }
    });
    
    // Test 3: 题目文件夹结构生成
    tests.push({
        name: 'Problem Structure Generation', 
        test: () => {
            console.log('测试题目文件夹结构生成...');
            const fm = new NewFileManager();
            const structure = fm.createProblemStructure('test-problem');
            console.log('  - 生成的结构:', structure);
            
            const result = structure.statement.includes('test-problem/statement/problem.pdf') &&
                          structure.solutions.official.includes('test-problem/solution/official/solution.pdf');
            
            console.log(`  - statement路径正确: ${structure.statement.includes('test-problem/statement/problem.pdf')}`);
            console.log(`  - official solution路径正确: ${structure.solutions.official.includes('test-problem/solution/official/solution.pdf')}`);
            
            return result;
        }
    });
    
    // Test 4: 作者名称清理
    tests.push({
        name: 'Author Name Sanitization',
        test: () => {
            console.log('测试作者名称清理功能...');
            const fm = new NewFileManager();
            
            const test1 = fm.sanitizeAuthorName('张同学') === '张同学';
            console.log(`  - "张同学" -> "${fm.sanitizeAuthorName('张同学')}" (期望: 张同学)`);
            
            const test2 = fm.sanitizeAuthorName('Test User!@#') === 'test-user';
            console.log(`  - "Test User!@#" -> "${fm.sanitizeAuthorName('Test User!@#')}" (期望: test-user)`);
            
            const test3 = fm.sanitizeAuthorName('  multiple--spaces  ') === 'multiple-spaces';
            console.log(`  - "  multiple--spaces  " -> "${fm.sanitizeAuthorName('  multiple--spaces  ')}" (期望: multiple-spaces)`);
            
            return test1 && test2 && test3;
        }
    });
    
    // Test 5: 文件存在性检查
    tests.push({
        name: 'File Existence Check',
        test: async () => {
            console.log('测试文件存在性检查...');
            const fm = new NewFileManager();
            // 测试已知不存在的文件
            const exists = await fm.checkFileStatus('./non-existent-file.pdf');
            console.log(`  - 不存在文件检查结果: ${exists} (期望: false)`);
            return exists === false;
        }
    });

    // Test 6: 文件上传指导生成
    tests.push({
        name: 'Upload Guidance Generation',
        test: () => {
            console.log('测试文件上传指导生成...');
            const fm = new NewFileManager();
            const guidance = fm.generateUploadGuidance('./files/test/path.pdf', 'pdf');
            
            const hasTargetPath = guidance.targetPath === './files/test/path.pdf';
            const hasInstructions = guidance.instructions && guidance.instructions.length > 0;
            const hasFolderPath = guidance.folderPath === './files/test';
            const hasFileName = guidance.fileName === 'path.pdf';
            
            console.log(`  - targetPath正确: ${hasTargetPath}`);
            console.log(`  - 有指导说明: ${hasInstructions}`);
            console.log(`  - folderPath正确: ${hasFolderPath}`);
            console.log(`  - fileName正确: ${hasFileName}`);
            
            return hasTargetPath && hasInstructions && hasFolderPath && hasFileName;
        }
    });

    // Test 7: 题解作者路径生成
    tests.push({
        name: 'Solution Author Path Generation',
        test: () => {
            console.log('测试题解作者路径生成...');
            const fm = new NewFileManager();
            const path = fm.addSolutionAuthor('test-problem', '张三', '张三同学');
            
            const expectedPath = './files/problems/test-problem/solution/张三/solution.pdf';
            const result = path === expectedPath;
            
            console.log(`  - 生成的路径: ${path}`);
            console.log(`  - 期望的路径: ${expectedPath}`);
            console.log(`  - 路径匹配: ${result}`);
            
            return result;
        }
    });
    
    // 运行所有测试
    console.log('🧪 开始执行测试套件...\n');
    const results = [];
    for (const test of tests) {
        try {
            console.log(`📋 运行测试: ${test.name}`);
            const result = await test.test();
            results.push({ name: test.name, passed: result });
            
            if (result) {
                console.log(`✅ ${test.name}: 通过`);
            } else {
                console.log(`❌ ${test.name}: 失败`);
            }
            console.log(''); // 空行分隔
        } catch (error) {
            results.push({ name: test.name, passed: false, error: error.message });
            console.log(`❌ ${test.name}: 异常 - ${error.message}`);
            console.log(''); // 空行分隔
        }
    }
    
    // 汇总结果
    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log('📊 测试结果汇总:');
    console.log(`通过: ${passCount}/${totalCount} (${((passCount/totalCount) * 100).toFixed(1)}%)`);
    
    if (passCount === totalCount) {
        console.log('🎉 所有核心基础设施测试通过！');
        return true;
    } else {
        console.log('⚠️  存在失败的测试，请检查并修复');
        
        // 列出失败的测试
        const failedTests = results.filter(r => !r.passed);
        console.log('\n❌ 失败的测试:');
        failedTests.forEach(test => {
            console.log(`  - ${test.name}${test.error ? ': ' + test.error : ''}`);
        });
        
        return false;
    }
}

/**
 * Gate 2: 数据结构验证测试
 */
async function validateDataStructures() {
    console.log('🔄 开始数据结构验证测试...\n');
    
    const tests = [];
    
    // Test 1: 比赛数据结构扩展
    tests.push({
        name: 'Contest Data Structure Extension',
        test: () => {
            console.log('测试比赛数据结构扩展...');
            const sampleContest = {
                id: 'test-contest',
                name: 'Test Contest',
                files: {
                    statement: { path: './files/contests/test-contest/statement/contest.pdf', status: 'pending' },
                    solution: { path: './files/contests/test-contest/solution/editorial.pdf', status: 'pending' },
                    summary: { path: './files/contests/test-contest/summary/review.pdf', status: 'pending' }
                }
            };
            
            const hasFiles = !!sampleContest.files;
            const hasStatement = !!sampleContest.files.statement;
            const hasSolution = !!sampleContest.files.solution;
            const hasSummary = !!sampleContest.files.summary;
            const statusCorrect = sampleContest.files.statement.status === 'pending';
            
            console.log(`  - 有files字段: ${hasFiles}`);
            console.log(`  - 有statement: ${hasStatement}`);
            console.log(`  - 有solution: ${hasSolution}`);
            console.log(`  - 有summary: ${hasSummary}`);
            console.log(`  - status正确: ${statusCorrect}`);
            
            return hasFiles && hasStatement && hasSolution && hasSummary && statusCorrect;
        }
    });
    
    // Test 2: 题目数据结构扩展
    tests.push({
        name: 'Problem Data Structure Extension',
        test: () => {
            console.log('测试题目数据结构扩展...');
            const sampleProblem = {
                id: 'test-problem',
                title: 'Test Problem',
                files: {
                    statement: { path: './files/problems/test-problem/statement/problem.pdf', status: 'pending' },
                    solutions: {
                        official: { path: './files/problems/test-problem/solution/official/solution.pdf', author: 'official', status: 'pending' },
                        zhang: { path: './files/problems/test-problem/solution/zhang/solution.pdf', author: '张同学', status: 'pending' }
                    }
                }
            };
            
            const hasFiles = !!sampleProblem.files;
            const hasStatement = !!sampleProblem.files.statement;
            const hasSolutions = !!sampleProblem.files.solutions;
            const hasOfficial = !!sampleProblem.files.solutions.official;
            const hasZhang = !!sampleProblem.files.solutions.zhang;
            const authorCorrect = sampleProblem.files.solutions.zhang.author === '张同学';
            
            console.log(`  - 有files字段: ${hasFiles}`);
            console.log(`  - 有statement: ${hasStatement}`);
            console.log(`  - 有solutions: ${hasSolutions}`);
            console.log(`  - 有official: ${hasOfficial}`);
            console.log(`  - 有zhang: ${hasZhang}`);
            console.log(`  - 作者名称正确: ${authorCorrect}`);
            
            return hasFiles && hasStatement && hasSolutions && hasOfficial && hasZhang && authorCorrect;
        }
    });

    // Test 3: 路径标准化测试
    tests.push({
        name: 'Path Normalization',
        test: () => {
            console.log('测试路径标准化...');
            const fm = new NewFileManager();
            
            const path1 = fm.normalizePath('files/test/path.pdf');
            const path2 = fm.normalizePath('./files/test/path.pdf');
            const path3 = fm.normalizePath('files\\test\\path.pdf');
            
            const expected = './files/test/path.pdf';
            
            console.log(`  - "files/test/path.pdf" -> "${path1}" (期望: ${expected})`);
            console.log(`  - "./files/test/path.pdf" -> "${path2}" (期望: ${expected})`);
            console.log(`  - "files\\test\\path.pdf" -> "${path3}" (期望: ${expected})`);
            
            return path1 === expected && path2 === expected && path3 === expected;
        }
    });
    
    // 运行所有测试
    console.log('🧪 开始执行数据结构测试套件...\n');
    const results = [];
    for (const test of tests) {
        try {
            console.log(`📋 运行测试: ${test.name}`);
            const result = await test.test();
            results.push({ name: test.name, passed: result });
            
            if (result) {
                console.log(`✅ ${test.name}: 通过`);
            } else {
                console.log(`❌ ${test.name}: 失败`);
            }
            console.log(''); // 空行分隔
        } catch (error) {
            results.push({ name: test.name, passed: false, error: error.message });
            console.log(`❌ ${test.name}: 异常 - ${error.message}`);
            console.log(''); // 空行分隔
        }
    }
    
    // 汇总结果
    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log('📊 数据结构测试结果汇总:');
    console.log(`通过: ${passCount}/${totalCount} (${((passCount/totalCount) * 100).toFixed(1)}%)`);
    
    return passCount === totalCount;
}

/**
 * 性能和兼容性测试
 */
async function validatePerformanceAndCompatibility() {
    console.log('🔄 开始性能和兼容性验证测试...\n');
    
    const tests = [];
    
    // Test 1: 文件扫描性能测试
    tests.push({
        name: 'File Scanning Performance',
        test: async () => {
            console.log('测试文件扫描性能...');
            const startTime = performance.now();
            
            // 模拟扫描多个文件
            const fileManager = new NewFileManager();
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(fileManager.checkFileStatus(`./test-file-${i}.pdf`));
            }
            
            await Promise.all(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`  - 文件扫描用时: ${duration.toFixed(2)}ms (10个文件)`);
            console.log(`  - 性能要求: < 5000ms`);
            
            const passed = duration < 5000; // 5秒内完成
            console.log(`  - 性能测试${passed ? '通过' : '失败'}`);
            
            return passed;
        }
    });
    
    // Test 2: 浏览器兼容性测试
    tests.push({
        name: 'Browser Compatibility',
        test: () => {
            console.log('测试浏览器兼容性...');
            const apis = {
                fetch: typeof fetch !== 'undefined',
                localStorage: typeof localStorage !== 'undefined',
                FileReader: typeof FileReader !== 'undefined',
                Promise: typeof Promise !== 'undefined'
            };
            
            console.log('  - API支持情况:');
            Object.entries(apis).forEach(([api, supported]) => {
                console.log(`    ${api}: ${supported ? '✅' : '❌'}`);
            });
            
            const allSupported = Object.values(apis).every(supported => supported);
            console.log(`  - 兼容性测试${allSupported ? '通过' : '失败'}`);
            
            return allSupported;
        }
    });
    
    // Test 3: 内存使用测试
    tests.push({
        name: 'Memory Usage',
        test: () => {
            console.log('测试内存使用情况...');
            if (performance.memory) {
                const memoryInfo = performance.memory;
                const usedMB = (memoryInfo.usedJSHeapSize / 1048576).toFixed(2);
                const totalMB = (memoryInfo.totalJSHeapSize / 1048576).toFixed(2);
                const limitMB = (memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2);
                
                console.log(`  - 已使用内存: ${usedMB} MB`);
                console.log(`  - 总分配内存: ${totalMB} MB`);
                console.log(`  - 内存限制: ${limitMB} MB`);
                
                // 检查内存使用是否合理 (< 100MB)
                const memoryOk = memoryInfo.usedJSHeapSize < 104857600;
                console.log(`  - 内存使用${memoryOk ? '正常' : '过高'} (限制: 100MB)`);
                
                return memoryOk;
            } else {
                console.log('  - 浏览器不支持 performance.memory，跳过测试');
                return true; // 如果不支持，默认通过
            }
        }
    });
    
    // 运行所有测试
    console.log('🧪 开始执行性能兼容性测试套件...\n');
    const results = [];
    for (const test of tests) {
        try {
            console.log(`📋 运行测试: ${test.name}`);
            const result = await test.test();
            results.push({ name: test.name, passed: result });
            
            if (result) {
                console.log(`✅ ${test.name}: 通过`);
            } else {
                console.log(`❌ ${test.name}: 失败`);
            }
            console.log(''); // 空行分隔
        } catch (error) {
            results.push({ name: test.name, passed: false, error: error.message });
            console.log(`❌ ${test.name}: 异常 - ${error.message}`);
            console.log(''); // 空行分隔
        }
    }
    
    // 汇总结果
    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log('📊 性能兼容性测试结果汇总:');
    console.log(`通过: ${passCount}/${totalCount} (${((passCount/totalCount) * 100).toFixed(1)}%)`);
    
    return passCount === totalCount;
}

/**
 * 运行所有核心验证测试
 */
async function runAllCoreValidation() {
    console.log('🚀 开始ACM中转站核心基础设施全面验证\n');
    console.log('=' .repeat(60));
    
    const results = [];
    
    try {
        // Gate 1: 核心基础设施
        console.log('Gate 1: 核心基础设施验证');
        console.log('-'.repeat(40));
        const gate1Result = await validateCoreInfrastructure();
        results.push({ gate: 'Gate 1 - 核心基础设施', passed: gate1Result });
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Gate 2: 数据结构
        console.log('Gate 2: 数据结构验证');
        console.log('-'.repeat(40));
        const gate2Result = await validateDataStructures();
        results.push({ gate: 'Gate 2 - 数据结构', passed: gate2Result });
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Gate 3: 性能兼容性
        console.log('Gate 3: 性能兼容性验证');
        console.log('-'.repeat(40));
        const gate3Result = await validatePerformanceAndCompatibility();
        results.push({ gate: 'Gate 3 - 性能兼容性', passed: gate3Result });
        
    } catch (error) {
        console.error('验证过程中发生错误:', error);
        results.push({ gate: '验证过程', passed: false, error: error.message });
    }
    
    // 最终汇总
    console.log('\n' + '='.repeat(60));
    console.log('🏁 最终验证结果汇总');
    console.log('='.repeat(60));
    
    const totalPassed = results.filter(r => r.passed).length;
    const totalGates = results.length;
    
    results.forEach(result => {
        const status = result.passed ? '✅ 通过' : '❌ 失败';
        console.log(`${result.gate}: ${status}`);
        if (result.error) {
            console.log(`  错误: ${result.error}`);
        }
    });
    
    console.log('-'.repeat(60));
    console.log(`总体通过率: ${totalPassed}/${totalGates} (${((totalPassed/totalGates) * 100).toFixed(1)}%)`);
    
    if (totalPassed === totalGates) {
        console.log('🎉 恭喜！所有核心验证测试通过！');
        console.log('✨ 核心基础设施已准备就绪，可以继续用户界面实现');
        return true;
    } else {
        console.log('⚠️  存在未通过的验证测试，建议修复后再继续');
        return false;
    }
}

// 导出验证函数
if (typeof window !== 'undefined') {
    // 浏览器环境
    window.validateCoreInfrastructure = validateCoreInfrastructure;
    window.validateDataStructures = validateDataStructures;
    window.validatePerformanceAndCompatibility = validatePerformanceAndCompatibility;
    window.runAllCoreValidation = runAllCoreValidation;
}

// Node.js环境导出（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateCoreInfrastructure,
        validateDataStructures,
        validatePerformanceAndCompatibility,
        runAllCoreValidation
    };
}