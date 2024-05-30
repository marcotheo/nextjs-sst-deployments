/// <reference path="./.sst/platform/config.d.ts" />

import { capacity_provider } from "infra/capacity_provider";
import { network_config } from "./infra/network";
import { create_service } from "./infra/service";
import { create_alb } from "./infra/alb";
import { AppType, createACMCert } from "./infra/util";

export default $config({
  app(input) {
    return {
      name: "simple",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws:
          input?.stage === "production"
            ? { region: "yourawsregion" }
            : {
                profile:
                  "your aws profile in your local pc if you have custom profile or if using default profile then remove this property",
                region: "yourawsregion",
              },
        docker: true,
      },
    };
  },
  async run() {
    if (!process.env.CUSTOM_DOMAIN || !process.env.HOSTED_ZONE_ID) return {};

    const domainName = process.env.CUSTOM_DOMAIN;
    const zoneId = process.env.HOSTED_ZONE_ID;
    const stageEnv = process.env.STAGE_VAR ? "-" + process.env.STAGE_VAR : "";

    const adminCertArn = createACMCert("Admin", {
      domainName: `admin${stageEnv}.${domainName}`,
      zoneId,
    });

    const staffCertArn = createACMCert("Staff", {
      domainName: `staff${stageEnv}.${domainName}`,
      zoneId,
    });

    const networkResult = await network_config();

    const alb = create_alb({
      domainName,
      zoneId,
      vpcId: networkResult.vpcId,
      publicSubnets: networkResult.albPublicSunets,
      adminCertArn,
      staffCertArn,
    });

    const cluster = new aws.ecs.Cluster("SimpleCluster", {
      name: "simple-cluster",
    });

    const provider = await capacity_provider({
      vpcId: networkResult.vpcId,
      privateSubnets: networkResult.privateSubnets,
      cluster,
    });

    await create_service({
      appType: AppType.ADMIN,
      vpcId: networkResult.vpcId,
      privateSubnets: networkResult.privateSubnets,
      cluster,
      capacityProvider: provider.capacityProvider,
      albSecurityGroup: alb.albSecurityGroup,
      targetGroup: alb.adminTargetGroup,
    });

    await create_service({
      appType: AppType.STAFF,
      vpcId: networkResult.vpcId,
      privateSubnets: networkResult.privateSubnets,
      cluster,
      capacityProvider: provider.capacityProvider,
      albSecurityGroup: alb.albSecurityGroup,
      targetGroup: alb.staffTargetGroup,
    });

    return {
      ...networkResult,
    };
  },
});
