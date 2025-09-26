import { defaultWorkflowConfig, type WorkflowConfig, type WorkflowField } from '../config/workflow'

const PATH_SEPARATOR = '.'

function cloneWorkflow<T>(workflow: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(workflow)
  }

  return JSON.parse(JSON.stringify(workflow))
}

function setFieldValue(target: Record<string, any>, field: WorkflowField | undefined, value: string | number | undefined) {
  if (!field || value === undefined) return
  const node = target[field.nodeId]
  if (!node) {
    console.warn(`Workflow node ${field.nodeId} not found when applying value to ${field.path}`)
    return
  }

  const segments = field.path.split(PATH_SEPARATOR)
  let cursor: any = node

  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]
    if (!(key in cursor)) {
      cursor[key] = {}
    }
    cursor = cursor[key]
  }

  cursor[segments[segments.length - 1]] = value
}

export async function buildWorkflow(
  overrides: {
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    seed?: number
    steps?: number
  },
  config: WorkflowConfig = defaultWorkflowConfig,
) {
  const response = await fetch(config.workflowPath)
  if (!response.ok) {
    throw new Error(`Không tải được workflow (${config.workflowPath}). Vui lòng kiểm tra đường dẫn.`)
  }

  const baseWorkflow = await response.json()
  const workflow = cloneWorkflow(baseWorkflow)
  const nodes: Record<string, any> = workflow.nodes ?? workflow

  setFieldValue(nodes, config.positivePrompt, overrides.prompt)
  setFieldValue(nodes, config.negativePrompt, overrides.negativePrompt)
  setFieldValue(nodes, config.width, overrides.width)
  setFieldValue(nodes, config.height, overrides.height)
  setFieldValue(nodes, config.seed, overrides.seed)
  setFieldValue(nodes, config.samplerSteps, overrides.steps)

  return workflow
}
