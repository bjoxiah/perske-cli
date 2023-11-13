import { GluegunToolbox } from 'gluegun'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.msi = async () => {
    const { print, parameters } = toolbox
    print.info('Miscellaneous')
  }
}
