# B题解法 - 字符串处理

## 题目理解

这道题要求我们处理字符串，找出满足条件的子串。

## 解题步骤

1. 遍历字符串的每个位置
2. 检查以当前位置开始的子串
3. 判断是否满足题目条件
4. 统计或输出结果

## 代码实现

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    
    int count = 0;
    for (int i = 0; i < s.length(); i++) {
        // 处理逻辑
        if (s[i] == 'a') {
            count++;
        }
    }
    
    cout << count << endl;
    return 0;
}
```

## 时间复杂度

O(n) - 其中n是字符串长度