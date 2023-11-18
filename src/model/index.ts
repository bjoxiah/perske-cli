export interface IConfig {
  bucketName: string
  buildFolder: string
  customDomain?: boolean
  domainName?: string
  cloudFront?: boolean
  cloudFrontId?: string
}
