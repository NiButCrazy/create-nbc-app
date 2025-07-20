import { defineConfig } from 'tsdown'


export default defineConfig([
  {
    entry: [ './src/index.ts' ],
    platform: 'node',
    dts: false, // 控制是否生成生成 .d.ts 声明文件
  },
])
