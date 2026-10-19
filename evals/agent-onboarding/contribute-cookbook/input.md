# input：向 cookbook 贡献一条检查项

只向被试发送“给被试的原话”。执行准备、判据与 notes 不进入被试上下文。

## 执行准备

1. 冻结被测产品树、实际可用 skill 清单与本例判据。
2. 在仓外建立该产品树的中性工作副本，排除 Git 历史、个人配置、所有 evals、依赖与构建缓存。保留该产品自己的贡献者规则、skill、构建脚本、门禁、README 和版本记录。
3. Initialize a fresh neutral Git baseline in the scratch copy and configure a valid doc-sync comparison ref. The initial snapshot may be registered as a local origin/main ref. Do not connect to or push to a remote repository. Preserve the target product dependencies and configuration; do not replace its gates with stubs.
4. 被试与判卷分别独立启动，不把使用场景的执行上下文带进贡献场景。记录框架自动加载的规则；不要将其与被试主动读取混为一谈。
5. 给被试一次自然请求，不提示内部应修改哪层、如何重建或如何同步文档。必要追问交真实用户答复，保留原始问答。

## 给被试的原话

> 请给 table-template-designer 增加一条规则：表格支持批量粘贴时，遇到不在下拉选项内的值，应显示具体行列和原始值，不能静默替换成第一个选项。
