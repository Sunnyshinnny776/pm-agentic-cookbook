#!/usr/bin/env python3
"""
数据驱动的泳道流程图生成器（PRD 业务流程图的标准出图引擎）。

你只写「泳道 + 节点(所属泳道/行/类型/文字/状态) + 连线(from→to/标签)」，
坐标、布局、连线锚点、箭头贴边、样式全自动。视觉一致性由统一样式令牌(TOKENS)
强制保证——所有图共用同一套 class 与色板，改令牌即全局改样式。

用法见同目录 flowgen_example.py。规范见宿主 UI/UX spec 中的图示规则（宿主契约 host.specMap 的 ui-ux 角色）。

内建的绘图规则（改这里 = 所有图全部生效，不靠人逐图遵守）：
  1. 状态只写一处：状态由「状态落地点」节点(type=state)承载，边只标动作。
  2. 连线路由：同列→垂直直连，同行→水平直连，真跨行跨列→单拐点折线(按主方向选拐向)；
     回到前序步骤的连线用 loop=True，从源节点底部引出、经两端节点左侧绕行、接入目标左侧，不压主干。
  3. 主干走泳道中心线(xoff=0)，只有旁路分支(如阻断)才用 xoff 横向偏移。
  4. 泳道整体宽度 = 标题宽度：左右边距统一为 MARGIN。
  5. 一步一节点：一个 node 只画一个环节；禁止把「A → B → C」多步塞进一个节点的文字。
  6. 泳道宽度按内容自适应(_compute_lanes)：有旁路/宽节点的泳道自动加宽，不压缩、不跨界。
  7. 一图仅一个 start、一个 terminal；stop 是流程内阻断节点，须连到后续处理。
  8. 图底自动生成图例条，标注本图用到的每种图形与两类连线。
  9. 同源多出边自动错开(_auto_gaps)，避免连线共线重叠造成流向歧义。
 10. 出图后仍须渲染 PNG 目视：脚本保证结构，可读性/美观由渲染确认(见宿主 UI/UX spec 中的图示规则)。

节点类型(type)：start 起止胶囊 / step 处理步骤矩形 / decision 判定菱形 /
  state 状态落点(卷角文档形，承载状态) / subprocess 子流程(双竖线矩形) /
  data 数据落点(平行四边形) / database 数据库(圆柱) / docstack 文件落点(多层文档) /
  note 说明卡片(折角便签，旁注不接边) / stop 阻断待处理 / terminal 唯一结束胶囊。

不依赖任何厂商：纯 Python 标准库出 SVG，SVG 是 W3C 标准，任何工具都能渲染/再编辑。
"""
import html

# ── 设计令牌：一处定义，所有图、所有节点共用（一致性的来源）──────────────
TOKENS = {
    "font": "'PingFang SC','Microsoft YaHei',sans-serif",
    "ink": "#4A6FA5", "ink_d": "#3F5F94",
    "step_fill": "#7EA6E0", "step_text": "#ffffff",
    "dec_fill": "#DCE8F7", "dec_text": "#25395a",
    "state_fill": "#FFFFFF", "state_text": "#25395a",
    "stop_fill": "#F6D9D5", "stop_stroke": "#C0625A", "stop_text": "#7A2E28",
    "term_fill": "#CFE6C9", "term_stroke": "#6BA36B", "term_text": "#254a25",
    "start_fill": "#DCEAF9",
    "lane_fill": "#F7FAFD", "lane_stroke": "#C9D6E8", "lane_head": "#4A6FA5",
    "edge": "#4A6FA5", "elabel": "#4A6FA5",
    "title_bar": "#4A6FA5",
}
MIN_LANE_W, LANE_PAD, ROW_H = 300, 36, 128   # 泳道最小宽 + 内边距；实际宽按内容自适应
MARGIN, PAD_TOP, HEAD_H, TITLE_H = 20, 20, 30, 46
NODE_W = 220
LOOP_GAP = 20   # 回连绕行段与节点的间距
LEGEND_ROW_H = 28   # 图例换行时的行高
SIZES = {  # 各类型节点半宽/半高
    "step": (110, 26), "decision": (92, 42), "state": (110, 30),
    "stop": (74, 26), "start": (108, 20), "terminal": (120, 22),
    "subprocess": (110, 28), "note": (104, 28), "data": (104, 28),
    "database": (86, 34), "docstack": (100, 32),
}
LEGEND = [  # 图例：每张图底部统一标注，确保读者能读懂图形含义
    ("start", "起止"), ("step", "处理步骤"), ("decision", "判断"),
    ("state", "状态落点"), ("subprocess", "子流程"), ("data", "数据落点"),
    ("database", "数据库"), ("docstack", "文件落点"), ("note", "说明卡片"),
    ("stop", "阻断待处理"),
]


