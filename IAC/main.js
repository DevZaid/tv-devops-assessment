"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEcsStack = void 0;
const cdktf_1 = require("cdktf");
const provider_1 = require("@cdktf/provider-aws/lib/provider");
const data_aws_vpc_1 = require("@cdktf/provider-aws/lib/data-aws-vpc");
const data_aws_subnets_1 = require("@cdktf/provider-aws/lib/data-aws-subnets");
const security_group_1 = require("@cdktf/provider-aws/lib/security-group");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const ecs_cluster_1 = require("@cdktf/provider-aws/lib/ecs-cluster");
const ecs_task_definition_1 = require("@cdktf/provider-aws/lib/ecs-task-definition");
const ecs_service_1 = require("@cdktf/provider-aws/lib/ecs-service");
class SimpleEcsStack extends cdktf_1.TerraformStack {
    constructor(scope, id) {
        super(scope, id);
        // 1️⃣ AWS provider
        new provider_1.AwsProvider(this, 'AWS', { region: 'eu-north-1' });
        // 2️⃣ Get default VPC and subnets
        const defaultVpc = new data_aws_vpc_1.DataAwsVpc(this, 'defaultVpc', { default: true });
        const defaultSubnets = new data_aws_subnets_1.DataAwsSubnets(this, 'defaultSubnets', {
            filter: [{ name: 'vpc-id', values: [defaultVpc.id] }],
        });
        // 3️⃣ Security group allowing port 3000
        const sg = new security_group_1.SecurityGroup(this, 'ecsSg', {
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
        const taskRole = new iam_role_1.IamRole(this, 'ecsTaskRole', {
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
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'ecsTaskPolicyAttach', {
            role: taskRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        });
        // 5️⃣ ECS Cluster
        const cluster = new ecs_cluster_1.EcsCluster(this, 'cluster', {
            name: 'typescriptapp-cluster',
        });
        // 6️⃣ ECS Task Definition
        const taskDef = new ecs_task_definition_1.EcsTaskDefinition(this, 'taskDef', {
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
        new ecs_service_1.EcsService(this, 'service', {
            name: 'typescriptapp-service',
            cluster: cluster.id,
            taskDefinition: taskDef.arn,
            desiredCount: 1,
            launchType: 'FARGATE',
            networkConfiguration: {
                assignPublicIp: true,
                subnets: defaultSubnets.ids,
                securityGroups: [sg.id],
            },
        });
    }
}
exports.SimpleEcsStack = SimpleEcsStack;
// 8️⃣ Synthesize the stack
const app = new cdktf_1.App();
new SimpleEcsStack(app, 'typescriptapp-stack');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQTRDO0FBRTVDLCtEQUErRDtBQUMvRCx1RUFBa0U7QUFDbEUsK0VBQTBFO0FBQzFFLDJFQUF1RTtBQUN2RSwrREFBMkQ7QUFDM0QsbUdBQTZGO0FBQzdGLHFFQUFpRTtBQUNqRSxxRkFBZ0Y7QUFDaEYscUVBQWlFO0FBRWpFLE1BQWEsY0FBZSxTQUFRLHNCQUFjO0lBQ2hELFlBQVksS0FBZ0IsRUFBRSxFQUFVO1FBQ3RDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsbUJBQW1CO1FBQ25CLElBQUksc0JBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7UUFFdkQsa0NBQWtDO1FBQ2xDLE1BQU0sVUFBVSxHQUFHLElBQUkseUJBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekUsTUFBTSxjQUFjLEdBQUcsSUFBSSxpQ0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7U0FDdEQsQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQ3hDLE1BQU0sRUFBRSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQzFDLElBQUksRUFBRSxrQkFBa0I7WUFDeEIsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxRQUFRLEVBQUUsSUFBSTtvQkFDZCxNQUFNLEVBQUUsSUFBSTtvQkFDWixRQUFRLEVBQUUsS0FBSztvQkFDZixVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0Y7WUFDRCxNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsUUFBUSxFQUFFLENBQUM7b0JBQ1gsTUFBTSxFQUFFLENBQUM7b0JBQ1QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUMxQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsc0NBQXNDO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQU8sQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ2hELElBQUksRUFBRSx5QkFBeUI7WUFDL0IsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUseUJBQXlCLEVBQUU7d0JBQ2pELE1BQU0sRUFBRSxnQkFBZ0I7cUJBQ3pCO2lCQUNGO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILElBQUksb0RBQXVCLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3ZELElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtZQUNuQixTQUFTLEVBQUUsdUVBQXVFO1NBQ25GLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUFVLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUM5QyxJQUFJLEVBQUUsdUJBQXVCO1NBQzlCLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLE9BQU8sR0FBRyxJQUFJLHVDQUFpQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDckQsTUFBTSxFQUFFLG9CQUFvQjtZQUM1QixHQUFHLEVBQUUsS0FBSztZQUNWLE1BQU0sRUFBRSxLQUFLO1lBQ2IsV0FBVyxFQUFFLFFBQVE7WUFDckIsdUJBQXVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDcEMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEdBQUc7WUFDOUIsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkM7b0JBQ0UsSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLEtBQUssRUFBRSxvRUFBb0U7b0JBQzNFLFNBQVMsRUFBRSxJQUFJO29CQUNmLFlBQVksRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDO2lCQUN4QzthQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDOUIsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDbkIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxHQUFHO1lBQzNCLFlBQVksRUFBRSxDQUFDO1lBQ2YsVUFBVSxFQUFFLFNBQVM7WUFDckIsb0JBQW9CLEVBQUU7Z0JBQ3BCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixPQUFPLEVBQUUsY0FBYyxDQUFDLEdBQUc7Z0JBQzNCLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDeEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1RkQsd0NBNEZDO0FBRUQsMkJBQTJCO0FBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksV0FBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUM7QUFDL0MsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBUZXJyYWZvcm1TdGFjayB9IGZyb20gJ2Nka3RmJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQXdzUHJvdmlkZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9wcm92aWRlcic7XG5pbXBvcnQgeyBEYXRhQXdzVnBjIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZGF0YS1hd3MtdnBjJztcbmltcG9ydCB7IERhdGFBd3NTdWJuZXRzIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZGF0YS1hd3Mtc3VibmV0cyc7XG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc2VjdXJpdHktZ3JvdXAnO1xuaW1wb3J0IHsgSWFtUm9sZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlJztcbmltcG9ydCB7IElhbVJvbGVQb2xpY3lBdHRhY2htZW50IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUtcG9saWN5LWF0dGFjaG1lbnQnO1xuaW1wb3J0IHsgRWNzQ2x1c3RlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2Vjcy1jbHVzdGVyJztcbmltcG9ydCB7IEVjc1Rhc2tEZWZpbml0aW9uIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZWNzLXRhc2stZGVmaW5pdGlvbic7XG5pbXBvcnQgeyBFY3NTZXJ2aWNlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZWNzLXNlcnZpY2UnO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRWNzU3RhY2sgZXh0ZW5kcyBUZXJyYWZvcm1TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gMe+4j+KDoyBBV1MgcHJvdmlkZXJcbiAgICBuZXcgQXdzUHJvdmlkZXIodGhpcywgJ0FXUycsIHsgcmVnaW9uOiAnZXUtbm9ydGgtMScgfSk7XG5cbiAgICAvLyAy77iP4oOjIEdldCBkZWZhdWx0IFZQQyBhbmQgc3VibmV0c1xuICAgIGNvbnN0IGRlZmF1bHRWcGMgPSBuZXcgRGF0YUF3c1ZwYyh0aGlzLCAnZGVmYXVsdFZwYycsIHsgZGVmYXVsdDogdHJ1ZSB9KTtcbiAgICBjb25zdCBkZWZhdWx0U3VibmV0cyA9IG5ldyBEYXRhQXdzU3VibmV0cyh0aGlzLCAnZGVmYXVsdFN1Ym5ldHMnLCB7XG4gICAgICBmaWx0ZXI6IFt7IG5hbWU6ICd2cGMtaWQnLCB2YWx1ZXM6IFtkZWZhdWx0VnBjLmlkXSB9XSxcbiAgICB9KTtcblxuICAgIC8vIDPvuI/ig6MgU2VjdXJpdHkgZ3JvdXAgYWxsb3dpbmcgcG9ydCAzMDAwXG4gICAgY29uc3Qgc2cgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCAnZWNzU2cnLCB7XG4gICAgICBuYW1lOiAndHlwZXNjcmlwdGFwcC1zZycsXG4gICAgICB2cGNJZDogZGVmYXVsdFZwYy5pZCxcbiAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiAzMDAwLFxuICAgICAgICAgIHRvUG9ydDogMzAwMCxcbiAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBlZ3Jlc3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICBwcm90b2NvbDogJy0xJyxcbiAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIDTvuI/ig6MgSUFNIFJvbGUgZm9yIEVDUyB0YXNrIGV4ZWN1dGlvblxuICAgIGNvbnN0IHRhc2tSb2xlID0gbmV3IElhbVJvbGUodGhpcywgJ2Vjc1Rhc2tSb2xlJywge1xuICAgICAgbmFtZTogJ3R5cGVzY3JpcHRhcHAtdGFzay1yb2xlJyxcbiAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHsgU2VydmljZTogJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJyB9LFxuICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIG5ldyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCh0aGlzLCAnZWNzVGFza1BvbGljeUF0dGFjaCcsIHtcbiAgICAgIHJvbGU6IHRhc2tSb2xlLm5hbWUsXG4gICAgICBwb2xpY3lBcm46ICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQW1hem9uRUNTVGFza0V4ZWN1dGlvblJvbGVQb2xpY3knLFxuICAgIH0pO1xuXG4gICAgLy8gNe+4j+KDoyBFQ1MgQ2x1c3RlclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgRWNzQ2x1c3Rlcih0aGlzLCAnY2x1c3RlcicsIHtcbiAgICAgIG5hbWU6ICd0eXBlc2NyaXB0YXBwLWNsdXN0ZXInLFxuICAgIH0pO1xuXG4gICAgLy8gNu+4j+KDoyBFQ1MgVGFzayBEZWZpbml0aW9uXG4gICAgY29uc3QgdGFza0RlZiA9IG5ldyBFY3NUYXNrRGVmaW5pdGlvbih0aGlzLCAndGFza0RlZicsIHtcbiAgICAgIGZhbWlseTogJ3R5cGVzY3JpcHRhcHAtdGFzaycsXG4gICAgICBjcHU6ICcyNTYnLFxuICAgICAgbWVtb3J5OiAnNTEyJyxcbiAgICAgIG5ldHdvcmtNb2RlOiAnYXdzdnBjJyxcbiAgICAgIHJlcXVpcmVzQ29tcGF0aWJpbGl0aWVzOiBbJ0ZBUkdBVEUnXSxcbiAgICAgIGV4ZWN1dGlvblJvbGVBcm46IHRhc2tSb2xlLmFybixcbiAgICAgIGNvbnRhaW5lckRlZmluaXRpb25zOiBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAndHlwZXNjcmlwdGFwcCcsXG4gICAgICAgICAgaW1hZ2U6ICcwOTA2MTg0ODAyMDIuZGtyLmVjci5ldS1ub3J0aC0xLmFtYXpvbmF3cy5jb20vdHlwZXNjcmlwdGFwcDpsYXRlc3QnLFxuICAgICAgICAgIGVzc2VudGlhbDogdHJ1ZSxcbiAgICAgICAgICBwb3J0TWFwcGluZ3M6IFt7IGNvbnRhaW5lclBvcnQ6IDMwMDAgfV0sXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICB9KTtcblxuICAgIC8vIDfvuI/ig6MgRUNTIFNlcnZpY2VcbiAgICBuZXcgRWNzU2VydmljZSh0aGlzLCAnc2VydmljZScsIHtcbiAgICAgIG5hbWU6ICd0eXBlc2NyaXB0YXBwLXNlcnZpY2UnLFxuICAgICAgY2x1c3RlcjogY2x1c3Rlci5pZCxcbiAgICAgIHRhc2tEZWZpbml0aW9uOiB0YXNrRGVmLmFybixcbiAgICAgIGRlc2lyZWRDb3VudDogMSxcbiAgICAgIGxhdW5jaFR5cGU6ICdGQVJHQVRFJyxcbiAgICAgIG5ldHdvcmtDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGFzc2lnblB1YmxpY0lwOiB0cnVlLFxuICAgICAgICBzdWJuZXRzOiBkZWZhdWx0U3VibmV0cy5pZHMsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2cuaWRdLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG4vLyA477iP4oOjIFN5bnRoZXNpemUgdGhlIHN0YWNrXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5uZXcgU2ltcGxlRWNzU3RhY2soYXBwLCAndHlwZXNjcmlwdGFwcC1zdGFjaycpO1xuYXBwLnN5bnRoKCk7XG4iXX0=