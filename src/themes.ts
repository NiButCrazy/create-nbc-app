import { SelectTheme } from './types'
import color from 'picocolors'

// 默认前缀
export const commonPrefix = { done: color.green('✓'), idle: color.cyanBright('◈') }

export const selectTheme: SelectTheme = {
  prefix: commonPrefix,
  icon: {
    cursor: color.cyan('→')
  },
  style: {
    description: (text) => color.white(text),
    highlight: (text) => color.cyanBright(text),
  }
}

export const inputTheme = {
  prefix: commonPrefix,
  style: {
    error: (text: string) => {
      switch (text) {
        case 'You must provide a value':
          return color.red('> 项目名称不能为空')
        case 'You must provide a valid value':
          return color.red('> 项目名称格式不合法')
      }
    },
    defaultAnswer: (text: string) => color.dim(text),
  }
}

export const otherTheme = {
  prefix: commonPrefix,
  style: {
    error: () => color.red('> 名称不能为空\n' +
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
    ),
  }
}

export const checkBoxTheme = {
  helpMode: 'always' as const,
  prefix: commonPrefix,
  style: {
    highlight: (text: string) => color.cyanBright(text),
    answer: (text: string) => text.split(',')
                                  .map(item => color.cyan(item))
                                  .join(color.white(color.dim(' |')))
  },
  icon: {
    cursor: color.cyan('→'),
    checked: color.green(' ◉'),
    unchecked: color.red(' ✕'),
  },
}