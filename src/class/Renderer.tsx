import { Renderer } from 'marked';

export class CommonRenderer extends Renderer {
  heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): string {
    let cls = '';
    switch (level) {
      case 1:
        cls = 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl';
        break;
      case 2:
        cls =
          'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0';
        break;
      case 3:
        cls = 'scroll-m-20 text-2xl font-semibold tracking-tight';
        break;
      case 4:
        cls = 'scroll-m-20 text-xl font-semibold tracking-tight';
    }
    return `<h${level} class='${cls}'>${text}</h${level}>`;
  }

  paragraph(text: string): string {
    return `<p class='leading-7 text-base [&:not(:first-child)]:mt-6'>${text}</p>`;
  }

  blockquote(quote: string): string {
    return `
        <blockquote class="mt-6 border-l-2 pl-6 italic">
      ${quote}
    </blockquote>`;
  }

  list(body: string, ordered: boolean): string {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag} class="my-3 ml-6 list-disc [&>li]:mt-2 text-base">${body}</${tag}>`;
  }

  codespan(code: string): string {
    return `<code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">${code}</code>`;
  }
}
