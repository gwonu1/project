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

    const {
        genre, // "공포,코미디" 등
        ...rest
    } = req.query;

    let genreIds = "";
    if (genre) {
        genreIds = genre
            .split(",")
            .map(g => GENRE_MAP[g.trim()])
            .filter(Boolean)
            .join(",");
        if (!genreIds) {
            return res.status(400).json({ error: "유효한 장르가 없습니다." });
        }
    }

    // TMDb 파라미터 조합 (있는 것만 추가)
    const params = {
        ...(genreIds && { with_genres: genreIds }),
        ...rest,
        language: "ko-KR",
        sort_by: "popularity.desc",
    };

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
