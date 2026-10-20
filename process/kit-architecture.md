# Kit 架构规范

> 本文档定义 PM Agentic Cookbook 里**一个 skill 该长成什么样**：通用层与领域层怎么分、目录与 frontmatter 怎么写、README 要向模型声明什么、以及同一份 skill 如何同时满足三种分发形态。
>
> 适用于新增 skill 与既有 skill 的改造。与流程本身（有哪些阶段、每阶段做什么）无关——那是 [`overview.md`](./overview.md) 的职责。

---

## 0. 为什么需要这份规范

Kit 早就有一条约定：**审计/维度类 skill 的通用层不得内联单一项目 PRD 的业务规则**。这条约定是对的，但它**只有约定、没有名字、没有门禁**：

- 没有名字，评审时无法精确指认"你这里越界了"，只能一事一议；
- 没有结构，新 skill 作者不知道领域内容该放哪，只能模仿现有 skill——而现有 skill 的目录结构互不一致；
- 没有门禁，泄漏只能靠人眼发现。

同时它还是**跨 harness 分发**的前提：通用层若混着领域内容，就不是一个可分发的通用能力。

本规范把这条约定升级为有名字、有结构、可机检的架构纪律。

---

## 1. Capability Seam：三角色

一个 skill 不是一份 prompt，而是一个**能力契约 + 若干领域实现**。三个角色各司其职：


| 角色 | Kit 落点 | 职责 | 硬性要求 |
| --- | --- | --- | --- |
| **Service Definition** | `SKILL.md` 正文 + `references/` 顶层通用文件 | 流程契约、词汇、输出 schema、权限边界、停机条件 | **零领域名词** |
| **Service Provider** | `references/providers/<domain>/` | 领域特化：具体检查点、oracle-map、baseline、术语表、领域附录 | **由所在路径判定，不加头标记** |
| **Consumer** | 阶段执行器 / 子代理派发 / 用户直接调用 | 组装请求、指定 Provider、接收产物 | 只认 Definition 的输入输出，不依赖某个 Provider 的内部结构 |

### 1.1 三条纪律

1. **Definition 一份，Provider 可多份。** 加一个领域 = 加一个 Provider 目录，**绝不改 Definition**。若加领域时发现必须改 Definition，说明 Definition 里混进了上一个领域的假设——修 Definition，不要在里面加分支。
2. **Definition 出现领域名词 = 契约泄漏。** 由 `verify-skill-generic-layer` 拦截（见第 6 节）。
3. **默认值必须显式 resolve。** Consumer 传完整请求（目标路径、领域、报告落点、轮次上限），Provider 负责补该领域的默认值。**`SKILL.md` 里禁止藏"未指定就按某某领域来"**——隐式默认会让 skill 在新领域里静默产出错误结论，而不是报错。

   **"从被审对象的内容里反推领域"也是一条隐式默认**，形式上看着聪明，后果一样：它让 skill 在判错的领域上静默产出错误结论。领域只能由调用方给，**未指定时走通用路径并显式声明"未加载领域补充规则"**——不声明就是静默降级，产出看起来完整而领域检查全部缺席。

   同理，**Definition 里不得出现任何具体领域的 Provider 路径**。写 `references/providers/<domain>/`，不写 `references/providers/hrm/`。

### 1.2 判据：这段内容该放哪

写每一段时问一句：**换一个业务领域，这句话还成立吗？**

| 情形 | 归属 | 例子（措辞形态） |
| --- | --- | --- |
| 问的是"哪一种一致性" | Definition | "核验状态机的每个终态都有可达路径" |
| 答的是"本领域的答案" | Provider | "`已提交` 之后允许回到 `草稿` 的条件是……" |
| 是流程/交接/停机规则 | Definition | "复审只核销 dispatch 中列出的原问题编号" |
| 是某个项目的锚点、字段名、角色名、金额口径 | Provider | oracle-map、baseline、DOM 采集锚点 |

判不出来时的缺省选择是 **Definition 写规则句、Provider 写实例**，而不是把整段塞进任一侧。

### 1.3 领域名词与豁免

"领域名词"指绑定到具体业务域或具体项目的实体、角色、口径、编号（示例词表：薪资、个税、预算、考勤、社保、绩效、HRM、HCM、集团、事业部、成本中心、算薪）。词表随门禁脚本可配置，不在本文档固化。

