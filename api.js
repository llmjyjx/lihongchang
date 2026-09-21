/* V38 统一 API 层
 * 前端与后端完全分离。
 * 本地：Flask + SQLite；云端：Supabase Edge Function + Postgres + Storage。
 */
(function(){
  const cfg=window.XIANGPAN_CONFIG||{};
  const mode=String(cfg.mode||'auto').toLowerCase();
  const host=location.hostname;
  const localHost=!host || host==='localhost'||host==='127.0.0.1'||host==='0.0.0.0'||host==='::1';
  const localProtocol=location.protocol==='file:';
  const isLocal=(mode==='local') || (mode==='auto' && (localHost||localProtocol));
  const base=String(isLocal?(cfg.localApiBase||''):(cfg.cloudApiBase||'')).replace(/\/$/,'');
  window.XIANGPAN_RUNTIME={mode:isLocal?'local':'cloud',apiBase:base,frontendOrigin:location.origin};

  function apiUrl(path){
    path=String(path||'').replace(/^\/+/, '');
    return base ? base+'/'+path : path;
  }

  window.apiFetch=async function(path,init={}){
    const url=apiUrl(path);
    const headers=new Headers(init.headers||{});
    const token=localStorage.getItem('xiangpan_admin_token');
    if(token && path.startsWith('api/admin/')) headers.set('Authorization','Bearer '+token);
    init={...init,headers};
    if(isLocal) init.credentials=init.credentials||'include';
    const res=await fetch(url,init);
    if(path==='api/admin/login' && res.ok){
      try{const d=await res.clone().json();if(d.token)localStorage.setItem('xiangpan_admin_token',d.token)}catch(e){}
    }
    if(path==='api/admin/logout') localStorage.removeItem('xiangpan_admin_token');
    if(res.status===401 && path.startsWith('api/admin/')) localStorage.removeItem('xiangpan_admin_token');
    return res;
  };

  window.resolveAssetUrl=function(value){
    const v=String(value||'').trim();
    if(!v)return '';
    if(/^https?:\/\//i.test(v)||v.startsWith('data:')||v.startsWith('blob:'))return v;
    // 兼容旧静态路径
    if(v.startsWith('/img/')||v.startsWith('img/')) return v.replace(/^\/+/, '');
    if(/^\/?uploads\//i.test(v) && window.XIANGPAN_RUNTIME?.mode==='local'){
      const path=v.replace(/^\/+/, '');
      return (window.XIANGPAN_RUNTIME.apiBase||'')+'/'+path;
    }
    // Supabase Storage：sb/site/logo.webp、sb/works/...
    if(v.startsWith('sb/')){
      const base=(window.XIANGPAN_CONFIG&&window.XIANGPAN_CONFIG.cloudApiBase)||'';
      const m=String(base).match(/^(https?:\/\/[^/]+)/i);
      if(m) return m[1]+'/storage/v1/object/public/art-images/'+v.slice(3);
    }
    if(v.startsWith('/'))return v.slice(1);
    return v;
  };

})();
