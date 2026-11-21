import { Column, Font, Row, Text, sone } from "sone";

let fontsLoaded = false;

async function ensureFonts() {
  if (fontsLoaded && Font.has("Vazirmatn") && Font.has("VazirmatnBold")) return;
  const regUrl = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf";
  const boldUrl = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf";

  const [regRes, boldRes] = await Promise.all([fetch(regUrl), fetch(boldUrl)]);
  if (!regRes.ok || !boldRes.ok) {
    throw new Error("Font download failed");
  }
  const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);

  if (!Font.has("Vazirmatn")) await Font.load("Vazirmatn", regBuf);
  if (!Font.has("VazirmatnBold")) await Font.load("VazirmatnBold", boldBuf);
  fontsLoaded = true;
}

function clip(val, max = 32) {
  const s = String(val || "—").trim() || "—";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function makeCell(content, width, options = {}) {
  const {
    align = "right",
    bold = false,
    size = 16,
    color = "#1E1E1E",
    bg = null,
    rightBorder = true
  } = options;

  let col = Column(
    Text(String(content))
      .font(bold ? "VazirmatnBold" : "Vazirmatn")
      .size(size)
      .color(color)
      .align(align)
      .lineHeight(1.3)
  )
    .width(width)
    .padding(10, 10, 10, 10)
    .justifyContent("center");

  if (bg) col = col.bg(bg);
  if (rightBorder) {
    col = col.borderWidth(0, 1, 0, 0).borderColor("#DCD9CC");
  }
  return col;
}

function buildRaceCardDocument(payload) {
  const eventTitle = payload.eventTitle || "مسابقات اسبدوانی";
  const roundNumber = payload.roundNumber || "1";
  const time = payload.time || "";
  const title = payload.title || "کورس رسمی";
  const distance = payload.distance || "";
  const horses = Array.isArray(payload.horses) ? payload.horses.slice(0, 24) : [];
  const brand = payload.brand || "ربات هوشمند کورس اسبدوانی";

  const headerRight = `دور ${roundNumber}${time ? `  |  ساعت ${time}` : ""}`;
  const headerLeft = clip(eventTitle, 44);
  const subParts = [title, distance, `تعداد اسب: ${horses.length}`].filter(Boolean).join("   •   ");

  const headerBar = Row(
    Text(headerLeft)
      .font("Vazirmatn")
      .size(16)
      .color("#FFF9E6")
      .align("left")
      .flex(1),
    Text(headerRight)
      .font("VazirmatnBold")
      .size(22)
      .color("#FFFFFF")
      .align("right")
  )
    .bg("#9C8534")
    .padding(14, 18, 14, 18)
    .alignItems("center")
    .justifyContent("space-between");

  const subBar = Row(
    Text(clip(subParts, 90))
      .font("VazirmatnBold")
      .size(15)
      .color("#4A3F16")
      .align("right")
      .flex(1)
  )
    .bg("#F6F3E4")
    .padding(9, 18, 9, 18)
    .borderWidth(0, 0, 1, 0)
    .borderColor("#D6D0B8");

  // چینش از چپ به راست طوری که در فارسی راست‌به‌چپ از راست به چپ خوانده شود:
  // شماره (#) | نام اسب | چابکسوار | مالک | مربی | دپار
  const colHeaderRow = Row(
    makeCell("دپار", 76, { align: "center", bold: true, size: 15, color: "#3A3114" }),
    makeCell("مربی", 230, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("مالک", 265, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("چابکسوار", 215, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("نام اسب", 304, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("#", 70, { align: "center", bold: true, size: 15, color: "#3A3114", rightBorder: false })
  )
    .bg("#EAE6D4")
    .borderWidth(0, 0, 1, 0)
    .borderColor("#C9C3AB");

  const dataRows = horses.map((h, idx) => {
    const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F3F2EE";
    const numStr = h.number || String(idx + 1);
    const gateStr = h.gate || "—";
    return Row(
      makeCell(clip(gateStr, 8), 76, { align: "center", size: 15, color: "#333333" }),
      makeCell(clip(h.trainer, 26), 230, { align: "right", size: 15, color: "#262626" }),
      makeCell(clip(h.owner, 30), 265, { align: "right", size: 15, color: "#262626" }),
      makeCell(clip(h.jockey, 24), 215, { align: "right", bold: true, size: 15, color: "#1A3B2B" }),
      makeCell(clip(h.name, 32), 304, { align: "right", bold: true, size: 16, color: "#111111" }),
      makeCell(clip(numStr, 5), 70, { align: "center", bold: true, size: 16, color: "#6E5A16", rightBorder: false })
    )
      .bg(rowBg)
      .borderWidth(0, 0, 1, 0)
      .borderColor("#DFDDD3");
  });

  const footerBar = Row(
    Text(payload.footerNote || "برنامه رسمی مسابقات")
      .font("Vazirmatn")
      .size(13)
      .color("#6E6545")
      .align("left")
      .flex(1),
    Text(brand)
      .font("VazirmatnBold")
      .size(14)
      .color("#6E5A16")
      .align("right")
  )
    .bg("#F6F3E4")
    .padding(9, 18, 9, 18)
    .alignItems("center");

  return Column(headerBar, subBar, colHeaderRow, ...dataRows, footerBar)
    .width(1160)
    .bg("#FFFFFF")
    .borderWidth(1)
    .borderColor("#C4BE9F");
}

export default async function handler(req, res) {
  try {
    await ensureFonts();

    if (req.method === "GET") {
      if (req.query?.sample === "1") {
        const sampleDoc = buildRaceCardDocument({
          eventTitle: "ترکیه — پیست استانبول",
          roundNumber: 7,
          time: "21:00",
          title: "مسابقه ۲ ساله‌ها — چمن",
          distance: "1400 متر سنتتیک",
          brand: "کانال تخصصی اسبدوانی",
          horses: [
            { number: "1", gate: "8", name: "AKALA", jockey: "G.ÖZÇELİK", owner: "H.TURGUT ALAKUŞ", trainer: "T.ŞİT" },
            { number: "2", gate: "5", name: "AMO ALLER AMOS", jockey: "E.AKTUĞ", owner: "YAKUP YILDIRIM", trainer: "S.GÜNAYDIN" },
            { number: "3", gate: "3", name: "JOHNNY BLAZE", jockey: "U.LEVENT", owner: "HANDE KARACA", trainer: "E.KARACA" },
            { number: "4", gate: "7", name: "کادیلاک کلاته", jockey: "سهراب دهش", owner: "مهدی برومند", trainer: "عبدالباسط مخدومی" }
          ]
        });
        const png = await sone(sampleDoc).png();
        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(png);
      }
      return res.status(200).json({ ok: true, service: "Race Card Image Renderer" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (process.env.RENDER_SECRET && req.headers["x-render-secret"] !== process.env.RENDER_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const doc = buildRaceCardDocument(body || {});
    const pngBuffer = await sone(doc).png();

    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error("Render error:", err);
    return res.status(500).json({ error: err.message || "Render failed" });
  }
    }