**唯一豁免：frontmatter 的 `description` 字段。** skill 的发现机制靠 description 做触发匹配，去掉领域关键词会让该 skill 在真实场景下无法被唤起。这是发现机制的要求，不是契约泄漏，门禁对该字段免检。

正文里确实需要举例时，按 Born-Portable 写法处理：**先写通用规则句，领域示例放在括号或独立示例块里**，换一个领域时只替换示例、不重写规则。

---

## 2. skill 目录标准

```
skills/<kebab-name>/          ← 目录名必须等于 frontmatter 的 name
  SKILL.md                    ← Definition
  README.md                   ← 人读入口 + Model Experience 声明
  CHANGELOG.md
  references/
    <generic>.md              ← Definition 的延伸（维度、章节、约定）
    providers/<domain>/       ← Provider
  templates/                  ← 该 skill 产出物的模板（若 SKILL.md 引用了模板）
  evals/                      ← 回归用例
  dist/                       ← 构建产物（若该 skill 需要通用 prompt 形态）
  scripts/build.py            ← 构建 dist
```

四条约束，注意其中只有一条是外部硬性要求：

1. **bundle 内不得有嵌套 `SKILL.md`**（外部硬要求）。发现机制只认 `<root>/<name>/SKILL.md` 这一层，更深的路径**不扫**——不报错，只是永远不生效。
2. **目录名 === frontmatter `name`**，且为 kebab-case（**Kit 约定，非外部要求**）。理由是可读性与可查找性：skill 在系统里以 `name` 被引用，目录叫另一个名字会让人按 `name` 找不到文件，符号链接与文档引用也各写一套。
3. **`references/providers/` 是领域内容的唯一落点**（Kit 约定）。不再用 `appendices/<domain>.md`、`baseline-<project>.md` 这类散落命名。
4. **skill 必须自包含**（Kit 约定）。`SKILL.md` 与 `references/` 下各文档引用的每一个文件都必须在 skill 目录之内，只写文件名、不带路径的引用同样算。引用工具包层的共享目录（如顶层 `templates/`）在本仓能跑通，是因为本仓恰好两样都有；**单独分发时那些引用会全部断掉**，而执行者只能报一句"文件不存在"，无从判断是自己找错了还是包不完整。

   同时，凡是被引用的辅助文件都要有**降级路径**："取不到时按规范自行组织，并在产出中注明未套用"。自包含解决打包，降级解决打包之外的意外——两者都要有。

   唯一的例外是 cookbook 的流程文档（如 Agent 执行协议）：它们属于流程层，复制进各 skill 只会造出必然漂移的副本。skill 可以指向它们，但必须写成 `<cookbook>/process/…`（`<cookbook>` 指本 skill 所在的 cookbook），并在同一处写明单独分发、取不到时至少要做到什么——把执行所需的要点就地写出来，而不是只留一个指针。


改动 `SKILL.md` 或 `references/` 后，必须在同一次变更里重建 `dist/`（`scripts/build.py`）——`dist/` 是 git 跟踪的产物，不重建就会与源不一致。

分发包不带领域实例与评测：通用 prompt 与 `.skill` 包都不含 `references/providers/<domain>/` 下的领域 Provider（`providers/` 下说明接口的文件照常打包），`.skill` 也不含 `evals/`。需要某个领域时，由使用者把该领域的 Provider 目录单独附上；评测用例从源仓库运行——用例里的答案文件进了被试的 skill 目录，评测就失效了。

---

## 3. frontmatter 标准

```yaml
---
name: check-prd                    # 必需，kebab-case，等于目录名（Kit 约定）
description: ...                   # 必需，触发匹配用，允许领域关键词
user-invocable: true               # Kit 约定必写；省略时外部默认即 true
disable-model-invocation: false    # Kit 约定必写；省略时外部默认即 false
---
```

**真正会让 skill 消失的是键名写错，不是没写。** 这两个字段省略时默认"用户可调用 + 模型可调用"，是安全的默认值。危险的是下面两种写法，它们会让**整个 skill 从发现列表里消失**，只留一条 warning：

| 写法 | 后果 |
| --- | --- |
| 用 camelCase 旧键：`userInvocable` / `modelInvocable` / `disableModelInvocation` | 解析抛错 → 整个 skill 被 ignore |
| 值既不是布尔也不在可强转集合内（`true/false/yes/no/on/off/1/0`，字符串亦可） | 同上 |

