import { GluegunToolbox } from 'gluegun'
import {
  configureBucketForHosting,
  createS3Bucket,
  uploadDirectory,
} from '../helper/s3'

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.upload = async (mangoFolder: string, config: any) => {
    const { print } = toolbox
    print.info('Upload to AWS S3 Bucket!')
    // Create S3 Bucket
    const s3Bucket = await createS3Bucket(config.s3BucketName)
    print.info(`S3 Bucket Response: ${JSON.stringify(s3Bucket)}`)
    // Configure for web hosting
    const webHosting = await configureBucketForHosting(config.s3BucketName)
    print.info(`Web Hosting Config Response: ${JSON.stringify(webHosting)}`)
    // upload files from build folder
    await uploadDirectory(
      `${mangoFolder}`,
      config.s3BucketName,
      `${mangoFolder}`
    )
  }
}
