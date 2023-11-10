import { GluegunToolbox } from 'gluegun'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.reset = () => {
    const {
      parameters: { options },
      print,
    } = toolbox
    print.info(options)
  }
}
