import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 필요한 쿼리 파라미터만 추출
    const {
        "primary_release_date.gte": releaseDateGte,
        "primary_release_date.lte": releaseDateLte,
        with_genres,
        with_origin_country,
        with_original_language,
        "vote_average.gte": voteAvgGte,
        "vote_average.lte": voteAvgLte,
        language = "ko-KR",
        page = 1
    } = req.query;

    // 필수 값 체크 (장르, 국가 등)
    if (!with_genres || !with_origin_country) {
        return res.status(400).json({ error: "with_genres, with_origin_country는 필수입니다." });
    }

    try {
        const tmdbRes = await axios.get("https://api.themoviedb.org/3/discover/movie", {
            params: {
                language,
                "primary_release_date.gte": releaseDateGte,
                "primary_release_date.lte": releaseDateLte,
                with_genres,
                with_origin_country,
                with_original_language,
                "vote_average.gte": voteAvgGte,
                "vote_average.lte": voteAvgLte,
                page,
                sort_by: "popularity.desc"
            },
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            },
        });

        res.status(200).json({ results: tmdbRes.data.results });
    } catch (error) {
        res.status(500).json({ error: "TMDb 요청 에러: " + error.message });
    }
}
