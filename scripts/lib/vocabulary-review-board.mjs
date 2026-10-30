import { bindingFor, stateOf } from "./vocabulary-production.mjs";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const text = (value) => (typeof value === "string" ? value : "");
const short = (value) => text(value).slice(0, 14) || "Not recorded";
const human = (value) => text(value).replaceAll("-", " ");
const list = (values, render) =>
  Array.isArray(values) ? values.map(render).join("") : "";

function safeAsset(asset) {
  const file = asset?.path;
  if (
    typeof file !== "string" ||
    !/^assets\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:png|webp)$/i.test(file)
  )
    return null;
  if (file.split("/").some((part) => part === "." || part === ".."))
    return null;
  return file;
}

function imagePanel(record, key, label) {
  const asset = record.candidate?.[key];
  const href = safeAsset(asset);
  if (!href)
    return `<section class="image-panel"><h3>${escape(label)}</h3><p class="muted">No private image available.</p></section>`;
  return `<section class="image-panel ${key === "thumbnail" ? "thumbnail" : ""}">
    <h3>${escape(label)} <span>${escape(asset.width)} × ${escape(asset.height)}</span></h3>
    <a class="image-link" href="${escape(href)}" target="_blank" rel="noopener" aria-label="Open ${escape(label)} for ${escape(record.word)} at full resolution"><img loading="lazy" src="${escape(href)}" alt="${escape(record.word)} — ${escape(label)}" width="${escape(asset.width)}" height="${escape(asset.height)}"></a>
    <a href="${escape(href)}" target="_blank" rel="noopener">Open full resolution ↗</a>
    <p class="hash" title="${escape(asset.sha256)}">SHA ${escape(short(asset.sha256))}</p>
  </section>`;
}

function receipt(record, role, title) {
  const review = record.inspections?.[role];
  if (!review)
    return `<section class="receipt"><h3>${escape(title)}</h3><p class="muted">No explicit receipt recorded. Existing image metadata is not an approval.</p></section>`;
  const current = review.binding === bindingFor(record, role);
  return `<section class="receipt"><h3>${escape(title)} <span>${!current ? "Stale receipt — review again" : review.accepted === true ? "Accepted receipt" : "Not accepted"}</span></h3>
    <p>${escape(review.reviewerId)} · ${escape(review.inspectedAt)} · ${escape(review.basis)}</p>
    <p>${escape(review.finding)}</p>
    <p class="hash">Binding ${escape(short(review.binding))}${Array.isArray(review.sizes) ? ` · inspected ${escape(review.sizes.join(" / "))}px` : ""}</p>
  </section>`;
}

function native(record, locale, label) {
  const overlay = record.locales?.[locale];
  if (!overlay)
    return `<section class="language"><h3>${escape(label)}</h3><p class="muted">Native content missing.</p></section>`;
  return `<section class="language"><h3>${escape(label)}</h3>
    ${Object.entries(overlay.senses ?? {})
      .map(
        ([id, sense]) =>
          `<p><strong>${escape(sense.gloss)}</strong> — ${escape(sense.definition)} <small>${escape(id)}</small></p>`,
      )
      .join("")}
    <ol>${list(overlay.examples, (example) => `<li>${escape(example.en)}<br><span>${escape(example.translation)}</span></li>`)}</ol>
    <ul>${list(overlay.collocations, (item) => `<li>${escape(item.en)} — ${escape(item.translation)}</li>`)}</ul>
    <p class="tip">${escape(overlay.tip)}</p>
  </section>`;
}

