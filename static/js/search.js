function onAuthReady() {
  const searchForm =
    document.getElementById(
      "searchForm"
    );

  const searchInput =
    document.getElementById(
      "query"
    );

  const status =
    document.getElementById(
      "status"
    );

  const results =
    document.getElementById(
      "results"
    );

  if (
    !searchForm ||
    !searchInput ||
    !status ||
    !results
  ) {
    console.error(
      "영화 검색 화면 요소를 찾을 수 없습니다."
    );

    return;
  }

  searchForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const query =
        searchInput.value.trim();

      if (!query) {
        status.textContent =
          "검색할 영화 제목을 입력해 주세요.";

        searchInput.focus();

        return;
      }

      await searchMovies(query);
    }
  );

  const initialQuery =
    new URLSearchParams(
      location.search
    ).get("q");

  if (initialQuery) {
    searchInput.value =
      initialQuery;

    searchMovies(initialQuery);
  }
}

async function searchMovies(query) {
  const status =
    document.getElementById(
      "status"
    );

  const results =
    document.getElementById(
      "results"
    );

  status.textContent =
    "영화를 찾는 중입니다...";

  results.replaceChildren();

  try {
    const data =
      await movieAPI({
        action: "search",
        query: query,
      });

    const movies =
      data.results || [];

    if (!movies.length) {
      status.textContent =
        "검색 결과가 없습니다.";

      return;
    }

    status.textContent =
      movies.length +
      "개의 결과를 찾았습니다.";

    movies.forEach(function (movie) {
      const card =
        createMovieCardElement(
          movie
        );

      results.appendChild(card);
    });
  } catch (error) {
    console.error(
      "영화 검색 실패:",
      error
    );

    status.textContent =
      message(error);
  }
}

/**
 * 클릭 가능한 영화 카드 요소를 생성합니다.
 */
function createMovieCardElement(movie) {
  const cardData =
    movieCard(movie);

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
    encodeURIComponent(
      cardData.movieId
    );

  link.setAttribute(
    "aria-label",
    cardData.movieTitle +
      " 상세 정보 보기"
  );

  const image =
    document.createElement("img");

  image.src =
    cardData.posterURL;

  image.alt =
    cardData.movieTitle +
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
    cardData.releaseYear +
    " · ★ " +
    cardData.rating;

  const title =
    document.createElement("h2");

  title.textContent =
    cardData.movieTitle;

  const description =
    document.createElement("p");

  if (cardData.hasReason) {
    description.className =
      "reason";
  }

  description.textContent =
    cardData.description;

  const action =
    document.createElement("span");

  action.className =
    "card-link";

  action.textContent =
    "상세 정보 보기 →";

  body.append(
    meta,
    title,
    description,
    action
  );

  link.append(
    image,
    body
  );

  article.appendChild(link);

  return article;
}