def esc(s): return html.escape(str(s), quote=True)


class Flow:
    def __init__(self, title, lanes):
        self.title, self.lanes = title, lanes
        self.nodes, self.edges = {}, []
        self.max_row = 0

    def node(self, id, lane, row, type, text, state=None, xoff=0):
        self.nodes[id] = dict(id=id, lane=lane, row=row, type=type, text=text, state=state, xoff=xoff)
        self.max_row = max(self.max_row, row)
        return self

    def edge(self, a, b, label=None, dashed=False, lane_gap=0, loop=False):
        """lane_gap: 折线水平段的额外下移量，用于错开同源多出边（避免共线重叠）。
        留空时由 _auto_gaps() 自动分配。
        loop: 回到前序步骤的连线（如阻断后回到修正步骤），绕行两端节点左侧。"""
        self.edges.append(dict(a=a, b=b, label=label, dashed=dashed, gap=lane_gap, loop=loop))
        return self

    def _auto_gaps(self):
        """同一源节点引出的多条折线型连线，其水平段自动逐条下移，避免共线重叠。"""
        by_src = {}
        for e in self.edges:
            if e["gap"] or e["loop"]:
                continue
            a, b = self.nodes[e["a"]], self.nodes[e["b"]]
            dx, dy = self._cx(b) - self._cx(a), self._cy(b) - self._cy(a)
            if abs(dx) >= 10 and abs(dy) >= 10:      # 只有折线型才需要错开
                by_src.setdefault(e["a"], []).append(e)
        for group in by_src.values():
            if len(group) > 1:
                for i, e in enumerate(group[1:], start=1):
                    e["gap"] = i * 34

    def _compute_lanes(self):
        """按内容自适应算每个泳道的宽度与主列 x：有旁路/宽节点的泳道自动加宽。"""
        geom, x = {}, MARGIN
        for lane in self.lanes:
            left = right = MIN_LANE_W / 2 - LANE_PAD   # 保底到最小宽
            for n in self.nodes.values():
                if n["lane"] != lane:
                    continue
                hw, off = SIZES[n["type"]][0], n.get("xoff", 0)
                left = max(left, hw - off)             # 主列左侧需要的空间
                right = max(right, hw + off)           # 主列右侧需要的空间
            w = left + right + 2 * LANE_PAD
            geom[lane] = {"x": x, "main": x + left + LANE_PAD, "w": w}
            x += w
        self._lane_geom = geom
        self._total_w = x + MARGIN

    # 节点中心坐标：泳道主列决定 x（自适应），行决定 y —— 全自动，无手算
    def _cx(self, n): return self._lane_geom[n["lane"]]["main"] + n.get("xoff", 0)
    def _cy(self, n): return PAD_TOP + TITLE_H + HEAD_H + 40 + n["row"] * ROW_H

    def _bbox(self, n):
        hw, hh = SIZES[n["type"]]
        cx, cy = self._cx(n), self._cy(n)
        return cx - hw, cy - hh, cx + hw, cy + hh

    def _edge_point(self, n, side):
        """节点某条边的中点。菱形顶点恰好落在 bbox 各边中点，故此函数通用。"""
        x1, y1, x2, y2 = self._bbox(n)
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        return {"top": (cx, y1), "bottom": (cx, y2), "left": (x1, cy), "right": (x2, cy)}[side]

    def render(self):
        self._compute_lanes()
        self._auto_gaps()
        W = self._total_w
        legend = self._legend_layout(W)
        H = PAD_TOP + TITLE_H + HEAD_H + 40 + self.max_row * ROW_H + 90 + legend[-1][3] * LEGEND_ROW_H
        lane_bottom = H - 60 - legend[-1][3] * LEGEND_ROW_H
        out = [self._defs(W)]
        # 标题
        out.append(f'<rect x="{MARGIN}" y="{PAD_TOP}" width="{W-2*MARGIN}" height="{TITLE_H}" rx="6" fill="{TOKENS["title_bar"]}"/>')
        out.append(f'<text x="{W/2}" y="{PAD_TOP+31}" fill="#fff" font-size="20" font-weight="700" text-anchor="middle">{esc(self.title)}</text>')
        # 泳道（每个宽度自适应）
        ly = PAD_TOP + TITLE_H
        for lane in self.lanes:
            g = self._lane_geom[lane]
            lx, lw = g["x"], g["w"]
            out.append(f'<rect class="lane" x="{lx}" y="{ly}" width="{lw}" height="{lane_bottom-ly}"/>')
            out.append(f'<rect class="lanehead" x="{lx}" y="{ly}" width="{lw}" height="{HEAD_H}"/>')
            out.append(f'<text class="laneheadt" x="{lx+lw/2}" y="{ly+20}">{esc(lane)}</text>')
        # 连线（先画，压在节点下）
        for e in self.edges:
            out.append(self._edge_svg(e))
        # 节点
        for n in self.nodes.values():
            out.append(self._node_svg(n))
        # 图例（规则：每张图底部统一标注图形含义）
        out.append(self._legend_svg(legend, lane_bottom + 26))
        body = "\n  ".join(out)
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="{TOKENS["font"]}">\n  {body}\n</svg>\n'

    def _defs(self, W):
        t = TOKENS
        return f'''<defs>
    <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="{t['edge']}"/></marker>
    <style>
      .lane{{fill:{t['lane_fill']};stroke:{t['lane_stroke']};stroke-width:1.2}}
      .lanehead{{fill:{t['lane_head']}}} .laneheadt{{fill:#fff;font-size:14px;font-weight:600;text-anchor:middle}}
      .step{{fill:{t['step_fill']};stroke:{t['ink']};stroke-width:1.2}} .stept{{fill:{t['step_text']};font-size:12.5px;text-anchor:middle}}
      .dec{{fill:{t['dec_fill']};stroke:{t['ink']};stroke-width:1.2}} .dect{{fill:{t['dec_text']};font-size:11.5px;text-anchor:middle}}
      .state{{fill:{t['state_fill']};stroke:{t['ink']};stroke-width:1.2}} .statet{{fill:{t['state_text']};font-size:12px;text-anchor:middle}}
      .stop{{fill:{t['stop_fill']};stroke:{t['stop_stroke']};stroke-width:1.2}} .stopt{{fill:{t['stop_text']};font-size:11.5px;text-anchor:middle}}
      .term{{fill:{t['term_fill']};stroke:{t['term_stroke']};stroke-width:1.4}} .termt{{fill:{t['term_text']};font-size:12.5px;font-weight:600;text-anchor:middle}}
      .start{{fill:{t['start_fill']};stroke:{t['ink']};stroke-width:1.2}} .startt{{fill:{t['dec_text']};font-size:12px;text-anchor:middle}}
      .sub{{fill:{t['step_fill']};stroke:{t['ink']};stroke-width:1.2}} .subbar{{stroke:{t['ink']};stroke-width:1.2}} .subt{{fill:{t['step_text']};font-size:12.5px;text-anchor:middle}}
      .note-c{{fill:#FFF9EC;stroke:#D9A441;stroke-width:1.2}} .note-f{{fill:#F2E2BE;stroke:#D9A441;stroke-width:1}} .notet{{fill:#6B4E14;font-size:11.5px;text-anchor:middle}}
      .data{{fill:#E7F0FA;stroke:{t['ink']};stroke-width:1.2}} .datat{{fill:{t['dec_text']};font-size:12px;text-anchor:middle}}
      .db{{fill:#DCE8F7;stroke:{t['ink']};stroke-width:1.2}} .dblip{{fill:none;stroke:{t['ink']};stroke-width:1.2}} .dbt{{fill:{t['dec_text']};font-size:12px;text-anchor:middle}}
      .docs2{{fill:{t['state_fill']};stroke:{t['ink']};stroke-width:1.2}} .docs2t{{fill:{t['state_text']};font-size:12px;text-anchor:middle}}
      .edge{{stroke:{t['edge']};stroke-width:1.6;fill:none}} .dash{{stroke:#8B98AE;stroke-width:1.4;fill:none;stroke-dasharray:5 4}}
      .elabel{{fill:{t['elabel']};font-size:11px;text-anchor:middle}}
      .lgt{{fill:#5A6B85;font-size:11.5px}}
    </style>
  </defs>'''

    def _legend_layout(self, W):
        """图例排版：本图实际用到的图形 + 两种连线，一行放不下时换行，不超出画布。"""
        used = [(t, label) for t, label in LEGEND if any(n["type"] == t for n in self.nodes.values())]
        used += [("edge", "同泳道流转"), ("dash", "跨泳道 / 系统联动")]
        layout, x, row = [], MARGIN + 6, 0
        for t, label in used:
            w = 40 + len(label) * 12 + 26
            if x + w > W - MARGIN and x > MARGIN + 6:
                x, row = MARGIN + 6, row + 1
            layout.append((t, label, x, row))
            x += w
        return layout

    def _legend_svg(self, layout, y0):
        """底部图例：按 _legend_layout 的位置缩略绘制并附中文名。"""
        items = []
        for t, label, x, row in layout:
            y = y0 + row * LEGEND_ROW_H
            k = 9   # 缩略图形半高
            if t in ("edge", "dash"):
                items.append(f'<line class="{t}" x1="{x}" y1="{y}" x2="{x+30}" y2="{y}" marker-end="url(#arr)"/>')
                items.append(f'<text class="lgt" x="{x+38}" y="{y+4}">{esc(label)}</text>')
                continue
            if t == "start" or t == "terminal":
                cls = "start" if t == "start" else "term"
                items.append(f'<ellipse class="{cls}" cx="{x+16}" cy="{y}" rx="16" ry="{k}"/>')
            elif t == "decision":
                items.append(f'<polygon class="dec" points="{x+16},{y-k} {x+32},{y} {x+16},{y+k} {x},{y}"/>')
            elif t == "state":
                items.append(f'<path class="state" d="M{x},{y-k} h32 v{2*k-4} q-8,-5 -16,0 q-8,5 -16,0 z"/>')
            elif t == "subprocess":
                items.append(f'<rect class="sub" x="{x}" y="{y-k}" width="32" height="{2*k}" rx="3"/>'
                             f'<line class="subbar" x1="{x+5}" y1="{y-k}" x2="{x+5}" y2="{y+k}"/>'
                             f'<line class="subbar" x1="{x+27}" y1="{y-k}" x2="{x+27}" y2="{y+k}"/>')
            elif t == "data":
                items.append(f'<path class="data" d="M{x+7},{y-k} L{x+32},{y-k} L{x+25},{y+k} L{x},{y+k} Z"/>')
            elif t == "database":
                items.append(f'<path class="db" d="M{x},{y-k+4} A16,4 0 0 1 {x+32},{y-k+4} L{x+32},{y+k-4} '
                             f'A16,4 0 0 1 {x},{y+k-4} Z"/>'
                             f'<path class="dblip" d="M{x},{y-k+4} A16,4 0 0 0 {x+32},{y-k+4}"/>')
            elif t == "docstack":
                items.append(f'<path class="docs2" d="M{x+4},{y-k-3} h28 v{2*k-6} q-7,-4 -14,0 q-7,4 -14,0 z"/>'
                             f'<path class="docs2" d="M{x},{y-k} h28 v{2*k-6} q-7,-4 -14,0 q-7,4 -14,0 z"/>')
            elif t == "note":
                items.append(f'<path class="note-c" d="M{x+6},{y-k} L{x+32},{y-k} L{x+32},{y+k} L{x},{y+k} L{x},{y-k+6} Z"/>')
            elif t == "step":
                items.append(f'<rect class="step" x="{x}" y="{y-k}" width="32" height="{2*k}" rx="4"/>')
            elif t == "stop":
                items.append(f'<rect class="stop" x="{x}" y="{y-k}" width="32" height="{2*k}" rx="4"/>')
            items.append(f'<text class="lgt" x="{x+40}" y="{y+4}">{esc(label)}</text>')
        # 整体标记为 legend：校验脚本跳过，不当作真实节点与连线
        return f'<g class="legend">{"".join(items)}</g>'

    def _node_svg(self, n):
        x1, y1, x2, y2 = self._bbox(n)
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        w, h = x2 - x1, y2 - y1
        lines = n["text"].split("\n")
        if n["state"]:
            lines = lines + [f'状态：{n["state"]}']
        ty0 = cy - (len(lines) - 1) * 8
        def txt(cls):
            return "".join(f'<text class="{cls}" x="{cx}" y="{ty0+i*16+4}">{esc(l)}</text>' for i, l in enumerate(lines))
        t, shape = n["type"], ""
        if t == "step":
            shape = f'<rect class="step" x="{x1}" y="{y1}" width="{w}" height="{h}" rx="7"/>{txt("stept")}'
        elif t == "decision":
            shape = f'<polygon class="dec" points="{cx},{y1} {x2},{cy} {cx},{y2} {x1},{cy}"/>{txt("dect")}'
        elif t == "state":   # 状态落点：卷角文档形
            d = f'M{x1},{y1} h{w} v{h} q{-w/4},-14 {-w/2},0 q{-w/4},14 {-w/2},0 z'
            shape = f'<path class="state" d="{d}"/>{txt("statet")}'
        elif t == "stop":
            shape = f'<rect class="stop" x="{x1}" y="{y1}" width="{w}" height="{h}" rx="6"/>{txt("stopt")}'
        elif t == "start":
            shape = f'<ellipse class="start" cx="{cx}" cy="{cy}" rx="{w/2}" ry="{h/2}"/>{txt("startt")}'
        elif t == "terminal":
            shape = f'<ellipse class="term" cx="{cx}" cy="{cy}" rx="{w/2}" ry="{h/2}"/>{txt("termt")}'
        elif t == "subprocess":   # 子流程（预定义过程）：矩形 + 两侧竖线
            shape = (f'<rect class="sub" x="{x1}" y="{y1}" width="{w}" height="{h}" rx="5"/>'
                     f'<line class="subbar" x1="{x1+11}" y1="{y1}" x2="{x1+11}" y2="{y2}"/>'
                     f'<line class="subbar" x1="{x2-11}" y1="{y1}" x2="{x2-11}" y2="{y2}"/>{txt("subt")}')
        elif t == "note":         # 说明卡片：左上折角
            c = 16
            d = f'M{x1+c},{y1} L{x2},{y1} L{x2},{y2} L{x1},{y2} L{x1},{y1+c} Z'
            shape = (f'<path class="note-c" d="{d}"/>'
                     f'<path class="note-f" d="M{x1+c},{y1} L{x1},{y1+c} L{x1+c},{y1+c} Z"/>{txt("notet")}')
        elif t == "data":         # 数据落点：平行四边形
            s = 18
            d = f'M{x1+s},{y1} L{x2},{y1} L{x2-s},{y2} L{x1},{y2} Z'
            shape = f'<path class="data" d="{d}"/>{txt("datat")}'
        elif t == "database":     # 数据库：圆柱
            ry = 9
            d = (f'M{x1},{y1+ry} A{w/2},{ry} 0 0 1 {x2},{y1+ry} L{x2},{y2-ry} '
                 f'A{w/2},{ry} 0 0 1 {x1},{y2-ry} Z')
            shape = (f'<path class="db" d="{d}"/>'
                     f'<path class="dblip" d="M{x1},{y1+ry} A{w/2},{ry} 0 0 0 {x2},{y1+ry}"/>{txt("dbt")}')
        elif t == "docstack":     # 文件落点：多层卷角文档
            def wave(ox, oy):
                return (f'M{x1+ox},{y1+oy} h{w-10} v{h-14} '
                        f'q{-(w-10)/4},-11 {-(w-10)/2},0 q{-(w-10)/4},11 {-(w-10)/2},0 z')
            shape = (f'<path class="docs2" d="{wave(10,-8)}"/>'
                     f'<path class="docs2" d="{wave(5,-4)}"/>'
                     f'<path class="docs2" d="{wave(0,0)}"/>{txt("docs2t")}')
        # 包一层带元信息的 g：校验脚本据此精确取节点边界与类型，无需按形状猜
        return f'<g class="nd" data-t="{t}" data-bb="{x1},{y1},{x2},{y2}">{shape}</g>'

    def _edge_svg(self, e):
        a, b = self.nodes[e["a"]], self.nodes[e["b"]]
        ax, ay = self._cx(a), self._cy(a)
        bx, by = self._cx(b), self._cy(b)
        dx, dy = bx - ax, by - ay
        cls = "dash" if e["dashed"] else "edge"
        TOL = 10
        if e["loop"]:                           # 回连 → 底部引出，经左侧绕行，接入目标左侧
            ax1, _, ax2, ay2 = self._bbox(a)
            bx1, by1, _, by2 = self._bbox(b)
            pa = ((ax1 + ax2) / 2, ay2)
            ky = ay2 + LOOP_GAP
            kx = min(ax1, bx1) - LOOP_GAP
            pb = (bx1, (by1 + by2) / 2)
            d = f'M{pa[0]},{pa[1]} L{pa[0]},{ky} L{kx},{ky} L{kx},{pb[1]} L{pb[0]},{pb[1]}'
            mx, my = (pa[0] + kx) / 2, ky - 7
        elif abs(dx) < TOL:                       # 同列 → 垂直直线
            pa = self._edge_point(a, "bottom" if dy > 0 else "top")
            pb = self._edge_point(b, "top" if dy > 0 else "bottom")
            d = f'M{pa[0]},{pa[1]} L{pb[0]},{pb[1]}'
            mx, my = pa[0] + 24, (pa[1] + pb[1]) / 2      # 标签放线右侧，不压线
        elif abs(dy) < TOL:                     # 同行 → 水平直线
            pa = self._edge_point(a, "right" if dx > 0 else "left")
            pb = self._edge_point(b, "left" if dx > 0 else "right")
            d = f'M{pa[0]},{pa[1]} L{pb[0]},{pb[1]}'
            mx, my = (pa[0] + pb[0]) / 2, pa[1] - 7
        elif abs(dy) >= abs(dx):                # 主要纵向 → 先垂直后水平
            pa = self._edge_point(a, "bottom" if dy > 0 else "top")
            pb = self._edge_point(b, "left" if dx > 0 else "right")
            d = f'M{pa[0]},{pa[1]} L{pa[0]},{pb[1]} L{pb[0]},{pb[1]}'
            mx, my = pa[0] + 24, (pa[1] + pb[1]) / 2
        else:                                   # 主要横向 → 先水平后垂直
            g = e.get("gap", 0)
            pb = self._edge_point(b, "top" if dy > 0 else "bottom")
            if g:   # 同源多出边：从底边偏移点垂直引出再水平，避开首条边的水平段
                bx1, _, bx2, by2 = self._bbox(a)
                pa = ((bx1 + bx2) / 2 + 40, by2)
                ky = by2 + g
                d = f'M{pa[0]},{pa[1]} L{pa[0]},{ky} L{pb[0]},{ky} L{pb[0]},{pb[1]}'
            else:
                pa = self._edge_point(a, "right" if dx > 0 else "left")
                ky = pa[1]
                d = f'M{pa[0]},{pa[1]} L{pb[0]},{ky} L{pb[0]},{pb[1]}'
            mx, my = (pa[0] + pb[0]) / 2, ky - 7
        seg = f'<path class="{cls}" d="{d}" marker-end="url(#arr)"/>'
        if e["label"]:
            seg += f'<text class="elabel" x="{mx}" y="{my}">{esc(e["label"])}</text>'
        return seg
