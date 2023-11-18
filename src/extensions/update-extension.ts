import { GluegunToolbox } from 'gluegun'
import {
  deleteObjectsInBucket,
  listObjectsInBucket,
  uploadDirectory,
} from '../helper/s3'
import { IConfig } from '../model'
import { invalidateCache } from '../helper/cloudfront'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.update = async (config: IConfig, buildFolder: string) => {
    const { print } = toolbox
    // List objects in S3 Bucket
    const s3ObjectList = await listObjectsInBucket(config.bucketName)

    if (s3ObjectList?.Contents && s3ObjectList?.Contents?.length > 0) {
      const dropObjectsInBucket = await deleteObjectsInBucket(
        config.bucketName,
        s3ObjectList.Contents
      )
      print.info(`Dropped files: ${JSON.stringify(dropObjectsInBucket)}`)
    }
    // upload files from build folder
    await uploadDirectory(`${buildFolder}`, config.bucketName, `${buildFolder}`)
    // Invalidate cloudfron cache
    if (config.cloudFrontId) {
      await invalidateCache(config.cloudFrontId)
    }
  }
}
