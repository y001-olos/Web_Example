let detailMovie = null;
let currentReview = null;
let selectedRating = 0;
let aiAssisted = false;
let pageInitialized = false;

/**
 * common.js가 인증 상태 확인을 마친 후 실행합니다.
 */
async function onAuthReady() {
  const movieId =
    new URLSearchParams(
      location.search
    ).get("movieId");

  if (
    !movieId ||
    !/^\d+$/.test(movieId)
  ) {
    showMovieError(
      "올바른 영화 정보가 없습니다. 검색 페이지에서 영화를 다시 선택해 주세요."
    );

    return;
  }

  if (!pageInitialized) {
    pageInitialized = true;

    prepareMoviePageEvents();

    await loadMovieDetail(
      movieId
    );
  }

  updateReviewArea();

  if (
    currentUser &&
    detailMovie
  ) {
    await loadExistingReview();
  }
}

/**
 * 영화 상세 정보를 불러옵니다.
 */
async function loadMovieDetail(
  movieId
) {
  const status =
    document.getElementById(
      "movieStatus"
    );

  status.hidden = false;
  status.textContent =
    "영화 정보를 불러오는 중입니다...";

  try {
    detailMovie =
      await movieAPI({
        action: "detail",
        id: movieId,
      });

    renderMovieDetail();

    document.getElementById(
      "movieDetail"
    ).hidden = false;

    document.getElementById(
      "reviewSection"
    ).hidden = false;

    status.hidden = true;

    document.title =
      detailMovie.title +
      " | Filmory";
  } catch (error) {
    showMovieError(
      message(error)
    );
  }
}

/**
 * 영화 상세 정보를 화면에 출력합니다.
 */
function renderMovieDetail() {
  const title =
    detailMovie.title ||
    "제목 정보 없음";

  const originalTitle =
    detailMovie.original_title || "";

  const releaseDate =
    detailMovie.release_date ||
    "개봉일 정보 없음";

  const genres =
    detailMovie.genres
      ?.map(function (genre) {
        return genre.name;
      })
      .join(" · ") ||
    "장르 정보 없음";

  const runtime =
    detailMovie.runtime
      ? detailMovie.runtime + "분"
      : "상영시간 정보 없음";

  const countries =
    detailMovie.production_countries
      ?.map(function (country) {
        return country.name;
      })
      .join(", ") ||
    "국가 정보 없음";

  const score = Number(
    detailMovie.vote_average || 0
  ).toFixed(1);

  const voteCount = Number(
    detailMovie.vote_count || 0
  ).toLocaleString("ko-KR");

  const posterImage =
    document.getElementById(
      "detailPoster"
    );

  posterImage.src = poster(
    detailMovie.poster_path
  );

  posterImage.alt =
    title + " 포스터";

  document.getElementById(
    "detailTitle"
  ).textContent = title;

  const originalTitleElement =
    document.getElementById(
      "detailOriginalTitle"
    );

  if (
    originalTitle &&
    originalTitle !== title
  ) {
    originalTitleElement.textContent =
      originalTitle;
  } else {
    originalTitleElement.hidden = true;
  }

  if (detailMovie.tagline) {
    document.getElementById(
      "detailTagline"
    ).textContent =
      detailMovie.tagline;
  }

  document.getElementById(
    "detailFacts"
  ).innerHTML = `
    <span>${esc(releaseDate)}</span>
    <span>${esc(genres)}</span>
    <span>${esc(runtime)}</span>
    <span>${esc(countries)}</span>
  `;

  document.getElementById(
    "detailScore"
  ).textContent =
    "★ " + score;

  document.getElementById(
    "detailVoteCount"
  ).textContent =
    voteCount + "명 평가";

  document.getElementById(
    "detailOverview"
  ).textContent =
    detailMovie.overview ||
    "등록된 줄거리 정보가 없습니다.";

  renderCredits();
  renderTrailer();
}

/**
 * 감독과 주요 출연진을 표시합니다.
 */
function renderCredits() {
  const crew =
    detailMovie.credits?.crew || [];

  const cast =
    detailMovie.credits?.cast || [];

  const director =
    crew.find(function (person) {
      return person.job === "Director";
    });

  const topCast =
    cast
      .slice(0, 6)
      .map(function (person) {
        return person.name;
      });

  document.getElementById(
    "detailDirector"
  ).textContent =
    director?.name ||
    "감독 정보 없음";

  document.getElementById(
    "detailCast"
  ).textContent =
    topCast.length
      ? topCast.join(", ")
      : "출연진 정보 없음";
}

/**
 * TMDB 동영상 중 공식 예고편을 찾습니다.
 */
function renderTrailer() {
  const videos =
    detailMovie.videos?.results || [];

  const trailer =
    videos.find(function (video) {
      return (
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official === true
      );
    }) ||
    videos.find(function (video) {
      return (
        video.site === "YouTube" &&
        video.type === "Trailer"
      );
    });

  const trailerLink =
    document.getElementById(
      "trailerLink"
    );

  if (!trailer) {
    trailerLink.hidden = true;
    return;
  }

  trailerLink.href =
    "https://www.youtube.com/watch?v=" +
    encodeURIComponent(
      trailer.key
    );

  trailerLink.hidden = false;
}

