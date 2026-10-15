let searchPageInitialized = false;

function onAuthReady() {
  if (searchPageInitialized) {
    return;
  }

  searchPageInitialized = true;

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
    function (event) {
      event.preventDefault();

      const query =
        searchInput.value.trim();

      if (!query) {
        status.textContent =
          "검색할 영화 제목을 입력해 주세요.";

        searchInput.focus();
        return;
      }

      searchMovies(query);
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

function createMovieCardElement(movie) {
  const movieId =
    Number(movie.id);

  const movieTitle =
    movie.title ||
    "제목 정보 없음";

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
    encodeURIComponent(movieId);

  link.setAttribute(
    "aria-label",
    movieTitle +
      " 상세 정보 보기"
  );

  const image =
    document.createElement("img");

  image.src =
    poster(movie.poster_path);

  image.alt =
    movieTitle + " 포스터";

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
    movieTitle;

  const description =
    document.createElement("p");

  description.textContent =
    movie.overview ||
    "줄거리 정보가 없습니다.";

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