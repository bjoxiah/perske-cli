import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'deploy',
  run: async (toolbox) => {
    const { print, msi } = toolbox

    print.info('Welcome to your CLI')
    await msi()
  },
}

module.exports = command
