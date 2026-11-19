const $=s=>document.querySelector(s);
const esc=t=>(t||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const loadJS=src=>window.heic2any?Promise.resolve():new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.onload=ok;e.onerror=no;document.head.append(e)});

/* ===== BATAS UKURAN FONT (px) =====
   Teks otomatis mengecil sampai batas MIN, setelah itu input dihentikan.
   Naikkan MIN kalau mau teks lebih besar (muatan jadi lebih sedikit), turunkan kalau mau muat lebih banyak. */
const MAX_BOX=30, MIN_BOX=24;   // isi kotak
const MIN_NAME=34;              // nama
const MIN_LINE=22;              // jurusan / universitas
const DD={name:40,line:21,minName:30,minLine:18};   // ukuran font khusus double degree
const W_SINGLE=470, W_DOUBLE=548;   // lebar area teks di plat nama

const D='#fbf1de',L='#7a1c22';
const SEM={
 2:{img:'p3_2.png',lab:['Semester 1','Semester 2'],b:[[70,432,502,812],[561,501,993,881]]},
 3:{img:'p3_3.png',lab:['Semester 1','Semester 2','Semester 3'],b:[[70,312,502,691],[561,381,993,761],[321,847,752,1227]]},
 4:{img:'p3_4.png',lab:['Semester 1','Semester 2','Semester 3','Semester 4'],b:[[70,317,502,697],[559,374,991,754],[70,839,502,1219],[561,880,993,1260]]},
 6:{img:'p3_6.png',lab:['Semester 1-2','Semester 3-4','Semester 5-6'],b:[[70,317,502,697],[559,363,991,743],[340,847,772,1227]]},
 8:{img:'p3.png',lab:['Semester 1-2','Semester 3-4','Semester 5-6','Semester 7-8'],b:[[69,316,502,697],[558,372,992,754],[69,838,502,1219],[560,879,994,1260]]}};
const PAGES=[
 {t:'Twibbon',k:'tw'},
 {t:'Potensi diri',k:'ps',img:'p2.png',col:D,boxes:[['Personal Strengths','a',66,412,531,765],['Academic Expertise','b',571,405,1025,760],['Meaningful Experiences','c',56,862,531,1215],['Areas for Development','d',555,858,1025,1210]]},
 {t:'Study plan',k:'sp',col:L},
 {t:'Life grand map',k:'lm',img:'p4.png',col:D,boxes:[['2026-2031','a',51,347,483,630],['2031-2036','b',626,480,1046,756],['2036-2041','c',46,772,484,1060],['2041-Beyond','d',626,923,1059,1209]]},
 {t:'Community & goals',k:'cg',img:'p5.png',col:L,boxes:[['Community Services','a',74,407,1003,680],['Grand Goals Plan','b',74,795,1003,1053]]},
 {t:'Sampul',k:'cv',img:'p6.png',boxes:[]}];
const S={p:0,sem:null,deg:1,t:{},name:'',j1:'',u1:'',j2:'',u2:'',photo:null,zoom:1,ox:0,oy:0};
try{Object.assign(S,JSON.parse(localStorage.getItem('pk288')||'{}'));S.photo=null}catch(e){}
if(S.bidang&&!S.j1){S.j1=S.bidang;S.u1=S.univ||''}
const save=()=>{try{localStorage.setItem('pk288',JSON.stringify({...S,photo:null}))}catch(e){}};
const WIN={1:[153,228,793,1078],2:[148,246,784,1060]};   // [left, top, lebar, tinggi] jendela foto: 1 = satu gelar, 2 = double degree
function photoCss(){
  const [,,PW,PH]=WIN[S.deg];
  const s0=Math.max(PW/S.pw,PH/S.ph),k=s0*S.zoom,dw=S.pw*k,dh=S.ph*k;
  const cl=v=>Math.max(-1,Math.min(1,v||0));
  return `width:${dw}px;height:${dh}px;left:${(PW-dw)/2+cl(S.ox)*(dw-PW)/2}px;top:${(PH-dh)/2+cl(S.oy)*(dh-PH)/2}px`;
}
if(Math.abs(S.ox)>1||Math.abs(S.oy)>1){S.ox=0;S.oy=0}
const cur=p=>{if(p.k!=='sp')return p;const c=SEM[S.sem||8];return {...p,img:c.img,boxes:c.b.map((b,i)=>[c.lab[i],`${S.sem||8}_${i}`,...b])}};

