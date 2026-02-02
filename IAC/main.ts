import { App, TerraformStack, S3Backend } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';

export class SimpleEcsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Backend for remote state
    new S3Backend(this, {
      bucket: process.env.APP_NAME ? `${process.env.APP_NAME}-terraform-state` : 'typescriptapp-terraform-state',
      key: 'terraform.tfstate',
      region: process.env.AWS_REGION || 'eu-north-1',
    });

    // 1️⃣ AWS provider
    new AwsProvider(this, 'AWS', { region: process.env.AWS_REGION || 'eu-north-1' });

    const defaultVpc = new DataAwsVpc(this, 'defaultVpc', { default: true });
    const defaultSubnets = new DataAwsSubnets(this, 'defaultSubnets', {
      filter: [{ name: 'vpc-id', values: [defaultVpc.id] }],
    });

    // 3️⃣ Security group allowing port 3000
    const sg = new SecurityGroup(this, 'ecsSg', {
      name: 'typescriptapp-sg',
      vpcId: defaultVpc.id,
      ingress: [
        {
          fromPort: 3000,
          toPort: 3000,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    // 4️⃣ IAM Role for ECS task execution
    const taskRole = new IamRole(this, 'ecsTaskRole', {
      name: 'typescriptapp-task-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ecsTaskPolicyAttach', {
      role: taskRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // 5️⃣ ECS Cluster
    const cluster = new EcsCluster(this, 'cluster', {
      name: 'typescriptapp-cluster',
    });

    // 6️⃣ ECS Task Definition
    const taskDef = new EcsTaskDefinition(this, 'taskDef', {
      family: 'typescriptapp-task',
      cpu: '256',
      memory: '512',
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      executionRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'typescriptapp',
          image: '090618480202.dkr.ecr.eu-north-1.amazonaws.com/typescriptapp:latest',
          essential: true,
          portMappings: [{ containerPort: 3000 }],
        },
      ]),
    });

    // 7️⃣ ECS Service
    new EcsService(this, 'service', {
      name: 'typescriptapp-service',
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      desiredCount: 1,
      launchType: 'FARGATE',
        dependsOn: [cluster],
      networkConfiguration: {
        assignPublicIp: true,

        subnets: defaultSubnets.ids,
        securityGroups: [sg.id],
      },
    });
  }
}

// 8️⃣ Synthesize the stack
const app = new App();
new SimpleEcsStack(app, 'typescriptapp-stack');
app.synth();
