import { GluegunToolbox } from 'gluegun'
import { getCopyCommand } from '../helper'
import { IConfig } from '../model'

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.copy = async (homeDir: string, config: IConfig) => {
    const { print, system } = toolbox
    const spinner = print.spin('Copy project files to .perske!')

    const copyCommand = await getCopyCommand(homeDir, config)

    const copy = await system.run(`${copyCommand}`)

    spinner.stop()

    print.info(copy)

    print.info('Ready to deploy!!!')
  }
}
