import {
  ACMClient,
  CertificateSummary,
  DescribeCertificateCommand,
  DescribeCertificateCommandOutput,
  ListCertificatesCommand,
  ListCertificatesCommandInput,
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
    print.error(`Error requesting certificate ${JSON.stringify(error)}`)
    return
  }
}

export const describeCertificate = async (
  certificateArn: string
): Promise<DescribeCertificateCommandOutput> => {
  try {
    const certificate = await acm.send(
      new DescribeCertificateCommand({ CertificateArn: certificateArn })
    )
    print.info(
      `Describe Certificate Call Response ${JSON.stringify(certificate)}`
    )
    return certificate
  } catch (error) {
    print.error(`Error describing certificate ${JSON.stringify(error)}`)
    return
  }
}

export const findCertificatesForDomain = async (
  domainName: string
): Promise<CertificateSummary[]> => {
  const params: ListCertificatesCommandInput = {
    CertificateStatuses: [
      'ISSUED',
      'PENDING_VALIDATION',
      'INACTIVE',
      'EXPIRED',
    ],
    Includes: {
      keyTypes: ['RSA_2048', 'RSA_4096', 'EC_prime256v1', 'EC_secp384r1'],
      extendedKeyUsage: [
        'TLS_WEB_SERVER_AUTHENTICATION',
        'TLS_WEB_CLIENT_AUTHENTICATION',
      ],
      keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
    },
  }

  try {
    const data = await acm.send(new ListCertificatesCommand(params))
    const matchingCertificates = data.CertificateSummaryList.filter(
      (cert) => cert.DomainName === domainName
    )
    return matchingCertificates
  } catch (error) {
    print.error(`Error listing certificates: ${JSON.stringify(error)}`)
    return
  }
}
