let usernameCheckTimer = null;
let usernameIsAvailable = false;

/**
 * 로그인 상태 확인 후 홈 화면을 초기화합니다.
 */
function onAuthReady() {
  const authBox =
    document.getElementById("authBox");

  const welcomeBox =
    document.getElementById(
      "welcomeBox"
    );

  if (!authBox || !welcomeBox) {
    return;
  }

  authBox.hidden =
    Boolean(currentUser);

  welcomeBox.hidden =
    !currentUser;

  if (currentUser) {
    const username =
      currentUser.user_metadata
        ?.username;

    const fallbackName =
      (
        currentUser.email ||
        "사용자"
      ).split("@")[0];

    document.getElementById(
      "hello"
    ).textContent =
      (
        username ||
        fallbackName
      ) +
      "님, 다시 만나 반가워요.";

    return;
  }

  prepareAuthUI();
  showConfirmationResult();
}

/**
 * 로그인 및 회원가입 이벤트를 연결합니다.
 */
function prepareAuthUI() {
  if (
    document.body.dataset
      .authUiReady === "true"
  ) {
    return;
  }

  document.body.dataset
    .authUiReady = "true";

  document
    .getElementById("loginTab")
    .addEventListener(
      "click",
      function () {
        switchAuthTab("login");
      }
    );

  document
    .getElementById("signupTab")
    .addEventListener(
      "click",
      function () {
        switchAuthTab("signup");
      }
    );

  document
    .getElementById("loginForm")
    .addEventListener(
      "submit",
      handleLogin
    );

  document
    .getElementById("signupForm")
    .addEventListener(
      "submit",
      handleSignup
    );

  document
    .getElementById(
      "resendButton"
    )
    .addEventListener(
      "click",
      handleResend
    );

  document
    .getElementById(
      "signupUsername"
    )
    .addEventListener(
      "input",
      scheduleUsernameCheck
    );
}

/**
 * 로그인과 회원가입 탭을 전환합니다.
 */
function switchAuthTab(tab) {
  const isLogin =
    tab === "login";

  const loginPanel =
    document.getElementById(
      "loginPanel"
    );

  const signupPanel =
    document.getElementById(
      "signupPanel"
    );

  const loginTab =
    document.getElementById(
      "loginTab"
    );

  const signupTab =
    document.getElementById(
      "signupTab"
    );

  loginPanel.hidden = !isLogin;
  signupPanel.hidden = isLogin;

  loginTab.classList.toggle(
    "active",
    isLogin
  );

  signupTab.classList.toggle(
    "active",
    !isLogin
  );

  loginTab.setAttribute(
    "aria-selected",
    String(isLogin)
  );

  signupTab.setAttribute(
    "aria-selected",
    String(!isLogin)
  );
}

/**
 * 입력이 끝난 뒤 아이디를 확인합니다.
 */
function scheduleUsernameCheck() {
  clearTimeout(
    usernameCheckTimer
  );

  usernameIsAvailable = false;
  updateSignupButton();

  const input =
    document.getElementById(
      "signupUsername"
    );

  const resultMessage =
    document.getElementById(
      "usernameMessage"
    );

  const username =
    input.value
      .trim()
      .toLowerCase();

  input.value = username;

  if (!username) {
    resultMessage.textContent = "";
    resultMessage.className =
      "field-message";

    return;
  }

  resultMessage.textContent =
    "아이디를 확인하는 중...";

  resultMessage.className =
    "field-message checking";

  usernameCheckTimer =
    setTimeout(
      async function () {
        try {
          const result =
            await checkUsernameAvailability(
              username
            );

          usernameIsAvailable =
            result.available;

          resultMessage.textContent =
            result.reason;

          resultMessage.className =
            result.available
              ? "field-message success"
              : "field-message error";
        } catch (error) {
          usernameIsAvailable = false;

          resultMessage.textContent =
            "아이디 확인에 실패했습니다.";

          resultMessage.className =
            "field-message error";

          console.error(error);
        }

        updateSignupButton();
      },
      450
    );
}

/**
 * 사용 가능한 아이디가 확인되어야
 * 회원가입 버튼을 활성화합니다.
 */
function updateSignupButton() {
  const signupButton =
    document.getElementById(
      "signupButton"
    );

  signupButton.disabled =
    !usernameIsAvailable;
}

/**
 * 회원가입을 처리합니다.
 */
