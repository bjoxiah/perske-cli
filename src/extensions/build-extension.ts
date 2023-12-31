import { GluegunToolbox } from 'gluegun'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.build = async () => {
    const { print, system } = toolbox
    const spinner = print.spin('Building project files!')
    // Build the project
    const build = await system.run(`npm install --f && npm run build`)
    spinner.stop()

    print.highlight(build)
  }
}
