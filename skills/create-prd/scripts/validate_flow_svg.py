#!/usr/bin/env python3
"""
业务流程图 / 架构图 SVG 完整性校验脚本

校验手绘 SVG 是否满足第10章 10.1 的完整性规则。这些缺陷肉眼审查极易漏过
（连线端点差十几像素、某个分支忘了画终点），必须由脚本兜住。

两种模式，因为流程图与架构图的完整性语义不同：

  --mode flow（默认，业务流程图）
    1. 箭头指空   —— 每条带 marker-end 的连线，终点必须落在某个节点边界上
    2. 孤立节点   —— 每个节点至少要有一条边与之相连
    3. 起止唯一   —— 有且仅有一个开始节点、一个结束节点；阻断节点须有后续连线
    4. 连线重叠   —— 同向平行线共线且区间重叠 > 12px（流向歧义）
    5. 文本重叠   —— 游离标注互相压盖（粗略估算）
    6. XML 良构

  --mode arch（系统框架图 / 应用架构图 / 功能模块架构图）
    1. 箭头指空   —— 终点须落在节点**或分层色带/分组**上（架构图的流向常指向"层"而非具体节点）
    2. XML 良构
    跳过孤立节点与起止节点检查：架构图靠色带表达归属，节点不必逐个连线，也没有流程终点。

用法：
  python3 validate_flow_svg.py path/to/*流程图.svg
  python3 validate_flow_svg.py --mode arch path/to/*架构图.svg
  python3 validate_flow_svg.py --node-class myshape path/to/x.svg   # 追加自定义节点 class

退出码：0 = 全部通过；1 = 存在缺陷。

已知局限（不要把本脚本当作图质量的完整保证）：
  - arch 模式允许箭头落在色带上，因此指向色带**空白处**的箭头无法识别；
    用 flow 模式校验架构图则会因架构图本身的形态大量误报——模式必须选对。
  - 只校验结构完整性，不校验语义：边标注是否写了状态、状态值是否与
    Domain Model 一致、泳道划分是否合理，仍需人工与 check-prd 审查。
  - 节点识别依赖 class 命名；项目若另起一套命名，须用 --node-class 追加，
    否则会误报"未识别到任何节点"。
"""

import argparse
import re
import sys
import xml.etree.ElementTree as ET

NS = '{http://www.w3.org/2000/svg}'

# 节点类 class：可被连线指向的实体。项目若使用其它命名，用 --node-class 追加。
# 同时收录手绘 SVG 与 flowgen.py 生成器两套命名，使生成器产物默认即可校验。
DEFAULT_NODE_CLASSES = {
    'n', 'box', 'dec', 'stop', 'term', 'docs', 'doc', 'side',
    'plat', 'db', 'ext', 'start',
    'step', 'state',                      # flowgen.py 的语义化命名
}
# 容器类 class：泳道、分层色带、阶段框、分组框——不是连线端点
CONTAINER_CLASSES = {'lane', 'lanehead', 'band', 'phase', 'grp', 'enumgrp'}

TOLERANCE = 6  # 端点与节点边界的允许误差（px）


def legend_subtree(root):
    """图例（<g class="legend">）内的元素不是真实节点/连线，校验时整体跳过。"""
    skip = set()
    for g in root.iter():
        if g.tag.replace(NS, '') == 'g' and (g.get('class') or '') == 'legend':
            for el in g.iter():
                skip.add(el)
    return skip


# 生成器 data-t 类型 → 校验用的语义类名
TYPE_ALIAS = {'terminal': 'term', 'start': 'start', 'stop': 'stop'}


def parse_tagged_boxes(root):
    """优先路径：读生成器写入的 <g class="nd" data-t data-bb>，边界与类型 100% 精确。"""
    boxes = []
    for el in root.iter():
        bb = el.get('data-bb')
        if not bb:
            continue
        try:
            x1, y1, x2, y2 = map(float, bb.split(','))
        except ValueError:
            continue
        t = el.get('data-t', '')
        boxes.append((x1, y1, x2, y2, TYPE_ALIAS.get(t, t)))
    return boxes


