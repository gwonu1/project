import { useState } from "react";
import axios from "axios";

const GENRE_MAP = {
  "공포": 27,
  "코미디": 35,
  "드라마": 18,
  "액션": 28,
  // 필요한 장르 확장
};

export default function App() {
  const [query, setQuery] = useState("");
  const [chatbotResp, setChatbotResp] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setMovies([]);
    setChatbotResp("");

    try {
      // 1️⃣ OpenAI 챗봇에 자연어 질문 전송
      const chatRes = await axios.post("/api/chat", {
        role: "user",
        content: query,
      });

      // 2️⃣ 응답에서 검색 조건(JSON) 추출
      let searchInfo;
      try {
        searchInfo = JSON.parse(chatRes.data.message);
      } catch (err) {
        setError("챗봇 응답 파싱 실패: " + chatRes.data.message);
        setLoading(false);
        return;
      }
      setChatbotResp(chatRes.data.message);

      // 3️⃣ TMDb API에 검색조건으로 질의
      const { country, genre } = searchInfo;
      const genreCode = GENRE_MAP[genre];
      if (!country || !genreCode) {
        setError("국가 또는 장르 정보가 없습니다.");
        setLoading(false);
        return;
      }

      const movieRes = await axios.get("/api/moviedb", {
        params: {
          with_genres: genreCode,
          region: country,
          language: "ko-KR",
          sort_by: "popularity.desc",
        },
      });

      setMovies(movieRes.data.results);
      if (!movieRes.data.results.length) setError("영화 검색 결과가 없습니다.");

    } catch (err) {
      setError("에러 발생: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="영화 관련 질문을 입력하세요"
        style={{ width: "300px", marginRight: "10px" }}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? "검색 중..." : "검색"}
      </button>
      {chatbotResp && (
        <div style={{ margin: "10px 0", color: "#1976d2" }}>
          <b>챗봇 분석:</b> {chatbotResp}
        </div>
      )}
      {error && (
        <div style={{ color: "red", margin: "10px 0" }}>{error}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {movies.map(movie => (
          <div key={movie.id} style={{ width: "180px" }}>
            <img
              src={
                movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/w300${movie.backdrop_path}`
                  : ""
              }
              alt={movie.title}
              style={{ width: "100%", borderRadius: "8px", background: "#eee" }}
              onError={e => (e.target.style.display = "none")}
            />
            <h4 style={{ fontSize: "1em" }}>{movie.title || movie.original_title}</h4>
            <div style={{ fontSize: "0.9em", color: "#555" }}>{movie.release_date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
