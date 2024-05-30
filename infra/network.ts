export const network_config = async () => {
  const vpc = new aws.ec2.DefaultVpc("SimpleVPC");

  // Create a public subnet for the NAT instance
  const publicSubnetNat = new aws.ec2.Subnet("SimplePublicSubnetNat", {
    vpcId: vpc.id,
    cidrBlock: process.env.NAT_PUBLIC_SUBNET,
    mapPublicIpOnLaunch: false,
  });

  // Create a public subnets for ALB
  const albPublicSubnet1 = new aws.ec2.Subnet("SimpleALBPublicSubnet1", {
    vpcId: vpc.id,
    cidrBlock: process.env.ALB_PUBLIC_SUBNET1,
    availabilityZone: "yourawsAZ",
    mapPublicIpOnLaunch: false,
  });

  const albPublicSubnet2 = new aws.ec2.Subnet("SimpleALBPublicSubnet3", {
    vpcId: vpc.id,
    cidrBlock: process.env.ALB_PUBLIC_SUBNET2,
    availabilityZone: "yourawsAZ",
    mapPublicIpOnLaunch: false,
  });

  // Create private subnets for EC2 instance
  const privateSub1 = new aws.ec2.Subnet("SimplePrivateSubnet1", {
    vpcId: vpc.id,
    availabilityZone: "yourawsAZ",
    cidrBlock: process.env.EC2_PRIVATE_SUBNET1,
  });

  const privateSub2 = new aws.ec2.Subnet("SimplePrivateSubnet2", {
    vpcId: vpc.id,
    availabilityZone: "yourawsAZ",
    cidrBlock: process.env.EC2_PRIVATE_SUBNET2,
  });

  // Create a Security Group for the NAT instance
  const natSecurityGroup = new aws.ec2.SecurityGroup("SimpleNATSecurityGroup", {
    vpcId: vpc.id,
    ingress: [
      {
        protocol: "-1", // All traffic
        fromPort: 0,
        toPort: 0,
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

  // Create a NAT Instance
  const natInstance = new aws.ec2.Instance("SimpleNatInstance22", {
    instanceType: "t2.nano",
    ami: "ami-0695b862c585a60a7", // Amazon Linux 2 AMI
    subnetId: publicSubnetNat.id,
    associatePublicIpAddress: true,
    vpcSecurityGroupIds: [natSecurityGroup.id],
    sourceDestCheck: false,
    tags: {
      Name: "nat-instance",
    },
  });

  // Create a Route Table for the private subnet
  const privateRouteTable = new aws.ec2.RouteTable("SimplePrivateRouteTable", {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: "0.0.0.0/0",
        networkInterfaceId: natInstance.primaryNetworkInterfaceId,
      },
    ],
  });

  // Associate the route table with the private subnet 1
  new aws.ec2.RouteTableAssociation("SimplePrivateRouteTableAssoc1", {
    subnetId: privateSub1.id,
    routeTableId: privateRouteTable.id,
  });

  // Associate the route table with the private subnet 2
  new aws.ec2.RouteTableAssociation("SimplePrivateRouteTableAssoc2", {
    subnetId: privateSub2.id,
    routeTableId: privateRouteTable.id,
  });

  return {
    vpcId: vpc.id,
    privateSubnets: [privateSub1.id, privateSub2.id],
    albPublicSunets: [albPublicSubnet1.id, albPublicSubnet2.id],
    nat: natInstance.id,
  };
};
