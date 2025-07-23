#!/bin/bash

# ACM中转站通用文件上传工具
# 适用于多人协作，自动检测项目根目录

# 查找项目根目录（包含index.html的目录）
find_project_root() {
    local current_dir="$(pwd)"
    local check_dir="$current_dir"
    
    # 向上查找包含index.html的目录
    while [ "$check_dir" != "/" ]; do
        if [ -f "$check_dir/index.html" ] && [ -d "$check_dir/files" ]; then
            echo "$check_dir"
            return 0
        fi
        check_dir="$(dirname "$check_dir")"
    done
    
    # 如果在当前目录或父目录都没找到，检查脚本所在目录
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$script_dir/index.html" ] && [ -d "$script_dir/files" ]; then
        echo "$script_dir"
        return 0
    fi
    
    return 1
}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_usage() {
    echo -e "${BLUE}ACM中转站文件上传工具 (多人协作版)${NC}"
    echo "使用方法："
    echo "  $0 [文件路径] [类型] [子目录(可选)]"
    echo ""
    echo "文件类型："
    echo "  contest-pdf  - 比赛PDF文件 (支持子目录: codeforces, atcoder, icpc, ccpc, nowcoder, others)"
    echo "  problem-pdf  - 题目PDF文件"
    echo "  solution     - 题解文件"
    echo "  summary      - 总结报告"
    echo ""
    echo "示例："
    echo "  $0 ~/Downloads/contest.pdf contest-pdf codeforces"
    echo "  $0 solution.md solution"
    echo "  $0 problem-A.pdf problem-pdf"
    echo ""
    echo "也可以直接拖拽文件到终端："
    echo "  $0 [拖拽的文件]"
}

# 检查参数
if [ $# -lt 1 ]; then
    show_usage
    exit 1
fi

# 查找项目根目录
PROJECT_ROOT=$(find_project_root)
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 找不到ACM中转站项目根目录${NC}"
    echo "请确保在项目目录下运行此脚本，或将脚本放在项目根目录"
    exit 1
fi

FILES_DIR="$PROJECT_ROOT/files"
echo -e "${BLUE}项目根目录: $PROJECT_ROOT${NC}"

FILE_PATH="$1"
FILE_TYPE="${2:-auto}"
SUB_DIR="$3"

# 检查文件是否存在
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}错误: 文件不存在: $FILE_PATH${NC}"
    exit 1
fi

# 获取文件信息
FILENAME=$(basename "$FILE_PATH")
EXTENSION="${FILENAME##*.}"

# 自动检测文件类型
if [ "$FILE_TYPE" = "auto" ]; then
    case "$EXTENSION" in
        pdf)
            # 根据文件名判断是比赛PDF还是题目PDF
            if [[ "$FILENAME" =~ [Cc]ontest|[Rr]ound|[Dd]iv|ABC|ARC|AGC ]]; then
                FILE_TYPE="contest-pdf"
            else
                FILE_TYPE="problem-pdf"
            fi
            ;;
        md|txt)
            FILE_TYPE="solution"
            ;;
        cpp|py|java|c|js|go|rs)
            FILE_TYPE="solution"
            ;;
        *)
            echo -e "${YELLOW}警告: 无法自动检测文件类型，默认为solution${NC}"
            FILE_TYPE="solution"
            ;;
    esac
    echo -e "${BLUE}自动检测文件类型: $FILE_TYPE${NC}"
fi

