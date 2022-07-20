
using Grpc.Core;
using Allocation;

string clientKey    = File.ReadAllText(@"C:\Users\oleja\repos\agones-gcp-websockets\AllocatorDemo\client.key");
string clientCert   = File.ReadAllText(@"C:\Users\oleja\repos\agones-gcp-websockets\AllocatorDemo\client.crt");
string serverCa     = File.ReadAllText(@"C:\Users\oleja\repos\agones-gcp-websockets\AllocatorDemo\ca.crt");

string externalIp   = "35.228.9.67";
string namespaceArg = "default";
bool   multicluster = false;

var creds = new SslCredentials(serverCa, new KeyCertificatePair(clientCert, clientKey));
var channel = new Channel(externalIp + ":443", creds);
var client = new AllocationService.AllocationServiceClient(channel);

try {
    var response = await client.AllocateAsync(new AllocationRequest { 
        Namespace = namespaceArg,
        MultiClusterSetting = new Allocation.MultiClusterSetting {
            Enabled = multicluster,
        }
    });
    Console.WriteLine(response);
} 
catch(RpcException e)
{
    Console.WriteLine($"gRPC error: {e}");
}