let cats=[];
let workEditor=null,bioEditor=null,pendingFiles=[];
const login=document.getElementById('login'), app=document.getElementById('app'), view=document.getElementById('view');

async function loadAdminBrand(){
  const el=document.getElementById('adminSiteName');
  if(!el) return;
  try{
    const r=await apiFetch('api/site');
    if(!r.ok) return;
    const d=await r.json();
    const name=String(d?.site_name||'').trim();
    el.textContent=name;
    el.hidden=!name;
  }catch(e){
    el.textContent='';
    el.hidden=true;
  }
}
loadAdminBrand();

function openImageLightbox(url){
  if(!url) return;
  const box=document.getElementById('imgLightbox');
  const img=document.getElementById('imgLightboxImg');
  if(!box||!img) return;
  img.src=url;
  box.classList.remove('hidden');
  document.body.style.overflow='hidden';
}
function closeImageLightbox(){
  const box=document.getElementById('imgLightbox');
  const img=document.getElementById('imgLightboxImg');
  if(box) box.classList.add('hidden');
  if(img) img.removeAttribute('src');
  document.body.style.overflow='';
}
document.addEventListener('DOMContentLoaded',()=>{
  const box=document.getElementById('imgLightbox');
  if(!box) return;
  box.addEventListener('click',e=>{ if(e.target===box || e.target.classList.contains('img-lightbox-close')) closeImageLightbox(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeImageLightbox(); });
});

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function pageWindow(current,total,maxShow=10){if(!total||total<1)return[];current=Math.max(1,Math.min(current,total));if(total<=maxShow)return Array.from({length:total},(_,i)=>i+1);let start=current-4,end=current+5;if(start<1){end=Math.min(total,end+(1-start));start=1}if(end>total){start=Math.max(1,start-(end-total));end=total}while(end-start+1>maxShow){if(current-start>end-current)start++;else end--}return Array.from({length:end-start+1},(_,i)=>start+i)}
let worksPageSize=Number(localStorage.getItem('xiangpan_works_page_size')||20);if(![15,20,25,30,35,40,45,50,500].includes(worksPageSize))worksPageSize=20;

async function jsonFetch(url,opt={}){const r=await apiFetch(url,opt);let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.message||'请求失败');return d}
async function check(){const r=await apiFetch('api/admin/status');if(r.ok){const d=await r.json();show(d)}}
function show(status){login.classList.add('hidden');app.classList.remove('hidden');if(status?.role!=='super'){document.querySelectorAll('[data-super]').forEach(x=>x.style.display='none')}works()}
async function doLogin(){try{const d=await jsonFetch('api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value.trim(),password:p.value})});show(d)}catch(e){alert(e.message)}}
loginBtn.onclick=doLogin;
[u,p].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doLogin()}}));
logout.onclick=async()=>{await apiFetch('api/admin/logout',{method:'POST'});location.reload()};
document.querySelectorAll('.menu').forEach(b=>b.onclick=()=>{document.querySelectorAll('.menu').forEach(x=>x.classList.remove('active'));b.classList.add('active');({works,cats:catsView,site:siteView,admins:adminsView,logs:logsView,ops:opsView}[b.dataset.view]||works)()});
async function works(page=1){
  const old=document.getElementById('adminSearch')?.value||'';
  const oldCat=document.getElementById('adminCat')?.dataset.value||'';
  const oldSub=document.getElementById('adminSub')?.dataset.value||'';
  const oldPeriod=document.getElementById('adminPeriod')?.dataset.value||'';
  const [d,catData,tr]=await Promise.all([
    jsonFetch('api/works?'+new URLSearchParams({page,size:worksPageSize,keyword:old,category:oldCat,subcategory:oldSub,period:oldPeriod}).toString()),
    jsonFetch('api/categories'),
    jsonFetch('api/creation-time-range')
  ]);
  const periods=makePeriods(Number(tr.min_year),Number(tr.max_year));
  const selectedCat=catData.find(c=>String(c.name)===String(oldCat));
  const subs=selectedCat?.subitems||[];
  const catButtons=['',...catData.map(c=>c.name)].map(v=>`<button type="button" class="filter-btn ${v===oldCat?'active':''}" data-value="${esc(v)}">${esc(v||'全部')}</button>`).join('');
  const subButtons=subs.length?['',...subs.map(x=>x.name)].map(v=>`<button type="button" class="filter-btn ${v===oldSub?'active':''}" data-value="${esc(v)}">${esc(v||'全部')}</button>`).join(''):'';
  const periodButtons=['',...periods].map(v=>`<button type="button" class="filter-btn ${v===oldPeriod?'active':''}" data-value="${esc(v)}">${esc(v||'全部')}</button>`).join('');
  view.innerHTML=`<h1 class="admin-title">作品管理</h1>
  <div class="admin-work-search">
    <div class="toolbar"><input id="adminSearch" value="${esc(old)}" placeholder="搜索作品名称、作品编号或作品介绍"><button class="primary" type="button" onclick="works(1)">搜索</button><button class="primary" type="button" onclick="addWork()">增加作品</button><button class="primary" type="button" onclick="batchImportWorks()">批量插入</button></div>
    <div class="filter-line"><span class="filter-label">分类</span><div id="adminCat" class="filter-buttons" data-value="${esc(oldCat)}">${catButtons}</div></div>
    ${subs.length?`<div class="filter-line"><div id="adminSub" class="filter-buttons" data-value="${esc(oldSub)}">${subButtons}</div></div>`:`<div id="adminSub" data-value=""></div>`}
    <div class="filter-line"><span class="filter-label">时间</span><div id="adminPeriod" class="filter-buttons" data-value="${esc(oldPeriod)}">${periodButtons}</div></div>
    <div class="filter-actions"><button type="button" onclick="clearWorkSearch()">重置筛选</button></div>
  </div>
  <div class="bulk-toolbar"><label><input id="selectAllWorks" class="bulk-check" type="checkbox" onchange="toggleAllWorks(this)"> 全选本页</label><button class="danger" type="button" onclick="batchDeleteWorks()">批量删除</button><span class="hint">单次批量删除最多999件</span></div>
  <table class="table works-table"><thead><tr><th class="check-col"></th><th class="col-thumb">主图</th><th class="col-name">作品名称</th><th class="col-no">作品编号</th><th class="col-cat">分类</th><th class="col-time">创作时间</th><th class="col-size">尺寸</th><th class="col-actions">操作</th></tr></thead><tbody>${d.items.map(x=>`<tr><td class="check-col"><input class="bulk-check work-check" type="checkbox" value="${x.id}"></td><td class="col-thumb">${(x.thumb||x.main_image)?`<img class="list-thumb" src="${esc(resolveAssetUrl(x.thumb||x.main_image))}" alt="" title="${esc(x.name)}">`:``}</td><td class="col-name" title="${esc(x.name)}">${esc(x.name)}</td><td class="col-no" title="${esc(x.work_no||'')}">${esc(x.work_no||'')}</td><td class="col-cat" title="${esc(x.category||'')}${x.subcategory?' / '+esc(x.subcategory):''}">${esc(x.category||'')}${x.subcategory?' / '+esc(x.subcategory):''}</td><td class="col-time">${esc(x.creation_time||'')}</td><td class="col-size" title="${esc(x.size||'')}">${esc(x.size||'')}</td><td class="col-actions actions"><button type="button" onclick="editWork(${x.id})">编辑</button><button type="button" onclick="delWork(${x.id})">删除</button></td></tr>`).join('')}</tbody></table>
  <div class="pager-bar"><div class="pager">${pageWindow(d.page,d.pages).map(p=>`<button type="button" class="${p===d.page?'active':''}" onclick="works(${p})">${p}</button>`).join('')}</div>
  <label class="page-size-label">每页 <select id="worksPageSize" onchange="setWorksPageSize(this.value)">${[15,20,25,30,35,40,45,50,500].map(n=>`<option value="${n}" ${n===worksPageSize?'selected':''}>${n}</option>`).join('')}</select> 条</label></div>`;
  document.querySelectorAll('#adminCat .filter-btn').forEach(b=>b.onclick=()=>{document.getElementById('adminCat').dataset.value=b.dataset.value;document.getElementById('adminSub').dataset.value='';works(1)});
  document.querySelectorAll('#adminSub .filter-btn').forEach(b=>b.onclick=()=>{document.getElementById('adminSub').dataset.value=b.dataset.value;works(1)});
  document.querySelectorAll('#adminPeriod .filter-btn').forEach(b=>b.onclick=()=>{document.getElementById('adminPeriod').dataset.value=b.dataset.value;works(1)});
}
function makePeriods(min,max){if(!Number.isFinite(min)||!Number.isFinite(max)||min>max)return [];const out=[];let start=min;while(start<=max){const end=Math.min(Math.floor(start/10)*10+9,max);out.push(`${start}-${end}`);start=end+1}return out}
function setWorksPageSize(v){worksPageSize=Number(v)||20;localStorage.setItem("xiangpan_works_page_size",String(worksPageSize));works(1)}
function clearWorkSearch(){const el=document.getElementById('adminSearch');if(el)el.value='';const cat=document.getElementById('adminCat');if(cat)cat.dataset.value='';const sub=document.getElementById('adminSub');if(sub)sub.dataset.value='';const period=document.getElementById('adminPeriod');if(period)period.dataset.value='';works(1)}
function toggleAllWorks(master){document.querySelectorAll('.work-check').forEach(x=>x.checked=master.checked)}
function selectedWorkIds(){return [...document.querySelectorAll('.work-check:checked')].map(x=>Number(x.value)).filter(Number.isFinite)}
async function batchDeleteWorks(){const ids=selectedWorkIds();if(!ids.length){alert('请先选择要删除的作品');return}if(ids.length>999){alert('单次批量删除最多999件作品');return}if(!confirm(`确定删除选中的 ${ids.length} 件作品？`))return;try{const d=await jsonFetch('api/admin/works/batch-delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});alert(`已删除 ${d.deleted} 件作品`);works(1)}catch(e){alert(e.message)}}

async function batchImportWorks(){
  cats=await jsonFetch('api/categories');
  view.innerHTML=`<h1 class="admin-title">批量插入作品</h1>
  <div class="form-box work-form-box">
    <p class="hint">一次多选多张图片上传，每张图片自动创建一件作品。<br>
    · 文件名含年份（如 <code>1999国画山水.jpg</code>）：作品名称保留原文件名，创作时间=1999；如 <code>1999_国画山水.jpg</code> / <code>1999 国画山水.png</code>，作品名称去掉年份，仅保留“国画山水”<br>
    · 文件名不含年份：作品名称=文件名（不含后缀），创作时间留空<br>
    · 支持 jpg / png / webp / gif 等；每次最多 99 张，总大小不超过 200MB。</p>
    <div class="field"><label>作品分类 <i>必填</i></label><select id="biCat">${categoryOptions({category_id:'',subcategory_id:''})}</select></div>
    <div class="field"><label>选择图片 <i>可多选，最多99张</i></label><input id="biFile" type="file" accept="image/*" multiple></div>
    <div id="biProgressWrap" class="bi-progress-wrap"><div class="bi-progress-bar"><i id="biBar"></i></div><div id="biProgress" class="bi-progress-text"></div></div>
    <div class="form-actions"><button class="primary" id="biSubmit" onclick="doBatchImport()">开始导入</button><button onclick="works()">返回列表</button></div>
  </div>`;
}

function uploadWithProgress(url, fd, onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST', url);
    const token=localStorage.getItem('xiangpan_admin_token');
    if(token) xhr.setRequestHeader('Authorization','Bearer '+token);
    xhr.upload.onprogress=e=>{
      if(e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    };
    xhr.onload=()=>{
      let d={};
      try{d=JSON.parse(xhr.responseText||'{}')}catch(err){}
      if(xhr.status>=200&&xhr.status<300) resolve(d);
      else reject(new Error(d.message||('上传失败('+xhr.status+')')));
    };
    xhr.onerror=()=>reject(new Error('网络错误，上传失败'));
    xhr.send(fd);
  });
}

async function compressBatchImage(file, quality=0.6){
  if(!file || !/^image\//i.test(file.type)) return file;
  try{
    const bitmap=await createImageBitmap(file);
    const canvas=document.createElement('canvas');
    canvas.width=bitmap.width; canvas.height=bitmap.height;
    const ctx=canvas.getContext('2d');
    if(!ctx) return file;
    ctx.drawImage(bitmap,0,0);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if(!blob) return file;
    const base=file.name.replace(/\.[^.]+$/,'');
    return new File([blob],base+'.webp',{type:'image/webp',lastModified:file.lastModified});
  }catch(e){
    return file;
  }
}

async function doBatchImport(){
  const catEl=document.getElementById('biCat');
  const fileEl=document.getElementById('biFile');
  if(!catEl.value){alert('请选择作品分类');return}
  let files=[...(fileEl.files||[])];
  if(!files.length){alert('请选择至少一张图片');return}
  if(files.length>99){alert('每次最多上传 99 张图片，请减少后再试');return}
  const total=files.reduce((s,f)=>s+(f.size||0),0);
  if(total>200*1024*1024){alert('所选图片总大小不能超过 200MB');return}
  const [category_id,subcategory_id='']=catEl.value.split('|');
  const fd=new FormData();
  fd.append('category_id',category_id);
  if(subcategory_id) fd.append('subcategory_id',subcategory_id);
  const wrap=document.getElementById('biProgressWrap');
  const prog=document.getElementById('biProgress');
  const bar=document.getElementById('biBar');
  const btn=document.getElementById('biSubmit');
  wrap.style.display='block'; bar.style.width='0%'; prog.textContent=`正在压缩 ${files.length} 张图片（质量60%）…`; btn.disabled=true;
  try{
    const compressed=[];
    for(let i=0;i<files.length;i++){
      compressed.push(await compressBatchImage(files[i],0.6));
      prog.textContent=`正在压缩 ${i+1}/${files.length} 张图片（质量60%）…`;
    }
    compressed.forEach(f=>fd.append('images',f));
    const base=(window.XIANGPAN_RUNTIME&&window.XIANGPAN_RUNTIME.apiBase)||'';
    const url=(base?base.replace(/\/$/,'')+'/':'')+'api/admin/works/batch-import';
    const d=await uploadWithProgress(url, fd, (loaded, totalBytes)=>{
      const pct=totalBytes?Math.min(99, Math.round(loaded/totalBytes*100)):0;
      bar.style.width=pct+'%';
      prog.textContent=`上传中 ${pct}%（${files.length} 张）…`;
    });
    bar.style.width='100%';
    prog.textContent=`处理完成：成功 ${d.created||0} 件`+(d.failed?`，失败 ${d.failed} 件`:'');
    let msg=`成功插入 ${d.created||0} 件作品`;
    if(d.failed) msg+=`，失败 ${d.failed} 件`;
    if(d.errors&&d.errors.length) msg+='\n失败示例：'+d.errors.slice(0,5).map(x=>x.file+': '+x.reason).join('；');
    alert(msg);
    works(1);
  }catch(e){
    prog.textContent='上传失败';
    alert(e.message||'导入失败');
  }finally{
    btn.disabled=false;
  }
}

async function editWork(id){try{const d=await jsonFetch('api/works/'+id);pendingFiles=[];formWork(d)}catch(e){alert(e.message)}}
function addWork(){pendingFiles=[];formWork({name:'',work_no:'',creation_time:'',size:'',description:'',category:'',subcategory:'',category_id:'',subcategory_id:'',images:[]})}
function initEditor(selector,toolbarSelector,html){if(!window.wangEditor){alert('富文本编辑器加载失败，请检查网络后刷新页面');return null}const {createEditor,createToolbar}=window.wangEditor;const editor=createEditor({selector,html:html||'',config:{placeholder:'请输入内容……',MENU_CONF:{}},mode:'default'});createToolbar({editor,selector:toolbarSelector,config:{excludeKeys:['group-video','insertTable']},mode:'default'});return editor}
function categoryOptions(d){let out='<option value="">请选择作品分类</option>';cats.forEach(c=>{const subs=c.subitems||[];if(subs.length)subs.forEach(s=>{const val=`${c.id}|${s.id}`;out+=`<option value="${val}" ${String(c.id)===String(d.category_id)&&String(s.id)===String(d.subcategory_id)?'selected':''}>${esc(c.name)} / ${esc(s.name)}</option>`});else out+=`<option value="${c.id}|" ${String(c.id)===String(d.category_id)&&!d.subcategory_id?'selected':''}>${esc(c.name)}</option>`});return out}
function yearOptions(value){const y=new Date().getFullYear();let out='<option value="">请选择创作年份</option>';for(let i=y;i>=1950;i--)out+=`<option value="${i}" ${String(value||'')===String(i)?'selected':''}>${i}</option>`;return out}
async function formWork(d){if(workEditor){try{workEditor.destroy()}catch(e){}workEditor=null}cats=await jsonFetch('api/categories');
 const images=(d.images||[]).filter(img=>img.thumb||img.url).map(img=>`<div class="image-item"><img src="${esc(resolveAssetUrl(img.thumb||img.url))}" alt="" data-full="${esc(resolveAssetUrl(img.url||img.thumb))}" style="cursor:zoom-in" title="点击查看大图" onclick="openImageLightbox(this.dataset.full||this.src)"><div><button onclick="setMain(${d.id},${img.id})">${img.is_main?'主图':'设为主图'}</button><button onclick="removeImage(${d.id},${img.id})">删除</button></div></div>`).join('');
 view.innerHTML=`<h1 class="admin-title">${d.id?'编辑作品':'增加作品'}</h1><div class="form-box work-form-box"><div class="field"><label>作品名称 <i>必填</i></label><input id="fn" maxlength="100" value="${esc(d.name)}"></div><div class="field"><label>作品分类 <i>必填</i></label><select id="fc">${categoryOptions(d)}</select></div><div class="field"><label>作品编号</label><input id="fno" value="${esc(d.work_no||'')}"></div><div class="field"><label>创作时间</label><select id="ft">${yearOptions(d.creation_time)}</select></div><div class="field"><label>尺寸</label><input id="fz" value="${esc(d.size||'')}"></div><div class="field"><label>作品介绍</label><div class="wang-editor-wrap"><div id="work-toolbar" class="wang-toolbar"></div><div id="work-editor" class="wang-content"></div></div></div><div class="field"><label>作品图片 <i>最多20张</i></label><div id="imageManager" class="image-manager">${images}<div id="newImagePreview" class="new-image-preview"></div><label class="upload-tile" title="选择图片"><span class="plus-icon"></span><input id="fi" type="file" multiple accept="image/*"></label></div><div class="image-hint">可一次选择多张，也可以连续选择；图片先预览，点击保存后才正式提交。</div></div><div class="form-actions"><button class="primary" onclick="saveWork(${d.id||0})">保存</button><button onclick="works()">返回列表</button></div></div>`;
 workEditor=initEditor('#work-editor','#work-toolbar',d.description||'');document.getElementById('fi').onchange=addPendingFiles;renderPendingFiles();}
function addPendingFiles(e){const incoming=[...(e.target.files||[])];const existingCount=document.querySelectorAll('#imageManager .image-item').length;if(existingCount+pendingFiles.length+incoming.length>20){alert(`单件作品最多20张图片，当前已有${existingCount+pendingFiles.length}张，最多再选择${20-existingCount-pendingFiles.length}张`);e.target.value='';return}pendingFiles.push(...incoming);e.target.value='';renderPendingFiles()}
function renderPendingFiles(){const box=document.getElementById('newImagePreview'),manager=document.getElementById('imageManager');if(!box)return;box.innerHTML=pendingFiles.map((f,i)=>`<div class="new-image-item"><img src="${URL.createObjectURL(f)}" alt=""><button type="button" onclick="removePending(${i})">×</button><span>待保存</span></div>`).join('');const tile=manager.querySelector('.upload-tile');if(tile)manager.appendChild(tile)}
function removePending(i){pendingFiles.splice(i,1);renderPendingFiles()}
async function saveWork(id){const nameEl=document.getElementById('fn'),catEl=document.getElementById('fc');if(!nameEl.value.trim()){alert('请填写作品名称');nameEl.focus();return}if(!catEl.value){alert('请选择作品分类');catEl.focus();return}const [category_id,subcategory_id='']=catEl.value.split('|');const fd=new FormData();[['name',nameEl.value.trim()],['category_id',category_id],['subcategory_id',subcategory_id],['work_no',document.getElementById('fno').value.trim()],['creation_time',document.getElementById('ft').value],['size',document.getElementById('fz').value.trim()],['description',workEditor?workEditor.getHtml():'']].forEach(x=>fd.append(x[0],x[1]));pendingFiles.forEach(f=>fd.append('images',f));try{const saved=await jsonFetch(id?'api/admin/works/'+id:'api/admin/works',{method:id?'PUT':'POST',body:fd});pendingFiles=[];alert('保存成功');await editWork(saved.id||id)}catch(e){alert(e.message)}}

async function setMain(id,imageId){try{await jsonFetch('api/admin/works/'+id+'/main-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_id:imageId})});await editWork(id)}catch(e){alert(e.message)}}
async function removeImage(id,imageId){if(!confirm('确定删除这张图片？'))return;try{await jsonFetch('api/admin/works/'+id+'/images/'+imageId,{method:'DELETE'});await editWork(id)}catch(e){alert(e.message)}}
async function delWork(id){if(!confirm('确定删除这件作品？'))return;try{await jsonFetch('api/admin/works/'+id,{method:'DELETE'});works()}catch(e){alert(e.message)}}
async function catsView(){const d=await jsonFetch('api/categories');view.innerHTML=`<h1 class="admin-title">分类管理</h1><div class="form-box"><p class="hint">最多两级分类。</p>${d.map(x=>`<div class="cat-block"><div class="cat-head"><b>${esc(x.name)}</b><span><button onclick="renameCat(${x.id},'${esc(x.name)}')">编辑</button><button onclick="delCat(${x.id})">删除</button></span></div><div class="sub-list">${(x.subitems||[]).map(s=>`<span>${esc(s.name)} <button class="mini-btn" onclick="renameSub(${s.id},'${esc(s.name)}')">编辑</button><button class="mini-btn" onclick="delSub(${s.id})">删除</button></span>`).join('')}</div><div class="sub-add"><input id="sub_${x.id}" placeholder="新增细分类"><button onclick="addSub(${x.id})">增加</button></div></div>`).join('')}<hr><div class="field"><label>新增一级分类</label><input id="newCat"></div><button class="primary" onclick="addCat()">增加一级分类</button></div>`}
async function addCat(){if(!newCat.value.trim())return;try{await jsonFetch('api/admin/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newCat.value.trim()})});catsView()}catch(e){alert(e.message)}}
async function renameCat(id,name){const n=prompt('新的分类名称',name);if(n&&n.trim()){try{await jsonFetch('api/admin/categories/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n.trim()})});catsView()}catch(e){alert(e.message)}}}
async function delCat(id){if(confirm('确定删除该分类？')){try{await jsonFetch('api/admin/categories/'+id,{method:'DELETE'});catsView()}catch(e){alert(e.message)}}}
async function addSub(cid){const el=document.getElementById('sub_'+cid);if(!el.value.trim())return;try{await jsonFetch('api/admin/subcategories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category_id:cid,name:el.value.trim()})});catsView()}catch(e){alert(e.message)}}
async function renameSub(id,name){const n=prompt('新的细分类名称',name);if(n&&n.trim()){try{await jsonFetch('api/admin/subcategories/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n.trim()})});catsView()}catch(e){alert(e.message)}}}
async function delSub(id){if(confirm('确定删除该细分类？')){try{await jsonFetch('api/admin/subcategories/'+id,{method:'DELETE'});catsView()}catch(e){alert(e.message)}}}
async function siteView(){
  if(bioEditor){try{bioEditor.destroy()}catch(e){}bioEditor=null}
  const d=await jsonFetch('api/site');
  let social={微博:'',抖音:'',微信公众号:''};
  try{
    const raw=JSON.parse(d.social_links||'{}');
    if(Array.isArray(raw)){social.微博=raw[0]||'';social.抖音=raw[1]||'';social.微信公众号=raw[2]||''}
    else if(raw&&typeof raw==='object'){
      social.微博=raw.微博||'';
      social.抖音=raw.抖音||raw.抖音号||'';
      social.微信公众号=raw.微信公众号||raw.微信||raw.公众号||'';
    }
  }catch(e){}
  view.innerHTML=`<h1 class="admin-title">站点信息</h1><div class="form-box">
    <div class="field"><label>站点名称 <i>必填，最多20字</i></label><input id="sn" maxlength="20" value="${esc(d.site_name||'')}"></div>
    <div class="field"><label>站点 Logo（存入 Supabase Storage）</label>
      <div class="upload-line">${d.logo?`<img id="logoPreview" class="site-preview" src="${esc(resolveAssetUrl(d.logo))}" alt="logo">`:`<img id="logoPreview" class="site-preview" alt="logo" hidden>`}<input id="sl" type="file" accept="image/*">${d.logo?`<button type="button" class="danger" id="deleteLogoBtn">删除站点 Logo</button>`:''}</div>
      <small class="hint">选择图片后自动上传并保存，无需再点保存。删除后站点 Logo 为空，不会显示默认 Logo。</small></div>
    <div class="field"><label>艺术家头像（建议 200×200，存入 Supabase Storage）</label>
      <div class="upload-line">${d.avatar?`<img id="avatarPreview" class="site-preview" src="${esc(resolveAssetUrl(d.avatar))}" alt="avatar">`:`<img id="avatarPreview" class="site-preview" alt="avatar" hidden>`}<input id="sa" type="file" accept="image/*"></div>
      <small class="hint">选择图片后自动上传并保存，无需再点保存。</small></div>
    <div class="field"><label>艺术家姓名 <i>最多20字</i></label><input id="san" maxlength="20" value="${esc(d.artist_name||'')}"></div>
    <div class="field"><label>艺术家简介</label><div class="wang-editor-wrap"><div id="bio-toolbar" class="wang-toolbar"></div><div id="bio-editor" class="wang-content"></div></div></div>
    <div class="field"><label>社交媒体</label>
      <div class="social-admin-grid">
        <label>微博<input id="socialWeibo" type="url" placeholder="https://weibo.com/..." value="${esc(social.微博)}"></label>
        <label>抖音<input id="socialDouyin" type="url" placeholder="https://www.douyin.com/..." value="${esc(social.抖音)}"></label>
        <label>微信公众号<input id="socialWechat" type="url" placeholder="公众号文章或介绍页链接" value="${esc(social.微信公众号)}"></label>
      </div>
      <small class="hint">填写完整 http(s) 链接；有数据的项才会在首页底部显示彩色图标。</small>
    </div>
    <div class="form-actions"><button class="primary" type="button" onclick="saveSite()">保存</button></div>
  </div>`;
  bioEditor=initEditor('#bio-editor','#bio-toolbar',d.artist_bio||'');
  document.getElementById('sl').onchange=async e=>{
    previewSiteImage(e,'logoPreview');
    if(e.target.files&&e.target.files[0]) await saveSite({quiet:true,fromImage:true,imageKind:'logo'});
  };
  const deleteLogoBtn=document.getElementById('deleteLogoBtn');
  if(deleteLogoBtn) deleteLogoBtn.onclick=deleteSiteLogo;
  document.getElementById('sa').onchange=async e=>{
    previewSiteImage(e,'avatarPreview');
    if(e.target.files&&e.target.files[0]) await saveSite({quiet:true,fromImage:true,imageKind:'avatar'});
  };
}
async function deleteSiteLogo(){
  if(!confirm('确定删除站点 Logo？删除后站点将不再显示 Logo。')) return;
  try{
    await jsonFetch('api/admin/site/logo',{method:'DELETE'});
    const el=document.getElementById('logoPreview');
    if(el){el.removeAttribute('src');el.hidden=true;}
    const btn=document.getElementById('deleteLogoBtn'); if(btn) btn.remove();
    const input=document.getElementById('sl'); if(input) input.value='';
    showSiteTip('站点 Logo 已删除');
  }catch(e){
    showSiteTip(e.message||'删除 Logo 失败',false);
    alert(e.message||'删除 Logo 失败');
  }
}
function previewSiteImage(e,id){const f=e.target.files&&e.target.files[0];if(f){const el=document.getElementById(id); if(el){el.src=URL.createObjectURL(f); el.hidden=false}}}
function showSiteTip(msg,ok=true){
  const box=document.querySelector('.form-box'); if(!box) return;
  const old=box.querySelector('.auto-save-tip'); if(old) old.remove();
  const tip=document.createElement('div'); tip.className='hint auto-save-tip'; tip.style.color=ok?'#2a7':'#a33'; tip.textContent=msg;
  box.insertBefore(tip,box.firstChild); setTimeout(()=>tip.remove(),4000);
}
async function saveSite(opt={}){
  const siteName=(document.getElementById('sn')?.value||'').trim();
  const artistName=(document.getElementById('san')?.value||'').trim();
  if(!siteName){alert('站点名称不能为空');return}
  if([...siteName].length>20||[...artistName].length>20){alert('名称最多20个字');return}
  const social={
    微博:(document.getElementById('socialWeibo')?.value||'').trim(),
    抖音:(document.getElementById('socialDouyin')?.value||'').trim(),
    微信公众号:(document.getElementById('socialWechat')?.value||'').trim()
  };
  const re=/^https?:\/\/[^\s]+$/i;
  if(Object.values(social).some(x=>x&&!re.test(x))){alert('社交媒体链接格式不正确，请填写 http:// 或 https:// 链接');return}
  const f=new FormData();
  f.append('site_name',siteName);
  f.append('artist_name',artistName);
  f.append('artist_bio',bioEditor?bioEditor.getHtml():'');
  f.append('social_links',JSON.stringify(social));
  const li=document.getElementById('sl'), ai=document.getElementById('sa');
  if(li&&li.files&&li.files[0]) f.append('logo',li.files[0]);
  if(ai&&ai.files&&ai.files[0]) f.append('avatar',ai.files[0]);
  try{
    const res=await jsonFetch('api/admin/site',{method:'POST',body:f});
    if(li) li.value='';
    if(ai) ai.value='';
    if(res.logo){const el=document.getElementById('logoPreview'); if(el) el.src=resolveAssetUrl(res.logo)+'?t='+Date.now()}
    if(res.avatar){const el=document.getElementById('avatarPreview'); if(el) el.src=resolveAssetUrl(res.avatar)+'?t='+Date.now()}
    if(opt.quiet){
      showSiteTip(opt.fromImage?'图片已上传并自动保存':'已保存');
    }else{
      alert('已保存');
      siteView();
    }
  }catch(e){
    showSiteTip(e.message||'保存失败',false);
    if(!opt.quiet) alert(e.message||'保存失败');
  }
}
async function adminsView(){try{const d=await jsonFetch('api/admin/admins');const q=document.getElementById('adminAccountSearch')?.value?.trim().toLowerCase()||'';const rows=q?d.filter(x=>(x.username+' '+(x.display_name||'')).toLowerCase().includes(q)):d;view.innerHTML=`<h1 class="admin-title">管理员管理</h1><div class="toolbar"><input id="adminAccountSearch" value="${esc(q)}" placeholder="搜索账号或名称"><button class="primary" onclick="adminsView()">搜索</button><button class="primary" onclick="adminForm()">增加管理员</button></div><table class="table"><thead><tr><th>账号</th><th>名称</th><th>权限</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.username)}</td><td>${esc(x.display_name||'')}</td><td>${x.role==='super'?'超级管理员':'管理员'}</td><td>${esc(x.created_at||'')}</td><td class="actions"><button onclick="adminForm(${x.id})">编辑</button><button onclick="delAdmin(${x.id})" ${x.username==='admin'?'disabled':''}>删除</button></td></tr>`).join('')}</tbody></table>`}catch(e){alert(e.message)}}

async function adminForm(id){let d={username:'',display_name:'',role:'admin'};if(id)d=await jsonFetch('api/admin/admins/'+id);const isRoot=d.role==='super';view.innerHTML=`<h1 class="admin-title">${id?'编辑管理员':'增加管理员'}</h1><div class="form-box"><div class="field"><label>账号</label><input id="au" maxlength="30" value="${esc(d.username)}"></div><div class="field"><label>密码 ${id?'<i>不修改可留空</i>':''}</label><input id="ap" type="password" minlength="6" placeholder="至少6位"></div><div class="field"><label>名称</label><input id="ad" maxlength="30" value="${esc(d.display_name||'')}"></div><div class="field"><label>权限</label><select id="ar"><option value="admin" ${d.role==='admin'?'selected':''}>普通管理员</option><option value="super" ${d.role==='super'?'selected':''}>超级管理员</option></select></div><div class="form-actions"><button class="primary" onclick="saveAdmin(${id||0})">保存</button><button onclick="adminsView()">返回列表</button></div></div>`}
async function saveAdmin(id){const username=au.value.trim(),password=ap.value,display_name=ad.value.trim(),role=document.getElementById('ar').value;if(!username){alert('账号不能为空');return}if(!id&&password.length<6){alert('密码至少6位');return}try{await jsonFetch(id?'api/admin/admins/'+id:'api/admin/admins',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,display_name,role})});adminsView()}catch(e){alert(e.message)}}
async function delAdmin(id){if(!confirm('确定删除该管理员？'))return;try{await jsonFetch('api/admin/admins/'+id,{method:'DELETE'});adminsView()}catch(e){alert(e.message)}}
async function logsView(page=1){const d=await jsonFetch('api/admin/logs?page='+page);view.innerHTML=`<h1 class="admin-title">操作日志</h1><table class="table"><thead><tr><th>时间</th><th>管理员</th><th>操作</th><th>详情</th></tr></thead><tbody>${d.items.map(x=>`<tr><td>${esc(x.created_at||'')}</td><td>${esc(x.admin_name||'')}</td><td>${esc(x.action||'')}</td><td>${esc(x.detail||'')}</td></tr>`).join('')}</tbody></table><div class="pager">${Array.from({length:d.pages},(_,i)=>`<button class="${i+1===d.page?'active':''}" onclick="logsView(${i+1})">${i+1}</button>`).join('')}</div>`}
async function opsView(){const d=await jsonFetch('api/admin/status');view.innerHTML=`<h1 class="admin-title">运维管理</h1><div class="status-grid"><div class="status-card">作品数量<b>${d.counts.works}</b></div><div class="status-card">图片数量<b>${d.counts.images}</b></div><div class="status-card">数据库<b>本地 SQLite</b></div></div><div class="form-box" style="margin-top:20px"><p class="hint">云端版数据库由 Supabase Postgres 托管；图片由 Supabase Storage 托管。正式备份请使用 Supabase 的数据库备份能力。</p></div>`}
async function backup(){try{const d=await jsonFetch('api/admin/backup',{method:'POST'});alert('备份完成：'+d.name)}catch(e){alert(e.message)}}
check();
