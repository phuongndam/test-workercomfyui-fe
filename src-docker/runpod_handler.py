"""RunPod serverless handler that forwards text-to-image jobs to ComfyUI."""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any, Dict, List
from urllib.parse import urlencode

import requests

from workflow_loader import apply_overrides, clone_workflow, load_workflow

COMFYUI_BASE_URL = os.getenv("COMFYUI_BASE_URL", "http://127.0.0.1:8188")
WORKFLOW_PATH = os.getenv("WORKFLOW_PATH", "/workspace/workflows/flux-text2img.json")
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "2.0"))
TIMEOUT = int(os.getenv("TIMEOUT_MS", "300000"))

WORKFLOW_CACHE: Dict[str, Any] | None = None


def _load_cached_workflow() -> Dict[str, Any]:
  global WORKFLOW_CACHE
  if WORKFLOW_CACHE is None:
    WORKFLOW_CACHE = load_workflow(WORKFLOW_PATH)
  return clone_workflow(WORKFLOW_CACHE)


def handler(event: Dict[str, Any]) -> Dict[str, Any]:
  payload = event.get("input") if "input" in event else event
  prompt = (payload or {}).get("prompt")
  if not prompt:
    raise ValueError("Missing 'prompt' in RunPod payload")

  negative_prompt = payload.get("negative_prompt")
  width = int(payload.get("width", 1024))
  height = int(payload.get("height", 1024))
  seed = payload.get("seed")
  if seed is not None:
    seed = int(seed)
  steps = payload.get("steps")
  if steps is not None:
    steps = int(steps)

  workflow = _load_cached_workflow()
  patched_workflow = apply_overrides(
    workflow,
    prompt=prompt,
    negative_prompt=negative_prompt,
    width=width,
    height=height,
    seed=seed,
    steps=steps,
  )

  client_id = str(uuid.uuid4())
  queue_response = _queue_prompt(patched_workflow, client_id)
  history = _wait_for_history(queue_response["prompt_id"])
  images = _extract_images(history)

  return {
    "prompt_id": queue_response["prompt_id"],
    "images": images,
    "raw_history": history,
  }


def _queue_prompt(workflow: Dict[str, Any], client_id: str) -> Dict[str, Any]:
  response = requests.post(
    f"{COMFYUI_BASE_URL}/prompt",
    headers={"Content-Type": "application/json"},
    data=json.dumps({"prompt": workflow, "client_id": client_id}),
    timeout=60,
  )
  response.raise_for_status()
  return response.json()


def _wait_for_history(prompt_id: str) -> Dict[str, Any]:
  deadline = time.time() + (TIMEOUT / 1000)
  while time.time() < deadline:
    response = requests.get(f"{COMFYUI_BASE_URL}/history/{prompt_id}", timeout=60)
    if response.status_code == 404:
      time.sleep(POLL_INTERVAL)
      continue
    response.raise_for_status()
    payload = response.json()
    entry = payload.get(prompt_id)
    if entry and entry.get("outputs"):
      return entry
    time.sleep(POLL_INTERVAL)
  raise TimeoutError("ComfyUI job timed out while waiting for results")


def _extract_images(history: Dict[str, Any]) -> List[Dict[str, Any]]:
  results: List[Dict[str, Any]] = []
  outputs = history.get("outputs", {})
  for node in outputs.values():
    for image in node.get("images", []):
      params = {
        "filename": image.get("filename"),
        "type": image.get("type", "output"),
      }
      if image.get("subfolder"):
        params["subfolder"] = image["subfolder"]
      clean_params = {k: v for k, v in params.items() if v}
      results.append(
        {
          "url": f"{COMFYUI_BASE_URL}/view?{urlencode(clean_params)}",
          "metadata": image,
        }
      )
  return results
