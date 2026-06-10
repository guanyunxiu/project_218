## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "React App" --> "Three.js 3D引擎"
        "Three.js 3D引擎" --> "@react-three/fiber"
        "@react-three/fiber" --> "@react-three/drei"
        "@react-three/fiber" --> "@react-three/postprocessing"
    end
    subgraph "UI层"
        "React App" --> "时光卡片弹窗"
        "React App" --> "HUD导航"
    end
    subgraph "数据层"
        "展品数据(内嵌JSON)" --> "展区配置"
        "展品数据(内嵌JSON)" --> "展品信息"
    end
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + Tailwind CSS@3 + Vite
- **初始化工具**：vite-init (react-ts模板)
- **3D引擎**：Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- **状态管理**：Zustand（管理选中展品、卡片显隐等状态）
- **后端**：无（纯前端项目，数据内嵌）
- **数据库**：无

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 博物馆主场景（全屏3D画布+悬浮UI） |

## 4. 数据模型

### 4.1 展品数据结构

```typescript
interface Exhibit {
  id: string
  name: string
  era: '远古足迹' | '古典荣光' | '工业变革' | '未来幻境'
  description: string
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  geometry: 'pyramid' | 'sphere' | 'column' | 'gear' | 'crystal' | 'obelisk' | 'dome' | 'engine' | 'helix' | 'cube'
}

interface EraZone {
  id: string
  name: string
  color: string
  groundColor: string
  position: [number, number, number]
  exhibits: Exhibit[]
}
```

### 4.2 展品初始数据

**远古足迹展区**：
- 石器手斧：粗糙的几何锥体，代表人类最初的工具制造
- 巨石图腾：高耸的方尖碑形，象征原始信仰与崇拜

**古典荣光展区**：
- 雅典柱式：经典圆柱体，体现古希腊建筑之美
- 罗马穹顶：球形穹顶，代表古罗马工程奇迹

**工业变革展区**：
- 蒸汽齿轮：咬合的齿轮组，标志机械化时代的来临
- 动力引擎：活塞与气缸组合，象征工业革命核心

**未来幻境展区**：
- 量子晶体：多面体水晶结构，预示量子科技未来
- 星际方舟：几何方体与光环组合，象征星际旅行梦想

## 5. 项目目录结构

```
src/
├── components/
│   ├── Museum.tsx          # 博物馆主场景组件
│   ├── Hall.tsx            # 大厅环境（地面/墙壁/立柱）
│   ├── EraZone.tsx         # 展区组件
│   ├── ExhibitPedestal.tsx # 展台组件（含自发光）
│   ├── Exhibit.tsx         # 展品组件（几何体组合）
│   ├── TimeCard.tsx        # 时光卡片弹窗
│   └── HUD.tsx             # 悬浮导航HUD
├── data/
│   └── exhibits.ts         # 展品与展区数据
├── store/
│   └── useMuseumStore.ts   # Zustand状态管理
├── App.tsx                 # 应用入口
└── main.tsx                # 渲染入口
```
