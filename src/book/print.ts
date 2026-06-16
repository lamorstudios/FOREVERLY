import type { FamilyBook, BookBlock } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderBlock(b: BookBlock): string {
  switch (b.type) {
    case 'paragraph':
      return `<p>${esc(b.text)}</p>`;
    case 'quote':
      return `<blockquote>„${esc(b.text)}"${b.attribution ? `<cite>— ${esc(b.attribution)}</cite>` : ''}</blockquote>`;
    case 'photo':
      return `<figure><img src="${b.path}" alt=""/>${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    case 'photoGrid':
      return `<div class="grid">${b.photos
        .map((p) => `<figure><img src="${p.path}" alt=""/>${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`)
        .join('')}</div>`;
    case 'person':
      return `<div class="person">${b.avatarPath ? `<img src="${b.avatarPath}" alt=""/>` : ''}<div><h3>${esc(b.name)}${b.years ? ` <span class="years">${esc(b.years)}</span>` : ''}</h3>${b.bio ? `<p>${esc(b.bio)}</p>` : ''}</div></div>`;
    case 'timeline':
      return `<ul class="timeline">${b.entries.map((e) => `<li><b>${e.year}</b> — ${esc(e.label)}</li>`).join('')}</ul>`;
    case 'audio':
      return `<p class="audio">🎙️ ${esc(b.title)}${b.personName ? ` – ${esc(b.personName)}` : ''}</p>`;
    case 'note':
      return `<p class="note">${esc(b.text)}</p>`;
  }
}

/** Erzeugt eine hochwertige, druckfertige HTML-Seite des Familienbuchs. */
export function buildPrintableHtml(book: FamilyBook): string {
  const chapters = book.chapters
    .map(
      (c) =>
        `<section class="chapter"><h2>${esc(c.title)}</h2>${c.blocks.map(renderBlock).join('')}</section>`,
    )
    .join('');

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/>
<title>${esc(book.title)}</title>
<style>
  @page { margin: 24mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #3A2F24; background: #FBF6EE; margin: 0; line-height: 1.6; }
  .cover { min-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; page-break-after: always; }
  .cover img { width: 70%; max-width: 480px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 8px 30px rgba(58,47,36,.18); }
  .cover h1 { font-size: 44px; margin: 0 0 8px; color: #8A5F35; }
  .cover .sub { font-size: 22px; color: #6F6253; font-style: italic; }
  .chapter { page-break-before: always; padding: 0 8px 24px; }
  .chapter h2 { font-size: 30px; color: #B07D4B; border-bottom: 2px solid #E3D7C4; padding-bottom: 8px; }
  p { font-size: 17px; }
  blockquote { border-left: 4px solid #C8A24A; margin: 18px 0; padding: 8px 18px; font-size: 21px; font-style: italic; color: #6F6253; }
  blockquote cite { display: block; font-size: 15px; font-style: normal; margin-top: 6px; color: #9C8F7E; }
  figure { margin: 16px 0; text-align: center; }
  figure img { max-width: 100%; border-radius: 10px; }
  figcaption { font-size: 14px; color: #9C8F7E; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .person { display: flex; gap: 16px; align-items: center; margin: 14px 0; }
  .person img { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; }
  .person h3 { margin: 0 0 4px; }
  .years { color: #9C8F7E; font-weight: normal; font-size: 15px; }
  .timeline { list-style: none; padding: 0; }
  .timeline li { padding: 6px 0; border-bottom: 1px solid #EDE4D5; }
  .note { color: #9C8F7E; font-style: italic; }
</style></head>
<body>
  <div class="cover">
    ${book.coverPhotoPath ? `<img src="${book.coverPhotoPath}" alt=""/>` : ''}
    <h1>${esc(book.title)}</h1>
    ${book.subtitle ? `<div class="sub">${esc(book.subtitle)}</div>` : ''}
  </div>
  ${chapters}
</body></html>`;
}
