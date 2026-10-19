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
