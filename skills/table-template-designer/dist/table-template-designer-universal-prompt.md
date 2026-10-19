# 复杂表格模版设计 · 通用 Prompt

把本文件完整粘贴给任意大模型，即可在不安装任何工具的情况下设计企业级复杂数据表格的 UI 规范与代码。

**使用方式**：先给出表格结构描述（列定义、数据类型、业务规则；有既有 Excel 模版的一并说明），再粘贴本文件。模型按正文的视觉与交互规范产出表格设计与实现代码。

**两条必须坚持的边界**：

1. 列定义、联动关系与只读条件取自你给出的业务描述；描述里没有的，列为待确认问题，不由模型自行假设。
2. 产出代码后，模型按代码缺陷自查清单自查并修复，向你简述修了什么；是否采用由你决定。

以下依次给出：表格设计正文、下拉单元格、级联下拉、代码缺陷自查。


---

# table-template-designer

设计和生成企业级复杂数据表格模版的 UI 规范与交互标准。

这项技能的核心价值：将 ToB 产品中最复杂、最容易出错的"数据密集型表格"从经验驱动提升为规范驱动。一张费用申报表、一张多维统计报表，往往涉及 30+ 列、多级表头、冻结列、级联选择、条件只读等复杂交互——这些细节如果没有标准化规范，每次都要从零试错。

## 适用场景

- 计划编制/汇总表（如多维成本套表）
- 财务报表/损益表
- 数据录入模版（带下拉选择、联动筛选）
- 审批流中的明细数据展示表
- 任何列数 ≥ 10、需要横向滚动的复杂表格

## 输入

- PRD 中的表格结构描述（列定义、数据类型、业务规则）
- 可选：已有的 Excel 业务模版截图或说明

调用方随调用给出的参数，优先作为输入源。

---

## 表格整体结构规范

### 1. 标题行（Title Row）

表格最顶部必须有一行全宽合并的标题行。标题行是报表的"门牌号"——在企业场景中，一个报表审批人可能同时打开多张表，标题行帮助他在一秒内确认"我在看哪张表"。

**规范**：

| 属性 | 值 | 为什么 |
|------|------|------|
| 跨列 | `colSpan={总列数}` | 覆盖所有列形成完整横条 |
| 背景色 | `bg-gray-100` | 与表头色调统一，不抢数据区焦点 |
| 文字色 | `text-primary-800` | 通过文字而非背景传递品牌色 |
| 边框 | `border border-gray-200` | 与全局一致 |
| 字体 | `text-sm font-bold tracking-wide` | 加粗+字间距，标识性强 |
| 对齐 | `text-center` | 居中 |
| 命名格式 | `'xx'年度 'xx'填报单元 [报表名称] - [子表名称]` | 占位符在实例化时注入 |

标题行背景使用中性灰底，不用深主题色，也不用过浅的底色。核心原则：**标题行是"锚点"而非"焦点"，它的视觉重量不应超过数据区域。**

### 2. 多级表头（Multi-level Header）

企业报表通常有 3～4 层表头。这不是过度设计——当一张表有"年度合计、Q1计划、Q1实际、Q2计划..."等列时，如果没有分组表头，用户根本无法定位到目标列。

```
Row 0: 标题行（全宽合并）
Row 1: 一级分组（组织列 rowSpan=3 | 历史数据区 | 填报数据区 | 备注列 rowSpan=3）
Row 2: 二级分组（季度分组）
Row 3: 三级明细（月份列）
```

**分区色彩语义**——通过颜色让用户无需读文字就能区分区域性质：

| 分区 | 背景 / 文字色 | 为什么用这个颜色 |
|------|--------------|----------------|
| 组织架构列 | `bg-gray-100` / `text-gray-600` | 中性色=结构性锚定信息 |
| 历史数据区 | `bg-amber-50` / `text-amber-800` | 暖色调暗示"过去的、已完成的" |
| 当年填报区 | `bg-blue-50` / `text-blue-800` | 冷色调暗示"当前的、待操作的" |
| 自动计算列 | `bg-emerald-50/30` / `text-emerald-600/70` | 绿色暗示"系统已处理" |
| 备注/说明列 | `bg-gray-100` / `text-gray-600` | 辅助信息，不抢注意力 |

### 3. 冻结列（Sticky Columns）

当表格超过屏幕宽度时，左侧的组织架构列必须冻结。这是因为用户横向滚到第 25 列去填数据时，如果看不到这行属于哪个部门，就完全无法工作。

