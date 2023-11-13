import { GluegunToolbox } from 'gluegun'
import { findCertificatesForDomain } from '../helper/acm'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.msi = async () => {
    const { print } = toolbox
    const certificateList = await findCertificatesForDomain('joxiah.dev')
    print.info(`${JSON.stringify(certificateList)}`)
  }
}