/**
 * 로그인 상태에 따라 리뷰 영역을 변경합니다.
 */
function updateReviewArea() {
  const loginNotice =
    document.getElementById(
      "reviewLoginNotice"
    );

  const reviewEditor =
    document.getElementById(
      "reviewEditor"
    );

  loginNotice.hidden =
    Boolean(currentUser);

  reviewEditor.hidden =
    !currentUser;

  if (currentUser) {
    makeRatingButtons();
  }
}

/**
 * 별점 버튼을 만듭니다.
 */
function makeRatingButtons() {
  const container =
    document.getElementById(
      "ratingButtons"
    );

  container.innerHTML = "";

  for (
    let ratingValue = 1;
    ratingValue <= 5;
    ratingValue += 1
  ) {
    const button =
      document.createElement(
        "button"
      );

    button.type = "button";
    button.textContent = "★";

    button.setAttribute(
      "aria-label",
      ratingValue + "점"
    );

    if (
      ratingValue <=
      selectedRating
    ) {
      button.classList.add(
        "selected"
      );
    }

    button.addEventListener(
      "click",
      function () {
        setRating(
          ratingValue
        );
      }
    );

    container.appendChild(button);
  }

  updateRatingText();
}

/**
 * 선택한 별점을 저장하고 화면을 갱신합니다.
 */
function setRating(value) {
  selectedRating = value;

  makeRatingButtons();
}

/**
 * 선택한 별점 문구를 표시합니다.
 */
function updateRatingText() {
  const ratingText =
    document.getElementById(
      "ratingText"
    );

  ratingText.textContent =
    selectedRating
      ? selectedRating +
        "점 / 5점"
      : "별점을 선택해 주세요.";
}

/**
 * 기존에 작성한 리뷰가 있으면 불러옵니다.
 */
