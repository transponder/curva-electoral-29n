/* Kurba · Tu curva de valor electoral.
   Los datos se cargan de /data con js/datos.js; el cálculo está en js/cercania.js.
   Las respuestas del test solo existen en la memoria de esta pestaña: no se envían ni se guardan. */
(function(){
"use strict";

function errorCarga(err){
  if(window.console)console.error(err);
  var go=document.getElementById("go");if(!go)return;
  var box=document.createElement("div");box.className="error-carga small";box.setAttribute("role","alert");
  box.textContent=location.protocol==="file:"
    ?"Has abierto el archivo directamente. Para verlo en local, ejecuta en la carpeta del proyecto: python3 -m http.server 8000 y visita http://localhost:8000"
    :"No se han podido cargar los datos. Recarga la página; si el problema sigue, avísanos.";
  go.parentNode.insertBefore(box,go);
}
document.addEventListener("DOMContentLoaded",function(){
  window.KurbaDatos.cargar().then(iniciar).catch(errorCarga);
});

function iniciar(D){
var A=D.A,ED=D.ED,S=D.S,RES=D.RES,RESEU=D.RESEU,PEU=D.PEU,TX=D.TX,PNAME=D.PNAME,CODE=D.CODE,CODE_EU=D.CODE_EU,METHOD=D.METHOD,METHOD_EU=D.METHOD_EU,META=D.META;
var C=window.Cercania,MINT=C.MIN_TEMAS;
var AN=window.Analitica;AN.configurar(META.goatcounter);
function ev(n,u){AN.evento(n,u);}
var LANG="es";
var TITULO=document.title;

/* Colores de partido: salen de data/partidos.json («color» y, opcional, «color_oscuro»). */
(function(){
  var P=ED.eu.parties,el=document.createElement("style");
  el.textContent=":root{"+P.map(function(p){return"--s"+p.slot+":"+p.color;}).join(";")+"}"+
    "@media (prefers-color-scheme: dark){:root{"+P.map(function(p){return"--s"+p.slot+":"+p.colorOscuro;}).join(";")+"}}";
  document.head.appendChild(el);
})();

function t(k){var v=TX[LANG][k];return v===undefined?TX.es[k]:v;}
function an(a){return LANG==="eu"&&a.eu?a.eu.n:a.n;}
function aq(a){return LANG==="eu"&&a.eu?a.eu.q:a.q;}
function ao(a,v){return(LANG==="eu"&&a.eu?a.eu.o:a.o)[v-1];}
function pn(p){return LANG==="eu"&&PNAME[p.id]?PNAME[p.id]:p.n;}
function pct(a){return a===null?"–":LANG==="eu"?"% "+a:a+" %";}
function code(k){return(LANG==="eu"?CODE_EU:CODE)[k];}
function edName(){return LANG==="eu"?"Euskadi · A-29":E().name;}
/* Fecha de actualización (data/meta.json) en el idioma de la interfaz. */
var MESES={es:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
  eu:["urtarrilaren","otsailaren","martxoaren","apirilaren","maiatzaren","ekainaren","uztailaren","abuztuaren","irailaren","urriaren","azaroaren","abenduaren"]};
function fechaAct(){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(META.actualizado||"");if(!m)return"";
  var y=m[1],mes=MESES[LANG][+m[2]-1],d=+m[3];
  return LANG==="eu"?y+"ko "+mes+" "+d+"a":d+" de "+mes+" de "+y;
}
var CORREO=META.contacto_correcciones||"";
/* Sin año, para la etiqueta de estado: «22 de noviembre» / «azaroaren 22an». */
function fechaDia(){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(META.actualizado||"");if(!m)return"";
  var mes=MESES[LANG][+m[2]-1],d=+m[3];
  return LANG==="eu"?mes+" "+d+"an":d+" de "+mes;
}
function rellenar(x){return String(x).replace(/\{fecha\}/g,fechaAct()).replace(/\{fecha_dia\}/g,fechaDia()).replace(/\{correo\}/g,CORREO);}
function applyStatic(){
  [["t","textContent"],["th","innerHTML"]].forEach(function(m){
    Array.prototype.forEach.call(document.querySelectorAll("[data-"+m[0]+"]"),function(el){var k=el.getAttribute("data-"+m[0]);if(!(k in TX.es))TX.es[k]=el[m[1]];el[m[1]]=rellenar(t(k));});
  });
  [["ta","aria-label"],["talt","alt"]].forEach(function(m){
    Array.prototype.forEach.call(document.querySelectorAll("[data-"+m[0]+"]"),function(el){var k=el.getAttribute("data-"+m[0]);if(!(k in TX.es))TX.es[k]=el.getAttribute(m[1]);el.setAttribute(m[1],t(k));});
  });
  Array.prototype.forEach.call(document.querySelectorAll(".eu-only"),function(el){el.hidden=LANG!=="eu";});
}
function setLang(l){
  LANG=l;document.documentElement.lang=l;
  $("es").setAttribute("aria-pressed",l==="es");$("eu").setAttribute("aria-pressed",l==="eu");
  applyStatic();renderMethod();renderPaginas();renderQuienes();renderCorreo();
  if(curScreen()==="s-q")renderQ();
  recList("recs-start");
  if(st.res){exploreMode(!!st.explore);recList("recs-res");renderKey();renderAdjust();update(true);}
  if(curScreen()==="s-rec"&&curRec)openRec(curRec);
  titulo();
}

/* ---------- contenido en euskera: fichas y guías ---------- */
function pe(p){return LANG==="eu"?PEU[p.id]||null:null;}
function rr(r,k){var e=LANG==="eu"?RESEU[r.id]:null;return e&&e[k]!==undefined?e[k]:r[k];}
var curRec=null;

var st={ed:"eu",q:0,ans:[],w:[],sel:null,tab:"cer"};
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function safeUrl(u){return /^https?:\/\//.test(u||"")?esc(u):"#";}
var SCREENS=["s-start","s-q","s-res","s-rec","s-met","s-gl","s-priv","s-legal","s-about","s-404"];
function show(id){
  SCREENS.forEach(function(s){$(s).hidden=s!==id;});window.scrollTo(0,0);
  document.body.setAttribute("data-pantalla",id);
  marcar(true);foco(id);
}
function curScreen(){for(var i=0;i<SCREENS.length;i++)if(!$(SCREENS[i]).hidden)return SCREENS[i];return "s-start";}
function E(){return ED[st.ed];}
function NT(){return E().attrs.length;}
function attr(i){return A[E().attrs[i]];}
function partido(id){return E().parties.filter(function(p){return p.id===id;})[0];}
var CHEV='<svg class="ch" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
var EXT='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16L16 8M9 8h7v7"/></svg>';

function shape(t,x,y,r){
  var a,i,pts=[];
  if(t==="circle")return'<circle cx="'+x+'" cy="'+y+'" r="'+r+'"/>';
  if(t==="square")return'<rect x="'+(x-r*.9)+'" y="'+(y-r*.9)+'" width="'+r*1.8+'" height="'+r*1.8+'"/>';
  if(t==="cross"){var w=r*.42,l=r*1.1;return'<path d="M'+(x-w)+" "+(y-l)+"h"+2*w+"v"+(l-w)+"h"+(l-w)+"v"+2*w+"h"+(-(l-w))+"v"+(l-w)+"h"+(-2*w)+"v"+(-(l-w))+"h"+(-(l-w))+"v"+(-2*w)+"h"+(l-w)+'z"/>';}
  var n=t==="penta"?5:t==="diamond"?4:3,rot=t==="tridown"?Math.PI/2:-Math.PI/2,rr=t==="diamond"?r*1.2:t==="penta"?r*1.1:r*1.25;
  for(i=0;i<n;i++){a=rot+i*2*Math.PI/n;pts.push((x+rr*Math.cos(a)).toFixed(1)+","+(y+rr*Math.sin(a)).toFixed(1));}
  return'<polygon points="'+pts.join(" ")+'"/>';
}
function sw(p,s){s=s||14;return'<svg width="'+s+'" height="'+s+'" viewBox="0 0 14 14" aria-hidden="true" style="flex:none;fill:var(--s'+p.slot+')">'+shape(p.sh,7,7,4.6)+"</svg>";}
var youSw='<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex:none"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

/* ---------- idioma ---------- */
var toastT;
function toast(t){var el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true;},3200);}
$("es").addEventListener("click",function(){if(LANG!=="es")ev("idioma-es");setLang("es");});$("eu").addEventListener("click",function(){if(LANG!=="eu")ev("idioma-eu");setLang("eu");});

/* ---------- guías y método ---------- */
var prevScreen="s-gl";
function openRec(id){
  var r=RES.filter(function(x){return x.id===id;})[0];if(!r)return false;
  var c=curScreen();if(c!=="s-rec")prevScreen=c==="s-res"?"s-res":"s-gl";curRec=id;
  $("rec-t").textContent=rr(r,"t");
  $("rec-b").innerHTML=rr(r,"b").join("");
  $("rec-src").innerHTML=r.src.length?'<div class="stack" style="gap:8px"><h3>'+t("src_h")+'</h3><ul class="pts card">'+r.src.map(function(k){return'<li><a href="'+safeUrl(S[k].u)+'" target="_blank" rel="noopener">'+esc(S[k].t)+" ↗</a></li>";}).join("")+"</ul></div>":"";
  $("rec-more").innerHTML=RES.filter(function(x){return x.id!==id;}).map(function(x){return'<button class="reclink" data-rec="'+x.id+'">'+esc(rr(x,"t"))+"</button>";}).join("");
  show("s-rec");
  return true;
}
function recList(el){
  $(el).innerHTML=RES.map(function(x){return'<button class="reclink" data-rec="'+x.id+'"><span>'+esc(rr(x,"q"))+"</span><b>"+esc(rr(x,"t"))+" →</b></button>";}).join("");
}
document.addEventListener("click",function(e){var b=e.target.closest("[data-rec]");if(b){e.preventDefault();ev("recurso-"+b.dataset.rec);openRec(b.dataset.rec);}});
$("rec-back").addEventListener("click",function(){show(prevScreen);if(prevScreen==="s-res")setTab(st.tab);});
function renderMethod(){
  var h=(LANG==="eu"?METHOD_EU:METHOD).map(function(x){return"<p>"+esc(x)+"</p>";}).join("")+
    (META.codebook?'<p><a href="'+esc(META.codebook)+'" target="_blank" rel="noopener">'+t("cb_link")+" ↗</a></p>":"")+
    '<p><a href="#/metodologia">'+esc(t("met_full"))+" →</a></p>";
  $("met-body").innerHTML=h;document.querySelector("#method-res .method").innerHTML=h;
}
renderMethod();
/* Las páginas de texto devuelven listas con huecos (null) y sublistas: se aplanan antes de pintarlas. */
function nodos(x){var o=[];(function f(y){if(y==null||y===false)return;if(Array.isArray(y))y.forEach(f);else o.push(y);})(x);return o;}
function pintar(id,x){var el=$(id);el.replaceChildren.apply(el,nodos(x));}
function renderPaginas(){
  var KP=window.KurbaPaginas;
  pintar("met-full",KP.metodologia(D,C,LANG));
  pintar("priv-body",KP.privacidad(D,LANG));
  pintar("legal-body",KP.avisoLegal(D,LANG));
}
renderPaginas();
function renderQuienes(){
  var q=window.KurbaPaginas.quienes(D,LANG);
  $("quienes").hidden=!q;
  if(!q)return;
  /* En la portada, los dos primeros párrafos; el texto completo, en «Quiénes somos». */
  pintar("quienes-txt",q.slice(0,2));
  pintar("about-txt",window.KurbaPaginas.quienes(D,LANG));
}
renderQuienes();
/* Enlaces de correo: el de corrección llega con el mensaje ya preparado, en el idioma de la interfaz. */
var CUERPO={es:"Partido:\nTema:\nQué está mal:\nFuente (enlace):\nFecha de la fuente:\n",eu:"Alderdia:\nGaia:\nZer dago gaizki:\nIturria (esteka):\nIturriaren data:\n"};
function renderCorreo(){
  Array.prototype.forEach.call(document.querySelectorAll(".js-mail"),function(a){
    a.href="mailto:"+CORREO+(a.dataset.mail==="correccion"?"?subject="+encodeURIComponent(LANG==="eu"?"Zuzenketa Kurba":"Corrección Kurba")+"&body="+encodeURIComponent(CUERPO[LANG]):"");
  });
}
renderCorreo();

/* ---------- menú principal ---------- */
var MENU=$("menu"),MBTN=$("menubtn");
function menu(abrir){MBTN.setAttribute("aria-expanded",abrir);$("top").classList.toggle("abierto",abrir);}
MBTN.addEventListener("click",function(){menu(MBTN.getAttribute("aria-expanded")!=="true");});
MENU.addEventListener("click",function(e){if(e.target.closest("a"))menu(false);});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&MBTN.getAttribute("aria-expanded")==="true"){menu(false);MBTN.focus();}});
if(window.matchMedia){var mqMenu=window.matchMedia("(min-width: 760px)");var cerrarMenu=function(){if(mqMenu.matches)menu(false);};if(mqMenu.addEventListener)mqMenu.addEventListener("change",cerrarMenu);else if(mqMenu.addListener)mqMenu.addListener(cerrarMenu);}
var SECCION={test:"test",resultado:"test",curvas:"curvas",fichas:"fichas",partido:"fichas",comparar:"fichas",guias:"guias",guia:"guias",metodologia:"metodologia","quienes-somos":"quienes-somos",contacto:"quienes-somos"};
function marcarMenu(){
  var parts=location.hash.replace(/^#\/?/,"").split("/"),sec=SECCION[parts[0]]||null;
  if(parts[0]==="resultado"&&parts[1]==="guias")sec="guias";
  Array.prototype.forEach.call(MENU.querySelectorAll("a"),function(a){
    if(a.dataset.nav===sec)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
  });
  /* Con el test hecho, «Test» lleva al resultado. */
  Array.prototype.forEach.call(document.querySelectorAll('a[data-nav="test"]'),function(a){a.setAttribute("href",st.res&&!st.explore?"#/resultado":"#/test");});
}

/* ---------- inicio ---------- */
recList("recs-start");applyStatic();
$("home").addEventListener("click",function(){show("s-start");});
function exploreMode(on){st.explore=on;$("s-res").classList.toggle("explore",on);$("exbar").hidden=!on;$("tb-cer").hidden=on;
  $("cur-h").textContent=t(on?"cur_h_ex":"cur_h");$("top-h").textContent=t(on?"top_h_ex":"top_h");}
function entrarExplorar(){
  var n=NT();
  st.q=0;st.ans=new Array(n).fill(null);st.w=new Array(n).fill(null);st.dk=new Array(n).fill(false);st.order=null;
  st.pord=shuffle(E().parties.map(function(p,i){return i;}));
  st.res=true;hidden={};recList("recs-res");exploreMode(true);
  st.sel=E().parties[st.pord[0]].id;st.cmpA=null;st.cmpB=null;
  renderKey();renderAdjust();update(true);
}
function asegurarRes(){if(!st.res)entrarExplorar();}
$("explore").addEventListener("click",function(){ev("curvas-sin-test");entrarExplorar();show("s-res");setTab("cur");});
$("ex-go").addEventListener("click",function(){empezarTest();});
function empezarTest(){
  var n=NT();exploreMode(false);st.res=false;st.enCurso=true;ev("test-inicio");
  st.q=0;st.ans=new Array(n).fill(null);st.w=new Array(n).fill(null);st.dk=new Array(n).fill(false);st.sel=null;
  st.pord=shuffle(E().parties.map(function(p,i){return i;}));
  st.order=shuffle(E().attrs.map(function(k,i){return i;}));st.opt=st.order.map(function(){return shuffle([1,2,3,4,5]);});
  renderQ();show("s-q");
}
$("go").addEventListener("click",empezarTest);

/* ---------- preguntas ---------- */
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function cur(){return st.order[st.q];}
var CHECK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function renderQ(){
  var i=cur(),a=attr(i);
  $("q-count").textContent=(st.q+1)+" / "+NT();
  $("q-bar").style.width=((st.q+1)/NT()*100)+"%";
  $("q-topic").textContent=an(a);
  var hk=E().attrs[i]==="autogobierno"?t("qhelp"):"";
  $("q-help").hidden=!hk;$("q-help").innerHTML=hk;
  $("q-text").textContent=aq(a);
  $("q-opts").innerHTML=st.opt[st.q].map(function(v){return'<button class="opt" data-v="'+v+'" aria-pressed="'+(st.ans[i]===v)+'"><span>'+esc(ao(a,v))+"</span>"+CHECK+"</button>";}).join("");
  $("q-dk").setAttribute("aria-pressed",!!st.dk[i]);
  Array.prototype.forEach.call($("q-imp").children,function(b){b.setAttribute("aria-pressed",st.w[i]!==null&&+b.dataset.w===st.w[i]);});
  updNext();
  if(curScreen()==="s-q")titulo();
}
function updNext(){
  var i=cur(),ok=st.dk[i]||st.w[i]===0||(st.ans[i]!==null&&st.w[i]!==null);
  $("q-next").disabled=!ok;
  $("q-hint").textContent=!ok&&st.ans[i]!==null?t("need_imp"):"";
  $("q-next").textContent=st.q===NT()-1?t("see"):t("next");
}
$("q-opts").addEventListener("click",function(e){
  var b=e.target.closest(".opt");if(!b)return;
  st.ans[cur()]=+b.dataset.v;st.dk[cur()]=false;
  Array.prototype.forEach.call($("q-opts").children,function(x){x.setAttribute("aria-pressed",x===b);});
  $("q-dk").setAttribute("aria-pressed",false);
  updNext();
});
$("q-dk").addEventListener("click",function(){
  var i=cur();st.dk[i]=!st.dk[i];
  if(st.dk[i]){st.ans[i]=null;Array.prototype.forEach.call($("q-opts").children,function(x){x.setAttribute("aria-pressed",false);});}
  $("q-dk").setAttribute("aria-pressed",st.dk[i]);
  updNext();
});
$("q-imp").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  st.w[cur()]=+b.dataset.w;
  Array.prototype.forEach.call($("q-imp").children,function(x){x.setAttribute("aria-pressed",x===b);});
  updNext();
});
$("q-next").addEventListener("click",function(){
  if(st.q<NT()-1){st.q++;renderQ();window.scrollTo(0,0);$("q-text").focus();}
  else{
    if(st.enCurso){st.enCurso=false;var k=counted();ev("test-fin");ev("test-temas-"+(k<10?"0":"")+k);if(k<MINT)ev("test-sin-porcentaje");}
    show("s-res");startResults();
  }
});
$("q-back").addEventListener("click",function(){
  if(st.q>0){st.q--;renderQ();}else show("s-start");
});

