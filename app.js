let slides=[],idx=0,timer;
async function load(){
  const [s,r]=await Promise.all([apiFetch('api/site').then(x=>x.json()),apiFetch('api/home/random').then(x=>x.json())]);
  const artist=(s.artist_name||'').trim();
  artistName.textContent=artist;
  artistName.hidden=!artist;
  const bio=(s.artist_bio||'').trim();
  artistBio.dataset.appManaged='1';
  artistBio.innerHTML=bio;
  artistBio.hidden=!bio;
  const av=(s.avatar||'').trim();
  if(av){
    avatar.src=resolveAssetUrl(av);
    avatar.alt=artist||'';
    avatar.hidden=false;
  }else{
    avatar.removeAttribute('src');
    avatar.alt='';
    avatar.hidden=true;
  }
  slides=r.filter(x=>(x.main_image||'').trim());
  const hero=document.querySelector('.hero');
  if(hero) hero.hidden=!slides.length;
  render();
  if(slides.length) timer=setInterval(next,4500)
}
function render(){slidesEl.innerHTML=slides.map((x,i)=>`<a class=\"hero-slide ${i===idx?'active':''}\" href=\"detail.html?id=${x.id}\"><img src=\"${resolveAssetUrl(x.main_image)}\" alt=\"${x.name||''}\"></a>`).join('');caption.textContent=slides[idx]?.name||''}
function next(){if(!slides.length)return;idx=(idx+1)%slides.length;render()}
function prev(){if(!slides.length)return;idx=(idx-1+slides.length)%slides.length;render()}
const slidesEl=document.getElementById('slides'),caption=document.getElementById('caption');
document.getElementById('next').onclick=next;
document.getElementById('prev').onclick=prev;

// 移动端支持左右滑动翻页；PC 端保持原有按钮操作。
const heroEl=document.querySelector('.hero');
let touchStartX=0,touchStartY=0,touchMoved=false;
if(heroEl){
  heroEl.addEventListener('touchstart',e=>{
    if(!e.touches||!e.touches.length)return;
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
    touchMoved=false;
  },{passive:true});
  heroEl.addEventListener('touchmove',e=>{
    if(!e.touches||!e.touches.length)return;
    const dx=e.touches[0].clientX-touchStartX;
    const dy=e.touches[0].clientY-touchStartY;
    if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){touchMoved=true;e.preventDefault();}
  },{passive:false});
  heroEl.addEventListener('touchend',e=>{
    if(!touchMoved)return;
    const endX=e.changedTouches&&e.changedTouches[0]?e.changedTouches[0].clientX:touchStartX;
    const dx=endX-touchStartX;
    if(Math.abs(dx)>=40){if(dx<0)next();else prev();}
    touchMoved=false;
  },{passive:true});
}
load();
