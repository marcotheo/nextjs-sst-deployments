export const create_alb = ({
  vpcId,
  publicSubnets,
  domainName,
  zoneId,
  adminCertArn,
  staffCertArn,
}: {
  vpcId: $util.Output<string>;
  publicSubnets: $util.Output<string>[];
  domainName: string;
  zoneId: string;
  adminCertArn: $util.Output<string>;
  staffCertArn: $util.Output<string>;
}) => {
  // Create a Security Group for the ALB
  const albSecurityGroup = new aws.ec2.SecurityGroup("SimpleALBSecurityGroup", {
    vpcId: vpcId,
    description: "Allow HTTP inbound traffic",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
      },
      {
        protocol: "tcp", // All protocols
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "-1", // All traffic
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  });

  // Create the ALB
  const alb = new aws.lb.LoadBalancer("SimpleALB", {
    internal: false,
    securityGroups: [albSecurityGroup.id],
    subnets: publicSubnets,
    loadBalancerType: "application",
  });

  // Create a Target Group with the health check endpoint
  const adminTargetGroup = new aws.lb.TargetGroup("SimpleAdminTargetGroup", {
    port: 3000,
    protocol: "HTTP",
    vpcId: vpcId,
    targetType: "ip",
    healthCheck: {
      protocol: "HTTP",
      path: "/api/health", // Your health check endpoint
      interval: 6,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
    },
  });

  // Create a Target Group with the health check endpoint
  const staffTargetGroup = new aws.lb.TargetGroup("SimpleStaffTargetGroup", {
    port: 3000,
    protocol: "HTTP",
    vpcId: vpcId,
    targetType: "ip",
    healthCheck: {
      protocol: "HTTP",
      path: "/api/health", // Your health check endpoint
      interval: 6,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
    },
  });

  // Create a Listener for the ALB
  const listener = new aws.lb.Listener("SimpleListener", {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: adminTargetGroup.arn,
      },
    ],
    sslPolicy: "ELBSecurityPolicy-2016-08",
    certificateArn: adminCertArn,
  });

  new aws.alb.ListenerCertificate("SimpleListenerStaffACMCert", {
    certificateArn: staffCertArn,
    listenerArn: listener.arn,
  });

  // Create a DNS A Record for the ALB
  new aws.route53.Record("SimpleALBAdminDNSConfig", {
    name: "admin", // The subdomain (leave out the main domain part)
    zoneId,
    type: "A",
    aliases: [
      {
        name: alb.dnsName,
        zoneId: alb.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  });

  new aws.route53.Record("SimpleALBStaffDNSConfig", {
    name: "staff", // The subdomain (leave out the main domain part)
    zoneId,
    type: "A",
    aliases: [
      {
        name: alb.dnsName,
        zoneId: alb.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  });

  // Add Listener Rules
  const stageEnv = process.env.STAGE_VAR ? "-" + process.env.STAGE_VAR : "";

  new aws.lb.ListenerRule("SimpleAdminListenerRule", {
    listenerArn: listener.arn,
    actions: [
      {
        type: "forward",
        targetGroupArn: adminTargetGroup.arn,
      },
    ],
    conditions: [
      {
        hostHeader: {
          values: [`admin${stageEnv}.${domainName}`],
        },
      },
    ],
  });

  new aws.lb.ListenerRule("SimpleStaffListenerRule", {
    listenerArn: listener.arn,
    actions: [
      {
        type: "forward",
        targetGroupArn: staffTargetGroup.arn,
      },
    ],
    conditions: [
      {
        hostHeader: {
          values: [`staff${stageEnv}.${domainName}`],
        },
      },
    ],
  });

  return {
    alb,
    albSecurityGroup,
    adminTargetGroup,
    staffTargetGroup,
  };
};
