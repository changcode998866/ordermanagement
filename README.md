# 餐饮外卖后台管理系统

Vue 3 + TypeScript + Vite + Element Plus 的商家后台，覆盖门店、商品/分类、订单、配送、用户、优惠券、报表与账号权限。

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 生产构建
```

演示账号（密码均为 `123456`）：

| 账号 | 角色 | 权限 |
| --- | --- | --- |
| admin | 超级管理员 | 全部菜单与按钮 |
| operator | 运营人员 | 无门店/报表/系统菜单，无删除按钮 |

## 对接真实后端

1. `.env.development` 中设置 `VITE_USE_MOCK=false`，`VITE_PROXY_TARGET` 指向后端地址（开发期 `/api` 走 Vite 代理）。
2. 后端统一返回 `{ code: 0, message: string, data: T }`，`code === 401` 视为登录失效；分页返回 `{ list, total }`。
3. 接口清单见 `src/api/index.ts`，Mock 实现（可作为接口文档参考）见 `src/mock/routes.ts`。
4. 用户信息接口需返回 `role` 与 `permissions`（按钮权限码，`*` 表示全部）。

## 目录结构

```
src/
├── api/            # axios 封装（拦截器、Mock 适配器开关）与业务接口
├── mock/           # 前端 Mock：种子数据、路由匹配、订单状态机
├── router/         # 静态路由 + 动态路由（按角色过滤）+ 守卫
├── stores/         # Pinia：user（登录/权限）、permission（菜单）、app（主题/折叠）
├── directives/     # v-permission 按钮级权限
├── composables/    # useTable（列表分页）、useFormDialog（新增/编辑弹窗）
├── components/     # EChart、ImageUpload、RichEditor（WangEditor）
├── layout/         # 侧边栏、顶栏（面包屑、新订单提醒、深色模式）
├── views/          # 业务页面
└── utils/          # 字典、格式化、Excel 导出、ECharts 按需注册
```

## 订单状态流转

```
待支付 → 待接单 ─接单→ 制作中 ─派单(选骑手)→ 配送中 ─确认送达→ 已完成
            └─拒单→ 已取消                       已完成 ─用户申请→ 退款中 ─同意→ 已退款
                                                                       └─拒绝→ 已完成
```

## 工程规范

- `pnpm lint` / `pnpm lint:style` / `pnpm format`
- 提交时 Husky + lint-staged 自动校验，commitlint 约束提交信息（如 `feat: 新增优惠券模块`）
- 运行效果图
- <img width="3544" height="1896" alt="image" src="https://github.com/user-attachments/assets/dd898a2f-5342-4d46-aa82-851a3b39c694" />
<img width="3508" height="1744" alt="image" src="https://github.com/user-attachments/assets/71fea867-a592-4a4c-ba50-0ec18aa5b5ff" />
<img width="3566" height="1668" alt="image" src="https://github.com/user-attachments/assets/68f2a01b-f79e-4461-af0a-5b99b0586394" />
<img width="3488" height="1670" alt="image" src="https://github.com/user-attachments/assets/3a91a717-1ed2-4ca8-b58b-3316852046a3" />
<img width="3548" height="1712" alt="image" src="https://github.com/user-attachments/assets/69dff8ba-98cb-4611-86ce-0d9551a92c53" />






