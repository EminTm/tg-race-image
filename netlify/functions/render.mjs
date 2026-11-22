import { renderRacePng } from "../../renderer.js";

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

export default async (request) => {
  try {
    const url = new URL(request.url);
    if (request.method === "GET") {
      if (url.searchParams.get("sample") === "1") {
        const png = await renderRacePng(SAMPLE_DATA);
        return new Response(png, { status: 200, headers: { "Content-Type": "image/png" } });
      }
      return Response.json({ ok: true, service: "Race Card Image Renderer (Netlify)" });
    }
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const expectedSecret = process.env.RENDER_SECRET;
    if (expectedSecret && request.headers.get("x-render-secret") !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const png = await renderRacePng(body || {});
    return new Response(png, { status: 200, headers: { "Content-Type": "image/png" } });
  } catch (err) {
    console.error("Render error:", err);
    return Response.json({ error: err.message || "Render failed" }, { status: 500 });
  }
};