也就是说，一个拼写错误的后果不是"该字段失效"，而是"这个 skill 不存在"，且没有任何运行时症状可循——只能靠门禁在提交前拦下。**规范化的键名是 kebab-case 的 `user-invocable` 与 `disable-model-invocation`，没有别的写法。**

**Kit 仍然要求两个字段显式写出**，理由与外部要求无关：读 `SKILL.md` 的人不必先知道默认值才能判断这个 skill 谁能调用；且显式字面量让门禁能校验取值。Kit 收紧一档——**只接受 `true` / `false` 字面量**，不使用 `yes/no/on/off/1/0` 这些可强转写法。

审计类 skill 建议 `user-invocable: true` 且保持模型可调用（`disable-model-invocation: false`）：用户要能手动点名，模型也要能在识别到场景时主动加载。

---

## 4. Model Experience 声明

每个 skill 的 `README.md` 必须有一节 `## Model Experience`，声明这个 skill 在模型上下文里**怎么被消耗**。它的读者是集成者和未来的自己，用来判断"加载这个 skill 要付多少上下文"。

四项必填：

| 项 | 说明 |
| --- | --- |
| **常驻部分** | 进入 catalog 的 `name` + `description`，任何会话都在上下文里，受长度上限约束 |
| **按需加载** | `SKILL.md` 正文，在什么条件下被加载 |
| **二级加载** | `references/` 下哪些文件在什么条件下才读——这是控制上下文预算的主要手段 |
| **上下文预算** | 粗略字数量级（常驻 / 正文 / 典型二级加载各一个数量级即可） |

二级加载的写法要落到具体条件，不是"需要时加载"。Kit 内已有的正例：check-prd 声明"审到第 N 维才读第 N 份维度文件""生成最终报告时读报告模板"——条件可判定，模型能自己决定读不读。

---

## 5. 分发形态：三层同心圆

同一份 skill 目录同时满足三种消费方式，**不为任何一种做特化改造**：

| 形态 | 载体 | 状态 |
| --- | --- | --- |
| A 仓库直用 | `skills/` + `install_skill.py` / `install.sh` / `install.ps1`，宿主侧用符号链接指向 | 现状 |
| B 插件包 | npm 包 + bundle 描述，把 `customSkillDirs` 指向包内 `skills/` | 只记设计，未实施 |
| C 通用 agent 目录 | `.agents/skills/` 共享约定 | 满足第 2 节目录标准即天然支持 |

成熟的 skill 发现机制会扫多类根目录并按优先级排序：项目级专属目录 → 项目级 `.agents/skills` → 可配置的自定义目录 → 用户级专属目录 → 用户级 `.agents/skills`。**形态 C 的 `.agents/skills/` 是项目级与用户级都认的公共约定**；形态 B 的插件包把自定义目录配置指向包内 `skills/` 即可挂载。

**决定成败的一条：`SKILL.md` 正文必须 harness-agnostic。**

具体工具名（某个编辑器的 Edit/Write API）、权限声明语法、子代理派发方式、斜杠命令写法、参数替换占位符（如 `$ARGUMENTS`）——一律不进正文。调用参数在正文里写成「调用方给出的参数」，由各 harness 自己的方式传入。这些属于 adapter 层：安装脚本、bundle 描述、或宿主项目自己的规则文件。

正文里描述能力时用**行为**而不是**工具**："读取目标文档"而不是"用 Read 工具读取"；"派发独立执行者"而不是"调用 Task 工具"。

---

## 6. 机检门禁

本规范的可机判部分由 `tools/gates/` 下的脚本守护，规则改了脚本要同步改：

