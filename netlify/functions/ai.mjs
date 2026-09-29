export default async function handler(request) {
  if (request.method !== "POST") {
    return Response.json(
      {
        error: "POST 요청만 허용됩니다.",
      },
      {
        status: 405,
      }
    );
  }

  const apiKey = Netlify.env.get("GROQ_API_TEST");

  if (!apiKey) {
    return Response.json(
      {
        error: "GROQ_API_TEST 환경 변수가 설정되지 않았습니다.",
      },
      {
        status: 500,
      }
    );
  }

  let requestBody;

  try {
    requestBody = await request.json();
  } catch {
    return Response.json(
      {
        error: "요청 본문이 올바른 JSON 형식이 아닙니다.",
      },
      {
        status: 400,
      }
    );
  }

  const prompt =
    typeof requestBody.prompt === "string"
      ? requestBody.prompt.trim()
      : "";

  if (!prompt) {
    return Response.json(
      {
        error: "AI에게 전달할 내용을 입력해 주세요.",
      },
      {
        status: 400,
      }
    );
  }

  if (prompt.length > 12000) {
    return Response.json(
      {
        error: "AI 요청 내용이 너무 깁니다.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,

          messages: [
            {
              role: "system",
              content:
                "You are Filmory, a careful Korean movie assistant. " +
                "Follow the requested output format exactly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return Response.json(
        {
          error:
            data.error?.message ||
            "Groq API 요청을 처리하지 못했습니다.",
        },
        {
          status: groqResponse.status,
        }
      );
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return Response.json(
        {
          error: "Groq API 응답에서 결과를 찾지 못했습니다.",
        },
        {
          status: 502,
        }
      );
    }

    return Response.json({
      text: text.trim(),
    });
  } catch (error) {
    console.error("Groq 요청 실패:", error);

    return Response.json(
      {
        error: "AI 서버 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

export const config = {
  path: "/api/ai",
};