/* ===== pengukur: apakah teks masih muat pada ukuran font minimum? ===== */
const MS=document.createElement('div');MS.id='ms';document.body.append(MS);
const fitsBox=(w,h)=>t=>{MS.className='bx';MS.style.cssText=`position:fixed;left:0;top:0;visibility:hidden;width:${w}px;height:${h}px;font-size:${MIN_BOX}px`;MS.textContent=t;return MS.scrollHeight<=MS.clientHeight+1};
const fitsLine=(w,px,title)=>t=>{MS.className='';MS.style.cssText=`position:fixed;left:0;top:0;visibility:hidden;white-space:nowrap;overflow:hidden;width:${w}px;font-size:${px}px;font-family:${title?"var(--f-title)":"var(--f-body)"};font-weight:${title?"var(--w-title)":"400"}`;MS.textContent=title?t.toUpperCase():t;return MS.scrollWidth<=MS.clientWidth+1};
const LONG='Mengikuti perkuliahan, riset, dan kegiatan organisasi untuk mengembangkan kemampuan serta kontribusi bagi masyarakat. '.repeat(40);
function limit(t,fits){if(fits(t))return t;let lo=0,hi=t.length;while(lo<hi){const m=(lo+hi+1)>>1;fits(t.slice(0,m))?lo=m:hi=m-1}return t.slice(0,lo)}
const cap=fits=>limit(LONG,fits).length;

/* ===== halaman ===== */
const chips=(n,label,opts,v)=>`<label>${label}</label><div class="chips" data-n="${n}">${opts.map(([o,t])=>`<button type="button" data-v="${o}" aria-pressed="${String(o)===String(v)}">${t}</button>`).join('')}</div>`;
const SEMCH=(v)=>chips('sem','Jumlah semester',[[2,'2'],[3,'3'],[4,'4'],[6,'6'],[8,'8']],v);
const DEGCH=(v)=>chips('deg','Gelar',[[1,'Satu gelar'],[2,'Double degree']],v);

