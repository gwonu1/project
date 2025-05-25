import axios from 'axios';

export default async function handler(req, res) {
    // GET 요청만 허용
    if (req.method != "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { query } = req.query;
    const apiKey = process.env.TMDB_API_KEY;
    
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { query },
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "에러 발생" });
    }
}