function recordPanel(record, index) {
  const entry = record.entry ?? {};
  const candidate = record.candidate ?? {};
  const state = stateOf(record);
  const historical =
    text(candidate.importedFinding) || text(candidate.inspection);
  const profile = record.profile ?? {};
  return `<article data-id="${escape(record.id)}" ${index === 0 ? "" : "hidden"}>
    <div class="record-title"><div><p class="eyebrow">${escape(human(record.categoryId))} · ${escape(record.id)}</p><h2>${escape(record.word || entry.w || record.id)}</h2></div><span class="state">${escape(human(state))}</span></div>
    <p class="cue"><strong>Expected teaching cue</strong><br>${escape(candidate.expectedCue || record.expectedCue || "Not yet recorded.")}</p>
    <div class="facts"><span>Profile ${escape(profile.id || record.categoryId)} · revision ${escape(profile.revision ?? "—")}</span><span>Profile hash ${escape(short(profile.sha256))}</span><span>Generation attempts ${record.generation?.legacyUnreconciled ? "history needs reconciliation" : escape(record.generation?.attemptsUsed ?? 0)} / 3</span></div>
    ${record.held ? `<p class="hold"><strong>Held privately.</strong> ${escape(record.held.reason || record.held)}</p>` : ""}
    <section class="images" aria-label="Original, card and thumbnail inspection">${imagePanel(record, "source", "Original")}${imagePanel(record, "card", "512px card")}${imagePanel(record, "thumbnail", "120px thumbnail")}</section>
    <p class="notice">Inspect every actual original and both converted images. A contact sheet, prompt or valid hash cannot establish meaning or anatomy.</p>
    <details><summary>Literal generation prompt and template</summary><p class="pre">${escape(candidate.prompt || record.prompt || "Not recorded.")}</p><p>Reference template: ${escape(candidate.templateId || candidate.template?.id || record.template?.id || "None recorded")} · revision ${escape(candidate.template?.revision || record.template?.revision || "—")}</p></details>
    ${historical ? `<details><summary>Imported author finding — historical evidence only</summary><p>${escape(historical)}</p><p class="muted">Importing this text does not create an inspection receipt or approve the asset.</p></details>` : ""}
    <div class="receipts">${receipt(record, "author", "Author pixel inspection")}${receipt(record, "second", "Second AI pixel inspection")}${receipt(record, "lexical", "Complete language inspection")}</div>
    <h3 class="section-title">English and Persian source</h3>
    <section class="language"><p>${escape(entry.cefr)} · UK ${escape(entry.uk)} · US ${escape(entry.us)}</p>
      ${list(entry.senses, (sense) => `<p><strong>${escape(sense.pos)} ${escape(sense.en)}</strong><br><span lang="fa" dir="rtl">${escape(sense.fa)}</span><small>${escape(sense.id)}</small></p>`)}
      <ol>${list(entry.ex, (example) => `<li>${escape(example.en)}<br><span lang="fa" dir="rtl">${escape(example.fa)}</span></li>`)}</ol>
      <ul>${list(entry.col, (item) => `<li>${escape(item)}</li>`)}</ul><p class="tip" lang="fa" dir="rtl">${escape(entry.tip)}</p>
    </section>
    <div class="native-columns">${native(record, "pt-BR", "Brazilian Portuguese")}${native(record, "es-419", "Latin American Spanish")}</div>
    <p class="footnote">This board has no approval or publication controls. Record only genuine completed inspections through the queue CLI. Independent human language and qualified specialist review remain pending.</p>
  </article>`;
}

