# Deep Diving Web Simulator — Agent Build Prompt

你现在是一名资深前端工程师 + Web 游戏/交互模拟器工程师。请从零开始实现一个 **Web 潜水模拟器 MVP**。

目标不是复刻 Steam 游戏《Deep Diving Simulator》的全部内容，而是做一个偏真实、可交互、可扩展的 **Scuba Diving Simulator / Dive Training WebApp**。

---

## 1. 技术栈

必须使用：

- Node.js
- npm
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand
- React Router
- Recharts

可以按需使用：

- lucide-react
- Framer Motion
- React Hook Form
- Zod

暂时不要使用：

- Three.js
- React Three Fiber
- 复杂后端
- 数据库
- 登录系统

第一阶段全部运行在浏览器本地。

---

## 2. 产品目标

实现一条完整潜水流程：

```text
Dive Planner
    ↓
Pre-Dive Check
    ↓
Dive Simulator
    ↓
Safety Stop / Ascent
    ↓
Dive Log
```

用户可以：

1. 选择潜点
2. 设置最大深度
3. 设置计划潜水时间
4. 选择气瓶
5. 设置起始气压
6. 设置 reserve pressure
7. 设置 SAC / RMV
8. 设置配重
9. 设置湿衣
10. 开始潜水
11. 控制下潜 / 上升
12. 控制 BCD
13. 模拟呼吸对浮力的影响
14. 实时查看深度、环境压力和耗气
15. 查看气瓶剩余压力
16. 查看实时浮力趋势
17. 控制上升速度
18. 完成 5m 安全停留
19. 结束潜水并生成 Dive Log

这个 MVP 的核心不是视觉特效，而是：

> “潜水物理 + 实时仪表 + 可交互训练”。

---

# 3. 页面结构

使用 React Router。

路由：

```text
/
 /planner
 /dive
 /physics
 /log
```

---

# 4. 全局 UI 风格

整体视觉风格：

- 深色模式优先
- 水下 / Dive Computer 风格
- 简洁、现代
- 仪表盘风格
- 信息密度适中
- 不做卡通风
- 不使用过度渐变
- 不要堆叠大量无意义 Card

推荐布局：

```text
┌────────────────────────────────────────────┐
│ Top Navigation                             │
├────────────────────────────────────────────┤
│                                            │
│ Main Content                               │
│                                            │
└────────────────────────────────────────────┘
```

shadcn/ui 优先使用：

- Button
- Card
- Slider
- Select
- Tabs
- Badge
- Progress
- Alert
- Dialog
- Tooltip
- Sheet
- Separator

图标使用 lucide-react。

---

# 5. Dive Planner

页面：

```text
/planner
```

分成几个区域。

## Dive Site

预置潜点：

```ts
Racha Yai
maxDepth: 30
waterType: "salt"
temperature: 29
visibility: 20
current: "low"

Racha Noi
maxDepth: 40
waterType: "salt"
temperature: 28
visibility: 25
current: "medium"

Training Pool
maxDepth: 5
waterType: "fresh"
temperature: 27
visibility: 30
current: "none"
```

用户可以选择潜点。

---

## Dive Plan

字段：

```text
Max Depth
Bottom Time
Starting Pressure
Reserve Pressure
SAC / RMV
```

默认：

```text
Max Depth: 20m
Bottom Time: 30min
Starting Pressure: 200 bar
Reserve Pressure: 50 bar
SAC: 16 L/min
```

---

## Cylinder

第一版支持：

```ts
AL80
waterVolume: 11.1 L
workingPressure: 207 bar

Steel 12L
waterVolume: 12 L
workingPressure: 232 bar

Steel 15L
waterVolume: 15 L
workingPressure: 232 bar
```

计算可用气体：

```ts
gasVolumeLiters = cylinderVolume * pressureBar
```

---

## Exposure Suit

支持：

```text
None
3mm Wetsuit
5mm Wetsuit
7mm Wetsuit
```

每个配置包含：

```ts
surfaceBuoyancyKg
compressionFactor
```

不需要追求绝对科研级精度。

重点是：

- 越深
- wetsuit 浮力越低

