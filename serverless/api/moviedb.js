import axios from "axios";

// TMDb 한글 장르명 → 코드 매핑
const GENRE_MAP = {
    "공포": 27,
    "코미디": 35,
    "드라마": 18,
    "액션": 28,
    // 필요한 장르 추가
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 프론트에서 검색조건 전달: with_genres, region, language 등
    const { with_genres, region, language, sort_by } = req.query;

    if (!with_genres || !region || !language) {
        return res.status(400).json({ error: "with_genres, region, language 파라미터가 필요합니다." });
    }

    try {
        const response = await axios.get(
            "https://api.themoviedb.org/3/discover/movie",
            {
                params: {
                    with_genres,
                    region,
                    language,
                    sort_by: sort_by || "popularity.desc",
                },
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                },
            }
        );
        res.status(200).json({ results: response.data.results });
    } catch (error) {
        res.status(500).json({ error: "TMDb 요청 에러: " + error.message });
    }
}
