import { GluegunToolbox } from 'gluegun'
import {
  configureBucketForHosting,
  createS3Bucket,
  uploadDirectory,
} from '../helper/s3'
import { IConfig } from '../model'

module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.upload = async (perskeFolder: string, config: IConfig) => {
    const { print } = toolbox
    print.info('Upload to AWS S3 Bucket!')
    // Create S3 Bucket
    const s3Bucket = await createS3Bucket(config.bucketName)
    print.info(`S3 Bucket Response: ${JSON.stringify(s3Bucket)}`)
    // Configure for web hosting
    const webHosting = await configureBucketForHosting(config.bucketName)
    print.info(`Web Hosting Config Response: ${JSON.stringify(webHosting)}`)
    // upload files from build folder
    await uploadDirectory(
      `${perskeFolder}`,
      config.bucketName,
      `${perskeFolder}`
    )
  }
}