---

## Weight

Slider：

```text
0kg - 12kg
```

默认：

```text
4kg
```

---

## Start Dive

点击：

```text
Start Dive
```

将 planner 参数保存至 Zustand。

跳转：

```text
/dive
```

---

# 6. Dive Simulator

这是整个 MVP 的核心。

布局建议：

```text
┌────────────────────────────────────────────┐
│ Dive Computer HUD                          │
├───────────────────────┬────────────────────┤
│                       │                    │
│ Depth Visualization   │ Controls           │
│                       │                    │
│ Diver                 │ BCD                │
│                       │ Breathing          │
│                       │ Movement           │
│                       │                    │
├───────────────────────┴────────────────────┤
│ Charts / Physics                           │
└────────────────────────────────────────────┘
```

---

# 7. Dive Computer

顶部显示一个大号 Dive Computer。

至少包括：

```text
DEPTH
18.4 m

DIVE TIME
22:31

TANK
143 bar

GAS
1587 L

ASCENT
6.2 m/min

AMBIENT
2.84 ATA
```

状态：

```text
Normal
Low Gas
Reserve Gas
Fast Ascent
Safety Stop
Surface
```

---

# 8. 环境压力

使用简化公式：

```ts
ambientPressureAta = depthMeters / 10 + 1
```

示例：

```text
0m = 1 ATA
10m = 2 ATA
20m = 3 ATA
30m = 4 ATA
40m = 5 ATA
```

---

# 9. Gas Consumption

SAC / RMV：

```ts
gasConsumptionLpm =
  sacRate * ambientPressureAta
```

例如：

```text
SAC = 16 L/min

20m:
16 × 3 = 48 L/min
```

每一个 simulation tick：

```ts
gasRemaining -= gasConsumptionLpm * elapsedMinutes
```

然后：

```ts
tankPressure =
  gasRemainingLiters / cylinderVolumeLiters
```

不能低于：

```text
0 bar
```

---

# 10. Simulation Loop

建议：

```text
100ms tick
```

但物理计算全部使用：

```ts
deltaTime
```

不能依赖固定 FPS。

推荐：

```ts
requestAnimationFrame
```

状态：

```ts
depth
verticalVelocity
tankPressure
gasRemaining
bcdVolume
lungVolume
buoyancy
diveTime
```

---

# 11. 深度控制

用户不能直接拖动 depth。

Depth 必须由：

```text
buoyancy
+
vertical velocity
```

决定。

简化：

```ts
verticalAcceleration =
  netBuoyancyKg * buoyancyAccelerationFactor
```

然后：

```ts
verticalVelocity += verticalAcceleration * dt
depth -= verticalVelocity * dt
```

注意：

```text
depth >= 0
depth <= site.maxDepth
```

---

# 12. Lung / Breathing

支持：

```text
Inhale
Exhale
```

或者 Slider：

```text
2.5L - 5.5L
```

默认：

```text
3.5L
```

近似：

```text
1L displaced water ≈ 1kg buoyancy
```

因此：

```ts
lungBuoyancyKg =
  lungVolumeLiters - neutralLungVolume
```

比如：

```text
neutralLungVolume = 3.5L
```

则：

```text
5L
=> +1.5kg

2.5L
=> -1kg
```

实际用户体验中，不要让肺部变化导致瞬间高速上浮。

需要加入：

```text
velocity damping
```

---

# 13. BCD

BCD Volume：

```text
0L - 12L
```

按钮：

```text
Inflate
Deflate
```

按住持续增加 / 减少。

推荐速度：

```text
inflate: +1L/sec
deflate: -1.5L/sec
```

BCD 浮力：

```ts
bcdBuoyancyKg ~= bcdVolumeLiters
```

---

# 14. Boyle's Law

BCD 空气随着深度变化。

使用：

```ts
P1 * V1 = P2 * V2
```

实现一个简化模型。

当潜水员上升：

```text
pressure ↓
BCD gas volume ↑
buoyancy ↑
```

当潜水员下潜：

```text
pressure ↑
BCD gas volume ↓
buoyancy ↓
```

系统应该允许产生：

