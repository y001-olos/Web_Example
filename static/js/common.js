// =========================================================
// Filmory 공통 JavaScript
// 로그인, 회원가입, 메뉴, Supabase, AI 호출을 담당합니다.
// =========================================================

// ---------------------------------------------------------
// 1. Supabase 연결
// ---------------------------------------------------------

// 기존 Supabase 프로젝트의 URL과 Publishable Key입니다.
// 이 두 값은 Filmory에서도 계속 사용합니다.
const SUPABASE_URL = "https://yoplvefionximusjddsm.supabase.co";
const SUPABASE_KEY =
"sb_publishable_soOppa2ForNkw5TCBi9pKw_Kh5KLTBK";

// Supabase 클라이언트를 생성합니다.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 현재 로그인한 사용자입니다.
// 로그인하지 않은 경우 null입니다.
let currentUser = null;

// ---------------------------------------------------------
// 2. 공통 메뉴
// ---------------------------------------------------------

const MENU = [
  {
    name: "홈",
    url: "/index.html",
  },
  {
    name: "영화 검색",
    url: "/pages/search.html",
  },
  {
    name: "AI 추천",
    url: "/pages/recommend.html",
  },
  {
    name: "내 리뷰",
    url: "/pages/mypage.html",
  },
];

/**
 * 모든 페이지 상단에 공통 메뉴를 표시합니다.
 */
function renderNav() {
  const nav = document.getElementById("nav");

  if (!nav) {
    return;
  }

  const currentPath = location.pathname;
  nav.replaceChildren();

  const brand = document.createElement("div");
  brand.className = "brand";

  const brandLink = document.createElement("a");
  brandLink.href = "/index.html";
  brandLink.textContent = "Filmory";
  brand.appendChild(brandLink);

  const menuNav = document.createElement("nav");
  menuNav.className = "menu";
  menuNav.setAttribute("aria-label", "주요 메뉴");

  MENU.forEach(function (menu) {
    const isHome =
      menu.url === "/index.html" &&
      (currentPath === "/" || currentPath === "/index.html");

    const link = document.createElement("a");
    link.href = menu.url;
    link.textContent = menu.name;

    if (currentPath === menu.url || isHome) {
      link.classList.add("on");
      link.setAttribute("aria-current", "page");
    }

    menuNav.appendChild(link);
  });

  const userArea = document.createElement("div");
  userArea.className = "me";

  if (currentUser) {
    const email = document.createElement("span");
    email.className = "user-email";
    email.textContent = currentUser.email || "사용자";

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.textContent = "로그아웃";
    logoutButton.addEventListener("click", signOut);

    userArea.append(email, logoutButton);
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "/index.html#loginBox";
    loginLink.textContent = "로그인";
    userArea.appendChild(loginLink);
  }

  nav.append(brand, menuNav, userArea);
}

// ---------------------------------------------------------
// 3. 회원가입
// ---------------------------------------------------------

/**
 * 입력된 이메일과 비밀번호로 회원가입합니다.
 */
async function signUp() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("회원가입 입력창을 찾을 수 없습니다.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    alert("이메일을 입력해 주세요.");
    emailInput.focus();
    return;
  }

  if (!password) {
    alert("비밀번호를 입력해 주세요.");
    passwordInput.focus();
    return;
  }

  if (password.length < 6) {
    alert("비밀번호는 6자 이상으로 입력해 주세요.");
    passwordInput.focus();
    return;
  }

  setAuthButtonsDisabled(true);

  try {
    const { data, error } = await db.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      alert("회원가입이 완료되었습니다. 바로 로그인되었습니다.");
    } else {
      alert(
        "회원가입이 완료되었습니다. 이메일 인증이 필요하다면 받은 편지함을 확인해 주세요."
      );
    }
  } catch (error) {
    console.error("회원가입 실패:", error);
    alert("회원가입 실패: " + getErrorMessage(error));
  } finally {
    setAuthButtonsDisabled(false);
  }
}

// ---------------------------------------------------------
// 4. 로그인
// ---------------------------------------------------------

/**
 * 입력된 이메일과 비밀번호로 로그인합니다.
 */
async function signIn() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("로그인 입력창을 찾을 수 없습니다.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 모두 입력해 주세요.");
    return;
  }

  setAuthButtonsDisabled(true);

  try {
    const { error } = await db.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    passwordInput.value = "";

    const returnPath = sessionStorage.getItem("filmoryReturnPath");

    if (returnPath) {
      sessionStorage.removeItem("filmoryReturnPath");
      location.href = returnPath;
    }
  } catch (error) {
    console.error("로그인 실패:", error);
    alert("로그인 실패: " + getErrorMessage(error));
  } finally {
    setAuthButtonsDisabled(false);
  }
}

// ---------------------------------------------------------
// 5. 로그아웃
// ---------------------------------------------------------

/**
 * 현재 사용자를 로그아웃시키고 홈으로 이동합니다.
 */
async function signOut() {
  try {
    const { error } = await db.auth.signOut();

    if (error) {
      throw error;
    }

    location.href = "/index.html";
  } catch (error) {
    console.error("로그아웃 실패:", error);
    alert("로그아웃 실패: " + getErrorMessage(error));
  }
}

/**
 * 로그인 및 회원가입 버튼의 중복 클릭을 방지합니다.
 */
function setAuthButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll("[data-auth-button]");

  buttons.forEach(function (button) {
    button.disabled = disabled;
  });
}

// ---------------------------------------------------------
// 6. 로그인 상태 확인
// ---------------------------------------------------------

