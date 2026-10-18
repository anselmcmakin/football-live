// Synthetic TEST GAME in ESPN scoreboard/summary JSON shape (fictional players), so it runs through the live code path.
// College: South Carolina @ Clemson.  NFL: Falcons @ Panthers (NFL rules: touchback to 35, PAT from the 15, two-minute warning, no first-down clock stops).
(function(){
var TEAMS={
 cfb:{H:{id:'228',abbreviation:'CLEM',location:'Clemson',name:'Tigers',displayName:'Clemson Tigers',shortDisplayName:'Clemson',color:'f56600',alternateColor:'522d80',logo:'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',rank:12,rec:'4-2',
       qb:'C. Whitfield',rb:'D. Mayes',wr:['T. Hollins','B. Rivers','K. Shaw'],k:'R. Lund',p:'G. Ivey',db:'J. Pruitt',venue:'Memorial Stadium'},
      A:{id:'2579',abbreviation:'SC',location:'South Carolina',name:'Gamecocks',displayName:'South Carolina Gamecocks',shortDisplayName:'South Carolina',color:'73000a',alternateColor:'000000',logo:'https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png',rank:99,rec:'3-3',
       qb:'L. Sellers-Day',rb:'M. Odom',wr:['N. Tate','J. Baxter','A. Greer'],k:'C. Mott',p:'H. Platt',db:'R. Felder'}},
 nfl:{H:{id:'29',abbreviation:'CAR',location:'Carolina',name:'Panthers',displayName:'Carolina Panthers',shortDisplayName:'Panthers',color:'0085ca',alternateColor:'101820',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',rank:99,rec:'2-2',
       qb:'B. Yancey',rb:'C. Hubbs',wr:['T. Moore-Lane','X. Ford','J. Sanders'],k:'E. Pineda',p:'J. Hekker-Ray',db:'J. Horne-Ellis',venue:'Bank of America Stadium'},
      A:{id:'1',abbreviation:'ATL',location:'Atlanta',name:'Falcons',displayName:'Atlanta Falcons',shortDisplayName:'Falcons',color:'a71930',alternateColor:'000000',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',rank:99,rec:'2-3',
       qb:'M. Penn',rb:'B. Robbins',wr:['D. London-Hale','K. Pitts-Ward','R. McCloud'],k:'Y. Koo-Park',p:'B. Pinion-Lee',db:'A. Terrell-Mays'}}};
// Script: drives with quarter q and offense; tokens: rN run, pN pass, pNo pass out of bounds, i incomplete, sN sack, puntN, fg, int, fum, rTD/pTD,
// kneel, spike, to (timeout), 2mw, @m:ss clock anchor. "N:" = NFL only, "C:" = college only.
var SCRIPT=[
 {q:1,o:'H',ko:1,p:'r4 p11 r6 i p18 r3 p9 r5 rTD'},
 {q:1,o:'A',p:'r3 p6 i punt42'},
 {q:1,o:'H',p:'r2 p6 s5 punt45'},
 {q:1,o:'A',p:'p14 r5 r6 p9 r3 i p12 r4 i fg'},
 {q:2,o:'H',p:'r7 r3 p16 int'},
 {q:2,o:'A',p:'r5 p12 r3 p9 pTD'},
 {q:2,o:'H',p:'r6 p9 r4 r2 i punt40'},
 {q:2,o:'A',p:'r2 i p5 N:@2:00 N:2mw punt38'},
 {q:2,o:'H',p:'C:@1:52 N:@1:49 p12o i p17 spike p9 r4 to p14o i fg'},
 {q:3,o:'A',ko:1,p:'r6 p15 r4 fum'},
 {q:3,o:'H',p:'p22 r8 r3 pTD'},
 {q:3,o:'A',p:'r4 p8 p19 r6 i p11 r3 p7 rTD'},
 {q:4,o:'H',p:'r5 r2 p14 r6 p10 p9 r3 i fg'},
 {q:4,o:'A',p:'p9 r3 p17 r4 i p20 pTD'},
 {q:4,o:'H',p:'@2:41 p11 r4 N:@2:00 N:2mw p16 i p13o to p9o pTD'},
 {q:4,o:'A',p:'p8 i p12 int'},
 {q:4,o:'H',p:'kneel kneel kneel'}];
var ORD=['','1st','2nd','3rd','4th'];
function mmss(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
var cache={};
function build(lg){if(cache[lg])return cache[lg];var T=TEAMS[lg],NFL=lg==='nfl',TB=NFL?35:25;
 var plays=[],drives=[],st={o:'H',ytez:75,down:1,dist:10,sc:{H:0,A:0},q:1},seq=0,wr=0;
 var X=function(s){return s==='H'?'A':'H'};
 function abs(o,y){return o==='H'?100-y:y}
 function ptxt(o,y){var t=T[o],d=T[X(o)];return y>50?t.abbreviation+' '+(100-y):y<50?d.abbreviation+' '+y:'50'}
 function ddt(){var g=st.ytez<=st.dist;return ORD[st.down]+' & '+(g?'Goal':st.dist)}
 function snap(){return {down:st.down,distance:st.dist,yardLine:abs(st.o,st.ytez),yardsToEndzone:st.ytez,downDistanceText:ddt()+' at '+ptxt(st.o,st.ytez),shortDownDistanceText:ddt(),possessionText:ptxt(st.o,st.ytez),team:{id:T[st.o].id}}}
 function emit(tid,ttext,text,o){var p={id:'9900'+(++seq),sequenceNumber:String(seq),type:{id:tid,text:ttext},text:text,period:{number:st.q},clock:{displayValue:''},
   scoringPlay:false,start:o.start,end:o.end||snap(),statYardage:o.yds||0,_dur:o.dur||0,_sim:o.sim||3.4,_q:st.q,_anchor:o.anchor,_kind:o.kind,_off:o.off,_drive:o.drive,_raw:o.raw};
   if(o.score){p.scoringPlay=true;p.scoreValue=o.score}plays.push(p);return p}
 function gain(n){st.ytez-=n;st.dist-=n;if(st.dist<=0){st.down=1;st.dist=Math.min(10,st.ytez);return true}st.down++;return false}
 function changePoss(newYtez){st.o=X(st.o);st.ytez=newYtez;st.down=1;st.dist=Math.min(10,newYtez)}
 function kickoff(kicker,drive){var o=st.o;st.o=kicker;var s0={down:1,distance:10,yardLine:abs(kicker,65),yardsToEndzone:65,team:{id:T[kicker].id}};
   changePoss(100-TB);var rec=T[st.o];
   emit('53','Kickoff',NFL?T[kicker].k+' kicks 65 yards from '+T[kicker].abbreviation+' 35 to end zone, Touchback to the '+rec.abbreviation+' '+TB+'.':'#'+(40+seq%50)+' '+T[kicker].k+' kickoff 65 yards to the '+rec.abbreviation+'00, Touchback',{start:s0,dur:0,sim:2.2,kind:'ko',drive:drive})}
 var lastKick=null;
 SCRIPT.forEach(function(D,di){
   var toks=D.p.split(' ').filter(function(t){if(t.slice(0,2)==='N:')return NFL;if(t.slice(0,2)==='C:')return !NFL;return true}).map(function(t){return t.replace(/^[NC]:/,'')});
   if(D.q!==st.q){var endTxt=st.q===2?'End of Half':'End of '+ORD[st.q]+' Quarter';var pe=plays[plays.length-1].end;emit(st.q===2?'65':'2',st.q===2?'End of Half':'End Period',endTxt,{start:pe,end:pe,dur:0,sim:st.q===2?6:3,kind:'end'});st.q=D.q}
   if(D.ko||lastKick){kickoff(X(D.o),di);lastKick=null}
   if(st.o!==D.o)throw new Error('poss mismatch drive '+di);
   var d={id:'99'+di,team:T[D.o],start:{period:{number:st.q},yardLine:abs(st.o,st.ytez),text:ptxt(st.o,st.ytez)},plays:[],_i0:plays.length,_n:0,_yds:0};drives.push(d);
   var off=T[st.o],def=T[X(st.o)],anchor=null;
   toks.forEach(function(tk){var s=snap(),m,txt,fd,P;
     var pre=NFL?'':'('+'__C__'+') ';
     if(tk[0]==='@'){anchor=tk.slice(1);return}
     var opt={start:s,anchor:anchor,off:st.o,drive:di};anchor=null;
     if(tk==='rTD'||tk==='pTD'){var n=st.ytez;var rcv=off.wr[wr++%3];st.sc[st.o]+=6;
       txt=tk==='rTD'?pre+off.rb+' rush up the middle for '+n+' yards for a TOUCHDOWN':pre+off.qb+' pass complete deep to '+rcv+' for '+n+' yards for a TOUCHDOWN';
       st.ytez=0;opt.end={down:-1,distance:0,yardLine:abs(st.o,0),yardsToEndzone:0,team:{id:off.id}};opt.yds=n;opt.score=6;opt.dur=8;opt.sim=5;opt.kind=tk;
       emit(tk==='rTD'?'68':'67',tk==='rTD'?'Rushing Touchdown':'Passing Touchdown',txt,opt);
       st.sc[st.o]+=1;var xs={down:-1,distance:0,yardLine:abs(st.o,NFL?15:3),yardsToEndzone:NFL?15:3,team:{id:off.id}};
       emit('61','Extra Point Good',NFL?off.k+' extra point is GOOD from the 15 (33 yards).':pre+off.k+' extra point GOOD',{start:xs,end:xs,score:1,dur:0,sim:2.5,kind:'xp',off:st.o,drive:di});
       d.result='TD';d.displayResult='Touchdown';d._yds+=n;d._n++;lastKick=1;return}
     if(m=tk.match(/^r(-?\d+)$/)){var n=+m[1];fd=gain(n);txt=pre+off.rb+' rush '+(['left','right','up the middle'][seq%3])+' for '+n+' yard'+(n===1?'':'s')+' to the '+ptxt(st.o,st.ytez)+(fd?', 1ST DOWN':'');
       opt.yds=n;opt.dur=NFL?40:36;opt.raw=fd&&!NFL?9:30;opt.kind='run';emit('5','Rush',txt,opt)}
     else if(m=tk.match(/^p(\d+)(o?)$/)){var n=+m[1],ob=!!m[2],rcv=off.wr[wr++%3];fd=gain(n);txt=pre+off.qb+' pass complete '+(n>15?'deep':'short')+' '+(['left','right','middle'][seq%3])+' to '+rcv+' for '+n+' yards to the '+ptxt(st.o,st.ytez)+(ob?', out of bounds':'')+(fd?', 1ST DOWN':'');
       opt.yds=n;opt.dur=ob?7:32;opt.raw=ob?6:(fd&&!NFL?8:24);opt.kind='pass';emit('24','Pass Reception',txt,opt)}
     else if(tk==='i'){st.down++;txt=pre+off.qb+' pass incomplete '+(['deep left','short right','to the sideline'][seq%3])+' intended for '+off.wr[(wr+1)%3];opt.dur=5;opt.raw=5;opt.sim=2.4;opt.kind='inc';emit('3','Pass Incompletion',txt,opt)}
     else if(m=tk.match(/^s(\d+)$/)){var n=+m[1];gain(-n);txt=pre+off.qb+' sacked by '+def.db+' for a loss of '+n+' yards to the '+ptxt(st.o,st.ytez);opt.yds=-n;opt.dur=32;opt.raw=30;opt.kind='sack';emit('7','Sack',txt,opt)}
     else if(m=tk.match(/^punt(\d+)$/)){var n=+m[1],land=st.ytez-n;if(land<5)land=20;var ny=100-land;txt=pre+off.p+' punt '+n+' yards to the '+ptxt(X(st.o),ny).replace(' ','')+', fair catch';
       changePoss(ny);opt.end=snap();opt.dur=10;opt.raw=8;opt.kind='punt';emit('52','Punt',txt,opt);d.result='PUNT';d.displayResult='Punt'}
     else if(tk==='fg'){var dist=st.ytez+17;st.sc[st.o]+=3;txt=pre+off.k+' '+dist+' yard field goal is GOOD';opt.score=3;opt.dur=5;opt.raw=4;opt.sim=4.5;opt.kind='fg';
       opt.end={down:-1,distance:0,yardLine:abs(st.o,st.ytez),yardsToEndzone:st.ytez,team:{id:off.id}};emit('59','Field Goal Good',txt,opt);d.result='FG';d.displayResult='Field Goal';lastKick=1}
     else if(tk==='int'){var air=14,ret=6,spot=st.ytez-air;var ny=100-spot+ret;ny=Math.max(10,Math.min(90,100-(spot+ret)));changePoss(ny);
       txt=pre+off.qb+' pass intended for '+off.wr[wr%3]+' INTERCEPTED by '+def.db+' at the '+ptxt(st.o,ny+ret)+', returned '+ret+' yards to the '+ptxt(st.o,ny);opt.end=snap();opt.dur=12;opt.raw=10;opt.sim=4.5;opt.kind='int';
       emit('26','Pass Interception Return',txt,opt);d.result='INT';d.displayResult='Interception'}
     else if(tk==='fum'){var n=3;var spot=st.ytez-n;changePoss(100-spot);txt=pre+off.rb+' rush for '+n+' yards, FUMBLES, forced by '+def.db+', RECOVERED by '+def.abbreviation+' at the '+ptxt(st.o,st.ytez);
       opt.end=snap();opt.dur=12;opt.raw=10;opt.sim=4.5;opt.kind='fum';emit('29','Fumble Recovery (Opponent)',txt,opt);d.result='FUMBLE';d.displayResult='Fumble'}
     else if(tk==='spike'){st.down++;txt=pre+off.qb+' spiked the ball to stop the clock';opt.dur=2;opt.raw=2;opt.sim=2;opt.kind='inc';emit('3','Pass Incompletion',txt,opt)}
     else if(tk==='kneel'){gain(-1);txt=pre+off.qb+' kneels for a loss of 1 yard';opt.yds=-1;opt.dur=40;opt.raw=40;opt.sim=2.2;opt.kind='run';emit('5','Rush',txt,opt)}
     else if(tk==='to'){txt='Timeout '+off.abbreviation;opt.end=s;opt.dur=0;opt.raw=0;opt.sim=1.6;opt.kind='to';emit('21','Timeout',txt,opt)}
     else if(tk==='2mw'){txt='Two-Minute Warning';opt.end=s;opt.dur=0;opt.raw=0;opt.sim=2.5;opt.kind='to';emit('75','Two-minute warning',txt,opt)}
     else throw new Error('bad token '+tk);
     if(st.down>4)throw new Error('turnover on downs? drive '+di+' '+tk);
   });
   if(!d.result&&di===SCRIPT.length-1){d.result='END OF GAME';d.displayResult='End of Game'}
 });
 var pe=plays[plays.length-1].end;emit('66','End of Game','END GAME',{start:pe,end:pe,dur:0,sim:3,kind:'end'});
 // ---- game clock per quarter: scale segments between anchors to fit ----
 for(var q=1;q<=4;q++){var P=plays.filter(function(p){return p._q===q});var segs=[],cur={start:900,pl:[]};
   P.forEach(function(p){if(p._anchor){segs.push(cur);var a=p._anchor.split(':');cur={start:+a[0]*60+ +a[1],pl:[],anchored:1}}cur.pl.push(p)});segs.push(cur);
   segs.forEach(function(sg,k){var nxt=k+1<segs.length?segs[k+1].start:0,room=sg.start-nxt,last=k===segs.length-1;
     var raw=sg.pl.map(function(p){return sg.anchored?(p._raw!=null?p._raw:p._dur):p._dur}),sum=raw.reduce(function(a,b){return a+b},0)||1;
     var f=(!sg.anchored||!last||sum>room)?room/sum:1,c=sg.start;
     sg.pl.forEach(function(p,i){p._c0=c;c-=raw[i]*f;if(c<0.5&&!(i===sg.pl.length-1))c=Math.max(c,1);p._c1=(last&&i===sg.pl.length-1&&p._kind==='end')?0:Math.max(0,c)})});
   P.forEach(function(p){if(p._kind==='end')p._c1=0;p.clock.displayValue=mmss(p._c1);p.text=p.text.replace('__C__',mmss(p._c0).padStart(5,'0'))})}
 // ---- sim time, scores, win prob ----
 var t=0,sc={H:0,A:0};plays.forEach(function(p){p._t=t;t+=p._sim;if(p.scoreValue){var o=p.end.team.id===T.H.id?'H':'A';sc[o]+=p.scoreValue}p.homeScore=sc.H;p.awayScore=sc.A;
   var rem=(4-p._q)*900+p._c1,diff=sc.H-sc.A+(p.end.team&&p.end.team.id===T.H.id?1.2:-1.2)+0.8;p._wp=p._kind==='end'&&p._q===4?(sc.H>sc.A?1:0):1/(1+Math.exp(-diff/(1.2+11*Math.sqrt(rem/3600))))});
 var g={T:T,plays:plays,drives:drives,len:t,lg:lg};cache[lg]=g;return g}
function competitor(g,o,score,full,ls){var T=g.T[o],tm={id:T.id,uid:'',abbreviation:T.abbreviation,location:T.location,name:T.name,displayName:T.displayName,shortDisplayName:T.shortDisplayName,color:T.color,alternateColor:T.alternateColor,logo:T.logo,logos:[{href:T.logo}]};
 return {id:T.id,homeAway:o==='H'?'home':'away',team:tm,score:String(score),curatedRank:{current:T.rank},rank:T.rank<99?T.rank:undefined,records:[{type:'total',summary:T.rec}],record:[{type:'total',summary:T.rec,displayValue:T.rec}],linescores:ls}}
function stateAt(lg,t){var g=build(lg),P=g.plays.filter(function(p){return p._t<=t});return {g:g,P:P,last:P[P.length-1]}}
function statusOf(g,P,last,t){if(!last)return {clock:900,displayClock:'15:00',period:1,type:{id:'1',name:'STATUS_SCHEDULED',state:'pre',completed:false,description:'Scheduled',detail:'Kickoff in '+Math.ceil(-t)+'s',shortDetail:'Kickoff in '+Math.ceil(-t)+'s'}};
 if(last.type.id==='66')return {clock:0,displayClock:'0:00',period:4,type:{id:'3',name:'STATUS_FINAL',state:'post',completed:true,description:'Final',detail:'Final',shortDetail:'Final'}};
 if(last.type.id==='65')return {clock:0,displayClock:'0:00',period:2,type:{id:'23',name:'STATUS_HALFTIME',state:'in',completed:false,description:'Halftime',detail:'Halftime',shortDetail:'Halftime'}};
 var q=last._q,c=last.clock.displayValue;if(last.type.id==='2'){var e='End of '+ORD[q];return {clock:0,displayClock:'0:00',period:q,type:{id:'22',name:'STATUS_END_PERIOD',state:'in',completed:false,description:'End of Period',detail:e+' Quarter',shortDetail:e}}}
 return {clock:last._c1,displayClock:c,period:q,type:{id:'2',name:'STATUS_IN_PROGRESS',state:'in',completed:false,description:'In Progress',detail:c+' - '+ORD[q]+' Quarter',shortDetail:c+' - '+ORD[q]}}}
function linescores(g,P){var r={H:[0,0,0,0],A:[0,0,0,0]};P.forEach(function(p){if(p.scoreValue){var o=p.end.team.id===g.T.H.id?'H':'A';r[o][p._q-1]+=p.scoreValue}});
 var maxq=P.length?P[P.length-1]._q:0;return {H:r.H.slice(0,maxq).map(function(v,i){return {value:v,displayValue:String(v),period:i+1}}),A:r.A.slice(0,maxq).map(function(v,i){return {value:v,displayValue:String(v),period:i+1}})}}
function clean(p){var o={};for(var k in p)if(k[0]!=='_')o[k]=p[k];return o}
var TestGame={teams:function(lg){return build(lg).T},length:function(lg){return build(lg).len},
 scoreboard:function(lg,t){var s=stateAt(lg,t),g=s.g,P=s.P,last=s.last,ls=linescores(g,P),hs=last?last.homeScore:0,as=last?last.awayScore:0,st=statusOf(g,P,last,t);
  var comp={id:'test-'+lg,date:'2026-10-17T19:00Z',competitors:[competitor(g,'H',hs,1,ls.H),competitor(g,'A',as,1,ls.A)],status:st,venue:{fullName:g.T.H.venue},broadcasts:[{names:['TEST']}]};
  if(last&&st.type.state==='in'){var e=last.end||{};comp.situation={down:e.down,distance:e.distance,yardLine:e.yardLine,downDistanceText:e.downDistanceText,shortDownDistanceText:e.shortDownDistanceText,possessionText:e.possessionText,
    isRedZone:e.yardsToEndzone!=null&&e.yardsToEndzone<=20&&e.down>0,possession:e.team&&e.down>0?e.team.id:undefined,lastPlay:{id:last.id,type:last.type,text:last.text}}}
  return {events:[{id:'test-'+lg,date:comp.date,name:g.T.A.displayName+' at '+g.T.H.displayName,shortName:g.T.A.abbreviation+' @ '+g.T.H.abbreviation,status:st,competitions:[comp],test:true}]}},
 summary:function(lg,t){var s=stateAt(lg,t),g=s.g,P=s.P,last=s.last,st=statusOf(g,P,last,t),ls=linescores(g,P),hs=last?last.homeScore:0,as=last?last.awayScore:0;
  var dv=[];g.drives.forEach(function(d,di){var pl=P.filter(function(p){return p._drive===di});if(!pl.length)return;var y=0,n=0;pl.forEach(function(p){if(['run','pass','sack','rTD','pTD','inc'].indexOf(p._kind)>=0){n++;y+=p.statYardage}});
    var lp=pl[pl.length-1],done=!!d.result&&pl.length===g.plays.filter(function(p){return p._drive===di}).length;
    dv.push({id:d.id,description:n+' plays, '+y+' yards',team:{id:d.team.id,abbreviation:d.team.abbreviation,displayName:d.team.displayName,logos:[{href:d.team.logo}]},start:d.start,end:{yardLine:lp.end.yardLine,text:lp.end.possessionText||''},
      yards:y,offensivePlays:n,isScore:done&&/TD|FG/.test(d.result),result:done?d.result:undefined,displayResult:done?d.displayResult:undefined,plays:pl.map(clean),_done:done})});
  var cur=dv.length&&!dv[dv.length-1]._done&&st.type.state!=='post'?dv.pop():null;
  // box score + leaders from the plays so far
  var B={H:{fd:0,py:0,ry:0,to:0,pc:0,pa:0,ra:0},A:{fd:0,py:0,ry:0,to:0,pc:0,pa:0,ra:0}},L={};
  P.forEach(function(p){var o=p._off;if(!o)return;var b=B[o],k=p._kind;if(/1ST DOWN/.test(p.text))b.fd++;
    if(k==='run'||k==='rTD'){b.ry+=p.statYardage;b.ra++;var who=g.T[o].rb;if(/kneels/.test(p.text))who=g.T[o].qb;(L[o+'r']=L[o+'r']||{})[who]=(L[o+'r'][who]||0)+p.statYardage}
    if(k==='pass'||k==='pTD'){b.py+=p.statYardage;b.pc++;b.pa++;(L[o+'p']=L[o+'p']||{})[g.T[o].qb]=(L[o+'p'][g.T[o].qb]||0)+p.statYardage;var rc=(p.text.match(/to (\w\. [\w-]+)/)||[])[1];if(rc)(L[o+'w']=L[o+'w']||{})[rc]=(L[o+'w'][rc]||0)+p.statYardage}
    if(k==='inc'&&!/spiked/.test(p.text)){b.pa++}if(k==='sack')b.py+=p.statYardage;if(k==='int'||k==='fum')b.to++});
  function stats(o){var b=B[o];return [{name:'firstDowns',label:'1st Downs',displayValue:String(b.fd)},{name:'totalYards',label:'Total Yards',displayValue:String(b.py+b.ry)},{name:'netPassingYards',label:'Passing',displayValue:String(b.py)},
    {name:'completionAttempts',label:'Comp/Att',displayValue:b.pc+'/'+b.pa},{name:'rushingYards',label:'Rushing',displayValue:String(b.ry)},{name:'rushingAttempts',label:'Rushing Attempts',displayValue:String(b.ra)},{name:'turnovers',label:'Turnovers',displayValue:String(b.to)}]}
  function lead(o,key,name,disp){var m=L[o+key]||{},best=null;for(var k in m)if(!best||m[k]>m[best])best=k;return {name:name,displayName:disp,leaders:best?[{displayValue:m[best]+' YDS',value:m[best],athlete:{displayName:best,shortName:best}}]:[]}}
  var leaders=['A','H'].map(function(o){return {team:{id:g.T[o].id,abbreviation:g.T[o].abbreviation},leaders:[lead(o,'p','passingYards','Passing Yards'),lead(o,'r','rushingYards','Rushing Yards'),lead(o,'w','receivingYards','Receiving Yards')]}});
  return {header:{id:'test-'+lg,competitions:[{id:'test-'+lg,competitors:[competitor(g,'H',hs,1,ls.H),competitor(g,'A',as,1,ls.A)],status:st}]},
   drives:{current:cur,previous:dv},winprobability:P.map(function(p){return {homeWinPercentage:+p._wp.toFixed(4),tiePercentage:0,playId:p.id}}),
   boxscore:{teams:[{team:{id:g.T.A.id},statistics:stats('A')},{team:{id:g.T.H.id},statistics:stats('H')}]},leaders:leaders,
   scoringPlays:P.filter(function(p){return p.scoringPlay}).map(clean),gameInfo:{venue:{fullName:g.T.H.venue}},test:true}},
 // final summary for the finish card
 final:function(lg){var g=build(lg),l=g.plays[g.plays.length-1];return {home:l.homeScore,away:l.awayScore}},
 _plays:function(lg){return build(lg).plays}};
window.TestGame=TestGame;
})();
