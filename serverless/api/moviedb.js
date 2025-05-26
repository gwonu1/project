import axios from "axios";

// 한글 장르명 → TMDb 장르ID 매핑
const GENRE_MAP = {
    "SF": 878,
    "TV 영화": 10770,
    "가족": 10751,
    "공포": 27,
    "다큐멘터리": 99,
    "드라마": 18,
    "로맨스": 10749,
    "모험": 12,
    "미스터리": 9648,
    "범죄": 80,
    "서부": 37,
    "스릴러": 53,
    "애니메이션": 16,
    "액션": 28,
    "역사": 36,
    "음악": 10402,
    "전쟁": 10752,
    "코미디": 35,
    "판타지": 14,
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 여러 장르를 콤마(,)로 분리하여 장르ID 문자열로 변환
    let { genre, ...rest } = req.query;
    if (!genre) {
        return res.status(400).json({ error: "최소한 하나 이상의 장르(genre) 파라미터가 필요합니다." });
    }

    // genre 파라미터(예: "공포,코미디") → "27,35"
    const genreIds = genre
        .split(",")
        .map(g => GENRE_MAP[g.trim()])
        .filter(Boolean)
        .join(",");
    if (!genreIds) {
        return res.status(400).json({ error: "유효한 장르가 없습니다." });
    }

    // TMDb 파라미터 조합 (있으면 추가)
    const params = {
        with_genres: genreIds,
        language: "ko-KR", // 고정
        sort_by: "popularity.desc",
    };

    // 지정된 다른 파라미터만 추가 (값이 있으면 추가)
    const tmdbFields = [
        "primary_release_date.gte",
        "primary_release_date.lte",
        "with_origin_country",
        "with_original_language",
        "vote_average.gte",
        "vote_average.lte",
        "page"
    ];

    tmdbFields.forEach(field => {
        if (rest[field]) params[field] = rest[field];
    });

    try {
        const tmdbRes = await axios.get("https://api.themoviedb.org/3/discover/movie", {
            params,
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            },
        });

        res.status(200).json({ results: tmdbRes.data.results });
    } catch (error) {
        res.status(500).json({ error: "TMDb 요청 에러: " + error.message });
    }
}
