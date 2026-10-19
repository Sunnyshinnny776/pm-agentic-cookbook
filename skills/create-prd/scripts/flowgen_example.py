#!/usr/bin/env python3
"""示例：画一张图 = 只填这些数据，没有一个坐标。换内容只改这里，样式永远一致。

演示全部节点类型：start 起止 / step 处理步骤 / decision 判断 / state 状态落点 /
subprocess 子流程 / data 数据落点 / database 数据库 / docstack 文件落点 /
note 说明卡片 / stop 阻断待处理。

绘制规则（生成器与校验脚本共同保证）：
  - 一图仅一个 start、一个 term（正常结束）；异常分支落到阻断节点 stop 时，
    stop 须连到后续处理（如回到修正步骤，用 loop=True）——不得另开第二个正常结束节点。
  - 图底自动生成图例，标注本图用到的每种图形与两类连线。
  - 连线不得共线重叠（校验脚本会报），必要时用 xoff 错开。
"""
from flowgen import Flow

f = Flow("供应商结算付款流程（组件库样板）", lanes=["供应商", "系统", "财务"])

# 节点：id, 泳道, 行, 类型, 文字, [状态], [xoff]。原则：一步一节点，不把多步塞进一个框。
f.node("begin",   "供应商", 0, "start", "开始：发起本期结算")
f.node("invoice", "供应商", 1, "step",  "上传发票")
f.node("files",   "系统",   1, "docstack", "发票文件")
f.node("match",   "系统",   2, "decision", "发票金额与\n入库金额一致？")
f.node("gap",     "供应商", 2, "stop",  "阻断：列出金额差异", xoff=-150)
f.node("ledger",  "系统",   3, "database", "结算台账")
f.node("review",  "财务",   3, "step",  "复核结算单")
f.node("tip",     "财务",   4, "note",  "复核只看差异行\n与付款条件", xoff=230)
f.node("order",   "财务",   4, "data",  "付款指令")
f.node("waiting", "财务",   5, "state", "结算单待付款", state="PENDING_PAYMENT（待付款）")
f.node("pay",     "系统",   6, "subprocess", "支付平台付款")
f.node("done",    "系统",   7, "terminal", "结束：本期结算已付款")

# 连线：from, to, [标签], [dashed], [loop]
f.edge("begin", "invoice")
f.edge("invoice", "files", "提交")
f.edge("files", "match", "核对金额")
f.edge("match", "gap", "不一致")           # 异常分支落到阻断节点，不另开正常结束节点
f.edge("gap", "invoice", "修改发票", loop=True)   # 阻断节点连到后续处理：回到上传发票
f.edge("match", "ledger", "一致")
f.edge("ledger", "review", "生成结算单")
f.edge("review", "order", "复核通过")
f.edge("order", "waiting")
f.edge("waiting", "pay", "发起付款")
f.edge("pay", "done")

open("out.svg", "w", encoding="utf-8").write(f.render())
print("wrote out.svg")
