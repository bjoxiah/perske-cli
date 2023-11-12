import { GluegunToolbox, filesystem } from 'gluegun'
import { fileExist, getConfigJSON, upsertGitIgnore } from '../helper'
import { bucketExists } from '../helper/s3'

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
        await filesystem.removeAsync(MANGO_FILE_PATH)
        print.info('Re-running the command with new configuration...')
        await toolbox.start() // Recursive call
      } else {
        await filesystem.removeAsync(`${MANGO_FILE_PATH}/${json.buildFolder}`)
        // start building the app
        await build()
        // copy build file
        await copy(`${DIRNAME}`, json)
        // update s3 bucket
        await update(json, `${MANGO_FILE_PATH}/${json.buildFolder}`)
        print.success('Deployment successful!')
        process.exit()
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

      // Check if bucketName already exist
      const bucketExist = await bucketExists(result.s3BucketName)
      if (bucketExist) {
        print.error(`Bucket name already exist in AWS S3`)
        process.exit()
      } else {
        // write config file in .mango directory
        const data = JSON.stringify(result)
        await filesystem.writeAsync(CONFIG_FILE_PATH, data, {
          atomic: true,
          jsonIndent: 2,
        })
        // print for test
        print.info(data)
        // create deployment folder
        await filesystem.dirAsync(`${MANGO_FILE_PATH}/${result.buildFolder}`)
        // run the deployment flow
        await build()
        await copy(`${DIRNAME}`, result)
        await upload(`${MANGO_FILE_PATH}/${result.buildFolder}`, result)
        await domain(result)
        print.success('Deployment was successful!')
        process.exit()
      }
    }
  }
}
