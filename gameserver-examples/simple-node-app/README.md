# Gameserver example: Simple Node App 

## Agones SDK
This demo application implements the [Agones Client SDK for Node.js](https://agones.dev/site/docs/guides/client-sdks/nodejs/). If you are interested in making gameservers with node, do also check out the Agones' docs [official node example](https://agones.dev/site/docs/tutorials/simple-gameserver-nodejs/). That app shows a lot of the capabilities of the SDK, however it does not implement web sockets.


## Local development
To run this server locally, you need to run the Agones SDK server locally. You can read more about why, as well as download the SDK [from the Agones docs](https://agones.dev/site/docs/guides/client-sdks/local/). 

if you downloaded the SDK, run it in a terminal (windows): 
```
sdk-server.windows.amd64.exe --local
``` 

install dependencies for the simple-node-app
```
npm install
```

run simple-node-app locally
```
npm start
```


## Build/publish gameserver docker image
In order to create a gameserver, you first need to publish it as a docker image. If you installed [Docker](https://www.docker.com/) you can run the following command to build an image locally. Note that you have to make a couple of changes to the docker image tag depending on your region and gcp-project name.

```
docker build --pull --rm -f "Dockerfile" -t [eu.]gcr.io/[GCP-PROJECT]/simple-node-app "simple-node-app"
```

We're keeping our docker images at GCP [Container Registry](https://console.cloud.google.com/gcr/images). If you tagged your image correctly, you can simply run this command to push the image to Cloud Registry:

```
docker push [eu.]gcr.io/[GCP-PROJECT]/simple-node-app
```

**However!** To simplify the developer experience we're instead using cloud build to build and push the container image to gcp.

Cloud build can be configured with a yaml-file, a simple example can be found in [cloudbuild.yaml](cloudbuild.yaml). You can use this kind of file to configure CI/CD for your gameservers. If you use it, make sure to check the region and insert your GCP project name.

To trigger a cloud build from local terminal, run:
```
gcloud builds submit .
```

## Create a gameserver 
Your cluster must be [correctly configured](../../README.md#step-by-step-instructions) before creating the gameserver.

Assuming you have followed the complete setup in the root folder, you can now create a single game server using the yaml-file [gameserver.yaml](gameserver.yaml). If you use this file, make sure you change it to use your own domain, and the correct docker image.

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

## kubectl game server interaction
Now there should be a game server in your cluster. Get information about the newly created server using the following commands:

To get the name, IP adress, public port of the gameserver (gs):

`kubectl get gs`

To get urls from your gameservers' ingresses, run:

`kubectl get ingress`

To get more information about the state of a gameserver:

`kubectl describe gs [GS NAME]`

`kubectl logs [GS NAME] -c simple-node-app` (from the actual gameserver)

`kubectl logs [GS NAME] -c agones-gameserver-sidecar` (from the sidecar)

To delete gameservers, you can either name it specifically, or delete all:

`kubectl delete gs [GS NAME]`

`kubectl delete gs --all`

## Creating a fleet

`kubectl apply -f fleet.yaml`

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
