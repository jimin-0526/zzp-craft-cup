(function(){
  'use strict';

  /* ============================================================
     SETUP — fill these three in before you upload this file.
     1) GITHUB_OWNER / GITHUB_REPO: your GitHub username and the repo name.
     2) GITHUB_TOKEN: a FINE-GRAINED personal access token, scoped to ONLY
        this one repo, with ONLY "Contents: Read and write" permission.
        Create it at: https://github.com/settings/personal-access-tokens/new
        This token lets ANYONE who can read this file's source save changes
        (that's the tradeoff of a password-only, no-login admin system —
        see the setup guide for details). Keep its scope narrow and give it
        an expiration date; rotate it if you ever suspect misuse.
     3) ADMIN_PASSCODE: change this from the default before going live.
     ============================================================ */
  var GITHUB_OWNER = "YOUR_GITHUB_USERNAME";
  var GITHUB_REPO = "zzp-craft-cup";
  var GITHUB_BRANCH = "main";
  var GITHUB_TOKEN = "PASTE_YOUR_FINE_GRAINED_TOKEN_HERE";
  var ADMIN_PASSCODE = "zzp2026";

  var DATA_PATH = "data/state.json";
  var API_BASE = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO;
  var POLL_MS = 8000;

  var TEAM_ORDER = [
    "이우성잘생겼다","5Hz","애벌레퇴치반","아리이스포츠","제군","ZZP클랜 가고싶어요",
    "Team AXZ","미워하지마","에푸에수","절포님T1때부터팬이엿어요","DAEJEON GAME PT","G2G3",
    "AFFA GAMING","CNJ esports","태민이는친구가없어","pigy","에이아이온","맴매",
    "영서뚱땡이","Team WAC","Jeonnam Esports","송탄부대찌개","ㅎㅇ루","이세계로환생했더니SSS급마법사가되어버렷다!",
    "멍구마","메롱바","참교육","13년생과 ㅎㅇ루","공주님께인사","AKM","절크컵야르렁렁","찌찌뽕"
  ];

  function P(role,nick,uid){ return {role:role, nick:nick, uid:uid}; }
  var DEFAULT_PLAYERS = {
    1:[P("팀장","CG_YUCA","6957463386"),P("팀원","CG_GuSok","6220405118"),P("팀원","CG_Shun","6667060370"),P("팀원","CG_Clutch","61726162367"),P("후보","","")],
    2:[P("팀장","5HzـAtomic","6131162919"),P("팀원","5HzـSabyuk","6388716157"),P("팀원","5HzـKaKaoK","6100318742"),P("팀원","5HzـRazit","6646009117"),P("후보","5Hzـv1nz1nA","61884460199")],
    3:[P("팀장","나브는부재중","695921839"),P("팀원","ūŌ지ūū","62241004070"),P("팀원","파란코알라124","61546198024"),P("팀원","ū현준","6316346944"),P("후보","","")],
    4:[P("팀장","FS_Ari","61316794777"),P("팀원","FSـMahito","694840074"),P("팀원","DGـChuxz","62071903560"),P("팀원","KXـYuki","6508256002"),P("후보","WSـYETI","61852274075")],
    5:[P("팀장","FSـHyde","6102169859"),P("팀원","FSـNewjeans","61640469807"),P("팀원","Angks4","6575733557"),P("팀원","AZAKmagic","6100904777"),P("후보","","")],
    6:[P("팀장","TRGXـFANG","62073206577"),P("팀원","Aps丨정찬석","6660214603"),P("팀원","4EverHuski","6707081453"),P("팀원","GTـVanta","6242669294"),P("후보","","")],
    7:[P("팀장","휴게소노숙이","62325195070"),P("팀원","아웃패밀리미옥","61281753736"),P("팀원","동지여고정수현","696891242"),P("팀원","Necrxquality","6241953102"),P("후보","","")],
    8:[P("팀장","옥구꼬옹","6323242141"),P("팀원","giv٭nicetry","61842139342"),P("팀원","giv٭theshyyyy","6290955051"),P("팀원","요ㅅㅃ","62262045515"),P("후보","giv٭Nicetryy","61288273725")],
    9:[P("팀장","뽀은수","61619374331"),P("팀원","KGـOrca1","6428937737"),P("팀원","FS・CurexiQwO","61850944303"),P("팀원","FS・SzTxT","61700368042"),P("후보","","")],
    10:[P("팀장","RUـMYEONG","696775510"),P("팀원","RUـCHAN","61513084682"),P("팀원","RUـSEUNG","6299452651"),P("팀원","RUـHotdog","61991286168"),P("후보","","")],
    11:[P("팀장","DGP_AaRon","695894783"),P("팀원","DGP_JAEMIN","61254218193"),P("팀원","DGP_JAESUK","61421765325"),P("팀원","DGP_Sentinel","61016956107"),P("후보","","")],
    12:[P("팀장","sspecialeffect","62171280074"),P("팀원","RMـSyZen","6599934558"),P("팀원","VS・Breaker","697801052"),P("팀원","SGـNightmare","6148913798"),P("후보","","")],
    13:[P("팀장","āffāĪ나나","62335472378"),P("팀원","AXـShakey","6603278485"),P("팀원","고길동ļ","6365789297"),P("팀원","수리수리수다리","698291681"),P("후보","","")],
    14:[P("팀장","CNJـSIxTa","6249568001"),P("팀원","CNJـTwoHerz","6225224072"),P("팀원","CNJ_Marco","6878334658"),P("팀원","CNJـMaktoob","61811091173"),P("후보","","")],
    15:[P("팀장","DFM Meiy",""),P("팀원","DFM SSeeS",""),P("팀원","Radiant ally 4",""),P("팀원","DFM Akame",""),P("후보","","")],
    16:[P("팀장","17ŪLilghost","6234293961"),P("팀원","ĪŪūōĒ","61585235130"),P("팀원","정글은코크","696936816"),P("팀원","ūūYxun","62004167160"),P("후보","","")],
    17:[P("팀장","ACLـZero","61929094366"),P("팀원","ACLـAION","6450049400"),P("팀원","Fasty6","62387136068"),P("팀원","ACLـDobong","62018766959"),P("후보","","")],
    18:[P("팀장","AGPyogurt","6701829152"),P("팀원","Lisenneß","62299777355"),P("팀원","KhanـXungBin","61718821580"),P("팀원","waveـrequłm7","6684013440"),P("후보","","")],
    19:[P("팀장","EQEـSupergoku","6241283797"),P("팀원","EQEـLao","61682914361"),P("팀원","MEGAـIGL","6102571253"),P("팀원","MEGAـIone1yNt","6102553345"),P("후보","","")],
    20:[P("팀장","Hito2ruka٭͜","61763885446"),P("팀원","WACـINSAENGū","6602486776"),P("팀원","AGPnostal","6837500485"),P("팀원","WACـReign9","6257229494"),P("후보","WACـM","61534727601")],
    21:[P("팀장","JNEـTom","6139455582"),P("팀원","JNEـzZz","696553797"),P("팀원","JNEـBuzz","61752291524"),P("팀원","JNEـWoody","699246965"),P("후보","","")],
    22:[P("팀장","충과니・Qwer","61995356671"),P("팀원","군의폭탄박정현","62371525296"),P("팀원","이걸죽냐ㅋㅋ","62492110172"),P("팀원","CzlTv","6190568353"),P("후보","","")],
    23:[P("팀장","Tearsū","6118266227"),P("팀원","yeeunـax5","6341484350"),P("팀원","영정먹은ū정우","6368919099"),P("팀원","ROVkritix","6110434961"),P("후보","Tsukigasumi","6376432606")],
    24:[P("팀장","소보로빠앙ī","6869885749"),P("팀원","SzllSTORE","6152011557"),P("팀원","개민하는미쿠","62443588981"),P("팀원","aixleftūrz","6383002612"),P("후보","","")],
    25:[P("팀장","HeungBuu","6670988266"),P("팀원","AZAKGEOJE","62358231911"),P("팀원","SGـseoul","61648521928"),P("팀원","Rq멍구마ㅋㅋ","61688062383"),P("후보","SGـK","6345668872")],
    26:[P("팀장","ZPـRAM1","6101461734"),P("팀원","KXـxly","696328184"),P("팀원","ūNostalgia","62342534299"),P("팀원","ī寒霜 (한상)","62416660953"),P("후보","iVـKALIM","6184703584")],
    27:[P("팀장","xc즈운띠띠","6594553898"),P("팀원","Neophobia","62261396234"),P("팀원","AZAKYUNA","6745539361"),P("팀원","송하영원픽","62232050474"),P("후보","","")],
    28:[P("팀장","일요일마다교회","61857574934"),P("팀원","Autumn","62180169658"),P("팀원","무기와똘기들","6420031687"),P("팀원","AG •10","62262826040"),P("후보","","")],
    29:[P("팀장","Luvdiamond","61366620102"),P("팀원","luvstruck677","62026151489"),P("팀원","AKAī하늘","6558313352"),P("팀원","즐겜하지마세요","6689529748"),P("후보","CEMـJhaelix","61441238957")],
    30:[P("팀장","포카칩볶음밥","695664114"),P("팀원","GBـSigNaLww","61874687511"),P("팀원","뚱녀척살하기","62078496067"),P("팀원","EvenـKR","62340889612"),P("후보","","")],
    31:[P("팀장","Doribbi","61612395854"),P("팀원","giv٭r2btū","6708965894"),P("팀원","GBAـKelra","61690777563"),P("팀원","롱롱롱،،","6117055454"),P("후보","","")],
    32:[P("팀장","ssuzzy","62168432017"),P("팀원","zzizzi","62129710427"),P("팀원","Nxzunaluv4","61877513847"),P("팀원","king티라노","62061822365"),P("후보","","")]
  };
  var CONFIRMED_FALSE = {8:true,15:true};
  var TOTAL_TEAMS = 32;

  var ROUND_LABELS = ["32강","16강","8강","4강","결승"];
  var ROUND_EYEBROWS = ["ROUND OF 32","ROUND OF 16","QUARTERFINALS","SEMIFINALS","FINAL"];
  var ROUND_COUNTS = [16,8,4,2,1];
  var MATCH_START = [1,17,25,29,31];

  var MATCH_W = 210, MATCH_H = 64, COL_GAP = 64, BASE_GAP = 80;
  var BRACKET_W = 6*MATCH_W + 5*COL_GAP;
  var BRACKET_H = BASE_GAP*16;

  function colX(r){ return r*(MATCH_W+COL_GAP); }
  function centerY(r,i){ return BASE_GAP*Math.pow(2,r)*(i+0.5); }
  function matchNum(r,i){ return MATCH_START[r]+i; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function sleep(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }

  function utf8ToBase64(str){
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for(var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function base64ToUtf8(b64){
    var bin = atob(b64.replace(/\n/g, ""));
    var bytes = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function defaultTeams(){
    var t = {};
    for(var i=1;i<=TOTAL_TEAMS;i++){
      t[String(i)] = { name: TEAM_ORDER[i-1], confirmed: !CONFIRMED_FALSE[i], players: clone(DEFAULT_PLAYERS[i]) };
    }
    return t;
  }

  var DEFAULT_STATE = { drawn:false, drawnAt:null, order:[], results:{}, teams:defaultTeams() };

  function normalizeState(parsed){
    var st = clone(DEFAULT_STATE);
    if(parsed && typeof parsed === "object"){
      st.drawn = !!parsed.drawn;
      st.drawnAt = parsed.drawnAt || null;
      st.order = Array.isArray(parsed.order) ? parsed.order : [];
      st.results = (parsed.results && typeof parsed.results === "object") ? parsed.results : {};
      if(parsed.teams && typeof parsed.teams === "object" && Object.keys(parsed.teams).length){
        st.teams = parsed.teams;
      }
    }
    return st;
  }

  var state = clone(DEFAULT_STATE);
  var loaded = false;
  var isAdmin = false;
  var activeModal = null; // {id, mode}
  var syncOk = true;

  try{ if(sessionStorage.getItem("zzp_admin")==="1") isAdmin = true; }catch(e){}

  function teamOf(id, st){ return st.teams[String(id)] || {name:"?", confirmed:true, players:[]}; }
  function teamName(id, st){ return id ? teamOf(id, st).name : null; }

  function getMatch(r,i,st){
    if(r===0){
      var a = st.order[2*i] || null;
      var b = st.order[2*i+1] || null;
      var w = st.results["0-"+i] || null;
      return {a:a,b:b,winner:w};
    }
    var m0 = getMatch(r-1, 2*i, st);
    var m1 = getMatch(r-1, 2*i+1, st);
    var a = m0.winner ? (m0.winner==="a"?m0.a:m0.b) : null;
    var b = m1.winner ? (m1.winner==="a"?m1.a:m1.b) : null;
    var w = (a && b) ? (st.results[r+"-"+i] || null) : null;
    return {a:a,b:b,winner:w};
  }

  function teamStatus(id, st){
    if(!st.drawn) return {status:"pending"};
    var pos = st.order.indexOf(String(id));
    if(pos<0) return {status:"pending"};
    var i0 = Math.floor(pos/2);
    for(var r=0;r<=4;r++){
      var j = Math.floor(i0/Math.pow(2,r));
      var m = getMatch(r,j,st);
      if(m.a!==String(id) && m.b!==String(id)) return {status:"waiting", round:r};
      var mySlot = (m.a===String(id)) ? "a" : "b";
      if(!m.winner) return {status:"waiting", round:r};
      if(m.winner!==mySlot) return {status:"eliminated", round:r};
      if(r===4) return {status:"champion"};
    }
    return {status:"waiting", round:0};
  }

  /* ---------------- persistence ---------------- */

  async function fetchPublicState(){
    try{
      var res = await fetch(DATA_PATH + "?_=" + Date.now(), {cache:"no-store"});
      if(!res.ok) return null;
      return normalizeState(await res.json());
    }catch(e){ return null; }
  }

  async function fetchAuthedShaAndState(){
    var res = await fetch(API_BASE + "/contents/" + DATA_PATH + "?ref=" + GITHUB_BRANCH, {
      headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github+json" }
    });
    if(!res.ok) throw new Error("read " + res.status);
    var json = await res.json();
    var content = base64ToUtf8(json.content);
    return { sha: json.sha, state: normalizeState(JSON.parse(content)) };
  }

  async function writeState(newState, sha){
    var body = {
      message: "update state " + new Date().toISOString(),
      content: utf8ToBase64(JSON.stringify(newState, null, 2)),
      sha: sha,
      branch: GITHUB_BRANCH
    };
    var res = await fetch(API_BASE + "/contents/" + DATA_PATH, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if(res.status === 409) return "conflict";
    if(!res.ok) throw new Error("write " + res.status);
    return "ok";
  }

  async function mutateAndSave(mutatorFn){
    if(!isAdmin){ toast("관리자만 대진을 편집할 수 있습니다. 하단 '관리자' 버튼으로 로그인하세요."); return; }
    var prevState = state;
    try{
      var fresh = await fetchAuthedShaAndState();
      var ns = mutatorFn(clone(fresh.state));
      if(!ns) return;
      state = ns; render();
      var result = await writeState(ns, fresh.sha);
      if(result === "conflict"){
        toast("다른 사람이 방금 저장했어요. 최신 내용을 불러옵니다…");
        var latest = await fetchPublicState();
        if(latest){ state = latest; render(); }
        return;
      }
      syncOk = true;
    }catch(e){
      syncOk = false;
      state = prevState; render();
      toast("저장에 실패했습니다. 토큰/네트워크를 확인해주세요.");
    }
    updateSyncPill();
  }

  /* ---------------- mutations ---------------- */

  function setWinner(r,i,slot){
    mutateAndSave(function(ns){
      if(ns.results[r+"-"+i] === slot) return null;
      ns.results[r+"-"+i] = slot;
      var nr=r+1, ni=Math.floor(i/2);
      while(nr<=4){ delete ns.results[nr+"-"+ni]; ni=Math.floor(ni/2); nr++; }
      return ns;
    });
  }

  function resetResults(){
    if(!isAdmin){ toast("관리자만 초기화할 수 있습니다."); return; }
    if(!state.drawn) return;
    if(!window.confirm("모든 경기 결과를 초기화할까요? 대진 상대는 유지됩니다.")) return;
    mutateAndSave(function(ns){ ns.results = {}; return ns; });
  }

  function saveTeamEdit(id){
    if(!isAdmin) return;
    var nameInput = document.getElementById("edit-name-"+id);
    if(!nameInput) return;
    var newName = nameInput.value.trim();
    if(!newName){ toast("팀 이름을 입력해주세요."); return; }
    var players = [];
    var roles = ["팀장","팀원","팀원","팀원","후보"];
    for(var i=0;i<5;i++){
      var nickEl = document.getElementById("edit-nick-"+id+"-"+i);
      var uidEl = document.getElementById("edit-uid-"+id+"-"+i);
      players.push({ role: roles[i], nick: nickEl?nickEl.value.trim():"", uid: uidEl?uidEl.value.trim():"" });
    }
    var confirmEl = document.getElementById("edit-confirmed-"+id);
    var confirmed = confirmEl ? confirmEl.checked : true;
    activeModal = null;
    mutateAndSave(function(ns){
      ns.teams[String(id)] = { name:newName, confirmed:confirmed, players:players };
      return ns;
    });
  }

  /* ---------------- admin ---------------- */
  function toggleAdmin(){
    if(isAdmin){
      isAdmin = false;
      try{ sessionStorage.removeItem("zzp_admin"); }catch(e){}
      render();
      toast("관리자 모드를 종료했습니다.");
      return;
    }
    var pass = window.prompt("관리자 비밀번호를 입력하세요");
    if(pass===null) return;
    if(pass === ADMIN_PASSCODE){
      isAdmin = true;
      try{ sessionStorage.setItem("zzp_admin","1"); }catch(e){}
      render();
      toast("관리자 모드가 활성화되었습니다.");
    } else {
      toast("비밀번호가 올바르지 않습니다.");
    }
  }

  var toastTimer = null;
  function toast(msg){
    var el = document.getElementById("toast");
    if(!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 3200);
  }

  /* ---------------- icons ---------------- */
  function iconTrophy(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"/><path d="M7 5H4a3 3 0 0 0 3 3"/><path d="M17 5h3a3 3 0 0 1-3 3"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M10 16h4l.5 4h-5l.5-4Z"/></svg>';
  }
  function iconCrate(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M8 4l4 4 4-4"/><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M4 14h16"/><path d="M12 10v10"/></svg>';
  }
  function iconRefresh(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8 8 0 0 0 6 6.3L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 5.7l2-2.3"/><path d="M20 20v-4h-4"/></svg>';
  }
  function iconCheck(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }
  function iconClose(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';
  }
  function iconPencil(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  }
  function crestSvg(){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"/></svg>';
  }
  function heroBadgeSvg(){
    var ticks = "";
    for(var a=0; a<360; a+=15){
      var rad = a*Math.PI/180;
      var x1 = (150+119*Math.cos(rad)).toFixed(1), y1 = (150+119*Math.sin(rad)).toFixed(1);
      var x2 = (150+128*Math.cos(rad)).toFixed(1), y2 = (150+128*Math.sin(rad)).toFixed(1);
      ticks += '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(99,194,111,0.22)" stroke-width="1"/>';
    }
    return '<svg width="280" height="280" viewBox="0 0 300 300" fill="none">'
      + '<circle cx="150" cy="150" r="128" stroke="rgba(99,194,111,0.30)" stroke-width="1"/>'
      + '<circle cx="150" cy="150" r="108" stroke="rgba(178,181,150,0.2)" stroke-width="1" stroke-dasharray="3 7"/>'
      + ticks
      + '<path d="M150 42v216M42 150h216" stroke="rgba(99,194,111,0.10)" stroke-width="1"/>'
      + '<text x="150" y="172" text-anchor="middle" font-family="Black Ops One, sans-serif" font-size="88" fill="rgba(238,240,226,0.75)">32</text>'
      + '</svg>';
  }

  /* ---------------- render pieces ---------------- */

  function championOf(st){
    var f = getMatch(4,0,st);
    if(f.winner) return f.winner==="a" ? f.a : f.b;
    return null;
  }

  function renderHeader(st){
    var champId = championOf(st);
    var pillClass = "status-pill", pillText = "드로우 대기중";
    if(champId){ pillClass += " done"; pillText = "대회 종료 · 우승 " + escapeHtml(teamName(champId,st)); }
    else if(st.drawn){ pillClass += " live"; pillText = "대회 진행중"; }
    var syncCls = "sync-pill " + (syncOk ? "ok" : "err");
    var syncTxt = syncOk ? "실시간 동기화" : "동기화 오류";
    return ''
      + '<header class="site">'
      +   '<div class="header-row">'
      +     '<a href="#top" class="brand">'
      +       '<span class="crest">'+crestSvg()+'</span>'
      +       '<span class="brand-text"><span class="kr">절크컵</span><span class="en">2026 ZZP CRAFT CUP</span></span>'
      +     '</a>'
      +     '<nav class="site-nav">'
      +       '<a href="#draw">대진 추첨</a>'
      +       '<a href="#bracket">대진표</a>'
      +       '<a href="#teams">참가팀</a>'
      +     '</nav>'
      +     '<div style="display:flex;align-items:center;gap:12px;">'
      +       '<span class="'+syncCls+'" id="sync-pill"><span class="dot"></span>'+syncTxt+'</span>'
      +       '<span class="'+pillClass+'"><span class="dot"></span>'+pillText+'</span>'
      +     '</div>'
      +   '</div>'
      + '</header>'
      + '<div class="hazard-bar"></div>';
  }

  function renderHero(st){
    return ''
      + '<section class="hero" id="top">'
      +   '<span class="hero-badge">'+heroBadgeSvg()+'</span>'
      +   '<div class="wrap hero-inner">'
      +     '<span class="eyebrow">2026 SEASON · SINGLE ELIMINATION</span>'
      +     '<img class="hero-logo" src="assets/logo.png" alt="절크컵">'
      +     '<div class="hero-en">2026 ZZP CRAFT CUP</div>'
      +     '<p class="lede">32개 팀이 32강부터 차례로 맞붙어 단 한 팀의 우승팀이 가려질 때까지 겨루는 절크컵 공식 대진 페이지입니다. 대진 추첨과 경기 결과가 이 페이지에 실시간으로 기록됩니다.</p>'
      +     '<div class="meta-row">'
      +       '<div class="meta-chip"><span class="num">32</span><span class="lbl">참가 팀</span></div>'
      +       '<div class="meta-chip"><span class="num">5</span><span class="lbl">라운드</span></div>'
      +       '<div class="meta-chip"><span class="num">31</span><span class="lbl">경기</span></div>'
      +       '<div class="meta-chip"><span class="num">1</span><span class="lbl">챔피언</span></div>'
      +     '</div>'
      +     '<div class="cta-row">'
      +       '<a class="btn btn-primary" href="#bracket">대진표 보기</a>'
      +       '<a class="btn btn-ghost" href="#draw">대진 추첨하기</a>'
      +     '</div>'
      +   '</div>'
      + '</section>';
  }

  function renderDrawPanel(st){
    var subtitle = st.drawn
      ? ("추첨 완료 · " + new Date(st.drawnAt).toLocaleString("ko-KR", {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}))
      : "버튼을 누르면 에어드롭이 착륙하듯 32개 팀이 한 팀씩 무작위로 32강 대진에 투하됩니다.";
    var drawLabel = st.drawn ? "다시 추첨" : "대진 추첨 시작";
    var hasResults = st.results && Object.keys(st.results).length>0;
    return ''
      + '<section id="draw">'
      +   '<div class="wrap">'
      +     '<div class="section-head">'
      +       '<div><span class="eyebrow">DRAW EVENT</span><h2>대진 추첨</h2></div>'
      +       '<div class="desc">32개 팀을 랜덤으로 섞어 32강 대진표를 생성합니다.</div>'
      +     '</div>'
      +     '<div class="draw-card cut-tr reticle">'
      +       '<div class="draw-info">'
      +         '<span class="icon-box">'+iconCrate(24)+'</span>'
      +         '<div><div class="title">'+(st.drawn ? "대진이 확정되었습니다" : "대진이 아직 없습니다")+'</div><div class="sub">'+subtitle+'</div></div>'
      +       '</div>'
      +       '<div class="draw-actions">'
      +         (hasResults ? '<button type="button" class="btn btn-ghost btn-sm" data-action="reset-results">'+iconRefresh(15)+' 결과 초기화</button>' : '')
      +         '<button type="button" class="btn btn-primary" data-action="draw">'+iconCrate(17)+' '+drawLabel+'</button>'
      +       '</div>'
      +     '</div>'
      +   '</div>'
      + '</section>';
  }

  function slotHtml(m, slot, r, i, st){
    var id = m[slot];
    var filled = !!id;
    var name = filled ? teamName(id, st) : null;
    var isWinner = m.winner === slot;
    var isLoser = !!m.winner && m.winner !== slot;
    var clickable = filled && m.a && m.b;
    var cls = ["team-slot", filled?"filled":"empty"];
    if(isWinner) cls.push("winner");
    if(isLoser) cls.push("loser");
    var attrs = clickable
      ? ' data-action="pick" data-r="'+r+'" data-i="'+i+'" data-slot="'+slot+'" title="'+escapeHtml(name)+'"'
      : ' disabled';
    return '<button type="button" class="'+cls.join(" ")+'"'+attrs+'>'
      + '<span class="team-name">'+(filled?escapeHtml(name):"TBD")+'</span>'
      + (isWinner ? '<span class="win-mark">'+iconCheck(13)+'</span>' : '')
      + '</button>';
  }

  function renderBracketSection(st){
    var champId = championOf(st);
    var champName = champId ? teamName(champId,st) : null;
    var banner = champId ? (''
      + '<div class="champion-banner cut-both">'
      +   '<span class="icon-box">'+iconTrophy(22)+'</span>'
      +   '<div><div class="cap">CHAMPION</div><div class="name">'+escapeHtml(champName)+'</div><div class="chicken">WINNER WINNER CHICKEN DINNER</div></div>'
      + '</div>') : '';

    var headers = '<div class="round-headers">';
    for(var r=0;r<5;r++){
      headers += '<div class="round-head"><div class="eyebrow"><span class="stage">'+(r+1)+'</span>'+ROUND_EYEBROWS[r]+'</div><div class="kr">'+ROUND_LABELS[r]+'</div></div>';
    }
    headers += '<div class="round-head" style="margin-right:0;"><div class="eyebrow"><span class="stage">6</span>CHAMPION</div><div class="kr">우승</div></div>';
    headers += '</div>';

    var matches = "";
    for(var rr=0; rr<5; rr++){
      for(var ii=0; ii<ROUND_COUNTS[rr]; ii++){
        var m = getMatch(rr, ii, st);
        var top = centerY(rr,ii) - MATCH_H/2;
        var left = colX(rr);
        matches += '<div class="match cut-sm" style="top:'+top+'px;left:'+left+'px;" data-round="'+rr+'" data-idx="'+ii+'">'
          + '<span class="num-tag">M'+matchNum(rr,ii)+'</span>'
          + slotHtml(m,"a",rr,ii,st)
          + slotHtml(m,"b",rr,ii,st)
          + '</div>';
      }
    }
    var finalM = getMatch(4,0,st);
    var champY = centerY(4,0);
    var champX = colX(5);
    var champTop = champY - MATCH_H/2;
    matches += '<div class="champion-box cut-sm'+(champId?" decided":"")+'" style="top:'+champTop+'px;left:'+champX+'px;">'
      + '<span class="cap">'+(champId?"WINNER":"TBD")+'</span>'
      + '<span class="name">'+(champId?escapeHtml(champName):"우승팀 미정")+'</span>'
      + '</div>';

    var svg = '<svg class="connectors" width="'+BRACKET_W+'" height="'+BRACKET_H+'" viewBox="0 0 '+BRACKET_W+' '+BRACKET_H+'">';
    for(var pr=1; pr<=4; pr++){
      for(var j=0; j<ROUND_COUNTS[pr]; j++){
        var c0 = 2*j, c1 = 2*j+1, cr = pr-1;
        var x1 = colX(cr)+MATCH_W, xMid = colX(cr)+MATCH_W+COL_GAP/2, x2 = colX(pr);
        var y0 = centerY(cr,c0), y1 = centerY(cr,c1), yP = centerY(pr,j);
        var m0 = getMatch(cr,c0,st), m1 = getMatch(cr,c1,st);
        var done0 = !!m0.winner, done1 = !!m1.winner;
        svg += '<path class="'+(done0?"done":"")+'" d="M'+x1+' '+y0+' H'+xMid+'"/>';
        svg += '<path class="'+(done1?"done":"")+'" d="M'+x1+' '+y1+' H'+xMid+'"/>';
        svg += '<path class="'+((done0&&done1)?"done":"")+'" d="M'+xMid+' '+y0+' V'+y1+'"/>';
        svg += '<path class="'+((done0&&done1)?"done":"")+'" d="M'+xMid+' '+yP+' H'+x2+'"/>';
      }
    }
    var fx1 = colX(4)+MATCH_W, fx2 = colX(5), fy = centerY(4,0);
    svg += '<path class="'+(finalM.winner?"done":"")+'" d="M'+fx1+' '+fy+' H'+fx2+'"/>';
    svg += '</svg>';

    return ''
      + '<section id="bracket">'
      +   '<div class="wrap">'
      +     '<div class="section-head">'
      +       '<div><span class="eyebrow">BRACKET</span><h2>대진표</h2></div>'
      +       '<div class="desc">팀 이름을 클릭하면 해당 경기의 승자로 기록됩니다.</div>'
      +     '</div>'
      +     banner
      +     '<div class="bracket-legend"><span><i style="background:var(--accent)"></i>승리</span><span><i style="background:var(--ink-faint)"></i>대기중</span><span><i style="background:var(--border-strong)"></i>미정</span></div>'
      +     '<div class="bracket-scroll">'
      +       '<div style="width:'+BRACKET_W+'px;">'
      +         headers
      +         '<div class="bracket" style="width:'+BRACKET_W+'px;height:'+BRACKET_H+'px;">'+svg+matches+'</div>'
      +       '</div>'
      +     '</div>'
      +   '</div>'
      + '</section>';
  }

  function rosterTag(st, id){
    var s = teamStatus(id, st);
    if(s.status==="pending") return {variant:"v-pending", text:"추첨 대기"};
    if(s.status==="champion") return {variant:"v-champion", text: iconTrophy(11)+" 우승"};
    if(s.status==="eliminated") return {variant:"v-eliminated", text:ROUND_LABELS[s.round]+" 탈락"};
    if(s.status==="waiting" && s.round===0) return {variant:"v-scheduled", text:"32강 예정"};
    if(s.status==="waiting") return {variant:"v-advance", text:ROUND_LABELS[s.round]+" 진출"};
    return {variant:"v-pending", text:""};
  }

  function renderRoster(st){
    var cards = "";
    for(var id=1; id<=TOTAL_TEAMS; id++){
      var team = teamOf(id, st);
      var seed = String(id).padStart(2,"0");
      var tag = rosterTag(st, id);
      cards += '<button type="button" class="roster-card cut-tr reticle" data-action="open-team" data-id="'+id+'">'
        + '<span class="seed-mark">'+seed+'</span>'
        + '<div class="card-top">'
        +   '<div class="seed-lbl">SEED '+seed+'</div>'
        +   '<div class="team-name">'+escapeHtml(team.name)+'</div>'
        + '</div>'
        + '<div class="roster-foot"><span class="team-pill '+tag.variant+'">'+tag.text+'</span><span class="tap-hint">SQUAD ▸</span></div>'
        + '</button>';
    }
    return ''
      + '<section class="alt" id="teams">'
      +   '<div class="wrap">'
      +     '<div class="section-head">'
      +       '<div><span class="eyebrow">ROSTER</span><h2>참가팀 명단</h2></div>'
      +       '<div class="desc">카드를 누르면 해당 팀의 참가 선수 명단을 볼 수 있습니다.</div>'
      +     '</div>'
      +     '<div class="roster-grid">'+cards+'</div>'
      +   '</div>'
      + '</section>';
  }

  function renderAdminPanel(st){
    if(!isAdmin) return "";
    var rows = "";
    for(var id=1; id<=TOTAL_TEAMS; id++){
      var team = teamOf(id, st);
      var plist = team.players.filter(function(p){ return p.nick; }).map(function(p){
        return '<span>'+escapeHtml(p.role)+' '+escapeHtml(p.nick)+' <span class="uid mono">'+(p.uid?escapeHtml(p.uid):"—")+'</span></span>';
      }).join("");
      rows += '<tr><td class="mono">'+String(id).padStart(2,"0")+'</td><td class="tname">'+escapeHtml(team.name)+(team.confirmed?"":' <span style="color:var(--ink-faint);font-size:0.72rem;">(미확정)</span>')+'</td><td class="plist">'+plist+'</td>'
        + '<td><button type="button" class="btn btn-ghost btn-sm" data-action="open-team" data-id="'+id+'" data-edit="1">'+iconPencil(13)+' 수정</button></td></tr>';
    }
    return ''
      + '<section id="admin">'
      +   '<div class="wrap">'
      +     '<div class="admin-banner"><span class="lbl">🔧 관리자 모드 · UID 전체 확인</span><button type="button" class="btn btn-ghost btn-sm" data-action="admin-toggle">관리자 모드 종료</button></div>'
      +     '<div class="admin-table-wrap"><table class="admin-table">'
      +       '<thead><tr><th>SEED</th><th>팀명</th><th>선수 (닉네임 · UID)</th><th></th></tr></thead>'
      +       '<tbody>'+rows+'</tbody>'
      +     '</table></div>'
      +   '</div>'
      + '</section>';
  }

  function renderFooter(){
    return ''
      + '<footer><div class="wrap foot-row">'
      +   '<span class="foot-name">2026 ZZP CRAFT CUP · 절크컵</span>'
      +   '<span class="foot-meta mono">SINGLE ELIMINATION &middot; 32 TEAMS &middot; 5 ROUNDS</span>'
      +   '<button type="button" class="foot-admin" data-action="admin-toggle">'+(isAdmin?"[ 관리자 모드 종료 ]":"[ 관리자 ]")+'</button>'
      + '</div></footer>';
  }

  /* ---------------- modal ---------------- */
  function renderModal(st){
    if(!activeModal) return "";
    var id = activeModal.id;
    var team = teamOf(id, st);
    var seed = String(id).padStart(2,"0");
    if(activeModal.mode==="edit"){
      if(!isAdmin) { return ""; }
      var rows = "";
      var roleLabels = ["팀장","팀원1","팀원2","팀원3","후보"];
      for(var i=0;i<5;i++){
        var p = team.players[i] || {role:roleLabels[i], nick:"", uid:""};
        rows += '<div class="edit-row"><span class="role-lbl">'+roleLabels[i]+'</span>'
          + '<input id="edit-nick-'+id+'-'+i+'" placeholder="닉네임" value="'+escapeHtml(p.nick||"")+'">'
          + '<input id="edit-uid-'+id+'-'+i+'" placeholder="UID" value="'+escapeHtml(p.uid||"")+'">'
          + '</div>';
      }
      return ''
        + '<div class="modal-backdrop">'
        +   '<div class="modal-panel cut-tr">'
        +     '<div class="modal-head"><div><div class="seed-lbl">SEED '+seed+' · 편집</div><div class="team-name">'+escapeHtml(team.name)+'</div></div>'
        +       '<button type="button" class="modal-close" data-action="close-modal">'+iconClose(14)+'</button></div>'
        +     '<div class="modal-body">'
        +       '<div class="field"><label>팀명</label><input id="edit-name-'+id+'" value="'+escapeHtml(team.name)+'"></div>'
        +       rows
        +       '<label class="confirm-check"><input type="checkbox" id="edit-confirmed-'+id+'" '+(team.confirmed?"checked":"")+'> 참가 확정</label>'
        +     '</div>'
        +     '<div class="modal-foot">'
        +       '<button type="button" class="btn btn-ghost btn-sm" data-action="close-modal">취소</button>'
        +       '<button type="button" class="btn btn-primary btn-sm" data-action="save-team" data-id="'+id+'">저장</button>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }
    var playerRows = team.players.filter(function(p){ return p.nick; }).map(function(p,idx){
      var publicRole = p.role==="후보" ? "팀원" : p.role;
      return '<div class="player-row'+(p.role==="팀장"?" captain":"")+'"><span class="role mono">'+escapeHtml(publicRole)+'</span><span class="nick">'+escapeHtml(p.nick)+'</span></div>';
    }).join("");
    if(!playerRows) playerRows = '<div class="empty-note">등록된 선수 정보가 없습니다.</div>';
    return ''
      + '<div class="modal-backdrop">'
      +   '<div class="modal-panel cut-tr">'
      +     '<div class="modal-head"><div><div class="seed-lbl">SEED '+seed+'</div><div class="team-name">'+escapeHtml(team.name)+'</div></div>'
      +       '<button type="button" class="modal-close" data-action="close-modal">'+iconClose(14)+'</button></div>'
      +     '<div class="modal-body">'+playerRows+'</div>'
      +     '<div class="modal-foot">'+(isAdmin ? '<button type="button" class="btn btn-ghost btn-sm" data-action="edit-team" data-id="'+id+'">'+iconPencil(13)+' 편집</button>' : '')+'</div>'
      +   '</div>'
      + '</div>';
  }

  function renderApp(st, admin){
    var prevAdmin = isAdmin; isAdmin = admin;
    var html = '<div class="zone-bg"></div>' + renderHeader(st) + renderHero(st) + renderDrawPanel(st) + renderBracketSection(st) + renderRoster(st) + renderAdminPanel(st) + renderFooter() + renderModal(st);
    isAdmin = prevAdmin;
    return html;
  }

  function render(){
    var app = document.getElementById("app");
    if(!app) return;
    if(!loaded){
      app.innerHTML = '<div style="padding:80px 20px;text-align:center;color:var(--ink-faint);font-family:Rajdhani,sans-serif;">불러오는 중…</div>';
      return;
    }
    app.innerHTML = renderApp(state, isAdmin);
  }

  function updateSyncPill(){
    var el = document.getElementById("sync-pill");
    if(!el) return;
    el.className = "sync-pill " + (syncOk ? "ok" : "err");
    el.innerHTML = '<span class="dot"></span>' + (syncOk ? "실시간 동기화" : "동기화 오류");
  }

  /* ---------------- draw ceremony ---------------- */
  function buildCycleDelays(){
    var delays=[]; var d=42; var total=0;
    while(total<820){ delays.push(d); total+=d; d=Math.min(d*1.18, 240); }
    return delays;
  }

  async function runDrawCeremony(){
    if(!isAdmin){ toast("관리자만 대진 추첨을 시작할 수 있습니다."); return; }
    if(state.drawn){
      if(!window.confirm("다시 추첨하면 지금까지의 모든 경기 결과가 사라집니다. 정말 다시 추첨할까요?")) return;
    }
    var ids = [];
    for(var i=1;i<=TOTAL_TEAMS;i++) ids.push(String(i));
    for(var i=ids.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = ids[i]; ids[i]=ids[j]; ids[j]=t;
    }

    var overlay = document.createElement("div");
    overlay.id = "ceremony";
    overlay.innerHTML = ''
      + '<button type="button" class="btn btn-ghost btn-sm cer-skip" data-action="cer-skip">건너뛰기 ▸▸</button>'
      + '<div class="cer-eyebrow">DRAW EVENT LIVE</div>'
      + '<div class="cer-count"><span id="cer-num">01</span><span class="of"> / 32</span></div>'
      + '<div class="cer-plaque cut-both" id="cer-plaque"><div class="name" id="cer-name">대기중…</div></div>'
      + '<div class="cer-grid" id="cer-grid"></div>';
    document.body.appendChild(overlay);

    var grid = overlay.querySelector("#cer-grid");
    for(var g=0; g<TOTAL_TEAMS; g++){
      var chip = document.createElement("div");
      chip.className = "cer-chip";
      chip.id = "cer-chip-"+g;
      chip.textContent = "M"+(Math.floor(g/2)+1)+(g%2===0?"-A":"-B");
      grid.appendChild(chip);
    }

    var skipRequested = false;
    overlay.querySelector('[data-action="cer-skip"]').addEventListener("click", function(){ skipRequested = true; });

    var numEl = overlay.querySelector("#cer-num");
    var nameEl = overlay.querySelector("#cer-name");
    var plaqueEl = overlay.querySelector("#cer-plaque");
    var delays = buildCycleDelays();

    for(var k=0; k<TOTAL_TEAMS; k++){
      numEl.textContent = String(k+1).padStart(2,"0");
      plaqueEl.classList.remove("locked");
      var pool = ids.slice(k);
      var trueId = ids[k];

      if(!skipRequested){
        for(var d=0; d<delays.length; d++){
          var pick = pool[Math.floor(Math.random()*pool.length)];
          nameEl.textContent = teamName(pick, state);
          await sleep(skipRequested ? 0 : delays[d]);
          if(skipRequested) break;
        }
      }
      nameEl.textContent = teamName(trueId, state);
      plaqueEl.classList.add("locked");
      var chipEl = document.getElementById("cer-chip-"+k);
      if(chipEl){ chipEl.textContent = teamName(trueId, state); chipEl.classList.add("filled"); }
      if(window.confetti){
        try{
          var rect = plaqueEl.getBoundingClientRect();
          window.confetti({ particleCount: skipRequested?0:16, spread:45, startVelocity:22, gravity:1.1,
            colors:["#63c26f","#eef0e2","#3f8f4c"], origin:{ x:(rect.left+rect.width/2)/window.innerWidth, y:(rect.top+rect.height/2)/window.innerHeight } });
        }catch(e){}
      }
      await sleep(skipRequested ? 30 : 380);
    }

    overlay.innerHTML = ''
      + '<div class="cer-finale">'
      +   '<div class="big">대진 확정!</div>'
      +   '<div class="chicken">WINNER WINNER CHICKEN DINNER — 행운을 빕니다</div>'
      +   '<button type="button" class="btn btn-primary" data-action="cer-close">대진표 확인하기</button>'
      + '</div>';
    if(window.confetti){
      try{ window.confetti({ particleCount:140, spread:100, startVelocity:38, origin:{x:0.5,y:0.4}, colors:["#63c26f","#eef0e2","#3f8f4c","#7ed489"] }); }catch(e){}
    }
    overlay.querySelector('[data-action="cer-close"]').addEventListener("click", function(){
      if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });

    mutateAndSave(function(ns){
      ns.drawn = true; ns.drawnAt = new Date().toISOString(); ns.order = ids; ns.results = {};
      return ns;
    });
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function(e){
    var drawBtn = e.target.closest('[data-action="draw"]');
    if(drawBtn){ runDrawCeremony(); return; }
    var resetBtn = e.target.closest('[data-action="reset-results"]');
    if(resetBtn){ resetResults(); return; }
    var pickBtn = e.target.closest('[data-action="pick"]');
    if(pickBtn){ setWinner(+pickBtn.dataset.r, +pickBtn.dataset.i, pickBtn.dataset.slot); return; }
    var openBtn = e.target.closest('[data-action="open-team"]');
    if(openBtn){ activeModal = { id:+openBtn.dataset.id, mode: openBtn.dataset.edit ? "edit" : "view" }; render(); return; }
    var editBtn = e.target.closest('[data-action="edit-team"]');
    if(editBtn){ activeModal = { id:+editBtn.dataset.id, mode:"edit" }; render(); return; }
    var closeBtn = e.target.closest('[data-action="close-modal"]');
    if(closeBtn){ activeModal = null; render(); return; }
    if(e.target.classList && e.target.classList.contains("modal-backdrop")){ activeModal = null; render(); return; }
    var saveBtn = e.target.closest('[data-action="save-team"]');
    if(saveBtn){ saveTeamEdit(+saveBtn.dataset.id); return; }
    var adminBtn = e.target.closest('[data-action="admin-toggle"]');
    if(adminBtn){ toggleAdmin(); return; }
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && activeModal){ activeModal = null; render(); }
  });

  /* ---------------- init + polling ---------------- */
  function stateFingerprint(st){ return JSON.stringify(st); }
  var lastFingerprint = null;

  async function pollOnce(){
    var fresh = await fetchPublicState();
    if(!fresh){ syncOk = false; updateSyncPill(); return; }
    syncOk = true;
    var fp = stateFingerprint(fresh);
    if(fp !== lastFingerprint){
      lastFingerprint = fp;
      if(!(activeModal && activeModal.mode === "edit")){
        state = fresh;
        render();
      }
    }
    updateSyncPill();
  }

  (async function init(){
    var first = await fetchPublicState();
    state = first || clone(DEFAULT_STATE);
    lastFingerprint = stateFingerprint(state);
    loaded = true;
    render();
    setInterval(pollOnce, POLL_MS);
  })();
})();
