(function(){
  'use strict';

  /* ============================================================
     SETUP
     WORKER_BASE: the Cloudflare Worker that holds the real GitHub write
     token server-side (see worker/). The browser never sees a GitHub
     token or the admin passcode's correct value — it only talks to this
     worker, which checks the passcode, signs a short-lived session, and
     proxies both the read-before-save and the save itself through its
     own authenticated GitHub token (an anonymous browser-side read of
     the GitHub API can be a little stale, which used to cause spurious
     "someone else just saved" conflicts for a single admin).
     ============================================================ */
  var WORKER_BASE = "https://zzp-craft-cup-admin.jiminsh94.workers.dev";

  var DATA_PATH = "data/state.json";
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

  // PILL_OFFSET/PILL_H set the height of one match's 2-team pairing;
  // BASE_GAP must clear that with room to spare or adjacent matches
  // visually merge into one continuous stack.
  var PILL_W = 200, PILL_H = 34, COL_GAP = 60, BASE_GAP = 116, PILL_OFFSET = 19, ELBOW = 18;
  var BRACKET_W = 6*PILL_W + 5*COL_GAP;
  var BRACKET_H = BASE_GAP*16;

  function colX(r){ return r*(PILL_W+COL_GAP); }
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
  var ADMIN_TOKEN = ""; // worker session token, not a GitHub credential

  try{
    var savedSession = sessionStorage.getItem("zzp_admin_session");
    var savedExp = Number(sessionStorage.getItem("zzp_admin_exp") || 0);
    if(savedSession && savedExp > Date.now()){
      isAdmin = true;
      ADMIN_TOKEN = savedSession;
    }
  }catch(e){}

  function teamOf(id, st){ return st.teams[String(id)] || {name:"?", confirmed:true, players:[]}; }
  function teamName(id, st){ return id ? teamOf(id, st).name : null; }

  function recOf(st,key){
    var rec = st.results[key];
    if(!rec) return null;
    if(typeof rec === "string") return {w:rec, score:null, games:null}; // legacy format
    return rec;
  }

  function getMatch(r,i,st){
    if(r===0){
      var a = st.order[2*i] || null;
      var b = st.order[2*i+1] || null;
      var rec = recOf(st,"0-"+i);
      return {a:a,b:b,winner:rec?rec.w:null,score:rec?rec.score:null,games:null,isFinal:false};
    }
    var m0 = getMatch(r-1, 2*i, st);
    var m1 = getMatch(r-1, 2*i+1, st);
    var a = m0.winner ? (m0.winner==="a"?m0.a:m0.b) : null;
    var b = m1.winner ? (m1.winner==="a"?m1.a:m1.b) : null;
    var rec = (a && b) ? recOf(st,r+"-"+i) : null;
    var isFinal = (r===4);
    return {a:a,b:b,winner:rec?rec.w:null,score:rec?rec.score:null,games:(isFinal&&rec)?(rec.games||[]):null,isFinal:isFinal};
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

  async function apiErrorDetail(res){
    var msg = "HTTP " + res.status;
    try{
      var body = await res.json();
      if(body && (body.message || body.error)) msg += ": " + (body.message || body.error);
    }catch(e){}
    return msg;
  }

  async function fetchShaAndState(){
    var res;
    try{
      res = await fetch(WORKER_BASE + "/state", { cache: "no-store" });
    }catch(networkErr){
      throw new Error("불러오기 네트워크 오류: " + (networkErr && networkErr.message ? networkErr.message : networkErr));
    }
    if(!res.ok) throw new Error("불러오기 실패 · " + (await apiErrorDetail(res)));
    var json = await res.json();
    var content = base64ToUtf8(json.content);
    return { sha: json.sha, state: normalizeState(JSON.parse(content)) };
  }

  async function writeState(newState, sha){
    var res;
    try{
      res = await fetch(WORKER_BASE + "/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ADMIN_TOKEN,
          sha: sha,
          content: utf8ToBase64(JSON.stringify(newState, null, 2))
        })
      });
    }catch(networkErr){
      throw new Error("저장 네트워크 오류: " + (networkErr && networkErr.message ? networkErr.message : networkErr));
    }
    if(res.status === 401){
      isAdmin = false; ADMIN_TOKEN = "";
      try{ sessionStorage.removeItem("zzp_admin_session"); sessionStorage.removeItem("zzp_admin_exp"); }catch(e){}
      throw new Error("관리자 세션이 만료되었습니다. 다시 로그인해주세요.");
    }
    var payload = null;
    try{ payload = await res.json(); }catch(e){}
    if(payload && payload.status === "conflict") return "conflict";
    if(!res.ok || !payload || payload.status === "error"){
      throw new Error((payload && payload.detail) ? payload.detail : ("HTTP " + res.status));
    }
    return "ok";
  }

  var saveInFlight = false;

  async function mutateAndSave(mutatorFn){
    if(!isAdmin){ toast("관리자만 대진을 편집할 수 있습니다. 하단 '관리자' 버튼으로 로그인하세요."); return {status:"not-admin"}; }
    if(!ADMIN_TOKEN){
      toast("관리자 세션이 없습니다. 관리자 모드를 종료 후 다시 로그인해주세요.");
      return {status:"error", detail:"세션 없음 — 재로그인 필요"};
    }
    if(saveInFlight){
      toast("이전 저장이 아직 진행 중입니다. 잠시 후 다시 시도해주세요.");
      return {status:"busy"};
    }
    saveInFlight = true;
    var prevState = state;
    try{
      var fresh = await fetchShaAndState();
      var ns = mutatorFn(clone(fresh.state));
      if(!ns) return {status:"noop"};
      state = ns; render();
      var result = await writeState(ns, fresh.sha);
      if(result === "conflict"){
        toast("다른 저장과 충돌했어요. 최신 내용을 다시 불러옵니다…");
        // Re-fetch from the GitHub API (authoritative), not the GitHub Pages
        // static copy — that CDN copy can lag behind by a few minutes and
        // would otherwise make a just-written change look like it reverted.
        try{
          var latest = await fetchShaAndState();
          state = latest.state; render();
        }catch(e2){}
        return {status:"conflict"};
      }
      syncOk = true;
    }catch(e){
      syncOk = false;
      state = prevState; render();
      var detail = (e && e.message) ? e.message : String(e);
      console.error("[zzp] save failed:", e);
      toast("저장에 실패했습니다: " + detail);
      updateSyncPill();
      return {status:"error", detail: detail};
    }finally{
      saveInFlight = false;
    }
    updateSyncPill();
    return {status:"ok"};
  }

  /* ---------------- mutations ---------------- */

  function setWinner(r,i,slot){
    if(!isAdmin){ toast("관리자만 대진을 편집할 수 있습니다. 하단 '관리자' 버튼으로 로그인하세요."); return; }
    var key = r+"-"+i;
    var existing = recOf(state, key);
    if(existing && existing.w === slot) return;
    var score = window.prompt("스코어를 입력하세요 (예: 2:0). 비워두면 스코어 없이 저장돼요.", existing && existing.score ? existing.score : "");
    if(score === null) return; // cancelled
    mutateAndSave(function(ns){
      ns.results[key] = { w: slot, score: score.trim() ? score.trim() : null };
      var nr=r+1, ni=Math.floor(i/2);
      while(nr<=4){ delete ns.results[nr+"-"+ni]; ni=Math.floor(ni/2); nr++; }
      return ns;
    });
  }

  function recordFinalGame(slot){
    if(!isAdmin){ toast("관리자만 결승 게임 결과를 기록할 수 있습니다."); return; }
    mutateAndSave(function(ns){
      var key = "4-0";
      var rec = recOf(ns, key) || {games:[], w:null};
      if(rec.w) return null;
      var games = (rec.games||[]).slice();
      games.push(slot);
      var aWins = games.filter(function(g){return g==="a";}).length;
      var bWins = games.filter(function(g){return g==="b";}).length;
      var w = aWins>=2 ? "a" : (bWins>=2 ? "b" : null);
      ns.results[key] = { w:w, games:games, score:null };
      return ns;
    });
  }

  function resetFinalGames(){
    if(!isAdmin){ toast("관리자만 초기화할 수 있습니다."); return; }
    if(!window.confirm("결승 게임 기록을 초기화할까요?")) return;
    mutateAndSave(function(ns){
      delete ns.results["4-0"];
      return ns;
    });
  }

  function resetResults(){
    if(!isAdmin){ toast("관리자만 초기화할 수 있습니다."); return; }
    if(!state.drawn) return;
    if(!window.confirm("모든 경기 결과를 초기화할까요? 대진 상대는 유지됩니다.")) return;
    mutateAndSave(function(ns){ ns.results = {}; return ns; });
  }

  function resetDraw(){
    if(!isAdmin){ toast("관리자만 초기화할 수 있습니다."); return; }
    if(!window.confirm("대진 추첨 결과를 완전히 초기화할까요? 대진과 모든 경기 결과가 사라지고, 추첨 전 상태로 돌아갑니다.")) return;
    mutateAndSave(function(ns){
      ns.drawn = false; ns.drawnAt = null; ns.order = []; ns.results = {};
      return ns;
    });
    drawPanelOpen = false;
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
      ADMIN_TOKEN = "";
      try{ sessionStorage.removeItem("zzp_admin_session"); sessionStorage.removeItem("zzp_admin_exp"); }catch(e){}
      render();
      toast("관리자 모드를 종료했습니다.");
      return;
    }
    var pass = window.prompt("관리자 비밀번호를 입력하세요");
    if(pass===null) return;
    adminLogin(pass);
  }

  async function adminLogin(pass){
    var res;
    try{
      res = await fetch(WORKER_BASE + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: pass })
      });
    }catch(networkErr){
      toast("로그인 서버에 연결할 수 없습니다: " + (networkErr && networkErr.message ? networkErr.message : networkErr));
      return;
    }
    if(res.status === 401){ toast("비밀번호가 올바르지 않습니다."); return; }
    if(!res.ok){ toast("로그인 실패 (서버 오류 · HTTP " + res.status + ")"); return; }
    var body;
    try{ body = await res.json(); }catch(e){ body = null; }
    if(!body || !body.ok || !body.token){ toast("로그인 실패"); return; }
    isAdmin = true;
    ADMIN_TOKEN = body.token;
    try{ sessionStorage.setItem("zzp_admin_session", body.token); sessionStorage.setItem("zzp_admin_exp", String(body.exp)); }catch(e){}
    render();
    toast("관리자 모드가 활성화되었습니다.");
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
  function iconBarChart(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-7"/></svg>';
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
      + '</svg>';
  }
  function bulletHoleSvg(n){
    var gid = "bhHalo" + n;
    return '<svg viewBox="0 0 100 100">'
      + '<defs><radialGradient id="'+gid+'" cx="50%" cy="50%" r="50%">'
      +   '<stop offset="0%" stop-color="rgba(50,50,50,0.55)"/>'
      +   '<stop offset="55%" stop-color="rgba(110,110,110,0.26)"/>'
      +   '<stop offset="100%" stop-color="rgba(110,110,110,0)"/>'
      + '</radialGradient></defs>'
      + '<ellipse cx="50" cy="50" rx="46" ry="42" fill="url(#'+gid+')"/>'
      + '<path d="M50 14 L60 28 L78 18 L68 38 L88 40 L66 50 L84 64 L60 56 L64 82 L48 60 L34 84 L32 58 L12 68 L28 48 L10 34 L32 40 L22 16 L42 34 Z" fill="#0a0a0a"/>'
      + '<path d="M18 26 L26 18 L22 30 Z" fill="#0c0c0c" opacity="0.85"/>'
      + '<path d="M82 26 L90 32 L78 34 Z" fill="#0c0c0c" opacity="0.85"/>'
      + '<path d="M76 78 L86 86 L72 84 Z" fill="#0c0c0c" opacity="0.8"/>'
      + '<path d="M50 50 L14 22 M50 50 L86 20 M50 50 L10 62 M50 50 L90 58 M50 50 L44 92 M50 50 L62 94" stroke="#161616" stroke-width="1.3" opacity="0.5"/>'
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

  function iconPlay(size){
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="7,5 20,12 7,19"/></svg>';
  }
  function renderHero(st){
    return ''
      + '<section class="hero" id="top">'
      +   '<span class="hero-badge"><span class="reticle-seek">'+heroBadgeSvg()+'</span></span>'
      +   '<div class="wrap hero-inner">'
      +     '<span class="eyebrow">2026 SEASON · SINGLE ELIMINATION</span>'
      +     '<div class="hero-logo-wrap">'
      +       '<img class="hero-logo" src="assets/logo.png" alt="절크컵">'
      +       '<span class="impact-flash flash-1"></span><span class="impact-flash flash-2"></span><span class="impact-flash flash-3"></span>'
      +       '<span class="bullet-hole hole-1">'+bulletHoleSvg(1)+'</span>'
      +       '<span class="bullet-hole hole-2">'+bulletHoleSvg(2)+'</span>'
      +       '<span class="bullet-hole hole-3">'+bulletHoleSvg(3)+'</span>'
      +     '</div>'
      +     '<div class="hero-en">2026 ZZP CRAFT CUP</div>'
      +     '<p class="lede">크래프트 최강 스쿼드를 가릴 2026 절크컵!<br>4인 스쿼드와 함께 새로운 승부에 도전해보세요.</p>'
      +     '<div class="meta-row">'
      +       '<div class="meta-chip"><span class="num">32</span><span class="lbl">참가 팀</span></div>'
      +       '<div class="meta-chip"><span class="num">1</span><span class="lbl">챔피언</span></div>'
      +     '</div>'
      +     '<div class="cta-col">'
      +       '<a class="btn btn-primary" href="#bracket">대진표 보기</a>'
      +       '<a class="btn btn-ghost" href="https://www.youtube.com/@-zzp" target="_blank" rel="noopener">'+iconPlay(15)+' 중계 보러 가기</a>'
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
    var expanded = !st.drawn || drawPanelOpen;

    var body;
    if(expanded){
      body = ''
        + '<div class="draw-card cut-tr reticle">'
        +   '<div class="draw-info">'
        +     '<span class="icon-box">'+iconCrate(24)+'</span>'
        +     '<div><div class="title">'+(st.drawn ? "대진이 확정되었습니다" : "대진이 아직 없습니다")+'</div><div class="sub">'+subtitle+'</div></div>'
        +   '</div>'
        +   '<div class="draw-actions">'
        +     (st.drawn ? '<button type="button" class="btn btn-ghost btn-sm" data-action="toggle-draw-panel">접기 ▴</button>' : '')
        +     (hasResults ? '<button type="button" class="btn btn-ghost btn-sm" data-action="reset-results">'+iconRefresh(15)+' 결과 초기화</button>' : '')
        +     (st.drawn ? '<button type="button" class="btn btn-danger btn-sm" data-action="reset-draw">'+iconRefresh(15)+' 대진 초기화</button>' : '')
        +     '<button type="button" class="btn btn-primary" data-action="draw">'+iconCrate(17)+' '+drawLabel+'</button>'
        +   '</div>'
        + '</div>';
    } else {
      body = ''
        + '<div class="draw-collapsed cut-tr" data-action="toggle-draw-panel">'
        +   '<div class="title"><span class="icon-box">'+iconCheck(15)+'</span>대진 확정됨 · '+escapeHtml(subtitle)+'</div>'
        +   '<span class="chev">자세히 보기 / 관리 ▾</span>'
        + '</div>';
    }

    return ''
      + '<section id="draw">'
      +   '<div class="wrap">'
      +     '<div class="section-head">'
      +       '<div><span class="eyebrow">DRAW EVENT</span><h2>대진 추첨</h2></div>'
      +       '<div class="desc">32개 팀을 랜덤으로 섞어 32강 대진표를 생성합니다.</div>'
      +     '</div>'
      +     body
      +   '</div>'
      + '</section>';
  }

  function pillHtml(m, slot, r, i, st){
    var id = m[slot];
    var filled = !!id;
    var name = filled ? teamName(id, st) : null;
    var isWinner = m.winner === slot;
    var isLoser = !!m.winner && m.winner !== slot;
    var clickable = isAdmin && filled && m.a && m.b && !m.isFinal;
    var y = slot==="a" ? centerY(r,i)-PILL_OFFSET : centerY(r,i)+PILL_OFFSET;
    var top = y - PILL_H/2;
    var cls = ["pill", filled?"filled":"empty"];
    if(isWinner) cls.push("winner");
    if(isLoser) cls.push("loser");
    var attrs = clickable
      ? ' data-action="pick" data-r="'+r+'" data-i="'+i+'" data-slot="'+slot+'" title="'+escapeHtml(name)+'"'
      : ' disabled';
    return '<button type="button" class="'+cls.join(" ")+'" style="top:'+top+'px;left:'+colX(r)+'px;width:'+PILL_W+'px;height:'+PILL_H+'px;"'+attrs+'>'
      + '<span class="seed">'+(filled?String(id).padStart(2,"0"):"?")+'</span>'
      + '<span class="pname">'+(filled?escapeHtml(name):"TBD")+'</span>'
      + '</button>';
  }

  var viewMode = "round"; // "round" | "full"
  var selectedRound = 0;
  var drawPanelOpen = false;
  var statsGameIdx = 0;

  function championBanner(st){
    var champId = championOf(st);
    if(!champId) return "";
    var champName = teamName(champId,st);
    return '<div class="champion-banner cut-both">'
      +   '<span class="icon-box">'+iconTrophy(22)+'</span>'
      +   '<div><div class="cap">CHAMPION</div><div class="name">'+escapeHtml(champName)+'</div><div class="chicken">WINNER WINNER CHICKEN DINNER</div></div>'
      + '</div>';
  }

  function renderFullBracket(st){
    var champId = championOf(st);
    var champName = champId ? teamName(champId,st) : null;

    var headers = '<div class="round-headers">';
    for(var r=0;r<5;r++){
      headers += '<div class="round-head r'+(r+1)+'"><div class="eyebrow"><span class="stage">'+(r+1)+'</span>'+ROUND_EYEBROWS[r]+'</div><div class="kr">'+ROUND_LABELS[r]+'</div></div>';
    }
    headers += '<div class="round-head r5" style="margin-right:0;"><div class="eyebrow"><span class="stage">6</span>CHAMPION</div><div class="kr">우승</div></div>';
    headers += '</div>';

    // pills: every team gets its own independent box, joined to its
    // opponent by a short local elbow and to the next round by a
    // staircase connector per advancing team (not one shared match card).
    var pills = "";
    for(var rr=0; rr<5; rr++){
      for(var ii=0; ii<ROUND_COUNTS[rr]; ii++){
        var m = getMatch(rr, ii, st);
        pills += pillHtml(m,"a",rr,ii,st) + pillHtml(m,"b",rr,ii,st);
      }
    }
    var finalM = getMatch(4,0,st);
    var champY = centerY(4,0);
    var champX = colX(5);
    var champTop = champY - PILL_H/2 - 8;
    pills += '<div class="champion-box'+(champId?" decided":"")+'" style="top:'+champTop+'px;left:'+champX+'px;width:'+PILL_W+'px;">'
      + '<span class="cap">'+(champId?"WINNER":"TBD")+'</span>'
      + '<span class="name">'+(champId?escapeHtml(champName):"우승팀 미정")+'</span>'
      + '</div>';

    var svg = '<svg class="connectors" width="'+BRACKET_W+'" height="'+BRACKET_H+'" viewBox="0 0 '+BRACKET_W+' '+BRACKET_H+'">';
    // local pairing elbow: a short bracket hugging the two pills of one match
    for(var lr=0; lr<5; lr++){
      for(var li=0; li<ROUND_COUNTS[lr]; li++){
        var lyA = centerY(lr,li)-PILL_OFFSET, lyB = centerY(lr,li)+PILL_OFFSET;
        var lx1 = colX(lr)+PILL_W, lxJoin = lx1+ELBOW;
        svg += '<path class="local" d="M'+lx1+' '+lyA+' H'+lxJoin+'"/>';
        svg += '<path class="local" d="M'+lx1+' '+lyB+' H'+lxJoin+'"/>';
        svg += '<path class="local" d="M'+lxJoin+' '+lyA+' V'+lyB+'"/>';
      }
    }
    // staircase connectors between rounds: one Z-shaped line per advancing team
    for(var pr=1; pr<=4; pr++){
      for(var j=0; j<ROUND_COUNTS[pr]; j++){
        var cr = pr-1;
        for(var childIdx=0; childIdx<2; childIdx++){
          var childI = 2*j+childIdx;
          var childM = getMatch(cr, childI, st);
          var done = !!childM.winner;
          var childOutX = colX(cr)+PILL_W+ELBOW;
          var childOutY = centerY(cr,childI);
          var parentY = childIdx===0 ? centerY(pr,j)-PILL_OFFSET : centerY(pr,j)+PILL_OFFSET;
          var xMid = colX(cr)+PILL_W+COL_GAP/2;
          var parentX = colX(pr);
          var scls = done ? "done" : "";
          svg += '<path class="'+scls+'" d="M'+childOutX+' '+childOutY+' H'+xMid+'"/>';
          svg += '<path class="'+scls+'" d="M'+xMid+' '+childOutY+' V'+parentY+'"/>';
          svg += '<path class="'+scls+'" d="M'+xMid+' '+parentY+' H'+parentX+'"/>';
        }
      }
    }
    var champX1 = colX(4)+PILL_W+ELBOW, champY2 = centerY(4,0), champX2 = colX(5);
    svg += '<path class="'+(finalM.winner?"done":"")+'" d="M'+champX1+' '+champY2+' H'+champX2+'"/>';
    svg += '</svg>';

    return ''
      + '<div class="bracket-toolbar">'
      +   '<div class="bracket-legend"><span><i style="background:var(--accent)"></i>승리</span><span><i style="background:var(--ink-faint)"></i>대기중</span></div>'
      +   '<div class="zoom-controls">'
      +     '<button type="button" class="zoom-btn" data-action="bracket-zoom-out" aria-label="축소">&minus;</button>'
      +     '<span class="zoom-pct" id="zoom-pct">'+Math.round(bracketZoom*100)+'%</span>'
      +     '<button type="button" class="zoom-btn" data-action="bracket-zoom-in" aria-label="확대">+</button>'
      +     '<button type="button" class="zoom-btn zoom-reset" data-action="bracket-zoom-reset">Reset</button>'
      +   '</div>'
      + '</div>'
      + '<div class="bracket-scroll">'
      +   '<div id="bracket-fit" style="width:'+BRACKET_W+'px;">'
      +     headers
      +     '<div class="bracket" style="width:'+BRACKET_W+'px;height:'+BRACKET_H+'px;">'+svg+pills+'</div>'
      +   '</div>'
      + '</div>';
  }

  var bracketZoom = 1; // manual multiplier on top of the auto-fit-to-width scale

  function fitBracketScale(){
    var container = document.querySelector(".bracket-scroll");
    var inner = document.getElementById("bracket-fit");
    if(!container || !inner) return;
    inner.style.transform = "none";
    var naturalW = inner.scrollWidth;
    var naturalH = inner.scrollHeight;
    if(!naturalW || !naturalH) return;
    var available = container.clientWidth;
    var fitScale = Math.min(1, available / naturalW);
    if(fitScale < 0.4) fitScale = 0.4;
    var scale = fitScale * bracketZoom;
    inner.style.transformOrigin = "top left";
    inner.style.transform = "scale(" + scale + ")";
    container.style.height = Math.ceil(naturalH * scale) + "px";
    var pctEl = document.getElementById("zoom-pct");
    if(pctEl) pctEl.textContent = Math.round(bracketZoom*100) + "%";
  }

  function rsideHtml(m, slot, r, i, st){
    var id = m[slot];
    var filled = !!id;
    var name = filled ? teamName(id, st) : null;
    var seed = filled ? id : "?";
    var isWinner = m.winner === slot;
    var isLoser = !!m.winner && m.winner !== slot;
    var clickable = isAdmin && filled && m.a && m.b && !m.isFinal;
    var cls = ["rside", slot==="b"?"right":"", filled?"":"empty", isWinner?"winner":"", isLoser?"loser":""].join(" ").trim();
    var tag = clickable ? "button" : "div";
    var attrs = clickable ? ' type="button" data-action="pick" data-r="'+r+'" data-i="'+i+'" data-slot="'+slot+'"' : "";
    if(clickable) cls += " clickable";
    return '<'+tag+' class="'+cls+'"'+attrs+'>'
      + '<span class="rseed mono">'+(filled?String(seed).padStart(2,"0"):"?")+'</span>'
      + '<span class="rname">'+(filled?escapeHtml(name):"TBD")+'</span>'
      + '</'+tag+'>';
  }

  // One row of the final's best-of-3: reflects that SPECIFIC game's
  // winner (games[gameIdx]), not the match's overall winner, and is
  // only clickable when it's the next game to be decided.
  function finalGameSideHtml(m, slot, gameIdx, active, st){
    var id = m[slot];
    var filled = !!id;
    var name = filled ? teamName(id, st) : null;
    var seed = filled ? id : "?";
    var games = m.games || [];
    var decided = gameIdx < games.length;
    var isWinner = decided && games[gameIdx] === slot;
    var isLoser = decided && games[gameIdx] !== slot;
    var clickable = active && isAdmin && filled && m.a && m.b;
    var cls = ["rside", slot==="b"?"right":"", filled?"":"empty", isWinner?"winner":"", isLoser?"loser":""].join(" ").trim();
    var tag = clickable ? "button" : "div";
    var attrs = clickable ? ' type="button" data-action="final-game" data-slot="'+slot+'"' : "";
    if(clickable) cls += " clickable";
    return '<'+tag+' class="'+cls+'"'+attrs+'>'
      + '<span class="rseed mono">'+(filled?String(seed).padStart(2,"0"):"?")+'</span>'
      + '<span class="rname">'+(filled?escapeHtml(name):"TBD")+'</span>'
      + '</'+tag+'>';
  }

  // Splits "13:1"-style free text into fixed-width L/sep/R columns so the
  // separator stays centered regardless of digit count (1 vs 11). Falls
  // back to plain text for anything that isn't exactly two numbers.
  function scoreGridHtml(raw, sep){
    var mtc = String(raw).trim().match(/^(\d+)\s*[:\-]\s*(\d+)$/);
    if(!mtc) return '<span class="score plain">'+escapeHtml(raw)+'</span>';
    return '<span class="score"><span class="sl">'+mtc[1]+'</span><span class="sep">'+sep+'</span><span class="sr">'+mtc[2]+'</span></span>';
  }
  function statIconHtml(r, i, isFinal, st){
    if(!(getMatch(r,i,st).a && getMatch(r,i,st).b)) return "";
    var statKey = isFinal ? "4-0" : (r+"-"+i);
    var srec = recOf(st, statKey);
    var hasStatsData = !!(srec && srec.statsSaved);
    if(!isAdmin && !hasStatsData) return "";
    return '<button type="button" class="stat-icon'+(hasStatsData?" has-data":"")+'" data-action="open-stats" data-r="'+r+'" data-i="'+i+'" aria-label="'+(hasStatsData?"선수 기록 보기":"선수 기록 입력")+'">'+iconBarChart(14)+'</button>';
  }

  function renderRoundView(st){
    var tabs = "";
    for(var r=0;r<5;r++){
      tabs += '<button type="button" class="round-tab'+(selectedRound===r?" active":"")+'" data-action="round-tab" data-round="'+r+'">'
        + '<span class="n">'+(r+1)+'</span>'+ROUND_LABELS[r] + '</button>';
    }

    var list = "";
    for(var ii=0; ii<ROUND_COUNTS[selectedRound]; ii++){
      var m = getMatch(selectedRound, ii, st);
      var isFinal = m.isFinal;

      if(isFinal){
        // Best-of-3: always show all 3 match slots, even once the
        // series is already decided 2-0 (the 3rd just stays pending).
        var games = m.games || [];
        for(var g=0; g<3; g++){
          var decided = g < games.length;
          var active = g === games.length && !m.winner;
          var pending = !decided && !active;
          var midHtml = '<span class="vs">매치 '+(g+1)+'</span>'
            + (decided ? '<span class="game-hint">종료</span>' : active ? '<span class="game-hint live">진행중</span>' : '<span class="game-hint muted">대기</span>');
          list += '<div class="rmatch-wrap">'
            + '<div class="rmatch is-final'+(pending?" is-pending":"")+' cut-sm">'
            +   finalGameSideHtml(m,"a",g,active,st)
            +   '<div class="rmid">'+midHtml+'</div>'
            +   finalGameSideHtml(m,"b",g,active,st)
            + '</div>'
            + '</div>';
        }
        if(m.a && m.b){
          list += '<div style="display:flex;justify-content:center;margin:-4px 0 4px;">'+statIconHtml(selectedRound,ii,true,st)+'</div>';
        }
        if(isAdmin && m.a && m.b){
          var doneF = !!m.winner;
          list += '<div class="final-controls">'
            + (doneF
              ? '<button type="button" class="btn btn-ghost btn-sm" data-action="final-reset">'+iconRefresh(15)+' 결승 기록 초기화</button>'
              : '<span style="font-family:\'JetBrains Mono\',monospace;font-size:0.78rem;color:var(--ink-faint);">매치 '+(games.length+1)+' 결과: 위에서 이긴 팀을 눌러 기록하세요 (2선승)</span>')
            + '</div>';
        }
        continue;
      }

      var mid = '<div class="rmid">'+(m.score ? scoreGridHtml(m.score,":") : '<span class="vs">VS</span>')+statIconHtml(selectedRound,ii,false,st)+'</div>';
      list += '<div class="rmatch-wrap">'
        + (selectedRound>=2 ? '<span class="live-badge"><span class="dot"></span>방송 송출</span>' : '')
        + '<div class="rmatch cut-sm">'
        +   rsideHtml(m,"a",selectedRound,ii,st)
        +   mid
        +   rsideHtml(m,"b",selectedRound,ii,st)
        + '</div>'
        + '</div>';
    }

    return ''
      + '<div class="round-tabs">'+tabs+'</div>'
      + '<div class="rmatch-list">'+list+'</div>';
  }

  function renderBracketSection(st){
    return ''
      + '<section id="bracket">'
      +   '<div class="wrap">'
      +     '<div class="section-head">'
      +       '<div><span class="eyebrow">BRACKET</span><h2>대진표</h2></div>'
      +       '<div class="desc">팀 이름을 클릭하면 해당 경기의 승자로 기록됩니다. 결승은 3판 2선승제예요.</div>'
      +     '</div>'
      +     championBanner(st)
      +     '<div class="view-toggle">'
      +       '<button type="button" data-action="view-mode" data-mode="round" class="'+(viewMode==="round"?"active":"")+'">라운드별 보기</button>'
      +       '<button type="button" data-action="view-mode" data-mode="full" class="'+(viewMode==="full"?"active":"")+'">전체 대진표</button>'
      +     '</div>'
      +     (viewMode==="round" ? renderRoundView(st) : renderFullBracket(st))
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
      var champCls = tag.variant==="v-champion" ? " is-champion" : "";
      cards += '<button type="button" class="roster-card cut-tr reticle'+champCls+'" data-action="open-team" data-id="'+id+'">'
        + '<span class="seed-mark">'+seed+'</span>'
        + '<div class="card-top">'
        +   '<div class="seed-lbl">TEAM '+seed+'</div>'
        +   '<div class="team-name">'+escapeHtml(team.name)+'</div>'
        + '</div>'
        + '<div class="roster-foot"><span class="team-pill '+tag.variant+'">'+tag.text+'</span><span class="tap-hint">LIST ▸</span></div>'
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

  /* ---------------- match stats ---------------- */
  function statsParticipants(id, st){
    return teamOf(id, st).players.filter(function(p){ return p.nick && p.role !== "후보"; });
  }

  function computeMvp(players){
    var best = null;
    players.forEach(function(p){
      if(p.kills == null) return;
      if(!best || p.kills > best.kills || (p.kills === best.kills && (p.dmg||0) > (best.dmg||0))) best = p;
    });
    return best;
  }

  function computeSeriesMvp(rec){
    var totals = {};
    var gs = (rec && rec.gameStats) || [];
    gs.forEach(function(g){
      if(!g) return;
      ["a","b"].forEach(function(side){
        (g[side]||[]).forEach(function(p){
          if(!p || !p.nick) return;
          if(!totals[p.nick]) totals[p.nick] = {nick:p.nick, kills:0, dmg:0};
          totals[p.nick].kills += (p.kills||0);
          totals[p.nick].dmg += (p.dmg||0);
        });
      });
    });
    var list = Object.keys(totals).map(function(k){ return totals[k]; });
    return computeMvp(list);
  }

  function statsRowsHtml(list, prefix, editable){
    return list.map(function(p, idx){
      if(editable){
        return '<div class="stats-row">'
          + '<span class="pname">'+escapeHtml(p.nick)+'</span>'
          + '<input type="number" min="0" id="'+prefix+'-k-'+idx+'" placeholder="킬" value="'+(p.kills!=null?p.kills:"")+'">'
          + '<input type="number" min="0" id="'+prefix+'-d-'+idx+'" placeholder="데미지" value="'+(p.dmg!=null?p.dmg:"")+'">'
          + '</div>';
      }
      return '<div class="stats-row'+(p._mvp?" mvp":"")+'">'
        + '<span class="pname">'+escapeHtml(p.nick)+(p._mvp?' ★':'')+'</span>'
        + '<span class="mono" style="font-size:0.82rem;">'+(p.kills!=null?p.kills:"–")+'</span>'
        + '<span class="mono" style="font-size:0.82rem;">'+(p.dmg!=null?p.dmg:"–")+'</span>'
        + '</div>';
    }).join("");
  }

  function saveMatchStats(r, i){
    if(!isAdmin) return;
    var m = getMatch(r, i, state);
    var partsA = statsParticipants(m.a, state);
    var partsB = statsParticipants(m.b, state);
    function readSide(parts, prefix){
      return parts.map(function(p, idx){
        var kEl = document.getElementById(prefix+"-k-"+idx), dEl = document.getElementById(prefix+"-d-"+idx);
        var k = kEl && kEl.value !== "" ? Number(kEl.value) : null;
        var d = dEl && dEl.value !== "" ? Number(dEl.value) : null;
        return { nick: p.nick, kills:k, dmg:d };
      });
    }
    var statsA = readSide(partsA, "sa");
    var statsB = readSide(partsB, "sb");
    activeModal = null;
    mutateAndSave(function(ns){
      var key = r+"-"+i;
      var rec = recOf(ns, key) || { w:null, score:null };
      rec.stats = { a: statsA, b: statsB };
      rec.statsSaved = true;
      ns.results[key] = rec;
      return ns;
    });
  }

  function saveFinalStats(gameIdx){
    if(!isAdmin) return;
    var m = getMatch(4, 0, state);
    var partsA = statsParticipants(m.a, state);
    var partsB = statsParticipants(m.b, state);
    function readSide(parts, prefix){
      return parts.map(function(p, idx){
        var kEl = document.getElementById(prefix+"-k-"+idx), dEl = document.getElementById(prefix+"-d-"+idx);
        var k = kEl && kEl.value !== "" ? Number(kEl.value) : null;
        var d = dEl && dEl.value !== "" ? Number(dEl.value) : null;
        return { nick: p.nick, kills:k, dmg:d };
      });
    }
    var statsA = readSide(partsA, "sa");
    var statsB = readSide(partsB, "sb");
    activeModal = null;
    mutateAndSave(function(ns){
      var key = "4-0";
      var rec = recOf(ns, key) || { w:null, games:[], score:null };
      var gameStats = (rec.gameStats || []).slice();
      gameStats[gameIdx] = { a: statsA, b: statsB };
      rec.gameStats = gameStats;
      rec.statsSaved = true;
      ns.results[key] = rec;
      return ns;
    });
  }

  function renderStatsModal(st){
    var r = activeModal.r, i = activeModal.i;
    var m = getMatch(r, i, st);
    if(!m.a || !m.b) return "";
    var teamA = teamOf(m.a, st), teamB = teamOf(m.b, st);
    var partsA = statsParticipants(m.a, st);
    var partsB = statsParticipants(m.b, st);
    var editable = isAdmin;
    var headTitle = escapeHtml(teamA.name) + ' vs ' + escapeHtml(teamB.name);

    if(m.isFinal){
      var games = m.games || [];
      if(!games.length){
        return ''
          + '<div class="modal-backdrop">'
          +   '<div class="modal-panel cut-tr stats-modal">'
          +     '<div class="modal-head"><div><div class="seed-lbl">M'+matchNum(r,i)+' · 선수 기록</div><div class="team-name">'+headTitle+'</div></div>'
          +       '<button type="button" class="modal-close" data-action="close-modal">'+iconClose(14)+'</button></div>'
          +     '<div class="modal-body"><div class="empty-note">아직 진행된 게임이 없습니다. 게임 결과를 먼저 기록해주세요.</div></div>'
          +   '</div>'
          + '</div>';
      }
      if(statsGameIdx > games.length-1) statsGameIdx = games.length-1;
      if(statsGameIdx < 0) statsGameIdx = 0;
      var gTabs = "";
      for(var g=0; g<games.length; g++){
        gTabs += '<button type="button" class="round-tab'+(statsGameIdx===g?" active":"")+'" data-action="stats-game-tab" data-game="'+g+'">GAME '+(g+1)+'</button>';
      }
      var rec = recOf(st, "4-0") || {};
      var gameStats = (rec.gameStats && rec.gameStats[statsGameIdx]) || {a:[],b:[]};
      var listA = partsA.map(function(p,idx){ var s=(gameStats.a||[])[idx]||{}; return {nick:p.nick, kills:s.kills, dmg:s.dmg}; });
      var listB = partsB.map(function(p,idx){ var s=(gameStats.b||[])[idx]||{}; return {nick:p.nick, kills:s.kills, dmg:s.dmg}; });
      if(!editable){
        var mvpG = computeMvp(listA.concat(listB));
        if(mvpG){ listA.forEach(function(p){ if(p.nick===mvpG.nick) p._mvp=true; }); listB.forEach(function(p){ if(p.nick===mvpG.nick) p._mvp=true; }); }
      }
      var seriesMvp = computeSeriesMvp(rec);
      var body = ''
        + '<div class="round-tabs" style="margin-bottom:16px;">'+gTabs+'</div>'
        + (seriesMvp ? '<div class="stats-team-title" style="color:var(--gold);">★ 시리즈 합산 MVP · '+escapeHtml(seriesMvp.nick)+' ('+seriesMvp.kills+'킬 / '+seriesMvp.dmg+' dmg)</div>' : '')
        + '<div class="stats-col-head"><span>선수</span><span>킬</span><span>데미지</span></div>'
        + '<div class="stats-team-title">'+escapeHtml(teamA.name)+'</div>'
        + statsRowsHtml(listA, "sa", editable)
        + '<div class="stats-team-title" style="margin-top:14px;">'+escapeHtml(teamB.name)+'</div>'
        + statsRowsHtml(listB, "sb", editable);
      return ''
        + '<div class="modal-backdrop">'
        +   '<div class="modal-panel cut-tr stats-modal">'
        +     '<div class="modal-head"><div><div class="seed-lbl">M'+matchNum(r,i)+' · BO3 선수 기록</div><div class="team-name">'+headTitle+'</div></div>'
        +       '<button type="button" class="modal-close" data-action="close-modal">'+iconClose(14)+'</button></div>'
        +     '<div class="modal-body">'+body+'</div>'
        +     '<div class="modal-foot">'
        +       '<button type="button" class="btn btn-ghost btn-sm" data-action="close-modal">닫기</button>'
        +       (editable ? '<button type="button" class="btn btn-primary btn-sm" data-action="save-final-stats" data-game="'+statsGameIdx+'">저장</button>' : '')
        +     '</div>'
        +   '</div>'
        + '</div>';
    }

    var key = r+"-"+i;
    var rec2 = recOf(st, key) || {};
    var stats = rec2.stats || {a:[],b:[]};
    var listA2 = partsA.map(function(p,idx){ var s=(stats.a||[])[idx]||{}; return {nick:p.nick, kills:s.kills, dmg:s.dmg}; });
    var listB2 = partsB.map(function(p,idx){ var s=(stats.b||[])[idx]||{}; return {nick:p.nick, kills:s.kills, dmg:s.dmg}; });
    if(!editable){
      var mvp = computeMvp(listA2.concat(listB2));
      if(mvp){ listA2.forEach(function(p){ if(p.nick===mvp.nick) p._mvp=true; }); listB2.forEach(function(p){ if(p.nick===mvp.nick) p._mvp=true; }); }
    }
    var body2 = ''
      + '<div class="stats-col-head"><span>선수</span><span>킬</span><span>데미지</span></div>'
      + '<div class="stats-team-title">'+escapeHtml(teamA.name)+'</div>'
      + statsRowsHtml(listA2, "sa", editable)
      + '<div class="stats-team-title" style="margin-top:14px;">'+escapeHtml(teamB.name)+'</div>'
      + statsRowsHtml(listB2, "sb", editable);
    return ''
      + '<div class="modal-backdrop">'
      +   '<div class="modal-panel cut-tr stats-modal">'
      +     '<div class="modal-head"><div><div class="seed-lbl">M'+matchNum(r,i)+' · 선수 기록</div><div class="team-name">'+headTitle+'</div></div>'
      +       '<button type="button" class="modal-close" data-action="close-modal">'+iconClose(14)+'</button></div>'
      +     '<div class="modal-body">'+body2+'</div>'
      +     '<div class="modal-foot">'
      +       '<button type="button" class="btn btn-ghost btn-sm" data-action="close-modal">닫기</button>'
      +       (editable ? '<button type="button" class="btn btn-primary btn-sm" data-action="save-match-stats" data-r="'+r+'" data-i="'+i+'">저장</button>' : '')
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  /* ---------------- modal ---------------- */
  function renderModal(st){
    if(!activeModal) return "";
    if(activeModal.kind === "stats") return renderStatsModal(st);
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
        +     '<div class="modal-head"><div><div class="seed-lbl">TEAM '+seed+' · 편집</div><div class="team-name">'+escapeHtml(team.name)+'</div></div>'
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
      +     '<div class="modal-head"><div><div class="seed-lbl">TEAM '+seed+'</div><div class="team-name">'+escapeHtml(team.name)+'</div></div>'
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
    if(viewMode === "full"){ requestAnimationFrame(fitBracketScale); }
  }

  var bracketResizeTimer = null;
  window.addEventListener("resize", function(){
    if(viewMode !== "full") return;
    clearTimeout(bracketResizeTimer);
    bracketResizeTimer = setTimeout(fitBracketScale, 120);
  });

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
    if(!ADMIN_TOKEN){ toast("관리자 세션이 없습니다. 관리자 모드를 종료 후 다시 로그인해주세요."); return; }
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
      +   '<div class="cer-save-status pending" id="cer-save-status"><span class="spinner"></span> 서버에 저장하는 중…</div>'
      + '</div>';

    function closeOverlay(){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); }

    async function attemptSave(){
      var statusEl = document.getElementById("cer-save-status");
      if(statusEl){
        statusEl.className = "cer-save-status pending";
        statusEl.innerHTML = '<span class="spinner"></span> 서버에 저장하는 중…';
      }
      var finale = overlay.querySelector(".cer-finale");
      var oldBtns = finale ? finale.querySelectorAll(".cer-finale-actions") : [];
      for(var b=0;b<oldBtns.length;b++){ oldBtns[b].remove(); }

      var result = await mutateAndSave(function(ns){
        ns.drawn = true; ns.drawnAt = new Date().toISOString(); ns.order = ids; ns.results = {};
        return ns;
      });

      statusEl = document.getElementById("cer-save-status");
      if(!statusEl || !finale) return; // overlay already closed by user

      if(result.status === "ok"){
        statusEl.className = "cer-save-status ok";
        statusEl.textContent = "저장 완료 · 모두에게 실시간으로 반영됩니다";
        var actions = document.createElement("div");
        actions.className = "cer-finale-actions";
        actions.innerHTML = '<button type="button" class="btn btn-primary" data-action="cer-close">대진표 확인하기</button>';
        finale.appendChild(actions);
        actions.querySelector('[data-action="cer-close"]').addEventListener("click", closeOverlay);
        if(window.confetti){
          try{ window.confetti({ particleCount:140, spread:100, startVelocity:38, origin:{x:0.5,y:0.4}, colors:["#63c26f","#eef0e2","#3f8f4c","#7ed489"] }); }catch(e){}
        }
      } else {
        statusEl.className = "cer-save-status error";
        statusEl.textContent = "저장 실패: " + (result.detail || result.status || "알 수 없는 오류") + " — 아래에서 다시 시도해주세요.";
        var actions2 = document.createElement("div");
        actions2.className = "cer-finale-actions";
        actions2.innerHTML = ''
          + '<button type="button" class="btn btn-primary" data-action="cer-retry">다시 저장 시도</button>'
          + '<button type="button" class="btn btn-ghost" data-action="cer-close">닫기 (저장되지 않음)</button>';
        finale.appendChild(actions2);
        actions2.querySelector('[data-action="cer-retry"]').addEventListener("click", attemptSave);
        actions2.querySelector('[data-action="cer-close"]').addEventListener("click", closeOverlay);
      }
    }

    attemptSave();
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function(e){
    var drawBtn = e.target.closest('[data-action="draw"]');
    if(drawBtn){ runDrawCeremony(); return; }
    var resetBtn = e.target.closest('[data-action="reset-results"]');
    if(resetBtn){ resetResults(); return; }
    var pickBtn = e.target.closest('[data-action="pick"]');
    if(pickBtn){ setWinner(+pickBtn.dataset.r, +pickBtn.dataset.i, pickBtn.dataset.slot); return; }
    var finalBtn = e.target.closest('[data-action="final-game"]');
    if(finalBtn){ recordFinalGame(finalBtn.dataset.slot); return; }
    var finalResetBtn = e.target.closest('[data-action="final-reset"]');
    if(finalResetBtn){ resetFinalGames(); return; }
    var viewBtn = e.target.closest('[data-action="view-mode"]');
    if(viewBtn){ viewMode = viewBtn.dataset.mode; render(); return; }
    var zoomInBtn = e.target.closest('[data-action="bracket-zoom-in"]');
    if(zoomInBtn){ bracketZoom = Math.min(3, +(bracketZoom+0.25).toFixed(2)); fitBracketScale(); return; }
    var zoomOutBtn = e.target.closest('[data-action="bracket-zoom-out"]');
    if(zoomOutBtn){ bracketZoom = Math.max(0.5, +(bracketZoom-0.25).toFixed(2)); fitBracketScale(); return; }
    var zoomResetBtn = e.target.closest('[data-action="bracket-zoom-reset"]');
    if(zoomResetBtn){ bracketZoom = 1; fitBracketScale(); return; }
    var roundTabBtn = e.target.closest('[data-action="round-tab"]');
    if(roundTabBtn){ selectedRound = +roundTabBtn.dataset.round; render(); return; }
    var openBtn = e.target.closest('[data-action="open-team"]');
    if(openBtn){ activeModal = { kind:"team", id:+openBtn.dataset.id, mode: openBtn.dataset.edit ? "edit" : "view" }; render(); return; }
    var editBtn = e.target.closest('[data-action="edit-team"]');
    if(editBtn){ activeModal = { kind:"team", id:+editBtn.dataset.id, mode:"edit" }; render(); return; }
    var closeBtn = e.target.closest('[data-action="close-modal"]');
    if(closeBtn){ activeModal = null; render(); return; }
    if(e.target.classList && e.target.classList.contains("modal-backdrop")){ activeModal = null; render(); return; }
    var saveBtn = e.target.closest('[data-action="save-team"]');
    if(saveBtn){ saveTeamEdit(+saveBtn.dataset.id); return; }
    var adminBtn = e.target.closest('[data-action="admin-toggle"]');
    if(adminBtn){ toggleAdmin(); return; }
    var toggleDrawBtn = e.target.closest('[data-action="toggle-draw-panel"]');
    if(toggleDrawBtn){ drawPanelOpen = !drawPanelOpen; render(); return; }
    var resetDrawBtn = e.target.closest('[data-action="reset-draw"]');
    if(resetDrawBtn){ resetDraw(); return; }
    var openStatsBtn = e.target.closest('[data-action="open-stats"]');
    if(openStatsBtn){
      var mm = getMatch(+openStatsBtn.dataset.r, +openStatsBtn.dataset.i, state);
      statsGameIdx = (mm.isFinal && mm.games && mm.games.length) ? mm.games.length-1 : 0;
      activeModal = { kind:"stats", r:+openStatsBtn.dataset.r, i:+openStatsBtn.dataset.i };
      render(); return;
    }
    var statsGameTabBtn = e.target.closest('[data-action="stats-game-tab"]');
    if(statsGameTabBtn){ statsGameIdx = +statsGameTabBtn.dataset.game; render(); return; }
    var saveMatchStatsBtn = e.target.closest('[data-action="save-match-stats"]');
    if(saveMatchStatsBtn){ saveMatchStats(+saveMatchStatsBtn.dataset.r, +saveMatchStatsBtn.dataset.i); return; }
    var saveFinalStatsBtn = e.target.closest('[data-action="save-final-stats"]');
    if(saveFinalStatsBtn){ saveFinalStats(+saveFinalStatsBtn.dataset.game); return; }
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
      if(!(activeModal && (activeModal.mode === "edit" || activeModal.kind === "stats"))){
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
