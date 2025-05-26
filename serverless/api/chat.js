import OpenAI from "openai";

export default async function handler(req, res) {
    // POST, GET 둘 다 허용
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
            max_tokens: 50,
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content:
                        '사용자의 영화 추천 질문을 보고, country(ISO 2글자)와 genre(한글 장르명)를 반드시 JSON 형태로만 출력해줘. 예: {"country":"KR","genre":"공포"}',
                },
                { role: "user", content: userQuery },
            ],
        });
        res.status(200).json({ message: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