/** A private, offline, read-only review surface. It cannot create review or publication evidence. */
export function renderReviewBoard(queue) {
  const records = Array.isArray(queue.records) ? queue.records : [];
  const states = [...new Set(records.map(stateOf))].sort();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Mehrdadika production review — ${escape(queue.batchId)}</title>
<style>
:root{font:15px/1.55 system-ui,-apple-system,sans-serif;color:#20343b;background:#eef2f1;color-scheme:light}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}a{color:#215e66}button,input,select{font:inherit}button,a,input,select{outline-offset:4px}header{padding:22px 28px;background:#193c44;color:#fff}header h1{margin:2px 0 6px;font-size:24px}header p{margin:4px 0;color:#d7e6e7}header .eyebrow{color:#b8d1cf}main{display:grid;grid-template-columns:285px minmax(0,1fr);max-width:1720px;margin:auto}aside{padding:20px 16px;position:sticky;top:0;height:100vh;overflow:auto;border-right:1px solid #d6dfdc}.filters{display:grid;gap:8px;margin-bottom:14px}input,select{width:100%;border:1px solid #a8bab5;border-radius:7px;padding:9px;background:white}nav{display:grid;gap:6px}.word-button{display:block;text-align:left;width:100%;padding:10px;border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer;color:inherit}.word-button:hover{background:#e0e9e5}.word-button[aria-current=true]{background:white;border-color:#83a8a2;box-shadow:0 2px 5px #183b4210}.word-button strong,.word-button small{display:block}.word-button small{color:#526d70}#workspace{padding:24px;min-width:0}article[hidden]{display:none}.record-title{display:flex;justify-content:space-between;gap:15px;align-items:start}h2{font-size:30px;margin:0 0 12px;overflow-wrap:anywhere}h3{font-size:16px;margin:0 0 10px}h3 span{font-size:12px;font-weight:500;color:#536a70}.eyebrow{text-transform:uppercase;font-size:11px;letter-spacing:.08em;margin:0 0 5px}.state{border:1px solid #9bb9b3;border-radius:20px;padding:5px 11px;font-size:12px;white-space:nowrap;background:#e1eeea}.cue{padding:15px;border-left:4px solid #42867d;background:white;border-radius:5px}.facts{display:flex;gap:8px 18px;flex-wrap:wrap;font-size:12px;color:#526d70;margin:14px 0 20px}.images{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 150px;gap:14px;align-items:start}.image-panel{min-width:0;background:#fff;border:1px solid #d4e0da;border-radius:10px;padding:12px}.image-panel img{display:block;width:100%;height:auto;border-radius:5px}.thumbnail img{width:120px;height:120px;max-width:100%;object-fit:contain}.image-link{display:block;margin-bottom:10px}.image-panel>a:not(.image-link){font-size:12px}.hash{font:11px/1.5 ui-monospace,monospace;overflow-wrap:anywhere;color:#526d70}.notice,.hold{padding:12px;background:#fff4db;border:1px solid #e5c991;border-radius:7px;font-size:13px}.hold{background:#fff0e9}.receipts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0}.receipt,.language{background:#fff;padding:15px;border:1px solid #d4e0da;border-radius:8px;overflow-wrap:anywhere}.receipt p{font-size:12px}.section-title{margin:26px 0 12px}.language p{margin:5px 0 15px}.language li{margin-bottom:10px}.language small{display:block;color:#6c7c7c;font:11px ui-monospace,monospace;margin-top:4px}.native-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0}.tip{border-top:1px solid #d6dfdc;padding-top:12px}.muted,.footnote{color:#617476;font-size:12px}.pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.footnote{margin-top:26px}details{background:#e4ece8;border-radius:7px;padding:12px;margin:12px 0}summary{cursor:pointer;font-weight:600}#empty{padding:30px;background:white;border-radius:8px}.toolbar{display:flex;gap:10px;margin:0 0 20px;align-items:center}.toolbar button{border:1px solid #9bb9b3;background:white;padding:6px 12px;border-radius:6px;cursor:pointer}#position{font-size:12px;color:#526d70}#match-count{font-size:12px;color:#526d70}
@media(max-width:1100px){.images{grid-template-columns:repeat(2,minmax(0,1fr))}.thumbnail{grid-column:1/-1}.receipts{grid-template-columns:1fr}}@media(max-width:720px){header{padding:18px}main{display:block}aside{position:static;height:auto;border-right:0;border-bottom:1px solid #d6dfdc}nav{max-height:180px;overflow:auto}.filters{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.filters label:first-child{grid-column:1/-1}#workspace{padding:15px}.images,.native-columns{grid-template-columns:1fr}.thumbnail{grid-column:auto}.record-title{display:block}.state{display:inline-block;margin-bottom:8px}h2{font-size:27px}}
</style></head><body><header><p class="eyebrow">Private production workspace · ${escape(queue.batchId)}</p><h1>Mehrdadika image review queue</h1><p>AI editorial previews. Independent human language and specialist review are pending. This page cannot approve or publish content.</p></header>
<main><aside><div class="filters"><label>Find a word<input id="search" type="search" placeholder="Word, sense or category" autocomplete="off"></label><label>State<select id="state"><option value="">All states</option>${states.map((s) => `<option value="${escape(s)}">${escape(human(s))}</option>`).join("")}</select></label><label>Category<select id="category"><option value="">All categories</option>${[
    ...new Set(records.map((r) => r.categoryId)),
  ]
    .sort()
    .map((c) => `<option value="${escape(c)}">${escape(human(c))}</option>`)
    .join(
      "",
    )}</select></label></div><p id="match-count" aria-live="polite"></p><nav aria-label="Words in the private queue">${records.map((r, i) => `<button class="word-button" data-word="${escape(r.id)}" data-category="${escape(r.categoryId)}" data-state="${escape(stateOf(r))}" data-search="${escape([r.word, r.id, r.categoryId, ...(r.entry?.senses ?? []).map((s) => s.en)].join(" ").toLocaleLowerCase())}" aria-current="${i === 0 ? "true" : "false"}"><strong>${escape(r.word || r.id)}</strong><small>${escape(human(stateOf(r)))}</small></button>`).join("")}</nav></aside><section id="workspace"><div class="toolbar"><button id="previous" type="button">← Previous</button><button id="next" type="button">Next →</button><span id="position" aria-live="polite"></span></div><p id="empty" ${records.length ? "hidden" : ""}>No matching words. Adjust the filters or import a batch.</p>${records.map(recordPanel).join("")}</section></main>
<script>
(()=>{const buttons=[...document.querySelectorAll('[data-word]')],panels=[...document.querySelectorAll('article[data-id]')],search=document.querySelector('#search'),state=document.querySelector('#state'),category=document.querySelector('#category');let selected='';const visible=()=>buttons.filter(b=>!b.hidden);function show(id){const pool=visible();const button=pool.find(b=>b.dataset.word===id)||pool[0];selected=button?.dataset.word||'';panels.forEach(p=>p.hidden=p.dataset.id!==selected);buttons.forEach(b=>b.setAttribute('aria-current',String(b.dataset.word===selected)));document.querySelector('#empty').hidden=Boolean(button);document.querySelector('#position').textContent=button?(pool.indexOf(button)+1)+' / '+pool.length:'';document.querySelector('#previous').disabled=!button||pool.indexOf(button)===0;document.querySelector('#next').disabled=!button||pool.indexOf(button)===pool.length-1;if(button)history.replaceState(null,'','#'+encodeURIComponent(selected));}function filter(){const q=search.value.normalize('NFKC').toLocaleLowerCase();buttons.forEach(b=>b.hidden=Boolean((q&&!b.dataset.search.normalize('NFKC').includes(q))||(state.value&&b.dataset.state!==state.value)||(category.value&&b.dataset.category!==category.value)));document.querySelector('#match-count').textContent=visible().length+' of '+buttons.length+' words';show(selected)}buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.word)));[search,state,category].forEach(el=>el.addEventListener(el===search?'input':'change',filter));document.querySelector('#previous').addEventListener('click',()=>{const p=visible(),i=p.findIndex(b=>b.dataset.word===selected);if(i>0)show(p[i-1].dataset.word)});document.querySelector('#next').addEventListener('click',()=>{const p=visible(),i=p.findIndex(b=>b.dataset.word===selected);if(i>=0&&i<p.length-1)show(p[i+1].dataset.word)});try{selected=decodeURIComponent(location.hash.slice(1))}catch{}filter()})();
</script></body></html>`;
}