/* ---------- cálculo (js/cercania.js) ---------- */
function weight(i){return C.peso(st.ans,st.w,i);}
function counted(){return C.temasContados(st.ans,st.w);}
/* El orden de partida se baraja una vez por sesión: un empate no lo decide el orden de los datos. */
function ranked(){return C.clasificar(E().parties,st.ans,st.w,st.pord);}
function grp(R){return C.grupo(R);}
function topTie(R){return C.empateEnCabeza(R);}
function lst(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" "+t("and")+" "+a[a.length-1];}
function isEst(p,i){return p.est[i];}

/* ---------- resultado: pestañas ---------- */
var TABS=["cer","cur","fic","gui"],NOMBRE_TAB={cer:"cercania",cur:"curvas",fic:"fichas",gui:"guias"};
function setTab(t){
  st.tab=t;
  TABS.forEach(function(k){$("t-"+k).hidden=k!==t;$("tb-"+k).setAttribute("aria-selected",k===t);$("tb-"+k).tabIndex=k===t?0:-1;});
  if(t==="cur")draw();
  marcar(true);
}
TABS.forEach(function(k,ix){
  $("tb-"+k).addEventListener("click",function(){ev("pestana-"+NOMBRE_TAB[k]);setTab(k);window.scrollTo(0,0);});
  $("tb-"+k).addEventListener("keydown",function(e){
    var d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(!d)return;
    var vis=TABS.filter(function(x){return!$("tb-"+x).hidden;}),j=vis.indexOf(k);
    var n=vis[(j+d+vis.length)%vis.length];setTab(n);$("tb-"+n).focus();
  });
});
$("to-curves").addEventListener("click",function(){ev("pestana-curvas");setTab("cur");window.scrollTo(0,0);});
$("to-cmp").addEventListener("click",function(){abrirComparador();});
function abrirComparador(){ev("comparar");setTab("fic");st.cmpVisto=true;marcar(true);$("cmp").scrollIntoView({block:"start"});}

