# A题官方题解

## Problem A: Simple Addition

### 题目描述
给定两个整数，输出它们的和。

### 解法说明
这是一道入门级别的题目，直接计算两数之和即可。

### 标准代码

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int a, b;
    cin >> a >> b;
    cout << a + b << "\\n";
    
    return 0;
}
```

### Python版本

```python
a, b = map(int, input().split())
print(a + b)
```

### 评分标准
- 正确输出：100分
- 格式错误：0分