```text
runaway ascent
```

也就是说：

```text
上升
→ 压力降低
→ BCD 膨胀
→ 浮力增加
→ 上升更快
```

用户需要主动：

```text
Deflate BCD
```

---

# 15. Wetsuit Compression

Wetsuit 浮力随着深度下降。

使用简单经验模型即可。

例如：

```ts
compressionRatio =
  1 / ambientPressureAta ** 0.35
```

然后：

```ts
wetsuitBuoyancy =
  surfaceBuoyancy * compressionRatio
```

不要求科研级准确。

要求趋势正确：

```text
surface
more buoyant

deep
less buoyant
```

---

# 16. Tank Gas Weight

需要体现：

```text
200 bar tank
```

和：

```text
50 bar tank
```

重量不同。

近似：

```ts
airDensityKgPerLiterSurface = 0.001225
```

气体质量：

```ts
gasMass =
  gasVolumeLiters * 0.001225
```

随着耗气：

```text
tank gets lighter
```

因此潜水后半程：

```text
buoyancy increases
```

---

# 17. 总浮力

创建：

```ts
calculateNetBuoyancy()
```

考虑：

```text
body
lung
BCD
wetsuit
weights
tank
tank gas
```

第一版只要求相对趋势合理。

例如：

```ts
netBuoyancyKg =
  bodyBaseBuoyancy
  + lungBuoyancy
  + bcdBuoyancy
  + wetsuitBuoyancy
  + tankBuoyancy
  - weightKg
```

界面显示：

```text
NET BUOYANCY

+1.2 kg ↑
```

或：

```text
-0.8 kg ↓
```

或者：

```text
0.0 kg
NEUTRAL
```

---

# 18. 上升速度

显示：

```text
ASCENT RATE
```

推荐安全上限：

```text
9 m/min
```

如果：

```text
> 9m/min
```

显示明显 warning：

```text
ASCENT TOO FAST
```

如果：

```text
> 12m/min
```

显示：

```text
DANGEROUS ASCENT
```

同时 UI 变为 warning 状态。

---

# 19. Safety Stop

如果：

```text
max depth >= 10m
```

则上升时在：

```text
4.5m - 5.5m
```

进入：

```text
SAFETY STOP
```

倒计时：

```text
3:00
```

只有当：

```text
depth between 4.5m and 5.5m
```

计时器才运行。

离开范围：

暂停计时。

完成后：

```text
SAFETY STOP COMPLETE
```

---

# 20. Gas Alerts

加入：

```text
100 bar
Low Gas

70 bar
Turn / Prepare to Ascend

50 bar
Reserve
```

Reserve 以用户设置值为准。

UI 使用：

```text
Alert
Badge
```

---

# 21. Dive End Conditions

正常：

```text
depth <= 0.3m
```

显示：

```text
End Dive
```

如果用户：

```text
tank = 0
```

显示：

```text
OUT OF GAS
```

但不要强制结束 simulation。

---

# 22. Dive Log

页面：

```text
/log
```

显示：

```text
Dive Complete
```

统计：

```text
Dive Site
Max Depth
Dive Time
Starting Pressure
Ending Pressure
Gas Used
Average Depth
Average SAC
Max Ascent Rate
Safety Stop
```

评分不要复杂。

可以显示：

```text
Buoyancy Control
Ascent Control
Gas Management
```

只做简单状态：

```text
Good
Needs Improvement
Unsafe
```

根据明显规则判断。

---

# 23. Physics Lab

页面：

```text
/physics
```

实现多个 tab：

```text
Pressure
Gas Consumption
Buoyancy
BCD Expansion
Tank Weight
```

---

## Pressure

Slider：

```text
Depth 0 - 40m
```

实时：

```text
Depth
Pressure ATA
```

图表：

```text
Depth vs Ambient Pressure
```

---

## Gas Consumption

输入：

```text
SAC
Depth
```

显示：

```text
Surface Consumption
Actual Consumption
```

---

## Buoyancy

Slider：

```text
Lung Volume
BCD Volume
Weight
Depth
```

实时显示：

```text
Net Buoyancy
```

---

## BCD Expansion

显示：

