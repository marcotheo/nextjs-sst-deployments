export const createACMCert = (
  prefixResource: string,
  {
    domainName,
    zoneId,
  }: {
    domainName: string;
    zoneId: string;
  }
) => {
  // Create an ACM certificate with DNS validation
  const certificate = new aws.acm.Certificate(
    `SimpleACMCert${prefixResource}`,
    {
      domainName,
      validationMethod: "DNS",
    }
  );

  // Retrieve the DNS validation options for the certificate
  const validationOptions = certificate.domainValidationOptions.apply(
    (options) =>
      options.map((option) => ({
        name: option.resourceRecordName,
        value: option.resourceRecordValue,
        type: option.resourceRecordType,
      }))
  );

  // Create DNS records to complete the validation process
  validationOptions.apply((options) => {
    options.map((option, idx) => {
      new aws.route53.Record(`Simple${prefixResource}DomainValidation${idx}`, {
        zoneId,
        name: option.name,
        type: option.type,
        records: [option.value],
        ttl: 300,
      });
    });
  });

  return certificate.arn;
};

export enum AppType {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}
