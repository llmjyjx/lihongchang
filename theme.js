(function(){
  const KEY='xiangpan-theme';
  function autoTheme(){
    const hour=new Date().getHours();
    return (hour>=6 && hour<18) ? 'light' : 'dark';
  }
  function currentTheme(){
    return localStorage.getItem(KEY) || autoTheme();
  }
  function applyTheme(theme){
    document.documentElement.classList.toggle('dark-theme', theme==='dark');
    document.documentElement.dataset.theme=theme;
    const btn=document.getElementById('themeToggle');
    if(btn){
      btn.textContent=theme==='dark'?'☀':'☾';
      btn.setAttribute('aria-label',theme==='dark'?'切换浅色模式':'切换深色模式');
      btn.setAttribute('title',theme==='dark'?'切换浅色模式':'切换深色模式');
    }
  }
  function init(){
    applyTheme(currentTheme());
    const btn=document.getElementById('themeToggle');
    if(btn){
      btn.addEventListener('click',function(){
        const next=document.documentElement.classList.contains('dark-theme')?'light':'dark';
        localStorage.setItem(KEY,next);
        applyTheme(next);
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
