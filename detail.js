const id=new URLSearchParams(location.search).get('id');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function load(){
  const r=await apiFetch('api/works/'+encodeURIComponent(id));
  if(!r.ok){detail.innerHTML='<div class="empty">作品不存在</div>';return}
  const d=await r.json();
  // 作品详情页分享：标题=作品标题，描述=作品简介纯文本，图片=作品主图。
  const sharePlainText=v=>{const box=document.createElement('div');box.innerHTML=String(v??'');return (box.textContent||box.innerText||'').replace(/\s+/g,' ').trim()};
  const setShareMeta=(selector,attr,value)=>{let el=document.head.querySelector(selector);if(!el){el=document.createElement('meta');Object.entries(attr).forEach(([k,x])=>el.setAttribute(k,x));document.head.appendChild(el)}el.setAttribute('content',value||'')};
  const shareTitle=String(d.name||'').trim();
  const shareDesc=sharePlainText(d.description||'');
  const pageTitle=document.querySelector('title');
  if(pageTitle) pageTitle.textContent=shareTitle;
  const shareImage=resolveAssetUrl(d.main_image_full||d.main_image||(d.images?.find(x=>x.is_main)?.url||d.images?.[0]?.url||''));
  setShareMeta('meta[property=\"og:title\"]',{property:'og:title'},shareTitle);
  setShareMeta('meta[property=\"og:description\"]',{property:'og:description'},shareDesc);
  setShareMeta('meta[property=\"og:image\"]',{property:'og:image'},shareImage);
  setShareMeta('meta[property=\"og:type\"]',{property:'og:type'},'article');
  setShareMeta('meta[name=\"twitter:title\"]',{name:'twitter:title'},shareTitle);
  setShareMeta('meta[name=\"twitter:description\"]',{name:'twitter:description'},shareDesc);
  setShareMeta('meta[name=\"twitter:image\"]',{name:'twitter:image'},shareImage);
  // 详情页以作品信息为唯一分享来源；不要被公共站点信息覆盖。
  const main=resolveAssetUrl(d.main_image_full||d.main_image||(d.images?.[0]?.url||''));
  const mainBlock=main?`<div class="detail-main-image"><img id="mainImg" src="${esc(main)}" alt="${esc(d.name)}"></div>`:'';const validImages=(d.images||[]).filter(x=>x.thumb||x.url);const thumbs=validImages.length?`<div class="thumbs">${validImages.map(x=>`<img class="${x.is_main?'active':''}" src="${esc(resolveAssetUrl(x.thumb||x.url))}" alt="" data-full="${esc(resolveAssetUrl(x.url||x.thumb))}" onclick="showImg(this.dataset.full,this)">`).join('')}</div>`:'';detail.innerHTML=`<div class="detail-top"><div class="eyebrow detail-breadcrumb"><a href="collections.html" class="detail-breadcrumb-link">全部作品</a><span aria-hidden="true"> / </span><span>作品详情</span></div><h1>${esc(d.name)}</h1></div><div class="detail-layout"><div>${mainBlock}${thumbs}</div><aside><div class="meta"><div class="meta-row"><b>作品分类</b><span>${esc(d.category||'')}${d.subcategory?' / '+esc(d.subcategory):''}</span></div><div class="meta-row"><b>作品编号</b><span>${esc(d.work_no||'')}</span></div><div class="meta-row"><b>创作时间</b><span>${esc(d.creation_time||'')}</span></div><div class="meta-row"><b>尺寸</b><span>${esc(d.size||'')}</span></div></div><div class="description">${d.description||''}</div></aside></div>`
}
function showImg(u,el){const img=document.getElementById('mainImg');if(!img||!u)return;img.src=resolveAssetUrl(u);document.querySelectorAll('.thumbs img').forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active')}
load();
