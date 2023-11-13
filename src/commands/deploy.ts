import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'deploy',
  alias: ['d'],
  description: 'Deploy to S3 (handy for CICD pipeline flow)',
  run: async (toolbox) => {
    const { deploy } = toolbox
    await deploy()
  },
}

module.exports = command
