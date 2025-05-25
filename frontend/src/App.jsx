import { useState } from "react";
import axios from "axios";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");

  const btnHandler = async () => {
    try {
      const response = await axios.get("/api/moviedb", {
        params: {
          query
        },
      })
      setMovies(response.data.results);
      console.log("영화 검색 결과:", response.data.results);
    } catch (error) {
      console.error("에러 발생:", error);
    }
  }
  return (
    <div>
      <input onChange={(e) => setQuery(e.target.value)} />
      <button onClick={btnHandler}>검색</button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {movies.map((movie) => (
          <div key={movie.id} style={{ width: "200px" }}>
            <img
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <h4>{movie.original_title}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}