var hidden={};
function startResults(){
  st.res=true;hidden={};recList("recs-res");exploreMode(false);st.cmpA=null;st.cmpB=null;
  var R=ranked();st.sel=R[0].a===null||topTie(R)?null:R[0].p.id;
  R.forEach(function(r,k){hidden[r.p.id]=k>=3;});
  renderKey();renderAdjust();update(true);setTab("cer");
}
function update(full){
  var R=ranked(),valid=R[0].a!==null,G=grp(R),split=G.length>=2&&G.length<R.length;
  $("r-ed").textContent=edName();
  $("r-lead").textContent=valid?t("lead_ok"):t("lead_few").replace("{m}",MINT).replace("{n}",counted());
  $("rank").innerHTML=R.map(function(r,k){
    var tie=valid&&C.empatado(R,r);
    var lab=split&&k===0?'<p class="glabel">'+t("g_top")+"</p>":split&&k===G.length?'<p class="glabel">'+t("g_rest")+"</p>":"";
    return lab+'<button class="row" data-id="'+r.p.id+'">'+sw(r.p)+'<span class="nm">'+esc(pn(r.p))+(tie?"<small>"+t("tie")+"</small>":"")+'</span><span class="bar"><i style="width:'+(r.a||0)+"%;background:var(--s"+r.p.slot+')"></i></span><span class="pc">'+pct(r.a)+"</span></button>";
  }).join("");
  $("sep-card").hidden=!valid;$("shareimg").closest(".card").hidden=!valid;
  orient(R);separa(R);chips();if(st.tab==="cur")draw();ficha(full);tablaAlt();
  clearTimeout(update.t);update.t=setTimeout(shareImg,250);
}
function orient(R){
  var P=E().parties,common=[],split=[],h=[];
  E().attrs.forEach(function(k,i){
    var vs=P.map(function(p){return p.s[i];}),spread=Math.max.apply(null,vs)-Math.min.apply(null,vs);
    split.push({n:an(A[k]),s:spread+(weight(i)?weight(i)*.1:0)});
    if(weight(i)){var near=P.filter(function(p){return Math.abs(p.s[i]-st.ans[i])<=1;}).length;if(near>=Math.ceil(P.length/2))common.push(an(A[k]));}
  });
  function f(k,x){return"<p>"+t(k).replace("{x}",esc(x))+"</p>";}
  if(R[0].a!==null){
    var close=grp(R).map(function(r){return pn(r.p);});
    h.push(close.length>1?f("o_many",lst(close)):f("o_one",pn(R[0].p)));
  }
  if(common.length)h.push(f("o_common",lst(common)));
  split=split.sort(function(a,b){return b.s-a.s;}).slice(0,3).map(function(x){return x.n;});
  h.push(f("o_split",lst(split)));
  $("orient").innerHTML=h.join("");
}
function separa(R){
  if(R[0].a===null){$("sep").innerHTML="";$("sep-lead").textContent="";return;}
  var G=grp(R).slice(0,3);
  if(G.length<2)G=R.slice(0,2);
  var nl=lst(G.map(function(r){return pn(r.p);}));
  var T=[];
  E().attrs.forEach(function(k,i){
    var vs=G.map(function(r){return r.p.s[i];}),sp=Math.max.apply(null,vs)-Math.min.apply(null,vs);
    if(sp>0)T.push({i:i,sp:sp});
  });
  T.sort(function(a,b){return weight(b.i)-weight(a.i)||b.sp-a.sp||a.i-b.i;});
  if(!T.length){$("sep-lead").textContent=t("sep_none").replace("{x}",nl).replace("{n}",NT());$("sep").innerHTML="";return;}
  $("sep-lead").textContent=t("sep_lead").replace("{x}",nl);
  var h=T.slice(0,4).map(function(x){
    var i=x.i,a=attr(i),u=st.ans[i],w=weight(i);
    var ds=G.map(function(r){return Math.abs(r.p.s[i]-u);}),mn=Math.min.apply(null,ds),all=ds.every(function(d){return d===mn;});
    var rows=u===null?"":'<div class="sep-r">'+youSw+"<span><b>"+t("you")+"</b> · "+esc(ao(a,u))+"</span></div>";
    rows+=G.map(function(r,k){return'<div class="sep-r">'+sw(r.p)+"<span><b>"+esc(pn(r.p))+"</b> · "+esc(ao(a,r.p.s[i]))+(w&&!all&&ds[k]===mn?'<span class="pill mid">'+t("closest")+"</span>":"")+"</span></div>";}).join("");
    return'<div class="sep-t"><span class="sep-n">'+esc(an(a))+(w===2?" <span>"+t("much")+"</span>":w===0?" <span>"+t("nc")+"</span>":"")+"</span>"+rows+"</div>";
  }).join("");
  if(T.length>4)h+='<p class="small" style="padding-top:10px">'+t("sep_more").replace("{n}",T.length-4)+"</p>";
  $("sep").innerHTML=h;
}
function selP(){return partido(st.sel);}
function openFicha(id){st.sel=id;hidden[id]=false;update(true);setTab("fic");window.scrollTo(0,0);}
$("rank").addEventListener("click",function(e){var b=e.target.closest(".row");if(b)openFicha(b.dataset.id);});

