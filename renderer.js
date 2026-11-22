import { Column, Font, Row, Text, sone } from "sone";

let fontsLoaded = false;

async function ensureFonts() {
  if (fontsLoaded && Font.has("Vazirmatn") && Font.has("VazirmatnBold")) return;
  const regUrl = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf";
  const boldUrl = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf";

  const [regRes, boldRes] = await Promise.all([fetch(regUrl), fetch(boldUrl)]);
  if (!regRes.ok || !boldRes.ok) throw new Error("Font download failed");

  const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
  if (!Font.has("Vazirmatn")) await Font.load("Vazirmatn", regBuf);
  if (!Font.has("VazirmatnBold")) await Font.load("VazirmatnBold", boldBuf);
  fontsLoaded = true;
}

function clip(val, max = 32) {
  const s = String(val || "—").trim() || "—";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function extractAgfPercent(agfStr) {
  const m = /(\d+(?:\.\d+)?)/.exec(String(agfStr || ""));
  return m ? parseFloat(m[1]) : 0;
}

function makeCell(content, width, options = {}) {
  const { align = "right", bold = false, size = 15, color = "#1E1E1E", rightBorder = true } = options;
  let col = Column(
    Text(String(content))
      .font(bold ? "VazirmatnBold" : "Vazirmatn")
      .size(size)
      .color(color)
      .align(align)
      .lineHeight(1.3)
  )
    .width(width)
    .padding(10, 8, 10, 8)
    .justifyContent("center");

  if (rightBorder) col = col.borderWidth(0, 1, 0, 0).borderColor("#DCD9CC");
  return col;
}

export async function renderRacePng(payload = {}) {
  await ensureFonts();

  const eventTitle = payload.eventTitle || "مسابقات اسبدوانی";
  const roundNumber = payload.roundNumber || "1";
  const time = payload.time || "";
  const title = payload.title || "کورس رسمی";
  const distance = payload.distance || "";
  const horses = Array.isArray(payload.horses) ? payload.horses.slice(0, 24) : [];
  const brand = payload.brand || "ربات هوشمند کورس اسبدوانی";

  const maxAgf = horses.reduce((mx, h) => Math.max(mx, extractAgfPercent(h.agf)), 0);
  const headerRight = `دور ${roundNumber}${time ? `  |  ساعت ${time}` : ""}`;
  const headerLeft = clip(eventTitle, 44);
  const subParts = [title, distance, `تعداد اسب: ${horses.length}`].filter(Boolean).join("   •   ");

  const headerBar = Row(
    Text(headerLeft).font("Vazirmatn").size(16).color("#FFF9E6").align("left").flex(1),
    Text(headerRight).font("VazirmatnBold").size(22).color("#FFFFFF").align("right")
  )
    .bg("#9C8534")
    .padding(14, 18, 14, 18)
    .alignItems("center")
    .justifyContent("space-between");

  const subBar = Row(
    Text(clip(subParts, 90)).font("VazirmatnBold").size(15).color("#4A3F16").align("right").flex(1)
  )
    .bg("#F6F3E4")
    .padding(9, 18, 9, 18)
    .borderWidth(0, 0, 1, 0)
    .borderColor("#D6D0B8");

  const colHeaderRow = Row(
    makeCell("AGF", 100, { align: "center", bold: true, size: 15, color: "#3A3114" }),
    makeCell("دپار", 64, { align: "center", bold: true, size: 15, color: "#3A3114" }),
    makeCell("مربی", 210, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("مالک", 240, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("چابکسوار", 200, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("نام اسب", 286, { align: "right", bold: true, size: 15, color: "#3A3114" }),
    makeCell("#", 60, { align: "center", bold: true, size: 15, color: "#3A3114", rightBorder: false })
  )
    .bg("#EAE6D4")
    .borderWidth(0, 0, 1, 0)
    .borderColor("#C9C3AB");

  const dataRows = horses.map((h, idx) => {
    const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F3F2EE";
    const numStr = h.number || String(idx + 1);
    const gateStr = h.gate || "—";
    const agfStr = String(h.agf || "—").trim() || "—";
    const agfVal = extractAgfPercent(agfStr);
    const isTopFav = agfStr.includes("(1)") || (maxAgf > 0 && agfVal === maxAgf);
    const agfColor = isTopFav ? "#157A3C" : agfVal >= 15 ? "#2B6B46" : "#444444";

    return Row(
      makeCell(clip(agfStr, 12), 100, { align: "center", bold: isTopFav || agfVal >= 15, size: 15, color: agfColor }),
      makeCell(clip(gateStr, 6), 64, { align: "center", size: 15, color: "#333333" }),
      makeCell(clip(h.trainer, 24), 210, { align: "right", size: 15, color: "#262626" }),
      makeCell(clip(h.owner, 28), 240, { align: "right", size: 15, color: "#262626" }),
      makeCell(clip(h.jockey, 22), 200, { align: "right", bold: true, size: 15, color: "#1A3B2B" }),
      makeCell(clip(h.name, 30), 286, { align: "right", bold: true, size: 16, color: "#111111" }),
      makeCell(clip(numStr, 5), 60, { align: "center", bold: true, size: 16, color: "#6E5A16", rightBorder: false })
    )
      .bg(rowBg)
      .borderWidth(0, 0, 1, 0)
      .borderColor("#DFDDD3");
  });

  const footerBar = Row(
    Text(payload.footerNote || "برنامه رسمی و درصد آرای AGF").font("Vazirmatn").size(13).color("#6E6545").align("left").flex(1),
    Text(brand).font("VazirmatnBold").size(14).color("#6E5A16").align("right")
  )
    .bg("#F6F3E4")
    .padding(9, 18, 9, 18)
    .alignItems("center");

  const doc = Column(headerBar, subBar, colHeaderRow, ...dataRows, footerBar)
    .width(1160)
    .bg("#FFFFFF")
    .borderWidth(1)
    .borderColor("#C4BE9F");

  return sone(doc).png();
    }
