export interface WorkflowField {
  nodeId: string
  path: string
}

export interface WorkflowConfig {
  /**
   * Relative path (from the public directory) to the base ComfyUI workflow JSON.
   */
  workflowPath: string
  positivePrompt?: WorkflowField
  negativePrompt?: WorkflowField
  width?: WorkflowField
  height?: WorkflowField
  seed?: WorkflowField
  samplerSteps?: WorkflowField
}

export const defaultWorkflowConfig: WorkflowConfig = {
  workflowPath: '/workflows/flux-text2img.sample.json',
  positivePrompt: { nodeId: '9', path: 'inputs.text' },
  negativePrompt: { nodeId: '10', path: 'inputs.text' },
  width: { nodeId: '11', path: 'inputs.width' },
  height: { nodeId: '11', path: 'inputs.height' },
  seed: { nodeId: '12', path: 'inputs.seed' },
  samplerSteps: { nodeId: '13', path: 'inputs.steps' },
}
