import path from "path";
import { AppType } from "./util";

export const create_ecr = async (appType: AppType) => {
  const repoName = `simple-${appType.toLowerCase()}`;

  const repo = new aws.ecr.Repository(`Simple${appType}Repo`, {
    name: repoName,
    imageTagMutability: "MUTABLE",
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    forceDelete: true,
  });

  const serviceImage = await aws.ecr
    .getImage({
      repositoryName: repoName,
      mostRecent: true,
    })
    .catch(() => undefined);

  const imageVersion = serviceImage
    ? `v-${parseInt(serviceImage.imageTags[0].split("-")[1], 10) + 1}`
    : "v-1";

  const imagePush = new docker.Image(`Simple${appType}App`, {
    imageName: $interpolate`${repo.repositoryUrl}:${imageVersion}`,
    build: {
      context: path.join(__dirname, "../../../"),
      dockerfile: path.join(
        __dirname,
        "../../../",
        `/Dockerfile.${appType.toLowerCase()}`
      ),
      platform: "linux/amd64",
      builderVersion: "BuilderBuildKit",
    },
  });

  return {
    imageName: imagePush.imageName,
    imageVersion: imageVersion,
    repoUrl: repo.repositoryUrl,
    imagePush,
  };
};
