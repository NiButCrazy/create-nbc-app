import fs from 'fs'
import path from 'node:path'

// 获取当前模块的目录
const __dirname = import.meta.dirname

fs.copyFile(
  path.join(__dirname, '../.gitignore'),
  path.join('E:\\MyCode\\'),
  (error) => {
    if (error) {
      console.error(error)
    }
  }
)