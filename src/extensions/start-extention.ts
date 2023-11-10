import { GluegunToolbox, filesystem } from 'gluegun'
import { fileExist, upsertGitIgnore } from '../helper'

const DIRNAME = filesystem.cwd()
const CONFIG_FILE_PATH = `${DIRNAME}/.mango/config.json`
const MANGO_FILE_PATH = `${DIRNAME}/.mango`

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.start = async () => {
    const {
      prompt: { ask },
      print,
      filesystem,
      build,
      copy,
    } = toolbox
    print.info("Let's begin!")

    await upsertGitIgnore()

    const configFileExist = await fileExist(CONFIG_FILE_PATH)
    print.info(`Config.json file exist ${configFileExist}`)
    if (configFileExist) {
      // Prompt for a reset or continue to redeploy to same bucket
      const action = await ask([
        {
          type: 'confirm',
          name: 'restart',
          message: 'You had a previous config, do you want to reset it?',
        },
      ])

      if (action.restart) {
        await filesystem.removeAsync(MANGO_FILE_PATH)
        print.info('Re-running the command with new configuration...')
        await toolbox.start() // Recursive call
      } else {
        // start building the app
        await build()
        // copy build file
        await copy()
        // transfer to s3 bucket
        // configure domain
        print.fancy('Deployment successful!')
      }
    } else {
      // Prompt
      const result = await ask([
        {
          type: 'input',
          name: 's3BucketName',
          message: 'Unique AWS S3 Bucket Name:',
        },
        {
          type: 'invisible',
          name: 'awsAccessKey',
          message: 'AWS Access Key:',
        },
        {
          type: 'invisible',
          name: 'awsAccessSecret',
          message: 'AWS Access Secret:',
        },
        {
          type: 'input',
          name: 'buildFolder',
          message:
            "Is your build folder 'dist'? If not, please specify it here.",
          initial: 'dist',
        },
        {
          type: 'confirm',
          name: 'customDomain',
          message: 'Have a custom domain?',
        },
      ])

      if (result.customDomain) {
        const domainResult = await ask([
          {
            type: 'input',
            name: 'domainName',
            message: 'Custom Domain Name (e.g., example.com):',
          },
        ])
        Object.assign(result, domainResult)
      } else {
        delete result['domainName']
      }

      // write config file in .mango directory
      const data = JSON.stringify(result)
      await filesystem.writeAsync(CONFIG_FILE_PATH, data, {
        atomic: true,
        jsonIndent: 2,
      })

      print.info(data)

      // create deployment folder
      await filesystem.dirAsync(`${DIRNAME}/.mango/${result.buildFolder}`)

      // run the deployment flow
      await build()
      await copy()
    }
  }
}
