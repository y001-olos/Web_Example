// =========================================================
// Filmory 홈페이지 전용 JavaScript
// =========================================================

function onAuthReady() {
  const loginBox = document.getElementById("loginBox");
  const welcomeBox = document.getElementById("welcomeBox");
  const hello = document.getElementById("hello");

  if (!loginBox || !welcomeBox) {
    console.error("홈 화면의 로그인 영역을 찾을 수 없습니다.");
    return;
  }

  if (currentUser) {
    loginBox.hidden = true;
    welcomeBox.hidden = false;

    if (hello) {
      const email = currentUser.email || "사용자";
      const nickname = email.includes("@")
        ? email.split("@")[0]
        : email;

      hello.textContent = nickname + "님, 안녕하세요!";
    }

    moveToReturnPath();
  } else {
    loginBox.hidden = false;
    welcomeBox.hidden = true;

    prepareLoginForm();
  }
}

/**
 * 비밀번호 입력창에서 Enter를 누르면 로그인합니다.
 */
function prepareLoginForm() {
  const passwordInput = document.getElementById("password");

  if (!passwordInput) {
    return;
  }

  // 인증 상태가 다시 확인되더라도 이벤트가 중복 등록되지 않게 합니다.
  if (passwordInput.dataset.enterReady === "true") {
    return;
  }

  passwordInput.dataset.enterReady = "true";

  passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      signIn();
    }
  });
}

/**
 * 로그인 필수 페이지에서 홈으로 이동된 사용자라면
 * 로그인 후 원래 방문하려던 페이지로 돌아갑니다.
 */
function moveToReturnPath() {
  const returnPath = sessionStorage.getItem("filmoryReturnPath");

  if (!returnPath) {
    return;
  }

  sessionStorage.removeItem("filmoryReturnPath");

  if (
    returnPath.startsWith("/") &&
    !returnPath.startsWith("//")
  ) {
    location.href = returnPath;
  }
}