/* ---------- curvas ---------- */
function chips(){
  var R=ranked();
  $("chips").innerHTML='<span class="pchip you you-only">'+youSw+t("you")+"</span>"+R.map(function(r){var p=r.p;return'<button class="pchip'+(p.id===st.sel?" sel":"")+'" data-id="'+p.id+'" aria-pressed="'+!hidden[p.id]+'">'+sw(p)+esc(pn(p))+"</button>";}).join("");
}
$("chips").addEventListener("click",function(e){var b=e.target.closest(".pchip[data-id]");if(!b)return;hidden[b.dataset.id]=!hidden[b.dataset.id];chips();draw();});
document.querySelector(".quick").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;var q=b.dataset.q,R=ranked();
  E().parties.forEach(function(p){hidden[p.id]=q==="none"?true:q==="all"?false:R.slice(0,3).every(function(r){return r.p.id!==p.id;});});
  chips();draw();
});
function renderKey(){
  $("key").innerHTML=E().attrs.map(function(k){return"<span><b>"+code(k)+"</b> "+esc(an(A[k]))+"</span>";}).join("");
}
/* Alternativa accesible al gráfico: las mismas posiciones en una tabla. */
function tablaAlt(){
  var attrs=E().attrs,P=E().parties;
  var head="<tr><th scope=\"col\">"+esc(t("tbl_p"))+"</th>"+attrs.map(function(k){return'<th scope="col" class="c" title="'+esc(an(A[k]))+'">'+esc(code(k))+"</th>";}).join("")+"</tr>";
  var you=st.explore?"":"<tr><th scope=\"row\">"+esc(t("you"))+"</th>"+attrs.map(function(k,i){return'<td class="c">'+(st.ans[i]===null?"—":st.ans[i])+"</td>";}).join("")+"</tr>";
  var rows=P.map(function(p){return"<tr><th scope=\"row\">"+esc(pn(p))+"</th>"+attrs.map(function(k,i){return'<td class="c">'+p.s[i]+(isEst(p,i)?"*":"")+"</td>";}).join("")+"</tr>";}).join("");
  $("tabla-alt").innerHTML='<div class="table-scroll" tabindex="0" role="region" aria-label="'+esc(t("tbl_s"))+'"><table class="data-table"><thead>'+head+"</thead><tbody>"+you+rows+'</tbody></table></div><p class="small" style="margin-top:6px">'+esc(t("tbl_n"))+"</p>";
}
function renderAdjust(){
  $("adjust").innerHTML=E().attrs.map(function(k,i){
    var a=A[k],u=st.ans[i],v=u===null?3:u;
    return'<div class="adj'+(weight(i)?"":" off")+'" id="adj'+i+'"><div class="ah"><label for="r'+i+'">'+esc(an(a))+'</label><span class="mini" role="group" aria-label="'+t("imp_of")+esc(an(a))+'">'+[[2,t("w2")],[1,t("w1")],[0,t("w0")]].map(function(x){return'<button data-i="'+i+'" data-w="'+x[0]+'" aria-pressed="'+(st.w[i]===x[0])+'">'+x[1]+"</button>";}).join("")+'</span></div><input type="range" id="r'+i+'" data-i="'+i+'" min="1" max="5" step="1" value="'+v+'"'+(u===null?' class="nul"':"")+' aria-valuetext="'+esc(u===null?t("noans_adj"):ao(a,u))+'"><span class="av" id="av'+i+'">'+esc(u===null?t("noans_adj"):ao(a,u))+"</span></div>";
  }).join("");
}
function syncAdj(i){
  var a=attr(i),u=st.ans[i],txt=u===null?t("noans_adj"):ao(a,u);
  $("av"+i).textContent=txt;$("r"+i).setAttribute("aria-valuetext",txt);
  $("r"+i).classList.toggle("nul",u===null);
  $("adj"+i).classList.toggle("off",!weight(i));
  Array.prototype.forEach.call($("adj"+i).querySelectorAll(".mini button"),function(b){b.setAttribute("aria-pressed",+b.dataset.w===st.w[i]);});
}
$("adjust").addEventListener("input",function(e){
  if(e.target.type!=="range")return;var i=+e.target.dataset.i;
  ev("ajustar-curva",true);
  var wasNull=st.ans[i]===null;st.ans[i]=+e.target.value;st.dk[i]=false;
  if(st.w[i]==null||(wasNull&&st.w[i]===0))st.w[i]=1;
  syncAdj(i);update(false);
});
$("adjust").addEventListener("click",function(e){
  var b=e.target.closest(".mini button");if(!b)return;var i=+b.dataset.i;
  st.w[i]=+b.dataset.w;
  syncAdj(i);update(false);
});

