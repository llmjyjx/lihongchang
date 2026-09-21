(async function(){
  const el=document.getElementById('socialFooter');
  if(!el)return;
  // 仅三项：微博、抖音、微信公众号；官方风格彩图图标
  const KEYS=['微博','抖音','微信公众号'];
  const ICONS={
    '微博':`<span class="social-icon-img social-weibo" aria-hidden="true"><svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="24" fill="#E6162D"/><path fill="#fff" d="M19.2 31.6c-4.6.1-8.5-2.2-8.7-5.2-.2-3 3.3-5.8 7.9-6 4.6-.2 8.5 2.1 8.7 5.1.2 3.1-3.3 5.9-7.9 6.1zm9.6-9.8c-.4-1.4-1.6-2.3-3-2.3-.5 0-.9-.4-.9-.9s.4-.9.9-.9c2.2 0 4.1 1.4 4.7 3.6.2.5-.1 1-.6 1.1-.5.2-1-.1-1.1-.6zm2.4-4.5c-1.9-2.1-4.6-3.2-7.5-3.2-.5 0-.9-.4-.9-.9s.4-.9.9-.9c3.5 0 6.8 1.4 9.1 3.9.3.4.3 1-.1 1.3-.4.3-1 .3-1.3-.1-..1-.1-.1-.2-.2zM17.8 24.2c-1.5.3-2.6 1.4-2.4 2.4.2 1.1 1.6 1.7 3.1 1.5 1.5-.2 2.6-1.3 2.4-2.4-.2-1.1-1.6-1.8-3.1-1.5z"/></svg></span>`,
    '抖音':`<span class="social-icon-img social-douyin" aria-hidden="true"><svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="24" fill="#111"/><path fill="#25F4EE" d="M28.5 14.2c.4 2.8 2.1 4.8 4.9 5.3v3.1c-1.7-.1-3.2-.6-4.5-1.5v8.1c0 4.1-3.2 7-7.2 7s-7.2-2.9-7.2-7 2.9-6.7 6.7-7v3.2c-1.8.2-3.1 1.6-3.1 3.6 0 2.2 1.6 3.7 3.7 3.7 2.2 0 3.7-1.5 3.7-4V14.2h3z"/><path fill="#FE2C55" d="M27.2 12.8c.4 2.8 2.1 4.8 4.9 5.3v3.1c-1.7-.1-3.2-.6-4.5-1.5v8.1c0 4.1-3.2 7-7.2 7-.8 0-1.6-.1-2.3-.4 1.2 1.9 3.4 3.2 5.9 3.2 4 0 7.2-2.9 7.2-7v-8.1c1.3.9 2.8 1.4 4.5 1.5v-3.1c-2.8-.5-4.5-2.5-4.9-5.3h-3.6z"/><path fill="#fff" d="M26.5 14.2c.4 2.8 2.1 4.8 4.9 5.3v2.2c-1.7-.1-3.2-.6-4.5-1.5v8.1c0 4.1-3.2 7-7.2 7s-7.2-2.9-7.2-7 2.9-6.7 6.7-7v3.2c-1.8.2-3.1 1.6-3.1 3.6 0 2.2 1.6 3.7 3.7 3.7 2.2 0 3.7-1.5 3.7-4V14.2h3z"/></svg></span>`,
    '微信公众号':`<span class="social-icon-img social-wechat" aria-hidden="true"><svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="24" fill="#07C160"/><path fill="#fff" d="M19.2 14.5c-5.8 0-10.5 3.9-10.5 8.7 0 2.8 1.6 5.3 4.1 6.9l-1 3.4 3.9-2c1.1.3 2.3.5 3.5.5.3 0 .6 0 .9-.1-.3-.8-.5-1.6-.5-2.5 0-5.1 4.9-9.2 10.9-9.2.4 0 .7 0 1.1.1-1.4-3.6-5.7-6.3-11.4-6.3zm-3.6 5.1c.8 0 1.4.6 1.4 1.4s-.6 1.4-1.4 1.4-1.4-.6-1.4-1.4.6-1.4 1.4-1.4zm7.2 0c.8 0 1.4.6 1.4 1.4s-.6 1.4-1.4 1.4-1.4-.6-1.4-1.4.6-1.4 1.4-1.4zM33.5 24c-5.1 0-9.2 3.4-9.2 7.6 0 4.2 4.1 7.6 9.2 7.6 1.1 0 2.1-.2 3.1-.5l3.4 1.8-.8-3c2-1.4 3.3-3.5 3.3-5.9 0-4.2-4.1-7.6-9-7.6zm-3.2 4.7c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1zm6.4 0c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z"/></svg></span>`
  };
  try{
    const d=await apiFetch('api/site').then(r=>r.json());
    let social={微博:'',抖音:'',微信公众号:''};
    try{
      const raw=JSON.parse(d.social_links||'{}');
      if(Array.isArray(raw)){
        social.微博=raw[0]||'';
        social.抖音=raw[1]||'';
        social.微信公众号=raw[2]||'';
      }else if(raw&&typeof raw==='object'){
        social.微博=raw['微博']||'';
        social.抖音=raw['抖音']||raw['抖音号']||'';
        social.微信公众号=raw['微信公众号']||raw['微信']||raw['公众号']||'';
      }
    }catch(e){}
    const items=KEYS.filter(k=>social[k]).map(k=>{
      const url=esc(social[k]);
      return `<a class="social-item" href="${url}" target="_blank" rel="noopener noreferrer" title="${esc(k)}">${ICONS[k]||''}<span class="social-label">${esc(k)}</span></a>`;
    });
    el.innerHTML=items.join('');
    el.hidden=!items.length;
  }catch(e){el.hidden=true;}
  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
})();

;(function(){
  let n=0,t=0;
  function bind(){
    document.querySelectorAll('#copyrightTap, .copyright-tap').forEach(el=>{
      if(el.dataset.tapBound) return;
      el.dataset.tapBound='1';
      el.style.cursor='default';
      el.addEventListener('click', function(){
        const now=Date.now();
        if(now-t>1500)n=0;
        t=now; n++;
        if(n>=3){n=0; location.href='admin.html';}
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
