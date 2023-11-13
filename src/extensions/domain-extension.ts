import { GluegunToolbox } from 'gluegun'
import {
  describeCertificate,
  findCertificatesForDomain,
  requestACMCertificate,
} from '../helper/acm'
import {
  addCnameRecordToRoute53,
  createAliasRecord,
  createHostedZone,
  getDomainNameServers,
} from '../helper/route-53'
import { createCloudFrontDistribution } from '../helper/cloudfront'
import { ResourceRecord } from '@aws-sdk/client-acm'
import { disableBlockPublicAccess, setBucketPolicy } from '../helper/s3'
import 'dotenv/config'
import { IConfig } from '../model'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.domain = async (config: IConfig) => {
    const { print } = toolbox
    // Disable block public access
    await disableBlockPublicAccess(config.bucketName, false)
    if (config.cloudFront) {
      // set up cloud front distribution
      // Set Bucket Policy
      await setBucketPolicy(config.bucketName)
      const distribution = await createCloudFrontDistribution(config.bucketName)
      print.success(`Cloud Front Distribution: ${distribution}`)
      return
    } else if (config.domainName) {
      print.info(
        `Configuring cloudfront and route53 for - ${config.domainName}`
      )
      let certificateArn = ''
      let cnameRecord: ResourceRecord = null
      // Find certificates for domain
      const certificateList = await findCertificatesForDomain(config.domainName)
      if (certificateList.length > 0) {
        certificateArn = certificateList[0].CertificateArn
      } else {
        // Request SSL Certificate
        certificateArn = await requestACMCertificate(config.domainName)
      }

      // Describe Certificate
      const acmCertificate = await describeCertificate(certificateArn)
      cnameRecord =
        acmCertificate.Certificate.DomainValidationOptions[0].ResourceRecord

      // Create hosted zone
      const hostedZone = await createHostedZone(config.domainName)
      // Get Name Servers
      const nameServers = await getDomainNameServers(hostedZone.HostedZone.Id)
      // Add DNS Record For ACM Certificate
      await addCnameRecordToRoute53(
        config.domainName,
        hostedZone.HostedZone.Id,
        cnameRecord
      )
      // set up cloud front distribution
      // Set Bucket Policy
      await setBucketPolicy(config.bucketName)
      const distribution = await createCloudFrontDistribution(
        config.bucketName,
        certificateArn,
        config.domainName
      )
      // Set up A record for cloudfront domain
      await createAliasRecord(
        config.domainName,
        hostedZone.HostedZone.Id,
        distribution
      )
      //   spinner.stop()
      print.info(
        `If your domain registrar is AWS Route53 then your work is almost done pending DNS propagation but if other registrar, \n you need to update the CNAME of your domain to prove ownership for SSL certificate and update Nameservers with the following details:\n`
      )
      print.success(`CNAME NAME: ${cnameRecord.Name}`)
      print.success(`CNAME VALUE: ${cnameRecord.Value}`)
      print.newline()
      print.success(`Name Servers: ${JSON.stringify(nameServers)}`)
      print.newline()
      print.info(`Wait a little while for DNS propagation`)
      print.newline()
      print.success(`The cloudfront url is: ${distribution}`)
      print.newline()
      return
    } else {
      // Set Bucket Policy
      await setBucketPolicy(config.bucketName)
      print.success(
        `AWS S3 Url: ${config.bucketName}.s3-website.${process.env.REGION}.amazonaws.com`
      )
      return
    }
  }
}