def parse_boxes(root, node_classes, include_containers=False):
    """提取所有节点的边界框 (x1, y1, x2, y2, class)

    include_containers=True 时把分层色带/分组也计入合法落点（架构图模式）。
    """
    boxes = []
    for el in root.iter():
        tag = el.tag.replace(NS, '')
        cls = (el.get('class') or '').strip()
        if cls in CONTAINER_CLASSES:
            if include_containers and tag == 'rect' and cls in ('band', 'grp', 'lane'):
                x, y = float(el.get('x', 0)), float(el.get('y', 0))
                w, h = float(el.get('width', 0)), float(el.get('height', 0))
                boxes.append((x, y, x + w, y + h, cls))
            continue
        if tag == 'rect' and cls in node_classes:
            x, y = float(el.get('x', 0)), float(el.get('y', 0))
            w, h = float(el.get('width', 0)), float(el.get('height', 0))
            boxes.append((x, y, x + w, y + h, cls))
        elif tag == 'ellipse':
            cx, cy = float(el.get('cx', 0)), float(el.get('cy', 0))
            rx, ry = float(el.get('rx', 0)), float(el.get('ry', 0))
            boxes.append((cx - rx, cy - ry, cx + rx, cy + ry, cls or 'ellipse'))
        elif tag == 'polygon':
            pts = [tuple(map(float, p.split(','))) for p in el.get('points', '').split() if ',' in p]
            if pts:
                xs, ys = [p[0] for p in pts], [p[1] for p in pts]
                boxes.append((min(xs), min(ys), max(xs), max(ys), cls or 'polygon'))
        elif tag == 'path' and cls in node_classes:
            # 卷角文档形等自定义路径节点：取 M x,y h w v h 起始段推边界
            m = re.match(r'M\s*([\d.]+),([\d.]+)\s+h\s*([\d.-]+)\s+v\s*([\d.-]+)', el.get('d', ''))
            if m:
                x, y, w, h = map(float, m.groups())
                x1, x2 = sorted((x, x + w))
                y1, y2 = sorted((y, y + h))
                boxes.append((x1, y1, x2, y2, cls))
    return boxes


def parse_edges(root, skip=frozenset()):
    """提取所有连线的起点与终点，标记是否带箭头；skip 内的元素（图例）忽略。"""
    edges = []
    for el in root.iter():
        if el in skip:
            continue
        tag = el.tag.replace(NS, '')
        cls = (el.get('class') or '').strip()
        arrow = bool(el.get('marker-end'))
        if tag == 'line':
            edges.append((
                (float(el.get('x1', 0)), float(el.get('y1', 0))),
                (float(el.get('x2', 0)), float(el.get('y2', 0))),
                arrow, cls,
            ))
        elif tag == 'path' and cls in ('edge', 'dash', 'flow'):
            coords = re.findall(r'[MLHV]?\s*([\d.]+),([\d.]+)', el.get('d', ''))
            if len(coords) >= 2:
                start = tuple(map(float, coords[0]))
                end = tuple(map(float, coords[-1]))
                edges.append((start, end, arrow, cls))
    return edges