| 脚本 | 守护本文档的 |
| --- | --- |
| `verify-skill-frontmatter` | 第 2 节目录标准（目录名 === `name`、kebab-case、无嵌套 `SKILL.md`（`dist/` 下同样查）、**自包含**：查 `SKILL.md` 与 `references/` 下全部文档。行内链接、引用式链接定义、行内代码里以 `../` 或 `./` 开头的路径都不得指出 skill 目录（链接与上溯路径相对所在文档解析），行内代码里以 `templates/`、`references/`、`scripts/`、`evals/`、`dist/` 开头的路径必须在 skill 目录内真实存在（相对 skill 根；任意扩展名与目录引用都查，含 `<…>`、`*` 等占位符的模式不查）；行内代码里以 cookbook 层目录 `process/`、`tools/`、`skills/` 开头的路径算目录外引用（`templates/` 开头的按上一条在 skill 目录内查），写成 `<cookbook>/…` 的指针按占位符不查（降级说明由第 2 节第 4 条要求，门禁不判）；行内代码里带扩展名、不带路径的文件名，若 cookbook 层（按 cookbook 自身的真实位置取，不论它在不在宿主仓库内：cookbook 目录下的 `process/`、`templates/`、`tools/` 与 skills 目录，各 skill 的 `dist/` 与 `evals/` 除外）有这个文件、skill 目录内却没有，同样算目录外引用；链接先解码、去掉标题；代码块里的链接与行内代码路径都不查，行内代码里的链接也不算链接（行内代码不跨行））+ 第 3 节 frontmatter 标准（含三个 camelCase 旧键的拦截与 `description` 长度上限 500 字符）+ 共享 reference（`references/code-self-review.md`）各副本逐字一致 |
| `verify-skill-generic-layer` | 第 1 节 Definition 零领域名词（frontmatter 整体免检——`description` 要靠领域词触发 skill；**代码块、行内代码、括号内，以及「例如」「例：」「如：」「比如」「譬如」「e.g.」引导到句末的示例按 1.3 排除**——这些位置不查，写规则句时不要借它们夹带领域名词）+ **Definition 不得写死领域 Provider 路径**（`providers/<具体领域>` 带不带尾斜杠都算，领域目录名不限于 ASCII，词表扫描抓不到它） |
| `verify-skill-host-paths` | 第 9 节宿主契约：cookbook 内的通用内容不写宿主私有路径。禁止的路径片段由宿主在 `gates.hostPrivatePatterns` 声明，行内代码与示例里出现同样算；查 cookbook 内的文本文件（`.md .mjs .js .ts .tsx .py .sh .ps1 .json .css .html .txt .yml .yaml`），各 skill（cookbook 的 `skills/` 下，以及落在 cookbook 内的 `gates.skillsDir` 下）的 `references/providers/`、`evals/`、`dist/`，任意位置的 `CHANGELOG.md`，以及门禁自测 `tools/gates/test/` 不查；cookbook 根下及 skill 内的 `examples/` 都检查（这些位置按相对 cookbook 的路径判断）；cookbook 就是宿主根时，宿主自己的 `cookbook.config.json` 与豁免清单也不查；任意层级的 `node_modules`、`.git`、`__pycache__`、`.DS_Store` 跳过。未声明、或 cookbook 不在宿主仓库内（内容不由本宿主维护）时跳过并说明 |
| `verify-decision-format` | 决策档案格式（见 `process/decision-archive.md`）：首三行、`Status` 首词与 lifecycle 目录一致、class 闭集、文件名、各 lifecycle 的必需章节（只查齐全，不查顺序；代码块里的标题不算）、`Alternatives considered` 非空、相对链接（解码、去标题，代码块里的不查，行内代码里的也不算链接）、不得有索引文件 |
| `verify-no-section-sign` | 章节号符禁令。**增量式**——只查本轮改动过的文件（未提交、已暂存、未跟踪，以及相对 `baseRef` 已提交的；已暂存或已提交的纯重命名不算改动，只在工作区移动、尚未暂存的文件按新文件处理），与「编辑文件时在同一轮清除其中的章节号符」的写作规则对齐。查 `.md .ts .tsx .css .mjs .js .py .sh`，`dist/` 下的构建产物不查 |
| `verify-translation-sync` | 第 8 节双语 sidecar：扫描 cookbook 与 `gates.skillsDir` 下的 `*.en.md`（skill 的 `dist/` 构建产物除外）；`authority` 必须为 `zh`，`translation_of` 必须是同目录对应的中文文件名，`source_version` 必须是原文 blob hash。原文不存在或元信息无效时报错（1）；原文内容 hash 与记录版本不等时警告「译本滞后」，退出码仍为 0；计算 hash 失败退出码 2。Agent 入口文件免检。不检查译文语义，也不把更新 hash 当作完成翻译的证明 |
| `verify-skill-packages` | 已存在的 `.skill` 安装包必须与当前 skill 源文件的成员集合、原始字节及执行权限一致。省略 `dist/`、`evals/`、Git/缓存元数据与 `references/providers/<domain>/`，保留 Provider 接口文件；排除规则相对 skill 根判断。使用 Node 读取 stored/deflate ZIP 并核对成员校验值，不解包、不调用 Python；不支持的包格式或损坏包报错并要求重建；单包最多 20 MiB、展开内容最多 50 MiB、成员最多 5000 个。某个 skill 没有生成包时逐个说明跳过，不代表已验证该 skill 的分发产物 |
| `verify-agent-guide` | 使用说明的 `User intent / Skill / Stage` 路由表与当前 cookbook 的 `skills/` 目录及 frontmatter `name` 集合一致；每个 skill 恰有一行，正文只允许一张该表头的路由表，演示表放在代码块中。`llms.txt` 中的相对文件和目录链接必须存在且留在 cookbook 内，符号链接也不能指到外部；代码示例与外部 URL 不作为本地文件链接。作为 `doc-sync` 内建门禁默认执行；cookbook 根目录没有使用说明和索引时明确跳过，只要有其中一份就检查两份 |
| `verify-changelog` | 各 skill 必须有至少一节合法版本，版本号严格递减；根 CHANGELOG 存在时检查，未发布只允许出现在顶部。按 `gates.baseRef` 和本地改动检查行为文件变化（包括纯重命名）是否同步该 skill 的 CHANGELOG；排除 dist、evals 与 README。skill 根下非点开头目录都要求 CHANGELOG，缺少 SKILL.md 另由入口门禁报告。作为 `doc-sync` 内建门禁执行 |

