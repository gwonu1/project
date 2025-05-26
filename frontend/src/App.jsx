import { useState } from "react";
import axios from "axios";

// 한글 장르명 → TMDb 장르ID 매핑 테이블
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

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [chatJson, setChatJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatText, setChatText] = useState(""); // 챗봇 응답 원문
  const [error, setError] = useState("");

  // 검색(챗봇→TMDb) 전체 처리
  const handleSearch = async () => {
    setError("");
    setMovies([]);
    setChatJson(null);
    setChatText("");
    if (!query.trim()) {
      setError("검색어를 입력하세요.");
      return;
    }
    setLoading(true);

    try {
      // 1️⃣ OpenAI API(챗봇)에 자연어 질의
      const chatRes = await axios.post("/api/chat", {
        content: query,
      });

      setChatText(chatRes.data.message);

      // 2️⃣ OpenAI 응답(JSON 파싱)
      let chatInfo;
      try {
        chatInfo = JSON.parse(chatRes.data.message);
        setChatJson(chatInfo);
      } catch {
        setError("챗봇 답변 파싱 실패: " + chatRes.data.message);
        setLoading(false);
        return;
      }

      // 3️⃣ 장르ID 매핑
      const genreId = GENRE_MAP[chatInfo.genre];
      if (chatInfo.genre && !genreId) {
        setError(`알 수 없는 장르: ${chatInfo.genre}`);
        setLoading(false);
        return;
      }

      // 4️⃣ TMDb API에 실제 영화목록 요청
      const tmdbParams = {
        language: "ko-KR", // 고정
        "primary_release_date.gte": chatInfo["primary_release_date.gte"],
        "primary_release_date.lte": chatInfo["primary_release_date.lte"],
        with_genres: genreId,
        with_origin_country: chatInfo.with_origin_country,
        with_original_language: chatInfo.with_original_language,
        "vote_average.gte": chatInfo["vote_average.gte"],
        "vote_average.lte": chatInfo["vote_average.lte"],
      };

      // 빈 값 필터링
      Object.keys(tmdbParams).forEach(
        key => (tmdbParams[key] === undefined || tmdbParams[key] === "" || tmdbParams[key] === null) && delete tmdbParams[key]
      );

      const movieRes = await axios.get("/api/moviedb", { params: tmdbParams });

      setMovies(movieRes.data.results || []);
      if (!movieRes.data.results || !movieRes.data.results.length) {
        setError("조건에 맞는 영화를 찾지 못했습니다.");
      }
    } catch (err) {
      setError("에러 발생: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 16 }}>
      <h2>영화 추천 챗봇 (OpenAI + TMDb)</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, fontSize: 16, padding: 8 }}
          placeholder="영화 추천을 자연어로 물어보세요 (예: 최근 개봉한 한국 공포 영화 추천)"
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          disabled={loading}
        />
        <button onClick={handleSearch} disabled={loading} style={{ fontSize: 16, padding: "8px 24px" }}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>
      {chatText && (
        <div style={{ margin: "14px 0", padding: 10, background: "#f8f8f8", borderRadius: 8, fontSize: 15 }}>
          <b>챗봇 조건(JSON):</b>
          <pre style={{ margin: 0, fontSize: 14 }}>{chatText}</pre>
        </div>
      )}
      {error && <div style={{ color: "red", margin: "10px 0" }}>{error}</div>}

      {/* 영화 결과 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 24 }}>
        {movies.map(movie => (
          <div key={movie.id} style={{ width: 180, border: "1px solid #eee", borderRadius: 12, boxShadow: "0 1px 8px #eee" }}>
            <img
              src={
                movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/w300${movie.backdrop_path}`
                  : ""
              }
              alt={movie.title}
              style={{ width: "100%", height: 120, objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12, background: "#eee" }}
              onError={e => (e.target.style.display = "none")}
            />
            <div style={{ padding: "10px" }}>
              <h4 style={{ margin: "5px 0" }}>{movie.title || movie.original_title}</h4>
              <div style={{ color: "#777", fontSize: 13 }}>{movie.release_date}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{movie.overview ? movie.overview.slice(0, 70) + "..." : ""}</div>
              <div style={{ color: "#009688", fontWeight: 600, fontSize: 14, marginTop: 6 }}>
                평점: {movie.vote_average}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
