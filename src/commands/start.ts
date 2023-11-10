import { GluegunToolbox } from 'gluegun'

module.exports = {
  name: 'start',
  run: async (toolbox: GluegunToolbox) => {
    const { start } = toolbox

    start()
  },
}
