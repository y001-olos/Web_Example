const SUPABASE_URL =
  "https://yoplvefionximusjddsm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_soOppa2ForNkw5TCBi9pKw_Kh5KLTBK";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;

const MENU = [
  ["홈", "/index.html"],
  ["영화 검색", "/pages/search.html"],
  ["AI 추천", "/pages/recommend.html"],
  ["내 리뷰", "/pages/mypage.html"],
];

/**
 * 공통 메뉴를 표시합니다.
 */
function renderNav() {
  const nav = document.querySelector("#nav");

  if (!nav) {
    return;
  }

  nav.innerHTML = "";

  const brand = document.createElement("a");

  brand.className = "brand";
  brand.href = "/index.html";
  brand.textContent = "FILMORY";

  const menu = document.createElement("nav");

  MENU.forEach(function ([title, url]) {
    const link = document.createElement("a");

    link.href = url;
    link.textContent = title;

    const isHome =
      url === "/index.html" &&
      (
        location.pathname === "/" ||
        location.pathname === "/index.html"
      );

    if (
      location.pathname === url ||
      isHome
    ) {
      link.className = "on";
    }

    menu.appendChild(link);
  });

  const accountArea = document.createElement("div");

  accountArea.className = "me";

  if (currentUser) {
    const userName = document.createElement("span");

    userName.textContent =
      currentUser.user_metadata?.username ||
      currentUser.email ||
      "사용자";

    const logoutButton = document.createElement("button");

    logoutButton.type = "button";
    logoutButton.textContent = "로그아웃";
    logoutButton.addEventListener("click", signOut);

    accountArea.append(
      userName,
      logoutButton
    );
  } else {
    const loginLink = document.createElement("a");

    loginLink.href = "/index.html#authBox";
    loginLink.textContent = "로그인";

    accountArea.appendChild(loginLink);
  }

  nav.append(
    brand,
    menu,
    accountArea
  );
}

/**
 * 아이디 형식과 중복 상태를 확인합니다.
 */
async function checkUsernameAvailability(username) {
  const normalizedUsername =
    String(username || "")
      .trim()
      .toLowerCase();

  if (
    !/^[a-z0-9_]{3,20}$/.test(
      normalizedUsername
    )
  ) {
    return {
      available: false,

      reason:
        "아이디는 영문 소문자, 숫자, 밑줄만 사용해 3~20자로 입력하세요.",
    };
  }

  const { data, error } = await db.rpc(
    "is_username_available",
    {
      candidate: normalizedUsername,
    }
  );

  if (error) {
    throw error;
  }

  if (data === true) {
    return {
      available: true,
      reason: "사용할 수 있는 아이디입니다.",
    };
  }

  return {
    available: false,
    reason: "이미 사용 중인 아이디입니다.",
  };
}

/**
 * 회원가입 요청을 보냅니다.
 *
 * 이메일 인증 전에는 session이 생성되지 않을 수 있습니다.
 */
async function signUp({
  username,
  email,
  password,
}) {
  const normalizedUsername =
    String(username || "")
      .trim()
      .toLowerCase();

  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "이메일을 입력해 주세요."
    );
  }

  if (
    String(password || "").length < 6
  ) {
    throw new Error(
      "비밀번호는 6자 이상이어야 합니다."
    );
  }

  const usernameResult =
    await checkUsernameAvailability(
      normalizedUsername
    );

  if (!usernameResult.available) {
    throw new Error(
      usernameResult.reason
    );
  }

  const { data, error } =
    await db.auth.signUp({
      email: normalizedEmail,
      password: password,

      options: {
        emailRedirectTo:
          "https://clever-platypus-3dd7d3.netlify.app/index.html?confirmed=1",

        data: {
          username: normalizedUsername,
        },
      },
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 이메일과 비밀번호로 로그인합니다.
 */
async function signIn({
  email,
  password,
}) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  const { data, error } =
    await db.auth.signInWithPassword({
      email: normalizedEmail,
      password: String(password || ""),
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 회원가입 인증 메일을 다시 전송합니다.
 */
async function resendConfirmation(email) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "인증 메일을 받을 이메일을 입력해 주세요."
    );
  }

  const { error } =
    await db.auth.resend({
      type: "signup",
      email: normalizedEmail,

      options: {
        emailRedirectTo:
          "https://clever-platypus-3dd7d3.netlify.app/index.html?confirmed=1",
      },
    });

  if (error) {
    throw error;
  }
}

/**
 * 로그아웃합니다.
 */
async function signOut() {
  const { error } =
    await db.auth.signOut();

  if (error) {
    alert(
      "로그아웃 실패: " +
      error.message
    );

    return;
  }

  location.href = "/index.html";
}

const ready = new Promise(function (resolve) {
  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      resolve,
      {
        once: true,
      }
    );
  } else {
    resolve();
  }
});

/**
 * 로그인 상태를 확인합니다.
 */
db.auth.onAuthStateChange(
  function (_event, session) {
    currentUser =
      session?.user || null;

    ready.then(function () {
      renderNav();

      if (
        !currentUser &&
        document.body.dataset
          .requireAuth === "true"
      ) {
        sessionStorage.setItem(
          "filmoryReturnPath",
          location.pathname +
            location.search
        );

        location.href =
          "/index.html#authBox";

        return;
      }

      if (
        typeof onAuthReady ===
        "function"
      ) {
        onAuthReady();
      }
    });
  }
);

/**
 * Netlify AI Function을 호출합니다.
 */
async function api(path, options) {
  let response;

  try {
    response = await fetch(
      path,
      options
    );
  } catch {
    throw new Error(
      "서버에 연결할 수 없습니다. Netlify 배포 주소에서 다시 시도해 주세요."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "서버 응답 형식이 올바르지 않습니다."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      "요청 처리 중 오류가 발생했습니다."
    );
  }

  return data;
}

const askAI = function (prompt) {
  return api(
    "/api/ai",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        prompt: prompt,
      }),
    }
  ).then(function (data) {
    return data.text;
  });
};

const movieAPI = function (params) {
  return api(
    "/api/movies?" +
    new URLSearchParams(params)
  );
};

const poster = function (
  posterPath,
  size = "w500"
) {
  if (!posterPath) {
    return "/assets/poster-placeholder.svg";
  }

  return (
    "https://image.tmdb.org/t/p/" +
    size +
    posterPath
  );
};

const esc = function (value) {
  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }[character];
      }
    );
};

const year = function (dateValue) {
  return dateValue
    ? String(dateValue).slice(0, 4)
    : "연도 미상";
};

const message = function (error) {
  return (
    error?.message ||
    "오류가 발생했습니다."
  );
};

function movieCard(
  movie,
  reason = ""
) {
  return `
    <article class="movie-card">
      "
        alt="${esc(movie.title)} 포스터"
        loading="lazy"
      >

      <div class="movie-body">
        <span class="movie-meta">
          ${year(movie.release_date)}
          ·
          ★ ${Number(
            movie.vote_average || 0
          ).toFixed(1)}
        </span>

        <h2>
          ${esc(movie.title)}
        </h2>

        ${
          reason
            ? `
              <p class="reason">
                ${esc(reason)}
              </p>
            `
            : `
              <p>
                ${esc(
                  movie.overview ||
                  "줄거리 정보가 없습니다."
                )}
              </p>
            `
        }

        /pages/review.html?movieId=${movie.id}
          리뷰 작성
        </a>
      </div>
    </article>
  `;
}