/* 用户端公共站点信息：统一 Header / Footer。
 * 所有展示内容均以后台配置为准，不使用默认站点名称、Logo、艺术家姓名或头像。
 */
(async function(){
  function clean(v){ return String(v ?? '').trim(); }
  function plainText(v){
    const raw=clean(v);
    if(!raw) return '';
    const box=document.createElement('div');
    box.innerHTML=raw;
    return (box.textContent || box.innerText || '').replace(/\s+/g,' ').trim();
  }

  function applySite(d){
    const siteName = clean(d?.site_name);
    const logo = clean(d?.logo);
    const artistName = clean(d?.artist_name);

    // Header：有 Logo 优先显示 Logo；没有 Logo 才显示站点名称；两者都没有则留空。
    document.querySelectorAll('[data-site-logo]').forEach(el=>{
      if(logo){
        el.src = resolveAssetUrl(logo);
        el.alt = siteName || '';
        el.hidden = false;
      }else{
        el.removeAttribute('src');
        el.alt = '';
        el.hidden = true;
      }
    });
    document.querySelectorAll('[data-site-name]').forEach(el=>{
      el.textContent = logo ? '' : siteName;
      el.hidden = !!logo || !siteName;
      if(el.tagName==='A' && siteName) el.setAttribute('title',siteName);
      else el.removeAttribute('title');
    });

    // Footer：没有艺术家姓名时不生成任何默认版权文字。
    document.querySelectorAll('[data-footer-copyright]').forEach(el=>{
      el.textContent = artistName ? `© ${artistName} 版权所有` : '';
      el.hidden = !artistName;
    });

    // 作品详情页由 detail.js 使用作品自己的分享信息：
    // 标题=作品标题，描述=作品简介纯文本，图片=作品主图。
    // 公共站点信息不能覆盖详情页的作品分享 Meta。
    const isWorkDetailPage = /(^|\/)detail\.html$/i.test(location.pathname);
    function ensureMeta(selector, attrs){
      let meta=document.head.querySelector(selector);
      if(!meta){
        meta=document.createElement('meta');
        Object.entries(attrs).forEach(([k,v])=>meta.setAttribute(k,v));
        document.head.appendChild(meta);
      }
      return meta;
    }
    if(!isWorkDetailPage){
      const shareTitleMeta = ensureMeta('meta[property="og:title"]', {property:'og:title'});
      const shareDescMeta = ensureMeta('meta[property="og:description"]', {property:'og:description'});
      const shareImageMeta = ensureMeta('meta[property="og:image"]', {property:'og:image'});
      const shareTypeMeta = ensureMeta('meta[property="og:type"]', {property:'og:type'});
      const twitterTitleMeta = ensureMeta('meta[name="twitter:title"]', {name:'twitter:title'});
      const twitterDescMeta = ensureMeta('meta[name="twitter:description"]', {name:'twitter:description'});
      const twitterImageMeta = ensureMeta('meta[name="twitter:image"]', {name:'twitter:image'});
      const twitterCardMeta = ensureMeta('meta[name="twitter:card"]', {name:'twitter:card'});
      const shareTitle = siteName;
      const shareDesc = plainText(d?.artist_bio);
      const shareImage = clean(d?.avatar);
      [shareTitleMeta, twitterTitleMeta].forEach(meta=>meta.setAttribute('content', shareTitle));
      [shareDescMeta, twitterDescMeta].forEach(meta=>meta.setAttribute('content', shareDesc));
      [shareImageMeta, twitterImageMeta].forEach(meta=>meta.setAttribute('content', shareImage ? resolveAssetUrl(shareImage) : ''));
      shareTypeMeta.setAttribute('content','profile');
      twitterCardMeta.setAttribute('content','summary_large_image');
    }

    const title=document.querySelector('title');
    if(title){
      // 站点信息只使用后台真实数据；未加载到站点名称时保持空白，绝不回退到写死的站点名称。
      title.textContent = siteName;
    }

    // 首页艺术家个人信息：后台没有数据就保持空白，不使用默认图片/文字。
    const nameEl=document.getElementById('artistName');
    if(nameEl){
      nameEl.textContent=artistName;
      nameEl.hidden=!artistName;
    }
    const bioEl=document.getElementById('artistBio');
    if(bioEl && !bioEl.dataset.appManaged){
      const bio=clean(d?.artist_bio);
      bioEl.innerHTML=bio;
      bioEl.hidden=!bio;
    }
    const avatar=document.getElementById('avatar');
    if(avatar){
      const av=clean(d?.avatar);
      if(av){
        avatar.src=resolveAssetUrl(av);
        avatar.alt=artistName || '';
        avatar.hidden=false;
      }else{
        avatar.removeAttribute('src');
        avatar.alt='';
        avatar.hidden=true;
      }
    }
  }

  try{
    const r=await apiFetch('api/site');
    if(!r.ok) return;
    const d=await r.json();
    applySite(d);
  }catch(e){
    // 读取失败时不填充任何默认站点/艺术家数据。
  }
})();
