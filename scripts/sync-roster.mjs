// Pulls team/player roster data from the published Google Sheet CSV and
// writes it into data/state.json via the same admin worker API the site's
// own admin panel uses (login -> read sha -> save). Only touches
// state.teams; draw order and match results are left untouched.
//
// Required env: ADMIN_PASSCODE (the same passcode used to log into the
// site's admin panel, provided as a GitHub Actions secret).

const WORKER_BASE = "https://zzp-craft-cup-admin.jiminsh94.workers.dev";
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRb8vW_6Jpf98Pfda_SY1STLuZLTI5v9mzHxqnW03Q9jo9Xp0j5wu2Eeoy_ltLiyqBItMPAjSXhJ6Z/pub?gid=741899986&single=true&output=csv";
const TOTAL_TEAMS = 32;

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c === "\r") {
      // skip, \n handles the row break
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parsePlayerCell(cell, role) {
  const s = (cell || "").trim();
  if (!s) return { role, nick: "", uid: "" };
  const parts = s.split(/\s*\/\s*/);
  return { role, nick: (parts[0] || "").trim(), uid: (parts[1] || "").trim() };
}

function utf8ToBase64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}
function base64ToUtf8(b64) {
  return Buffer.from(b64, "base64").toString("utf8");
}

async function apiErrorDetail(res) {
  let msg = "HTTP " + res.status;
  try {
    const body = await res.json();
    if (body && (body.message || body.error)) msg += ": " + (body.message || body.error);
  } catch (e) {}
  return msg;
}

async function fetchSheetTeams() {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error("시트 CSV 불러오기 실패: HTTP " + res.status);
  const csv = await res.text();
  const rows = parseCsv(csv);

  const headerIdx = rows.findIndex(r => (r[1] || "").trim() === "No.");
  if (headerIdx < 0) throw new Error("시트에서 헤더 행(No.)을 찾지 못했습니다.");

  const teams = {};
  for (let i = headerIdx + 1; i < rows.length && Object.keys(teams).length < TOTAL_TEAMS; i++) {
    const r = rows[i];
    const id = parseInt((r[1] || "").trim(), 10);
    if (!id || id < 1 || id > TOTAL_TEAMS) continue;
    const name = (r[2] || "").trim();
    if (!name) continue;
    const confirmed = (r[8] || "").trim().toUpperCase() === "TRUE";
    teams[String(id)] = {
      name,
      confirmed,
      players: [
        parsePlayerCell(r[3], "팀장"),
        parsePlayerCell(r[4], "팀원"),
        parsePlayerCell(r[5], "팀원"),
        parsePlayerCell(r[6], "팀원"),
        parsePlayerCell(r[7], "후보"),
      ],
    };
  }
  return teams;
}

async function fetchShaAndState() {
  const res = await fetch(WORKER_BASE + "/state", { cache: "no-store" });
  if (!res.ok) throw new Error("state 불러오기 실패: " + (await apiErrorDetail(res)));
  const json = await res.json();
  const state = JSON.parse(base64ToUtf8(json.content));
  return { sha: json.sha, state };
}

async function login(passcode) {
  const res = await fetch(WORKER_BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  if (!res.ok) throw new Error("관리자 로그인 실패: " + (await apiErrorDetail(res)));
  const body = await res.json();
  if (!body || !body.ok || !body.token) throw new Error("관리자 로그인 실패: 토큰 없음");
  return body.token;
}

async function save(newState, sha, token) {
  const res = await fetch(WORKER_BASE + "/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      sha,
      content: utf8ToBase64(JSON.stringify(newState, null, 2)),
    }),
  });
  const payload = await res.json().catch(() => null);
  if (payload && payload.status === "conflict") return "conflict";
  if (!res.ok || !payload || payload.status === "error") {
    throw new Error("저장 실패: " + ((payload && payload.detail) || ("HTTP " + res.status)));
  }
  return "ok";
}

function teamsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";

  console.log("시트에서 팀 정보를 불러오는 중...");
  const sheetTeams = await fetchSheetTeams();
  console.log("시트에서 " + Object.keys(sheetTeams).length + "개 팀을 읽었습니다.");

  console.log("현재 state.json을 불러오는 중...");
  const { sha, state } = await fetchShaAndState();
  if (!state.teams) state.teams = {};

  let changed = false;
  const changedIds = [];
  for (const id of Object.keys(sheetTeams)) {
    if (!teamsEqual(state.teams[id], sheetTeams[id])) {
      changed = true;
      changedIds.push(id);
      state.teams[id] = sheetTeams[id];
    }
  }

  if (!changed) {
    console.log("변경된 팀 정보가 없습니다. 저장을 건너뜁니다.");
    return;
  }
  console.log("변경된 팀: " + changedIds.join(", "));

  if (dryRun) {
    console.log("DRY_RUN=1 이므로 저장하지 않고 변경 내용만 출력합니다.");
    for (const id of changedIds) console.log(id, JSON.stringify(sheetTeams[id]));
    return;
  }

  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) throw new Error("ADMIN_PASSCODE 환경변수가 설정되어 있지 않습니다.");

  console.log("로그인 중...");
  const token = await login(passcode);

  console.log("저장 중...");
  const result = await save(state, sha, token);
  if (result === "conflict") {
    console.log("다른 저장과 충돌했습니다. 다음 실행에서 다시 시도됩니다.");
    return;
  }
  console.log("저장 완료.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
