import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'perske',
  description: 'Hi! Hello',
  run: async (toolbox) => {
    const { print } = toolbox

    print.info('Welcome to Perske CLI')
  },
}

module.exports = command
