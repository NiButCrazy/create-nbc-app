import { checkbox, input, select, Separator } from '@inquirer/prompts'
import { parse, selectDescription } from './utils'
import { selectTheme, inputTheme, checkBoxTheme, otherTheme } from './themes'
import { exec } from 'child_process'
import ora from 'ora'
import fs from 'fs'
import color from 'picocolors'
import path from 'node:path'

// 获取当前模块的目录
const __dirname = import.meta.dirname

const projectNameRegex = /^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/)?[a-z0-9-~][a-z0-9-._~]*$/

export async function run(argv: string[]) {

  // 获取项目名
  let projectName = ''
  if (argv.length >= 3) {
    projectName = argv[2]
    const isValid = projectNameRegex.test(projectName)
    if (isValid) {
      console.log(color.green('✓') + color.yellowBright(' 传入项目名称: ') + color.cyan(projectName))
    } else {
      projectName = ''
      console.log(color.red('> 项目名称格式不合法'))
    }
  }

  // 项目名称
  const answer_projectName = !projectName ? await input({
    message: '请输入项目名称:',
    default: 'my-project',
    prefill: 'tab',
    required: true,
    theme: inputTheme,
    validate: (answer) => {
      return projectNameRegex.test(answer)
    }
  }) : projectName

  // 判断是不是其他模板
  let isOther = false
  // 选择模板
  let answer_template = await select({
    message: '选择一个应用模板',
    instructions: { navigation: '↑↓', pager: '使用方向键进行选择' },
    theme: selectTheme,
    choices: [
      new Separator(),
      {
        name: 'react',
        value: 'react',
        description: selectDescription({
          dependencies: [ 'zustand', 'react router' ],
          introduce: '组件化开发，由 React Router 路由管理、Zustand 全局状态管理'
        })
      },
      {
        name: 'electron',
        value: 'electron',
        description: selectDescription({
          dependencies: [ 'zustand', 'react router', 'electron', 'electron-builder', 'electron-devtools-installer' ],
          introduce: '组件化开发，由 React Router 路由管理、Zustand 全局状态管理\n' +
            '  支持一键打包、React DevTools 开发者工具、原生 DevTools 字体美化'
        }),
      },
      {
        name: 'tampermonkey',
        value: 'tampermonkey',
        description: selectDescription({
          dependencies: [ 'zustand', 'vite-plugin-monkey' ],
          introduce: '智能收集并注入 @grant 注释、预览模式下自动构建并安装修改脚本\n' +
            '  完全的 Typescript 和 Vite 的开发体验，比如模块热替换，秒启动'
        }),
      },
      {
        name: 'node',
        value: 'node',
        description: selectDescription({
          build: 'tsdown',
          framework: 'node',
          css: 'vitest',
          dependencies: [ 'ora', 'picocolors' ],
          introduce: '为库开发者提供了完整的开箱即用解决方案、无缝且高效的打包方式\n' +
            '  无需复杂配置，自动生成 .d.ts 声明文件、支持多种输出格式等功能'
        }),
      },
      {
        name: 'other',
        value: 'other',
        description: selectDescription({ isOther: true }),
      },
      new Separator(),
    ],
  })

  // 获取其他模板
  if (answer_template === 'other') {
    isOther = true
    answer_template = await input({
      message: '模板仓库名称:',
      required: true,
      theme: otherTheme,
    })
  }

  // 是否需要额外的配置文件
  const answer_extra = !isOther ? await checkbox({
    message: '额外的配置文件',
    theme: checkBoxTheme,
    instructions: color.dim(` [ <${ color.cyan('空格') }>勾选 | <${ color.cyan('A') }>全选 | ` +
      `<${ color.cyan('I') }>反选 | <${ color.cyan('Enter') }>提交 ]`),
    choices: [
      {
        name: '.idea',
        value: 'idea',
        checked: true,
        description: color.magentaBright('\n  JetBrains 项目配置文件，包含所需插件信息、项目运行配置、代码检查配置')
      },
      {
        name: '.editorconfig',
        value: 'editorconfig',
        checked: true,
        description: color.magentaBright('\n  代码格式规范，搭配 JetBrains 保存自动重新设置代码格式比 Prettier 好用')
      },
    ],
  }) : []

  // 是否使用 Git 而不是直接下载 .tar.gz
  const answer_git = await select({
    message: '是否使用 git 克隆模式',
    theme: selectTheme,
    choices: [
      {
        name: '否',
        value: false,
        description: `
  ${ color.green('支持缓存、下载速度快') }
  ${ color.dim(('不支持私有仓库、不支持换行符自动转换')) }`,
      },
      {
        name: '是',
        value: true,
        description: `
  ${ color.green('支持私有仓库、支持换行符自动转换') }
  ${ color.dim(('不支持缓存、下载速度慢')) }`,
      },
    ],
  })

  // 处理选项
  handleAnswers(answer_projectName, answer_template, answer_extra, isOther, answer_git)
}

