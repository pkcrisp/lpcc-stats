
(function(){
  var P = window.LPCC_PLAYERS || {};
  var STATS_URL = "https://stats.lintonparkcricketclub.co.uk/stats.html";
  // normalised name -> canonical key
  var idx = {};
  function norm(s){return (s||'').toLowerCase().replace(/\s+/g,' ').trim();}
  Object.keys(P).forEach(function(n){ idx[norm(n)] = n; });

  function match(text){
    var t = norm(text);
    if (idx[t]) return idx[t];
    var m = t.match(/^(.+?)\s*\([^)]*\)$/);   // "Name (3)" -> "Name"
    if (m && idx[m[1]]) return idx[m[1]];
    return null;
  }

  function linkNames(){
    document.querySelectorAll('td').forEach(function(td){
      if (td.querySelector('a') || td.dataset.plDone) return;
      td.dataset.plDone = '1';
      var who = match(td.textContent);
      if (!who) return;
      var a = document.createElement('a');
      a.href = '#'; a.className = 'lpcc-pl'; a.dataset.p = who;
      a.textContent = td.textContent.trim();
      td.textContent = ''; td.appendChild(a);
    });
  }

  function num(v){ return (v===null||v===undefined) ? '–' : v; }
  function rcol(r){return r>=6?'#8e44ad':r>=4?'#1769d1':r>=2?'#12a06a':r>=1?'#0a5b3a':'#c9d3cd';}
  function pcWheel(shots, mirror){
    var R=140,cx=R+8,cy=R+8,sz=2*(R+8);
    var maxl=0; shots.forEach(function(p){if(p[1]>maxl)maxl=p[1];}); maxl=maxl||60;
    var s='<svg viewBox="0 0 '+sz+' '+sz+'" style="width:100%;max-width:320px;height:auto;display:block;margin:0 auto">';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="#f2f8f4" stroke="#cfe0d6"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R*0.6)+'" fill="none" stroke="#e0ebe4" stroke-dasharray="3 4"/>';
    s+='<line x1="'+cx+'" y1="'+(cy-R)+'" x2="'+cx+'" y2="'+(cy+R)+'" stroke="#e0ebe4"/>';
    s+='<line x1="'+(cx-R)+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#e0ebe4"/>';
    shots.forEach(function(p){var ang=mirror?(360-p[0])%360:p[0],rad=ang*Math.PI/180,len=R*Math.min(1,p[1]/maxl);
      var x=cx+len*Math.sin(rad),y=cy-len*Math.cos(rad);
      s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+rcol(p[2])+'" stroke-width="'+(p[2]>=4?1.8:1)+'" opacity="0.7"/>';
    });
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="#1a221e"/></svg>';
    return s;
  }
  // a heat strip: one cell per slot 1..n, shaded by share of innings, count inside
  function heat(rows, key, n, label1){
    var by = {}, max = 0;
    rows.forEach(function(r){ by[r[key]] = r.inns; if(r.inns>max) max=r.inns; });
    var cells = '';
    for (var i=1;i<=n;i++){
      var v = by[i]||0, t = max?v/max:0;
      var bg = v ? 'rgba(10,91,58,'+(0.14+0.82*t).toFixed(2)+')' : '#f1f4f2';
      var fg = t>0.55 ? '#fff' : '#3a463f';
      var lbl = (i===1&&label1) ? label1 : i;
      cells += '<div class="pc-hcell" style="background:'+bg+';color:'+fg+'" title="'
             + (label1?'':'Position ')+lbl+': '+v+' inns">'
             + '<span class="pc-hv">'+(v||'')+'</span>'
             + '<span class="pc-hp">'+lbl+'</span></div>';
    }
    return '<div class="pc-heat">'+cells+'</div>';
  }
  function grid(title, pairs){
    var cells = pairs.filter(function(p){return p;}).map(function(p){
      return '<div class="pc-stat"><span class="pc-n">'+num(p[1])+'</span>'
           + '<span class="pc-l">'+p[0]+'</span></div>';
    }).join('');
    return '<div class="pc-group"><h4>'+title+'</h4><div class="pc-grid">'+cells+'</div></div>';
  }

  function card(who){
    var d = P[who]; if(!d) return '';
    var h = '<div class="pc-hd"><h3>'+who+'</h3><span class="pc-sub">'
          + (d.mat||0)+' match'+(d.mat===1?'':'es')+' for Linton Park</span></div>';
    if (d.bat) h += grid('🏏 Batting', [
      ['Inns', d.bat.inns], ['Runs', d.bat.runs], ['Avg', num(d.bat.avg)],
      ['HS', d.bat.hs], ['SR', num(d.bat.sr)], ['50s', d.bat.f50],
      ['100s', d.bat.f100], ['0s', d.bat.ducks], ['NO', d.bat.no]]);
    if (d.bowl && d.bowl.wkts) h += grid('⚾ Bowling', [
      ['Overs', d.bowl.overs], ['Wkts', d.bowl.wkts], ['Avg', num(d.bowl.avg)],
      ['Econ', num(d.bowl.econ)], ['Best', d.bowl.best],
      ['5w', d.bowl.f5], ['Mdns', d.bowl.maidens]]);
    if (d.field && d.field.total) h += grid('🧤 Fielding', [
      ['Catches', d.field.catches], ['Stump.', d.field.st],
      ['Run-outs', d.field.ro], ['Total', d.field.total]]);
    var seas = (d.seasons||[]).filter(function(r){
      return r.runs||r.wkts||r.dis||r.mat; });
    if (seas.length){
      h += '<div class="pc-group"><h4>📅 By season</h4><div class="pc-tw"><table class="pc-tbl">'
         + '<thead><tr><th>Season</th><th>M</th><th>Runs</th><th>HS</th>'
         + '<th>Wkts</th><th>Best</th><th>C/S/R</th></tr></thead><tbody>'
         + seas.map(function(r){ return '<tr><td>'+r.s+'</td><td>'+r.mat+'</td><td>'
             + r.runs+'</td><td>'+r.hs+'</td><td>'+r.wkts+'</td><td>'
             + (r.best||'-')+'</td><td>'+r.dis+'</td></tr>'; }).join('')
         + '</tbody></table></div></div>';
    }
    var bp = (d.bypos||[]).filter(function(r){return r.inns;});
    if (bp.length){
      h += '<details class="pc-group pc-det"><summary>🪜 By batting position</summary>'
         + heat(bp, 'pos', 11, null)
         + '<div class="pc-tw"><table class="pc-tbl">'
         + '<thead><tr><th>Pos</th><th>Inns</th><th>NO</th><th>Runs</th><th>HS</th>'
         + '<th>Avg</th><th>50s</th><th>100s</th><th>0s</th></tr></thead><tbody>'
         + bp.map(function(r){ return '<tr><td>#'+r.pos+'</td><td>'+r.inns+'</td><td>'
             + r.no+'</td><td>'+r.runs+'</td><td>'+r.hs+'</td><td>'+num(r.avg)+'</td><td>'
             + r.f50+'</td><td>'+r.f100+'</td><td>'+r.ducks+'</td></tr>'; }).join('')
         + '</tbody></table></div></details>';
    }
    var bo = (d.byorder||[]).filter(function(r){return r.inns;});
    if (bo.length){
      h += '<details class="pc-group pc-det"><summary>🎚️ By bowling order</summary>'
         + heat(bo, 'seq', Math.max.apply(null, bo.map(function(r){return r.seq;})), 'O')
         + '<div class="pc-tw"><table class="pc-tbl">'
         + '<thead><tr><th>Order</th><th>Inns</th><th>Overs</th><th>Wkts</th><th>Runs</th>'
         + '<th>Avg</th><th>Econ</th><th>Mdns</th></tr></thead><tbody>'
         + bo.map(function(r){ return '<tr><td>'+(r.seq===1?"Open":"#"+r.seq)+'</td><td>'
             + r.inns+'</td><td>'+r.overs+'</td><td>'+r.wkts+'</td><td>'+r.runs+'</td><td>'
             + num(r.avg)+'</td><td>'+num(r.econ)+'</td><td>'+r.maidens+'</td></tr>'; }).join('')
         + '</tbody></table></div></details>';
    }
    var sh=(d.shots||[]);
    if(sh.length>=8){
      var hd=d.hand, mir=(hd==='L');
      h += '<details class="pc-det"><summary>🎯 Career wagon wheel</summary>'
         + '<p style="color:#64716a;font-size:.78rem;margin:6px 0">'+sh.length+' scoring shots '
         + '(electronic era)'+(hd?' · '+hd+'H bat':'')+' — <span style="color:#0a5b3a">1-3</span>, '
         + '<span style="color:#1769d1">four</span>, <span style="color:#8e44ad">six</span>.</p>'
         + pcWheel(sh, mir) + '</details>';
    }
    h += '<a class="pc-full" target="_blank" rel="noopener" href="'+STATS_URL
       + '#p='+encodeURIComponent(who)+'">Full match-by-match record on the Statistics page →</a>';
    return h;
  }

  var back, box;
  function ensure(){
    if (back) return;
    back = document.createElement('div'); back.id='pc-back';
    box = document.createElement('div'); box.id='pc-box';
    box.innerHTML = '<button id="pc-x" aria-label="Close">×</button><div id="pc-body"></div>';
    back.appendChild(box); document.body.appendChild(back);
    back.addEventListener('click', function(e){ if(e.target===back) close(); });
    box.querySelector('#pc-x').addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
  }
  function open(who){ if(!P[who]) return; ensure(); box.querySelector('#pc-body').innerHTML = card(who);
    box.scrollTop=0; back.style.display='flex'; }
  function close(){ if(back) back.style.display='none'; }

  function style(){
    var s=document.createElement('style');
    s.textContent =
     'a.lpcc-pl{color:inherit;text-decoration:none;border-bottom:1px dotted #0a5b3a;cursor:pointer}'
    +'a.lpcc-pl:hover{color:#0a5b3a;background:#eef6f1}'
    +'#pc-back{display:none;position:fixed;inset:0;background:rgba(20,28,24,.55);'
    +'z-index:1000;align-items:flex-start;justify-content:center;padding:24px;overflow:auto}'
    +'#pc-box{position:relative;background:#fff;border-radius:16px;max-width:640px;width:100%;'
    +'padding:22px 24px 26px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:Arial,Helvetica,sans-serif}'
    +'#pc-x{position:absolute;top:12px;right:14px;border:none;background:#f2f7f4;width:32px;height:32px;'
    +'border-radius:50%;font-size:20px;line-height:1;cursor:pointer;color:#0a5b3a}'
    +'.pc-hd h3{color:#0a5b3a;margin:0 30px 2px 0;text-transform:uppercase;font-size:1.4rem}'
    +'.pc-sub{color:#64716a;font-size:.85rem}'
    +'.pc-group{margin-top:16px}.pc-group h4{margin:0 0 8px;color:#d9322a;font-size:.8rem;'
    +'text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e1e7e3;padding-bottom:4px}'
    +'.pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:8px}'
    +'.pc-stat{background:#f4f6f4;border-radius:9px;padding:8px 6px;text-align:center}'
    +'.pc-n{display:block;font-size:1.15rem;font-weight:bold;color:#1a221e;font-variant-numeric:tabular-nums}'
    +'.pc-l{display:block;font-size:.66rem;color:#64716a;text-transform:uppercase;letter-spacing:.4px}'
    +'.pc-tw{overflow-x:auto}.pc-tbl{border-collapse:collapse;width:100%;font-size:.82rem;'
    +'font-variant-numeric:tabular-nums}.pc-tbl th{background:#0a5b3a;color:#fff;padding:5px 8px;'
    +'text-align:left;font-size:.68rem;text-transform:uppercase}.pc-tbl td{padding:5px 8px;'
    +'border-bottom:1px solid #eef1ee}.pc-tbl tbody tr:nth-child(even) td{background:#f6faf7}'
    +'.pc-full{display:inline-block;margin-top:18px;color:#0a5b3a;font-weight:bold;text-decoration:none;'
    +'border:1px solid #0a5b3a;border-radius:8px;padding:8px 14px;font-size:.85rem}'
    +'.pc-full:hover{background:#0a5b3a;color:#fff}'
    +'.pc-det>summary{cursor:pointer;color:#d9322a;font-size:.8rem;font-weight:700;'
    +'text-transform:uppercase;letter-spacing:.3px;list-style:none;margin-bottom:8px;'
    +'display:flex;align-items:center;gap:6px}'
    +'.pc-det>summary::after{content:"▸";margin-left:auto;transition:transform .15s}'
    +'.pc-det[open]>summary::after{transform:rotate(90deg)}'
    +'.pc-heat{display:flex;gap:3px;margin:0 0 12px;flex-wrap:wrap}'
    +'.pc-hcell{flex:1 1 0;min-width:30px;border-radius:6px;padding:6px 2px;text-align:center;'
    +'display:flex;flex-direction:column;align-items:center;line-height:1.15}'
    +'.pc-hv{font-weight:700;font-size:.82rem;font-variant-numeric:tabular-nums;min-height:1em}'
    +'.pc-hp{font-size:.6rem;opacity:.8;text-transform:uppercase}';
    document.head.appendChild(s);
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a.lpcc-pl');
    if (a){ e.preventDefault(); open(a.dataset.p); }
  });
  function init(){ style(); linkNames(); }
  if (document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded', init);
  // re-link after the enhance.js search/sort layer re-renders rows
  window.LPCC_linkNames = linkNames;
})();
