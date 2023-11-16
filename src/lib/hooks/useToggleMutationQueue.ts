import {useState} from 'react'

type Task<TServerState> = {
  isOn: boolean
  resolve: (serverState: TServerState) => void
  reject: (e: unknown) => void
}

type TaskQueue<TServerState> = {
  activeTask: Task<TServerState> | null
  queuedTask: Task<TServerState> | null
}

export function useToggleMutationQueue<TServerState>({
  initialState,
  runMutation,
  onSuccess,
}: {
  initialState: TServerState
  runMutation: (
    prevState: TServerState,
    nextIsOn: boolean,
  ) => Promise<TServerState>
  onSuccess: (finalState: TServerState) => void
}) {
  // We use the queue as a mutable object.
  // This is safe becuase it is not used for rendering.
  const [queue] = useState<TaskQueue<TServerState>>({
    activeTask: null,
    queuedTask: null,
  })

  async function processQueue() {
    if (queue.activeTask) {
      // There is another active processQueue call iterating over tasks.
      // It will handle any newly added tasks, so we should exit early.
      return
    }
    // To avoid relying on the rendered state, capture it once at the start.
    // From that point on, and until the queue is drained, we'll use the real server state.
    let confirmedState: TServerState = initialState
    try {
      while (queue.queuedTask) {
        const prevTask = queue.activeTask
        const nextTask = queue.queuedTask
        queue.activeTask = nextTask
        queue.queuedTask = null
        if (prevTask?.isOn === nextTask.isOn) {
          // Skip multiple requests to update to the same value in a row.
          continue
        }
        try {
          // The state received from the server feeds into the next task.
          // This lets us queue deletions of not-yet-created resources.
          confirmedState = await runMutation(confirmedState, nextTask.isOn)
          nextTask.resolve(confirmedState)
        } catch (e) {
          nextTask.reject(e)
        }
      }
    } finally {
      onSuccess(confirmedState)
      queue.activeTask = null
      queue.queuedTask = null
    }
  }

  function queueToggle(isOn: boolean): Promise<TServerState> {
    return new Promise((resolve, reject) => {
      // This is a toggle, so the next queued value can safely replace the queued one.
      queue.queuedTask = {isOn, resolve, reject}
      processQueue()
    })
  }

  return queueToggle
}