**布局常量定义模式**（逐级累加，便于维护）：
```tsx
const COL_W = { seq: 50, unit: 110, dept: 90, category: 120, subject: 130 };
const STICKY = {
  seq: 0,
  unit: COL_W.seq,
  dept1: COL_W.seq + COL_W.unit,
  // ... 后续列的 left 值 = 前面所有列宽度之和
};
```

**关键 CSS 规则**：
- 所有 sticky 单元格添加 `bg-clip-padding`——这是解决 sticky 元素背景色覆盖边框的必要手段
- 最右侧冻结列添加 `boxShadow: '2px 0 4px rgba(0,0,0,0.06)'` 作为与滚动区的分割线
- 表头 zIndex (30) > 数据行 zIndex (10)，避免滚动时层叠穿透

### 4. 序号列

最左侧固定宽度 `50px`，自动递增 `1, 2, 3...`，末行显示 `...` 表示可无限扩展。样式 `font-medium text-gray-500`。

---

## 单元格交互规范

### 1. Excel 风格下拉选择器

这是本规范最核心的交互模式。原理是用一个透明的原生 `<select>` 覆盖在展示层上方，这样既有自定义的视觉效果，又获得了原生的下拉行为（无需自己实现弹出层和键盘导航）。

详见 `references/dropdown_cell.md` 中的完整代码模板和交互要点。

### 2. 级联下拉（Cascading Dropdown）

多级联动的下拉选择器，例如：集团总部→区域→门店，采购品类→子品类。

**核心规则**：
1. 上级未选择时，下级 `disabled` + 背景置灰（`bg-gray-50/30`）+ 箭头隐藏
2. 上级变更时，所有下级自动重置为空——防止出现"一级组织=东区一店，二级组织=东区"这种脏数据
3. 无下级时统一显示 `--` 占位符，而非隐藏列
4. 联动重置逻辑集中在 `updateRow` 函数中管理

详见 `references/cascading_dropdown.md` 中的数据结构和联动代码。

### 3. 只读与空行

| 单元格类型 | 样式 | 模版态文字 |
|-----------|------|----------|
| 历史数据 | `bg-gray-50/60 text-gray-400 text-right` | "自动提取" |
| 自动汇总 | `bg-emerald-50/30 text-emerald-600/70 text-right` | "自动计算" |
| 待填报项 | `bg-white text-gray-400 text-right` | "待填报" |
| 空行占位 | 与文字行一致 | `\u00A0`（不间断空格） |

空行使用 `\u00A0` 而非 `''`，因为浏览器会对空内容单元格执行高度塌陷，导致行高不一致。

---

## 模版表 vs 实例表

| 维度 | 模版表 | 实例表 |
|------|--------|--------|
| 标题行 | 含 `'xx'` 占位符 | 填入真实年度和单元名称 |
| 组织列 | 下拉选择器 | 系统写入的真实数据 |
| 数据列 | 空白或"待填报" | 用户实际填写的数据 |
| 行数 | 5 行 + `...` 省略行 | 根据实际需求动态增减 |

---

## 边框与单位

- 所有单元格统一 `border border-gray-200`
- 冻结列与滚动区边框必须一致（`bg-clip-padding` 解决 sticky 背景覆盖问题）
- 数值区表头分组右侧标注"单位：元"，绝对定位右对齐

---

## 与 ui-generator 的关系

本技能是 `ui-generator` 的下游专项技能。当 `ui-generator` 在生成页面时遇到列数 ≥ 10 的复杂表格场景，应引用本技能的规范。

```
ui-generator（页面级）
  └── table-template-designer（组件级，本技能）
```

---

## 质量自检

- [ ] 标题行使用了 `bg-gray-100` 低饱和灰底？
- [ ] 冻结列全部添加了 `bg-clip-padding`？
- [ ] 最右侧冻结列有 `boxShadow` 分割线？
- [ ] 下拉选择器实现了悬浮显示箭头的交互？
- [ ] 级联下拉在上级变更时自动重置下级？
- [ ] 空行使用了 `\u00A0` 保持行高一致？
- [ ] 数据行数 ≥ 5 行 + 1 行 `...` 省略行？
- [ ] 数值区表头标注了"单位：元"？
- [ ] 分区色彩遵循语义（琥珀=历史、蓝=当前、绿=自动）？
- [ ] 标题行 `colSpan` 精确匹配总列数？

## 停机条件

