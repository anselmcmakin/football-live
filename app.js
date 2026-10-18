// Football Live (College + NFL) for Fire TV / phone. Same code path for ESPN live data and the synthetic TEST GAME.
(function(){
window.onerror=function(m,u,l){(window.__errs=window.__errs||[]).push(m+' @'+l)};
var Q={};location.search.slice(1).split('&').forEach(function(kv){if(!kv)return;var p=kv.split('=');Q[decodeURIComponent(p[0])]=decodeURIComponent((p[1]||'').replace(/\+/g,' '))});
var BASE='https://site.api.espn.com/apis/site/v2/sports/football/';
var LG={cfb:{label:'COLLEGE',name:'College',path:'college-football',sb:'?groups=80&limit=300',def:['228','2579']},nfl:{label:'NFL',name:'NFL',path:'nfl',sb:'?limit=100',def:['29']}};
function lgOf(x){x=String(x||'').toLowerCase();return /nfl|pro/.test(x)?'nfl':/cfb|college|ncaa|ncaaf/.test(x)?'cfb':null}
var store={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var TEAM_LG={panthers:'nfl',carolina:'nfl',carolinapanthers:'nfl',clemson:'cfb',tigers:'cfb',gamecocks:'cfb',southcarolina:'cfb',sc:'cfb',clem:'cfb',car:'nfl'};
var S={league:lgOf(Q.league)||(Q.team&&TEAM_LG[norm(Q.team)])||store.get('fl.league','cfb'),mode:/test|demo/.test(Q.mode||'')?'test':'live',speed:+Q.speed||1,games:[],list:[],cur:0,selId:null,manual:false,
  sum:null,sumFor:null,sumKey:'',menu:false,menuIdx:0,want:{team:Q.team||null,game:Q.game||null},autoFollow:store.get('fl.follow',true),seen:{},pop:null,finishShown:false,lastSbKey:'',tickW:0,tickOff:0,lastT:0};
if([1,2,4].indexOf(S.speed)<0)S.speed=1;
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function favs(lg){return store.get('fl.fav.'+(lg||S.league),LG[lg||S.league].def)}
function norm(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function teamIs(t,q){q=norm(q);if(!q||!t)return false;return t.id===q||[t.abbr,t.loc,t.nick,t.name,t.short].some(function(x){return x&&norm(x)===q})}
function isFav(t){return favs().some(function(f){return teamIs(t,f)})}
// ---------- clocks (test game) ----------
var simBase=Q.simt?+Q.simt:-4,wallBase=performance.now(),FROZEN=null;
function clock(){if(FROZEN!=null)return FROZEN;return simBase+(performance.now()-wallBase)/1000*S.speed}
function animNow(){return FROZEN!=null?FROZEN/S.speed:performance.now()/1000}
function setSpeed(x){simBase=clock();wallBase=performance.now();S.speed=x;toast('Test game speed '+x+'x')}
function restartTest(){simBase=-4;wallBase=performance.now();S.finishShown=false;S.seen={};$('finish').classList.add('hidden');tick(true)}
// ---------- network ----------
function getJSON(url){
  var viaBridge=function(){if(window.Android&&Android.http){var o=JSON.parse(Android.http(url,'GET','{}',''));if(o.status===200)return JSON.parse(o.body);throw new Error('bridge '+o.status)}throw new Error('no bridge')};
  if(!window.fetch)return Promise.resolve().then(viaBridge);
  var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},10000);
  return fetch(url,ctl?{signal:ctl.signal}:{}).then(function(r){clearTimeout(tm);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).catch(function(e){clearTimeout(tm);try{return viaBridge()}catch(x){throw e}})}
function sbURL(lg){return BASE+LG[lg].path+'/scoreboard'+LG[lg].sb}
function sumURL(lg,id){return BASE+LG[lg].path+'/summary?event='+encodeURIComponent(id)}
// ---------- normalize ----------
function team(c){var t=c.team||{};var rk=(c.curatedRank&&c.curatedRank.current)||c.rank;return {id:String(t.id||c.id),abbr:t.abbreviation||'',name:t.displayName||'',short:t.shortDisplayName||t.location||'',loc:t.location||'',nick:t.name||'',
  color:fixC(t.color,t.alternateColor),alt:'#'+(t.alternateColor||'444'),logo:t.logo||(t.logos&&t.logos[0]&&t.logos[0].href)||'',score:c.score!=null&&c.score!==''?String(c.score):'',
  rank:rk&&rk<99?rk:null,rec:(c.records&&c.records[0]&&c.records[0].summary)||(c.record&&c.record[0]&&(c.record[0].summary||c.record[0].displayValue))||''}}
function lum(h){h=String(h||'').replace('#','');if(h.length!==6)return .3;var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (0.299*r+0.587*g+0.114*b)/255}
function fixC(c,a){c=c||'555555';if(lum(c)<0.09&&a&&lum(a)>0.12&&lum(a)<0.9)c=a;if(lum(c)<0.09)c='3a3f4c';return '#'+c}
function game(ev){var c=(ev.competitions||[])[0]||{},st=ev.status||c.status||{type:{}},cs=c.competitors||[],h=cs.filter(function(x){return x.homeAway==='home'})[0]||cs[0],a=cs.filter(function(x){return x.homeAway==='away'})[0]||cs[1];
  var tv=((c.broadcasts||[])[0]||{}).names;if(!tv&&c.broadcast)tv=[c.broadcast];
  return {id:String(ev.id),test:!!ev.test,date:new Date(ev.date||c.date),state:(st.type||{}).state||'pre',detail:(st.type||{}).detail||'',sd:(st.type||{}).shortDetail||'',name:(st.type||{}).name||'',period:st.period||0,clock:st.displayClock||'',
    H:team(h),A:team(a),sit:c.situation||null,venue:c.venue&&c.venue.fullName||'',tv:(tv||[]).join('/'),neutral:!!c.neutralSite}}
function ord(n){return ['','1st','2nd','3rd','4th'][n]||(n>4?'OT':'')}
function hm(d){var h=d.getHours(),m=d.getMinutes();return (h%12||12)+':'+('0'+m).slice(-2)+' '+(h<12?'AM':'PM')}
function sameDay(a,b){return a.toDateString()===b.toDateString()}
function shortStatus(g){if(g.state==='in'){if(/HALFTIME/.test(g.name))return 'HALF';if(/END_PERIOD/.test(g.name))return 'END '+(g.period>4?'OT':'Q'+g.period);return (g.period>4?'OT':'Q'+g.period)+' '+g.clock}
  if(g.state==='post')return /OT/.test(g.sd)?'FINAL/OT':'FINAL';if(g.test)return g.sd.toUpperCase();if(/TBD/.test(g.sd))return 'TBD';
  var now=new Date();return (sameDay(g.date,now)?'':['SUN','MON','TUE','WED','THU','FRI','SAT'][g.date.getDay()]+' ')+hm(g.date)}
function logo(url,px){if(!url)return '';var m=url.match(/^https:\/\/a\.espncdn\.com(\/i\/teamlogos\/[^?]+)$/);return m?'https://a.espncdn.com/combiner/i?img='+m[1]+'&h='+px+'&w='+px:url}
function img(url,px,cls){return url?'<img src="'+esc(logo(url,px))+'"'+(cls?' class="'+cls+'"':'')+' onerror="this.style.visibility=\'hidden\'">':''}
// ---------- order + selection ----------
function order(gs){var now=Date.now();function k(g){var f=(isFav(g.H)||isFav(g.A))?0:1,r=Math.min(g.H.rank||99,g.A.rank||99);
   return g.state==='in'?[0,f,r,0]:g.state==='pre'?[1,f,0,+g.date]:[2,f,0,-(+g.date)]}
 return gs.slice().sort(function(a,b){var x=k(a),y=k(b);for(var i=0;i<4;i++)if(x[i]!==y[i])return x[i]-y[i];return 0})}
function pickDefault(){var L=S.list,f=function(g){return isFav(g.H)||isFav(g.A)};
 return L.filter(function(g){return g.state==='in'&&f(g)})[0]||L.filter(function(g){return g.state==='in'})[0]||
   L.filter(function(g){return g.state==='post'&&f(g)&&Date.now()-g.date<36e5*30})[0]||L.filter(function(g){return g.state==='post'})[0]||L.filter(f)[0]||L[0]}
function selected(){for(var i=0;i<S.list.length;i++)if(S.list[i].id===S.selId)return S.list[i];return S.extra&&S.extra.id===S.selId?S.extra:null}
function select(id,manual){if(S.selId!==id){S.selId=id;S.sum=null;S.sumFor=null;S.sumKey='';S.ball=null;S.pop=null;S.finishShown=false;$('finish').classList.add('hidden');lastPlayId=null}
 if(manual)S.manual=true;for(var i=0;i<S.list.length;i++)if(S.list[i].id===id)S.cur=i;renderAll();fetchSummary(true)}
// ---------- ingest ----------
var lastPlayId=null;
function ingestScoreboard(sb){var gs=(sb.events||[]).map(game);var prev={};S.games.forEach(function(g){prev[g.id]=g.state});S.games=gs;S.list=order(gs);
 // wanted game/team from launch params
 if(S.want.game){var w=gs.filter(function(g){return g.id===String(S.want.game)})[0];if(w){select(w.id,true);S.want.game=null}else if(!S.want.tried){S.want.tried=1;findGame(S.want.game)}}
 if(S.want.team){var ws=S.list.filter(function(g){return teamIs(g.H,S.want.team)||teamIs(g.A,S.want.team)});if(ws.length){select(ws[0].id,true);S.want.team=null}
   else if(!S.want.teamTried&&S.mode==='live'&&!lgOf(Q.league)&&!TEAM_LG[norm(S.want.team)]){S.want.teamTried=1;var o=S.league==='cfb'?'nfl':'cfb';getJSON(sbURL(o)).then(function(sb2){if((sb2.events||[]).map(game).some(function(g){return teamIs(g.H,S.want.team)||teamIs(g.A,S.want.team)}))setLeague(o,true)}).catch(function(){})}
   else if(S.want.teamTried){toast('No '+LG[S.league].name+' game this week for '+S.want.team);S.want.team=null}}
 // favorites kicking off -> follow
 if(S.mode==='live'&&S.autoFollow)gs.forEach(function(g){if(prev[g.id]==='pre'&&g.state==='in'&&(isFav(g.H)||isFav(g.A))&&(!selected()||selected().state!=='in'||!(isFav(selected().H)||isFav(selected().A)))){select(g.id,false);toast('★ '+g.A.short+' at '+g.H.short+' just kicked off')}});
 if(!selected()&&!S.want.game){var d=pickDefault();if(d)select(d.id,false)}
 for(var i=0;i<S.list.length;i++)if(S.list[i].id===S.selId&&!S.manualCur)S.cur=i;
 var key=JSON.stringify(gs.map(function(g){return [g.id,g.state,g.H.score,g.A.score,g.clock,g.period,g.sit&&g.sit.possession,g.sit&&g.sit.isRedZone]}));
 if(key!==S.lastSbKey){S.lastSbKey=key;renderTicker();renderList();renderBug();renderSub()}}
function findGame(id){var o=S.league==='cfb'?'nfl':'cfb';getJSON(sumURL(S.league,id)).catch(function(){return getJSON(sumURL(o,id)).then(function(s){setLeague(o,true);return s})}).then(function(s){
  var c=s.header.competitions[0];S.extra=game({id:id,date:c.date,status:c.status,competitions:[c]});S.want.game=null;select(id,true)}).catch(function(){toast('Game '+id+' not found');S.want.game=null})}
function playsOf(sum){var d=sum&&sum.drives;if(!d)return [];var a=[];(d.previous||[]).forEach(function(x){a=a.concat(x.plays||[])});var pv=d.previous||[];if(d.current&&!(pv.length&&pv[pv.length-1].id===d.current.id))a=a.concat(d.current.plays||[]);return a}
function absY(pt,homeId){if(!pt)return null;if(pt.yardsToEndzone!=null&&pt.team&&pt.team.id!=null&&pt.yardsToEndzone>=0&&pt.yardsToEndzone<=100)return String(pt.team.id)===homeId?100-pt.yardsToEndzone:pt.yardsToEndzone;return pt.yardLine!=null?pt.yardLine:null}
var SKIP=/Kickoff|Extra Point|Two-?Point|End Period|End of|Timeout|Two-minute|Coin|Penalty \(Kickoff\)/i,NOSPOT=/End of Game|End Period|End of Half|Timeout|Two-minute|Official Timeout|Coin/i;
function ingestSummary(g,sum){var P=playsOf(sum),last=P[P.length-1];S.sum=sum;S.sumFor=g.id;
 var H=g.H.id,st={};
 // situation from latest play (+ scoreboard as backup)
 var sp=null;for(var i=P.length-1;i>=0;i--){var e=P[i].end;if(e&&absY(e,H)!=null&&!NOSPOT.test(P[i].type&&P[i].type.text||'')){sp=P[i];break}}
 if(!sp)for(i=P.length-1;i>=0;i--){if(absY(P[i].end,H)!=null){sp=P[i];break}}
 if(sp){var e=sp.end;if(/Field Goal/i.test(sp.type&&sp.type.text||'')&&absY(sp.start,H)!=null)e=sp.start;st.abs=absY(e,H);st.down=e.down;st.dist=e.distance;st.dd=e.downDistanceText||(e.down>0?ord(e.down)+' & '+e.distance:'');st.off=e.team&&String(e.team.id);st.ytez=e.yardsToEndzone}
 var dr=sum.drives||{},cd=dr.current||(dr.previous||[])[(dr.previous||[]).length-1];
 if(cd&&cd.team&&!st.off)st.off=String(cd.team.id);
 if(g.sit&&g.sit.possession&&g.state==='in'&&!sp){st.abs=g.sit.yardLine;st.down=g.sit.down;st.dist=g.sit.distance;st.dd=g.sit.downDistanceText;st.off=String(g.sit.possession)}
 st.rz=st.down>0&&st.ytez!=null&&st.ytez<=20;
 S.st=st;S.drive=cd||null;S.plays=P;S.last=last;
 // win probability
 var wp=sum.winprobability||[];S.wp=wp.length?wp[wp.length-1].homeWinPercentage:null;
 // celebration on new plays
 if(last&&lastPlayId&&last.id!==lastPlayId){var idx=-1;for(i=P.length-1;i>=0;i--)if(P[i].id===lastPlayId){idx=i;break}var fresh=idx>=0?P.slice(idx+1):[last];var ev=null;
   fresh.slice(-4).forEach(function(p,j){var e2=celebrate(p,P[P.indexOf(p)-1],g);if(e2)ev=e2});if(ev)S.pop=ev}
 if(last)lastPlayId=last.id;
 // timeouts from scoreboard situation
 renderBug();renderLast();renderCard();renderDrive();renderSub();
 if(g.state==='post'&&g.test&&!S.finishShown){S.finishShown=true;setTimeout(renderFinish,FROZEN!=null?0:1500)}}
function celebrate(p,prev,g){var t=(p.type&&p.type.text)||'',x=p.text||'';var dh=(p.homeScore||0)-((prev&&prev.homeScore)||0),da=(p.awayScore||0)-((prev&&prev.awayScore)||0);
 var side=dh>da?g.H:da>dh?g.A:null,big=null;
 if((/Touchdown/i.test(t)||/TOUCHDOWN/.test(x))&&(dh>=6||da>=6||p.scoringPlay))big='TOUCHDOWN';else if(/Field Goal Good/i.test(t))big='FIELD GOAL';else if(/Safety/i.test(t))big='SAFETY';
 else if(/Interception/i.test(t))big='INTERCEPTION';else if(/Fumble Recovery \(Opponent\)|Fumble Return/i.test(t))big='FUMBLE!';else if(/Blocked/i.test(t))big='BLOCKED!';else if(/Turnover on Downs/i.test(t))big='TURNOVER ON DOWNS';
 if(!big)return null;if(!side){var tid=(p.end&&p.end.team&&String(p.end.team.id))||'';side=tid===g.H.id?g.H:tid===g.A.id?g.A:null}
 return {txt:big,team:side,t0:animNow()-(FROZEN!=null?0.6:0)}}
// ---------- polling ----------
var lastSb=0,lastSum=0,busySb=false,busySum=false;
function fetchScoreboard(){if(busySb)return;busySb=true;var lg=S.league;getJSON(sbURL(lg)).then(function(sb){busySb=false;if(lg!==S.league||S.mode!=='live')return;S.err=null;ingestScoreboard(sb)})
 .catch(function(e){busySb=false;S.err=e;$('title').textContent='Can\'t reach ESPN ('+(e.message||e)+'), retrying…'})}
function fetchSummary(force){var g=selected();if(!g||g.test||S.mode!=='live')return;if(g.state==='pre'){S.sum=null;S.st=null;S.plays=[];S.last=null;S.drive=null;renderAll();return}
 if(busySum&&!force)return;busySum=true;var id=g.id,lg=S.league;getJSON(sumURL(lg,id)).then(function(s){busySum=false;var g2=selected();if(!g2||g2.id!==id)return;
   // keep score/status fresh from summary header
   try{var c=s.header.competitions[0];var gg=game({id:id,date:g2.date,status:c.status,competitions:[{competitors:c.competitors,situation:g2.sit,venue:{fullName:g2.venue},broadcasts:[{names:g2.tv?[g2.tv]:[]}]}]});
     ['H','A'].forEach(function(k){g2[k].score=gg[k].score});if(c.status){g2.state=gg.state;g2.clock=gg.clock;g2.period=gg.period;g2.sd=gg.sd;g2.detail=gg.detail;g2.name=gg.name}}catch(e){}
   ingestSummary(g2,s)}).catch(function(){busySum=false})}
function tick(force){var now=performance.now();
 if(S.mode==='test'){var t=clock(),lg=S.league;var sb=TestGame.scoreboard(lg,t);ingestScoreboard(sb);var g=selected();if(!g)return;
   var n=TestGame.summary(lg,t),key=(n.drives.current?n.drives.current.plays.length:0)+'/'+n.drives.previous.length+'/'+n.header.competitions[0].status.type.state;
   if(key!==S.sumKey||force){S.sumKey=key;ingestSummary(g,n)}renderBugClock();return}
 var g=selected(),live=S.games.some(function(x){return x.state==='in'});
 if(force||now-lastSb>(live?12000:45000)){lastSb=now;fetchScoreboard()}
 if(g&&g.state==='in'&&now-lastSum>6000){lastSum=now;fetchSummary()}}
// ---------- render: ticker ----------
function tickerItem(g){var sel=g.id===S.selId,fv=isFav(g.H)||isFav(g.A),s=g.sit||{},st=shortStatus(g);
 var hs=+g.H.score,as=+g.A.score,done=g.state==='post';
 function side(t,isH){var pos=g.state==='in'&&s.possession&&String(s.possession)===t.id;var cls=done?((isH?hs>as:as>hs)?'win':'lose'):'';
  return '<span class="tm '+cls+'">'+(t.rank?'<span class="rk">'+t.rank+'</span>':'')+img(t.logo,68)+esc(t.abbr)+(g.state!=='pre'?' <span class="sc">'+esc(t.score)+'</span>':'')+(pos?'<span class="pd"></span>':'')+'</span>'}
 return '<span class="ti'+(fv?' fav':'')+(sel?' sel':'')+'">'+(g.test?'<span class="k">TEST</span>':'')+side(g.A,false)+side(g.H,true)+
   (g.state==='in'&&s.isRedZone?'<span class="rz">RZ</span>':'')+'<span class="st '+(g.state==='in'?'l':g.state==='post'?'f':'')+'">'+esc(st)+'</span></span>'}
function renderTicker(){var L=S.list,live=L.filter(function(g){return g.state==='in'}).length,fin=L.filter(function(g){return g.state==='post'}).length,up=L.length-live-fin;
 var lc=$('lgchip');lc.textContent=S.mode==='test'?'TEST':LG[S.league].label;lc.className='lg '+(S.mode==='test'?'test':S.league);
 $('nlive').textContent=S.mode==='test'?LG[S.league].name:(live?live+' LIVE':'No live games');$('nrest').textContent=S.mode==='test'?'synthetic game':fin+' final · '+up+' upcoming';
 var h=L.map(tickerItem).join('');var strip=$('tkstrip');if(!L.length){strip.innerHTML='<span class="ti">'+(S.err?'Waiting for ESPN…':'Loading…')+'</span>';S.tickW=0;return}
 strip.innerHTML=h+h;S.tickW=strip.scrollWidth/2;if(S.tickW<$('tkwrap').clientWidth){strip.innerHTML=h;S.tickW=0}}
// ---------- render: list ----------
function renderList(){var L=S.list,h='',sec=null;L.forEach(function(g,i){var s=g.state==='in'?'LIVE':g.state==='pre'?'UPCOMING':'FINAL';if(s!==sec){sec=s;h+='<div class="gsec">'+s+'</div>'}
  var hs=+g.H.score,as=+g.A.score,done=g.state==='post',pos=g.state==='in'&&g.sit&&g.sit.possession;
  function ln(t,isH){var l=done&&(isH?hs<as:as<hs);return '<div class="ln'+(l?' l':'')+'">'+img(t.logo,52)+'<span class="n">'+(t.rank?'<span class="rk">'+t.rank+' </span>':'')+esc(t.short||t.abbr)+(isFav(t)?' <span class="fv">★</span>':'')+(pos&&String(pos)===t.id?' <span class="pd"></span>':'')+'</span><span class="s">'+(g.state!=='pre'?esc(t.score):'')+'</span></div>'}
  h+='<div class="gr'+(i===S.cur?' cur':'')+(g.id===S.selId?' on':'')+'" data-i="'+i+'"><div class="tt">'+ln(g.A,false)+ln(g.H,true)+'</div><div class="gs'+(g.state==='in'?' l':'')+'">'+esc(shortStatus(g)).replace(' ','<br>')+(g.state==='in'&&g.sit&&g.sit.isRedZone?'<br><span class="rz">RZ</span>':'')+'</div></div>'});
 $('glist').innerHTML='<div id="gin">'+(h||'<div class="gsec">No games</div>')+'</div>';$('ghead').textContent=(S.mode==='test'?'Test game':LG[S.league].name+' games')+(L.length?' · '+L.length:'');scrollList()}
function scrollList(){var gin=$('gin'),c=gin&&gin.querySelector('.gr.cur');if(!c||PHONE)return;var top=c.offsetTop,vh=$('glist').clientHeight;var y=Math.max(0,Math.min(top-vh/2+36,gin.scrollHeight-vh));gin.style.top=-y+'px'}
// ---------- render: scorebug / sub / last play / card ----------
function renderSub(){var g=selected(),m=$('mode');if(!g){m.textContent=S.mode==='test'?'TEST GAME':'LIVE';return}
 m.className='mode '+(g.test?'test':g.state);m.textContent=g.test?'TEST GAME':g.state==='in'?'LIVE':g.state==='post'?'FINAL':'UPCOMING';
 $('title').textContent=(g.A.rank?'#'+g.A.rank+' ':'')+g.A.short+(g.neutral?' vs ':' at ')+(g.H.rank?'#'+g.H.rank+' ':'')+g.H.short;
 $('detail').textContent=[g.test?'Synthetic game, fictional players':'',g.venue,g.tv,S.mode==='test'?S.speed+'x':''].filter(Boolean).join(' · ')}
function tos(n){var h='';for(var i=0;i<3;i++)h+='<i'+(i<n?'':' class="u"')+'></i>';return h}
function renderBug(){var g=selected(),b=$('bug');if(!g){b.innerHTML='';return}var st=S.st||{},sit=g.sit||{},hs=+g.H.score,as=+g.A.score;
 function bt(t,isH){var pos=g.state==='in'&&st.off===t.id&&st.down>0,lose=g.state==='post'&&(isH?hs<as:as<hs),to=isH?sit.homeTimeouts:sit.awayTimeouts;
  return '<div class="bt '+(isH?'home':'away')+(lose?' lose':'')+'"><div class="bar" style="background:'+t.color+'"></div>'+img(t.logo,184)+'<div><div class="nm">'+(t.rank?'<span class="rk">#'+t.rank+'</span>':'')+esc(t.short||t.abbr)+(pos?' ':'')+'</div>'+
   '<div class="rc">'+esc([t.rec,isH?'Home':'Away'].filter(Boolean).join(' · '))+(isFav(t)?' · ★':'')+'</div>'+(g.state==='in'&&to!=null?'<div class="to">'+tos(to)+'</div>':'')+'</div>'+(pos?'<svg class="pos" viewBox="0 0 40 24"><ellipse cx="20" cy="12" rx="18" ry="10" fill="#8b4a1f" stroke="#fff" stroke-width="2"/><path d="M12 12h16M15 9v6M19 9v6M23 9v6" stroke="#fff" stroke-width="1.8"/></svg>':'')+'<div class="pts">'+(g.state==='pre'?'':esc(t.score))+'</div></div>'}
 b.innerHTML=bt(g.A,false)+'<div class="bc" id="bc"></div>'+bt(g.H,true);renderBugClock()}
function renderBugClock(){var g=selected(),c=$('bc');if(!g||!c)return;var st=S.st||{};var h;
 if(g.state==='pre')h='<div class="q">KICKOFF</div><div class="clk" style="font-size:40px">'+esc(g.test?g.sd:shortStatus(g))+'</div>';
 else if(g.state==='post')h='<div class="fin">FINAL</div><div class="q">'+(/OT/.test(g.sd)?'OVERTIME':esc(g.H.score+'–'+g.A.score))+'</div>';
 else if(/HALFTIME/.test(g.name))h='<div class="q">2ND QTR</div><div class="clk">HALF</div>';
 else{var dd=st.down>0&&st.dd?st.dd:'';h='<div class="q">'+(g.period>4?'OVERTIME':ord(g.period).toUpperCase()+' QTR')+'</div><div class="clk">'+esc(/END_PERIOD/.test(g.name)?'END':g.clock)+'</div>'+(dd?'<div class="dd'+(st.rz?' rzd':'')+'">'+esc(dd)+'</div>':'')}
 if(c.innerHTML!==h)c.innerHTML=h}
function renderLast(){var p=S.last,g=selected();var pre=$('pre');
 if(g&&g.state==='pre'){pre.classList.remove('hidden');pre.innerHTML='<div class="k">'+(g.test?'TEST GAME':'UPCOMING')+'</div><div class="m">'+img(g.A.logo,168)+'<span class="vs">'+(g.neutral?'vs':'@')+'</span>'+img(g.H.logo,168)+'</div><div class="t">'+esc(g.test?g.sd:g.detail.replace(/^\d+\/\d+ - /,''))+'</div><div class="v">'+esc([g.date.toDateString().slice(0,10),g.venue,g.tv].filter(Boolean).join(' · '))+'</div>'}
 else pre.classList.add('hidden');
 if(!p){$('lpk').innerHTML='LAST PLAY';$('lpt').textContent=g&&g.state==='pre'?(g.test?g.sd:'Kickoff '+shortStatus(g)+(g.tv?' on '+g.tv:'')):'Waiting for play-by-play…';return}
 var c=p.period&&p.clock?(p.period.number>4?'OT':'Q'+p.period.number)+' '+p.clock.displayValue:'';$('lpk').innerHTML='LAST PLAY <span class="ty">'+esc(((p.type&&p.type.text)||'').toUpperCase())+'</span><span style="color:var(--dim);letter-spacing:1px">'+esc(c)+'</span>';
 $('lpt').textContent=(p.text||'').replace(/^\(\d+:\d+\)\s*/,'')}
function renderDrive(){var d=S.drive,g=selected(),el=$('drivebar');if(!d||!g){el.innerHTML='';return}var t=d.team&&String(d.team.id)===g.H.id?g.H:g.A;
 el.innerHTML=img(t.logo,56,'lgo')+'<b>'+esc((!d.displayResult&&S.sumFor===g.id&&g.state==='in'?'Current drive':'Last drive')+' · '+(t.short||t.abbr))+'</b><span>'+esc(d.description||'')+'</span>'+(d.displayResult?'<span>Result: <b>'+esc(d.displayResult)+'</b></span>':'')+(d.start&&d.start.text?'<span>Start: '+esc(d.start.text)+'</span>':'')}
function statOf(sum,tid,name){var T=(sum&&sum.boxscore&&sum.boxscore.teams)||[];for(var i=0;i<T.length;i++)if(String(T[i].team.id)===tid){var s=T[i].statistics||[];for(var j=0;j<s.length;j++)if(s[j].name===name)return s[j].displayValue}return '–'}
function leader(sum,tid,name){var L=(sum&&sum.leaders)||[];for(var i=0;i<L.length;i++)if(String(L[i].team&&L[i].team.id)===tid){var c=L[i].leaders||[];for(var j=0;j<c.length;j++)if(c[j].name===name&&c[j].leaders&&c[j].leaders[0]){var x=c[j].leaders[0];return {n:(x.athlete&&(x.athlete.shortName||x.athlete.displayName))||'',v:(x.displayValue||'').replace(/,.*$/,'').replace(/^(\d+\/\d+), /,'')}}}return null}
function renderCard(){var g=selected(),c=$('card');if(!g){c.innerHTML='';return}var sum=S.sumFor===g.id?S.sum:null,A=g.A,H=g.H;
 var h='<div class="k"><span>Matchup</span><span>'+esc(g.test?'TEST GAME':(g.state==='post'?'Final':g.state==='in'?'Live':'Preview'))+'</span></div>';
 if(S.wp!=null&&sum&&g.state!=='pre'){var hp=Math.round(S.wp*100);h+='<div class="wp"><div class="wb"><div style="width:'+(100-hp)+'%;background:'+A.color+'"></div><div style="flex:1;background:'+H.color+'"></div></div><div class="wl"><span>'+esc(A.abbr)+' '+(100-hp)+'%</span><span style="color:var(--dim);font-size:14px;letter-spacing:2px">WIN PROBABILITY</span><span>'+hp+'% '+esc(H.abbr)+'</span></div></div>'}
 var rows=[['Record · Rank',(A.rec||'–')+(A.rank?' · #'+A.rank:''),(H.rank?'#'+H.rank+' · ':'')+(H.rec||'–')]];
 if(sum&&g.state!=='pre')[['totalYards','Total yds'],['netPassingYards','Passing'],['rushingYards','Rushing'],['firstDowns','1st downs'],['turnovers','Turnovers']].forEach(function(r){rows.push([r[1],statOf(sum,A.id,r[0]),statOf(sum,H.id,r[0])])});
 h+='<table class="ct"><tr><th>'+img(A.logo,68)+'</th><th></th><th>'+img(H.logo,68)+'</th></tr>'+rows.map(function(r){return '<tr><td>'+esc(r[1])+'</td><td>'+esc(r[0])+'</td><td>'+esc(r[2])+'</td></tr>'}).join('')+'</table>';
 if(sum&&g.state!=='pre'){var lh='';[['passingYards','PASS'],['rushingYards','RUSH'],['receivingYards','REC']].forEach(function(k){var a=leader(sum,A.id,k[0]),b=leader(sum,H.id,k[0]);if(a||b)lh+='<div><span>'+esc(a?a.n+' '+a.v:'')+'</span><i>'+k[1]+'</i><span style="text-align:right">'+esc(b?b.n+' '+b.v:'')+'</span></div>'});if(lh)h+='<div class="ldr">'+lh+'</div>'}
 if(window.PWA)h+='<div class="favs">'+[A,H].map(function(t){return '<button data-fav="'+t.id+'">'+(isFav(t)?'★ ':'☆ ')+esc(t.short||t.abbr)+'</button>'}).join('')+'</div>';
 c.innerHTML=h}
function renderFinish(){var g=selected(),f=$('finish');if(!g||g.state!=='post'){f.classList.add('hidden');return}var hs=+g.H.score,as=+g.A.score,w=hs>as?g.H:g.A,sum=S.sum;
 var ld=[];if(sum)[['passingYards','Passing'],['rushingYards','Rushing'],['receivingYards','Receiving']].forEach(function(k){[g.A,g.H].forEach(function(t){var l=leader(sum,t.id,k[0]);if(l&&t===w)ld.push(k[1]+': '+l.n+' '+l.v)})});
 f.innerHTML='<div class="k">'+(g.test?'TEST GAME · ':'')+'FINAL</div><div class="fs">'+img(g.A.logo,192)+'<span class="p'+(as<hs?' l':'')+'">'+as+'</span><span class="d">–</span><span class="p'+(hs<as?' l':'')+'">'+hs+'</span>'+img(g.H.logo,192)+'</div>'+
  '<div class="w">'+esc(w.name||w.short)+' win</div>'+(ld.length?'<div class="ld">'+esc(ld.join(' · '))+'</div>':'')+'<div class="hint">'+(window.PWA?'Tap Test game to replay':'OK replay · ◀ menu · Back to close')+'</div>';f.classList.remove('hidden')}
function renderAll(){renderTicker();renderList();renderSub();renderBug();renderLast();renderCard();renderDrive();if(!S.sum)$('drivebar').innerHTML=''}
// ---------- field canvas ----------
var cv=$('field'),cx=cv.getContext('2d'),W=1360,H=520,RAT=1,PHONE=false,IMG={};
function getImg(u){if(!u)return null;var k=logo(u,200);if(!IMG[k]){var i=new Image();i.crossOrigin='anonymous';i.onerror=function(){i.bad=1};i.src=k;IMG[k]=i}var m=IMG[k];return m.complete&&!m.bad&&m.naturalWidth?m:null}
function layout(){if(!window.PWA){W=1360;H=520;return}
 var mm=function(q){return window.matchMedia&&matchMedia(q).matches},por=mm('(orientation:portrait)'),lph=!por&&mm('(max-height:599px)');PHONE=por||lph;var B=document.body.classList;B.toggle('phone',PHONE);B.toggle('lphone',lph);B.toggle('land',!PHONE);var R=document.documentElement.classList;R.toggle('phone',PHONE);R.toggle('lphone',lph);R.toggle('land',!PHONE);
 if(!PHONE){var z=Math.min(innerWidth/1920,innerHeight/1080);document.body.style.zoom=z}else document.body.style.zoom='';
 W=PHONE?760:1360;H=PHONE?420:520;var dpr=Math.min(3,window.devicePixelRatio||1),dw=W;
 if(PHONE){cv.style.width='0px';var wr=cv.parentNode;dw=wr.clientWidth;
  if(lph){var col=$('lcol'),top=wr.getBoundingClientRect().top-col.getBoundingClientRect().top+col.scrollTop,av=col.clientHeight-top-6;if(av>80)dw=Math.min(dw,Math.floor(av*W/H))}}
 RAT=(PHONE?dw/W:1)*dpr;cv.style.width=dw+'px';cv.style.height=(PHONE?Math.round(dw*H/W):H)+'px';cv.width=Math.round(W*RAT);cv.height=Math.round(H*RAT);var zc=$('zc');if(zc&&PHONE)zc.style.right=Math.max(0,(cv.parentNode.clientWidth-dw)/2)+8+'px';clampZ();zoomUI();renderList();renderTicker()}
// ---------- field zoom (phone PWA only): pinch 1-4x, one-finger pan when zoomed, double-tap 1x/2.5x, follow-ball ----------
var Z={s:1,ox:0,oy:0,follow:true,bx:null,by:null};
function clampZ(){Z.s=Math.max(1,Math.min(4,Z.s));Z.ox=Math.max(0,Math.min(W-W/Z.s,Z.ox));Z.oy=Math.max(0,Math.min(H-H/Z.s,Z.oy))}
function zoomUI(){var zc=$('zc');if(!zc)return;var on=Z.s>1.01;zc.classList.toggle('hidden',!on);cv.classList.toggle('zoomed',on);var f=$('zfollow');if(f)f.classList.toggle('on',Z.follow)}
function zoomAt(ns,lx,ly){var vx=(lx-Z.ox)*Z.s,vy=(ly-Z.oy)*Z.s;Z.s=Math.max(1,Math.min(4,ns));Z.ox=lx-vx/Z.s;Z.oy=ly-vy/Z.s;clampZ();zoomUI()}
function zoomFocus(){var x=Z.bx!=null?Z.bx:W/2,y=Z.by!=null?Z.by:H/2;return [x,Math.min(y,H*0.66)]}
function zoomTo(ns){var f=zoomFocus();Z.s=ns;Z.ox=f[0]-W/(2*ns);Z.oy=f[1]-H/(2*ns);clampZ();zoomUI()}
function followStep(){if(Z.s<=1.01||!Z.follow||Z.bx==null)return;var f=zoomFocus(),tx=f[0]-W/(2*Z.s),ty=f[1]-H/(2*Z.s);Z.ox+=(tx-Z.ox)*0.12;Z.oy+=(ty-Z.oy)*0.12;clampZ()}
function toLogical(cxp,cyp){var r=cv.getBoundingClientRect();return [Z.ox+(cxp-r.left)/r.width*W/Z.s,Z.oy+(cyp-r.top)/r.height*H/Z.s]}
function initZoom(){if(!window.PWA)return;var T={},lastTap=0,lastTapX=0,lastTapY=0;
 function pts(e){return Array.prototype.map.call(e.touches,function(t){return [t.clientX,t.clientY]})}
 cv.addEventListener('touchstart',function(e){if(!PHONE)return;var p=pts(e);T.n=p.length;T.moved=false;T.t0=Date.now();
  if(p.length===2){T.d0=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);T.s0=Z.s;T.m=toLogical((p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2);T.multi=true;e.preventDefault()}
  else if(p.length===1){T.p=p[0];T.sx=p[0][0];T.sy=p[0][1];T.multi=false;if(Z.s>1.01)e.preventDefault()}},{passive:false});
 cv.addEventListener('touchmove',function(e){if(!PHONE)return;var p=pts(e),r=cv.getBoundingClientRect();
  if(p.length===2&&T.d0){e.preventDefault();var d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),mx=(p[0][0]+p[1][0])/2,my=(p[0][1]+p[1][1])/2,ns=Math.max(1,Math.min(4,T.s0*d/T.d0));
   Z.s=ns;Z.ox=T.m[0]-(mx-r.left)/r.width*W/ns;Z.oy=T.m[1]-(my-r.top)/r.height*H/ns;if(ns>1.01)Z.follow=false;clampZ();zoomUI();T.moved=true}
  else if(p.length===1&&Z.s>1.01&&T.p){e.preventDefault();var dx=p[0][0]-T.p[0],dy=p[0][1]-T.p[1];if(Math.abs(p[0][0]-T.sx)+Math.abs(p[0][1]-T.sy)>6){T.moved=true;Z.follow=false}
   Z.ox-=dx/r.width*W/Z.s;Z.oy-=dy/r.height*H/Z.s;T.p=p[0];clampZ();zoomUI()}
  else if(p.length===1&&T.p&&Math.abs(p[0][0]-T.sx)+Math.abs(p[0][1]-T.sy)>6)T.moved=true},{passive:false});
 cv.addEventListener('touchend',function(e){if(!PHONE)return;if(e.touches.length===0){if(Z.s<1.05){Z.s=1;Z.ox=0;Z.oy=0;Z.follow=true;zoomUI()}
   if(!T.moved&&!T.multi&&Date.now()-T.t0<300){var now=Date.now();if(now-lastTap<320&&Math.abs(T.sx-lastTapX)<30&&Math.abs(T.sy-lastTapY)<30){e.preventDefault();lastTap=0;if(Z.s>1.01){Z.s=1;Z.ox=0;Z.oy=0;Z.follow=true;zoomUI()}else{Z.follow=true;zoomTo(2.5)}}else{lastTap=now;lastTapX=T.sx;lastTapY=T.sy}}
   T.d0=0;T.p=null}else if(e.touches.length===1){T.d0=0;var t=e.touches[0];T.p=[t.clientX,t.clientY]}},{passive:false});
 ['gesturestart','gesturechange'].forEach(function(n){cv.addEventListener(n,function(e){e.preventDefault()})});
 cv.addEventListener('wheel',function(e){if(!PHONE)return;e.preventDefault();var l=toLogical(e.clientX,e.clientY);zoomAt(Z.s*Math.exp(-e.deltaY*0.002),l[0],l[1]);if(Z.s>1.01)Z.follow=false;else Z.follow=true},{passive:false});
 cv.addEventListener('dblclick',function(e){if(!PHONE)return;if(Z.s>1.01){Z.s=1;Z.ox=0;Z.oy=0;Z.follow=true;zoomUI()}else{Z.follow=true;zoomTo(2.5)}});
 var zr=$('zreset'),zf=$('zfollow');if(zr)zr.addEventListener('click',function(){Z.s=1;Z.ox=0;Z.oy=0;Z.follow=true;zoomUI()});
 if(zf)zf.addEventListener('click',function(){Z.follow=!Z.follow;zoomUI()})}
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function ease(k){k=Math.max(0,Math.min(1,k));return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2}
function draw(){var g=selected();cx.setTransform(RAT,0,0,RAT,0,0);cx.clearRect(0,0,W,H);followStep();if(Z.s>1.01)cx.setTransform(RAT*Z.s,0,0,RAT*Z.s,-Z.ox*RAT*Z.s,-Z.oy*RAT*Z.s);
 var fx=W*0.022,fw=W-2*fx,fy=H*0.06,fh=H*0.88,ppy=fw/120;function X(a){return fx+(110-a)*ppy}
 var u=H/520;
 // turf
 for(var i=0;i<12;i++){cx.fillStyle=i%2?'#2f7a3d':'#2a6f37';cx.fillRect(fx+i*10*ppy,fy,10*ppy+1,fh)}
 var gr=cx.createLinearGradient(0,fy,0,fy+fh);gr.addColorStop(0,'rgba(0,0,0,.18)');gr.addColorStop(.5,'rgba(255,255,255,.04)');gr.addColorStop(1,'rgba(0,0,0,.22)');cx.fillStyle=gr;cx.fillRect(fx,fy,fw,fh);
 // end zones: left = away goal (abs 100+), right = home goal (abs <0)
 if(g){[[g.A,fx],[g.H,X(0)]].forEach(function(z){var t=z[0],x=z[1];cx.fillStyle=t.color;cx.fillRect(x,fy,10*ppy,fh);cx.fillStyle='rgba(0,0,0,.18)';cx.fillRect(x,fy,10*ppy,fh);
   var im=getImg(t.logo);cx.save();cx.translate(x+5*ppy,fy+fh/2);cx.rotate(x<W/2?-Math.PI/2:Math.PI/2);
   cx.fillStyle='rgba(255,255,255,.92)';cx.font='900 '+Math.round(46*u)+'px Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';
   var nm=(t.nick||t.abbr||'').toUpperCase();var tw=cx.measureText(nm).width,max=fh*0.62;if(tw>max){cx.font='900 '+Math.round(46*u*max/tw)+'px Inter,sans-serif'}
   cx.fillText(nm,0,0);cx.restore();if(im){var s=Math.min(8*ppy,70*u);cx.globalAlpha=.9;cx.drawImage(im,x+5*ppy-s/2,fy+6*u,s,s);cx.drawImage(im,x+5*ppy-s/2,fy+fh-s-6*u,s,s);cx.globalAlpha=1}})}
 // lines
 cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=2*u;cx.strokeRect(fx,fy,fw,fh);
 for(var y=0;y<=100;y+=5){var x=X(y);cx.lineWidth=(y%10===0?2.2:1.2)*u;cx.globalAlpha=y%10===0?.85:.5;cx.beginPath();cx.moveTo(x,fy);cx.lineTo(x,fy+fh);cx.stroke()}cx.globalAlpha=1;
 cx.fillStyle='rgba(255,255,255,.55)';for(y=1;y<100;y++){if(y%5===0)continue;var x2=X(y);[0.02,0.36,0.62,0.96].forEach(function(f){cx.fillRect(x2-0.6*u,fy+fh*f-3*u,1.2*u,6*u)})}
 cx.fillStyle='rgba(255,255,255,.7)';cx.font='800 '+Math.round(30*u)+'px Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';
 for(y=10;y<100;y+=10){var lab=String(y<=50?y:100-y);cx.fillText(lab,X(y),fy+fh*0.88);cx.save();cx.translate(X(y),fy+fh*0.12);cx.rotate(Math.PI);cx.fillText(lab,0,0);cx.restore()}
 if(!g||g.state==='pre'||!S.st||S.st.abs==null){Z.bx=null;Z.by=null;drawPop();return}
 var st=S.st,offH=st.off===g.H.id,dir=offH?1:-1,live=g.state==='in';
 // drive chart
 var D=S.drive,pl=(D&&D.plays||[]).filter(function(p){return !SKIP.test((p.type&&p.type.text)||'')&&p.start&&p.end});pl=pl.slice(-11);
 var top=fy+fh*0.2,bot=fy+fh*0.70,rh=Math.min(30*u,(bot-top)/Math.max(pl.length,1));
 pl.forEach(function(p,i){var a=absY(p.start,g.H.id),b=absY(p.end,g.H.id),y=top+i*rh+rh/2;if(a==null||b==null)return;var t=(p.type&&p.type.text)||'',bad=/Interception|Fumble Recovery \(Opponent\)|Sack|Safety|Blocked/i.test(t),
   sc=p.scoringPlay||/Touchdown|Field Goal Good/i.test(t),inc=/Incompletion|Spike/i.test(t)||/incomplete|spiked/i.test(p.text||'')||/Field Goal/i.test(t);
   var col=sc?'#ffd400':bad?'#ff5a5a':inc?'rgba(255,255,255,.55)':(p.statYardage<0?'#ff9a5a':'#ffffff'),xa=X(a),xb=X(b);
   cx.strokeStyle=col;cx.fillStyle=col;cx.lineWidth=Math.max(2,rh*0.22);cx.lineCap='round';
   if(inc||Math.abs(xb-xa)<2){cx.beginPath();cx.arc(xa,y,rh*0.18,0,7);cx.fill();}else{cx.beginPath();cx.moveTo(xa,y);cx.lineTo(xb,y);cx.stroke();var d=xb>xa?1:-1;cx.beginPath();cx.moveTo(xb+d*rh*0.25,y);cx.lineTo(xb-d*rh*0.1,y-rh*0.28);cx.lineTo(xb-d*rh*0.1,y+rh*0.28);cx.closePath();cx.fill()}
   var yd=p.statYardage,lb=/Punt/.test(t)?'PUNT':/Field Goal Good/.test(t)?'FG':/Field Goal Missed/.test(t)?'NO GOOD':/Touchdown/i.test(t)?'TD':/Interception/.test(t)?'INT':/Fumble Recovery \(Opponent\)/.test(t)?'FUM':inc?(/spike/i.test(p.text)?'SPIKE':'INC'):/Penalty/.test(t)?'PEN':(yd>0?'+':'')+yd;
   cx.font='800 '+Math.round(Math.min(18*u,rh*0.62))+'px Inter,sans-serif';cx.textBaseline='middle';var lx=Math.max(xa,xb)+rh*0.45;cx.textAlign='left';if(lx>fx+fw-40*u){lx=Math.min(xa,xb)-rh*0.45;cx.textAlign='right'}
   cx.fillStyle='rgba(0,0,0,.55)';var tw=cx.measureText(lb).width;cx.fillRect(cx.textAlign==='left'?lx-3:lx-tw-3,y-rh*0.34,tw+6,rh*0.68);cx.fillStyle=col;cx.fillText(lb,lx,y)});
 // LOS + line to gain
 var tgt=st.abs;if(!S.ball||S.ball.to!==tgt){var curX=S.ball?ballPos():tgt;S.ball={from:S.ball?curX:tgt,to:tgt,t0:animNow()-(FROZEN!=null?(window.__half?0.45:1):0),pass:S.last&&/Pass|Touchdown|Punt|Kickoff|Field Goal/i.test((S.last.type&&S.last.type.text)||'')}}
 var bp=ballPos(),bx=X(bp);
 if(st.down>0&&live){cx.fillStyle='rgba(40,120,255,.9)';cx.fillRect(X(st.abs)-2*u,fy,4*u,fh);
   if(st.dist>0&&!(st.ytez!=null&&st.dist>=st.ytez)){var fdx=X(st.abs+dir*st.dist);cx.fillStyle='rgba(255,212,0,.95)';cx.fillRect(fdx-2*u,fy,4*u,fh)}}
 // ball + possession arrow
 var by=fy+fh*0.84;Z.bx=bx;Z.by=by;var k=ease((animNow()-S.ball.t0)/0.9),arc=S.ball.pass&&k<1?Math.sin(Math.PI*k)*fh*0.18:0;
 cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(bx,by+10*u,14*u,4*u,0,0,7);cx.fill();
 cx.save();cx.translate(bx,by-arc);cx.rotate(-0.35);cx.fillStyle='#8b4a1f';cx.beginPath();cx.ellipse(0,0,17*u,10*u,0,0,7);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=1.6*u;cx.beginPath();cx.moveTo(-6*u,0);cx.lineTo(6*u,0);cx.stroke();
 for(var l=-4;l<=4;l+=2.7){cx.beginPath();cx.moveTo(l*u,-3*u);cx.lineTo(l*u,3*u);cx.stroke()}cx.restore();
 var ot=offH?g.H:g.A;if(live&&st.off){var ax=bx+(offH?-1:1)*-34*u,ay=fy+fh*0.84;var tip=ax+dir*-1*0;cx.fillStyle=ot.color;cx.strokeStyle='#fff';cx.lineWidth=2*u;var d2=offH?-1:1;
   cx.beginPath();cx.moveTo(bx+d2*30*u,ay-11*u);cx.lineTo(bx+d2*52*u,ay-11*u);cx.lineTo(bx+d2*52*u,ay-20*u);cx.lineTo(bx+d2*70*u,ay);cx.lineTo(bx+d2*52*u,ay+20*u);cx.lineTo(bx+d2*52*u,ay+11*u);cx.lineTo(bx+d2*30*u,ay+11*u);cx.closePath();cx.fill();cx.stroke();
   var im=getImg(ot.logo);var s=40*u,lx2=bx-d2*44*u-s/2;rr(lx2-3,ay-s/2-3,s+6,s+6,8*u);cx.fillStyle='rgba(0,0,0,.6)';cx.fill();if(im)cx.drawImage(im,lx2,ay-s/2,s,s)}
 drawPop()}
function ballPos(){var b=S.ball;if(!b)return 50;return b.from+(b.to-b.from)*ease((animNow()-b.t0)/0.9)}
function drawPop(){var p=S.pop;if(!p)return;cx.setTransform(RAT,0,0,RAT,0,0);var a=animNow()-p.t0,D=3.2;if(a>D||a<0){if(a>D)S.pop=null;return}var u=H/520,sc=a<0.35?0.6+0.4*ease(a/0.35)*1.08:a>D-0.4?1-(a-(D-0.4))/0.4*0.15:1,al=a>D-0.4?(D-a)/0.4:Math.min(1,a/0.15);
 cx.save();cx.globalAlpha=al;cx.translate(W/2,H/2);cx.scale(sc,sc);var col=p.team?p.team.color:'#e8202a';cx.font='900 '+Math.round(84*u)+'px Inter,sans-serif';var tw=cx.measureText(p.txt).width;
 var bw=Math.min(W*0.9,tw+220*u),bh=150*u;cx.shadowColor='rgba(0,0,0,.6)';cx.shadowBlur=30*u;rr(-bw/2,-bh/2,bw,bh,24*u);cx.fillStyle=col;cx.fill();cx.shadowBlur=0;cx.lineWidth=5*u;cx.strokeStyle='#fff';cx.stroke();
 var im=p.team&&getImg(p.team.logo);if(im){cx.drawImage(im,-bw/2+20*u,-55*u,110*u,110*u)}cx.fillStyle='#fff';cx.textAlign='center';cx.textBaseline='middle';var fs=Math.round(84*u);if(tw>bw-170*u){fs=Math.round(fs*(bw-170*u)/tw)}cx.font='900 '+fs+'px Inter,sans-serif';
 cx.fillText(p.txt,im?50*u:0,4*u);cx.restore()}
// ---------- ticker scroll + frame loop ----------
function frame(ts){var dt=Math.min(.1,(ts-(S.lastT||ts))/1000);S.lastT=ts;if(S.tickW){S.tickOff=(S.tickOff+dt*(PHONE?45:75))%S.tickW;$('tkstrip').style.transform='translate3d('+(-S.tickOff)+'px,0,0)'}else $('tkstrip').style.transform='';
 draw();requestAnimationFrame(frame)}
// ---------- menu / remote ----------
var toastT;function toast(m){var t=$('toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.add('hidden')},2600)}
function setLeague(lg,quiet){if(!LG[lg])return;S.league=lg;store.set('fl.league',lg);S.games=[];S.list=[];S.selId=null;S.extra=null;S.sum=null;S.st=null;S.plays=[];S.last=null;S.drive=null;S.lastSbKey='';S.cur=0;S.manual=false;S.pop=null;lastPlayId=null;
 $('finish').classList.add('hidden');if(!quiet)toast(LG[lg].name+(S.mode==='test'?' test game':''));if(S.mode==='test')restartTest();else{renderAll();tick(true)}}
function setMode(m){S.mode=m;S.selId=null;S.games=[];S.list=[];S.sum=null;S.st=null;S.plays=[];S.last=null;S.drive=null;S.lastSbKey='';S.pop=null;lastPlayId=null;$('finish').classList.add('hidden');
 if(m==='test'){restartTest();toast(LG[S.league].name+' TEST GAME')}else{renderAll();tick(true);toast('Live '+LG[S.league].name+' games')}}
function menuItems(){var g=selected(),it=[];
 it.push({t:'League: '+LG[S.league].name,s:'switch to '+(S.league==='cfb'?'NFL':'College'),f:function(){S.menu=false;setLeague(S.league==='cfb'?'nfl':'cfb')}});
 it.push({t:'Live games',s:S.mode==='live'?'● on':'',f:function(){S.menu=false;setMode('live')}});
 it.push({t:'Test game',s:(S.league==='cfb'?'SC @ Clemson':'ATL @ Carolina')+(S.mode==='test'?' ●':''),f:function(){S.menu=false;setMode('test')}});
 if(S.mode==='test'){it.push({t:'Speed',s:S.speed+'x',f:function(){setSpeed(S.speed===1?2:S.speed===2?4:1)}});it.push({t:'Restart test game',f:function(){S.menu=false;restartTest()}})}
 if(g&&!g.test)[g.A,g.H].forEach(function(t){it.push({t:(isFav(t)?'★ Unfavorite ':'☆ Favorite ')+(t.short||t.abbr),f:function(){toggleFav(t)}})});
 it.push({t:'Follow favorites',s:S.autoFollow?'On':'Off',f:function(){S.autoFollow=!S.autoFollow;store.set('fl.follow',S.autoFollow)}});
 return it}
function toggleFav(t){var f=favs().filter(function(x){return !teamIs(t,x)});if(f.length===favs().length)f.push(t.id);store.set('fl.fav.'+S.league,f);toast((f.indexOf(t.id)>=0?'★ ':'Removed ')+(t.short||t.abbr));S.list=order(S.games);for(var i=0;i<S.list.length;i++)if(S.list[i].id===S.selId)S.cur=i;renderAll()}
function renderMenu(){var m=$('menu');if(!S.menu){m.classList.add('hidden');return}var it=menuItems();S.menuIdx=Math.max(0,Math.min(S.menuIdx,it.length-1));
 m.innerHTML='<div class="mh">FOOTBALL LIVE · MENU</div>'+it.map(function(x,i){return '<div class="mi'+(i===S.menuIdx?' cur':'')+'">'+esc(x.t)+(x.s?'<small>'+esc(x.s)+'</small>':'')+'</div>'}).join('');m.classList.remove('hidden')}
window.toggleMenu=function(){S.menu=!S.menu;S.menuIdx=0;renderMenu()};
window.onBackTV=function(){if(S.menu){S.menu=false;renderMenu();return true}if(!$('finish').classList.contains('hidden')){$('finish').classList.add('hidden');return true}return false};
window.applyParams=function(o){o=o||{};var lg=lgOf(o.league)||(o.team&&TEAM_LG[norm(o.team)])||null;if(o.mode)S.mode=/test|demo/.test(o.mode)?'test':'live';
 if(o.team)S.want={team:o.team};if(o.game)S.want={game:o.game};if(o.team&&!lg){S.want.teamTried=0}
 if(lg&&lg!==S.league)setLeague(lg,true);else if(o.mode)setMode(S.mode);else tick(true);if(o.speed&&S.mode==='test')setSpeed(+o.speed)};
document.addEventListener('keydown',function(e){var k=e.keyCode;
 if(S.menu){var it=menuItems();if(k===38)S.menuIdx=(S.menuIdx+it.length-1)%it.length;else if(k===40)S.menuIdx=(S.menuIdx+1)%it.length;else if(k===13||k===23){var f=it[S.menuIdx].f;f();if(S.menu)renderMenu()}else if(k===37||k===27||k===8||k===77||k===82){S.menu=false}renderMenu();e.preventDefault();return}
 if(k===38||k===40){if(!S.list.length)return;S.cur=(S.cur+(k===38?-1:1)+S.list.length)%S.list.length;S.manualCur=true;renderList();e.preventDefault()}
 else if(k===13||k===23){if(!$('finish').classList.contains('hidden')&&S.mode==='test'){restartTest();return}var g=S.list[S.cur];if(g){select(g.id,true);S.manualCur=false}}
 else if(k===37||k===77||k===82){toggleMenu();e.preventDefault()}
 else if(k===39||k===228||k===90){if(S.mode==='test')setSpeed(S.speed===1?2:S.speed===2?4:1);else setLeague(S.league==='cfb'?'nfl':'cfb')}
 else if(k===27||k===8){onBackTV()}});
// PWA / tests API
window.FL={state:S,setLeague:setLeague,setMode:setMode,setSpeed:setSpeed,restart:restartTest,select:function(id){select(id,true)},toggleFav:function(id){var g=selected();[g.A,g.H].forEach(function(t){if(t.id===id)toggleFav(t)})},layout:layout,zoom:Z,zoomTo:function(s){Z.follow=true;zoomTo(s)}};
window.__render=function(t){FROZEN=t;S.mode='test';tick(true);if(selected()&&selected().state==='post')renderFinish();draw();return selected()&&selected().sd};
var rzT;window.addEventListener('resize',function(){layout();clearTimeout(rzT);rzT=setTimeout(layout,350)});initZoom();layout();renderAll();if(window.PWA)setTimeout(layout,400);
if(Q.simt&&S.mode==='test'){window.__render(+Q.simt)}else tick(true);
setInterval(function(){if(FROZEN==null)tick()},250);
requestAnimationFrame(frame);
})();
