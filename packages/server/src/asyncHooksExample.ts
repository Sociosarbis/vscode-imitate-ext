import { hrtime } from 'node:process'
import { createHook } from 'node:async_hooks'

const cache = new Map<number, { type: string, start?: [number, number], stack?: string }>()

createHook({
  init(asyncId, type) {
    if (type !== 'TickObject') {
      cache.set(asyncId, { type, stack: parseStack(new Error('before-async-callback').stack) })
    }
  },
  before(asyncId) {
    const cached = cache.get(asyncId)
    if (!cached) {
      return
    }
    cache.set(asyncId, {
      ...cached,
      start: hrtime(),
    })
  },
  after(asyncId) {
    const cached = cache.get(asyncId)
    if (!cached) {
      return
    }
    cache.delete(asyncId)
    if (!cached.start) {
      return
    }
    const diff = hrtime(cached.start)
    const diffNs = diff[0] * 1e9 + diff[1]
    // eslint-disable-next-line no-console
    console.log({ asyncId, stack: cached.stack, diffNs, type: cached.type })
  },
  destroy(asyncId) {
    cache.delete(asyncId)
  },
}).enable()

function doWork() {
  for (let i = 0; i < 1e9; i++) {
    //
  }
}

async function foo() {
  await new Promise((res) => {
    setTimeout(() => {
      doWork()
      res(undefined)
    })
  })
  doWork()
}

async function main() {
  await foo()
  await foo()
}

const nodeInternalRegExp = /\(node:internal\S+\)$/

function parseStack(stack?: string) {
  if (!stack) {
    return
  }
  const frames = stack.split('\n')
  for (let i = 2; i < frames.length; i++) {
    if (!nodeInternalRegExp.test(frames[i])) {
      return [frames[0], ...frames.slice(i)].join('\n')
    }
  }
}

main()
