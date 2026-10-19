# PM Agentic Cookbook

[English](README.en.md)

> 🚀 面向产品经理的 Agentic 全流程方法论 cookbook
>
> 当前以 B 端企业产品为主，其他领域通过领域 Provider 扩展。

## 这是什么？

一套帮助**产品经理**与 AI Agent 协作完成**产品设计全生命周期**的标准化工具包。

无需深厚的编程功底，只需掌握与 AI 协作的方法论，即可独立完成：

1. 📊 源材料准入、业务需求调研与数据建模
2. 📝 业务验收标准、PRD 生成与质量审计
3. 🎨 可快速验证的前端代码原型 Demo 与复杂表格
4. 🧪 从需求推导测试、端到端旅程审计与一致性审计
5. 📚 阶段收尾时把可复用的规则沉淀进 spec

## v0.1.0 新内容

- **全流程与 11 个 skill**：覆盖从源材料准入到需求验收与最终验证的完整流程，每个阶段由用户确认后推进。11 个 skill 可单独分发：通用 Prompt 可用于任意大模型，`.skill` 安装包可用于支持 skill 的 Agent。
- **领域 Provider 与参考规则库**：通用指令与领域规则分开存放，`create-prd`、`check-prd` 自带 HR 领域 Provider；附 UI/UX、集成、工程、安全与测试参考规范。
- **可执行门禁与 Agent 接入**：零 npm 依赖的文档门禁与回归测试，附 Claude Code、Codex 的 hook 注册样例；面向 Agent 的使用说明 `AGENT_GUIDE.md` 与索引 `llms.txt`。
- **示例与上游许可**：四篇示例展示实战复盘、规则沉淀、Provider 写法和审计基线；两个 PRD skill 派生自 pmYangKun 的上游仓库，依据 Apache-2.0 分发并保留原声明。

