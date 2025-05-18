# Qwik City App ⚡️

- [Qwik Docs](https://qwik.dev/)
- [Discord](https://qwik.dev/chat)
- [Qwik GitHub](https://github.com/QwikDev/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

---

## Project Structure

This project is using Qwik with [QwikCity](https://qwik.dev/qwikcity/overview/). QwikCity is just an extra set of tools on top of Qwik to make it easier to build a full site, including directory-based routing, layouts, and more.

Inside your project, you'll see the following directory structure:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory-based routing, which can include a hierarchy of `layout.tsx` layout files, and an `index.tsx` file as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.dev/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

## Add Integrations and deployment

Use the `npm run qwik add` command to add additional integrations. Some examples of integrations includes: Cloudflare, Netlify or Express Server, and the [Static Site Generator (SSG)](https://qwik.dev/qwikcity/guides/static-site-generation/).

```shell
npm run qwik add # or `yarn qwik add`
```

## Development

Development mode uses [Vite's development server](https://vitejs.dev/). The `dev` command will server-side render (SSR) the output during development.

```shell
npm start # or `yarn start`
```

> Note: during dev mode, Vite may request a significant number of `.js` files. This does not represent a Qwik production build.

## Preview

The preview command will create a production build of the client modules, a production build of `src/entry.preview.tsx`, and run a local server. The preview server is only for convenience to preview a production build locally and should not be used as a production server.

```shell
npm run preview # or `yarn preview`
```

## Production

The production build will generate client and server modules by running both client and server build commands. The build command will use Typescript to run a type check on the source code.

```shell
npm run build # or `yarn build`
```

## 子项目启动器系统

本项目包含一个用于管理和启动多个子项目的系统。它利用 `subprojects.json` 配置文件和几个 npm 脚本来自动化克隆、构建和提供这些子项目的过程。

### `subprojects.json` 配置

这个位于项目根目录的 JSON 文件定义了要管理的子项目及其行为的全局设置。

**结构：**

```json
{
  "settings": {
    "disableMainPage": false,
    "defaultProject": "my-first-app"
  },
  "projects": [
    {
      "name": "my-first-app",
      "repoUrl": "https://github.com/your-username/my-first-app.git",
      "buildOutput": "dist",
      "commitHash": "a1b2c3d4e5f6...",
      "root": "frontend"
    },
    {
      "name": "another-project",
      "repoUrl": "https://example.com/your-repo/another-project.git",
      "buildOutput": "build"
    }
  ]
}
```

**字段说明：**

- **`settings` (对象):** 子项目启动器的全局设置。
  - **`disableMainPage` (布尔值, 可选):** 如果设置为 `true`，主应用程序页面（根路径 `/`）将被禁用。此时，如果指定了 `defaultProject`，将重定向到该默认项目。默认为 `false`。
  - **`defaultProject` (字符串, 可选):** 当 `disableMainPage` 为 `true` 时要重定向到的子项目的名称。如果未指定且 `disableMainPage` 为 `true`，脚本将尝试使用 `projects` 数组中的第一个项目。如果没有定义项目，则会发出警告。
- **`projects` (数组):** 一个对象数组，每个对象代表一个子项目。
  - **`name` (字符串, 必填):** 子项目的唯一名称。此名称将用于在 `/sub`（用于克隆）和 `/public`（用于提供服务）中创建目录。例如：`my-first-app`。
  - **`repoUrl` (字符串, 必填):** 子项目的 Git 仓库 URL。例如：`https://github.com/your-username/my-first-app.git`。
  - **`buildOutput` (字符串, 可选):** 子项目（克隆和构建后）内部包含静态构建产物（例如 `index.html`、`assets/`）的目录名称。默认为 `dist`。例如：`build`、`public`、`_site`。
  - **`commitHash` (字符串, 可选):** 克隆/获取仓库后要检出的特定 Git 提交哈希、分支名称或标签。如果省略，脚本将使用默认分支（`main` 或 `master`）的最新提交。例如：`a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`、`develop`、`v1.2.0`。
  - **`root` (字符串, 可选):** 如果子项目的实际代码和 `package.json` 位于克隆仓库内的子目录中，请在此处指定该子目录的路径。构建命令（`npm install`、`npm run build`）将在此子目录内执行。`buildOutput` 路径也将相对于此 `root` 目录。例如：`packages/my-app`、`frontend`。

### 自定义 NPM 脚本

`package.json` 中提供了几个 npm 脚本来管理子项目：

- **`npm run subuild`**:
  - 读取 `subprojects.json`。
  - 对每个项目执行：
    1.  将仓库克隆到 `/sub/项目名称` 目录（如果不存在），或者获取并检出指定的 `commitHash`（如果未指定哈希，则拉取最新版本）。
    2.  如果指定了 `root` 目录，则导航到 `/sub/项目名称/根目录`。
    3.  运行 `npm install` 安装依赖。
    4.  运行 `npm run build` 构建子项目。
    5.  将 `buildOutput` 目录的内容（例如 `/sub/项目名称/dist` 或 `/sub/项目名称/根目录/dist`）复制到 `/public/项目名称`。
    6.  修改 `/public/项目名称` 中的 `index.html`，以确保资源路径（如 `src="/assets/..."`）被正确添加项目名前缀（例如 `src="/项目名称/assets/..."`）。
  - 更新 `.gitignore` 以忽略 `/sub/` 和所有 `/public/项目名称/` 目录。
  - 如果 `settings.disableMainPage` 为 true，则在 `/public/` 中创建一个指向 `defaultProject` 的重定向 `index.html` 文件。

- **`npm run build`**:
  - 运行标准的 Qwik 应用程序构建 (`qwik build`)。
  - 然后，运行 `npm run subuild` 处理所有子项目。

- **`npm run clean`**:
  - 读取 `subprojects.json` 获取项目名称列表。
  - 从 `/sub/` 删除所有对应的项目目录。
  - 从 `/public/` 删除所有对应的项目目录（同时保留常见的静态文件，如 `favicon.svg`、`robots.txt`）。
  - 如果未找到 `subprojects.json` 或未列出任何项目，则脚本将尝试清理 `/sub/` 和 `/public/` 中的所有子目录（对 `/public/` 采用相同的保留规则）。

### 工作流程

1.  **配置**: 在 `subprojects.json` 中定义您的子项目和设置。
2.  **构建**: 运行 `npm run build`。这将构建您的主 Qwik 应用，然后获取、构建并准备所有子项目。
3.  **开发**: 运行 `npm start` (或 `npm run dev`)。Vite 开发服务器将提供您的主 Qwik 应用以及 `/public` 目录中的子项目。
    - 子项目将通过 `http://localhost:PORT/项目名称/` 访问。
    - 如果访问 `http://localhost:PORT/项目名称/` 时未自动提供子项目的 `index.html`，`vite.config.ts` 已被修改以包含一个自定义插件来处理 `/public` 子目录的这种情况。
4.  **清理 (可选)**: 运行 `npm run clean` 以从 `/sub` 和 `/public` 中删除所有已下载的子项目源代码及其构建产物。

该系统提供了一种在单个 Qwik 应用程序框架下集成和管理多个独立前端项目的简化方法。 