同时满足才算完成：

1. 质量自检各项都有结论，并在交付说明里逐项写明：满足、不适用（附理由）或已修复
2. 已做代码缺陷自查并修复，见 「代码缺陷自查」。这是作者自己的质量动作：发现即修，向用户简述修了什么，不出报告。

**停下交用户**：表格的列、分区或联动规则在输入里缺失；与所在页面的既有表格规范冲突。


---

# Excel 风格下拉选择器 — 代码模板

## HTML 结构

原理：用一个完全透明的原生 `<select>` 覆盖在自定义展示层上方。这样做的好处是既能自定义视觉，又不需要手动实现弹出层定位、键盘导航、外部点击关闭等复杂逻辑。

```tsx
<td className="p-0 border border-gray-200 bg-white bg-clip-padding align-middle"
    style={stickyCell(STICKY.category, COL_W.category, false)}>
  <div className="relative group/cell w-full h-full min-h-[33px] flex items-center justify-between px-2 cursor-pointer hover:bg-gray-50/50">
    {/* 透明的原生 select，覆盖在最上层 */}
    <select
      value={row.category}
      onChange={e => updateRow(ri, 'category', e.target.value)}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    >
      <option value="" disabled>请选择类别</option>
      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    {/* 展示层：选中值或占位文字 */}
    <span className={`text-xs truncate ${!row.category ? 'text-gray-400' : 'text-gray-700'}`}>
      {row.category || '请选择'}
    </span>

    {/* 下拉箭头：悬浮时淡入 */}
    <ChevronDown size={14}
      className="text-gray-400 opacity-0 group-hover/cell:opacity-100 transition-opacity flex-shrink-0 ml-1"
    />
  </div>
</td>
```

## 交互要点

| 行为 | 实现 | 为什么 |
|------|------|--------|
| 未悬浮时无箭头 | `opacity-0` on ChevronDown | 保持视觉干净，避免几十个箭头密集排列 |
| 悬浮时箭头淡入 | `group-hover/cell:opacity-100 + transition-opacity` | 仿 Excel 体验，暗示"可操作" |
| 点击任意位置触发 | `<select>` 设置 `absolute inset-0 opacity-0 z-10` | 不需要精确点击箭头，降低操作成本 |
| 未选择态 | `text-gray-400` 占位文字 | 与已选择态（`text-gray-700`）形成对比 |
| 禁用态（级联未满足） | `disabled + cursor-not-allowed + bg-gray-50/30` | 视觉和行为双重暗示"当前不可操作" |

## 样式工具类

```tsx
// 表头样式
const headerCls = 'p-2 text-xs font-semibold text-gray-600 border border-gray-200 whitespace-nowrap text-center bg-clip-padding';

// 冻结列表头
const stickyHeaderCls = `${headerCls} bg-gray-100`;

// 冻结列数据行（非下拉场景）
const stickyBodyCls = 'p-2 border border-gray-200 text-xs text-gray-400 whitespace-nowrap bg-white text-center bg-clip-padding';

// 只读历史数据
const prevCellCls = 'p-2 border border-gray-200 text-xs text-gray-400 bg-gray-50/60 text-right whitespace-nowrap bg-clip-padding';
```


---

# 级联下拉（Cascading Dropdown）— 代码模板

## 数据结构

用嵌套的 `Record` 表达树形关系。每一级的 key 是当前选项，value 是下一级的可选范围。叶子节点统一用 `['--']` 表示"无下级"。

```tsx
// 集团总部 → 区域 → 门店
const ORG_TREE: Record<string, Record<string, string[]>> = {
  '东区一店': {
    '--': ['--']         // 无下级：二级和三级都只有占位符
  },
  '集团总部': {
    '东区': ['东区一店', '东区二店', '--'],
    '西区': ['西区一店', '西区二店', '--'],
    '--': ['--']         // 用户也可选择不指定二级
  }
};

// 采购品类 → 子品类（两级级联）
const CATEGORIES: Record<string, string[]> = {
  '生鲜': ['蔬菜', '水果'],
  '日用百货': ['清洁用品', '纸品'],
};
```

## 状态管理

每行维护一个扁平对象，所有级联字段平铺。级联重置逻辑集中在 `updateRow` 中：

