// @vitest-environment jsdom
/**
 * ui-redteam browser half on a real cordis Context with the real SlotRegistry
 * and LocaleRuntime: the plugin registers the sidebar-foot trigger and the
 * shell.overlay console with one SHARED store handle, declares
 * redteam.section, and registers the six built-in sections (each mounting
 * the same store) with locale-following label thunks. Disposal rides the
 * plugin fiber (HMR safety) and disposes the data-pump interval with it.
 * The node half is exercised over the same Context.
 */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'

/** Live fibers, disposed after each spec so the pump interval never leaks. */
let fibers: { dispose: () => Promise<unknown> }[] = []
afterEach(async () => {
  await Promise.all(fibers.map(fiber => fiber.dispose()))
  fibers = []
})

/** Boot the plugin over the real slot/locale services with fake declarations for the two shipped seats. */
async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  // Production declarations live with ui-sidebar (footer action) and
  // ui-layout (shell.overlay); the fake root entry declares both seats.
  ctx.slots.register({
    name: 'root',
    children: {
      'sidebar.footer.action': { kind: 'list', scope: 'root' },
      'shell.overlay': { kind: 'list', scope: 'root' },
    },
  } as never, (() => null) as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  fibers.push(fiber)
  return { ctx, fiber }
}

describe('ui-redteam browser plugin', () => {
  it('registers the trigger, the console, and the six built-in sections', async () => {
    const { ctx } = await bench()
    expect(ctx.slots.entries('sidebar.footer.action')).toMatchObject([{ options: { id: 'redteam', order: 20 } }])
    const consoleEntry = ctx.slots.entries('shell.overlay')[0]
    expect(consoleEntry?.options).toMatchObject({ id: 'redteam.console', order: 20 })
    expect(consoleEntry?.locale).toBe('redteam')
    expect(consoleEntry?.store).toBeTypeOf('object')
    expect(ctx.slots.entries('redteam.section').map(entry => entry.options.id)).toEqual([
      'dashboard', 'targets', 'jobs', 'sessions', 'credentials', 'reports',
    ])
  })

  it('mounts the trigger, console, and every section on ONE shared store handle', async () => {
    const { ctx } = await bench()
    const trigger = ctx.slots.entries('sidebar.footer.action')[0]
    const consoleEntry = ctx.slots.entries('shell.overlay')[0]
    expect(trigger?.store).toBeDefined()
    expect(trigger?.store).toBe(consoleEntry?.store)
    for (const entry of ctx.slots.entries('redteam.section')) {
      expect(entry.store).toBe(trigger?.store)
    }
  })

  it('section labels resolve through locale-following thunks', async () => {
    const { ctx } = await bench()
    const rows = ctx.slots.entries('redteam.section')
      .map(entry => resolveSlotLabel(entry.options.label))
    expect(rows.every(label => typeof label === 'string' && label.length > 0)).toBe(true)
    expect(new Set(rows).size).toBe(rows.length)
  })

  it('drops every contribution when the plugin fiber unloads (HMR safety)', async () => {
    const b = await bench()
    expect(b.ctx.slots.entries('sidebar.footer.action')).toHaveLength(1)
    expect(b.ctx.slots.entries('shell.overlay')).toHaveLength(1)
    expect(b.ctx.slots.entries('redteam.section')).toHaveLength(6)
    await b.fiber.dispose()
    expect(b.ctx.slots.entries('sidebar.footer.action')).toHaveLength(0)
    expect(b.ctx.slots.entries('shell.overlay')).toHaveLength(0)
    // The declaration collapsed with its declaring entry.
    expect(b.ctx.slots.entries('redteam.section')).toHaveLength(0)
  })
})

describe('ui-redteam node half', () => {
  it('the node apply mounts its host routes', () => {
    const fakeCtx = new Context() as unknown as { webServer: { register: (route: unknown) => () => void } }
    fakeCtx.webServer = { register: () => () => {} }
    expect(() => { nodeApply(fakeCtx as unknown as Parameters<typeof nodeApply>[0]) }).not.toThrow()
  })
})
