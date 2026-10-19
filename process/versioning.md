# 版本管理

> 本文档规定 cookbook 整库与各 skill 怎么编版本号、怎么记变更、怎么发版。门禁 `verify-changelog` 检查其中可机判的部分。

---

## 1. 两层版本

| 层 | 版本载体 | 含义 |
| --- | --- | --- |
| 整库 | 根目录 `CHANGELOG.md` 与 Git tag `vX.Y.Z` | 一次发版的整体快照：哪些 skill、参考规则、流程文档、模板与门禁一起构成这个版本 |
| skill | 各 skill 目录下的 `CHANGELOG.md` | 单个 skill 的能力演进。skill 可以单独安装，所以各自计版本，不跟随整库同步升号 |

两层都用语义化版本 `主版本.次版本.修订号`。整库发版时，Release notes 列出本版包含的各 skill 版本（格式见第 5 节）。

## 2. 对外契约

版本号的升法取决于改动是否破坏对外契约。以下各项属于契约：

- **skill 的名称与触发描述**：frontmatter 的 `name`、`description`。改名或让原本会触发的请求不再触发，属于破坏。
- **宿主配置**：`cookbook.config.json` 的字段名、取值含义与缺省行为。
- **产出结构**：skill 产出物与模板的章节结构、表格列、编号规则等下游会引用或解析的部分。
- **门禁**：门禁命令、退出码含义与配置项。
- **分发包**：`.skill` 包与通用 Prompt 的文件名与安装方式。

措辞、示例与说明的改写，只要不改变上述各项与执行行为，就不属于契约变化。

## 3. 升号规则

| 改动 | 升哪一位 | 例子 |
| --- | --- | --- |
| 破坏对外契约 | 主版本 | 删改宿主配置字段；产出表格删列或改编号规则；skill 改名 |
| 新增能力或改变执行行为，且不破坏契约 | 次版本 | 新增一个产出物；新增停机条件；缺少输入时由停下改为按默认规则继续 |
| 不改变行为的修正 | 修订号 | 修正错别字、断链、示例；补充说明 |

- **1.0 之前**：版本号为 `0.y.z` 时，契约仍在收敛，次版本也可能包含破坏契约的改动；这类改动必须在 CHANGELOG 中写明「破坏性」及迁移方法。
- 一次改动同时命中多行时，按最高的一行升号。

## 4. CHANGELOG

- **skill**：改动 `SKILL.md`、`references/`、`scripts/` 或 `templates/` 时，同一次改动必须在该 skill 的 `CHANGELOG.md` 顶部新增或更新一节。每节标题为 `## vX.Y.Z`，可后跟日期 `（YYYY-MM-DD）`；节内每条写改了什么、对使用者有什么影响。只改 `dist/`、`evals/` 或 README 不要求新增条目。
- **整库**：根目录 `CHANGELOG.md` 顶部保留一节 `## 未发布`，合入的改动随时记入；发版时把这一节改为 `## vX.Y.Z（YYYY-MM-DD）`，再新开一节 `## 未发布`。
- 版本号自上而下递减，不重复、不跳回。
- 条目写结果，不写过程：不写审计编号、任务编号或内部讨论。
- 英文译本按 [Kit 架构规范](kit-architecture.md) 的译本同步约定跟随中文原文。

## 5. 发版

1. 维护者确认 `## 未发布` 一节完整，CI 通过。
2. 把发版改动作为一个 PR 提交到 `main`，包括：
   - 根 `CHANGELOG.md`：把 `## 未发布` 改为 `## vX.Y.Z（YYYY-MM-DD）`，再在顶部新开一节 `## 未发布`；英文译本同步。
   - README：更新「vX.Y.Z 新内容」一节（英文版为「What's new in vX.Y.Z」），两个语言版本同步。
   - `package.json`：`version` 改为 `X.Y.Z`。
   - Release notes 文档：新增 `releases/vX.Y.Z.md`，格式见下。
3. 维护者审阅 Release notes 文档后合入该 PR。
4. 维护者在该 PR 的合并提交上打 tag `vX.Y.Z`，并以 `releases/vX.Y.Z.md` 的原文创建 GitHub Release，例如 `gh release create vX.Y.Z --target <合并提交> --title vX.Y.Z --notes-file releases/vX.Y.Z.md`。创建后核对 Release 正文与仓库中的文件逐字一致。

Release notes 文档：

- 先简体中文，后英文。中文为准，英文逐条对应中文，不增删内容。
- 正文取自根 CHANGELOG 的本版一节及其英文译本，不另写 CHANGELOG 中没有的内容。
- 列出本版包含的各 skill 及其版本。
- 合入后，该文档是本版说明的唯一原文。发现错误时先改文档再同步 Release 正文；tag 不因说明修改而移动。

其他约定：

- tag 与 Release 只由维护者创建。tag 一经发布不移动、不删除、不复用；发布后发现问题，用新的修订号修复。
- 合入 `main` 不等于发版。多次合入可以累积在 `## 未发布` 中，一起发布为一个版本。

## 6. 机检

`verify-changelog` 随 `doc-sync` 运行，检查：

- 每个 skill 都有 `CHANGELOG.md`，且至少一节合法版本号；
- 根 `CHANGELOG.md` 存在时，最新一节为 `## 未发布` 或合法版本号；
- 版本号自上而下递减；
- 增量模式下，skill 的 `SKILL.md`、`references/`、`scripts/`、`templates/` 有改动而它的 `CHANGELOG.md` 未改动时失败。

升主版本、次版本还是修订号，门禁无法判断，由作者按第 3 节判断、由评审者核对。
