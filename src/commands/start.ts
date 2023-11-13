import { GluegunToolbox } from 'gluegun'

module.exports = {
  name: 'start',
  alias: ['s'],
  description: 'Handles all your configurations and deployment',
  run: async (toolbox: GluegunToolbox) => {
    const { start, print } = toolbox

    print.info('Welcome to Perske CLI')

    start()
  },
}
