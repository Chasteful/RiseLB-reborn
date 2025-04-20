// index.js
import express from "express";
import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 5000; // 你前端 WebUI 记得连这个端口

const wss = new WebSocketServer({ port: 5001 }); // WebSocket服务

const songId = process.env.SONG_ID || "33894312"; // 默认歌曲（后续可动态）

async function getSongData(id) {
    const [detailRes, lyricRes] = await Promise.all([
        fetch(`http://localhost:3000/song/detail?ids=${id}`),
        fetch(`http://localhost:3000/lyric?id=${id}`)
    ]);

    const detail = await detailRes.json();
    const lyric = await lyricRes.json();

    return {
        id,
        name: detail.songs[0].name,
        artist: detail.songs[0].ar.map(a => a.name).join(", "),
        album: detail.songs[0].al.name,
        pic: detail.songs[0].al.picUrl,
        lyrics: lyric.lrc?.lyric || "",
        translated: lyric.tlyric?.lyric || ""
    };
}

// 每隔5秒拉一次数据并广播
setInterval(async () => {
    const song = await getSongData(songId);
    const message = JSON.stringify({ type: "lyricUpdate", data: song });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });

    console.log(`[ws] Broadcasted lyrics for: ${song.name}`);
}, 5000);

app.listen(port, () => {
    console.log(`[api] HTTP server running on http://localhost:${port}`);
});
