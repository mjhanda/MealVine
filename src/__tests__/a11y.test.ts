/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { colors, proteinMeta } from '../theme';

// Static accessibility guards: these catch regressions that are easy to miss in review.

const SRC = path.join(__dirname, '..');
const tsxFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === '__tests__' ? [] : tsxFiles(path.join(dir, e.name));
    return e.name.endsWith('.tsx') ? [path.join(dir, e.name)] : [];
  });

// Returns the attribute text of every <Pressable ...> opening tag (brace-aware, so `() =>` is fine).
function pressableTags(source: string): { line: number; attrs: string }[] {
  const tags: { line: number; attrs: string }[] = [];
  let i = 0;
  while ((i = source.indexOf('<Pressable', i)) !== -1) {
    let depth = 0;
    let j = i + '<Pressable'.length;
    for (; j < source.length; j++) {
      if (source[j] === '{') depth++;
      else if (source[j] === '}') depth--;
      else if (source[j] === '>' && depth === 0) break;
    }
    tags.push({ line: source.slice(0, i).split('\n').length, attrs: source.slice(i, j) });
    i = j;
  }
  return tags;
}

describe('every Pressable is announced to screen readers', () => {
  const missing = tsxFiles(SRC).flatMap((file) =>
    pressableTags(fs.readFileSync(file, 'utf8'))
      .filter((t) => !/accessibilityRole/.test(t.attrs))
      .map((t) => `${path.relative(SRC, file)}:${t.line}`)
  );
  it('declares accessibilityRole', () => expect(missing).toEqual([]));
});

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('text contrast meets WCAG AA (4.5:1)', () => {
  const pairs: [string, string, string][] = [
    ['ink', 'cream', 'body text'],
    ['inkSoft', 'cream', 'secondary text'],
    ['inkSoft', 'card', 'secondary text on cards'],
    ['goldText', 'cream', 'eyebrows'],
    ['goldText', 'card', 'eyebrows on cards'],
    ['sageText', 'cream', 'in-plan note'],
    ['rustText', 'cream', 'warnings, destructive actions'],
    ['rustText', 'card', 'warnings on cards'],
    ['forest', 'cream', 'titles, links'],
    ['forest', 'sageLight', 'active chips'],
    ['cream', 'forest', 'undo bar'],
    ['cream', 'rustText', "timer 'time's up'"],
    ['ink', 'goldLight', 'timer, notes'],
  ];
  it.each(pairs)('%s on %s (%s)', (fg, bg) => {
    expect(contrast(colors[fg as keyof typeof colors], colors[bg as keyof typeof colors])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(Object.entries(proteinMeta))('protein tag %s', (_name, meta) => {
    expect(contrast(meta.color, meta.bg)).toBeGreaterThanOrEqual(4.5);
  });
});
