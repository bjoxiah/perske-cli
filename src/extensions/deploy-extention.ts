import { GluegunToolbox, filesystem } from 'gluegun'
import { listObjectsInBucket } from '../helper/s3'

const DIRNAME = filesystem.cwd()
const PERSKE_FILE_PATH = `${DIRNAME}/.perske`
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.deploy = async () => {
    const {
      parameters: { options },
      print,
      build,
      copy,
      update,
    } = toolbox
    const json = options
    if (!json.bucketName) {
      print.error(`Provide --bucketName flag with the name of your S3 bucket`)
      process.exit()
    }

    if (!json.buildFolder) {
      print.error(
        `Provide --buildFolder flag with the name of your build file folder`
      )
      process.exit()
    }

    // List objects in bucket
    const bucketItems = await listObjectsInBucket(json.bucketName)
    if (bucketItems) {
      // Build files
      await build()
      // Copy files
      await copy(DIRNAME, json)
      // Deploy to S3
      await update(json, `${PERSKE_FILE_PATH}/${json.buildFolder}`)
      // Message
      print.success('Deployment successful!')
      process.exit()
    } else {
      print.error('No items found in this bucket')
      process.exit()
    }
  }
}