var geo=null;
function draw(){
  var wrap=$("wrap"),W=Math.max(280,wrap.clientWidth),svg=$("chart"),attrs=E().attrs,n=NT();
  var mL=22,mR=4,mT=12,mB=30,H=Math.round(Math.min(W>700?400:300,Math.max(210,W*.62)));
  var pw=W-mL-mR,ph=H-mT-mB,band=pw/n,o=[],v,i;
  function X(i){return mL+(i+.5)*band;}
  function Y(v){return mT+(5-v)/4*ph;}
  svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("height",H);
  for(v=1;v<=5;v++)o.push('<line x1="'+mL+'" x2="'+(W-mR)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--grid)"/><text x="9" y="'+(Y(v)+4)+'" text-anchor="middle" fill="var(--ink-2)" font-size="11">'+v+"</text>");
  attrs.forEach(function(k,i){o.push('<text x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="600"'+(weight(i)?"":' opacity=".45"')+">"+code(k)+"</text>");});
  var P=E().parties,np=P.length;
  var order=P.filter(function(p){return!hidden[p.id];}).sort(function(a,b){return(a.id===st.sel)-(b.id===st.sel);});
  order.forEach(function(p){
    var idx=P.indexOf(p),d=(idx-(np-1)/2)*1.6,isSel=p.id===st.sel,pts=[],mk=[],mh=[];
    for(i=0;i<n;i++){var x=+(X(i)+d).toFixed(1),y=+Y(p.s[i]).toFixed(1);pts.push(x+","+y);(isEst(p,i)?mh:mk).push(shape(p.sh,x,y,isSel?5:4));}
    o.push('<g opacity="'+(isSel?1:.65)+'"><polyline points="'+pts.join(" ")+'" fill="none" stroke="var(--s'+p.slot+')" stroke-width="'+(isSel?3:1.75)+'" stroke-linejoin="round" stroke-linecap="round"/><g fill="var(--s'+p.slot+')" stroke="var(--surface)" stroke-width="1.5">'+mk.join("")+'</g><g fill="var(--surface)" stroke="var(--s'+p.slot+')" stroke-width="1.75">'+mh.join("")+"</g></g>");
  });
  /* La línea del usuario se corta en los temas sin respuesta: no se dibuja una posición que no dio. */
  var seg=[],cs=[],ym=[];
  for(i=0;i<n;i++){
    if(st.ans[i]===null){if(cs.length)seg.push(cs);cs=[];continue;}
    var ux=X(i).toFixed(1),uy=Y(st.ans[i]).toFixed(1);cs.push(ux+","+uy);
    ym.push('<circle cx="'+ux+'" cy="'+uy+'" r="6" opacity="'+(weight(i)?1:.3)+'"'+(weight(i)===2?' stroke-width="3.5"':"")+"/>");
  }
  if(cs.length)seg.push(cs);
  seg.forEach(function(s){if(s.length>1)o.push('<polyline points="'+s.join(" ")+'" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>');});
  o.push('<g fill="var(--surface)" stroke="var(--ink)" stroke-width="2">'+ym.join("")+"</g>");
  for(i=0;i<n;i++)o.push('<rect class="hit" data-i="'+i+'" x="'+(X(i)-band/2)+'" y="0" width="'+band+'" height="'+H+'" fill="transparent"/>');
  svg.innerHTML=o.join("");
  geo={W:W,H:H,X:X,band:band};
}
function showTip(i){
  var tip=$("tip"),a=attr(i),any=false,rows=E().parties.filter(function(p){return!hidden[p.id];}).map(function(p){return{p:p,v:p.s[i]};}).sort(function(x,y){return y.v-x.v;});
  var h="<b>"+esc(an(a))+"</b>";
  if(!st.explore)h+='<div class="tr">'+youSw+"<span>"+t("you")+(weight(i)?"":" "+t("nocount"))+"</span><span>"+(st.ans[i]===null?"—":st.ans[i])+"</span></div>";
  rows.forEach(function(r){var e=isEst(r.p,i);any=any||e;h+='<div class="tr">'+sw(r.p)+"<span>"+esc(pn(r.p))+"</span><span>"+r.v+(e?"*":"")+"</span></div>";});
  if(any)h+='<div class="tn">'+t("est_tip")+"</div>";
  tip.innerHTML=h;tip.style.display="block";
  var tw=210,x=geo.X(i)+geo.band/2+4;if(x+tw>geo.W)x=geo.X(i)-geo.band/2-tw-4;
  tip.style.left=Math.max(0,x)+"px";tip.style.top="8px";
}
$("chart").addEventListener("pointermove",function(e){var t=e.target.closest(".hit");if(t)showTip(+t.dataset.i);});
$("chart").addEventListener("click",function(e){var t=e.target.closest(".hit");if(t)showTip(+t.dataset.i);});
$("chart").addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")$("tip").style.display="none";});
document.addEventListener("click",function(e){if(!e.target.closest("#wrap"))$("tip").style.display="none";});
if(window.ResizeObserver){var lw=0;new ResizeObserver(function(){var w=$("wrap").clientWidth;if(w&&w!==lw){lw=w;if(!$("s-res").hidden&&st.tab==="cur")draw();}}).observe($("wrap"));}

