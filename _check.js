
(function(){
  function showFatal(msg){
    var f=document.getElementById("fatal");
    if(f){f.style.display="block";f.textContent="⚠️ 页面出错了："+msg+"（请把这行字截图发我，我马上修）";}
  }
  window.addEventListener("error",function(e){showFatal(e.message||String(e.error||"未知错误"));});

  try{
    const KEY="keke-album-v2";
    const PLACEHOLDER="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f2ed'/><text x='50%' y='50%' font-size='20' fill='%23999' text-anchor='middle' dominant-baseline='middle'>可可的作品</text></svg>");
    let items=load();
    let curationMode=false;

    function load(){
      try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r);if(d&&d.items)return d.items;}}catch(e){}
      return [];
    }
    function save(){localStorage.setItem(KEY,JSON.stringify({items}));}
    function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
    function esc(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
    function st(i){return i.status==="candidate"?"new":(i.status||"new");}
    function isHeic(f){return /image\/heic|image\/heif/i.test(f.type) || /\.heic$/i.test(f.name||"");}

    const gallery=document.getElementById("gallery");
    const emptyTip=document.getElementById("emptyTip");
    const bookList=document.getElementById("bookList");
    const bookCount=document.getElementById("bookCount");
    const curationChk=document.getElementById("curationChk");
    const curationView=document.getElementById("curationView");
    const curationList=document.getElementById("curationList");
    const printArea=document.getElementById("printArea");

    // ---------- 画廊（首页）----------
    function render(){
      const list=items.filter(i=>st(i)==="new"||st(i)==="selected");
      list.sort((a,b)=> (a.date<b.date?1:-1));
      gallery.innerHTML=list.map(i=>{
        const selected=st(i)==="selected";
        const action = selected
          ? `<div class="storetag">✅ 已收进书里<small>点「改主意」可退回 / 不要</small></div>
             <div class="bigbtns" style="margin-top:8px;">
               <button class="big undo" data-act="undo" data-id="${i.id}">改主意</button>
               <button class="big no" data-act="ignore" data-id="${i.id}">不要</button>
             </div>`
          : `<div class="bigbtns">
               <button class="big yes" data-act="select" data-id="${i.id}">❤️ 收进书里</button>
               <button class="big no" data-act="ignore" data-id="${i.id}">不要</button>
             </div>`;
        return `<div class="card" data-id="${i.id}">
          <div class="imgwrap"><img src="${i.img||PLACEHOLDER}" alt="可可的作品"></div>
          <div class="body">
            <div class="date">📅 ${i.date}</div>
            ${action}
            <div class="story-label">可可讲的故事（照她说的写，跟画对不对得上都行）</div>
            <textarea class="story" data-id="${i.id}" placeholder="可可说…">${esc(i.story)}</textarea>
            <button class="morelink" data-toggle="${i.id}">✎ 加标题 / 策展解析</button>
            <div class="details" data-details="${i.id}">
              <input type="text" class="d-title" placeholder="中文标题（可选）" value="${esc(i.title)}">
              <input type="text" class="d-en en" placeholder="English curatorial title" value="${esc(i.enTitle)}">
              <textarea class="d-analysis" placeholder="从策展角度解析这幅画（线上展厅/打印用）">${esc(i.analysis)}</textarea>
            </div>
          </div>
        </div>`;
      }).join("");
      emptyTip.style.display=list.length?"none":"block";
      bindCards();
      if(curationMode) buildCuration();
    }

    function bindCards(){
      gallery.querySelectorAll(".card").forEach(function(card){
        const id=card.dataset.id;
        const it=items.find(x=>x.id===id);
        if(!it)return;
        card.querySelectorAll("[data-act]").forEach(function(b){
          b.onclick=function(){
            const a=b.dataset.act;
            if(a==="select"){it.status="selected";save();render();focusStory(id);}
            else if(a==="ignore"){it.status="ignored";save();render();}
            else if(a==="undo"){it.status="new";save();render();}
          };
        });
        const ta=card.querySelector(".story");
        ta.oninput=function(){it.story=ta.value;debouncedSave();};
        card.querySelector("[data-toggle]").onclick=function(){card.classList.toggle("open");};
        const t=card.querySelector(".d-title"); t.oninput=function(){it.title=t.value;debouncedSave();};
        const e=card.querySelector(".d-en"); e.oninput=function(){it.enTitle=e.value;debouncedSave();};
        const an=card.querySelector(".d-analysis"); an.oninput=function(){it.analysis=an.value;debouncedSave();};
      });
    }
    function focusStory(id){setTimeout(function(){const c=gallery.querySelector('.card[data-id="'+id+'"] .story');if(c){c.focus();c.scrollIntoView({behavior:"smooth",block:"center"});}},60);}
    let st_save;function debouncedSave(){clearTimeout(st_save);st_save=setTimeout(save,400);}

    // ---------- 我的书 ----------
    function renderBook(){
      const sel=items.filter(i=>st(i)==="selected").sort((a,b)=>a.date.localeCompare(b.date));
      bookCount.textContent="已收进 "+sel.length+" 张";
      document.getElementById("printCountTip").textContent="共 "+sel.length+" 张入选作品";
      bookList.innerHTML=sel.length?sel.map(i=>`
        <div class="bookitem">
          <img src="${i.img||PLACEHOLDER}">
          <div class="t">
            <div class="ti">${i.title?esc(i.title):"（未起名）"}</div>
            <div class="st">${i.story?esc(i.story).slice(0,40):"（还没写故事）"}</div>
          </div>
        </div>`).join(""):'<div class="empty">还没有收进书里的作品～<br>去「画册」点 ❤️ 收进书里 吧。</div>';
    }

    // ---------- 页面切换 ----------
    function show(page){
      const home=document.getElementById("home"), book=document.getElementById("book");
      document.querySelectorAll("nav.bottom button").forEach(b=>b.classList.toggle("on",b.dataset.page===page));
      if(page==="book"){home.style.display="none";book.style.display="block";curationView.classList.remove("active");curationMode=false;renderBook();window.scrollTo(0,0);}
      else{home.style.display="block";book.style.display="none";curationView.classList.remove("active");curationMode=false;render();window.scrollTo(0,0);}
    }

    // ---------- 加图 ----------
    async function convertHeic(file){
      if(typeof heic2any==="undefined"){throw new Error("HEIC 库未加载（请保持联网）");}
      const r=await heic2any({blob:file,toType:"image/jpeg",quality:0.9});
      const blob=Array.isArray(r)?r[0]:r;
      return new File([blob],(file.name||"image").replace(/\.heic$/i,".jpg"),{type:"image/jpeg"});
    }
    function processImage(file, cb){
      const reader=new FileReader();
      reader.onload=function(ev){
        const img=new Image();
        img.onload=function(){
          const maxDim=1400;let w=img.width,h=img.height;
          if(w>maxDim||h>maxDim){const r=maxDim/Math.max(w,h);w=Math.round(w*r);h=Math.round(h*r);}
          const c=document.createElement("canvas");c.width=w;c.height=h;
          const ctx=c.getContext("2d");
          const stt=64,tmp=document.createElement("canvas");tmp.width=stt;tmp.height=stt;
          const tt=tmp.getContext("2d");tt.drawImage(img,0,0,stt,stt);
          const d=tt.getImageData(0,0,stt,stt).data;
          let sum=0,n=d.length/4,min=255,max=0;
          for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;sum+=l;min=Math.min(min,l);max=Math.max(max,l);}
          const mean=sum/n,range=max-min;
          let b=mean<110?1+0.35*(110-mean)/110:mean>180?1-0.15*(mean-180)/75:1;
          let ct=range<55?1+0.35*(55-range)/55:1;
          b=Math.max(0.85,Math.min(1.4,b));ct=Math.max(1,Math.min(1.45,ct));
          ctx.filter="brightness("+b+") contrast("+ct+") saturate(1.08)";
          ctx.drawImage(img,0,0,w,h);ctx.filter="none";
          cb(c.toDataURL("image/jpeg",0.88));
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    }
    async function addFiles(files){
      for(const file of files){
        let f=file;
        if(isHeic(f)){try{f=await convertHeic(f);}catch(e){alert("HEIC 转换失败："+e.message);continue;}}
        processImage(f,function(data){
          items.unshift({id:"i"+Date.now()+Math.random().toString(36).slice(2,6),img:data,date:today(),status:"new",title:"",enTitle:"",story:"",analysis:"",note:""});
          save();
        });
      }
      document.getElementById("fileInput").value="";
      render();
    }

    // 绑定：加一张（顶部 + 空状态）
    function bindAdd(){
      const fi=document.getElementById("fileInput");
      const openPicker=function(){fi.click();};
      document.getElementById("addBtn").addEventListener("click",openPicker);
      document.getElementById("emptyAdd").addEventListener("click",openPicker);
      fi.addEventListener("change",function(e){if(e.target.files&&e.target.files.length)addFiles(e.target.files);});
    }

    // ---------- 策展视图 ----------
    function buildCuration(){
      const sel=items.filter(i=>st(i)!=="ignored").sort((a,b)=>a.date.localeCompare(b.date));
      if(!sel.length){curationList.innerHTML='<div class="empty">没有可展示的作品～</div>';return;}
      curationList.innerHTML=sel.map(i=>`
        <div class="curation-card">
          <img src="${i.img||PLACEHOLDER}" alt="">
          <div class="ccap">
            ${i.enTitle?`<div class="cen">${esc(i.enTitle)}</div>`:''}
            ${i.title?`<div class="ctitle">${esc(i.title)}</div>`:''}
            ${i.analysis?`<div class="canalysis">${esc(i.analysis)}</div>`:''}
            ${i.story?`<div class="cstory">${esc(i.story)}</div>`:''}
          </div>
        </div>`).join("");
    }
    document.getElementById("viewBtn").addEventListener("click",function(){
      curationMode=true;document.getElementById("home").style.display="none";document.getElementById("book").style.display="none";
      curationView.classList.add("active");buildCuration();window.scrollTo(0,0);
    });

    // ---------- 打印 ----------
    function buildPrint(booklet){
      const sel=items.filter(i=>st(i)==="selected").sort((a,b)=>a.date.localeCompare(b.date));
      if(!sel.length){alert("还没有「收进书里」的作品哦～ 先去「画册」点 ❤️ 收进书里");return false;}
      const includeC=curationChk.checked;
      printArea.className="print-area"+(booklet?" booklet":"");
      printArea.innerHTML=sel.map((i,idx)=>`
        <div class="print-page">
          <div class="print-headbook">Coco's Book · 可可的书</div>
          <div class="print-img"><img src="${i.img||PLACEHOLDER}"></div>
          <div class="print-caption">
            ${includeC && i.enTitle?`<div class="print-en">${esc(i.enTitle)}</div>`:''}
            ${i.title?`<div class="print-title">${esc(i.title)}</div>`:''}
            ${includeC && i.analysis?`<div class="print-analysis">${esc(i.analysis)}</div>`:''}
            <div class="print-story">${i.story?esc(i.story):'<span class="muted">（可可还没讲这个故事）</span>'}</div>
          </div>
          <div class="print-foot">第 ${idx+1} 页 · ${i.date}</div>
        </div>`).join("");
      return true;
    }
    function doPrint(booklet){
      if(!buildPrint(booklet))return;
      document.getElementById("printOverlay").classList.remove("show");
      window.onafterprint=function(){window.location.reload();};
      window.print();
    }
    document.getElementById("printBtn").addEventListener("click",function(){
      const n=items.filter(i=>st(i)==="selected").length;
      document.getElementById("printCountTip").textContent="共 "+n+" 张入选作品";
      document.getElementById("printOverlay").classList.add("show");
    });
    document.getElementById("optA4").addEventListener("click",function(){doPrint(false);});
    document.getElementById("optBook").addEventListener("click",function(){doPrint(true);});
    document.getElementById("printCancel").addEventListener("click",function(){document.getElementById("printOverlay").classList.remove("show");});

    // ---------- 导出/导入 ----------
    document.getElementById("exportBtn").addEventListener("click",function(){
      const blob=new Blob([JSON.stringify({items},null,2)],{type:"application/json"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="可可的书_"+today()+".json";a.click();
    });
    document.getElementById("importBtn").addEventListener("click",function(){document.getElementById("importInput").click();});
    document.getElementById("importInput").addEventListener("change",function(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();r.onload=function(ev){try{const d=JSON.parse(ev.target.result);if(d.items){items=d.items;save();render();renderBook();alert("导入成功！");}}catch(err){alert("文件格式不对～");}};
      r.readAsText(f);e.target.value="";
    });

    // ---------- 引导/帮助 ----------
    if(localStorage.getItem("keke-album-seen")){document.getElementById("guide").style.display="none";}
    document.getElementById("guideX").addEventListener("click",function(){document.getElementById("guide").style.display="none";localStorage.setItem("keke-album-seen","1");});
    document.getElementById("helpBtn").addEventListener("click",function(){document.getElementById("helpOverlay").classList.add("show");});
    document.getElementById("helpClose").addEventListener("click",function(){document.getElementById("helpOverlay").classList.remove("show");});

    // 底部 Tab（脚本已在 nav 之后，元素已存在）
    document.querySelectorAll("nav.bottom button").forEach(b=>b.addEventListener("click",function(){show(b.dataset.page);}));

    bindAdd();
    render();
  }catch(err){
    showFatal((err&&err.message)||String(err));
  }
})();
