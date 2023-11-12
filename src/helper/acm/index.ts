import {
  ACMClient,
  CertificateDetail,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from '@aws-sdk/client-acm'
import 'dotenv/config'
import { print } from 'gluegun'

const acm = new ACMClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
})

export const requestACMCertificate = async (
  domainName: string
): Promise<string> => {
  try {
    const { CertificateArn } = await acm.send(
      new RequestCertificateCommand({
        DomainName: domainName,
        ValidationMethod: 'DNS',
      })
    )
    return CertificateArn
  } catch (error) {
    print.error(`Error requesting certificate ${error}`)
    throw error
  }
}

export const describeCertificate = async (
  certificateArn: string
): Promise<CertificateDetail> => {
  try {
    const { Certificate } = await acm.send(
      new DescribeCertificateCommand({ CertificateArn: certificateArn })
    )
    return Certificate
  } catch (error) {
    print.error(`Error describing certificate ${error}`)
    throw error
  }
}