/* ---------- fichas ---------- */
function src(k){var s=S[k];return' <a href="'+safeUrl(s.u)+'" title="'+esc(s.t)+'" target="_blank" rel="noopener">'+t("src")+" ↗</a>";}
function prop(x,tx){return'<li><span class="tag">'+t("tag_"+x[2])+"</span> "+esc(tx||x[0])+src(x[1])+"</li>";}
function ficha(full){
  var R=ranked(),p=selP(),sid=p?p.id:null;
  $("fsw").innerHTML=R.map(function(x){return'<button class="pchip'+(x.p.id===sid?" sel":"")+'" data-id="'+x.p.id+'" aria-pressed="'+(x.p.id===sid)+'" style="'+(x.p.id===sid?"":"background:transparent;color:var(--ink);text-decoration:none;font-weight:500")+'">'+sw(x.p)+esc(pn(x.p))+"</button>";}).join("");
  $("f-body").hidden=!p;$("f-pick").hidden=!!p;
  if(!p){renderCmp();return;}
  var r=R.filter(function(x){return x.p.id===p.id;})[0],e=pe(p);
  $("f-name").innerHTML=sw(p,20)+esc(pn(p));
  $("f-pc").textContent=r.a===null?"–":t("f_pc").replace("{x}",pct(r.a));
  $("others").innerHTML=R.filter(function(x){return x.p.id!==p.id;}).map(function(x){return'<button data-id="'+x.p.id+'">'+sw(x.p)+'<span class="on">'+esc(pn(x.p))+'</span><span class="op">'+pct(x.a)+"</span>"+CHEV+"</button>";}).join("");
  if(full){
    $("p-note").textContent=e&&e.note?e.note:p.note;
    $("f-otros-w").hidden=!p.otros.length;
    $("f-otros").innerHTML=p.otros.map(function(x,j){return prop(x,e&&e.otros[j]);}).join("");
    var pg=p.prog,h=pg.docs.map(function(d,j){return'<a href="'+safeUrl(d.u)+'" target="_blank" rel="noopener"><span>'+esc(e&&e.docs&&e.docs[j]||d.t)+"</span>"+EXT+"</a>";}).join("");
    h+="<p>"+esc(e&&e.prog?e.prog:pg.note)+"</p>";
    h+=p.web?'<a href="'+safeUrl(p.web)+'" target="_blank" rel="noopener"><span>'+t("web")+"</span>"+EXT+"</a>":"<p>"+t("web_no")+"</p>";
    $("f-prog").innerHTML=h;
    $("f-ppl").innerHTML=p.ppl.map(function(x,j){var y=e&&e.ppl[j];return'<li><b>'+esc(x[0])+'</b><span class="role">'+esc(y?y[0]||x[1].replace("Congreso","Kongresua"):x[1])+'</span><span class="bio">'+esc(y&&y[1]?y[1]:x[2])+src(x[3])+"</span></li>";}).join("")+(p.lead?'<li><span class="role">'+esc(e&&e.lead||p.lead)+"</span></li>":"");
    $("f-sen").innerHTML="<b>"+t("sen")+"</b> "+esc(e&&e.senado||p.senado)+(p.pres?"<br><b>"+t("pres")+"</b> "+esc(p.pres):"<br>"+t("nopres"));
  }
  renderCmp();
  var idx=E().attrs.map(function(k,i){return i;}).sort(function(x,y){return weight(y)-weight(x)||x-y;});
  $("topics").innerHTML=idx.map(function(i){
    var a=A[E().attrs[i]],u=st.ans[i],v=p.s[i],w=weight(i),pill,cls;
    if(!w){pill=u===null?t("noans"):t("nocare");cls="off";}
    else{var d=Math.abs(u-v);pill=d===0?t("p0"):d===1?t("p1"):t("p2");cls=d===0?"good":d===1?"mid":"bad";}
    var est=isEst(p,i)?' <span class="est">'+t("est")+"</span>":"";
    var pr=p.props[i].length?'<ul class="pts">'+p.props[i].map(function(x,j){return prop(x,e&&e.props[i]&&e.props[i][j]);}).join("")+"</ul>":'<p class="none">'+t("noprops")+"</p>";
    if(st.explore)return'<div class="tcard"><div class="th"><span class="tn">'+esc(an(a))+'</span></div><div class="tv"><b>'+esc(pn(p))+"</b><span>"+esc(ao(a,v))+est+"</span></div>"+pr+"</div>";
    return'<div class="tcard'+(w?"":" dim")+'"><div class="th"><span class="tn">'+esc(an(a))+(w===2?" <span>"+t("much")+"</span>":w===1?"":" <span>"+t("nc")+"</span>")+'</span><span class="pill '+cls+'">'+pill+'</span></div><div class="tv"><b>'+t("you")+'</b><span>'+(u===null?"—":esc(ao(a,u)))+"</span><b>"+esc(pn(p))+"</b><span>"+esc(ao(a,v))+est+"</span></div>"+pr+"</div>";
  }).join("");
}
/* ---------- comparar dos partidos ---------- */
function renderCmp(){
  var P=E().parties,ord=(st.pord||P.map(function(p,i){return i;})).map(function(i){return P[i];});
  if(!st.cmpA)st.cmpA=st.sel||ord[0].id;
  if(!st.cmpB||st.cmpB===st.cmpA)st.cmpB=ord.filter(function(p){return p.id!==st.cmpA;})[0].id;
  function opts(v,other){return ord.map(function(p){return'<option value="'+p.id+'"'+(p.id===v?" selected":"")+(p.id===other?" disabled":"")+">"+esc(pn(p))+"</option>";}).join("");}
  $("cmp-a").innerHTML=opts(st.cmpA,st.cmpB);$("cmp-b").innerHTML=opts(st.cmpB,st.cmpA);
  var a=partido(st.cmpA),b=partido(st.cmpB),n=NT(),same=0,i;
  var W=Math.max(280,$("cmp").clientWidth-32),H=190,mL=22,mR=4,mT=12,mB=28,band=(W-mL-mR)/n,o=[];
  function X(i){return mL+(i+.5)*band;} function Y(v){return mT+(5-v)/4*(H-mT-mB);}
  for(var v=1;v<=5;v++)o.push('<line x1="'+mL+'" x2="'+(W-mR)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--grid)"/><text x="9" y="'+(Y(v)+4)+'" text-anchor="middle" fill="var(--ink-2)" font-size="11">'+v+"</text>");
  E().attrs.forEach(function(k,i){o.push('<text x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="600">'+code(k)+"</text>");});
  [a,b].forEach(function(p,k){var d=k?1.6:-1.6,pts=[],mk=[],mh=[];
    for(i=0;i<n;i++){var x=+(X(i)+d).toFixed(1),y=+Y(p.s[i]).toFixed(1);pts.push(x+","+y);(isEst(p,i)?mh:mk).push(shape(p.sh,x,y,4.5));}
    o.push('<polyline points="'+pts.join(" ")+'" fill="none" stroke="var(--s'+p.slot+')" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><g fill="var(--s'+p.slot+')" stroke="var(--surface)" stroke-width="1.5">'+mk.join("")+'</g><g fill="var(--surface)" stroke="var(--s'+p.slot+')" stroke-width="1.75">'+mh.join("")+"</g>");});
  var svg=$("cmp-chart");svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("height",H);svg.innerHTML=o.join("");
  var rows=E().attrs.map(function(k,i){
    var at=A[k],d=Math.abs(a.s[i]-b.s[i]);if(!d)same++;
    var pill=d===0?'<span class="pill good">'+t("cmp_eq")+"</span>":'<span class="pill '+(d===1?"mid":"bad")+'">'+(d===1?t("cmp_d1"):t("cmp_dn").replace("{n}",d))+"</span>";
    function est(p){return isEst(p,i)?' <span class="est">'+t("est")+"</span>":"";}
    return'<div class="tcard"><div class="th"><span class="tn">'+esc(an(at))+"</span>"+pill+'</div><div class="tv"><b>'+esc(pn(a))+"</b><span>"+esc(ao(at,a.s[i]))+est(a)+"</span><b>"+esc(pn(b))+"</b><span>"+esc(ao(at,b.s[i]))+est(b)+"</span></div></div>";
  }).join("");
  $("cmp-sum").innerHTML=sw(a)+" "+sw(b)+" "+esc(t("cmp_same").replace("{a}",pn(a)).replace("{b}",pn(b)).replace("{n}",same).replace("{t}",n));
  $("cmp-rows").innerHTML=rows;
}
$("cmp-a").addEventListener("change",function(e){st.cmpA=e.target.value;st.cmpVisto=true;renderCmp();marcar(false);});
$("cmp-b").addEventListener("change",function(e){st.cmpB=e.target.value;st.cmpVisto=true;renderCmp();marcar(false);});
$("fsw").addEventListener("click",function(e){var b=e.target.closest("[data-id]");if(b){st.cmpVisto=false;openFicha(b.dataset.id);}});
$("others").addEventListener("click",function(e){var b=e.target.closest("[data-id]");if(b){st.cmpVisto=false;openFicha(b.dataset.id);}});

