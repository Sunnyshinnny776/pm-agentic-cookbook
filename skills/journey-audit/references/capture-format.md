# capture-format(逐步语义快照 schema)

> 定义录制器对每次交互产出的 `journey_steps.json` 结构,作为录制器与本 skill 的契约。录制器的产出必须与本 schema 对齐。零截图、纯文本/结构,聚焦主内容区采集以控 token。

## 文件

- 文件名:`User_Journey_<timestamp>.steps.json`,与同次录制的 `User_Journey_<timestamp>.js` 同目录(录制目录由调用方给出)。
- 顶层:`{ "url": string, "startedAt": ISO, "steps": Step[] }`。增量写入(每次交互追加一条 step)。

> **录制边界(契约提示)**:录制器若开**全新隔离浏览器上下文**(Playwright 默认),则 `startedAt` ≈ 浏览器启动、`steps[0]` 为首次页面加载——旅程会从登录页起、含准备性步骤,与用户"已备好前置数据后才点开始录制"的预期不一致。建议录制器二选一:① 复用已登录会话(`storageState`)跳过重登录;② 提供真正 gate 采集的 start-marker,只记标记后的 step。在录制器未实现前,**阶段B 以「前置序章裁剪」兜底**(见 SKILL 阶段B 第1步):按阶段A清单 `涉及节点`/`前置数据` 定位旅程逻辑起点,起点前的登录/准备步骤单列为前置序章,不计入审计与覆盖度。

## Step schema

```jsonc
{
  "index": 1,                       // 步骤序号(从 1 递增)
  "ts": "2026-06-27T10:00:00.000Z", // 该交互时间戳
  "type": "click",                  // click | fill | select | navigate | feedback
  "target": { "role": "button", "name": "提交审批" }, // 交互目标(aria role + 可见名)；navigate/feedback 可为 null
  "value": "***",                   // 仅 fill/select：输入值；密码类输入恒为 "***"(脱敏)
  "node": "订单审核工作台",          // 当前业务节点(见下方派生规则)
  "role": "区域管理员",              // 当前生效角色(顶栏角色切换器显示的角色名)
  "statuses": [                     // 主内容区所有状态徽标
    { "text": "待上级审批", "status": "processing" }
  ],
  "actions": [                      // 主内容区当前可见的操作按钮
    { "name": "提交审批", "disabled": false },
    { "name": "驳回", "disabled": true }
  ],
  "data": [                         // 可选：焦点行/详情区关键字段(供跨页一致性核验)
    { "label": "本级合计", "value": "1,200,000" }
  ]
}
```

### `type=feedback`(瞬时反馈，对应 audit-dimensions D10)

toast / dialog 等瞬时反馈按**事件**单独追加一条 step,不依赖定时快照:
`{ "index", "ts", "type": "feedback", "channel": "toast|dialog", "level": "success|error|warning|info", "text": "提交成功" }`。

## 采集锚点

锚点是目标项目的稳定 DOM 标记,随项目而定,写在领域 Provider 的 `references/providers/<domain>/capture-anchors.md`。通用层只定规则:

- **锚点优先级**:aria role+name > 可见文本 > 类名。
- **采集范围**:除 `node`/`role` 外,`statuses`/`actions`/`data` 均限定在主内容容器内,排除顶栏与侧边栏噪声。
- **node**:导航中当前生效的**最深一级(叶子)**菜单项的标签,不取父级容器文本;缺失时回退主内容区的主标题。
- **role**:界面上显示当前生效角色的那一处文本,锚点须在全页唯一。
- **statuses**:状态徽标的文本与其状态语义(类名或属性中编码的 success/warning/error 等);**保留状态语义**以便回判颜色意图(见 coverage-boundary)。
- **actions**:主内容区内可见且文本非空的按钮(含行内操作)→ `{ name, disabled }`。
- **data**(供 D08 跨页/聚合一致性):**只采带标签的关键数值**,不倒全部数字(控噪声/token,上限 24 条);散落数字(明细行、无标签数)不采,留 D08 人工或按需扩锚点。
- **value 脱敏**:目标为 `input[type=password]` 时 `value` 恒记 `"***"`。

未指定领域、或该领域的 Provider 没有采集锚点时,按上述规则从目标项目的页面结构自行选取锚点,并在报告中注明"未加载领域采集锚点"。

## 设计原则

- 字段以"能被 audit-dimensions 各维度消费"为充要标准,不冗余采集;无截图。
- 单 URL SPA:`node` 一律从 DOM 派生,**不依赖 URL**。
- 与 audit-dimensions 的对应:`node/role/actions`→D03/D04/D09;`statuses`→D02/D12;`data`→D08;`type=feedback`→D10;`type/target/value` 序列→D01/D15。
