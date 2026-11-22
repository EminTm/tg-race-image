import http from "node:http";
import { renderRacePng } from "./renderer.js";

const PORT = process.env.PORT || 3000;

const SAMPLE_DATA = {
  eventTitle: "ترکیه — پیست استانبول",
  roundNumber: 7,
  time: "21:00",
  title: "Maiden — ۲ ساله‌ها",
  distance: "1400 متر سنتتیک",
  brand: "کانال تخصصی اسبدوانی",
  horses: [
    { number: "1", gate: "8", name: "AKALA", jockey: "G.ÖZÇELİK", owner: "H.TURGUT ALAKUŞ", trainer: "T.ŞİT", agf: "%4(5)" },
    { number: "4", gate: "7", name: "JUNIOR ALAATTİN", jockey: "B.KARAGÖZ", owner: "ALAATTİN KARACA", trainer: "C.GÜNEŞ", agf: "%31(2)" },
    { number: "9", gate: "6", name: "LET IT BURN", jockey: "A.SÖZEN", owner: "ADİL MERT KAYA", trainer: "T.TAŞAR", agf: "%42(1)" },
    { number: "3", gate: "1", name: "کادیلاک کلاته", jockey: "سهراب دهش", owner: "مهدی برومند", trainer: "عبدالباسط مخدومی", agf: "%18(3)" }
  ]
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET") {
      if (url.searchParams.get("sample") === "1") {
        const png = await renderRacePng(SAMPLE_DATA);
        res.writeHead(200, { "Content-Type": "image/png" });
        return res.end(png);
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ ok: true, service: "Race Card Image Renderer (Render)" }));
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }
    const expectedSecret = process.env.RENDER_SECRET;
    if (expectedSecret && req.headers["x-render-secret"] !== expectedSecret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const png = await renderRacePng(body);
    res.writeHead(200, { "Content-Type": "image/png" });
    return res.end(png);
  } catch (err) {
    console.error("Render error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: err.message || "Render failed" }));
  }
});

server.listen(PORT, () => console.log(`Renderer listening on port ${PORT}`));