# 确定目标目录
case "$FILE_TYPE" in
    contest-pdf)
        if [ -n "$SUB_DIR" ]; then
            TARGET_DIR="$FILES_DIR/contest-pdfs/$SUB_DIR"
        else
            # 尝试从文件名自动检测平台
            if [[ "$FILENAME" =~ [Cc]odeforces|CF|[Rr]ound ]]; then
                TARGET_DIR="$FILES_DIR/contest-pdfs/codeforces"
            elif [[ "$FILENAME" =~ [Aa]t[Cc]oder|ABC|ARC|AGC ]]; then
                TARGET_DIR="$FILES_DIR/contest-pdfs/atcoder"
            elif [[ "$FILENAME" =~ ICPC|[Ii]cpc ]]; then
                TARGET_DIR="$FILES_DIR/contest-pdfs/icpc"
            elif [[ "$FILENAME" =~ CCPC|[Cc]cpc ]]; then
                TARGET_DIR="$FILES_DIR/contest-pdfs/ccpc"
            elif [[ "$FILENAME" =~ [Nn]ow[Cc]oder ]]; then
                TARGET_DIR="$FILES_DIR/contest-pdfs/nowcoder"
            else
                TARGET_DIR="$FILES_DIR/contest-pdfs/others"
            fi
        fi
        ;;
    problem-pdf)
        TARGET_DIR="$FILES_DIR/contest-pdfs"
        ;;
    solution)
        TARGET_DIR="$FILES_DIR/solutions"
        ;;
    summary)
        TARGET_DIR="$FILES_DIR/summaries"
        ;;
    *)
        echo -e "${RED}错误: 不支持的文件类型: $FILE_TYPE${NC}"
        show_usage
        exit 1
        ;;
esac

# 创建目标目录
mkdir -p "$TARGET_DIR"

# 标准化文件名（保持跨平台兼容性）
SAFE_FILENAME=$(echo "$FILENAME" | sed 's/[^a-zA-Z0-9._-]/_/g')

# 生成唯一文件名（如果文件已存在）
TARGET_PATH="$TARGET_DIR/$SAFE_FILENAME"
COUNTER=1
BASE_NAME="${SAFE_FILENAME%.*}"
EXT="${SAFE_FILENAME##*.}"

while [ -f "$TARGET_PATH" ]; do
    if [ "$BASE_NAME" = "$EXT" ]; then
        # 没有扩展名的情况
        NEW_FILENAME="${BASE_NAME}_${COUNTER}"
    else
        # 有扩展名的情况
        NEW_FILENAME="${BASE_NAME}_${COUNTER}.${EXT}"
    fi
    TARGET_PATH="$TARGET_DIR/$NEW_FILENAME"
    COUNTER=$((COUNTER + 1))
done

# 复制文件
cp "$FILE_PATH" "$TARGET_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件上传成功!${NC}"
    echo -e "  原文件: ${BLUE}$FILE_PATH${NC}"
    echo -e "  目标位置: ${BLUE}$TARGET_PATH${NC}"
    
    # 生成相对路径（相对于项目根目录）
    REL_PATH="./files/$(basename "$TARGET_DIR")/$(basename "$TARGET_PATH")"
    if [[ "$TARGET_DIR" == *"contest-pdfs/"* ]] && [[ "$TARGET_DIR" != "$FILES_DIR/contest-pdfs" ]]; then
        # 包含子目录的情况
        SUB_PATH=$(echo "$TARGET_DIR" | sed "s|$FILES_DIR/||")
        REL_PATH="./files/$SUB_PATH/$(basename "$TARGET_PATH")"
    fi
    
    echo -e "  相对路径: ${GREEN}$REL_PATH${NC}"
    
    # 复制相对路径到剪贴板
    if command -v pbcopy >/dev/null 2>&1; then
        echo -n "$REL_PATH" | pbcopy
        echo -e "${GREEN}✓ 相对路径已复制到剪贴板${NC}"
    elif command -v xclip >/dev/null 2>&1; then
        echo -n "$REL_PATH" | xclip -selection clipboard
        echo -e "${GREEN}✓ 相对路径已复制到剪贴板${NC}"
    elif command -v clip >/dev/null 2>&1; then
        echo -n "$REL_PATH" | clip
        echo -e "${GREEN}✓ 相对路径已复制到剪贴板${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}提示: 在ACM中转站界面中粘贴上述相对路径即可${NC}"
    
else
    echo -e "${RED}✗ 文件上传失败${NC}"
    exit 1
fi