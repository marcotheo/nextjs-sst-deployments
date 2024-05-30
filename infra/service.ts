import { create_ecr } from "./ecr";
import { AppType } from "./util";

export const create_service = async ({
  appType,
  vpcId,
  privateSubnets,
  cluster,
  capacityProvider,
  targetGroup,
  albSecurityGroup,
}: {
  appType: AppType;
  vpcId: $util.Output<string>;
  privateSubnets: $util.Output<string>[];
  cluster: aws.ecs.Cluster;
  capacityProvider: aws.ecs.CapacityProvider;
  albSecurityGroup: aws.ec2.SecurityGroup;
  targetGroup: aws.lb.TargetGroup;
}) => {
  const continerName = appType === "ADMIN" ? "next-admin" : "next-staff";
  const ecrOutput = await create_ecr(appType);

  const taskDefExecutionRole = new aws.iam.Role(
    `Simple${appType}TaskDefExecRole`,
    {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
      }),
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      ],
    }
  );

  const taskDef = new aws.ecs.TaskDefinition(
    `Simple${appType}TD`,
    {
      family: `${appType.toLowerCase()}-web-task`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["EC2"],
      runtimePlatform: {
        cpuArchitecture: "X86_64",
      },
      executionRoleArn: taskDefExecutionRole.arn,
      containerDefinitions: ecrOutput.repoUrl.apply((url) =>
        JSON.stringify([
          {
            name: continerName,
            image: `${url}:${ecrOutput.imageVersion}`,
            cpu: 800,
            memory: 800,
            essential: true,
            portMappings: [
              {
                containerPort: 3000,
                hostPort: 3000,
                protocol: "tcp",
              },
            ],
          },
        ])
      ),
    },
    {
      dependsOn: [ecrOutput.imagePush],
    }
  );

  const serviceSG = new aws.ec2.SecurityGroup(`Simple${appType}ServiceSg`, {
    description: `Simple ${appType.toLowerCase()} service sg`,
    vpcId,
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSecurityGroup.id],
      },
      {
        protocol: "tcp", // All protocols
        fromPort: 443,
        toPort: 443,
        securityGroups: [albSecurityGroup.id],
      },
      {
        protocol: "tcp", // All protocols
        fromPort: 3000,
        toPort: 3000,
        securityGroups: [albSecurityGroup.id],
      },
    ],
    egress: [
      {
        protocol: "tcp", // All protocols
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSecurityGroup.id],
      },
      {
        protocol: "tcp", // All protocols
        fromPort: 443,
        toPort: 443,
        securityGroups: [albSecurityGroup.id],
      },
      {
        protocol: "tcp", // All protocols
        fromPort: 3000,
        toPort: 3000,
        securityGroups: [albSecurityGroup.id],
      },
    ],
  });

  new aws.ecs.Service(`Simple${appType}Service`, {
    cluster: cluster.arn,
    taskDefinition: taskDef.arn,
    desiredCount: 1,
    networkConfiguration: {
      subnets: privateSubnets,
      securityGroups: [serviceSG.id],
      assignPublicIp: false,
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: continerName,
        containerPort: 3000,
      },
    ],
    capacityProviderStrategies: [
      {
        capacityProvider: capacityProvider.name,
        weight: 1, // Adjust weight as needed
      },
    ],
    orderedPlacementStrategies: [
      {
        type: "binpack",
        field: "memory",
      },
    ],
    deploymentMaximumPercent: 200, // Controls the maximum number of tasks during deployment
    deploymentMinimumHealthyPercent: 50,
    deploymentController: {
      type: "ECS", // Specifies the default ECS deployment controller
    },
    deploymentCircuitBreaker: {
      enable: true, // Enables the deployment circuit breaker
      rollback: true, // Enables automatic rollback on failure
    },
    forceNewDeployment: true,
  });
};
