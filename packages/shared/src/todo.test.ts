import { describe, it, expect } from 'vitest';
import { todoInputSchema, TITLE_MAX } from './todo';

describe('todoInputSchema', () => {
  it('trims and defaults description', () => {
    expect(todoInputSchema.parse({ title: '  Buy milk ' })).toEqual({
      title: 'Buy milk',
      description: '',
    });
  });
  it('rejects a blank title', () => {
    expect(todoInputSchema.safeParse({ title: '   ' }).success).toBe(false);
  });
  it('rejects a title made only of punctuation or symbols', () => {
    for (const title of ['!!!', '---', '@#$%', '. . .']) {
      expect(todoInputSchema.safeParse({ title }).success).toBe(false);
    }
  });
  it('accepts special characters alongside letters or numbers, in any language', () => {
    for (const title of ['Buy milk!', 'C++', '#1', '買い物', 'café ☕']) {
      expect(todoInputSchema.safeParse({ title }).success).toBe(true);
    }
  });
  it('reports only "required" for a blank title', () => {
    const result = todoInputSchema.safeParse({ title: '  ' });
    expect(result.error?.issues.map((i) => i.message)).toEqual(['Title is required']);
  });
  it('rejects an over-long title', () => {
    expect(todoInputSchema.safeParse({ title: 'x'.repeat(TITLE_MAX + 1) }).success).toBe(false);
  });
});
