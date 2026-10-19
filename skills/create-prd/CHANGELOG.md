<!-- Derived from pmYangKun/create-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

# CHANGELOG

## v0.1.0

- 首个公开版本。
- 基于原开源 [`create-prd`](https://github.com/pmYangKun/create-prd-skill) skill 扩展，保留原作者的方法论框架与通用 B 端 PRD 生成能力。
- 补充功能模块级 PRD、Domain Model 引用、跨模块数据流一致性、敏感数据权限、验收标准引用与回流、专项自检等能力。
- 领域规则通过 Provider 接入：自带 HR 领域 Provider，调用方指明 `hrm` 领域时加载；未指明时只执行通用框架。
- 附数据驱动的泳道流程图生成器与结构校验脚本、章节模板、质量评测用例及自包含的分发包；生成器支持回到前序步骤的连线，图例在窄图中自动换行。
- 依据上游 Apache-2.0 分发；随附上游 LICENSE、NOTICE，修改文件保留派生与修改声明，独立 Prompt 与安装包携带许可内容。
