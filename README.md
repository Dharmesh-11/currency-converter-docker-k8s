# 💱 Currency Converter

A simple static web application that converts currencies in real-time using the [ExchangeRate API](https://www.exchangerate-api.com/). Built with HTML, CSS, and JavaScript — deployable via Docker and AWS EKS.

---

## 📁 Project Structure

```
your-project/
├── app/
│   ├── index.html          # Main HTML page
│   ├── style.css           # Styles
│   └── project.js          # Currency logic & API calls
├── Dockerfile              # Docker image definition
├── deployment.yaml         # Kubernetes Deployment
├── service.yaml            # Kubernetes Service
└── README.md
```

---

## 🚀 Features

- Convert between 150+ world currencies
- Real-time exchange rates via ExchangeRate API
- Country flag icons per currency
- Lightweight nginx-based Docker image

---

## 🐳 Docker

### Build & Run Locally

```bash
# Build the image
docker build -t currency-converter:latest .

# Run the container
docker run -p 8080:80 currency-converter:latest
```

Open browser → `http://localhost:8080`

### Dockerfile Overview

- Base image: `nginx:alpine` (~8MB)
- Copies all files from `app/` into nginx web root
- Exposes port `80`

---

## ☁️ AWS EKS

### Step 1: Install Prerequisites

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws --version

# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin/eksctl
eksctl version

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

### Step 2: Configure AWS CLI

```bash
aws configure
```
```
AWS Access Key ID:     your-access-key
AWS Secret Access Key: your-secret-key
Default region:        ap-south-1
Default output format: json
```

### Step 3: Push Image to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name currency-converter --region ap-south-1

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Build, tag & push
docker build -t currency-converter:latest .
docker tag currency-converter:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/currency-converter:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/currency-converter:latest
```

### Step 4: Create EKS Cluster

```bash
eksctl create cluster \
  --name currency-converter-cluster \
  --region ap-south-1 \
  --nodegroup-name worker-nodes \
  --node-type t3.micro \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed
```

> ⏳ Takes 10–15 minutes

Verify cluster:
```bash
kubectl get nodes
```

### Step 5: Update deployment.yaml

Update `image:` in `deployment.yaml` with your ECR URI:
```yaml
image: <account-id>.dkr.ecr.ap-south-1.amazonaws.com/currency-converter:latest
imagePullPolicy: Always
```

### Step 6: Deploy to EKS

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Verify:
```bash
kubectl get pods
kubectl get service currency-converter-service
```

### Step 7: Access the App

```bash
kubectl get service currency-converter-service
```
Output:
```
NAME                         TYPE           EXTERNAL-IP
currency-converter-service   LoadBalancer   abc123.ap-south-1.elb.amazonaws.com
```

Open browser → `http://abc123.ap-south-1.elb.amazonaws.com` 🎉

### Step 8: Cleanup

```bash
kubectl delete -f deployment.yaml
kubectl delete -f service.yaml
eksctl delete cluster --name currency-converter-cluster --region ap-south-1
aws ecr delete-repository --repository-name currency-converter --region ap-south-1 --force
```

---

## 📋 Kubernetes Files Overview

### deployment.yaml

| Field | Value |
|---|---|
| Kind | Deployment |
| Replicas | 2 |
| Image | ECR URI |
| Container Port | 80 |
| ImagePullPolicy | Always |

### service.yaml

| Field | Value |
|---|---|
| Kind | Service |
| Type | LoadBalancer |
| Port | 80 |
| TargetPort | 80 |

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| `ImagePullBackOff` | Check ECR URI in deployment.yaml is correct |
| No EXTERNAL-IP | Wait 2–3 min for AWS LoadBalancer to provision |
| Pods not running | Run `kubectl describe pod <pod-name>` to check errors |
| ECR push unauthorized | Re-run `aws ecr get-login-password` command |
| Cluster creation fails | Ensure IAM user has `AdministratorAccess` policy |

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Web Server**: nginx (alpine)
- **Containerization**: Docker
- **Orchestration**: Kubernetes (AWS EKS)
- **Registry**: AWS ECR
- **CLI Tools**: AWS CLI, eksctl, kubectl
- **API**: [ExchangeRate API](https://www.exchangerate-api.com/)

 
 # 👨‍💻 Author

## Dharmesh Panpatil
