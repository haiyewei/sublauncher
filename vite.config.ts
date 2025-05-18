/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { defineConfig, type UserConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";
import * as fs from 'fs';
import * as path from 'path';
import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

type PkgDep = Record<string, string>;
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep;
  devDependencies: PkgDep;
  [key: string]: unknown;
};
errorOnDuplicatesPkgDeps(devDependencies, dependencies);

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ command, mode }): UserConfig => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      tsconfigPaths(),
      // 添加自定义插件来处理子项目路由
      {
        name: 'handle-subproject-routes',
        configureServer(server: ViteDevServer) {
          server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
            // 处理只到达目录但没有尾随斜杠的请求 (例如 /mvianav)
            if (req.url && !req.url.endsWith('/') && !req.url.includes('.')) {
              // 获取请求路径
              const requestPath = req.url.split('?')[0]; // 移除查询参数
              // 查看 public/requestPath/index.html 是否存在
              const publicPath = path.join(process.cwd(), 'public', requestPath.substring(1));
              const indexPath = path.join(publicPath, 'index.html');
              
              if (fs.existsSync(publicPath) && fs.statSync(publicPath).isDirectory() && fs.existsSync(indexPath)) {
                // 如果目录和index.html都存在，使用绝对路径重定向到目录路径 + '/'
                // 注意：使用绝对路径避免无限重定向循环
                res.writeHead(302, { 'Location': `/${requestPath.substring(1)}/` });
                res.end();
                return;
              }
            }
            
            // 处理目录请求 (例如 /mvianav/)
            if (req.url && req.url.endsWith('/')) {
              const requestPath = req.url.split('?')[0]; // 移除查询参数
              // 查看对应的index.html是否存在
              const indexPath = path.join(
                process.cwd(), 
                'public', 
                requestPath.substring(1), 
                'index.html'
              );
              
              if (fs.existsSync(indexPath)) {
                // 直接发送index.html文件内容
                const content = fs.readFileSync(indexPath);
                res.setHeader('Content-Type', 'text/html');
                res.end(content);
                return;
              }
            }
            
            next();
          });
        }
      }
    ],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: [],
    },

    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr:
    //   command === "build" && mode === "production"
    //     ? {
    //         // All dev dependencies should be bundled in the server build
    //         noExternal: Object.keys(devDependencies),
    //         // Anything marked as a dependency will not be bundled
    //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
    //         // If a dep-of-dep needs to be external, add it here
    //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
    //         // external: [...Object.keys(dependencies), 'bcrypt']
    //         external: Object.keys(dependencies),
    //       }
    //     : undefined,

    server: {
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});

// *** utils ***

/**
 * Function to identify duplicate dependencies and throw an error
 * @param {Object} devDependencies - List of development dependencies
 * @param {Object} dependencies - List of production dependencies
 */
function errorOnDuplicatesPkgDeps(
  devDependencies: PkgDep,
  dependencies: PkgDep,
) {
  let msg = "";
  // Create an array 'duplicateDeps' by filtering devDependencies.
  // If a dependency also exists in dependencies, it is considered a duplicate.
  const duplicateDeps = Object.keys(devDependencies).filter(
    (dep) => dependencies[dep],
  );

  // include any known qwik packages
  const qwikPkg = Object.keys(dependencies).filter((value) =>
    /qwik/i.test(value),
  );

  // any errors for missing "qwik-city-plan"
  // [PLUGIN_ERROR]: Invalid module "@qwik-city-plan" is not a valid package
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;

  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }

  // Format the error message with the duplicates list.
  // The `join` function is used to represent the elements of the 'duplicateDeps' array as a comma-separated string.
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;

  // Throw an error with the constructed message.
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
