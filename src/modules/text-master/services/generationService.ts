import { chapterPrompt } from '../prompts/chapter.prompt';
import { documentPrompt } from '../prompts/document.prompt';
import { outlinePrompt } from '../prompts/outline.prompt';
import { reviewPrompt } from '../prompts/review.prompt';
import { rewritePrompt } from '../prompts/rewrite.prompt';

export async function generateOutline(input: string): Promise<string> {
  return `${outlinePrompt}\n\n${input}`.trim();
}

export async function generateChapter(input: string): Promise<string> {
  return `${chapterPrompt}\n\n${input}`.trim();
}

export async function generateDocument(input: string): Promise<string> {
  return `${documentPrompt}\n\n${input}`.trim();
}

export async function rewriteText(input: string): Promise<string> {
  return `${rewritePrompt}\n\n${input}`.trim();
}

export async function reviewDocument(input: string): Promise<string> {
  return `${reviewPrompt}\n\n${input}`.trim();
}