各门禁所说的「代码块」按栅栏识别：以三个或更多反引号或波浪线开头（反引号栅栏同一行的信息串里不能再有反引号，否则不算栅栏），闭合栅栏须与开栅栏同字符、不短于开栅栏（更长也算闭合）、且该行只有栅栏字符，允许 CRLF 行尾；栅栏可以缩进（列表项里的代码块）；没有闭合的栅栏延续到文末。

聚合命令 `tools/gates/doc-sync.mjs` 依次运行全部门禁，每一道都跑完，最后以最差的退出码结束（2 > 1 > 0）；宿主自己的门禁在 `gates.extraGates` 里声明（也可作为参数追加），追加的门禁不存在、不是文件、或退出码不是 0、1 时按 2 计。宿主通常把它挂在一条 npm 脚本上（如 `npm run doc-sync`）。门禁读取宿主根目录的 `cookbook.config.json`，`gates` 一节的字段：

| 字段 | 含义 | 未声明时 |
| --- | --- | --- |
| `skillsDir` | skill 目录 | cookbook 自带的 `skills/` |
| `decisionsDir` | 决策档案目录 | 决策档案门禁跳过并说明 |
| `styleScanRoots` | 章节号符检查的扫描根，可以是目录或单个文件，`.` 表示整个仓库 | cookbook 目录 |
| `baselineFile` | 豁免清单文件 | 无豁免 |
| `baseRef` | 增量检查的比较基准分支 | `origin/main` |
| `domainWords` | 启用的领域词表，对应 `tools/gates/domain-words/<domain>.json`；写空数组表示只做 Provider 路径检查 | 全部启用 |
| `hostPrivatePatterns` | 宿主私有路径片段，`verify-skill-host-paths` 用它扫描 cookbook | 不扫描 |
| `extraGates` | 宿主自己的门禁脚本（node 脚本，聚合命令用 node 运行），跑完 cookbook 的门禁后依次运行；每个都须是存在的文件 | 无 |

**配置读不懂时门禁直接失败，退出码 2**，不静默放行：配置文件不是合法 JSON、顶层或 `gates`、`hooks` 不是对象、出现不认识的键（顶层只认 `_`、`gates`、`hooks`、`host`；各节及 `host.specMap` 内都可以写 `_` 作注释）、字段类型不对（写成 `null` 也算，不当作未声明）、`styleScanRoots` 为空数组、路径落在宿主仓库之外（绝对路径按真实路径判断；相对路径按写法判断，经仓库内符号链接接入的仓外目录视为在仓内——但 `styleScanRoots` 与 hooks 的三个监视路径靠 git 判断改动，经符号链接指到仓外时 git 看不到那里的改动，这几个字段拒绝这种写法）、声明的目录或文件（含每个扫描根）不存在、`domainWords` 里有不存在的词表、`host` 一节不合第 9 节的约束。章节号符门禁算不出本轮改动时同样退出码 2：宿主不在 git 仓库里、`baseRef` 解析不到、或与当前分支没有共同历史（常见于浅克隆，CI 里需取回完整历史）。仓库还没有任何提交时只查暂存区与未跟踪文件，`baseRef` 不解析，写错也不报。cookbook 经符号链接等方式放在宿主仓库之外时，依赖 cookbook 位置的缺省值推导不出来，要求显式声明对应字段。