async function handleSignup(event) {
  event.preventDefault();

  const signupMessage =
    document.getElementById(
      "signupMessage"
    );

  const signupButton =
    document.getElementById(
      "signupButton"
    );

  const username =
    document.getElementById(
      "signupUsername"
    ).value;

  const email =
    document.getElementById(
      "signupEmail"
    ).value;

  const password =
    document.getElementById(
      "signupPassword"
    ).value;

  const passwordConfirm =
    document.getElementById(
      "signupPasswordConfirm"
    ).value;

  if (!usernameIsAvailable) {
    setAuthMessage(
      signupMessage,
      "사용 가능한 아이디를 먼저 입력해 주세요.",
      "error"
    );

    return;
  }

  if (
    password !==
    passwordConfirm
  ) {
    setAuthMessage(
      signupMessage,
      "비밀번호가 서로 일치하지 않습니다.",
      "error"
    );

    return;
  }

  signupButton.disabled = true;

  signupButton.textContent =
    "가입 처리 중...";

  try {
    const data = await signUp({
      username: username,
      email: email,
      password: password,
    });

    if (data.session) {
      setAuthMessage(
        signupMessage,
        "회원가입과 로그인이 완료되었습니다.",
        "success"
      );
    } else {
      setAuthMessage(
        signupMessage,
        "회원가입 요청이 접수되었습니다. 받은 편지함에서 인증 링크를 눌러야 가입이 최종 완료됩니다.",
        "success"
      );

      document.getElementById(
        "loginEmail"
      ).value =
        email.trim();

      document.getElementById(
        "resendButton"
      ).hidden = false;
    }
  } catch (error) {
    const errorMessage =
      error?.message || "";

    let friendlyMessage =
      errorMessage;

    if (
      /already|registered|exists/i.test(
        errorMessage
      )
    ) {
      friendlyMessage =
        "이미 가입된 이메일 또는 아이디입니다. 로그인을 시도하거나 다른 정보를 입력해 주세요.";
    }

    if (
      /username_already_exists/i.test(
        errorMessage
      )
    ) {
      friendlyMessage =
        "이미 사용 중인 아이디입니다.";
    }

    setAuthMessage(
      signupMessage,
      friendlyMessage,
      "error"
    );
  } finally {
    signupButton.textContent =
      "회원가입";

    updateSignupButton();
  }
}

/**
 * 로그인을 처리합니다.
 */
async function handleLogin(event) {
  event.preventDefault();

  const loginMessage =
    document.getElementById(
      "loginMessage"
    );

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const email =
    document.getElementById(
      "loginEmail"
    ).value;

  const password =
    document.getElementById(
      "loginPassword"
    ).value;

  if (!email || !password) {
    setAuthMessage(
      loginMessage,
      "이메일과 비밀번호를 모두 입력해 주세요.",
      "error"
    );

    return;
  }

  loginButton.disabled = true;

  loginButton.textContent =
    "로그인 중...";

  try {
    await signIn({
      email: email,
      password: password,
    });

    setAuthMessage(
      loginMessage,
      "로그인되었습니다.",
      "success"
    );
  } catch (error) {
    const errorMessage =
      error?.message || "";

    if (
      /email not confirmed/i.test(
        errorMessage
      )
    ) {
      setAuthMessage(
        loginMessage,
        "아직 이메일 인증이 완료되지 않았습니다. 받은 편지함에서 인증 링크를 눌러 주세요.",
        "error"
      );

      document.getElementById(
        "resendButton"
      ).hidden = false;
    } else if (
      /invalid login credentials/i.test(
        errorMessage
      )
    ) {
      setAuthMessage(
        loginMessage,
        "이메일 또는 비밀번호가 올바르지 않습니다.",
        "error"
      );
    } else {
      setAuthMessage(
        loginMessage,
        errorMessage ||
          "로그인하지 못했습니다.",
        "error"
      );
    }
  } finally {
    loginButton.disabled = false;

    loginButton.textContent =
      "로그인";
  }
}

/**
 * 회원가입 인증 메일을 다시 보냅니다.
 */
async function handleResend() {
  const loginMessage =
    document.getElementById(
      "loginMessage"
    );

  const resendButton =
    document.getElementById(
      "resendButton"
    );

  const email =
    document.getElementById(
      "loginEmail"
    ).value;

  resendButton.disabled = true;

  resendButton.textContent =
    "전송 중...";

  try {
    await resendConfirmation(
      email
    );

    setAuthMessage(
      loginMessage,
      "인증 메일을 다시 보냈습니다. 받은 편지함과 스팸함을 확인해 주세요.",
      "success"
    );
  } catch (error) {
    setAuthMessage(
      loginMessage,
      error?.message ||
        "인증 메일을 보내지 못했습니다.",
      "error"
    );
  } finally {
    resendButton.disabled = false;

    resendButton.textContent =
      "인증 메일 다시 보내기";
  }
}

/**
 * 인증 및 로그인 상태 메시지를 표시합니다.
 */
function setAuthMessage(
  element,
  text,
  type
) {
  element.hidden = false;

  element.className =
    "auth-message " + type;

  element.textContent = text;
}

/**
 * 이메일 인증 링크로 돌아온 사용자를 안내합니다.
 */
function showConfirmationResult() {
  const params =
    new URLSearchParams(
      location.search
    );

  if (
    params.get("confirmed") !== "1"
  ) {
    return;
  }

  switchAuthTab("login");

  setAuthMessage(
    document.getElementById(
      "loginMessage"
    ),
    "이메일 인증이 완료되었습니다. 이제 가입한 이메일과 비밀번호로 로그인해 주세요.",
    "success"
  );

  history.replaceState(
    {},
    "",
    "/index.html"
  );
}