async function loadExistingReview() {
  const status =
    document.getElementById(
      "reviewStatus"
    );

  try {
    const { data, error } =
      await db
        .from("reviews")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .eq(
          "movie_id",
          detailMovie.id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    currentReview = data;

    if (!currentReview) {
      selectedRating = 0;
      aiAssisted = false;

      document.getElementById(
        "reviewTitle"
      ).textContent =
        "이 영화에 대한 나의 기록";

      document.getElementById(
        "deleteBtn"
      ).hidden = true;

      makeRatingButtons();

      return;
    }

    selectedRating =
      Number(
        currentReview.rating
      );

    aiAssisted =
      Boolean(
        currentReview.ai_assisted
      );

    document.getElementById(
      "content"
    ).value =
      currentReview.content || "";

    document.getElementById(
      "reviewTitle"
    ).textContent =
      "나의 리뷰 수정";

    document.getElementById(
      "saveBtn"
    ).textContent =
      "수정 내용 저장";

    document.getElementById(
      "deleteBtn"
    ).hidden = false;

    updateContentLength();
    makeRatingButtons();

    status.textContent =
      "기존에 작성한 리뷰를 불러왔습니다.";
  } catch (error) {
    status.textContent =
      "기존 리뷰를 불러오지 못했습니다: " +
      message(error);
  }
}

/**
 * 페이지 버튼과 입력 이벤트를 연결합니다.
 */
function prepareMoviePageEvents() {
  document.getElementById(
    "reviewLoginButton"
  ).addEventListener(
    "click",
    goToLogin
  );

  document.getElementById(
    "content"
  ).addEventListener(
    "input",
    updateContentLength
  );

  document.getElementById(
    "aiBtn"
  ).addEventListener(
    "click",
    polishReviewWithAI
  );

  document.getElementById(
    "useAiBtn"
  ).addEventListener(
    "click",
    useAIReview
  );

  document.getElementById(
    "closeAiBtn"
  ).addEventListener(
    "click",
    function () {
      document.getElementById(
        "aiBox"
      ).hidden = true;
    }
  );

  document.getElementById(
    "saveBtn"
  ).addEventListener(
    "click",
    saveReview
  );

  document.getElementById(
    "deleteBtn"
  ).addEventListener(
    "click",
    deleteReview
  );
}

/**
 * 로그인 후 현재 영화 상세 페이지로 돌아오도록 합니다.
 */
function goToLogin() {
  sessionStorage.setItem(
    "filmoryReturnPath",
    location.pathname +
      location.search +
      "#reviewSection"
  );

  location.href =
    "/index.html#authBox";
}

/**
 * 리뷰 글자 수를 표시합니다.
 */
function updateContentLength() {
  const content =
    document.getElementById(
      "content"
    );

  document.getElementById(
    "contentLength"
  ).textContent =
    content.value.length +
    " / 3000";
}

/**
 * AI에게 리뷰 문장 다듬기를 요청합니다.
 */
async function polishReviewWithAI() {
  const content =
    document.getElementById(
      "content"
    ).value.trim();

  const button =
    document.getElementById(
      "aiBtn"
    );

  if (content.length < 10) {
    alert(
      "AI로 다듬을 감상을 10자 이상 작성해 주세요."
    );

    return;
  }

  button.disabled = true;
  button.textContent =
    "AI가 다듬는 중...";

  try {
    const result =
      await askAI(
        [
          "다음 영화 감상문을 사용자의 의미와 평가를 바꾸지 말고 자연스러운 한국어 리뷰로 다듬어라.",
          "사용자가 말하지 않은 영화 정보나 새로운 의견을 추가하지 마라.",
          "결과는 리뷰 본문만 출력해라.",
          "",
          "영화: " +
            detailMovie.title,
          "사용자 감상: " +
            content,
        ].join("\n")
      );

    document.getElementById(
      "aiText"
    ).textContent = result;

    document.getElementById(
      "aiBox"
    ).hidden = false;
  } catch (error) {
    alert(
      "AI 리뷰 다듬기 실패: " +
      message(error)
    );
  } finally {
    button.disabled = false;
    button.textContent =
      "AI로 자연스럽게 다듬기";
  }
}

/**
 * AI 결과를 textarea에 적용합니다.
 */
function useAIReview() {
  const result =
    document.getElementById(
      "aiText"
    ).textContent;

  document.getElementById(
    "content"
  ).value = result;

  aiAssisted = true;

  document.getElementById(
    "aiBox"
  ).hidden = true;

  updateContentLength();
}

/**
 * 리뷰를 새로 저장하거나 수정합니다.
 */
async function saveReview() {
  if (
    !currentUser ||
    !detailMovie
  ) {
    return;
  }

  const content =
    document.getElementById(
      "content"
    ).value.trim();

  const button =
    document.getElementById(
      "saveBtn"
    );

  const status =
    document.getElementById(
      "reviewStatus"
    );

  if (!selectedRating) {
    status.textContent =
      "별점을 선택해 주세요.";

    return;
  }

  if (content.length < 5) {
    status.textContent =
      "리뷰를 5자 이상 작성해 주세요.";

    return;
  }

  const payload = {
    user_id: currentUser.id,
    movie_id: detailMovie.id,
    movie_title:
      detailMovie.title,
    poster_path:
      detailMovie.poster_path,
    rating: selectedRating,
    content: content,
    ai_assisted: aiAssisted,
    updated_at:
      new Date().toISOString(),
  };

  button.disabled = true;
  button.textContent = "저장 중...";

  try {
    let result;

    if (currentReview) {
      result =
        await db
          .from("reviews")
          .update(payload)
          .eq(
            "id",
            currentReview.id
          )
          .eq(
            "user_id",
            currentUser.id
          );
    } else {
      result =
        await db
          .from("reviews")
          .insert(payload);
    }

    if (result.error) {
      throw result.error;
    }

    status.textContent =
      currentReview
        ? "리뷰 수정이 완료되었습니다."
        : "리뷰가 저장되었습니다.";

    await loadExistingReview();
  } catch (error) {
    status.textContent =
      "리뷰 저장 실패: " +
      message(error);
  } finally {
    button.disabled = false;

    button.textContent =
      currentReview
        ? "수정 내용 저장"
        : "리뷰 저장";
  }
}

/**
 * 현재 리뷰를 삭제합니다.
 */
async function deleteReview() {
  if (
    !currentReview ||
    !currentUser
  ) {
    return;
  }

  const shouldDelete =
    confirm(
      "이 영화의 리뷰를 삭제할까요?"
    );

  if (!shouldDelete) {
    return;
  }

  const deleteButton =
    document.getElementById(
      "deleteBtn"
    );

  const status =
    document.getElementById(
      "reviewStatus"
    );

  deleteButton.disabled = true;
  deleteButton.textContent =
    "삭제 중...";

  try {
    const { error } =
      await db
        .from("reviews")
        .delete()
        .eq(
          "id",
          currentReview.id
        )
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {
      throw error;
    }

    currentReview = null;
    selectedRating = 0;
    aiAssisted = false;

    document.getElementById(
      "content"
    ).value = "";

    document.getElementById(
      "reviewTitle"
    ).textContent =
      "이 영화에 대한 나의 기록";

    document.getElementById(
      "saveBtn"
    ).textContent =
      "리뷰 저장";

    deleteButton.hidden = true;

    updateContentLength();
    makeRatingButtons();

    status.textContent =
      "리뷰를 삭제했습니다.";
  } catch (error) {
    status.textContent =
      "리뷰 삭제 실패: " +
      message(error);
  } finally {
    deleteButton.disabled = false;
    deleteButton.textContent =
      "리뷰 삭제";
  }
}

/**
 * 영화 상세 정보 오류를 표시합니다.
 */
function showMovieError(errorMessage) {
  const status =
    document.getElementById(
      "movieStatus"
    );

  status.hidden = false;
  status.textContent =
    errorMessage;
}