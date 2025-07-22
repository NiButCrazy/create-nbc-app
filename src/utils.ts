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
  ${ color.dim('> 右键粘贴') }
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

const supported: Record<string, string> = {
  github: '.com',
  gitlab: '.com',
  bitbucket: '.com',
  'git.sr.ht': '.ht',
  huggingface: '.co',
  codeberg: '.org',
}


/**
 * 表示存储库.
 */
export interface Repo {
  /**
   * 存储库的托管服务或站点
   */
  site: string;

  /**
   * 存储库所在的用户名或组织
   */
  user: string;

  /**
   * 仓库名称
   */
  name: string;

  /**
   * 对存储库中特定分支、提交或标记的引用
   */
  ref: string;

  /**
   * 通过 HTTP 或 HTTPS 访问存储库的 URL
   */
  url: string;

  /**
   * 用于访问存储库以进行 Git 的 SSH URL
   */
  ssh: string;

  /**
   * 自选：存储库中要使用的特定子目录（如果适用）。如果不使用，可以为null
   */
  subdir?: string | null;

  /**
   * 作模式或与存储库的交互方式。有效模式为
   * `'tar'` 和 `'git'`.
   */
  mode: 'git' | 'tar';

  /**
   * 用于克隆存储库的源 URL 或路径
   */
  src: string;

  /**
   * 可选：指示存储库是否属于子组,
   * 如果托管服务支持
   */
  subgroup?: boolean;
}


export function parse(src: string): Repo {
  const match =
    /^(?:(?:https:\/\/)?([^:/]+\.[^:/]+)\/|git@([^:/]+)[:/]|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:((?:\/[^/\s#]+)+))?(?:\/)?(?:#(.+))?/.exec(
      src,
    )

  if (!match) {
    throw new Error(`无效的仓库URL: ${ src }`)
  }

  const site = match[1] || match[2] || match[3] || 'github.com'
  const tldMatch = /\.([a-z]{2,})$/.exec(site)
  const tld = tldMatch ? tldMatch[0] : null
  const siteName = tld ? site.replace(new RegExp(`${tld}$`), '') : site

  const user = match[4] ?? ''
  const name = match[5]?.replace(/\.git$/, '') ?? ''
  const subdir = match[6]
  const ref = match[7] || 'HEAD'

  const domain = `${ siteName }${
    tld || supported[siteName] || supported[site] || ''
  }`

  const url = `https://${ domain }/${ user }/${ name }`
  const ssh = `git@${ domain }:${ user }/${ name }`

  const mode =
    siteName === 'huggingface'
      ? 'git'
      : supported[siteName] || supported[site]
        ? 'tar'
        : 'git'

  return { site: siteName, user, name, ref, url, ssh, subdir, mode, src }
}