```text
BCD volume vs depth
```

允许：

```text
Start at 30m with 2L
```

然后 slider 上升到：

```text
0m
```

观察体积变化。

---

## Tank Weight

展示：

```text
200bar
150bar
100bar
50bar
```

对应：

```text
gas mass
```

---

# 24. Zustand Store

创建：

```ts
useDiveStore
```

大致结构：

```ts
interface DiveState {
  plan: DivePlan

  simulation: {
    isRunning: boolean
    depth: number
    maxDepth: number
    diveTimeSeconds: number

    verticalVelocity: number

    bcdVolume: number
    lungVolume: number

    tankPressure: number
    gasRemainingLiters: number

    netBuoyancyKg: number

    safetyStopRemainingSeconds: number
  }

  startDive(): void
  resetDive(): void

  inflateBCD(): void
  deflateBCD(): void

  inhale(): void
  exhale(): void
}
```

避免把全部业务逻辑塞在组件中。

---

# 25. Physics Engine

所有核心公式放到：

```text
src/lib/physics/
```

例如：

```text
pressure.ts
gas.ts
buoyancy.ts
tank.ts
wetsuit.ts
simulation.ts
```

必须写成：

```text
pure functions
```

例如：

```ts
calculateAmbientPressure(depth)

calculateGasConsumption(
  sac,
  depth
)

calculateTankGasMass(
  tankVolume,
  pressure
)

calculateWetsuitBuoyancy(
  surfaceBuoyancy,
  depth
)

calculateNetBuoyancy(...)
```

---

# 26. 单元测试

使用：

```text
Vitest
```

至少测试：

```text
0m = 1 ATA
10m = 2 ATA
20m = 3 ATA
30m = 4 ATA
```

测试：

```text
SAC 16 @ 20m
≈ 48L/min
```

测试：

```text
tank pressure decreases
```

测试：

```text
wetsuit buoyancy decreases with depth
```

测试：

```text
BCD volume increases when pressure decreases
```

---

# 27. 项目目录

建议：

```text
src/
├── app/
├── components/
│   ├── dive/
│   ├── planner/
│   ├── physics/
│   └── ui/
├── pages/
│   ├── HomePage.tsx
│   ├── PlannerPage.tsx
│   ├── DivePage.tsx
│   ├── PhysicsPage.tsx
│   └── DiveLogPage.tsx
├── lib/
│   ├── physics/
│   │   ├── pressure.ts
│   │   ├── gas.ts
│   │   ├── buoyancy.ts
│   │   ├── tank.ts
│   │   ├── wetsuit.ts
│   │   └── simulation.ts
│   └── utils.ts
├── store/
│   └── dive-store.ts
├── types/
│   └── dive.ts
└── data/
    ├── dive-sites.ts
    └── cylinders.ts
```

---

# 28. Home Page

首页不要复杂。

Hero：

```text
DIVE LAB

Interactive Scuba Diving Simulator
```

副标题：

```text
Learn buoyancy, gas management and ascent control
through an interactive dive simulation.
```

两个主要按钮：

```text
Plan a Dive
Physics Lab
```

下面展示：

```text
Buoyancy
Gas Management
Ascent Control
Dive Physics
```

---

# 29. Desktop First

第一阶段：

```text
Desktop First
```

最低：

```text
1280px
```

必须基本支持：

```text
768px
```

但不需要优先优化手机。

---

# 30. 键盘控制

Dive Simulator 支持：

```text
W
Inhale

S
Exhale

Space
Inflate BCD

Shift
Deflate BCD
```

页面同时必须有按钮。

不能只支持键盘。

---

# 31. UX 要求

Simulation 不要突然跳动。

需要：

```text
smooth values
```

实时数值可以显示：

```text
18.4m
143 bar
6.2m/min
```

不要显示过多小数。

图表最多：

```text
Depth over Time
Tank Pressure over Time
```

初版不要同时展示 8 个 chart。

---

# 32. 物理模型原则

这是一个：

```text
training simulator
```

不是：

```text
certified dive planner
```

在 About / Physics 页面加入说明：

