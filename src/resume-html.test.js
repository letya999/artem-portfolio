import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resumeHtml} from './resume-html.js';

test('PDF formatting preserves the resume Markdown structures and escapes literal content',()=>{
 assert.equal(resumeHtml('# Артем\n\nRole & scope\n\n## Опыт\n\n### Twinby\n\n#### Результаты\n\n- В 2,5 раза меньше\n- [Профиль](https://example.com/?a=1&b=2)\n\n<script>alert("x")</script>'),
  '<h1>Артем</h1>\n<p>Role &amp; scope</p>\n<h2>Опыт</h2>\n<h3>Twinby</h3>\n<h4>Результаты</h4>\n<ul><li>В 2,5 раза меньше</li><li><a href="https://example.com/?a=1&amp;b=2">Профиль</a></li></ul>\n<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
 assert.equal(resumeHtml('[link](javascript:alert(1))'),'<p>[link](javascript:alert(1))</p>');
});