宿主根依次取：环境变量 `COOKBOOK_HOST_ROOT`；当前目录所在 git 仓库的根；当前目录不在任何 git 仓库里时，cookbook 自身所在 git 仓库的根；都没有就用当前目录。一律取真实路径。

宿主路径门禁的豁免条目可另声明 `exactLine`：在原有 `file` 与 `match` 条件成立后，命中行还须与该字符串逐字相等才放行（仅忽略 CRLF 行尾的 CR，保留缩进与尾随空白）。它必须是非空、无换行的字符串；检查时非法值退出码为 2。未声明时沿用原有文件与片段匹配；此字段只由 `verify-skill-host-paths` 消费，其他门禁不改变豁免语义。通用清单需要放行时，将豁免绑定清单本身，后续新增的宿主引用仍须接受检查。

豁免清单由宿主维护，**每条必须写 `reason`，缺 `reason` 的条目脚本直接拒绝**；`todo: true` 表示它是待办而非永久豁免，`--list-baseline` 打印全部条目并标出待办——**豁免清单本身就是存量清理的任务清单**。门禁自测在 `tools/gates/test/`，用 `node --test "tools/gates/test/*.test.mjs"` 运行。

`tools/hooks/` 提供自动触发门禁的 hook 脚本，注册样例见同目录的 `claude-settings.example.json` 与 `codex-hooks.example.json`；运行需要 `node`、`git` 与 `bash`，JSON 处理、计数与签名都由 node 完成。

| hook | 何时 | 做什么 |
| --- | --- | --- |
| `post_edit_verify.sh` | 编辑或写入文件后 | 按文件的真实路径与配置目录的真实路径比对：在 `gates.skillsDir` 下时跑三道 skill 门禁（宿主路径、目录与 frontmatter、通用层，各自运行，互不跳过），在 `gates.decisionsDir` 下时跑决策档案门禁，其余文件不处理；整个配置文件仍须合法，但只校验 `gates` 一节的缺省值能否推导 |
| `stop_checks.sh` | 每轮回复结束 | `docSyncWatchPaths` 下有未提交改动时跑 `docSyncCommand`；`codeReviewWatchPaths` 下有未提交改动时提醒做代码缺陷审查，同一组改动只提醒一次（改动签名覆盖已跟踪文件的 diff 与未跟踪文件的内容，状态记在 git 目录的 `hook-state/`） |
| `spec_capture_reminder.sh` | 每轮回复结束 | `captureWatchPaths` 下有未提交改动时提醒可做规则沉淀，不自动执行 |

宿主不在 git 仓库里时，两个 Stop hook 无从判断未提交改动，把这一点作为消息报出来，不静默跳过。提醒文案只写 skill 名，不写某个宿主的命令写法。

`hooks` 一节的字段与缺省值：`captureWatchPaths` 缺省为 cookbook 目录；`docSyncWatchPaths` 缺省为 cookbook 目录加 `gates.decisionsDir`；`codeReviewWatchPaths` 缺省为空，即不提醒；`docSyncCommand` 缺省为用 `node` 直接运行 cookbook 自带的 `tools/gates/doc-sync.mjs`，不依赖宿主的 npm 脚本。三个监视路径按 git pathspec 处理（可以写 `*.md` 这类模式），不校验是否存在；显式声明的监视路径经符号链接指到仓外时配置报错，未声明而推导出的缺省值（含 `gates.decisionsDir`）出这个问题时，门禁照常运行，只让依赖它的 hook 点名来源字段报错；都可以显式写空数组来关闭对应动作。配置读不懂时，hook 把原因作为消息报出来，不静默跳过。hook 只负责提前触发，门禁是否通过以聚合命令的结果为准。

不可机判的部分——判据 1.2、Model Experience 的四项是否写实、正文是否真的 harness-agnostic——靠本文档与 PR review。

首次接入门禁时存量必然飘红，处理方式是先出全量清单、评估修复量、超范围的用显式豁免清单冻结，**新增内容必须干净**。豁免清单里的每一条都要写理由，且本身是待办。

---

## 6.1 eval：方法论产品的单元测试

改一句 `SKILL.md` 之后，没有 eval 就无法判断质量是变好还是变坏。**两层，各司其职，不合并。**

