import color from 'picocolors'


/**
 * 选择模板描述信息
 * @param build='vite' 构建工具
 * @param framework='react' 前端框架
 * @param lang='typescript' 编程语言
 * @param css='less' 样式预处理
 * @param dependencies 工具依赖包
 * @param introduce 描述信息
 * @param isOther 是否为其他模板
 */
export function selectDescription(
  {
    build = 'vite',
    framework = 'react',
    lang = 'typescript',
    css = 'less',
    dependencies = [],
    introduce = '',
    isOther = false
  } = { dependencies: [ '' ] }): string {
  if (isOther) {
    return color.magentaBright(
      `\n  下载其他仓库的模板，格式为:\n` +
      color.white(`
  - user/repo
  - github:user/repo
  - git@github.com:user/repo
  - https://github.com/user/repo
  - user/repo#dev       # branch
  - user/repo#v1.2.3    # release tag
  - user/repo#a1b2c3d4  # commit hash
  `)
    )
  }
  const isNode = framework === 'node'
  let description = `
  ${ color.blue('构建工具') + ': ' + color.cyan(build) }
  ${ !isNode ? (color.blue('前端框架') + ': ' + color.cyan(framework)) : (color.blue('运行环境') + ': ' + color.cyan(framework)) }
  ${ color.blue('编程语言') + ': ' + color.cyan(lang) }
  ${ !isNode ? (color.blue('样式预处理') + ': ' + color.cyan(css)) : (color.blue('测试框架') + ': ' + color.cyan(css)) }
  ${ dependencies.length ? (color.blue('工具依赖包') + ': ' + color.cyan(dependencies.join(color.white(' | ')))) : '' }

  ${ color.magentaBright(introduce) }
`
  return description
}

