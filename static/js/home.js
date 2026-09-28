// =========================================================
// Filmory 홈페이지 전용 JavaScript
// 로그인 상태에 따라 홈 화면을 변경합니다.
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
    // 로그인한 사용자에게는 로그인 입력창을 숨깁니다.
    loginBox.hidden = true;
    welcomeBox.hidden = false;

    if (hello) {
      const email = currentUser.email || "사용자";

      const nickname = email.includes("@")
        ? email.split("@")[0]
        : email;

      hello.textContent = nickname + "님, 안녕하세요!";
    }
  } else {
    // 로그인하지 않은 사용자에게는 로그인 입력창을 보여줍니다.
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

  // 인증 상태가 다시 확인되어도 이벤트가 중복 등록되지 않게 합니다.
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