| 层 | 位置 | 形态 | 判定 |
| --- | --- | --- | --- |
| **触发层** | `evals/trigger-evals.json` | `[{ "query": "...", "should_trigger": true\|false }]` | 二值：skill 有没有被唤起 |
| **质量层** | `evals/cases/<case-id>/` | `input.md` + `expected-points.md` + `notes.md` | **要点命中率** |

**触发层每个 skill 都该有**，因为它便宜且守着一整类静默失效：`description` 超长被从尾部截断、措辞不匹配，结果是 skill 唤不起来**且不报错**。至少 3 条 `true` + 2 条 `false`；`false` 那几条防的是过度触发（"帮我写个 PRD" 该起 `create-prd`，不该起 `check-prd`）。**`false` 用例要选兄弟 skill 的地盘**——那才是边界测试，并用可选的 `note` 字段写明它归谁，否则后来者分不清这是边界用例还是写错了。query 用**自然措辞**，不写 skill 名——测的正是用户随口一说时它会不会自己起来。

**质量层只给需要判产出对错的地方。** 判定方式是要点命中率，不是字符串断言——LLM 输出不确定，逐字比对无意义。

跨阶段的人工流程验证使用`process/evals/cases/<case-id>/`，复用input/expected-points/notes及合成fixtures格式。被试读取对应流程和流程层模板；判据及原始结果隔离于被试目录，仍先固定判据、独立判卷。流程级结果单列，不计作标准生成skill的质量分数，也不表示存在自动流程执行器。

- `expected-points.md`：每行一条**可勾选**要点。写"是否输出了领域专项摘要"，不写"质量良好"这类打不了勾的。
- `notes.md`：这个 case 守护哪条规则、为什么这样设计、怎么跑（含隔离环境的搭建步骤）。**实跑结果、判卷结论、case 改过什么不写进 case 目录**——那是过程记录，由使用方记在自己的过程文档里。
- **判据先写死再跑，跑完不改判据。** 跑完再调标准就只是给结果找说法。

**执行者隔离**：eval 判定属审计类。skill 的作者不判自己的 skill——按 `process/agent-execution-protocol.md` 派独立子代理，冷启动输入给全，报告原样转呈。

**语料的归属**：eval 语料保留在 skill 源目录中，随源码分发；安装包不包含 `evals/`，也不包含领域实例。通用评测语料不带具体项目的内容。需要真实业务语料的 case 放 `references/providers/<domain>/` 下随领域层处理，否则用合成语料。

**`evals/` 不属于 Definition 层**，不受零领域名词约束——它本来就该用真实语料。`verify-skill-generic-layer` 的扫描面是 `SKILL.md` 正文加 `references/` 非 providers 部分，不含 `evals/`。


## 7. 新增 skill 的 checklist

- [ ] 目录名 kebab-case，等于 frontmatter `name`
- [ ] frontmatter 四项齐全：`name`、`description`、`user-invocable`、`disable-model-invocation`（后两项显式布尔）
- [ ] 三个角色都设计过：Definition 写了什么、Provider 目录放什么（可以为空，但要在 README 说明如何加）、Consumer 怎么传请求
- [ ] `SKILL.md` 正文零领域名词、零 harness 专名
- [ ] 正文不写宿主路径：spec、产物落点、规则文件都经第 9 节宿主契约的字段引用，读不到就停下请用户指明
- [ ] 所有默认值显式 resolve，没有隐式领域假设
- [ ] `README.md` 含 `## Model Experience` 四项
- [ ] `CHANGELOG.md` 起头
- [ ] `SKILL.md` 有 `## 停机条件`：完成判定、什么情形停下交用户、不宣告通过；写代码的 skill 含交付前的代码缺陷自查，清单用共享的 `references/code-self-review.md`
- [ ] bundle 内只有一个 `SKILL.md`
- [ ] 若有 `dist/`，与源同批重建

---

## 8. 语言

- 本文档及 Kit 内的说明性文档用**中文**（受众是中文 PM），技术术语保留英文原词。
- Definition 层的措辞要能被直接翻译，不依赖中文特有的语境省略。
- **中文是权威，英文是译本**，同步方向为中文 → 英文。规则变更先改中文，再同步英文；禁止只改英文。两份有分歧时以中文为准。
- 英文 sidecar 与中文原文在同一目录，命名为 `<name>.en.md`，如 `README.md` 对应 `README.en.md`。文件头格式如下，`translation_of` 写原文文件名，`source_version` 用 `git hash-object --no-filters <原文>` 取得当前内容的 blob hash（不要求原文已提交）：

