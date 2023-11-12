import { GluegunToolbox } from 'gluegun'
import { getCopyCommand } from '../helper'

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.copy = async (homeDir: string, config: any) => {
    const { print, system } = toolbox
    const spinner = print.spin('Copy project files to .mango!')

    const copyCommand = await getCopyCommand(homeDir, config)

    const copy = await system.run(
      `cd .. && cd mango-test-app && ${copyCommand}`
    )
    // await filesystem.copyAsync()

    spinner.stop()

    print.info(copy)

    // copy files to .mango
    print.info('Ready to deploy!!!')
  }
}
