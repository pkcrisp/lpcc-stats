
(function(){
  function cv(td){
    var t=(td.textContent||'').trim();
    if(t===''||t==='–'||t==='-')return -Infinity;
    if(/^\d+\*?$/.test(t))return parseInt(t,10);
    if(/^\d+\/\d+$/.test(t)){var p=t.split('/');return parseInt(p[0],10)*1e5-parseInt(p[1],10);}
    var n=parseFloat(t.replace(/[,%]/g,''));
    return isNaN(n)?t.toLowerCase():n;
  }
  var state=new WeakMap();
  function sortTable(tbl,ci){
    var rows=[].slice.call(tbl.rows); if(rows.length<3)return;
    var header=rows[0], body=rows.slice(1);
    var s=state.get(tbl)||{}; var asc=(s.col===ci)?!s.asc:false; state.set(tbl,{col:ci,asc:asc});
    body.sort(function(a,b){var x=cv(a.cells[ci]),y=cv(b.cells[ci]);return x<y?(asc?-1:1):x>y?(asc?1:-1):0;});
    body.forEach(function(r){tbl.appendChild(r);});
    [].forEach.call(header.cells,function(th){th.classList.remove('lpcc-sorted','lpcc-asc');});
    header.cells[ci].classList.add('lpcc-sorted'); if(asc)header.cells[ci].classList.add('lpcc-asc');
  }
  function filt(q){
    q=(q||'').toLowerCase().trim(); var shown=0,total=0;
    document.querySelectorAll('table').forEach(function(tbl){
      if(!tbl.__enh)return;
      [].slice.call(tbl.rows).slice(1).forEach(function(r){
        total++; var ok=!q||r.textContent.toLowerCase().indexOf(q)>=0;
        r.style.display=ok?'':'none'; if(ok)shown++;
      });
    });
    var c=document.getElementById('lpcc-count'); if(c)c.textContent=q?(shown+' matching rows'):'';
  }
  function init(){
    var st=document.createElement('style');
    st.textContent='table th{cursor:pointer;user-select:none}'
      +'table th.lpcc-sorted::after{content:" \\25BE";font-size:.8em}'
      +'table th.lpcc-asc::after{content:" \\25B4"}'
      +'#lpcc-bar{position:sticky;top:8px;z-index:20;display:flex;gap:10px;align-items:center;'
      +'flex-wrap:wrap;margin:0 0 16px;background:#fff;border:1px solid #e1e7e3;border-left:4px solid #0a5b3a;'
      +'border-radius:12px;padding:11px 16px;box-shadow:0 2px 8px rgba(26,34,30,.12)}'
      +'#lpcc-bar b{color:#0a5b3a}#lpcc-bar input{flex:1;min-width:220px;padding:10px 12px;'
      +'border:1px solid #ccd3cc;border-radius:8px;font-size:15px}#lpcc-count{color:#64716a;font-size:13px}';
    document.head.appendChild(st);
    document.querySelectorAll('table').forEach(function(tbl){
      if(tbl.rows.length<3)return; tbl.__enh=true;
      [].forEach.call(tbl.rows[0].cells,function(th,ci){th.title='Sort by '+(th.textContent||'').trim();
        th.addEventListener('click',function(){sortTable(tbl,ci);});});
    });
    var card=document.querySelector('div[style*="box-shadow"]');
    var container=card?card.parentNode:document.body;
    var bar=document.createElement('div'); bar.id='lpcc-bar';
    bar.innerHTML='<b>🔍 Search</b><input type="search" placeholder="player, opposition, year…" autocomplete="off"><span id="lpcc-count"></span>';
    container.insertBefore(bar, card?card.nextSibling:container.firstChild);
    bar.querySelector('input').addEventListener('input',function(){filt(this.value);});
    var tip=document.createElement('div'); tip.style.cssText='color:#8fa096;font-size:12px;margin:-8px 0 14px;text-align:center';
    tip.textContent='Tip: click any column heading to sort.'; container.insertBefore(tip,bar.nextSibling);
  }
  if(document.readyState!=='loading')init(); else document.addEventListener('DOMContentLoaded',init);
})();
