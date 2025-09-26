# Workflows

Place your ComfyUI workflow JSON files in this directory. The front-end loads the JSON at runtime and injects the prompt/size parameters before sending it to the worker API. By default the app expects a file named `flux-text2img.sample.json` (see below).

## Using your existing `flux-text2img.json`

1. Copy your `flux-text2img.json` from the Docker worker into this folder.
2. Update `src/config/workflow.ts` if the filename or node identifiers differ from the defaults.
3. (Optional) Remove the sample workflow file after you have copied the real one.

The default `WorkflowConfig` assumes the following:

- Positive prompt node ID: `9`, path `inputs.text`
- Negative prompt node ID: `10`, path `inputs.text`
- Resolution node ID: `11`, width/height at `inputs.width` and `inputs.height`
- Seed node ID: `12`, path `inputs.seed`
- Steps node ID: `13`, path `inputs.steps`

If your workflow uses different node IDs or properties, edit `src/config/workflow.ts` to match.
