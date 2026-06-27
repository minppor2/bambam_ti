/**
 * 보안 주석:
 * 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
 * 2. Gemini API 호출은 Vercel Serverless Function(/api/gemini-counseling)에서 처리한다.
 * 3. .env 파일은 GitHub에 올리지 않는다.
 * 4. Vercel 배포 시에는 Project Settings → Environment Variables에
 *    GEMINI_API_KEY를 등록해야 한다.
 * 5. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한
 *    최소 정보(별칭, 성적 요약, 학습 특성, 교사 고민)로 제한한다.
 */

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

/* ── 학생 별칭 매핑 (개인정보 보호) ── */
const STUDENT_ALIAS = {};
STUDENTS.forEach((s, i) => {
  const label = String.fromCharCode(65 + i); // A, B, C …
  STUDENT_ALIAS[s.id] = "학생 " + label;
});

/* ── DOM 요소 ── */
const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;

/* ── 로그인 / 로그아웃 ── */
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

/* ── 학생 페이지 ── */
function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, "gradesTitle-" + student.id)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

/* ── 관리자 대시보드 ── */
function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    ${renderCounselingPanel()}
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");
  bindCounselingEvents();
}

/* ── 학생 카드 (관리자용) ── */
function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, "gradesTitle-" + student.id)}
        ${renderTraits(student)}
        <button
          class="primary-button counseling-request-btn"
          type="button"
          data-student-id="${student.id}"
        >💬 상담 전략 요청</button>
      </div>
    </article>
  `;
}

/* ── 공통: 성적 테이블 ── */
function renderGrades(grades, compact, headingId) {
  const rows = Object.entries(grades)
    .map(([label, value]) => "<tr><th scope=\"row\">" + label + "</th><td>" + value + "</td></tr>")
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

/* ── 공통: 학습 특성 ── */
function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => "<li>" + trait + "</li>").join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

/* ========================================================
   AI 학생 상담 전략 도우미
   ======================================================== */

/**
 * 상담 전략 도우미 패널 HTML을 생성한다.
 * 모달이 아닌 관리자 페이지 안에 삽입되는 카드/패널 형태.
 */
function renderCounselingPanel() {
  return `
    <section class="counseling-panel" id="counselingPanel" aria-labelledby="counselingTitle">
      <div class="counseling-panel-header">
        <h2 id="counselingTitle">🤖 AI 학생 상담 전략 도우미</h2>
        <p class="counseling-subtitle">학생을 선택하고, 상담 고민을 입력하면 AI가 상담 전략을 제안합니다.</p>
      </div>

      <div class="counseling-body">
        <!-- 선택된 학생 표시 -->
        <div class="counseling-field">
          <label class="counseling-label">선택된 학생</label>
          <div id="counselingSelectedStudent" class="counseling-selected-student">
            아래 학생 카드에서 "상담 전략 요청" 버튼을 눌러주세요.
          </div>
        </div>

        <!-- 교사 고민 입력 -->
        <div class="counseling-field">
          <label class="counseling-label" for="teacherConcernInput">교사 상담 고민</label>
          <textarea
            id="teacherConcernInput"
            class="counseling-textarea"
            rows="4"
            placeholder="예: 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?&#10;예: 과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?&#10;예: 친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?"
          ></textarea>
        </div>

        <!-- 전송 데이터 미리보기 -->
        <div class="counseling-field">
          <label class="counseling-label">전송 데이터 미리보기</label>
          <p class="counseling-preview-description">아래 데이터만 AI에게 전송됩니다. 학생 이름·학번·사진 경로·비밀번호는 포함되지 않습니다.</p>
          <pre id="counselingPreview" class="counseling-preview">학생을 선택하고 고민을 입력하면 미리보기가 표시됩니다.</pre>
        </div>

        <!-- 버튼 + 오류 -->
        <div class="counseling-actions">
          <button id="counselingSubmitBtn" class="primary-button counseling-submit-btn" type="button" disabled>
            ✨ AI 상담 전략 받기
          </button>
          <p id="counselingError" class="counseling-error" role="alert" aria-live="polite"></p>
        </div>

        <!-- 결과 표시 -->
        <div id="counselingResult" class="counseling-result hidden" aria-live="polite"></div>
      </div>

      <p class="counseling-disclaimer">
        ⚠️ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
      </p>
    </section>
  `;
}

/**
 * 학생의 성적·특성을 Gemini 전송용 텍스트로 요약한다.
 * 이름, 학번, 사진 경로, 비밀번호는 포함하지 않는다.
 */
function buildGradeSummary(student) {
  return Object.entries(student.grades)
    .map(([k, v]) => k + ": " + v)
    .join(", ");
}

function buildTraitsSummary(student) {
  return student.traits.join(" / ");
}

/**
 * 전송 데이터 미리보기 JSON을 생성한다.
 */
function buildPreviewData(student, concern) {
  return {
    studentAlias: STUDENT_ALIAS[student.id],
    gradeSummary: buildGradeSummary(student),
    learningTraits: buildTraitsSummary(student),
    teacherConcern: concern || "(교사 고민 미입력)",
  };
}

/* ── 이벤트 바인딩 ── */
let selectedStudent = null;

function bindCounselingEvents() {
  const panel = document.querySelector("#counselingPanel");
  const selectedArea = document.querySelector("#counselingSelectedStudent");
  const textarea = document.querySelector("#teacherConcernInput");
  const preview = document.querySelector("#counselingPreview");
  const submitBtn = document.querySelector("#counselingSubmitBtn");
  const errorEl = document.querySelector("#counselingError");
  const resultEl = document.querySelector("#counselingResult");

  /* 학생 카드 "상담 전략 요청" 버튼 클릭 */
  document.querySelectorAll(".counseling-request-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sid = btn.getAttribute("data-student-id");
      selectedStudent = STUDENTS.find((s) => s.id === sid);
      if (!selectedStudent) return;

      /* 화면용 정보 (이름/학번 표시) */
      selectedArea.innerHTML =
        "<strong>" + selectedStudent.name + "</strong> (학번 " + selectedStudent.id + ")" +
        "<br><span class=\"counseling-alias-note\">→ AI에게는 \"" +
        STUDENT_ALIAS[selectedStudent.id] + "\"(으)로 익명 전송됩니다.</span>";

      updatePreview();
      submitBtn.disabled = false;
      errorEl.textContent = "";
      resultEl.classList.add("hidden");
      resultEl.innerHTML = "";

      /* 패널로 스크롤 */
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* 교사 고민 입력 시 미리보기 갱신 */
  textarea.addEventListener("input", updatePreview);

  function updatePreview() {
    if (!selectedStudent) {
      preview.textContent = "학생을 선택하고 고민을 입력하면 미리보기가 표시됩니다.";
      return;
    }
    const data = buildPreviewData(selectedStudent, textarea.value.trim());
    preview.textContent = JSON.stringify(data, null, 2);
  }

  /* "AI 상담 전략 받기" 버튼 클릭 */
  submitBtn.addEventListener("click", async () => {
    errorEl.textContent = "";

    if (!selectedStudent) {
      errorEl.textContent = "학생을 먼저 선택해주세요.";
      return;
    }

    const concern = textarea.value.trim();
    if (!concern) {
      errorEl.textContent = "상담 고민을 먼저 입력해주세요.";
      return;
    }

    const payload = buildPreviewData(selectedStudent, concern);

    /* 로딩 상태 */
    submitBtn.disabled = true;
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = "<p class=\"counseling-loading\">⏳ AI가 상담 전략을 생성하는 중입니다…</p>";

    try {
      const res = await fetch("/api/gemini-counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        resultEl.innerHTML =
          "<h3 class=\"counseling-result-title\">📋 AI 상담 전략 결과</h3>" +
          "<div class=\"counseling-result-body\">" + formatResult(json.result) + "</div>";
      } else {
        resultEl.innerHTML = "";
        resultEl.classList.add("hidden");
        errorEl.textContent = "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
      }
    } catch (err) {
      console.error("Counseling fetch error:", err);
      resultEl.innerHTML = "";
      resultEl.classList.add("hidden");
      errorEl.textContent = "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/**
 * Gemini 응답 텍스트를 HTML로 변환한다.
 * 마크다운 헤딩(##), 볼드(**), 번호 목록, 불릿 목록을 간단히 처리한다.
 */
function formatResult(text) {
  /* 줄 단위로 변환 */
  const lines = text.split("\n");
  let html = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    /* 볼드 처리 */
    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    /* 헤딩 */
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})\s/)[1].length;
      const content = line.replace(/^#{1,3}\s/, "");
      html += "<h" + (level + 2) + " class=\"counseling-section-heading\">" + content + "</h" + (level + 2) + ">";
      continue;
    }

    /* 번호 목록 */
    if (/^\d+[\.\)]\s/.test(line)) {
      const content = line.replace(/^\d+[\.\)]\s/, "");
      html += "<p class=\"counseling-list-item\">• " + content + "</p>";
      continue;
    }

    /* 불릿 목록 */
    if (/^[-*]\s/.test(line)) {
      const content = line.replace(/^[-*]\s/, "");
      html += "<p class=\"counseling-list-item\">• " + content + "</p>";
      continue;
    }

    /* 빈 줄 */
    if (line.trim() === "") {
      html += "<br>";
      continue;
    }

    html += "<p>" + line + "</p>";
  }

  return html;
}

/* ── 초기 화면 ── */
showOnly(loginView);
