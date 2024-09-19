import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

export class EcsFargateSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext('stage') || 'dev';

    const vpc = new ec2.Vpc(this, `Vpc-${stage}`, {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, `Cluster-${stage}`, {
      vpc: vpc,
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, `FargateService-${stage}`, {
      cluster,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      },
      memoryLimitMiB: 1024,
      publicLoadBalancer: true,
    });
  }
}
