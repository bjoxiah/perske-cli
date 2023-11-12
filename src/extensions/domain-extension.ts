import { GluegunToolbox } from 'gluegun'
import { requestACMCertificate } from '../helper/acm'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.domain = async (config: any) => {
    const { print } = toolbox
    if (config.domainName) {
      const spinner = print.spin('Building project files!')
      // Request SSL Certificate
      const certificate = await requestACMCertificate(config.domainName)
      print.info(certificate)
      spinner.stop()
    } else {
      return
    }
  }
}
