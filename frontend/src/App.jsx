import { useState, useEffect } from "react";
import axios from "axios";

const FAVORITE_KEY = "favoriteMovies";

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

  // 최초 렌더링 시 localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]"));
  }, []);

  // 즐겨찾기 추가/삭제 함수
  const toggleFavorite = (movie) => {
    let fav = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]");
    const exist = fav.find(m => m.id === movie.id);
    if (exist) {
      fav = fav.filter(m => m.id !== movie.id); // 이미 있으면 삭제
    } else {
      fav = [movie, ...fav].slice(0, 10); // 최대 10개까지
    }
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(fav));
    setFavorites(fav);
  };

  const isFavorite = (movieId) => favorites.some(m => m.id === movieId);

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

      const tmdbParams = {
        ...chatInfo,           // genre, with_origin_country, release date, 등등
        language: "ko-KR",
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
    <div style={{ maxWidth: 1100, margin: "30px auto", padding: 16, display: "flex" }}>
      {/* 메인 컨텐츠 */}
      <div style={{ flex: 1, marginRight: 40 }}>
        <h2>영화 추천 챗봇</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, fontSize: 16, padding: 8 }}
            placeholder="어떤 영화를 추천 받고 싶으세요? 😁 (예: 한국 공포 영화를 추천해줘)"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            disabled={loading}
          />
          <button onClick={handleSearch} disabled={loading} style={{ fontSize: 16, padding: "8px 24px" }}>
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
        {error && <div style={{ color: "red", margin: "10px 0" }}>{error}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 24 }}>
          {movies.map(movie => (
            <div key={movie.id} style={{ width: 180, border: "1px solid #eee", borderRadius: 12, boxShadow: "0 1px 8px #eee", position: "relative" }}>
              <button
                onClick={() => toggleFavorite(movie)}
                style={{
                  position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", fontSize: 22,
                  color: isFavorite(movie.id) ? "#ff9800" : "#bbb"
                }}
                title={isFavorite(movie.id) ? "찜 해제" : "찜 추가"}
              >
                ★
              </button>
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

      {/* 즐겨찾기(찜) 영화 리스트 */}
      <div style={{
        width: 220,
        minHeight: 150,
        background: "#f8f8f8",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 2px 12px #eee",
        height: "fit-content"
      }}>
        <h3 style={{ fontSize: 18, marginBottom: 10 }}>내가 찜한 영화</h3>
        {favorites.length === 0 && (
          <div style={{ color: "#aaa" }}>아직 찜한 영화가 없습니다.</div>
        )}
        <ol style={{ paddingLeft: 18 }}>
          {favorites.slice(0, 10).map(m => (
            <li key={m.id} style={{ marginBottom: 7, fontSize: 15 }}>
              <span
                style={{
                  display: "inline-block",
                  maxWidth: 150,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                title={m.title || m.original_title}
              >
                {m.title || m.original_title}
              </span>
              <button
                onClick={() => toggleFavorite(m)}
                style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "#e57373", fontSize: 15 }}
                title="찜 해제"
              >✕</button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
