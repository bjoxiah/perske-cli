import { GluegunToolbox } from 'gluegun'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.deploy = () => {
    const {
      parameters: { options },
      print,
    } = toolbox
    print.info(options)
  }
}
