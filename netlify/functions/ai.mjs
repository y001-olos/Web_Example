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

  const netlifyApiKey =
    globalThis.Netlify?.env?.get?.(
      "GEMINI_API_KEY"
    );

  const processApiKey =
    typeof process !== "undefined"
      ? process.env?.GEMINI_API_KEY
      : "";

  const apiKey = String(
    netlifyApiKey ||
    processApiKey ||
    ""
  ).trim();

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Netlify에 GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.",
      },
      {
        status: 500,
      }
    );
  }

  let requestBody;

  try {
    requestBody =
      await request.json();
  } catch {
    return Response.json(
      {
        error:
          "요청 데이터가 올바른 JSON 형식이 아닙니다.",
      },
      {
        status: 400,
      }
    );
  }

  const prompt =
    typeof requestBody.prompt ===
    "string"
      ? requestBody.prompt.trim()
      : "";

  if (!prompt) {
    return Response.json(
      {
        error:
          "AI에게 전달할 내용을 입력해 주세요.",
      },
      {
        status: 400,
      }
    );
  }

  if (prompt.length > 12000) {
    return Response.json(
      {
        error:
          "AI 요청 내용이 너무 깁니다.",
      },
      {
        status: 400,
      }
    );
  }

  const modelCandidates = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

  let lastGeminiError = null;

  for (const model of modelCandidates) {
    const endpoint =
      "https://generativelanguage.googleapis.com/" +
      "v1beta/models/" +
      model +
      ":generateContent";

    try {
      const geminiResponse =
        await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey,
          },

          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    "You are Filmory, a careful Korean movie assistant. " +
                    "Respond in Korean unless another language is explicitly requested. " +
                    "Only recommend real released movies. " +
                    "Never invent movie titles. " +
                    "Follow the user's requested output format exactly.",
                },
              ],
            },

            contents: [
              {
                role: "user",

                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],

            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        });

      const data =
        await geminiResponse.json();

      if (!geminiResponse.ok) {
        const errorMessage =
          String(
            data?.error?.message ||
              "Gemini API 요청을 처리하지 못했습니다."
          );

        lastGeminiError = {
          status: geminiResponse.status,
          data,
          errorMessage,
        };

        const isModelUnavailable =
          errorMessage.includes(
            "no longer available to new users"
          ) ||
          errorMessage.includes(
            "not available to new users"
          );

        if (
          geminiResponse.status === 400 &&
          isModelUnavailable
        ) {
          console.warn(
            "Gemini 모델이 사용 불가하여 다른 모델로 재시도합니다:",
            model
          );
          continue;
        }

        console.error(
          "Gemini API 오류:",
          geminiResponse.status,
          data
        );

        let finalErrorMessage =
          errorMessage;

        if (
          geminiResponse.status === 400
        ) {
          finalErrorMessage =
            "Gemini 요청 형식 또는 API 키 설정을 확인해 주세요. " +
            errorMessage;
        }

        if (
          geminiResponse.status === 401 ||
          geminiResponse.status === 403
        ) {
          finalErrorMessage =
            "Gemini API 키가 유효하지 않거나 사용 권한이 없습니다. " +
            "Netlify의 GEMINI_API_KEY 값을 확인해 주세요.";
        }

        if (
          geminiResponse.status === 429
        ) {
          finalErrorMessage =
            "Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
        }

        return Response.json(
          {
            error: finalErrorMessage,
          },
          {
            status:
              geminiResponse.status,
          }
        );
      }

      const candidate =
        data.candidates?.[0];

      const text =
        candidate?.content?.parts
          ?.map(function (part) {
            return part.text || "";
          })
          .join("")
          .trim();

      if (!text) {
        const blockReason =
          data.promptFeedback
            ?.blockReason;

        const finishReason =
          candidate?.finishReason;

        console.error(
          "Gemini 응답에 텍스트 없음:",
          data
        );

        return Response.json(
          {
            error:
              blockReason
                ? "Gemini가 요청을 차단했습니다: " +
                  blockReason
                : finishReason
                  ? "Gemini가 응답 생성을 완료하지 못했습니다: " +
                    finishReason
                  : "Gemini 응답에서 결과를 찾지 못했습니다.",
          },
          {
            status: 502,
          }
        );
      }

      return Response.json({
        text: text,
      });
    } catch (error) {
      console.error(
        "Gemini 요청 실패:",
        error
      );

      lastGeminiError = {
        error: error,
      };
      break;
    }
  }

  if (lastGeminiError?.status) {
    return Response.json(
      {
        error:
          lastGeminiError.errorMessage ||
          "Gemini API 요청을 처리하지 못했습니다.",
      },
      {
        status: lastGeminiError.status,
      }
    );
  }

  return Response.json(
    {
      error:
        "AI 서버 처리 중 오류가 발생했습니다.",
    },
    {
      status: 500,
    }
  );
}

export const config = {
  path: "/api/ai",
};