def parse_labels(root):
    """提取所有游离文本（边标注/说明/图例）的粗略包围盒，用于重叠检测。

    text-anchor=middle 时以 x 为中心，其余以 x 为左端。宽度按字符数估算
    （中文/全角按 1 字宽，ASCII 按 0.5），估算偏保守，只报明显重叠。
    """
    labels = []
    for el in root.iter():
        if el.tag.replace(NS, '') != 'text':
            continue
        cls = (el.get('class') or '').strip()
        if cls not in ('lbl', 'lbls', 'dlbl', 'note', 'doct', 'sidet'):
            continue  # 只查游离标注类文本，节点内文字不算
        txt = ''.join(el.itertext())
        if not txt.strip():
            continue
        try:
            x, y = float(el.get('x', 0)), float(el.get('y', 0))
        except ValueError:
            continue
        fs = float(el.get('font-size', '11').replace('px', '')) if el.get('font-size') else 11.0
        w = sum(1.0 if ord(c) > 0x2500 else 0.55 for c in txt) * fs
        anchor = el.get('text-anchor', 'start')
        x1 = x - w / 2 if anchor == 'middle' else x
        # 包围盒高度取实际字形（上升 0.72em + 下降 0.12em），使 12px 正常行距不误报，
        # 只有间距小于字高（≈同位重叠）才判定。
        labels.append((x1, y - fs * 0.72, x1 + w, y + fs * 0.12, cls, txt[:16]))
    return labels


def boxes_overlap(a, b, min_area=30):
    ax1, ay1, ax2, ay2 = a[:4]
    bx1, by1, bx2, by2 = b[:4]
    ix = max(0, min(ax2, bx2) - max(ax1, bx1))
    iy = max(0, min(ay2, by2) - max(ay1, by1))
    return ix * iy >= min_area


def edge_polylines(root, skip=frozenset()):
    """返回每条连线的完整折点序列 [(x,y), ...]，用于逐段检测共线重叠。"""
    out = []
    for el in root.iter():
        if el in skip:
            continue
        tag = el.tag.replace(NS, '')
        cls = (el.get('class') or '').strip()
        if tag == 'line' and cls in ('edge', 'dash', 'flow'):
            out.append(([(float(el.get('x1', 0)), float(el.get('y1', 0))),
                         (float(el.get('x2', 0)), float(el.get('y2', 0)))], cls))
        elif tag == 'path' and cls in ('edge', 'dash', 'flow'):
            pts = [(float(a), float(b)) for a, b in
                   re.findall(r'[ML]\s*([\d.]+),([\d.]+)', el.get('d', ''))]
            if len(pts) >= 2:
                out.append((pts, cls))
    return out


def near_box(pt, box, tol=TOLERANCE):
    x, y = pt
    x1, y1, x2, y2, _ = box
    return x1 - tol <= x <= x2 + tol and y1 - tol <= y <= y2 + tol


