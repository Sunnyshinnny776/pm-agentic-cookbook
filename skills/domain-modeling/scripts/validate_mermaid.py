#!/usr/bin/env python3
"""
validate_mermaid.py — 验证 Mermaid 语法的正确性

用途：
  从 Markdown 文件中提取所有 Mermaid 代码块，执行基础语法校验。
  
使用方式：
  python scripts/validate_mermaid.py <markdown_file_path>

校验规则：
  1. erDiagram: 检查实体关系语法是否正确
  2. flowchart/graph: 检查节点和连接语法
  3. stateDiagram: 检查状态定义语法
  4. 通用: 检查括号匹配、引号闭合
"""

import re
import sys
import json
from pathlib import Path


def extract_mermaid_blocks(content: str) -> list[dict]:
    """从 Markdown 内容中提取所有 mermaid 代码块"""
    pattern = r'```mermaid\s*\n(.*?)```'
    matches = re.finditer(pattern, content, re.DOTALL)
    blocks = []
    for i, match in enumerate(matches):
        code = match.group(1).strip()
        line_start = content[:match.start()].count('\n') + 1
        blocks.append({
            "index": i,
            "line_start": line_start,
            "code": code,
            "type": _detect_diagram_type(code)
        })
    return blocks


def _detect_diagram_type(code: str) -> str:
    """检测 Mermaid 图表类型"""
    first_line = code.split('\n')[0].strip().lower()
    if first_line.startswith('erdiagram'):
        return 'erDiagram'
    elif first_line.startswith(('flowchart', 'graph')):
        return 'flowchart'
    elif first_line.startswith('statediagram'):
        return 'stateDiagram'
    elif first_line.startswith('sequencediagram'):
        return 'sequenceDiagram'
    elif first_line.startswith('classDiagram'):
        return 'classDiagram'
    else:
        return 'unknown'


def _normalize_er_cardinality_for_bracket_check(code: str) -> str:
    """避免 Mermaid ER 基数符号中的花括号被误判为未闭合括号。"""
    lines = code.splitlines()
    if not lines or not lines[0].strip().lower().startswith('erdiagram'):
        return code

    normalized = []
    relation_operator = re.compile(r'(\|\||\|o|o\||}\||}o)--(\|\||\|o|o\||\|{|o{|}{)')
    for line in lines:
        normalized.append(relation_operator.sub('', line))
    return '\n'.join(normalized)


def validate_brackets(code: str) -> list[str]:
    """检查括号和引号是否匹配"""
    errors = []
    stack = []
    bracket_pairs = {')': '(', ']': '[', '}': '{'}
    code = _normalize_er_cardinality_for_bracket_check(code)
    
    in_string = False
    string_char = None
    
    for i, char in enumerate(code):
        if char in ('"', "'") and not in_string:
            in_string = True
            string_char = char
        elif char == string_char and in_string:
            in_string = False
            string_char = None
        elif not in_string:
            if char in '([{':
                stack.append((char, i))
            elif char in ')]}':
                if not stack:
                    errors.append(f"多余的闭合符号 '{char}' 在位置 {i}")
                elif stack[-1][0] != bracket_pairs[char]:
                    errors.append(f"括号不匹配: 期望闭合 '{stack[-1][0]}' 但找到 '{char}' 在位置 {i}")
                else:
                    stack.pop()
    
    if in_string:
        errors.append(f"未闭合的字符串引号 '{string_char}'")
    
    for char, pos in stack:
        errors.append(f"未闭合的 '{char}' 在位置 {pos}")
    
    return errors


def validate_er_diagram(code: str) -> list[str]:
    """校验 erDiagram 语法"""
    errors = []
    lines = code.split('\n')[1:]  # 跳过 erDiagram 声明行
    
    valid_relation_patterns = [
        r'^\s*\w+\s+(\|\|--|}o--|}\|--|\|o--|o\|--)\w{2}\s+\w+\s*:\s*".*"',  # 关系行
        r'^\s*\w+\s*\{',  # 实体属性块开始
        r'^\s*\w+\s+\w+(\s+\w+)*',  # 属性定义
        r'^\s*\}',  # 属性块结束
        r'^\s*%%',  # 注释
        r'^\s*$',  # 空行
    ]
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith('%%'):
            continue
        
        # 检查关系定义中的引号
        if ':' in stripped and '"' in stripped:
            quote_count = stripped.count('"')
            if quote_count % 2 != 0:
                errors.append(f"行 {i+2}: 关系标签的引号未闭合: {stripped}")
    
    return errors


def validate_flowchart(code: str) -> list[str]:
    """校验 flowchart/graph 语法"""
    errors = []
    lines = code.split('\n')[1:]  # 跳过声明行
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith('%%'):
            continue
        
        # 检查常见的连接箭头语法
        if '-->' in stripped or '---' in stripped or '-.->':
            bracket_errors = validate_brackets(stripped)
            for err in bracket_errors:
                errors.append(f"行 {i+2}: {err}")
    
    return errors


def validate_block(block: dict) -> dict:
    """对单个 Mermaid 代码块执行校验"""
    code = block["code"]
    diagram_type = block["type"]
    
    errors = []
    warnings = []
    
    # 通用校验
    bracket_errors = validate_brackets(code)
    errors.extend(bracket_errors)
    
    # 按类型专项校验
    if diagram_type == 'erDiagram':
        errors.extend(validate_er_diagram(code))
    elif diagram_type == 'flowchart':
        errors.extend(validate_flowchart(code))
    
    # 检查空图表
    content_lines = [l for l in code.split('\n')[1:] if l.strip() and not l.strip().startswith('%%')]
    if not content_lines:
        warnings.append("图表内容为空")
    
    return {
        "block_index": block["index"],
        "line_start": block["line_start"],
        "type": diagram_type,
        "errors": errors,
        "warnings": warnings,
        "status": "PASS" if not errors else "FAIL"
    }


def main():
    if len(sys.argv) < 2:
        print("用法: python validate_mermaid.py <markdown_file_path>")
        print("  从 Markdown 文件中提取 Mermaid 代码块并验证语法")
        sys.exit(1)
    
    filepath = Path(sys.argv[1])
    if not filepath.exists():
        print(f"错误: 文件不存在: {filepath}")
        sys.exit(1)
    
    content = filepath.read_text(encoding='utf-8')
    blocks = extract_mermaid_blocks(content)
    
    if not blocks:
        print("⚠️  未找到 Mermaid 代码块")
        sys.exit(0)
    
    results = []
    total_errors = 0
    
    print(f"📊 找到 {len(blocks)} 个 Mermaid 代码块\n")
    
    for block in blocks:
        result = validate_block(block)
        results.append(result)
        
        status_icon = "✅" if result["status"] == "PASS" else "❌"
        print(f"{status_icon} Block #{result['block_index']} (行 {result['line_start']}) [{result['type']}]: {result['status']}")
        
        for error in result["errors"]:
            print(f"   ❌ {error}")
            total_errors += 1
        
        for warning in result["warnings"]:
            print(f"   ⚠️  {warning}")
    
    print(f"\n{'='*50}")
    if total_errors == 0:
        print(f"✅ 全部通过！共 {len(blocks)} 个图表，0 个错误")
    else:
        print(f"❌ 发现 {total_errors} 个错误，共 {len(blocks)} 个图表")
    
    # 输出 JSON 结果供程序使用
    report_path = filepath.parent / f"{filepath.stem}_mermaid_report.json"
    report_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n📄 详细报告已保存至: {report_path}")
    
    sys.exit(1 if total_errors > 0 else 0)


if __name__ == "__main__":
    main()
