const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..'); // 项目根目录
const subDir = path.join(rootDir, 'sub'); // 子项目目录
const publicDir = path.join(rootDir, 'public'); // 静态文件目录
const subprojectsConfigFile = path.join(rootDir, 'subprojects.json'); // 子项目配置文件

/**
 * 删除目录及其内容
 * @param {string} dirPath 要删除的目录路径
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing directory: ${dirPath}`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Successfully removed: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`Error removing directory ${dirPath}:`, error.message);
      return false;
    }
  } else {
    console.log(`Directory does not exist, skipping: ${dirPath}`);
    return false;
  }
}

/**
 * 从子项目配置文件中获取项目列表
 * @returns {Array<string>} 项目名称列表
 */
function getProjectsFromConfig() {
  try {
    if (!fs.existsSync(subprojectsConfigFile)) {
      console.warn(`Config file not found: ${subprojectsConfigFile}`);
      return [];
    }
    
    const configContent = fs.readFileSync(subprojectsConfigFile, 'utf-8');
    const config = JSON.parse(configContent);
    
    if (!config.projects || !Array.isArray(config.projects)) {
      console.warn('No projects found in config file');
      return [];
    }
    
    // 提取项目名称
    return config.projects
      .filter(project => project.name)
      .map(project => project.name);
      
  } catch (error) {
    console.error('Error reading projects from config:', error.message);
    return [];
  }
}

/**
 * 清理子目录中的所有子项目文件夹
 * @param {string} parentDir 父目录路径
 * @param {Array<string>} projectNames 项目名称列表
 */
function cleanProjectDirectories(parentDir, projectNames) {
  if (!fs.existsSync(parentDir)) {
    console.log(`Parent directory does not exist: ${parentDir}`);
    return;
  }
  
  let removedCount = 0;
  
  if (projectNames.length > 0) {
    console.log(`Cleaning ${projectNames.length} project directories in ${parentDir}...`);
    
    // 清理特定的项目目录
    for (const projectName of projectNames) {
      const projectDir = path.join(parentDir, projectName);
      if (removeDirectory(projectDir)) {
        removedCount++;
      }
    }
  } else {
    console.log(`No specific projects to clean. Will clean all subdirectories in ${parentDir}`);
    
    // 如果未指定项目列表，尝试清理所有子目录（除了特定的除外）
    try {
      const dirs = fs.readdirSync(parentDir);
      
      // 在public目录中保留的文件/目录
      const preserveInPublic = ['favicon.svg', 'robots.txt', 'manifest.json'];
      
      for (const dir of dirs) {
        // 在public目录中，跳过特定文件
        if (parentDir === publicDir && preserveInPublic.includes(dir)) {
          console.log(`Preserving ${dir} in public directory`);
          continue;
        }
        
        const fullPath = path.join(parentDir, dir);
        if (fs.statSync(fullPath).isDirectory()) {
          if (removeDirectory(fullPath)) {
            removedCount++;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${parentDir}:`, error.message);
    }
  }
  
  console.log(`Removed ${removedCount} directories from ${parentDir}`);
}

/**
 * 主函数
 */
function main() {
  console.log('Starting cleanup process...');
  
  // 获取子项目列表
  const projectNames = getProjectsFromConfig();
  console.log(`Found ${projectNames.length} projects in config: ${projectNames.join(', ') || 'none'}`);
  
  // 清理 /sub 目录
  console.log('\n=== Cleaning /sub directory ===');
  cleanProjectDirectories(subDir, projectNames);
  
  // 清理 /public 目录中的子项目文件夹
  console.log('\n=== Cleaning /public directory ===');
  cleanProjectDirectories(publicDir, projectNames);
  
  console.log('\nCleanup complete!');
}

// 执行主函数
main(); 