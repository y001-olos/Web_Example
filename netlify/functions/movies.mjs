export default async function handler(request) {
  if (request.method !== "GET") {
    return Response.json(
      {
        error: "GET 요청만 허용됩니다.",
      },
      {
        status: 405,
      }
    );
  }

  const token = Netlify.env.get("TMDB_ACCESS_TOKEN");

  if (!token) {
    return Response.json(
      {
        error: "TMDB_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.",
      },
      {
        status: 500,
      }
    );
  }

  const requestURL = new URL(request.url);

  const action = requestURL.searchParams.get("action");
  const query = requestURL.searchParams.get("query");
  const id = requestURL.searchParams.get("id");
  const year = requestURL.searchParams.get("year");

  let tmdbURL;

  if (action === "search") {
    if (!query || query.trim().length > 100) {
      return Response.json(
        {
          error: "검색어를 확인해 주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const searchParams = new URLSearchParams({
      query: query.trim(),
      language: "ko-KR",
      include_adult: "false",
      page: "1",
    });

    if (year && /^\d{4}$/.test(year)) {
      searchParams.set("year", year);
    }

    tmdbURL =
      "https://api.themoviedb.org/3/search/movie?" +
      searchParams.toString();
  } else if (action === "detail") {
    if (!id || !/^\d+$/.test(id)) {
      return Response.json(
        {
          error: "영화 ID가 올바르지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    tmdbURL =
      `https://api.themoviedb.org/3/movie/${id}` +
      "?language=ko-KR&append_to_response=credits,videos";
  } else {
    return Response.json(
      {
        error: "지원하지 않는 영화 API 요청입니다.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const tmdbResponse = await fetch(tmdbURL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await tmdbResponse.json();

    if (!tmdbResponse.ok) {
      return Response.json(
        {
          error:
            data.status_message ||
            "TMDB API 요청을 처리하지 못했습니다.",
        },
        {
          status: tmdbResponse.status,
        }
      );
    }

    if (action === "search") {
      data.results = (data.results || []).slice(0, 12);
    }

    return Response.json(data);
  } catch (error) {
    console.error("TMDB 요청 실패:", error);

    return Response.json(
      {
        error: "영화 정보 서버 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

export const config = {
  path: "/api/movies",
};