// 模板仓库
const templateRepos: Record<string, string> = {
  tampermonkey: 'NiButCrazy/Vite-Tampermonkey-Template',
  react: 'NiButCrazy/Vite-React-Template',
  electron: 'NiButCrazy/Vite-Electron-React-Template',
  node: 'NiButCrazy/tsdown-node-template',
}

// 处理回答
function handleAnswers(name: string, template: string, extra: string[], isOther: boolean, answer_git: boolean) {
  // 加载动画
  const spinner = ora({
    spinner: {
      interval: 80,
      frames: [ '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏' ]
    }
  })
  console.log(color.dim('➥ 开始下载模板: ' + template))
  spinner.start('下载中...')

  const repo = !isOther ? templateRepos[template] : template
  let cmd = 'tiged' + ' ' + repo + ' ' + name
  if (answer_git) {
    const repoOptions = parse(repo)
    if (repoOptions.subgroup) {
      repoOptions.subgroup = true
      repoOptions.name = repoOptions.subdir?.slice(1) ?? ''
      repoOptions.url += repoOptions.subdir
      repoOptions.ssh = `${ repoOptions.ssh + repoOptions.subdir }.git`
    }
    cmd = 'git clone --depth 1' + ' ' + repoOptions.url + '.git' + ' ' + name
  }

  // 执行 tiged 下载命令
  exec(
    cmd,
    (error) => {
      process.stdout.write('\x1b[1A') // 移动光标到上一行
      process.stdout.write('\x1b[K') // 清除当前行
      if (error) {

        spinner.fail('下载失败')
        if (error.message.includes('destination directory is not empty')) {
          console.log(color.red('  ➥ 存在同名目录: ' + name))
        } else if (error.message.includes('DegitError: could not parse')) {
          console.log(color.red('  ➥ 无法解析地址: ' + template))
        } else if (error.message.includes('could not fetch remote')) {
          console.log(color.red('  ➥ 无法获取仓库: ' + template + '\n    ➥ 请检查拼写或网络代理'))
          console.log(repo)
        } else if (error.message.includes('could not find commit hash for')) {
          console.log(color.red('  ➥ 未找到指定 commit: ' + template))
        } else {
          console.error(color.red('  ➥ 未知错误: ' + error.message))
        }
        return
      } else {

        // 目标路径
        const destPath = path.join(process.cwd(), name)

        // 删除 .git 目录
        if (answer_git) {
          fs.rm(path.join(destPath, '.git'), { recursive: true, force: true }, (error) => {
            if (error) {
              console.error(color.red('    ➥ 未知错误: ' + error.message))
            }
          })
        }

        // 常规模板下载后
        if (!isOther) {
          // 创建 .editorconfig 文件
          if (extra.includes('editorconfig')) {
            fs.copyFile(
              path.join(__dirname, '../public/.editorconfig'),
              path.join(destPath, '.editorconfig'),
              (error) => {
                if (error) {
                  console.error(color.red('    ➥ 未知错误: ' + error.message))
                }
              }
            )
          }
          // 删除 .idea 目录
          if (!extra.includes('idea')) {
            fs.rm(path.join(destPath, '.idea'), { recursive: true, force: true }, (error) => {
              if (error) {
                console.error(color.red('    ➥ 未知错误: ' + error.message))
              }
            })
          }
        }
        // 写入 package.json 文件项目名
        const pkg = JSON.parse(
          fs.readFileSync(path.join(destPath, `package.json`), 'utf-8'),
        )

        pkg.name = name

        fs.writeFile(path.join(destPath, `package.json`), JSON.stringify(pkg, null, 2) + '\n',
          (error) => {
            spinner.stop()
            if (error) {
              console.error(color.red('    ➥ 未知错误: ' + error.message))
            } else {
              console.log(color.green('✓' + ' 模板下载成功'))
              console.log(color.dim('  ➥ 模板目录: ' + destPath))
            }
          })

      }
    }
  )
}