```text
This simulator uses simplified dive physics for
education and experimentation.

It must not be used as a replacement for certified
dive training, a dive computer, or real dive planning.
```

---

# 33. 开发顺序

必须按照：

## Phase 1

搭项目：

```text
Vite
React
TypeScript
Tailwind
shadcn/ui
React Router
Zustand
```

先确认：

```text
npm run dev
```

正常。

---

## Phase 2

实现：

```text
data models
physics functions
unit tests
```

先不要做复杂 UI。

---

## Phase 3

实现：

```text
Planner
```

---

## Phase 4

实现：

```text
Dive Simulator
```

---

## Phase 5

实现：

```text
Dive Log
```

---

## Phase 6

实现：

```text
Physics Lab
```

---

## Phase 7

Polish：

```text
keyboard controls
warnings
animations
responsive
```

---

# 34. 验收场景

必须可以完成以下场景。

## Scenario A

```text
Cylinder:
AL80

Starting pressure:
200 bar

SAC:
16 L/min

Max depth:
20m
```

开始潜水。

用户下潜至：

```text
20m
```

看到：

```text
Ambient pressure ≈ 3 ATA
Gas consumption ≈ 48 L/min
```

---

## Scenario B

在：

```text
20m
```

增加 BCD。

用户开始上升。

随着上升：

```text
BCD volume increases
```

如果用户不排气：

```text
ascent accelerates
```

---

## Scenario C

上升速度超过：

```text
9m/min
```

出现：

```text
ASCENT TOO FAST
```

---

## Scenario D

到：

```text
5m
```

开始：

```text
03:00 Safety Stop
```

深度离开：

```text
4.5 - 5.5m
```

暂停 timer。

---

## Scenario E

气瓶：

```text
200 bar
→ 50 bar
```

tank gas mass 减少。

潜水员整体浮力趋势变正。

---

# 35. 第一版不做

明确不要：

```text
login
backend
multiplayer
real maps
3D ocean
fish AI
missions
inventory
payments
social
achievements
WebSocket
```

这些以后再扩展。

---

# 36. Coding 标准

必须：

```text
TypeScript strict
```

避免：

```text
any
```

React components：

```text
small
reusable
```

业务逻辑：

```text
不要放进 JSX
```

physics：

```text
pure functions
```

constants：

```text
不要 magic numbers
```

必须：

```text
eslint
prettier
```

---

# 37. README

README 必须包含：

```text
What is Dive Lab
Features
Tech Stack
How to Run
Architecture
Physics Model
Known Limitations
Roadmap
```

运行：

```bash
npm install
npm run dev
```

测试：

```bash
npm test
```

---

# 38. 最终交付要求

完成后请自行检查：

```bash
npm install
npm run build
npm test
```

确保：

```text
build passes
tests pass
no obvious console errors
```

然后输出：

```text
1. Implemented features
2. Project structure
3. Physics assumptions
4. Known limitations
5. Recommended next steps
```

---

# 39. 最重要的设计原则

不要把这个项目做成：

```text
一堆表单 + 数字
```

而是做成：

```text
一个会“动”的潜水物理实验室
```

核心体验应该是：

```text
用户吸气
↓
浮力发生变化
↓
几秒后开始缓慢上升

用户继续上升
↓
BCD 膨胀
↓
浮力越来越大
↓
必须排气

气瓶逐渐变空
↓
气瓶变轻
↓
潜水员越来越正浮力

深度增加
↓
耗气明显增加
```

用户应该能通过操作直接“感受到”潜水物理。

---

# 40. 开始任务

现在开始实现。

第一步：

```text
1. 初始化 Vite + React + TypeScript
2. 安装并配置 Tailwind + shadcn/ui
3. 安装 React Router + Zustand + Recharts
4. 建立目录结构
5. 创建核心 TypeScript types
6. 编写 physics pure functions
7. 添加 Vitest
8. 完成 Physics 单元测试
9. 再开始做 UI
```

不要一次性写超大的单文件。

每完成一个阶段，都保持项目：

```text
npm run build
```

可通过。

目标是最终交付一个可以直接：

```bash
npm install
npm run dev
```

启动的完整 MVP。
