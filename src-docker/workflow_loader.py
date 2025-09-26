"""Utilities to patch ComfyUI workflows inside Docker/RunPod workers."""

from __future__ import annotations

import copy
import json
import os
from typing import Any, Dict

DEFAULT_CONFIG = {
  "prompt_node": {"id": os.getenv("PROMPT_NODE_ID", "9"), "path": os.getenv("PROMPT_NODE_PATH", "inputs.text")},
  "negative_node": {"id": os.getenv("NEGATIVE_NODE_ID", "10"), "path": os.getenv("NEGATIVE_NODE_PATH", "inputs.text")},
  "size_node": {"id": os.getenv("SIZE_NODE_ID", "11"), "width_path": os.getenv("SIZE_WIDTH_PATH", "inputs.width"), "height_path": os.getenv("SIZE_HEIGHT_PATH", "inputs.height")},
  "seed_node": {"id": os.getenv("SEED_NODE_ID", "12"), "path": os.getenv("SEED_NODE_PATH", "inputs.seed")},
  "steps_node": {"id": os.getenv("STEPS_NODE_ID", "13"), "path": os.getenv("STEPS_NODE_PATH", "inputs.steps")},
}

PATH_SEPARATOR = "."


def load_workflow(path: str) -> Dict[str, Any]:
  with open(path, "r", encoding="utf-8") as handle:
    return json.load(handle)


def clone_workflow(workflow: Dict[str, Any]) -> Dict[str, Any]:
  return copy.deepcopy(workflow)


def _set_path(node: Dict[str, Any], path: str, value: Any) -> None:
  parts = path.split(PATH_SEPARATOR)
  cursor = node
  for segment in parts[:-1]:
    cursor = cursor.setdefault(segment, {})
  cursor[parts[-1]] = value


def apply_overrides(
  workflow: Dict[str, Any],
  *,
  prompt: str,
  negative_prompt: str | None = None,
  width: int | None = None,
  height: int | None = None,
  seed: int | None = None,
  steps: int | None = None,
  config: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
  cfg = config or DEFAULT_CONFIG
  nodes = workflow.get("nodes", workflow)

  def update(node_info: Dict[str, str], value: Any) -> None:
    if value is None:
      return
    node = nodes.get(node_info.get("id"))
    if not node:
      return
    path = node_info.get("path")
    if not path:
      return
    _set_path(node, path, value)

  update(cfg.get("prompt_node", {}), prompt)
  update(cfg.get("negative_node", {}), negative_prompt)

  size_cfg = cfg.get("size_node", {})
  size_node = nodes.get(size_cfg.get("id")) if size_cfg else None
  if size_node:
    if width is not None and size_cfg.get("width_path"):
      _set_path(size_node, size_cfg["width_path"], width)
    if height is not None and size_cfg.get("height_path"):
      _set_path(size_node, size_cfg["height_path"], height)

  update(cfg.get("seed_node", {}), seed)
  update(cfg.get("steps_node", {}), steps)

  return workflow
