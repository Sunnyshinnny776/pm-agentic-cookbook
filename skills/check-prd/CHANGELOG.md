<!-- Derived from pmYangKun/check-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

# CHANGELOG

## v0.1.0

- 首个公开版本。
- 基于原开源 [`check-prd`](https://github.com/pmYangKun/check-prd-skill) skill 扩展，保留原作者的方法论框架与 14 个维度的 B 端 PRD 审查能力。
- 补充 Overview PRD、功能模块级 PRD、Domain Model 一致性、跨模块数据流、敏感数据权限、导入同步幂等与专项风险项等审查能力。
- 领域规则通过 Provider 接入：自带 HR 领域 Provider，调用方指明 `hrm` 领域时加载；未指明时只执行通用框架。
- 逐维度执行并给出可定位的发现；只如实评估成熟度与缺口，不自行宣告通过。
- 附审查指引与否决项附录、质量评测用例及自包含的分发包；安装脚本从本仓库的 skill 目录运行。
- 依据上游 Apache-2.0 分发；随附上游 LICENSE、NOTICE，修改文件保留派生与修改声明，独立 Prompt 与安装包携带许可内容。
