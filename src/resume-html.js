const escape=text=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function inline(text){
 let html='',offset=0;
 for(const match of text.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)){
  html+=escape(text.slice(offset,match.index))+`<a href="${escape(match[2])}">${escape(match[1])}</a>`;
  offset=match.index+match[0].length;
 }
 return html+escape(text.slice(offset));
}
// resumeMarkdown emits only headings, paragraphs, bullet lists and HTTPS links.
export function resumeHtml(markdown){
 return markdown.trim().split(/\n{2,}/).map(block=>{
  const heading=/^(#{1,4}) (.+)$/.exec(block);
  if(heading)return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
  const lines=block.split('\n');
  if(lines.every(line=>line.startsWith('- ')))return `<ul>${lines.map(line=>`<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
  return `<p>${inline(block).replaceAll('\n','<br>')}</p>`;
 }).join('\n');
}
