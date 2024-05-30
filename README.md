# An SST ION application

This application is a monorepo consisting of 2 nextjs applications sharing 1 ui components folder

# INFRA

This sst application uses more of the pulumi constructs directly because this uses an server type approach different from sst's focus which is serverless.

The sst script spins up the following resource

- ecs cluster
- ecs service using ec2 launch type
- ecs taskdefinition
- ecr
- autoscaling group
- ec2 instances
- nat instance
- subnets
- route table
- alb
- target group
- acm certificates
- dns configurations
- pushed to ecr a docker image

# Before running the sst script

- Run the following for ecr access = `aws ecr get-login-password --region <yourawsregion> | docker login --username AWS --password-stdin <yourawsaccountnumber>.dkr.ecr.<yourawsregion>.amazonaws.com`

# Deployment

This project has a buildspec.yml file which is use for AWS codebuild along with AWS codepipeline. The buildspec.yml are the set of instructions AWS codebuild will follow for the deployment of your application

steps to setup the pipeline assuming you have aws account already:

1. Create AWS Codebuild (enable docker flag to push docker images)
2. Create AWS Codepipeline
   - choose githubv2 as source and find you repository that you want to attach to the pipeline
