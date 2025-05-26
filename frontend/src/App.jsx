import { useState } from "react";
import axios from "axios";

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    setMovies([]);
    if (!query.trim()) {
      setError("검색어를 입력하세요.");
      return;
    }
    setLoading(true);

    try {
      // 1️⃣ 챗봇 질의
      const chatRes = await axios.post("/api/chat", {
        content: query,
      });

      let chatInfo;
      try {
        chatInfo = JSON.parse(chatRes.data.message);

        // chatInfo가 빈 객체(아무 필드도 없음)일 때만 에러 처리
        if (Object.keys(chatInfo).length === 0) {
          setError("질문을 이해하지 못했습니다. 다시 시도해주세요.");
          setLoading(false);
          return;
        }
      } catch {
        setError("질문을 이해하지 못했습니다. 다시 시도해주세요.");
        setLoading(false);
        return;
      }
      

      // 2️⃣ genre 필드는 moviedb.js로 그대로 넘긴다 (장르ID 매핑 X)
      const tmdbParams = {
        ...chatInfo,           // genre, with_origin_country, release date, 등등
        language: "ko-KR",     // 고정
      };

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
      <h2>영화 추천 챗봇</h2>
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
