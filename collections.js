let state={page:1,size:20,keyword:'',category:'',subcategory:'',period:''};let cats=[];let timeRange={min:new Date().getFullYear(),max:new Date().getFullYear()};
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function buttons(arr,active){return arr.map(x=>`<button type="button" class="${x===active?'active':''}" data-v="${esc(x)}">${esc(x||'全部')}</button>`).join('')}
function makePeriods(min,max){if(!Number.isFinite(min)||!Number.isFinite(max)||min>max)return [];const out=[];let start=min;while(start<=max){const end=Math.min(Math.floor(start/10)*10+9,max);out.push(`${start}-${end}`);start=end+1}return out}
/** 页码窗口：最多10个，当前页 n 时显示 [n-4, n+5] 并夹在 [1, total] */
function pageWindow(current, total, maxShow=10){
  if(!total||total<1) return [];
  current=Math.max(1, Math.min(current, total));
  if(total<=maxShow) return Array.from({length:total},(_,i)=>i+1);
  let start=current-4, end=current+5;
  if(start<1){end=Math.min(total, end+(1-start)); start=1}
  if(end>total){start=Math.max(1, start-(end-total)); end=total}
  // ensure at most maxShow
  while(end-start+1>maxShow){ if(current-start>end-current) start++; else end--; }
  return Array.from({length:end-start+1},(_,i)=>start+i);
}
function renderPager(current, total, onClickExpr){
  const pages=pageWindow(current, total);
  return pages.map(p=>`<button type="button" class="${p===current?'active':''}" onclick="${onClickExpr.replace('__P__', String(p))}">${p}</button>`).join('');
}
async function init(){try{const [c,r]=await Promise.all([apiFetch('api/categories').then(x=>x.json()),apiFetch('api/creation-time-range').then(x=>x.json())]);cats=c;timeRange={min:Number(r.min_year),max:Number(r.max_year)};renderFilters();load()}catch(e){document.getElementById('grid').innerHTML='<div class="empty">暂时无法读取作品</div>'}}
function renderFilters(){
  catFilter.innerHTML=buttons(['',...cats.map(x=>x.name)],state.category);
  const selected=cats.find(x=>x.name===state.category),subs=selected?.subs||[];
  const subRow=document.getElementById('subFilterRow');
  if(subs.length){subRow.hidden=false;subFilter.innerHTML=buttons(['',...subs],state.subcategory)}else{subRow.hidden=true;subFilter.innerHTML='';state.subcategory='';}
  const periods=makePeriods(timeRange.min,timeRange.max);
  periodFilter.innerHTML=buttons(['',...periods],state.period);
  document.querySelectorAll('.collection-page .filter button').forEach(b=>b.onclick=()=>{const box=b.parentElement.id,v=b.dataset.v;if(box==='catFilter'){state.category=v;state.subcategory=''}else if(box==='subFilter'){state.subcategory=v}else if(box==='periodFilter'){state.period=v}state.page=1;renderFilters();load()});
}
function load(){const q=new URLSearchParams({page:state.page,size:state.size,keyword:state.keyword,category:state.category,subcategory:state.subcategory,period:state.period});apiFetch('api/works?'+q).then(r=>r.json()).then(d=>{count.textContent=`共 ${d.total} 件作品`;const hint=document.getElementById('pageSizeHint');if(hint)hint.textContent=`每页 ${state.size} 件`;grid.innerHTML=d.items.length?d.items.map(x=>{const img=(x.thumb||x.main_image)?`<div class="pic"><img src="${esc(resolveAssetUrl(x.thumb||x.main_image))}" loading="lazy" alt="${esc(x.name||'')}"></div>`:'';return `<article class="work-card" onclick="location='detail.html?id=${x.id}'">${img}<h3>${esc(x.name)}</h3><p>${esc(x.category||'')}${x.subcategory?' · '+esc(x.subcategory):''}</p><p>${esc(x.creation_time||'')}</p></article>`}).join(''):'<div class="empty">暂无符合条件的作品</div>';pages.innerHTML=renderPager(d.page,d.pages,'state.page=__P__;load()')}).catch(()=>{grid.innerHTML='<div class="empty">暂时无法读取作品</div>'})}
searchForm.onsubmit=e=>{e.preventDefault();state.keyword=keyword.value.trim();state.page=1;load()};init();