function pageHTML(p0){
  const p=cur(p0),bg=`<img class="bg" alt="" src="assets/${p.k==='tw'?(S.deg===2?'p1d.png':'p1.png'):p.img}">`;
  if(p.k==='tw'){
    const dd=S.deg===2,img=S.photo&&S.pw?`<img alt="" src="${S.photo}" style="${photoCss()}">`:'';
    const ls=dd?[S.j1||'Jurusan 1',S.u1||'Universitas 1',S.j2||'Jurusan 2',S.u2||'Universitas 2']:[S.j1||'Bidang Pendidikan',S.u1||'Universitas'];
    const w=WIN[S.deg];
    return `<div class="ph" style="left:${w[0]}px;top:${w[1]}px;width:${w[2]}px;height:${w[3]}px">${img}</div>${bg}<div class="pl${dd?' dd':''}"><div class="nm fit" data-fs="${dd?DD.name:46}" data-min="${dd?DD.minName:MIN_NAME}">${esc((S.name||'NAMA LENGKAP').toUpperCase())}</div>${ls.map(l=>`<div class="ln fit" data-fs="${dd?DD.line:25}" data-min="${dd?DD.minLine:MIN_LINE}">${esc(l)}</div>`).join('')}</div>`;
  }
  return bg+p.boxes.map(([l,k,x1,y1,x2,y2])=>`<div class="bx" style="left:${x1}px;top:${y1}px;width:${x2-x1}px;height:${y2-y1}px;color:${p.col}">${esc(S.t[p.k+k])}</div>`).join('');
}
function fit(){
  document.querySelectorAll('#page .bx').forEach(e=>{let f=MAX_BOX;e.style.fontSize=f+'px';while(e.scrollHeight>e.clientHeight+1&&f>MIN_BOX){f--;e.style.fontSize=f+'px'}});
  document.querySelectorAll('#page .fit').forEach(e=>{let f=+e.dataset.fs;e.style.fontSize=f+'px';while(e.scrollWidth>e.clientWidth+1&&f>+e.dataset.min){f--;e.style.fontSize=f+'px'}});
}
function scale(){
  const o=$('#out'),w=o.parentElement.clientWidth,s=Math.min(w/1080,Math.max(.3,(innerHeight-60)/1440));
  o.style.width=1080*s+'px';o.style.height=1440*s+'px';$('#page').style.transform=`scale(${s})`;
}
function render(){$('#page').innerHTML=pageHTML(PAGES[S.p]);fit()}
function tabs(){
  $('#tabs').innerHTML=PAGES.map((p,i)=>`<button role="tab" data-i="${i}" aria-current="${i===S.p}">${i+1}. ${p.t}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{S.p=+b.dataset.i;save();tabs();form();render()});
}
/* kolom teks dengan batas otomatis */
function bindLimited(el,fits,get,set,cnt,capN){
  const show=()=>{cnt.textContent=`${el.value.length} / ±${capN} karakter`};show();
  el.oninput=()=>{const v=limit(el.value,fits);if(v!==el.value){el.value=v;cnt.classList.add('full');setTimeout(()=>cnt.classList.remove('full'),700)}set(v);show();save();render()};
}
function form(){
  const p=cur(PAGES[S.p]),f=$('#form');
  if(p.k==='tw'){
    const dd=S.deg===2,w=dd?W_DOUBLE:W_SINGLE;
    const fl=dd?[['j1','Jurusan 1'],['u1','Universitas 1'],['j2','Jurusan 2'],['u2','Universitas 2']]:[['j1','Bidang pendidikan'],['u1','Universitas']];
    f.innerHTML=DEGCH(S.deg)+`<label for="ph">Foto kamu</label><input type="file" id="ph" accept="image/*,.heic,.heif"><p class="note" id="st" role="status"></p>
    <label for="zm">Zoom</label><input type="range" id="zm" min="1" max="3" step="0.05" value="${S.zoom}">
    <label for="ox">Geser kiri-kanan</label><input type="range" id="ox" min="-1" max="1" step="0.01" value="${S.ox}">
    <label for="oy">Geser atas-bawah</label><input type="range" id="oy" min="-1" max="1" step="0.01" value="${S.oy}">
    <label for="f_name">Nama lengkap <small class="cnt" id="c_name"></small></label><input type="text" id="f_name" value="${esc(S.name)}" autocomplete="off">`+
    fl.map(([k,l])=>`<label for="f_${k}">${l} <small class="cnt" id="c_${k}"></small></label><input type="text" id="f_${k}" value="${esc(S[k])}" autocomplete="off">`).join('');
    $('#ph').onchange=async e=>{
      const f=e.target.files[0],st=$('#st');if(!f)return;
      try{
        let b=f;
        if(/hei[cf]/i.test(f.type)||/\.hei[cf]$/i.test(f.name)){
          st.textContent='Mengubah HEIC ke JPG...';await loadJS('heic2any.min.js');
          const r=await heic2any({blob:f,toType:'image/jpeg',quality:.92});b=Array.isArray(r)?r[0]:r;
        }
        const url=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(b)});
        const im=new Image();im.src=url;await im.decode();
        S.photo=url;S.pw=im.naturalWidth;S.ph=im.naturalHeight;S.zoom=1;S.ox=0;S.oy=0;
        $('#zm').value=1;$('#ox').value=0;$('#oy').value=0;
        st.textContent=Math.max(WIN[S.deg][2]/S.pw,WIN[S.deg][3]/S.ph)>1.3?`Foto ${S.pw}×${S.ph} terlalu kecil untuk jendela potret, hasil bisa buram. Pakai foto potret (mis. 3:4) minimal ±800×1060.`:'';render();
      }catch(err){st.textContent='Foto tidak bisa dibaca. Simpan sebagai JPG atau PNG, lalu coba lagi.'}
    };
    [['zm','zoom'],['ox','ox'],['oy','oy']].forEach(([id,k])=>$('#'+id).oninput=e=>{S[k]=+e.target.value;save();render()});
    const nf=fitsLine(w,dd?DD.minName:MIN_NAME,true);bindLimited($('#f_name'),nf,0,v=>S.name=v,$('#c_name'),cap(nf));
    const lf=fitsLine(w,dd?DD.minLine:MIN_LINE,false);fl.forEach(([k])=>bindLimited($('#f_'+k),lf,0,v=>S[k]=v,$('#c_'+k),cap(lf)));
  }else if(!p.boxes.length){
    f.innerHTML='<p class="note">Halaman sampul tidak perlu diisi. Tetap ikut terunduh di "Unduh semua halaman".</p>';
  }else{
    f.innerHTML=(p.k==='sp'?SEMCH(S.sem||8):'')+p.boxes.map(([l,k])=>`<label for="f_${p.k}${k}">${l} <small class="cnt" id="c_${p.k}${k}"></small></label><textarea id="f_${p.k}${k}"></textarea>`).join('');
    p.boxes.forEach(([l,k,x1,y1,x2,y2])=>{
      const key=p.k+k,el=$('#f_'+key),fb=fitsBox(x2-x1,y2-y1);
      el.value=limit(S.t[key]||'',fb);S.t[key]=el.value;
      bindLimited(el,fb,0,v=>S.t[key]=v,$('#c_'+key),cap(fb));
    });
  }
}
/* ===== pengaturan awal: jumlah semester & gelar ===== */
const dlg=$('#dlg');
if(!dlg.showModal)dlg.showModal=function(){this.setAttribute('open','')};
if(!dlg.close)dlg.close=function(){this.removeAttribute('open')};
function dlgBody(){$('#dlgBody').innerHTML=SEMCH(S.sem)+DEGCH(S.deg);$('#dlgOk').disabled=!S.sem}
function openCfg(){dlgBody();dlg.showModal()}
document.addEventListener('click',e=>{
  const b=e.target.closest('.chips button');if(!b)return;
  const n=b.parentElement.dataset.n;S[n]=+b.dataset.v;save();
  if(dlg.hasAttribute('open'))dlgBody();else{form();render()}
});
$('#dlgOk').onclick=()=>{dlg.close();form();render()};
dlg.addEventListener('cancel',e=>{if(!S.sem)e.preventDefault()});
$('#cfg').onclick=openCfg;

async function shot(i){
  const keep=S.p;S.p=i;render();await document.fonts.ready;fit();
  await Promise.all([...document.querySelectorAll('#page img')].map(im=>im.complete?1:new Promise(r=>im.onload=r)));
  const c=await html2canvas($('#page'),{scale:1,backgroundColor:null,useCORS:true,onclone:d=>{
    const e=d.getElementById('page');e.style.transform='none';e.parentElement.style.cssText='width:1080px;height:1440px;overflow:visible'}});
  const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=`pk288-${i+1}-${PAGES[i].k}.png`;a.click();
  S.p=keep;render();
}
async function run(fn){const b=[$('#dl1'),$('#dlAll')];b.forEach(x=>x.disabled=true);try{await fn()}catch(e){alert('Gagal mengunduh. Buka lewat alamat Vercel (https), bukan langsung dari file.')}b.forEach(x=>x.disabled=false)}
$('#dl1').onclick=()=>run(()=>shot(S.p));
$('#dlAll').onclick=()=>run(async()=>{for(let i=0;i<PAGES.length;i++){await shot(i);await new Promise(r=>setTimeout(r,400))}});
addEventListener('resize',scale);
tabs();form();render();scale();
document.fonts.ready.then(()=>{form();render();scale()});
if(!S.sem)openCfg();