import { describe, it, expect } from 'vitest';
import {
  nextVersionForTask,
  buildNewVersion,
  withActivated,
  activeVersion,
  groupByTask,
} from './versioning';
import type { Prompt } from '@/lib/contracts/types';

const base: Prompt = {
  id: 'trip.generate@v1',
  task: 'trip.generate',
  title: 'Gen',
  body: 'v1',
  model: 'claude-sonnet',
  version: 1,
  active: true,
  updatedAt: '2026-01-01T00:00:00Z',
  updatedBy: 'a@yaycay.ai',
};

describe('nextVersionForTask', () => {
  it('starts at 1 for an unseen task', () => {
    expect(nextVersionForTask([], 'new.task')).toBe(1);
    expect(nextVersionForTask([base], 'other.task')).toBe(1);
  });

  it('is max + 1 for an existing task', () => {
    const v2 = { ...base, id: 'trip.generate@v2', version: 2, active: false };
    expect(nextVersionForTask([base, v2], 'trip.generate')).toBe(3);
  });
});

describe('buildNewVersion', () => {
  it('builds the next version, inactive, with a deterministic id', () => {
    const created = buildNewVersion([base], {
      task: 'trip.generate',
      title: 'Gen',
      body: 'v2 body',
      model: 'claude-opus',
      by: 'b@yaycay.ai',
      at: '2026-02-02T00:00:00Z',
    });
    expect(created.version).toBe(2);
    expect(created.id).toBe('trip.generate@v2');
    expect(created.active).toBe(false);
    expect(created.model).toBe('claude-opus');
    expect(created.updatedBy).toBe('b@yaycay.ai');
  });

  it('does not mutate existing versions', () => {
    const before = JSON.stringify(base);
    buildNewVersion([base], {
      task: 'trip.generate',
      title: 'x',
      body: 'y',
      model: 'gemini',
      by: 'c@yaycay.ai',
    });
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('withActivated', () => {
  const v2 = { ...base, id: 'trip.generate@v2', version: 2, active: false };

  it('activates the target and deactivates siblings of the same task', () => {
    const out = withActivated([base, v2], 'trip.generate@v2');
    expect(out.find((p) => p.id === 'trip.generate@v2')?.active).toBe(true);
    expect(out.find((p) => p.id === 'trip.generate@v1')?.active).toBe(false);
    expect(activeVersion(out, 'trip.generate')?.version).toBe(2);
  });

  it('leaves other tasks untouched', () => {
    const ingest = { ...base, id: 'ingest@v1', task: 'ingest', active: true };
    const out = withActivated([base, v2, ingest], 'trip.generate@v2');
    expect(out.find((p) => p.id === 'ingest@v1')?.active).toBe(true);
  });

  it('is a no-op for an unknown id', () => {
    expect(withActivated([base], 'nope')).toEqual([base]);
  });
});

describe('groupByTask', () => {
  it('groups and sorts versions newest first', () => {
    const v2 = { ...base, id: 'trip.generate@v2', version: 2, active: false };
    const groups = groupByTask([base, v2]);
    expect(groups).toHaveLength(1);
    expect(groups[0].task).toBe('trip.generate');
    expect(groups[0].versions.map((v) => v.version)).toEqual([2, 1]);
  });
});