// HTML이 모두 준비된 후 각 페이지의 전용 함수를 실행합니다.
const pageReady = new Promise(function (resolve) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resolve);
  } else {
    resolve();
  }
});

db.auth.onAuthStateChange(function (event, session) {
  currentUser = session ? session.user : null;

  pageReady.then(function () {
    renderNav();

    const requiresAuth =
      document.body &&
      document.body.dataset.requireAuth === "true";

    // 로그인이 필요한 페이지에 비로그인 상태로 접근한 경우
    if (!currentUser && requiresAuth) {
      const returnPath =
        location.pathname + location.search + location.hash;

      sessionStorage.setItem("filmoryReturnPath", returnPath);

      alert("로그인이 필요한 페이지입니다.");
      location.href = "/index.html#loginBox";
      return;
    }

    // 페이지별 JavaScript에 정의된 함수를 실행합니다.
    if (typeof onAuthReady === "function") {
      onAuthReady();
    } else {
      console.warn(
        "onAuthReady() 함수가 없습니다. 페이지 전용 JavaScript 파일을 확인하세요."
      );
    }
  });
});

// ---------------------------------------------------------
// 7. Groq AI 호출
// ---------------------------------------------------------

/**
 * Vercel의 /api/ai 서버리스 함수를 통해 Groq API를 호출합니다.
 *
 * GROQ_API_KEY는 이 파일에 입력하지 않습니다.
 * 실제 키는 Vercel 환경 변수에서 관리합니다.
 *
 * @param {string} prompt AI에게 전달할 요청
 * @returns {Promise<string>} AI가 작성한 결과
 */
async function askAI(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("AI에게 전달할 내용을 입력해 주세요.");
  }

  let response;

  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
      }),
    });
  } catch (error) {
    console.error("AI 서버 연결 실패:", error);

    throw new Error(
      "AI 서버에 연결하지 못했습니다. Vercel 배포 주소 또는 vercel dev로 실행해 주세요."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error("AI 응답 변환 실패:", error);
    throw new Error("AI 서버의 응답을 읽지 못했습니다.");
  }

  if (!response.ok) {
    console.error("AI 호출 실패:", response.status, data);

    throw new Error(
      data.error || "AI 요청을 처리하는 중 오류가 발생했습니다."
    );
  }

  if (!data.text || typeof data.text !== "string") {
    throw new Error("AI 응답에서 text 값을 찾을 수 없습니다.");
  }

  return data.text.trim();
}

// ---------------------------------------------------------
// 8. 영화 정보 API 공통 호출
// ---------------------------------------------------------

/**
 * Filmory의 영화 정보 서버를 호출합니다.
 *
 * 지금은 TMDB 토큰이 없어도 이 함수를 작성해 둘 수 있습니다.
 * /api/movies.js 파일을 만들 때 TMDB 토큰이 필요합니다.
 *
 * 실제 토큰은 JavaScript에 직접 입력하지 않고
 * Vercel 환경 변수 TMDB_ACCESS_TOKEN에 등록합니다.
 *
 * @param {Object} parameters 영화 API에 전달할 값
 * @returns {Promise<Object>} 영화 정보
 */
async function requestMovieAPI(parameters) {
  const searchParams = new URLSearchParams();

  Object.keys(parameters).forEach(function (key) {
    const value = parameters[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const url = "/api/movies?" + searchParams.toString();

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    console.error("영화 정보 서버 연결 실패:", error);

    throw new Error(
      "영화 정보 서버에 연결하지 못했습니다. Vercel 배포 주소 또는 vercel dev로 실행해 주세요."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error("영화 API 응답 변환 실패:", error);
    throw new Error("영화 정보 서버의 응답을 읽지 못했습니다.");
  }

  if (!response.ok) {
    console.error("영화 API 호출 실패:", response.status, data);

    throw new Error(
      data.error || "영화 정보를 불러오는 중 오류가 발생했습니다."
    );
  }

  return data;
}

// ---------------------------------------------------------
// 9. 공통 유틸리티
// ---------------------------------------------------------

/**
 * 사용자 입력을 안전하게 HTML에 표시합니다.
 */
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * 오류 객체에서 사용자에게 보여줄 메시지를 가져옵니다.
 */
function getErrorMessage(error) {
  if (!error) {
    return "알 수 없는 오류가 발생했습니다.";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || "알 수 없는 오류가 발생했습니다.";
}

/**
 * 날짜를 한국 시간 형식으로 표시합니다.
 */
function formatDateTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ko-KR");
}

/**
 * 개봉일에서 연도만 가져옵니다.
 */
function getReleaseYear(releaseDate) {
  if (!releaseDate) {
    return "연도 정보 없음";
  }

  const year = String(releaseDate).slice(0, 4);

  if (/^\d{4}$/.test(year)) {
    return year;
  }

  return "연도 정보 없음";
}

/**
 * TMDB 포스터 경로를 전체 이미지 주소로 변환합니다.
 */
function getPosterURL(posterPath, size) {
  const imageSize = size || "w500";

  if (!posterPath) {
    return "/assets/poster-placeholder.png";
  }

  if (
    posterPath.startsWith("http://") ||
    posterPath.startsWith("https://")
  ) {
    return posterPath;
  }

  return "https://image.tmdb.org/t/p/" + imageSize + posterPath;
}

/**
 * 영화 ID가 유효한지 확인합니다.
 */
function isValidMovieId(movieId) {
  const id = Number(movieId);

  return Number.isInteger(id) && id > 0;
}
