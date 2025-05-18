const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const subprojectsConfigFile = path.join(rootDir, 'subprojects.json');
const redirectsFile = path.join(rootDir, '_redirects');
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

// 生成_redirects文件
function generateRedirects(projects) {
  console.log('Generating _redirects file from projects configuration...');
  
  let redirectsContent = '';
  
  // 为每个项目添加重定向规则
  projects.forEach(project => {
    if (project.name) {
      // 先处理资源文件的访问，让它们直接通过，不做重定向
      redirectsContent += `/${project.name}/assets/* /${project.name}/assets/:splat 200\n`;
      // 其他路径使用标准重定向
      redirectsContent += `/${project.name}/* /${project.name}/:splat 200\n`;
    }
  });
  
  // 写入_redirects文件
  fs.writeFileSync(redirectsFile, redirectsContent);
  console.log('Generated _redirects file with the following content:');
  console.log(redirectsContent);
}

// 复制配置文件到dist目录
function copyConfigFiles() {
  // 复制_headers文件
  if (fs.existsSync(headersFile)) {
    fs.copyFileSync(headersFile, path.join(distDir, '_headers'));
    console.log('Copied _headers to dist directory');
  }

  // 复制_redirects文件
  if (fs.existsSync(redirectsFile)) {
    fs.copyFileSync(redirectsFile, path.join(distDir, '_redirects'));
    console.log('Copied _redirects to dist directory');
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

  // 首先生成_redirects文件
  generateRedirects(config.projects);

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
    } else {
      console.warn(`\nWarning: Project ${projectName} not found in public directory. Skipping.`);
    }
  }

  // 复制配置文件
  copyConfigFiles();

  console.log('\nAll subprojects have been copied to the dist directory.');
}

main(); 