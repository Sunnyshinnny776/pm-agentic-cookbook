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
