# 规则沉淀示例：冲突前置检查

> 本文展示一条交互规则如何从一次走查返工进入 spec。事件来自真实项目，叙述已脱敏：业务对象统一换成参考规则库所用的零售连锁示例。

---

## 背景

总部为一个计划周期创建「门店计划任务」：选择周期、计划模板和若干门店，确认后为每家门店生成一条待发布的任务。同一周期里，一家门店同一时间只能有一条在途任务。

## 第一版：先执行，再在成功提示里补报

第一版的处理方式是：用户点「确认创建」后，服务端逐家创建；已有在途任务的门店被跳过，页面弹出成功提示，并在提示里补报哪些门店没有创建。

测试全部通过，功能看起来也完整。

## 走查：问题出在用户什么时候知道

走查时，用户把这一交互判定为错误：

- 用户选了一批门店，系统只做了其中一部分，**用户是在操作完成之后才知道自己的意图没有被完整执行**；
- 成功提示里混进了没做成的部分，「成功」与「部分失败」在同一条消息里，很容易被忽略；
- 被跳过的门店要用户自己回头排查，并决定是否另做处理。

裁定是：**冲突必须在执行之前检测并展示，由用户决定排除冲突项后继续，还是取消。** 全部冲突时直接拒绝创建。

## 修复：把冲突判断前移

1. 把「哪些门店会冲突」写成一个纯函数：输入所选门店与现有任务，输出冲突清单。它不依赖页面，可以单独测试。
2. 页面在执行前调用它：有冲突时弹出确认框，列出冲突门店，提供「排除后创建其余」与「取消」；全部冲突时提示并拒绝。
3. 服务端的跳过逻辑保留，但降为兜底，只处理检查之后、执行之前才出现的并发冲突。
4. 为冲突检测补上单元测试，覆盖部分冲突、全部冲突与无冲突三种情况。

## 第二轮走查：唯一性该在哪一步拦

修复后又暴露出相关问题：同一门店、同一周期、同一模板的任务处于「待发布」时，重复创建会静默替换旧的草稿。用户以为是新建，实际是覆盖；想改草稿，也只能靠重新创建。

第二条裁定是：**任务以「周期 × 门店 × 模板」为唯一身份，重复创建在创建前的检查中拦截，不再静默替换**；修改草稿改为提供正式的编辑操作，只在「待发布」时可用。由此归纳出的规则是：身份唯一性在创建时拦截，不推迟到后续步骤——推迟到发布等后续步骤再拦，会留下无法推进的草稿，报错也离起因很远。后续步骤只检查状态类条件（例如周期已归档），并保留服务端兜底。

## 沉淀：写进 spec

当天阶段收尾时，这两条裁定作为候选规则交用户确认，确认后写进布局与交互规范，即 [layout_interaction_spec](../specs/ui-ux/specs/layout_interaction_spec.md)。写法是通用规则在前、示例在后：

> **Pre-execution conflict check**: when an action can conflict with existing data (duplicate identity, in-flight work), the conflict MUST be detected and presented BEFORE the action executes, with the user deciding (exclude conflicting items and continue / cancel). Never execute first and report the skipped part inside a success message.
>
> **Uniqueness is enforced at creation, not at a later workflow step**: identity constraints (e.g. one active task per cycle × unit × template) block at create time. Deferring the block to a later step (e.g. dispatch) creates undispatchable zombie drafts and moves the error far from its cause. Later steps only guard state-type conditions (e.g. archived cycle), plus a service-side backstop for race windows.

规则里没有门店、计划任务这些词。换一个项目，例如批量给员工发起调薪或批量导入供应商，规则原样适用，只需换示例。

同一条规则也进入了 `ui-generator` 的默认 UI/UX 规则，没有项目规则的新项目在生成原型时就会遵守它。

## 这个过程说明了什么

- **测试通过不代表交互正确。** 第一版的测试全部通过，问题是在走查中由人发现的：它违反的是用户预期，不是代码逻辑。
- **裁定的是原则，不是这一处的修法。** 「先执行再补报」被判错误，换来的是一条能覆盖所有批量操作的规则，而不只是改好这一个弹窗。
- **规则写成通用句才能复用。** 写成「创建计划任务时要先检查冲突」，它只对这一个页面有用；写成「可能与已有数据冲突的操作，先检测再执行」，它对之后每一个批量操作都有用。
- **沉淀由用户确认。** AI 提出候选规则，是否成立、写进哪份 spec，由用户决定。

对应的 skill 是 `spec-capture`：在阶段收尾时回看本阶段产出，把已确定、可复用的规则落到最小的 owning spec。
