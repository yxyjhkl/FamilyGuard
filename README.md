# 家庭保障检视 (FamilyGuard)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-React%20Native-green.svg)](https://reactnative.dev/)

**让每个家庭都拥有清晰的保障地图，让每次展业都多一份专业底气**

*一款专为保险业务员打造的家庭保障可视化工具*

</div>

---

## 🎯 为什么选择 FamilyGuard？

| 痛点 | 我们的解决方案 |
|:---|:---|
| 手工整理客户家庭保障信息耗时费力 | **5分钟**完成家庭保障诊断 |
| 向客户讲解方案像念"产品说明书" | **一张图**说清全家保障，客户一眼看懂 |
| 客户听完就忘，后续跟进乏力 | **一键分享**精美报告，微信直发，持续影响决策 |
| 难以快速发现保障缺口 | **智能分析**自动定位保障盲区，精准切入追加话题 |
| 展业工具同质化严重 | **差异化名片**专业可视化报告，提升签单竞争力 |

---

## ✨ 核心功能

### 📊 5分钟家庭保障诊断
- 20+ 种预置家庭模板，快速构建客户家庭结构
- 覆盖常见家庭、多元家庭、隔代家庭等多种场景

### 🎨 可视化保障全景图
- 家庭组织架构图 + 成员保障详情
- 权益覆盖率、保障完善度一目了然
- 现代轻奢金融风，传递专业与可信赖

### 🔍 智能缺口分析
- 7项基础保障：重疾、身价、医疗、养老、防癌、意外、教育
- 7项增值权益：信托、国医、居养、家医、特药、超疗、税优
- 自动计算保障缺口，精准发现销售机会

### 📤 一键导出分享
- 精美检视图片（金句 + 保障总览 + 成员详情）
- 隐私控制：可隐藏姓名和关键信息
- 业务员名片开关：展示个人联系方式
- 支持保存相册 / 微信分享

### 🤖 AI 智能总结（预留）
- 预留 AI 接口，接入 API Key 后自动生成智能保障建议

---

## 📱 页面一览

| 页面 | 功能说明 |
|:---|:---|
| 首页 | 家庭列表，新建入口，长按删除 |
| 家庭结构选择 | 网格模板展示，分常见/多元家庭分类 |
| 家庭成员列表 | 成员卡片 + 保障概览 |
| 成员保障详情 | 保障/权益双Tab编辑，实时缺口计算 |
| 导出预览 | 实时预览 + 隐私配置 + 保存/分享 |

---

## 🛠️ 技术栈

| 层级 | 技术选型 |
|:---|:---|
| 框架 | React Native 0.76 + TypeScript |
| 导航 | React Navigation 6 (Native Stack) |
| 状态管理 | React Context + AsyncStorage |
| UI 组件库 | React Native Paper (Material Design) |
| 图片导出 | react-native-view-shot |
| 分享能力 | react-native-share + CameraRoll |
| 图标 | react-native-vector-icons |

---

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/yxyjhkl/FamilyGuard.git
cd FamilyGuard

# 2. 安装依赖
npm install

# 3. iOS 安装原生依赖
cd ios && pod install && cd ..

# 4. 启动开发服务器
npx react-native start

# 5. 运行应用
npx react-native run-android   # Android
npx react-native run-ios       # iOS
```

---

## 📁 项目结构

```
FamilyGuard/
├── src/
│   ├── types/          # 类型定义
│   ├── data/           # 静态数据（家庭模板、金句、保障选项）
│   ├── store/          # 状态管理 + 本地存储
│   ├── services/       # 业务服务（导出、分享、AI预留）
│   ├── hooks/          # 自定义Hook
│   ├── components/     # UI组件
│   │   ├── common/     # 通用组件
│   │   ├── family/     # 家庭相关组件
│   │   ├── member/     # 成员相关组件
│   │   ├── insurance/  # 保障/权益组件
│   │   └── export/     # 导出组件
│   ├── screens/        # 页面
│   ├── navigation/     # 导航配置
│   ├── utils/          # 工具函数
│   └── theme/          # 主题系统
├── App.tsx             # 应用入口
└── package.json        # 依赖配置
```

---

## 💡 使用流程

```
1️⃣ 创建家庭    → 选择模板 → 输入家庭名称
        ↓
2️⃣ 编辑保障    → 为每位成员配置保障项和权益
        ↓
3️⃣ 导出分享    → 配置隐私 → 选择金句 → 保存/分享
```

---

## 🎯 目标用户

- ✅ 保险代理人 / 经纪人
- ✅ 保险团队主管
- ✅ 银保渠道客户经理
- ✅ 任何需要向客户展示家庭保障方案的人

---

## 📄 License

MIT License - 欢迎 Star & Fork

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐**

</div>
