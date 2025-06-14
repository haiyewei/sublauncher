const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const subprojectsConfigFile = path.join(rootDir, 'subprojects.json');
const headersFile = path.join(rootDir, '_headers');

// 递归复制文件夹及其内容
function copyFolderRecursiveSync(source, target) {
  // 检查目标文件夹是否存在，如果不存在则创建
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // 读取源文件夹中的所有文件和文件夹
  const files = fs.readdirSync(source);

  // 遍历所有文件和文件夹
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    // 检查当前项是文件还是文件夹
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // 递归复制子文件夹
      copyFolderRecursiveSync(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// 移除资源引用中的前导斜杠（例如从src="/"改为src=""）
function removeLeadingSlashInAssetPaths(htmlFilePath) {
  console.log(`Removing leading slashes in asset paths in ${htmlFilePath}...`);
  
  try {
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    
    // 1. 修复 script 标签中的 src 属性引用
    htmlContent = htmlContent.replace(/src=["']\//g, 'src="');
    
    // 2. 修复 link 标签中的 href 属性引用
    htmlContent = htmlContent.replace(/href=["']\//g, 'href="');
    
    // 3. 修复其他潜在的资源引用
    htmlContent = htmlContent.replace(/content=["']\//g, 'content="');
    
    // 4. 修复 URL("/path") 这样的引用（可能存在于内联CSS中）
    htmlContent = htmlContent.replace(/url\(["']\//g, 'url("');
    
    // 写回修改后的内容
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
    console.log(`Successfully removed leading slashes in asset paths in ${htmlFilePath}`);
  } catch (error) {
    console.error(`Error removing leading slashes in ${htmlFilePath}:`, error.message);
  }
}

// 复制配置文件到dist目录
function copyConfigFiles() {
  // 复制_headers文件
  if (fs.existsSync(headersFile)) {
    fs.copyFileSync(headersFile, path.join(distDir, '_headers'));
    console.log('Copied _headers to dist directory');
  }
}

function main() {
  if (!fs.existsSync(subprojectsConfigFile)) {
    console.error(`Error: Configuration file not found at ${subprojectsConfigFile}`);
    console.error('Please create subprojects.json in the project root.');
    process.exit(1);
  }

  let config;
  try {
    const configFileContent = fs.readFileSync(subprojectsConfigFile, 'utf-8');
    config = JSON.parse(configFileContent);
  } catch (error) {
    console.error(`Error reading or parsing ${subprojectsConfigFile}:`, error.message);
    process.exit(1);
  }

  // 确保配置格式正确
  if (!config.projects || !Array.isArray(config.projects) || config.projects.length === 0) {
    console.log(`No projects found in ${subprojectsConfigFile} or the file format is invalid.`);
    return;
  }

  // 处理每个项目
  for (const project of config.projects) {
    if (!project.name) {
      console.warn(`\nSkipping invalid project entry (missing name):`, JSON.stringify(project));
      continue;
    }

    const projectName = project.name;
    const publicProjectPath = path.join(publicDir, projectName);
    const distProjectPath = path.join(distDir, projectName);

    // 检查public中是否存在该子项目
    if (fs.existsSync(publicProjectPath) && fs.statSync(publicProjectPath).isDirectory()) {
      console.log(`\nCopying project ${projectName} from public to dist...`);
      
      // 确保目标目录存在
      if (!fs.existsSync(distProjectPath)) {
        fs.mkdirSync(distProjectPath, { recursive: true });
      }
      
      // 将子项目从public目录复制到dist目录
      copyFolderRecursiveSync(publicProjectPath, distProjectPath);
      console.log(`Successfully copied ${projectName} to dist directory`);
      
      // 处理入口文件中的资源路径
      const indexHtmlPath = path.join(distProjectPath, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        // 移除资源引用中的前导斜杠
        removeLeadingSlashInAssetPaths(indexHtmlPath);
      } else {
        console.log(`No index.html found in ${distProjectPath}. Skipping asset path fixes.`);
      }
    } else {
      console.warn(`\nWarning: Project ${projectName} not found in public directory. Skipping.`);
    }
  }

  // 复制配置文件
  copyConfigFiles();

  console.log('\nAll subprojects have been copied to the dist directory.');
}

main(); 