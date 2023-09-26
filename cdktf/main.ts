
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { GoogleProvider } from '@cdktf/provider-google/lib/provider';
import { ComputeNetwork } from '@cdktf/provider-google/lib/compute-network';
import { ComputeSubnetwork } from '@cdktf/provider-google/lib/compute-subnetwork';
import { ContainerCluster } from '@cdktf/provider-google/lib/container-cluster';
import { SqlDatabaseInstance } from '@cdktf/provider-google/lib/sql-database-instance';

class AppClusterStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const project = 'app';
    const region = 'europe-north1';
    const clusterName = 'app-cluster';
    const dbName = 'app-db';
    const networkName = `${clusterName}-network`;
    const subnetworkName = `${clusterName}-subnet`;

    new GoogleProvider(this, 'google', {
      project: project,
      region: region,
    });

    const network = new ComputeNetwork(this, 'network', {
      name: networkName,
      project: project,
      autoCreateSubnetworks: false,
    });

    const subnetwork = new ComputeSubnetwork(this, 'subnetwork', {
      name: subnetworkName,
      project: project,
      network: network.name,
      region: region,
      ipCidrRange: '10.0.0.0/24',
      secondaryIpRange: [
        {
          ipCidrRange: '10.1.0.0/16',
          rangeName: `${clusterName}-pod-range`,
        },
        {
          ipCidrRange: '10.2.0.0/20',
          rangeName: `${clusterName}-svc-range`,
        },
      ],
    });

    const gkeCluster = new ContainerCluster(this, 'cluster', {
      name: clusterName,
      project: project,
      location: region,
      initialNodeCount: 1,
      network: network.name,
      subnetwork: subnetwork.name,
    });

    const sqlInstance = new SqlDatabaseInstance(this, 'sql-instance', {
      project: project,
      name: dbName,
      region: region,
      databaseVersion: 'POSTGRES_14',
      settings: {
        tier: 'db-f1-micro',
        ipConfiguration: {
          ipv4Enabled: false,
          privateNetwork: network.name,
          authorizedNetworks: [
            {
              name: 'subnetwork',
              value: subnetwork.ipCidrRange,
            },
          ],
        },
  },
    });

    new TerraformOutput(this, 'cluster_name', {
      value: gkeCluster.name,
    });

    new TerraformOutput(this, 'sql_instance_name', {
      value: sqlInstance.name,
    });

  }
}

const app = new App();
new AppClusterStack(app, 'AppCluster');
app.synth();
