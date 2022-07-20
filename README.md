# Agones GCP websocket example
A demo repository to show how one can set up a Kubernetes cluster in google cloud (GCP), and connect to game servers inside of it with secure websockets. The setup isn't straight forward by default, but a lot of different open source tools are very helpful in configuring the cluster.

# Introduction
The main open source-components of the kubernetes cluster setup is as follows:

[Agones](https://agones.dev/site/) is used to host, run and scale dedicated game servers in kubernetes. [Octops Gameserver Ingress Controller](https://github.com/Octops/gameserver-ingress-controller) is used create and manage ingress resources automatically for every game server. It wires this up to a reverse proxy and TLS certificate manager, which facilitates secure websocket connections from clients to webservers.

Octops is using [cert-manager](https://cert-manager.io/docs/) to manage certificates, and [Contour](https://projectcontour.io/) ingress controller under the hood. These need to be manually configured for the cluster as well.

**Big thanks** are directed to the entirety of the open source community, supplying excellent tooling that is free to use.


# Step by step instructions
### Table of contents
- Prerequisites
- Creating a kubernetes cluster in google cloud
- Installing Agones
- Installing Octops gameserver ingress controller
    - Installing cert-manager
    - Installing Contour Ingress controller
- [COMING SOON] Creating a websocket gameserver
- [COMING SOON] Connect to gameserver with a simple web client

## Prerequisites
- [gcloud](https://cloud.google.com/sdk/docs/install), googles CLI for GCP - among other things, use it to [connect to your cluster with...](https://agones.dev/site/docs/installation/creating-cluster/gke/#setting-up-cluster-credentials)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/), the kubernetes CLI. This repo holds [my course notes](https://github.com/OleJoik/kubernetes-demo) for kubernetes and how to `kubectl`.
- [Helm](https://helm.sh/docs/intro/install/) package manager for kubernetes, I installed it for windows with `choco`
- [Docker](https://www.docker.com/) can be used to build gameservers. I use [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/) with the [Docker extension for Visual Studio Code](https://code.visualstudio.com/docs/containers/overview)

## Creating a kubernetes cluster in google cloud
The [official Agones documentation](https://agones.dev/site/docs/installation/creating-cluster/gke/) describes how one can use the `gcloud` command line tool to create a kubernetes cluster in Google Cloud Platform (GCP). The following few sections describe our modifications of these docs.

### GKE kubernetes**t** cluster 
The [Agones docs](https://agones.dev/site/docs/installation/creating-cluster/gke/#creating-the-cluster) suggest creating a cluster with a default pool of 4 nodes, running the machine type `e2-standard-4`. This is more resources then you need to run this simple demo, and can become an unneccesary expense. Therefore I have modified the number of nodes and the machine type and instead recommend using the settings below to create the cluster. In a prod environment you might want to run more then one node, but I do not do that here. It is fairly easy to scale up or change the cluster configuration later. I like using [cloud console](https://console.cloud.google.com/kubernetes/add) to actually create the cluster instead of `gcloud` cli, because it gives a nice overview of which kind of settings you can configure for the cluster.

Cluster settings:
```
gcloud container clusters create [CLUSTERNAME]
    --cluster-version=1.22 
    --tags=game-server 
    --scopes=gke-default 
    --num-nodes=1 
    --machine-type=e2-micro
    --disk-size=20
    --no-enable-autoupgrade 
```

### Pricing 
 According to GCP, the [GKE free tier](https://cloud.google.com/kubernetes-engine/pricing#cluster_management_fee_and_free_tier) provides $74.40 in monthly credits per billing account that are applied to zonal and Autopilot clusters. If you only use a single Zonal or Autopilot cluster, this credit will at least cover the complete cost of that cluster each month. 

[Estimated monthly cost](https://cloud.google.com/kubernetes-engine/pricing) for this cluster, running single zonal cluster in zone `europe-north1-a`, as of july 2022.
| Item | Description | Σ $ / month |
| :--- | :------ | ---: |
| Cluster management fee | $0.10/hour x 730 hours | $73.00 | 
| Node pool |  |  | 
| CPU / Memory | 2 vCPU + 1GB mem -> $6.73 x 1 node | $6.73 | 
| Persistent disk | 20GB -> $0.88 x 1 node | $0.88 | 
|  |  |  | 
| ~ Monthly cost |  |  $80.61| 
| Free tier |  |  - $74.40| 
|  |  |  | 
| **Final cost** |  |  **$6.21** | 

### Firewall rules
The [docs](https://agones.dev/site/docs/installation/creating-cluster/gke/#creating-the-firewall) suggest creating a firewall rule to open ports for udp-traffic. It is however not necessary to open extra ports to your cluster with this configuration. Clients will connect to the cluster through ingress, at ports 80-443.

## Installing agones
Follow [official documentation](https://agones.dev/site/docs/installation/install-agones/helm/) to install Agones into the cluster using Helm package manager for kubernetes

### [TODO] Configuration
Look into ways to reduce resource consumption ([Gameserver and sidecar configuration](https://agones.dev/site/docs/advanced/limiting-resources/#sdk-gameserver-sidecar))

## Octops Gameserver Ingress Controller
By default Agones creates game servers, and exposes their IP and Ports to clients. However, the IP:Port combination <b>can not be used</b> to issue SSL certificates, one needs a hostname (such as *www.domain.com*) for that. A server able to terminate ("decrypt") SSL certificates are however mandatory if used by a modern web client secured with SSL. The communication has to be secure, otherwise the browser will block it.

The [Game Server Ingress Controller](https://github.com/Octops/gameserver-ingress-controller) by [Octops](https://octops.io/) remedies this problem by automating the creation of ingress components for every gameserver created by Agones. The ingress can be configured to give a unique hostname (a subdomain of a domain you own, for example `gameserver-1.yourdomain.com`). Additionally it integrates with two other tools that need to be installed, [cert-manager](https://cert-manager.io/) and [Contour ingress controller](https://projectcontour.io/).

### Configuring the Octops controller
You can reduce the resource requirements of this component by modifying the [original yaml manifest](https://raw.githubusercontent.com/Octops/gameserver-ingress-controller/main/deploy/install.yaml) used when [installing](https://github.com/Octops/gameserver-ingress-controller#how-to-install-the-octops-controller) the controller.


My [modified install manifest](octops-gameserver-controller/modified-install.yaml)  is shown below:
```yaml
# modified-install.yaml
# Docs: https://github.com/Octops/gameserver-ingress-controller

(...)
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: octops-ingress-controller
  name: octops-ingress-controller
  namespace: octops-system
spec:
  (...)
  template:
    (...)
    spec:
      (serviceAccountName: octops)
      containers:
        (...)
          resources:
            requests:
              cpu: "0.05" # Reduced from 0.5
              memory: "30Mi" # Reduced from 50Mi
            limits:
              cpu: "0.25" # Reduced from 1
              memory: "100Mi" # Reduced from 150Mi
          (...)
```
### Installing the Octops controller
Visit the github repo of the gameserver ingress controller to read detailed documentation about how to use the tool.

https://github.com/Octops/gameserver-ingress-controller

Configure your install as shown above, check for updates from Octops, and finally, install the controller:
```
kubectl apply -f octops-gameserver-controller/modified-install.yaml
```

## cert-manager
[cert-manager](https://cert-manager.io/) helps you create and manage free TLS certificates for use in kubernetes. This is a versatile tool that can be used in many ways. For our setup, we need a wildcard certificate that applies to the subdomains exposed by the Octops ingress controller, for example ***gameserver-1.yourdomain.com***. The wildcard certificate can secure all subdomains of your host, ****.yourdomain.com***. The [cert-manager docs](https://cert-manager.io/docs/tutorials/acme/dns-validation/#issuing-an-acme-certificate-using-dns-validation) describe how to obtain such a certificate. An important note is that you need to have a provider from the [list of supported DNS providers](https://cert-manager.io/docs/configuration/acme/dns01/#supported-dns01-providers) (for example GoogleDNS) to be able to obtain a wildcard certificate.

I used the following steps to getting a certificate, described in detail the following sections.
1. Obtain a domain at googledomains
2. Manage the DNS with [GoogleDNS](https://console.cloud.google.com/net-services/dns/zones)
3. Install cert-manager
4. Obtain a certificate for *.yourdomain.com


### [TODO] Describe - Set up a domain at GoogleDNS
TODO: Create the domain, set up DNS.
- Remember: Add A record to 

https://console.cloud.google.com/net-services/dns/zones

### Installing cert-manager
apply the yaml file as shown in the [official documentation](https://cert-manager.io/docs/installation/kubectl/).

```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.2/cert-manager.yaml
```

### Obtain a certificate for  *.yourdomain.com 

The [cert-manager docs](https://cert-manager.io/docs/configuration/acme/dns01/google/) describe how to resolve DNS01 challenges when using Google CloudDNS to manage your DNS.

These are the steps to obtain a certificate:
1. Create a service accountand give it access to the following roles
2. Download a json-serviceaccount key
3. Create a kubernetes secret with serviceaccount key 
4. Create an Issuer referencing the secret
5. Create a kubernetes cert-manager certificate object
6. A TLS certificate secret is created for you

And now, the steps in detail:
1. [Create a service account](https://console.cloud.google.com/iam-admin/serviceaccounts) and [give it access](https://console.cloud.google.com/iam-admin/iam) to the following roles:
        
    - EITHER: 
        - dns.admin
    - OR, better - be spesific:
        - dns.resourceRecordSets.*
        - dns.changes.*
        - dns.managedZones.list

    I did this by [creating a new custom role](https://console.cloud.google.com/iam-admin/roles) with the following permissions

    - dns.changes.create
    - dns.changes.get
    - dns.changes.list
    - dns.managedZones.list
    - dns.resourceRecordSets.create
    - dns.resourceRecordSets.delete
    - dns.resourceRecordSets.get
    - dns.resourceRecordSets.list
    - dns.resourceRecordSets.update

    ... and [assigned](https://console.cloud.google.com/iam-admin/iam) it to the service account
     

2. [Download a json-serviceaccount key](https://cert-manager.io/docs/configuration/acme/dns01/google/#create-a-service-account-secret)
    
    I did this from the [service accounts section of gcp console](https://console.cloud.google.com/iam-admin/serviceaccounts)

3. [Create a kubernetes secret with serviceaccount key](https://cert-manager.io/docs/configuration/acme/dns01/google/#create-a-service-account-secret) 

    ```
    kubectl create secret generic clouddns-dns01-solver-svc-acct
        --from-file=key.json
    ```

4. [Create an Issuer](https://cert-manager.io/docs/configuration/acme/dns01/google/#create-an-issuer-that-uses-clouddns) referencing the secret and key...

    Here is my example - [issuer-dns01.yaml](cert-manager/issuer-dns01.yaml):

    ```yaml
    # issuer-dns01.yaml
    # docs: https://cert-manager.io/docs/configuration/acme/dns01/google/#create-an-issuer-that-uses-clouddns

    apiVersion: cert-manager.io/v1
    kind: Issuer
    metadata:
      name: clouddns-issuer
    spec:
      acme:
        server: https://acme-v02.api.letsencrypt.org/directory
        email: YOUR_EMAIL # example: your@email.com
        privateKeySecretRef:
          name: acme-account-secret # This can be anything
        solvers:
        - dns01:
          cloudDNS:
            project: YOUR_GCP_PROJECT # your gcp-project
            serviceAccountSecretRef:
              name: YOUR_SECRET_NAME # example: clouddns-dns01-solver-svc-acct
              key: YOUR_SECRET_KEY # example: FILENAME.json
    ```

    ... and apply it to the cluster

    ```
    kubectl apply -f cert-manager/issuer-dns01.yaml
    ```

    **Verify the issuer**

    ... after some seconds, the issuer should be ready. Check it like this:

    ```
    kubectl get issuer
    ```

    output:
    ```
    NAME              READY   AGE
    clouddns-issuer   True    38h
    ```

    `describe` gives more information about the issuer
    ```
    kubectl describe issuer clouddns-issuer
    ```

    Towards the bottom of the output, notice that the account was registered, and that the status and type are good.
    ```
    (...)
    (...)
    (...)
    Status:
    Acme:
        Last Registered Email:  [EMAIL ADDRESS]
        Uri:                    https://acme-v02.api.letsencrypt.org/acme/acct/[ID]
    Conditions:
        Last Transition Time:  [TIME]
        Message:               The ACME account was registered with the ACME server
        Observed Generation:   1
        Reason:                ACMEAccountRegistered
        Status:                True
        Type:                  Ready
    Events:                    <none>
    ```


5. [Create a kubernetes cert-manager](https://cert-manager.io/docs/configuration/acme/dns01/google/#create-an-issuer-that-uses-clouddns) certificate object...
    
    my example - [certificate-clouddns.yaml](cert-manager/certificate-clouddns.yaml):
    ```yaml
    # certificate-clouddns.yaml
    # docs: https://cert-manager.io/docs/configuration/acme/dns01/google/#create-an-issuer-that-uses-clouddns

    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
      name: project-yourdomain-com # Certificate name, select your own
      namespace: default
    spec:
      secretName: wildcard-cert # Referenced in fleet/gameserver manifest
      issuerRef:
        name: clouddns-issuer # Reference issuer 
      dnsNames:
      - "*.YOURDOMAIN.com"
    ```

    **Verify the certificate**

    ... after some seconds, the certificate should be ready. Check it like this:

    ```
    kubectl get certificate
    ```

    expected output:
    ```
    NAME                    READY   SECRET          AGE
    project-yourdomain-com  True    wildcard-cert   17s
    ```

    `describe` gives more information about the certificate
    ```
    kubectl describe certificate project-yourdomain-com
    ```

    expected output:
    ```
    (...)
    (...)
    (...)
    Spec:
    Dns Names:
        *.YOURDOMAIN.com
    Issuer Ref:
        Name:       clouddns-issuer
    Secret Name:    wildcard-cert
    Status:
    Conditions:
        Last Transition Time:  2022-07-18T14:13:34Z
        Message:               Certificate is up to date and has not expired
        Observed Generation:   1
        Reason:                Ready
        Status:                True
        Type:                  Ready
    Not After:               2022-10-16T13:13:31Z
    Not Before:              2022-07-18T13:13:32Z
    Renewal Time:            2022-09-16T13:13:31Z
    Revision:                1
    Events:
    Type    Reason     Age   From                                       Message
    ----    ------     ----  ----                                       -------
    Normal  Issuing    92s   cert-manager-certificates-trigger          Issuing certificate as Secret does not exist
    Normal  Generated  91s   cert-manager-certificates-key-manager      Stored new private key in temporary Secret resource "project-yourdomain-com-hd109"
    Normal  Requested  91s   cert-manager-certificates-request-manager  Created new CertificateRequest resource "project-yourdomain-com-0917h"
    Normal  Issuing    86s   cert-manager-certificates-issuing          The certificate has been successfully issued
    ```



6. When certificate is issued, the TLS certificate is automatically added to your kubernetes secrets
    
    Check that it exists:
    ```
    kubectl get secret
    ```


    expected output:
    ```
    NAME                             TYPE                                  DATA   AGE
    (...)
    (...)
    acme-account-secret              Opaque                                1      1h
    clouddns-dns01-solver-svc-acct   Opaque                                1      1h
    wildcard-cert                    kubernetes.io/tls                     2      37s
    ```

    `kubectl describe` should show that the data contains a `tls.crt` and `tls.key`

    ```
    kubectl describe secret wildcard-cert
    ```

    expected output:
    ```
    Name:         wildcard-cert
    (...)

    Type:  kubernetes.io/tls

    Data
    ====
    tls.crt:  5611 bytes
    tls.key:  1675 bytes
    ```

    You can also verify the certificate with openssl. I will not describe how to do it here.

    ## Contour Ingress Controller
    Octops gameserver ingress controller is using [Contour Ingress Controller](https://projectcontour.io/) as a reverse proxy.


    Follow the [official documentation](https://projectcontour.io/getting-started/#option-1-yaml) to install Contour using yaml.
    ```
    kubectl apply -f https://projectcontour.io/quickstart/contour.yaml
    ```

    verify that the pods are ready
    ```
    kubectl get pods -n projectcontour -o wide
    ```

    According to the docs, one should see the following:
    - 2 Contour pods with each status Running and 1/1 Ready
    - 1+ Envoy pod(s), with each the status Running and 2/2 Ready

    As Described in the [Octops docs](https://github.com/Octops/gameserver-ingress-controller#requirements), we need to update our DNS information to point to the exposed (load balancer) service. 
    
    Find the IP by running...

    ```
    kubectl -n projectcontour get svc
    ``` 

    ... and add a **wildcard DNS A-record** pointing to the IP-address at  [GoogleDNS](https://console.cloud.google.com/net-services/dns/zones).
    

    ## Recap
    Our cluster is now configured with the following components
    - Agones - to orchestrate game servers
    - Octops gameserver ingress controller - to manage ingress for gameservers, using...
        - cert-manager, to manage and automatically renew a wildcard certificate 
        - Contour ingress controller - as a reverse proxy


    Additionally, we have set up a wildcard DNS pointing to the contour load balancer.
         

# Create a gameserver


Now you can create a gameserver or a fleet using Octops annotations on the yaml file. To configure the ingress to use your newly created wildcard certificate, supply the secret name `octops.io/tls-secret-name` and set `octops.io/terminate-tls` to `"false"` Octops will automatically generate an ingress with tls configured, and you get an unique subdomain for your server.

`kubectl get ingress` 

You can look at some of our simple websocket example gameservers in [this folder](gameserver-examples/):

[TODO] Add more game server examples
- [NodeJS example](gameserver-examples/simple-node-app/)

`kubectl create -f gameserver.yaml` 

```yaml
# gameserver.yaml
# https://agones.dev/site/docs/reference/gameserver/
# annotations: https://github.com/Octops/gameserver-ingress-controller

apiVersion: "agones.dev/v1"
kind: GameServer
metadata:
  generateName: "simple-node-app-"
  annotations: 
    octops-kubernetes.io/ingress.class: "contour" 
    octops-projectcontour.io/websocket-routes: "/" 
    octops.io/gameserver-ingress-mode: "domain"
    octops.io/gameserver-ingress-domain: "[yourdomain.com]" 
    octops.io/terminate-tls: "false"
    octops.io/tls-secret-name: "wildcard-cert"
spec:
  ports:
    - name: default
      portPolicy: Dynamic
      containerPort: 7654
      protocol: TCP
  template:
    spec:
      containers:
      - name: simple-node-app
        image: [eu.]gcr.io/[GCP-PROJECT]/simple-node-app
```
    
# Create a Fleet

This also works just fine when creating a gameserver fleet.

Here is the [fleet manifest](gameserver-examples/simple-node-app/fleet.yaml) for simple-node-app:

```yaml
# fleet.yaml

# Examples
# https://agones.dev/site/docs/reference/fleet/
# https://github.com/Octops/gameserver-ingress-controller/blob/main/examples/fleet-domain.yaml

apiVersion: "agones.dev/v1"
kind: Fleet
metadata:
  name: simple-node-app-fleet
spec:
  replicas: 4
  template:
    metadata:
      annotations: 
        octops-kubernetes.io/ingress.class: "contour" 
        octops-projectcontour.io/websocket-routes: "/" 
        octops.io/gameserver-ingress-mode: "domain"
        octops.io/gameserver-ingress-domain: "[yourdomain.com]" 
        octops.io/terminate-tls: "false"
        octops.io/tls-secret-name: "wildcard-cert"
    spec:
      ports:
      - name: default
        portPolicy: Dynamic
        containerPort: 7654
        protocol: TCP
      template:
        spec:
          containers:
          - name: simple-node-app
            image: [eu.]gcr.io/[GCP-PROJECT]/simple-node-app
```