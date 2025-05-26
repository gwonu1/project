import OpenAI from "openai";

export default async function handler(req, res) {
    if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // GET이면 쿼리스트링, POST면 바디에서 content 추출
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
            max_tokens: 200,
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content: `
사용자의 영화 추천 질문을 분석하여 아래의 JSON 형식으로만 응답해.

- genre: 한글 장르명(여러 개면 쉼표로 구분, 예: "공포,코미디")
- primary_release_date.gte: 시작 개봉일 (YYYY-MM-DD, 선택)
- primary_release_date.lte: 종료 개봉일 (YYYY-MM-DD, 선택)
- with_origin_country: ISO 3166-1 국가 코드 (예: "KR", 선택)
- with_original_language: ISO 639-1 언어 코드 (예: "ko", 선택)
- vote_average.gte: 최소 평점 (예: 7.0, 선택)
- vote_average.lte: 최대 평점 (예: 9.0, 선택)

주의사항:
- genre, primary_release_date.gte, primary_release_date.lte, with_origin_country, with_original_language, vote_average.gte, vote_average.lte 이외에는 응답에 포함하지 마.
- 값이 없으면 그 필드는 생략해. 모든 필드가 비어있으면 빈 객체를 반환해.
- JSON만 반환하고, 다른 텍스트는 포함하지 마.

예시:
{
  "genre": "공포,코미디",
  "primary_release_date.gte": "2022-01-01",
  "primary_release_date.lte": "2023-12-31",
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

        // JSON만 잘라서 반환
        const answer = response.choices[0].message.content.trim();
        // (파싱 성공 여부는 프론트에서 추가로 체크 가능)
        res.status(200).json({ message: answer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