def validate(path, node_classes, mode):
    problems = []
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as e:
        return [f'XML 解析失败：{e}']

    is_arch = (mode == 'arch')
    skip = legend_subtree(root)   # 图例内的缩略图形/示例连线不参与校验
    # 优先用生成器写入的节点元信息；手绘图回退到按形状 class 识别。
    # 图例缩略图形没有 data-bb，因此在优先路径下天然被排除。
    boxes = parse_tagged_boxes(root) or parse_boxes(root, node_classes, include_containers=is_arch)
    edges = parse_edges(root, skip)

    if not boxes:
        return ['未识别到任何节点——检查 class 命名是否在节点白名单内（可用 --node-class 追加）']

    # 1. 箭头指空（两种模式都查；架构图允许落在色带/分组上）
    for start, end, arrow, cls in edges:
        if not arrow:
            continue
        if not any(near_box(end, b) for b in boxes):
            problems.append(f'箭头指空：({end[0]:.0f},{end[1]:.0f}) class={cls or "-"}')

    if is_arch:
        return problems

    # 2. 孤立节点（仅流程图：架构图靠色带表达归属，节点不必逐个连线）
    # 说明框/说明卡片是旁注，本就不接入流程，允许无连线
    node_boxes = [b for b in boxes if b[4] not in ('side', 'note')]
    for b in node_boxes:
        touched = any(near_box(s, b) or near_box(e, b) for s, e, _, _ in edges)
        if not touched:
            cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            problems.append(f'孤立节点：class={b[4]} 中心≈({cx:.0f},{cy:.0f}) 无任何连线')

    # 3. 起止节点唯一性（仅流程图）：一图一个开始、一个正常结束
    classes = [b[4] for b in boxes]
    n_start, n_term = classes.count('start'), classes.count('term')
    if n_start == 0:
        problems.append('缺少起始节点（class="start"）')
    elif n_start > 1:
        problems.append(f'起始节点应唯一，当前 {n_start} 个——多入口会让流程起点不明确')
    if n_term != 1:
        problems.append(f'结束节点应唯一，当前 {n_term} 个——只有 class="term" 可以结束流程')
    for b in node_boxes:
        if b[4] in ('start', 'term'):
            continue
        if not any(near_box(s, b) for s, _, _, _ in edges):
            cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            problems.append(f'节点没有后续连线：class={b[4]} 中心≈({cx:.0f},{cy:.0f})')

    # 4. 连线重叠：拆出每条边的所有正交线段（含折线拐段），共线且区间重叠 → 流向歧义
    segs = []
    for pts, cls in edge_polylines(root, skip):
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            if abs(x1 - x2) < 2 and abs(y1 - y2) >= 2:
                segs.append(('V', round(x1), min(y1, y2), max(y1, y2)))
            elif abs(y1 - y2) < 2 and abs(x1 - x2) >= 2:
                segs.append(('H', round(y1), min(x1, x2), max(x1, x2)))
    for i in range(len(segs)):
        for j in range(i + 1, len(segs)):
            o1, k1, a1, b1 = segs[i]
            o2, k2, a2, b2 = segs[j]
            if o1 != o2 or abs(k1 - k2) > 2:
                continue
            ov = min(b1, b2) - max(a1, a2)
            if ov > 12:       # 重叠超过 12px 才报，避免端点相接的误报
                axis = 'x' if o1 == 'V' else 'y'
                problems.append(f'连线重叠：两条{"垂直" if o1=="V" else "水平"}线段共线于 {axis}≈{k1:.0f}，'
                                f'重叠约 {ov:.0f}px——会产生流向歧义，请错开')

    # 4. 游离文本重叠（粗略估算；抓边标注/图例互压——脚本兜不住细节，仍需渲染目视）
    labels = parse_labels(root)
    seen = set()
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            if boxes_overlap(labels[i], labels[j]):
                key = tuple(sorted((labels[i][5], labels[j][5])))
                if key in seen:
                    continue
                seen.add(key)
                problems.append(
                    f'文本疑似重叠：「{labels[i][5]}」({labels[i][0]:.0f},{labels[i][1]:.0f}) '
                    f'× 「{labels[j][5]}」({labels[j][0]:.0f},{labels[j][1]:.0f})'
                )

    return problems


def main():
    ap = argparse.ArgumentParser(description='业务流程图 / 架构图 SVG 完整性校验')
    ap.add_argument('files', nargs='+', help='待校验的 SVG 文件')
    ap.add_argument('--mode', choices=['flow', 'arch'], default='flow',
                    help='flow=业务流程图（默认，全部检查）；arch=架构图（仅查箭头落点）')
    ap.add_argument('--node-class', action='append', default=[],
                    help='追加自定义节点 class，可重复指定')
    args = ap.parse_args()

    node_classes = DEFAULT_NODE_CLASSES | set(args.node_class)
    checks = ('箭头落点' if args.mode == 'arch'
              else '箭头落点 / 孤立节点 / 起止节点')
    failed = False

    for path in args.files:
        problems = validate(path, node_classes, args.mode)
        name = path.split('/')[-1]
        if problems:
            failed = True
            print(f'✗ {name}：{len(problems)} 处问题')
            for p in problems:
                print(f'    {p}')
        else:
            print(f'✓ {name}：通过（{checks}）')

    if failed:
        print('\n校验未通过。修复后重新运行；不要以"肉眼看着没问题"替代本校验。')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
