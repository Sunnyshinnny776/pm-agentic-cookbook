import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const reference = readFileSync(resolve(import.meta.dirname, "../../../skills/table-template-designer/references/cascading_dropdown.md"), "utf8");
const example = [...reference.matchAll(/```tsx\n([\s\S]*?)```/g)][1][1]
  .replace("(index: number, field: keyof typeof rowsData[0], value: string)", "(index, field, value)");

for (const [field, value, cleared] of [
  ["dept1", "东区一店", ["dept2", "dept3"]],
  ["dept2", "西区", ["dept3"]],
  ["category", "日用百货", ["subject"]],
  ["unit", "updated", []],
]) test(`cascade example: ${field} update preserves original rows and resets only its descendants`, () => {
  const rows = [
    { unit: "one", dept1: "集团总部", dept2: "东区", dept3: "东区一店", category: "生鲜", subject: "蔬菜" },
    { unit: "two", dept1: "集团总部", dept2: "西区", dept3: "西区一店", category: "日用百货", subject: "纸品" },
  ];
  const before = structuredClone(rows);
  let result;
  const context = { useState: () => [rows, (next) => { result = next; }] };
  vm.createContext(context); vm.runInContext(example + "\nglobalThis.update = updateRow;", context);
  context.update(0, field, value);
  assert.deepEqual(rows, before);
  assert.notEqual(result, rows); assert.notEqual(result[0], rows[0]); assert.equal(result[1], rows[1]);
  assert.equal(result[0][field], value);
  for (const key of Object.keys(before[0])) if (key !== field) assert.equal(result[0][key], cleared.includes(key) ? "" : before[0][key]);
});
