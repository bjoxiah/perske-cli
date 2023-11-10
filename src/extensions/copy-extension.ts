import { GluegunToolbox, filesystem } from 'gluegun'
import { getOS } from '../helper'

const __dirname = filesystem.cwd()
const CONFIG_FILE_PATH = `${__dirname}/.mango/config.json`
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.copy = async () => {
    const { print, system, filesystem } = toolbox
    const spinner = print.spin('Copy project files to .mango!')

    const config = await filesystem.readAsync(CONFIG_FILE_PATH)

    const json = JSON.parse(config)

    let copyCommand = ''

    if (getOS() === 'windows') {
      copyCommand = `xcopy .\\${json.buildFolder} ${__dirname}\\.mango\\${json.buildFolder} /E /I`
    } else {
      copyCommand = `cp -R ./${json.buildFolder} ${__dirname}/${json.buildFolder}`
    }

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
