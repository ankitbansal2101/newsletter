import type { Flourish } from "./flourishes";
import type { DraftSection, SectionBlock } from "../templates/types";

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function patchSections(
  sections: DraftSection[],
  sectionId: string,
  patch: Partial<DraftSection>,
): DraftSection[] {
  return sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section));
}

export function patchBlockInSections(
  sections: DraftSection[],
  sectionId: string,
  blockIndex: number,
  block: SectionBlock,
): DraftSection[] {
  return sections.map((section) => {
    if (section.id !== sectionId || section.locked) return section;
    const blocks = [...(section.blocks || [])];
    if (blockIndex < 0 || blockIndex >= blocks.length || blocks[blockIndex]?.locked) return section;
    blocks[blockIndex] = block;
    return { ...section, blocks };
  });
}

export function moveBlockInSections(
  sections: DraftSection[],
  sectionId: string,
  from: number,
  to: number,
): DraftSection[] {
  return sections.map((section) => {
    if (section.id !== sectionId || section.locked) return section;
    const blocks = moveItem(section.blocks || [], from, to);
    return { ...section, blocks };
  });
}

export function toggleSectionLock(sections: DraftSection[], sectionId: string): DraftSection[] {
  return sections.map((section) => (
    section.id === sectionId ? { ...section, locked: !section.locked } : section
  ));
}

export function mergeLockedSections(previous: DraftSection[], next: DraftSection[]): DraftSection[] {
  const locked = new Map(previous.filter((section) => section.locked).map((section) => [section.id, section]));
  if (!locked.size) return next;
  const used = new Set<string>();
  const merged = next.map((section) => {
    const keep = locked.get(section.id);
    if (!keep) return section;
    used.add(section.id);
    return keep;
  });
  for (const [id, section] of locked) {
    if (!used.has(id)) merged.push(section);
  }
  return merged;
}

export function patchFlourishList(flourishes: Flourish[], next: Flourish): Flourish[] {
  return flourishes.map((item) => (item.id === next.id ? next : item));
}

export function lockedSectionIds(sections: DraftSection[]): string[] {
  return sections.filter((section) => section.locked).map((section) => section.id);
}