```tsx
const [rowsData, setRowsData] = useState(
  Array.from({ length: 6 }).map(() => ({
    unit: '', dept1: '', dept2: '', dept3: '', category: '', subject: ''
  }))
);

const updateRow = (index: number, field: keyof typeof rowsData[0], value: string) => {
  const newData = [...rowsData];
  newData[index] = { ...newData[index], [field]: value };

  // 级联重置：改上级时清空所有下级
  if (field === 'dept1') {
    newData[index].dept2 = '';
    newData[index].dept3 = '';
  } else if (field === 'dept2') {
    newData[index].dept3 = '';
  } else if (field === 'category') {
    newData[index].subject = '';
  }

  setRowsData(newData);
};
```

## 下级选择器的条件渲染

以二级组织为例，关键在于：
- `disabled` 取决于上级是否已选择
- `options` 根据上级的值动态查询
- 占位文字区分"请选择"和"请先选上级"

```tsx
<td className="p-0 border border-gray-200 bg-white bg-clip-padding align-middle"
    style={stickyCell(STICKY.dept2, COL_W.dept, false)}>
  <div className={`relative group/cell w-full h-full min-h-[33px] flex items-center justify-between px-2
    ${row.dept1 ? 'cursor-pointer hover:bg-gray-50/50' : 'bg-gray-50/30'}`}>

    <select
      value={row.dept2}
      onChange={e => updateRow(ri, 'dept2', e.target.value)}
      disabled={!row.dept1}
      className={`absolute inset-0 w-full h-full opacity-0 z-10
        ${row.dept1 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
    >
      <option value="" disabled>
        {row.dept1 ? '请选择' : '请先选一级'}
      </option>
      {(row.dept1 ? Object.keys(ORG_TREE[row.dept1] || {}) : []).map(c =>
        <option key={c} value={c}>{c}</option>
      )}
    </select>

    <span className={`text-xs truncate ${!row.dept2 ? 'text-gray-400' : 'text-gray-700'}`}>
      {row.dept2 || (row.dept1 ? '请选择' : '\u00A0')}
    </span>

    <ChevronDown size={14}
      className={`text-gray-400 transition-opacity flex-shrink-0 ml-1
        ${row.dept1 ? 'opacity-0 group-hover/cell:opacity-100' : 'opacity-0'}`}
    />
  </div>
</td>
```


---

# 代码缺陷自查

> Supporting reference. 代码写完、交付之前读。本文件在写代码的几个 skill 中各有一份，内容逐字相同。

**这是作者自己的质量动作，不是审计。** 发现即修，修完向用户简述修了什么；不出报告，不交用户裁定。风格问题不在范围内。

## 先用宿主的能力

宿主环境提供代码审查能力时，优先调用它审查本次改动，逐条处理它的发现：确认是缺陷的修掉；判断不是缺陷的，在简述里说明理由。宿主没有这种能力时，按下面的清单逐项查。

## 先定深度

按本次改动触及的面决定查多深：

| 面 | 深度 |
| --- | --- |
| 权限与数据可见性、金额与计算、状态迁移与并发、存储与迁移、外部集成 | 逐函数查，并追到调用方 |
| 页面展示与交互 | 逐页面查主要路径与异常路径 |
| 注释、文案、纯样式 | 跳过 |

## 清单

每一项都要有取证动作——读过哪段、跑过什么、试过哪个输入——不是打勾。

- **逻辑**：边界值（空、零、上限、刚好等于）；空值与缺省字段（省略一个字段时会不会被悄悄改成默认值）；分支是否覆盖全部取值；错误路径是否回滚已做的改动；命令失败时是否保留用户已填的输入（弹窗或表单不因失败而关闭、清空）；重复提交是否幂等；状态能否被迁移到不允许的状态；异步操作的竞态与先后顺序
- **数据完整性**：编号或主键会不会重复；迁移前后的不变量是否保持；有没有重复写入或丢写；跨两个存储的写入失败一半时是什么状态
- **安全基础**：校验是否只在界面上做；不该看到的数据是否能通过别的入口看到；敏感数据是否进了日志、导出或页面结构
- **性能**：大列表与嵌套循环的复杂度；无谓的重复计算与重渲染；存储体量是否无上限增长；是否有阻塞界面的同步操作
- **测试有效性**：断言的期望值是否由被测代码同源生成（若是，故意改坏实现看测试会不会变红）；是否只测了快乐路径

## 完成标准

- 宿主审查的发现全部处理完，或清单各项都有取证动作
- 修复后相关测试重新跑过
- 向用户的简述里写明：查了哪些面、修了什么、哪些判断不是缺陷及理由