完整内容见 [CHANGELOG](CHANGELOG.md) 与 [Release notes](https://github.com/Sunnyshinnny776/pm-agentic-cookbook/releases)。

## 它解决什么问题

单个 PRD skill 能生成一份需求文档；完整的产品工作还需要确认业务依据、
建立模型、确认验收标准、连接实现与测试证据，并把发现的缺漏回改到上游。
本 cookbook 把流程、skills、参考规则、模板和可执行门禁放在同一套结构中，
让这些环节前后衔接，缺漏能回到产生它的阶段修正。

流程中的确认与验收由用户或维护者决定。Agent 提供产物、证据和未闭环事项，
不自行认证交付通过。领域规则通过 Provider 接入，通用指令与具体业务规则分开。

## 项目结构

```
pm-agentic-cookbook/
├── process/                      # 流程说明
│   ├── overview.md               # 全流程概览与阶段导航（面向 PM）
│   ├── loop-engineering.md       # 验证回路、门禁与 hooks、停机与审计边界、eval 接口
│   ├── kit-architecture.md       # 架构规范：capability seam、目录与 frontmatter 标准、宿主契约
│   ├── agent-execution-protocol.md # Agent 执行协议：阶段执行者矩阵与子代理派发规则
│   ├── decision-archive.md       # 决策档案机制：记「为什么是这样，以及不是哪样」
│   └── versioning.md             # 版本管理：语义化版本、CHANGELOG 与发版规则
├── skills/                       # AI 指令集，每个 skill 自包含，可单独分发
│   ├── source-intake/            # 阶段零：源材料准入与需求调研
│   ├── domain-modeling/          # 阶段一：业务建模
│   ├── acceptance-criteria/      # 阶段一后：业务验收标准，逐条确认后进入需求文档
│   ├── create-prd/               # 阶段二：需求文档生成（含流程图生成器与 HR 领域 Provider）
│   ├── check-prd/                # 阶段三：需求文档质量审计（14 个维度，含 HR 领域 Provider）
│   ├── table-template-designer/  # 阶段四：复杂表格专项设计
│   ├── ui-generator/             # 阶段四：原型生成（含设计令牌与默认 UI/UX 规则）
│   ├── test-authoring/           # 阶段五：从需求文档推导测试
│   ├── journey-audit/            # 阶段五：端到端旅程审计
│   ├── consistency-audit/        # 任一阶段：对象之间的一致性审计
│   └── spec-capture/             # 阶段收尾：把可复用的规则沉淀进 spec
├── specs/                        # 参考规则库：UI/UX、集成、工程、安全、测试
├── templates/                    # 流程文档使用的模板
├── tools/
│   ├── gates/                    # 机检门禁与回归测试，`doc-sync.mjs` 聚合运行
│   └── hooks/                    # Agent hooks 脚本与 Claude Code、Codex 注册样例
└── examples/                     # 合成或经脱敏的使用案例
```

每个 skill 目录的结构相同：`SKILL.md`（给 Agent 的指令）、`README.md`（给人看的说明）、
`references/`（按需加载的细则）、`scripts/build.py` 与 `dist/`（通用 Prompt 与 `.skill` 包）、
`evals/`（质量评测用例）、`CHANGELOG.md`。规范见 [架构规范](process/kit-architecture.md)。

## 适用人群

- B 端产品经理，尤其是 HR、财务、ERP 等业务规则密集的领域
- 希望借助 AI 提升产出效率的产品团队
- 希望与 AI Agent 协作完成产品设计与原型的技术型产品经理

## 使用方式

1. 获取本仓库：`git clone https://github.com/Sunnyshinnny776/pm-agentic-cookbook.git`。
2. 按 [流程概览](process/overview.md) 逐阶段推进，每个阶段使用对应的 skill，三种用法任选：
   - **任意大模型**：粘贴该 skill 的 `dist/<skill>-universal-prompt.md`，再给出输入；
   - **支持 skill 的 Agent**（如 Claude Code、Codex）：安装 `dist/<skill>.skill`，或把 skill 目录放进 Agent 的 skill 目录；
   - **需要领域补充规则时**：分发包只含通用部分，按 [架构规范](process/kit-architecture.md) 的 Provider 接口提供该领域的 `references/providers/<domain>/`，并明说按哪个领域执行。`create-prd` 与 `check-prd` 自带 HR 领域 Provider，调用时指明 `hrm` 领域即可加载；不指明领域时只执行通用框架。
3. 在自己的项目里长期使用时，在项目根目录放一份 `cookbook.config.json`，告诉 skill、门禁与 hooks 这个项目的布局（见下节）。
4. 需要规则起点时，从 [参考规则库](specs/README.md) 复制所需的 spec 到自己的项目再修改。

## For AI agents

在用户项目里**使用**本仓库的 Agent，先读 [AGENT_GUIDE.md](AGENT_GUIDE.md)：用户意图对应哪个 skill、如何安装、如何读取宿主配置、哪些操作必须先征得用户同意。[llms.txt](llms.txt) 是按 llms.txt 约定整理的索引。**修改**本仓库的 Agent 先读 [AGENTS.md](AGENTS.md)。

## 接入你的项目：`cookbook.config.json`

skill 正文不写任何项目路径：要读的 spec、产物落在哪、门禁扫哪些目录，都从项目根目录的
`cookbook.config.json` 读取。三节各管一件事：

| 节 | 管什么 |
| --- | --- |
| `host` | 宿主契约：spec 按角色登记（`specMap`）、模块文档目录（`moduleDocs`）、模块内的测试与过程记录目录、Agent 规则文件。skill 读不到需要的字段就停下问你，不猜 |
| `gates` | 门禁：skill 目录、扫描范围、豁免清单、领域词表、项目私有路径片段、项目自加的门禁 |
| `hooks` | hooks：哪些路径改动后触发检查或提醒、收尾时跑的命令 |

最小示例（cookbook 放在项目根下的 `pm-agentic-cookbook/`）：

```json
{
  "gates": {
    "styleScanRoots": ["specs"]
  },
  "host": {
    "specMap": { "ui-ux": ["specs/ui"], "testing": ["specs/test-rules.md"] },
    "moduleDocs": "product/<module>",
    "testsDir": "qa",
    "processRecordsDir": "records"
  }
}
```

没有配置文件时，门禁只查 cookbook 自身。各字段的含义与约束见 [架构规范](process/kit-architecture.md)
第 6 节（门禁与 hooks）与第 9 节（宿主契约）；hooks 的注册方式见 `tools/hooks/` 下的两份样例。

领域名词门禁会扫描 skill 通用层。cookbook 自身有一处已知误报：create-prd 产品类型表的「典型产品」列把 HRM 与 ERP、CRM 并列，指的是软件品类，不是业务域。本仓库在 `.verify-baseline.json` 中登记了这条豁免；在你的项目里运行门禁时，把同一条登记到 `gates.baselineFile` 指向的豁免清单，路径改为 cookbook 在你项目中的位置。

## 阶段门禁

默认采用阶段门禁：Source Intake → Domain Model → Acceptance Criteria → PRD Draft → PRD Audit →
UI Prototype → Test → Requirements Acceptance & Final Verification。
每个阶段完成后先由 AI 自审，再交由用户审查；用户未明确确认前，不自动进入下一阶段。
由 AI Agent 执行流程时，审计与旅程走查必须由独立子代理执行（作者不得自审），
执行者矩阵与派发规则见 [Agent 执行协议](process/agent-execution-protocol.md)。

## 本地检查

依赖 Node.js 22 或更高版本、Git 和 Bash；门禁不需要安装 npm 依赖。

```bash
npm run doc-sync
npm run test:gates
```

增量文风门禁依赖完整历史及 `cookbook.config.json` 的 `gates.baseRef`，默认基准是 `origin/main`，
在 clone 中运行检查前先 fetch 该分支。没有任何提交的仓库按暂存与未跟踪文件检查。
在 PR 上，CI 用基准与 HEAD 的共同祖先；推送到 main 时，其他门禁检查当前全树，
增量文风门禁只看相对配置基准的改动与本地改动。

Hooks 提供及时提醒，不阻止操作；实际检查结果以门禁命令和 CI 为准。
现有门禁覆盖目录与 frontmatter、自包含、领域名词、宿主私有路径、决策格式、
增量文风、译本元信息、安装包与源文件一致、Agent 路由表与索引、CHANGELOG 版本格式及 Agent 规则薄壳；未配置决策目录时，决策格式门禁明确跳过。
门禁检查不代表真实业务验收；DSH bundle 配置不代表运行兼容性已验证。

## 版本

整库与各 skill 分别使用语义化版本：整库版本见 [CHANGELOG](CHANGELOG.md) 与 Git tag，
各 skill 的版本见各自目录下的 `CHANGELOG.md`。升号规则、对外契约的范围与发版流程见
[版本管理](process/versioning.md)。

## 源自实战

本 cookbook 的流程、规则与 skill，提炼自一个真实的集团型企业 B 端薪酬系统项目：
从源材料准入、数据建模、需求文档、原型到测试与审计，都在该项目中实际使用并反复修订。
项目本身的业务资料、需求文档与代码不随本仓库公开，`examples/` 中的案例经过脱敏。
各 skill 已验证的范围以其 `evals/` 下的用例为准。

## 作者的话

我是本仓库作者 Sunny，一名 B 端产品经理。
这套 cookbook 来自我与 Claude、Codex 一起做的业务系统实践：在一次次返工与重做中，反复验证 Agent 流程、提炼规则，最终整理成一套面向产品经理的工作流。
在这套流程中，我寄予了一些小小的、对 AI 时代下产品经理工作流程转型的期待与憧憬，借此机会分享给大家。

- **产出可以委托给 Agent，判断依据仍要有人负责。** 平时同事来问、你随口就能回答的那些业务规则，没有写下来，Agent 就无从得知。
- **PRD 的问题不在长度，而在密度。** 让每条业务规则有来源、有条件、有结果，让异常分支与正常路径一样得到说明；每一段都应该减少下游的一处歧义。
- **把澄清和验证前移。** 早晚都要回答的业务问题，值得尽早回答。这套流程会在材料不足、规则冲突时停下来问你，也需要你读报告、作判断；衡量它的尺度，是眼前这项工作有没有少猜一点、少返工一次。
- **它是一套偏重的流程。** 更适合业务规则、状态和协作关系复杂的系统或大版本迭代；日常的小改动，可以按需使用单个 skill。
- **大模型越强，脚手架应该越少；留下的业务判据则应该越来越清晰。** 我希望这个项目的进步，体现在它能「逆向迭代」掉多少自己曾经写下的规则。

> 模型的指令会消失，但你的判据会留下。

## 贡献与许可

阅读[贡献指引](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md)和[安全报告说明](SECURITY.md)。
修改本仓库的 Agent 先读 [AGENTS.md](AGENTS.md)。

本仓库内容按 [Apache License 2.0](LICENSE) 授权，版权与归属声明见 [NOTICE](NOTICE)。
允许企业使用、适配与商业分发；再分发时须遵守许可中的声明保留和修改标记要求。

两个 PRD skill 分别派生自 pmYangKun 的上游仓库，依据 Apache-2.0 使用与分发。原始版权与贡献者声明见各 skill 的 LICENSE、NOTICE 及本仓库 [NOTICE](NOTICE)；本仓库的修改不代表原作者背书。

## 来源与致谢

- **PRD 方法论**：本仓库构建灵感源自 PM 杨堃老师开源的 [create-prd](https://github.com/pmYangKun/create-prd-skill) & [check-prd](https://github.com/pmYangKun/check-prd-skill) 两个 skill，在此基础上结合自身实际工作与思考，不断打磨积累，才得以形成一套覆盖需求评审与规划、PRD 生成与检查、系统设计、测试设计、原型生成等多个阶段的 PM agentic 工作流程。自任职产品经理以来，就一直拜读杨堃老师的[《决胜B端》《决胜体验设计》](https://book.douban.com/subject/36436108/)等著作，深受其启发与影响；本仓库涉及需求文档相关方法论也学习、受益于杨堃老师的公开文章与作品。特此感谢杨堃老师在业内的辛勤耕耘，欢迎大家关注和学习杨堃老师的更多作品。
- **skill 结构与决策档案机制**：[架构规范](process/kit-architecture.md) 的 capability seam 三角色与目录、frontmatter 标准，
  [决策档案机制](process/decision-archive.md) 的目录与格式，取自一个公开的开源 agent harness（MIT 许可）。
  两份文档各自的「来源」节说明了哪些部分是借用、哪些是本 cookbook 新增。