/* ---------- imagen para compartir ---------- */
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
/* Solo la curva de la persona: sin partidos ni porcentajes (decisión de lanzamiento, especificación §3.3). */
function shareImg(){
  var c=$("cv"),x=c.getContext("2d"),SZ=1080,attrs=E().attrs,n=NT(),i;
  var bg="#F2F3F0",card="#FFFFFF",ink="#14161B",ink2="#646973",grid="#E4E6E0",acc="#FFC533";
  x.fillStyle=bg;x.fillRect(0,0,SZ,SZ);
  x.fillStyle=acc;x.beginPath();x.roundRect?x.roundRect(80,64,56,56,14):x.rect(80,64,56,56);x.fill();
  x.strokeStyle=ink;x.lineWidth=5;x.lineCap="round";x.lineJoin="round";x.beginPath();x.moveTo(92,103);x.lineTo(103,84);x.lineTo(116,95);x.lineTo(126,77);x.stroke();
  x.fillStyle=ink;x.font="700 40px 'Space Grotesk', Arial, sans-serif";x.textAlign="left";x.fillText("kurba",152,106);
  x.fillStyle=ink2;x.font="600 26px Inter, Arial, sans-serif";x.fillText(edName().toUpperCase(),80,180);
  x.fillStyle=ink;x.font="700 60px 'Space Grotesk', Arial, sans-serif";x.fillText(t("share_t"),80,248);
  x.fillStyle=card;x.beginPath();x.roundRect?x.roundRect(60,290,960,620,32):x.rect(60,290,960,620);x.fill();
  var L=130,Rr=1000,T=345,B=800,bw=(Rr-L)/n;
  function X(i){return L+(i+.5)*bw;} function Y(v){return T+(5-v)/4*(B-T);}
  x.strokeStyle=grid;x.lineWidth=2;x.fillStyle=ink2;x.font="500 22px Inter, Arial, sans-serif";x.textAlign="center";
  for(var v=1;v<=5;v++){x.beginPath();x.moveTo(L,Y(v));x.lineTo(Rr,Y(v));x.stroke();x.fillText(String(v),98,Y(v)+8);}
  x.fillStyle=ink;x.font="600 22px Inter, Arial, sans-serif";
  attrs.forEach(function(k,i){x.globalAlpha=weight(i)?1:.45;x.fillText(code(k),X(i),B+56);x.globalAlpha=1;});
  x.strokeStyle=ink;x.lineWidth=6;x.setLineDash([4,14]);x.beginPath();var pen=false;
  for(i=0;i<n;i++){if(st.ans[i]===null){pen=false;continue;}if(pen)x.lineTo(X(i),Y(st.ans[i]));else x.moveTo(X(i),Y(st.ans[i]));pen=true;}
  x.stroke();x.setLineDash([]);
  for(i=0;i<n;i++){if(st.ans[i]===null)continue;x.beginPath();x.arc(X(i),Y(st.ans[i]),14,0,Math.PI*2);x.fillStyle=acc;x.globalAlpha=weight(i)?1:.35;x.fill();x.lineWidth=5;x.strokeStyle=ink;x.stroke();x.globalAlpha=1;}
  var web=(location.host+location.pathname).replace(/\/(index\.html)?$/,"");
  x.textAlign="left";x.fillStyle=ink2;x.font="400 26px Inter, Arial, sans-serif";x.fillText(t("share_f0"),80,990);
  x.textAlign="right";x.fillStyle=ink;x.font="700 26px 'Space Grotesk', Arial, sans-serif";x.fillText(web,1000,990);
  try{$("shareimg").src=c.toDataURL("image/png");}catch(e){}
}
$("copy").addEventListener("click",function(){ev("copiar-resumen");
  var R=ranked(),num=grp(R).length<2,txt=t("share_t")+" · Kurba ("+edName()+"):\n"+R.slice(0,3).map(function(r,k){return(num?(k+1)+". ":"· ")+pn(r.p)+" "+pct(r.a);}).join("\n");
  try{navigator.clipboard.writeText(txt).then(function(){$("copied").textContent=t("copied");},function(){$("copied").textContent=t("nocopy");});}
  catch(e){$("copied").textContent=t("nocopy");}
});
$("r-edit").addEventListener("click",function(){ev("cambiar-respuestas");st.q=0;renderQ();show("s-q");});
$("r-restart").addEventListener("click",function(){show("s-start");});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(!$("s-res").hidden)shareImg();});

