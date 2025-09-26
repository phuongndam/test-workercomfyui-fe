# Docker & RunPod helpers

This folder contains assets that help you deploy the ComfyUI worker behind the new web interface in two scenarios:

1. **Local Docker compose / bare Docker** – expose the ComfyUI HTTP API so the front-end can call it from `http://127.0.0.1:8188`.
2. **RunPod serverless** – bundle a lightweight Python handler that can forward simple text-to-image requests to the ComfyUI worker running inside the same container.

## Files

- `Dockerfile.frontend`: multi-stage build that compiles the Vite app and serves it through a tiny Node.js server (or any static server of your choice).
- `runpod_handler.py`: reference implementation of a RunPod serverless handler. It loads the same `flux-text2img.json` workflow that the front-end expects, injects prompt/size parameters, and sends the job to the local ComfyUI API (`http://127.0.0.1:8188`).
- `workflow_loader.py`: shared helper to patch ComfyUI workflow files in Python (mirrors the logic used on the front-end).

You can adapt these files to your existing Docker images. They are intentionally small and dependency-free so that you can integrate them into your existing worker container.

## Build the front-end container

```bash
# Build production assets
npm install
npm run build

# Build the docker image
docker build -f src-docker/Dockerfile.frontend -t comfyui-frontend .
```

## RunPod serverless handler

The handler expects the following environment variables:

- `COMFYUI_BASE_URL` – defaults to `http://127.0.0.1:8188`
- `WORKFLOW_PATH` – absolute path to `flux-text2img.json` inside the container
- `PROMPT_NODE_ID`, `NEGATIVE_NODE_ID`, `SIZE_NODE_ID`, `SEED_NODE_ID`, `STEPS_NODE_ID` – optional overrides for node IDs

Deploy the handler with your RunPod template and forward the HTTP payload from RunPod to this handler.
