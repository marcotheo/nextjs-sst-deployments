export const capacity_provider = async ({
  vpcId,
  privateSubnets,
  cluster,
}: {
  vpcId: $util.Output<string>;
  privateSubnets: $util.Output<string>[];
  cluster: aws.ecs.Cluster;
}) => {
  const ec2Sg = new aws.ec2.SecurityGroup("SimpleEc2Sg", {
    name: "simple_ec2_sg",
    description: "simple ec2 sg traffic rules",
    vpcId: vpcId,
    ingress: [
      {
        protocol: "-1", // All protocols
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "-1", // All protocols
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"], // Allow traffic to all IP addresses
      },
    ],
  });

  const assumeRole = aws.iam.getPolicyDocument({
    statements: [
      {
        effect: "Allow",
        principals: [
          {
            type: "Service",
            identifiers: ["ec2.amazonaws.com"],
          },
        ],
        actions: ["sts:AssumeRole"],
      },
    ],
  });

  const instanceRole = new aws.iam.Role("SimpleInstanceRole", {
    name: "SimpleECSInstanceRole",
    assumeRolePolicy: assumeRole.then((assumeRole) => assumeRole.json),
  });

  // Attach the AmazonEC2ContainerServiceforEC2Role policy to the role
  new aws.iam.RolePolicyAttachment("SimpleInstanceRolePolicyAttachment", {
    role: instanceRole.name,
    policyArn:
      "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
  });

  // Attach custom policy for terminating instances in Auto Scaling Group
  const terminatePolicy = new aws.iam.Policy("SimpleInstanceTerminatePolicy", {
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "autoscaling:TerminateInstanceInAutoScalingGroup",
            "ec2:TerminateInstances",
            "ec2:DescribeInstances",
          ],
          Resource: "*",
        },
      ],
    }),
  });

  new aws.iam.PolicyAttachment("SimpleInstanceTerminatePolicyAttachment", {
    policyArn: terminatePolicy.arn,
    roles: [instanceRole.name],
  });

  const instanceProfile = new aws.iam.InstanceProfile("SimpleInstanceProfile", {
    name: "simple_instance_profile",
    role: instanceRole.name,
  });

  const userData = cluster.name.apply(
    (name) => `#!/bin/bash 
echo ECS_CLUSTER=${name} >> /etc/ecs/ecs.config`
  );

  const ec2Template = new aws.ec2.LaunchTemplate(
    "SimpleLaunchTemplateECS",
    {
      namePrefix: "simple-instance-",
      imageId: "ami-0669b994780198e2e", // env
      instanceType: "t2.micro", // env
      vpcSecurityGroupIds: [ec2Sg.id],
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      userData: userData.apply((v) => Buffer.from(v).toString("base64")),
    },
    {
      dependsOn: [cluster],
    }
  );

  const asg = new aws.autoscaling.Group("SimpleASG", {
    name: "simple-asg",
    forceDelete: true,
    maxSize: 4,
    minSize: 2,
    desiredCapacity: 2,
    launchTemplate: {
      name: ec2Template.name,
      version: "$Latest",
    },
    vpcZoneIdentifiers: privateSubnets,
    defaultCooldown: 20,
  });

  const capacityProvider = new aws.ecs.CapacityProvider(
    "SimpleCapacityProvider",
    {
      name: "simple-provider",
      autoScalingGroupProvider: {
        autoScalingGroupArn: asg.arn,
        managedScaling: {
          minimumScalingStepSize: 1,
          maximumScalingStepSize: 2,
          status: "ENABLED",
          targetCapacity: 30,
        },
      },
    }
  );

  new aws.ecs.ClusterCapacityProviders("SimpleClusterCapacityProviderAssoc", {
    clusterName: cluster.name,
    capacityProviders: [capacityProvider.name],
    defaultCapacityProviderStrategies: [
      {
        capacityProvider: capacityProvider.name,
        weight: 1,
        base: 1,
      },
    ],
  });

  return {
    ec2Sg,
    capacityProvider,
  };
};
