let recommendPageInitialized = false;

function onAuthReady() {
  if (recommendPageInitialized) {
    return;
  }

  recommendPageInitialized = true;

  const promptInput =
    document.querySelector(
      "#prompt"
    );

  const recommendButton =
    document.querySelector(
      "#recommendBtn"
    );

  const status =
    document.querySelector(
      "#status"
    );

  const results =
    document.querySelector(
      "#results"
    );

  if (
    !promptInput ||
    !recommendButton ||
    !status ||
    !results
  ) {
    console.error(
      "AI 추천 화면의 필수 요소를 찾을 수 없습니다."
    );

    return;
  }

  document
    .querySelectorAll(
      "[data-chip]"
    )
    .forEach(function (chip) {
      chip.addEventListener(
        "click",
        function () {
          const chipText =
            chip.dataset.chip ||
            chip.textContent.trim();

          promptInput.value +=
            promptInput.value
              ? ", " + chipText
              : chipText;

          promptInput.focus();
        }
      );
    });

  recommendButton.addEventListener(
    "click",
    recommendMovies
  );
}

async function recommendMovies() {
  const promptInput =
    document.querySelector(
      "#prompt"
    );

  const recommendButton =
    document.querySelector(
      "#recommendBtn"
    );

  const status =
    document.querySelector(
      "#status"
    );

  const results =
    document.querySelector(
      "#results"
    );

  const preference =
    promptInput.value.trim();

  if (!preference) {
    alert(
      "원하는 영화의 특징을 입력해 주세요."
    );

    promptInput.focus();
    return;
  }

  recommendButton.disabled = true;

  recommendButton.textContent =
    "AI가 영화를 고르는 중...";

  status.textContent =
    "Gemini가 취향을 분석하고 실제 영화를 확인하고 있습니다...";

  results.replaceChildren();

  try {
    const prompt = [
      "다음 사용자의 취향에 맞는 실제로 개봉한 영화 5편을 추천해라.",
      "존재하지 않는 영화는 절대 만들지 마라.",
      "한국에서 검색 가능한 널리 알려진 한국어 제목 또는 원제를 사용해라.",
      "각 영화마다 개봉 연도와 구체적인 한국어 추천 이유를 작성해라.",
      "",
      "반드시 다른 설명 없이 JSON 배열만 출력해라.",
      "마크다운 코드 블록을 사용하지 마라.",
      "",
      "정확한 출력 형식:",
      '[',
      '  {',
      '    "title": "정확한 영화 제목",',
      '    "year": 2020,',
      '    "reason": "이 영화를 추천하는 구체적인 한국어 이유"',
      '  }',
      ']',
      "",
      "사용자 취향:",
      preference,
    ].join("\n");

    const text =
      await askAI(prompt);

    const recommendations =
      parseRecommendationJSON(
        text
      );

    if (
      !Array.isArray(
        recommendations
      ) ||
      !recommendations.length
    ) {
      throw new Error(
        "AI 추천 결과가 비어 있습니다."
      );
    }

    const verifiedMovies = [];

    for (
      const item of
      recommendations.slice(0, 5)
    ) {
      if (
        !item ||
        typeof item.title !==
          "string" ||
        !item.title.trim()
      ) {
        continue;
      }

      try {
        const searchResult =
          await movieAPI({
            action: "search",
            query:
              item.title.trim(),
            year:
              item.year || "",
          });

        const movie =
          findBestMovieMatch(
            searchResult.results || [],
            item
          );

        if (movie) {
          verifiedMovies.push({
            movie: movie,
            reason:
              item.reason ||
              "입력한 취향과 잘 어울리는 작품입니다.",
          });
        }
      } catch (error) {
        console.warn(
          "추천 영화 검증 실패:",
          item.title,
          error
        );
      }
    }

    if (!verifiedMovies.length) {
      status.textContent =
        "추천 결과를 실제 영화 정보와 연결하지 못했습니다. 표현을 바꿔 다시 시도해 주세요.";

      return;
    }

    verifiedMovies.forEach(
      function ({
        movie,
        reason,
      }) {
        results.appendChild(
          createRecommendationCard(
            movie,
            reason
          )
        );
      }
    );

    status.textContent =
      verifiedMovies.length +
      "편의 영화를 추천합니다.";
  } catch (error) {
    console.error(
      "AI 추천 실패:",
      error
    );

    status.textContent =
      "추천 처리 실패: " +
      message(error);
  } finally {
    recommendButton.disabled = false;

    recommendButton.textContent =
      "AI 추천받기";
  }
}

function parseRecommendationJSON(
  text
) {
  const cleanedText =
    String(text || "")
      .replace(
        /^```(?:json)?/i,
        ""
      )
      .replace(
        /```$/i,
        ""
      )
      .trim();

  const arrayStart =
    cleanedText.indexOf("[");

  const arrayEnd =
    cleanedText.lastIndexOf("]");

  if (
    arrayStart === -1 ||
    arrayEnd === -1 ||
    arrayEnd <= arrayStart
  ) {
    throw new Error(
      "AI 추천 결과를 해석하지 못했습니다. 다시 시도해 주세요."
    );
  }

  const jsonText =
    cleanedText.slice(
      arrayStart,
      arrayEnd + 1
    );

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(
      "Gemini JSON 원문:",
      text
    );

    throw new Error(
      "AI 추천 결과가 올바른 JSON 형식이 아닙니다. 다시 시도해 주세요."
    );
  }
}

function findBestMovieMatch(
  movies,
  recommendation
) {
  if (!movies.length) {
    return null;
  }

  const requestedYear =
    String(
      recommendation.year || ""
    );

  if (requestedYear) {
    const sameYearMovie =
      movies.find(
        function (movie) {
          return (
            year(
              movie.release_date
            ) === requestedYear
          );
        }
      );

    if (sameYearMovie) {
      return sameYearMovie;
    }
  }

  return movies[0];
}

function createRecommendationCard(
  movie,
  reason
) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "movie-card";

  const link =
    document.createElement("a");

  link.className =
    "movie-card-clickable";

  link.href =
    "/pages/movie.html?movieId=" +
    encodeURIComponent(movie.id);

  link.setAttribute(
    "aria-label",
    (movie.title || "영화") +
      " 상세 정보 보기"
  );

  const image =
    document.createElement("img");

  image.src =
    poster(movie.poster_path);

  image.alt =
    (movie.title || "영화") +
    " 포스터";

  image.loading = "lazy";

  const body =
    document.createElement("div");

  body.className =
    "movie-body";

  const meta =
    document.createElement("span");

  meta.className =
    "movie-meta";

  meta.textContent =
    year(movie.release_date) +
    " · ★ " +
    Number(
      movie.vote_average || 0
    ).toFixed(1);

  const title =
    document.createElement("h2");

  title.textContent =
    movie.title ||
    "제목 정보 없음";

  const reasonElement =
    document.createElement("p");

  reasonElement.className =
    "reason";

  reasonElement.textContent =
    reason;

  const action =
    document.createElement("span");

  action.className =
    "card-link";

  action.textContent =
    "상세 정보 보기 →";

  body.append(
    meta,
    title,
    reasonElement,
    action
  );

  link.append(
    image,
    body
  );

  article.appendChild(link);

  return article;
}