/* ---------- rutas: cada pantalla tiene su dirección (#/…) y el botón «atrás» funciona ---------- */
var navegando=false,primera=true,ultimo=null,pendiente=false,pendPush=false;
function rutaActual(){
  var c=curScreen();
  if(c==="s-start")return"#/";
  if(c==="s-q")return"#/test";
  if(c==="s-met")return location.hash.indexOf("#/metodologia")===0?location.hash:"#/metodologia";
  if(c==="s-gl")return"#/guias";
  if(c==="s-rec")return"#/guia/"+curRec;
  if(c==="s-priv")return"#/privacidad";
  if(c==="s-legal")return"#/aviso-legal";
  if(c==="s-about")return location.hash==="#/contacto"?"#/contacto":"#/quienes-somos";
  if(c==="s-404")return location.hash;
  if(st.tab==="cur")return"#/curvas";
  if(st.tab==="gui")return"#/resultado/guias";
  if(st.tab==="fic"){
    if(st.cmpVisto)return"#/comparar/"+st.cmpA+"/"+st.cmpB;
    return st.sel?"#/partido/"+st.sel:"#/fichas";
  }
  return"#/resultado";
}
/* Varias llamadas seguidas (pantalla + pestaña) dejan una sola entrada en el historial. */
function marcar(push){
  if(navegando)return;
  pendPush=pendPush||push;
  if(pendiente)return;pendiente=true;
  Promise.resolve().then(function(){
    pendiente=false;var p=pendPush;pendPush=false;
    var h=rutaActual();
    if(h!==location.hash&&!(h==="#/"&&!location.hash))history[p?"pushState":"replaceState"](null,"",h);
    ultimo=location.hash;titulo();contarVista();
  });
}
var ultimaVista=null;
function contarVista(){var v=AN.normalizar(location.hash);if(v!==ultimaVista){ultimaVista=v;AN.vista(v);}}
/* Quien cierra la pestaña a mitad del test: se cuenta en qué pregunta lo dejó, nada más. */
window.addEventListener("pagehide",function(){if(st.enCurso&&curScreen()==="s-q"){st.enCurso=false;ev("test-abandono/pregunta-"+(st.q+1));}});
function titulo(){
  var c=curScreen(),x=null,el;
  if(c==="s-res")x=st.tab==="fic"&&selP()&&!st.cmpVisto?pn(selP()):$("tb-"+st.tab).textContent;
  else if(c==="s-q")x=$("q-count").textContent+" · "+$("q-topic").textContent;
  else if(c==="s-rec")x=$("rec-t").textContent;
  else if(c!=="s-start"){el=$(c).querySelector("h1");x=el?el.textContent:null;}
  document.title=x?x+" · Kurba":TITULO;
  marcarMenu();
}
function foco(id){
  if(primera)return;
  var el=id==="s-res"?$("tb-"+st.tab):$(id).querySelector("h1,h2");
  if(!el)return;
  if(id!=="s-res")el.setAttribute("tabindex","-1");
  try{el.focus({preventScroll:true});}catch(e){el.focus();}
}
function aplicar(){
  if(!esRuta(location.hash))history.replaceState(null,"","#/");
  var parts=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean),r=parts[0]||"",ok=true;
  navegando=true;
  try{
    switch(r){
      case"":show("s-start");break;
      case"test":if(st.order&&!st.explore)show("s-q");else{navegando=false;empezarTest();navegando=true;}break;
      case"resultado":
        if(parts[1]==="guias"){asegurarRes();show("s-res");setTab("gui");}
        else if(st.res&&!st.explore){show("s-res");setTab("cer");}
        else{show("s-start");ok=false;}
        break;
      case"curvas":asegurarRes();show("s-res");setTab("cur");break;
      case"fichas":asegurarRes();st.cmpVisto=false;show("s-res");setTab("fic");break;
      case"partido":
        asegurarRes();
        if(!partido(parts[1])){show("s-404");break;}
        st.cmpVisto=false;st.sel=parts[1];hidden[parts[1]]=false;update(true);show("s-res");setTab("fic");break;
      case"comparar":
        asegurarRes();
        if(partido(parts[1]))st.cmpA=parts[1];
        if(partido(parts[2])&&parts[2]!==st.cmpA)st.cmpB=parts[2];else if(parts[2])st.cmpB=null;
        st.cmpVisto=true;show("s-res");setTab("fic");renderCmp();
        $("cmp").scrollIntoView({block:"start"});break;
      case"guias":show("s-gl");break;
      case"guia":if(!openRec(parts[1]))show("s-404");break;
      case"metodologia":
        show("s-met");
        if(parts[1]==="correcciones"){var c=$("correcciones");c.scrollIntoView({block:"start"});if(!primera)c.focus({preventScroll:true});}
        break;
      case"privacidad":show("s-priv");break;
      case"aviso-legal":show("s-legal");break;
      case"quienes-somos":show("s-about");break;
      case"contacto":
        show("s-about");
        var ct=$("contacto");ct.scrollIntoView({block:"start"});if(!primera)ct.focus({preventScroll:true});
        break;
      default:show("s-404");
    }
  }finally{navegando=false;}
  if(!ok)history.replaceState(null,"","#/");
  ultimo=location.hash;titulo();contarVista();
}
/* Solo los hashes «#/…» son rutas; uno como «#contenido» es un ancla de la página y no se toca. */
function esRuta(h){return !h||h==="#"||h.indexOf("#/")===0;}
function alCambiar(){
  if(!esRuta(location.hash)){history.replaceState(null,"",ultimo||"#/");return;}
  if(location.hash!==ultimo)aplicar();
}
document.querySelector(".skip").addEventListener("click",function(e){
  e.preventDefault();var m=$("contenido");try{m.focus({preventScroll:false});}catch(x){m.focus();}m.scrollIntoView({block:"start"});
});
window.addEventListener("hashchange",alCambiar);
window.addEventListener("popstate",alCambiar);

aplicar();
primera=false;
document.documentElement.classList.remove("cargando-datos");
}
})();