```yaml
---
authority: zh
translation_of: README.md
source_version: <原文 git blob hash>
---
```

- 元信息采用固定三字段的单层 scalar 格式：三个字段各出现一次，不接受额外字段、缩进映射、序列或重复键；允许空行。开闭分隔行仅含 `---` 及可选的尾随空格/Tab，`---garbage` 等后缀无效；支持 LF 与 CRLF。
- scalar 可无引号，或用单/双引号包住。无引号文本不含引号、反斜杠、注释符与 YAML 结构符；含这些字符的文件名使用引号。单引号内以两个单引号表达一个单引号，双引号采用 JSON string 转义；不支持完整 YAML 的 tag、anchor、folded/literal scalar 等语法。解析仅用于译本 header，与 skill 的公共 frontmatter parser 独立。
- 译本正文开头标明它是译本、以中文原文为准，并链接到中文原文。
- 同步流程：修改中文 → 运行 `tools/gates/doc-sync.mjs`，出现「译本滞后」警告 → 按新中文同步英文正文 → 重新计算原文 hash 并更新 `source_version` → 再跑门禁。滞后是 warn，不阻断其他检查；缺失原文与非法元信息阻断检查。门禁只判版本对应关系，译文是否准确仍需人工或独立审查。
- 双语说明文档范围为 cookbook 根 `README.md`、`process/overview.md` 与各 skill 的 `README.md`。`SKILL.md` 与 `references/` 保持中文。
- **Agent 文件例外**：`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`、`AGENT_GUIDE.md`、`llms.txt` 只有英文一份，不设中文权威本与译本，不受译本同步门禁约束。Agent 回复用户仍跟随用户语言。


## 9. 宿主契约

skill 运行在某个宿主项目里，要读宿主的 spec、往宿主的目录写产物。宿主的目录约定各不相同，所以 skill 正文**不写任何宿主路径**，只引用宿主契约的字段。契约写在宿主根目录 `cookbook.config.json` 的 `host` 一节，与门禁、hooks 共用同一份文件，由门禁在读取配置时校验。

| 字段 | 含义 | 约束 |
| --- | --- | --- |
| `specMap` | 宿主的 spec 按角色登记：键是角色，值是该角色的 spec 文件或目录（数组） | 角色只能取闭集：`index`（文档总索引）、`loading-rule`（spec 加载规则）、`ui-ux`、`integration`、`testing`、`engineering`、`security`；每个路径必须存在 |
| `moduleDocs` | 模块文档目录的模式 | 必须含占位符 `<module>`，可以独占一个路径段，也可以只占一部分（如 `modules/m-<module>`）；占位符所在路径段的上一级目录必须存在 |
| `testsDir` | 模块内测试产物目录 | 相对模块目录的子路径，可以多级；不得以 `/` 开头，不得含 `..` 段，不得是 `.`，不得含 `<module>` |
| `processRecordsDir` | 模块内过程记录目录（审计、走查、测试报告等） | 同上 |
| `rulebooks` | 宿主的 agent 规则文件 | 每个文件必须存在 |

**读不到就停下。** skill 正文统一写成「读取宿主契约的 X 字段；未声明则停下请用户指明」。不设隐式默认，也不从目录内容反推——那同样是 1.1 第 3 条禁止的隐式默认：在不同约定的宿主里，它会把产物写到错误的位置而不报错。

**契约只管宿主的长期布局。** 一次运行的输入——被处理的模块、模块文件名前缀（可能与模块目录名不同）、录制产物等临时文件的位置——由调用方随请求给出，不进契约；没给出时问用户，同样不从目录内容反推。

**路径怎么拼。** 模块产物落在 `moduleDocs` 把 `<module>` 换成模块名之后的目录；测试产物在其下的 `testsDir`，过程记录在其下的 `processRecordsDir`。spec 按「规则类别 → 角色 → `specMap` 中的路径」解析；角色登记的是目录时，读其下全部 spec 文件再按文件名与标题选。

**门禁。** `verify-skill-host-paths` 守护这条契约：宿主把自己的私有路径片段写进 `gates.hostPrivatePatterns`，cookbook 通用内容里出现即报（第 6 节）。

---

## 来源

本规范的 capability seam 三角色划分、skill 目录与 frontmatter 标准借鉴了一个公开的开源 agent harness 的约定。Model Experience 声明、领域名词判据与豁免、三层分发形态为本文档新增。
