# Helm Installation

This guide covers how to install DreamFactory 7.x using the official Helm chart.

## Prerequisites

### Install Helm
Before proceeding with the DreamFactory Helm installation, ensure you have Helm installed on your system. See the [official Helm installation guide](https://helm.sh/docs/intro/install/) for detailed instructions.

## Installation Steps

### 1. Clone the df-helm Repository

Navigate to your desired directory and clone the repository:

```bash
cd ~/repos  # or wherever you want the clone of the repo to be
git clone https://github.com/dreamfactorysoftware/df-helm.git
cd df-helm
```

### 2. Configure the Installation

Edit the `values.yaml` file to customize your installation. At minimum, update the MySQL root password to a secure value:

```yaml
# Update this value in values.yaml
mysql:
  rootPassword: "your-secure-password"
```

Change replica count to 1 to start so when we get to the post installation steps we can grab the APP_KEY before scaling up the deployment:

```yaml
# Update this value in values.yaml
 image:
    repository: dreamfactorysoftware/df-docker
    tag: latest
  replicaCount: 1
```

### 3. Install DreamFactory

Start the DreamFactory pods using Helm:

```bash
helm install dreamfactory .
```

### 4. Verify Installation

Check that all pods are running correctly:

```bash
kubectl get pods
```

You should see:
- 2 DreamFactory pods
- 1 MySQL pod for system config storage
- 1 Redis pod for caching

## Commercial Instance Creation

For commercial DreamFactory installations, you'll need to build a custom Docker image that includes your commercial components and license key. Follow these steps:

### 1. Pull the Base DreamFactory Image

```bash
docker pull dreamfactorysoftware/df-docker:latest
```

### 2. Replace Commercial Composer Files

The DreamFactory Docker image comes with 3 composer files that need to be replaced with your commercial versions:

- `composer.json` 
- `composer.lock`  
- `composer.json-dist` 

Replace these files in the Docker image directory with the commercial versions provided to you. The composer installation and dependency management is handled automatically during the Docker build process.

### 3. Modify the Dockerfile

Edit the existing `Dockerfile` that comes with the DreamFactory image. You need to uncomment two specific lines:

1. **Uncomment the composer files copy line** (around line 25):
```dockerfile
# Add commercial files if running a licensed version
COPY composer.* /opt/dreamfactory/
```

2. **Uncomment and update the license key line** (around line 35):
```dockerfile
# Replace YOUR_LICENSE_KEY with your license key, keeping the comma at the end
RUN sed -i "s,\#DF_REGISTER_CONTACT=,DF_LICENSE_KEY=your-actual-license-key," /opt/dreamfactory/.env
```

### 4. Build the Custom Image

Build your custom Docker image (do not deploy yet):

```bash
docker build -t your-registry/dreamfactory-commercial:latest .
```

### 5. Push to Your Private Registry

Push the image to your private Docker registry or DevOps platform:

```bash
# For Docker Hub
docker push your-registry/dreamfactory-commercial:latest

# For other registries (replace with your registry URL)
docker tag your-registry/dreamfactory-commercial:latest your-registry.com/dreamfactory-commercial:latest
docker push your-registry.com/dreamfactory-commercial:latest
```

### 6. Configure Helm Chart to Use Custom Image

Update your `values.yaml` file to reference your custom image:

```yaml
dreamfactory:
  image:
    repository: your-registry/dreamfactory-commercial
    tag: latest
    pullPolicy: Always
  
  # If using a private registry, add image pull secrets
  imagePullSecrets:
    - name: your-registry-secret
```

### 7. Create Image Pull Secret (if using private registry)

If your custom image is in a private registry, create a Kubernetes secret:

```bash
kubectl create secret docker-registry your-registry-secret \
    --docker-server=your-registry.com \
    --docker-username=your-username \
    --docker-password=your-password \
    --docker-email=your-email@example.com
```

### 8. Deploy with Custom Image

Install or upgrade your DreamFactory deployment:

```bash
# For new installation
helm install dreamfactory . -f 

# For existing installation
helm upgrade dreamfactory . -f values.yaml
```

## Accessing DreamFactory

### Method 1: Port Forwarding (Without Ingress)

For local development or testing, you can access DreamFactory using port forwarding:

```bash
kubectl port-forward svc/dreamfactory-dreamfactory 8080:80
```

Then navigate to `http://127.0.0.1:8080` in your browser. The initial setup may take some time, but you'll eventually be prompted to create your first admin user.

### Method 2: Ingress Controller

For production deployments, configure an ingress controller to access DreamFactory externally.

#### Basic Configuration

Update the ingress section in your `values.yaml`:

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: nginx  # or your preferred ingress controller
    annotations:
      # Add any required annotations for your ingress controller
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod  # if using cert-manager
    hosts:
      - your-domain.example.com
    tls: true
```

Apply the configuration:

```bash
helm upgrade dreamfactory . -f values.yaml
```

## Ingress Configuration Examples

### Basic HTTP Setup (Existing NGINX Ingress with no TLS)

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: nginx
    hosts:
      - df.example.com
    tls: false
    pathType: Prefix
```

### HTTPS with TLS (Existing NGINX Ingress with TLS)

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-issuer-name
    hosts:
      - df.example.com
    tls: true
    pathType: Prefix
```

### AWS ALB Setup

**Prerequisites**: AWS Load Balancer Controller must be installed. See the [installation guide](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/deploy/installation/).

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/ssl-redirect: '443'
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS":443}]'
      alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
      alb.ingress.kubernetes.io/certificate-arn: '' # Certificate needs to exist in AWS Certificate Manager
    hosts:
      - df.example.com
    tls: false
    pathType: Prefix
```

### Contour Ingress Setup

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: contour
    annotations:
      ingress.kubernetes.io/force-ssl-redirect: "true"
      projectcontour.io/max-connections: "1024"
      projectcontour.io/response-timeout: 30s
      projectcontour.io/websocket-routes: /
    hosts:
      - df.example.com
    tls: true
    pathType: Prefix
```

### GCP Ingress Setup (Google Managed Certificates)

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: gce
    annotations:
      kubernetes.io/ingress.global-static-ip-name: "dreamfactory-ip"  # Optional: if you want a static IP
      networking.gke.io/v1beta1.FrontendConfig: "dreamfactory-ssl-redirect"
      networking.gke.io/managed-certificates: "dreamfactory-cert"
    hosts:
      - df.example.com
    tls: false
    pathType: Prefix
```

### GCP Ingress Setup (LetsEncrypt)

```yaml
dreamfactory:
  ingress:
    enabled: true
    ingressClass: gce
    annotations:
      kubernetes.io/ingress.global-static-ip-name: "dreamfactory-ip"  # Optional: if you want a static IP
      networking.gke.io/v1beta1.FrontendConfig: "dreamfactory-ssl-redirect"
      cert-manager.io/cluster-issuer: letsencrypt-issuer-name
    hosts:
      - df.example.com
    tls: true
    pathType: Prefix
```

## Post-Installation Steps

### 1. Verify Ingress Creation

After applying the configuration, verify the ingress was created:

```bash
kubectl get ingress
```

### 2. Configure DNS

Ensure your DNS is configured to point to the ingress controller's address.

### 3. Access DreamFactory

Access DreamFactory at the configured host (e.g., `https://df.example.com`).

**Note**: TLS configuration requires either cert-manager installed in your cluster or manually created TLS secrets.

## Obtaining the APP Key

After your DreamFactory instance is running, you'll need the APP_KEY value from the `.env` file. Retrieve it using:

```bash
kubectl exec -it <pod-name> -- env | grep APP_KEY
```

Replace `<pod-name>` with the actual name of your DreamFactory pod.

The APP_KEY is a critical component of your DreamFactory instance. You will need to save it as it is what is used to encrypt your data entered into and retrieved from your system DB.

In the Helm chart after successfully deploying the first time you will need to add the APP_KEY into your secrets.yaml file so that the APP_KEY is injected into all future pods. The line in question is: 

```bash
app-key: {{ randAlphaNum 32 | b64enc | quote }} -- replace the braces and all with your APP_KEY in quotes
```

By default it will create a random number, after initial install we only want to use the key that was generated at the very start.

## Uninstalling DreamFactory

To remove DreamFactory and all associated resources:

```bash
helm uninstall dreamfactory
```

This will stop and uninstall all DreamFactory pods, MySQL, and Redis instances.

## Additional Resources

- [Getting Started Guide](http://guide.dreamfactory.com/)
- [DreamFactory Wiki](http://wiki.dreamfactory.com)
- [Community Support](http://community.dreamfactory.com/)
- [Commercial Licenses and Support](https://www.dreamfactory.com/demo/)
