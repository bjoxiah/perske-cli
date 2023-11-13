import { GluegunToolbox } from 'gluegun'

module.exports = {
  name: 'start',
  run: async (toolbox: GluegunToolbox) => {
    const { start, print } = toolbox

    print.info('Welcome to Mango CLI')

    start()
  },
}
