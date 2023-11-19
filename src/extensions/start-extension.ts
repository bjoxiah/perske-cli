import { GluegunToolbox, filesystem } from 'gluegun'
import {
  fileExist,
  getConfigJSON,
  setConfigJSON,
  upsertGitIgnore,
} from '../helper'

const DIRNAME = filesystem.cwd()
const CONFIG_FILE_PATH = `${DIRNAME}/.perske/config.json`
const PERSKE_FILE_PATH = `${DIRNAME}/.perske`

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.start = async () => {
    const {
      prompt: { ask },
      print,
      filesystem,
      build,
      copy,
      upload,
      update,
      domain,
    } = toolbox
    print.info("Let's begin!")

    await upsertGitIgnore()

    const configFileExist = await fileExist(CONFIG_FILE_PATH)
    print.info(`Config.json file exist ${configFileExist}`)
    if (configFileExist) {
      const json = await getConfigJSON()
      // Prompt for a reset or continue to redeploy to same bucket
      const action = await ask([
        {
          type: 'confirm',
          name: 'restart',
          message: 'You had a previous config, do you want to reset it?',
        },
      ])

      if (action.restart) {
        await filesystem.removeAsync(PERSKE_FILE_PATH)
        print.info('Re-running the command with new configuration...')
        await toolbox.start() // Recursive call
      } else {
        await filesystem.removeAsync(`${PERSKE_FILE_PATH}/${json.buildFolder}`)
        // start building the app
        await build()
        // copy build file
        await copy(`${DIRNAME}`, json)
        // update s3 bucket
        await update(json, `${PERSKE_FILE_PATH}/${json.buildFolder}`)
        // clear build files
        await filesystem.removeAsync(`${PERSKE_FILE_PATH}/${json.buildFolder}`)
        print.success('Deployment successful!')
        process.exit()
      }
    } else {
      // Prompt
      const result = await ask([
        {
          type: 'input',
          name: 'bucketName',
          message: 'Unique AWS S3 Bucket Name:',
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
        const cloud = await ask([
          {
            type: 'confirm',
            name: 'cloudFront',
            message:
              'Want a cloud front distribution or just S3 bucket hosting?',
          },
        ])
        Object.assign(result, cloud)
        delete result['domainName']
      }

      // write config file in .perske directory
      const data = JSON.stringify(result)
      await setConfigJSON(data)
      // create deployment folder
      await filesystem.dirAsync(`${PERSKE_FILE_PATH}/${result.buildFolder}`)
      // run the deployment flow
      await build()
      await copy(`${DIRNAME}`, result)
      await upload(`${PERSKE_FILE_PATH}/${result.buildFolder}`, result)
      // clear build files
      await filesystem.removeAsync(`${PERSKE_FILE_PATH}/${result.buildFolder}`)
      await domain(result)
      print.success('Deployment was successful!')
      process.exit()
    }
  }
}
