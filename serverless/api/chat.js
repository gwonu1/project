import OpenAI from "openai";

export default async function handler(req, res) {
    if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let userQuery = "";
    if (req.method === "GET") {
        userQuery = req.query.content || req.query.query;
    } else if (req.method === "POST") {
        userQuery = req.body.content || req.body.query;
    }

    if (!userQuery) {
        return res.status(400).json({ error: "content 파라미터가 필요합니다." });
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            max_tokens: 150,
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content: `
사용자의 영화 추천 요청을 분석하여 다음 JSON 형식으로 응답하세요.
- primary_release_date.gte: 시작 개봉일 (예: "2020-01-01")
- primary_release_date.lte: 종료 개봉일 (예: "2023-12-31")
- genre: 한국어 장르명 (예: "공포", "코미디" 등)
- with_origin_country: ISO 3166-1 국가 코드 (예: "KR")
- with_original_language: ISO 639-1 언어 코드 (예: "ko")
- vote_average.gte: 최소 평점 (예: 7.0)
- vote_average.lte: 최대 평점 (예: 9.0)

주의사항:
- 응답에는 반드시 위의 필드만 포함하세요.
- genre 값은 반드시 한글 장르명(예: "공포", "로맨스") 중 하나로만 응답하세요.

예시:
{
  "primary_release_date.gte": "2020-01-01",
  "primary_release_date.lte": "2023-12-31",
  "genre": "공포",
  "with_origin_country": "KR",
  "with_original_language": "ko",
  "vote_average.gte": 7.0,
  "vote_average.lte": 9.0
}
`
                },
                { role: "user", content: userQuery },
            ],
        });

        res.status(200).json({ message: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
