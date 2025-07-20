#!/usr/bin/env node
import { run } from './bin'


process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('👋 下次再见!\n')
    process.exit(0)
  } else {
    // Rethrow unknown errors
    throw error
  }
})

try {
  run(process.argv)
} catch (e) {
  console.error(e)
  process.exit(1)
}
